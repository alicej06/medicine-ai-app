from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from src.schemas.explain import ExplainRequest, ExplainResponse, Citation
from src.services.retrieval.retrieve import retrieve_with_citations
from src.services.llm.explainer import explain_with_llm
from src.core.cache import get_cached, set_cached
from src.core.config import settings

router = APIRouter(prefix="/explain", tags=["Explain"])

@router.post("", response_model=ExplainResponse)
def explain(payload: ExplainRequest):
    try:
        drug_id = (payload.drugId or "").strip()
        if not drug_id:
            raise HTTPException(status_code=400, detail="drugId is required")
        q = (payload.question or "").strip()

        cache_key = (
            f"explain:v3:{settings.llm_provider}:"
            f"{(settings.gemini_model if settings.llm_provider=='gemini' else settings.hf_model)}:"
            f"{drug_id}:{q or '_'}"
        )
        cached = get_cached(cache_key)
        if cached:
            return cached

        retrieval_query = q if q else f"key facts and warnings about {drug_id}"
        try:
            retrieved = retrieve_with_citations(retrieval_query, k=4)
            citations = retrieved.get("citations", [])
        except SQLAlchemyError as e:
            # Database down or misconfigured: return JSON error, not a 500 text
            resp = ExplainResponse(
                drugId=drug_id,
                question=q or None,
                summary=[
                    "Our database isn’t reachable or the table is missing.",
                    "Please ensure Postgres is running and chunks are loaded."
                ],
                citations=[],
            ).model_dump()
            set_cached(cache_key, resp)
            return JSONResponse(resp, status_code=200)

        if not citations:
            resp = ExplainResponse(
                drugId=drug_id,
                question=q or None,
                summary=[f"No context available for '{drug_id}'. Try loading chunks first."],
                citations=[],
            ).model_dump()
            set_cached(cache_key, resp)
            return resp

        llm = explain_with_llm(drug_id, q, citations)
        keep = citations
        if llm.get("used_ids"):
            idx = {c["id"]: c for c in citations}
            sel = [idx[i] for i in llm["used_ids"] if i in idx]
            if sel:
                keep = sel

        resp = ExplainResponse(
            drugId=drug_id,
            question=q or None,
            summary=(llm.get("bullets") or [f"{drug_id}: explanation unavailable from current context."]),
            citations=[Citation(**c) for c in keep],
        ).model_dump()
        set_cached(cache_key, resp)
        return resp

    except HTTPException:
        raise
    except Exception as e:
        # LAST RESORT: always JSON
        return JSONResponse(
            {
                "drugId": payload.drugId if payload else None,
                "question": getattr(payload, "question", None),
                "summary": [f"Internal error: {str(e)}"],
                "citations": [],
                "disclaimer": "Educational use only. Not medical advice."
            },
            status_code=500
        )

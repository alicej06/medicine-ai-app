from fastapi import APIRouter, HTTPException
from ..schemas.explain import ExplainRequest, ExplainResponse, Citation
from ..services.retrieval.retrieve import retrieve_with_citations
from ..services.llm.explainer import explain_with_llm
from ..core.cache import get_cached, set_cached

router = APIRouter(prefix="/explain", tags=["Explain"])

@router.post("", response_model=ExplainResponse)
def explain(payload: ExplainRequest):
    drug_id = (payload.drugId or "").strip()
    if not drug_id:
        raise HTTPException(status_code=400, detail="drugId is required")
    q = (payload.question or "").strip()

    cache_key = f"explain:v2:{drug_id}:{q or '_'}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    retrieval_query = q if q else f"key facts and warnings about {drug_id}"
    retrieved = retrieve_with_citations(retrieval_query, k=4)
    citations = retrieved["citations"]
    if not citations:
        resp = ExplainResponse(
            drugId=drug_id,
            question=q or None,
            summary=[f"No context available for '{drug_id}'. Try refining your query."],
            citations=[],
        ).model_dump()
        set_cached(cache_key, resp)
        return resp

    llm = explain_with_llm(drug_id, q, citations)
    keep = citations
    if llm["used_ids"]:
        idx = {c["id"]: c for c in citations}
        sel = [idx[i] for i in llm["used_ids"] if i in idx]
        if sel: keep = sel

    resp = ExplainResponse(
        drugId=drug_id,
        question=q or None,
        summary=llm["bullets"] or [f"{drug_id}: explanation unavailable from current context."],
        citations=[Citation(**c) for c in keep],
    ).model_dump()

    set_cached(cache_key, resp)
    return resp

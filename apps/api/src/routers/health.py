from fastapi import APIRouter
from time import perf_counter
from src.core.config import settings
from src.services.llm.explainer import explain_with_llm

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def health_root():
    return {"ok": True, "provider": settings.llm_provider}

@router.get("/llm")
def health_llm():
    t0 = perf_counter()
    try:
        resp = explain_with_llm(
            "metformin",
            "key facts",
            [{"id":1,"snippet":"Metformin helps lower blood glucose.","section":"overview","rx_cui":"6809"}]
        )
        ok = bool(resp.get("bullets"))
        err = None
    except Exception as e:
        ok, err = False, str(e)
    dt = int((perf_counter() - t0) * 1000)
    model = settings.gemini_model if settings.llm_provider=="gemini" else settings.hf_model
    return {"provider": settings.llm_provider, "model": model, "ok": ok, "latency_ms": dt, "error": err}

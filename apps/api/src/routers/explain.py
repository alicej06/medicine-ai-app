from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

@router.get("/explain")
def explain(drugId: str = Query(...)):
    if not drugId:
        raise HTTPException(400, "drugId required")
    
    return {
        "drug": {"id": drugId, "genericName": "hi", "brandNames": ["hi"]},
        "summary": {
            "purpose": [{"text": "hi.", "evidenceIds": ["hi"]}],
            "howItWorks": [{"text": "hi.", "evidenceIds": ["hi"]}],
            "doNotUseIf": [{"text": "hi", "evidenceIds": ["hi"]}],
            "keyWarnings": [{"text": "hi", "evidenceIds": ["hi"]}],
            "sideEffectsCommon": [{"text": "hi.", "evidenceIds": ["hi"]}],
            "tips": [{"text": "hi.", "evidenceIds": ["hi"]}],
        },
        "citations": [
            {"id": "hi", "source": "hi", "section": "Uses", "snippet": "..."},
            {"id": "hi", "source": "hi", "section": "Warnings", "snippet": "..."},
        ],
        "disclaimer": "Educational use only. Not medical advice.",
    }

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from ..db.base import get_db
from ..db.models import InteractionRule


router = APIRouter()

class DrugIn(BaseModel):
    id: str
    name: Optional[str] = None

class InteractionsIn(BaseModel):
    drugs: List[DrugIn]

@router.post("/interactions")
def interactions(payload: InteractionsIn, db: Session = Depends(get_db)):
    if len(payload.drugs) < 2:
        return {"error": "Need at least 2 drugs"}
    
    rx_ids = [d.id.replace("rxn:", "").strip() for d in payload.drugs]

    rule = (db.query(InteractionRule).filter(InteractionRule.a_rx_cui.in_(rx_ids),
                                             InteractionRule.b_rx_cui.in_(rx_ids)).first())
    if rule:
        # found a db backed rule, return it to frontend
        return {
            "normalized": [{"id": f"rxn:{i}"} for i in rx_ids],
            "interactions": [
                {
                    "pair": [{"id": f"rxn:{rule.a_rx_cui}"}, {"id": f"rxn:{rule.b_rx_cui}"}],
                    "severity": rule.severity,
                    "mechanism": rule.mechanism,
                    "guidance": rule.guidance,
                    "confidence": {"score": 0.7, "rationale": "seed rule"},
                    "evidenceIds": rule.evidence_ids or [],
                }
            ],
            "citations": [{"id": "d1", "source": "DailyMed", "section": "Drug Interactions", "snippet": "..."}],
            "disclaimer": "Educational use only. Not medical advice.",
        }
    # no db rule found, return mock response
    return {
        "normalized": [{"id": f"rxn:{i}"} for i in rx_ids],
        "interactions": [
            {
                "pair": [{"id": "rxn:5640", "name": "ibuprofen"}, {"id": "rxn:1191", "name": "aspirin"}],
                "severity": "moderate",
                "mechanism": "Ibuprofen may reduce aspirin’s antiplatelet effect.",
                "guidance": "Avoid routine co-use; separate dosing if needed.",
                "confidence": {"score": 0.5, "rationale": "mock fallback"},
                "evidenceIds": ["d1", "d2"],
            }
        ],
        "citations": [{"id": "d1", "source": "DailyMed", "section": "Drug Interactions", "snippet": "..."}],
        "disclaimer": "Educational use only. Not medical advice.",
    }

@router.get("/interactions/{rx_cui}")
def get_interactions_for_drug(rx_cui: str, db: Session = Depends(get_db)):
    """
    Return all interaction rules where this drug is the 'source' (a_rx_cui).
    Used by your Next.js interactions page.
    """
    rules = (
        db.query(InteractionRule)
        .filter(InteractionRule.a_rx_cui == rx_cui)
        .all()
    )

    # FastAPI will JSON-encode whatever we return.
    return [
        {
            "id": r.id,
            "a_rx_cui": r.a_rx_cui,
            "b_rx_cui": r.b_rx_cui,
            "severity": r.severity,
            "mechanism": r.mechanism,
            "guidance": r.guidance,
        }
        for r in rules
    ]
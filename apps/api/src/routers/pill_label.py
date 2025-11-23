# apps/api/src/routers/pill_label.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.session import get_db  # not strictly needed but consistent style
from ..schemas.pill_label import (
    PillLabelParseRequest,
    PillLabelParseResponse,
)
from ..services.llm.pill_parser import parse_pill_label_with_llm
from ..core.deps import get_current_user  # if you want this protected

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/parse-pill-label",
    response_model=PillLabelParseResponse,
)
def parse_pill_label(
    payload: PillLabelParseRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # remove if you want it public
) -> PillLabelParseResponse:
    """
    Parse OCR text from a pill bottle label into structured fields.
    """
    result = parse_pill_label_with_llm(payload.ocr_text)

    return PillLabelParseResponse(
        drugName=result.get("drug_name"),
        strength=result.get("strength"),
        rawSig=result.get("raw_sig"),
        directionsSummary=result.get("directions_summary"),
        notes=result.get("notes"),
        confidence=result.get("confidence"),
    )

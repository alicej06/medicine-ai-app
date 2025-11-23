# apps/api/src/schemas/pill_label.py

from pydantic import BaseModel, Field
from typing import Optional


class PillLabelParseRequest(BaseModel):
    ocr_text: str = Field(..., alias="ocrText")


class PillLabelParseResponse(BaseModel):
    drug_name: Optional[str] = Field(None, alias="drugName")
    strength: Optional[str] = None  # e.g. "500 mg"
    raw_sig: Optional[str] = Field(None, alias="rawSig")  # verbatim directions line
    directions_summary: Optional[str] = Field(
        None, alias="directionsSummary"
    )  # short plain-language summary
    notes: Optional[str] = None  # any extra useful info
    confidence: Optional[float] = None  # 0–1 rough confidence estimate

    class Config:
        populate_by_name = True

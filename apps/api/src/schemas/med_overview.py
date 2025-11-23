# apps/api/src/schemas/med_overview.py

from typing import List, Optional
from pydantic import BaseModel, Field

class MedOverviewCitation(BaseModel):
    id: int
    rx_cui: Optional[str] = Field(default=None, alias="rxCui")
    section: Optional[str] = None
    source_url: Optional[str] = Field(default=None, alias="sourceUrl")
    snippet: str
    used: bool = False

    class Config:
        populate_by_name = True


class MedOverviewPerDrug(BaseModel):
    medication_id: int = Field(alias="medicationId")
    name: str
    rx_cui: Optional[str] = Field(default=None, alias="rxCui")
    summary: str
    used_citation_ids: List[int] = Field(default_factory=list, alias="usedCitationIds")

    class Config:
        populate_by_name = True


class MedListOverviewResponse(BaseModel):
    overview_bullets: List[str] = Field(alias="overviewBullets")
    per_drug: List[MedOverviewPerDrug] = Field(alias="perDrug")
    citations: List[MedOverviewCitation] = Field(default_factory=list)
    used_citation_ids: List[int] = Field(default_factory=list, alias="usedCitationIds")
    disclaimer: str = "Educational use only. Not medical advice."

    class Config:
        populate_by_name = True

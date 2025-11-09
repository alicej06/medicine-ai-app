from typing import List, Optional
from pydantic import BaseModel, Field

class Citation(BaseModel):
    id: int = Field(..., description="Local 1-based index for LLM references")
    rx_cui: Optional[str] = None
    section: Optional[str] = None
    source_url: Optional[str] = None
    snippet: str
    used: bool = False

class ExplainRequest(BaseModel):
    drugId: str
    question: Optional[str] = None

class ExplainResponse(BaseModel):
    drugId: str
    question: Optional[str] = None
    summary: List[str]
    citations: List[Citation]
    usedCitationIds: List[int] = []
    disclaimer: str = "Educational use only. Not medical advice."

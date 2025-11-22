# apps/api/src/schemas/medication.py
from datetime import datetime
from pydantic import BaseModel


class UserMedicationOut(BaseModel):
    id: int
    rx_cui: str
    display_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class MedicationIntakeLogOut(BaseModel):
    id: int
    user_medication_id: int
    taken_at: datetime
    note: str | None = None

    class Config:
        from_attributes = True
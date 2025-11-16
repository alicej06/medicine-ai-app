# apps/api/src/routers/medications.py
from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, status, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..dependencies.users import get_current_user
from ..db.models import User, UserMedication, MedicationIntakeLog
from ..schemas.medication import UserMedicationOut, MedicationIntakeLogOut

router = APIRouter(prefix="/me/medications", tags=["medications"])


class AddMedicationRequest(BaseModel):
    rx_cui: str
    display_name: str

class LogIntakeRequest(BaseModel):
    taken_at: datetime | None = None  
    note: str | None = None



@router.get("", response_model=List[UserMedicationOut])
def list_my_medications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meds = (
        db.query(UserMedication)
        .filter(UserMedication.user_id == current_user.id)
        .order_by(UserMedication.created_at.desc())
        .all()
    )
    return meds


@router.post("", response_model=UserMedicationOut, status_code=status.HTTP_201_CREATED)
def add_my_medication(
    payload: AddMedicationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    med = UserMedication(
        user_id=current_user.id,
        rx_cui=payload.rx_cui,
        display_name=payload.display_name,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med

# Helper function to get a medication owned by the current user
def _get_owned_medication(
    db: Session,
    current_user: User,
    medication_id: int,
) -> UserMedication:
    med = (
        db.query(UserMedication)
        .filter(
            UserMedication.id == medication_id,
            UserMedication.user_id == current_user.id,
        )
        .first()
    )
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found for current user",
        )
    return med

# mark that a user took a medication
@router.post(
    "/{medication_id}/log",
    response_model=MedicationIntakeLogOut,
    status_code=status.HTTP_201_CREATED,
)
def log_medication_intake(
    medication_id: int,
    payload: LogIntakeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    med = _get_owned_medication(db, current_user, medication_id)

    taken_at = payload.taken_at or datetime.utcnow()

    log_entry = MedicationIntakeLog(
        user_id=current_user.id,
        user_medication_id=med.id,
        taken_at=taken_at,
        note=payload.note,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


# view medication intake logs history
@router.get(
    "/{medication_id}/log",
    response_model=List[MedicationIntakeLogOut],
)
def list_medication_logs(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    from_datetime: datetime | None = Query(
        default=None,
        description="Filter logs from this datetime (inclusive)",
    ),
    to_datetime: datetime | None = Query(
        default=None,
        description="Filter logs up to this datetime (inclusive)",
    ),
):
    med = _get_owned_medication(db, current_user, medication_id)

    query = db.query(MedicationIntakeLog).filter(
        MedicationIntakeLog.user_medication_id == med.id,
        MedicationIntakeLog.user_id == current_user.id,
    )

    if from_datetime:
        query = query.filter(MedicationIntakeLog.taken_at >= from_datetime)
    if to_datetime:
        query = query.filter(MedicationIntakeLog.taken_at <= to_datetime)

    logs = query.order_by(MedicationIntakeLog.taken_at.desc()).all()
    return logs

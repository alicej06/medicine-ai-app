# apps/api/src/api/drugs.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.db.base import get_db
from src.db.models import Drug

router = APIRouter()

@router.get("/drugs/search")
def search_drug(name: str, db: Session = Depends(get_db)):
    # simple case-insensitive search on generic_name or brand_names
    q = db.query(Drug).filter(Drug.generic_name.ilike(f"%{name}%")).first()

    if not q:
        return {"found": False}

    return {
        "found": True,
        "rx_cui": q.rx_cui,
        "generic_name": q.generic_name,
        "brand_names": q.brand_names,
    }

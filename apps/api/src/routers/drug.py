from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from ..db.base import get_db
from ..db.models import Drug

router = APIRouter()

@router.get("/drug")
def search_drug(query: str = Query(""), db: Session = Depends(get_db)):
    q = query.lower().strip()
    
    rows = (
        db.query(Drug)
        .filter(Drug.generic_name.ilike(f"%{q}%"))
        .limit(50)
        .all()
    )

    if len(rows) < 10:
        more = db.query(Drug).limit(50).all()
        for r in more:
            if r in rows:
                continue
            brands = r.brand_names or []
            if any(q in (b or "").lower() for b in brands):
                rows.append(r)
            if len(rows) >= 10:
                break
    
    return [
        {"id": f"rxn:{r.rx_cui}", "generic": r.generic_name, "brands": r.brand_names or []}
        for r in rows[:10]
    ]
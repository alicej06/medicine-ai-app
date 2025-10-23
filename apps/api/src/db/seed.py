# starter mock dataset for testing

from .base import SessionLocal
from .models import Drug, InteractionRule

SEED_DRUGS = [
    {"rx_cui": "8600", "generic_name": "metformin", "brand_names": ["Glucophage"]},
    {"rx_cui": "5640", "generic_name": "ibuprofen", "brand_names": ["Advil", "Motrin"]},
    {"rx_cui": "1191", "generic_name": "aspirin", "brand_names": ["Bayer", "Ecotrin"]},
    {"rx_cui": "161",  "generic_name": "acetaminophen", "brand_names": ["Tylenol", "Panadol"]},
    {"rx_cui": "723",  "generic_name": "amoxicillin", "brand_names": ["Amoxil"]},
]

SEED_RULES = [
    {
        "a_rx_cui": "5640",
        "b_rx_cui": "1191",
        "severity": "moderate",
        "mechanism": "Ibuprofen may reduce aspirin’s antiplatelet effect.",
        "guidance": "Avoid routine co-use; if needed, separate dosing.",
        "evidence_ids": ["d1", "d2"],
    }
]

def run():
    # open a db session, upsert seed data, commit, close session
    db = SessionLocal()
    try:
        for d in SEED_DRUGS:
            exists = db.query(Drug).filter(Drug.rx_cui == d['rx_cui']).first()
            if not exists:
                db.add(Drug(**d))
        
        for r in SEED_RULES:
            exists = (db.query(InteractionRule).filter(
                InteractionRule.a_rx_cui == r['a_rx_cui'],
                InteractionRule.b_rx_cui == r['b_rx_cui']
            ).first())
            if not exists:
                db.add(InteractionRule(**r))
        db.commit()
        print("Seed complete")
    finally:
        db.close()

if __name__ == "__main__":
    run()
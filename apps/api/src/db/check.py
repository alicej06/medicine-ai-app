# apps/api/src/db/check.py

print(">>> check.py starting up")

from src.db.session import SessionLocal
from src.db.models import Drug, LabelChunk

def run():
    session = SessionLocal()
    try:
        print("Drug count:", session.query(Drug).count())
        print("LabelChunk count:", session.query(LabelChunk).count())

        first_drugs = session.query(Drug).limit(5).all()
        print("\nSome drugs:")
        for d in first_drugs:
            print(
                "rx_cui:", d.rx_cui,
                "| generic:", d.generic_name,
                "| brands:", d.brand_names,
            )

        first_chunks = session.query(LabelChunk).limit(5).all()
        print("\nSome label chunks:")
        for c in first_chunks:
            print(
                "rx_cui:", c.rx_cui,
                "| section:", c.section,
                "| text snippet:", c.chunk_text[:80].replace("\n", " ") + "..."
            )
    finally:
        session.close()

if __name__ == "__main__":
    print(">>> __main__ block running")
    run()

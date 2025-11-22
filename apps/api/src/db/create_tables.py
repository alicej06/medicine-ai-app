# apps/api/src/db/create_tables.py
from src.db.base import Base
from src.db.session import engine

def run():
    print("Creating DB tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    run()

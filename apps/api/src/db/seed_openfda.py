# apps/api/src/db/seed_openfda.py
from src.services.clients.openfda_client import OpenFDAClient
from src.services.etl.openfda_loader import OpenFDALoader


SAMPLE_DRUGS = [
    "ibuprofen",
    "amoxicillin",
    "metformin",
    "sertraline",
    "atorvastatin",
]

def run():
    client = OpenFDAClient()  # cleaner: reads env vars automatically

    loader = OpenFDALoader(client=client)
    for name in SAMPLE_DRUGS:
        q = f'openfda.generic_name:"{name}"'
        print("Ingesting", name, "with query:", q)
        r = loader.ingest_by_query(query=q, limit=10, batch=5)
        print("Result:", r)

if __name__ == "__main__":
    run()

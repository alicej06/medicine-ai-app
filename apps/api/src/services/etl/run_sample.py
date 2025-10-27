# just for testing purposes - sample text - chunk, embed, postgres, and quick search

from typing import List, Dict
from .chunk import chunk_sections
from .embed import embed_texts
from .load_to_db import insert_chunks
from ..retrieval.search import top_k

# sample text (replace with real scraped text later)
SAMPLES: List[Dict] = [
    {
        "rx_cui": "8600",  # metformin
        "section": "Indications",
        "text": (
            "Metformin is used to improve blood sugar control in adults with type 2 diabetes. "
            "It helps the body respond better to insulin and reduces glucose production in the liver. "
            "Lifestyle changes such as diet and exercise should accompany therapy."
        ),
    },
    {
        "rx_cui": "8600",
        "section": "Warnings",
        "text": (
            "Metformin may rarely cause lactic acidosis, a serious buildup of lactic acid in the blood. "
            "Risk increases with kidney problems, dehydration, or certain contrast imaging procedures. "
            "Patients should stop metformin temporarily before iodinated contrast administration."
        ),
    },
    {
        "rx_cui": "5640",  # ibuprofen
        "section": "Indications",
        "text": (
            "Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID) used to relieve pain, "
            "reduce fever, and decrease inflammation in conditions such as headache, muscle aches, and arthritis."
        ),
    },
    {
        "rx_cui": "5640",
        "section": "Warnings",
        "text": (
                "NSAIDs like ibuprofen may increase the risk of serious cardiovascular thrombotic events, "
                "including myocardial infarction and stroke. They may also cause gastrointestinal bleeding, "
                "ulceration, and perforation. Use the lowest effective dose for the shortest duration."
        ),
    },
]

def run():
    # Chunk long section texts into smaller, overlapping pieces
    chunks = chunk_sections(SAMPLES, max_chars=700, overlap=120)

    # Embed chunk_texts into 384-dim vectors (float32)
    vecs = embed_texts([c["chunk_text"] for c in chunks])

    # Insert rows into Postgres (label_chunk table)
    inserted = insert_chunks(chunks, vecs)
    print(f"Inserted {inserted} chunks.")

    # Try a semantic query to see if retrieval works
    for q in [
        "what is metformin used for?",
        "ibuprofen risks for the heart",
        "when should metformin be paused?"
    ]:
        print(f"\nQ: {q}")
        for r in top_k(q, k=3):
            print(f"- rx_cui={r['rx_cui']}  section={r['section']}\n  {r['chunk_text'][:160]}...")

if __name__ == "__main__":
    run()
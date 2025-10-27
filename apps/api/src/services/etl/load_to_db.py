# insert chunk rows + embeddings into Postgres (label_chunk table)

from typing import List, Dict
from sqlalchemy import text
from ...db.base import engine

def _vec_literal(vec) -> str:
    # convert numpy float32 array to Postgres vector literal
    return "[" + ",".join(f"{float(x):.6f}" for x in vec.tolist()) + "]"

def insert_chunks(rows: List[Dict], embeddings) ->int:
    # returns num rows inserted
    sql = text("""
        INSERT INTO label_chunk (rx_cui, section, chunk_text, emb)
        VALUES (:rx_cui, :section, :chunk_text, CAST(:emb AS vector))
    """)

    inserted = 0
    with engine.begin() as conn:
        for r, vec in zip(rows, embeddings):
            conn.execute(sql, {
                "rx_cui": r["rx_cui"],
                "section": r["section"],
                "chunk_text": r["chunk_text"],
                "emb": _vec_literal(vec),
            })
            inserted += 1

    return inserted
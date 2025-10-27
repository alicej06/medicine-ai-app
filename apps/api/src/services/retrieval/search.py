# given a nlp query, embed it, and ask postgres for top-k most similar chunks

from typing import List, Dict
from sqlalchemy import text
from ..etl.embed import embed_texts
from ...db.base import engine

def _vec_literal(vec) -> str:
    # convert numpy float32 array to Postgres vector literal
    return "[" + ",".join(f"{float(x):.6f}" for x in vec.tolist()) + "]"

def top_k(query: str, k: int = 5) -> List[Dict]:
    qvec = embed_texts([query])[0]
    qlit = _vec_literal(qvec)

    sql = text("""
        SELECT id, rx_cui, section, chunk_text
        FROM label_chunk
        ORDER BY emb <-> :qvec
        LIMIT :k
    """)

    with engine.connect() as conn:
        rows = conn.execute(sql, {"qvec": qlit, "k": k}).mappings().all()
        return [dict(r) for r in rows]


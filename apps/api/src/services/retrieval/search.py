# apps/api/src/services/retrieval/search.py

from typing import List, Dict, Iterable
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

from ..etl.embed import embed_texts
from ...db.session import get_session  # use same session as rest of app


def _vec_literal(vec: Iterable[float]) -> str:
    """
    Convert an embedding vector (NumPy array OR Python list) into a
    pgvector literal string: "[0.123456,-0.987654,...]".
    """
    if hasattr(vec, "tolist"):
        vec = vec.tolist()

    return "[" + ",".join(f"{float(x):.6f}" for x in vec) + "]"


def top_k(query: str, k: int = 5) -> List[Dict]:
    """
    Try pgvector-based similarity search on label_chunk.emb.
    If the emb column doesn't exist (or pgvector isn't set up),
    gracefully fall back to a simple non-vector query.

    Returns a list of dict rows: {id, rx_cui, section, chunk_text}
    """
    # embed_texts returns a list of embeddings; each can be list or np.array
    qvec = embed_texts([query])[0]
    qlit = _vec_literal(qvec)

    sql_vec = text("""
        SELECT id, rx_cui, section, chunk_text
        FROM label_chunk
        ORDER BY emb <-> CAST(:qvec AS vector)
        LIMIT :k
    """)

    # Fallback: no emb column, just return first k chunks
    sql_plain = text("""
        SELECT id, rx_cui, section, chunk_text
        FROM label_chunk
        ORDER BY id
        LIMIT :k
    """)

    with get_session() as s:
        try:
            rows = s.execute(sql_vec, {"qvec": qlit, "k": k}).mappings().all()
        except ProgrammingError as e:
            # Most likely: column "emb" does not exist (no vector setup yet)
            s.rollback()
            rows = s.execute(sql_plain, {"k": k}).mappings().all()

        return [dict(r) for r in rows]

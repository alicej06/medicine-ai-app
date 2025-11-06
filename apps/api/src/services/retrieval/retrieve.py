from typing import Dict, List
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from src.db.session import get_session
from src.services.etl.embed import embed_text

def _vec_literal(v: List[float]) -> str:

    return "[" + ",".join(f"{x:.6f}" for x in v) + "]"

def retrieve_with_citations(query: str, k: int = 4) -> Dict:
    q_emb = embed_text(query)          
    q_vec = _vec_literal(q_emb)          

    sql_full = text("""
        SELECT id, rx_cui, section, source_url,
            LEFT(snippet, 450) AS snippet
        FROM label_chunk
        ORDER BY emb <-> CAST(:q AS vector)
        LIMIT :k
    """)

    sql_fallback = text("""
        SELECT id, rx_cui, section,
            LEFT(snippet, 450) AS snippet
        FROM label_chunk
        ORDER BY emb <-> CAST(:q AS vector)
        LIMIT :k
    """)


    with get_session() as s:
        try:
            rows = s.execute(sql_full, {"q": q_vec, "k": k}).mappings().all()
            had_source_url = True
        except ProgrammingError:
            s.rollback()
            rows = s.execute(sql_fallback, {"q": q_vec, "k": k}).mappings().all()
            had_source_url = False

    citations: List[Dict] = []
    for i, r in enumerate(rows, start=1):
        citations.append({
            "id": i,
            "rx_cui": r.get("rx_cui"),
            "section": r.get("section"),
            "source_url": r.get("source_url") if had_source_url else None,
            "snippet": r.get("snippet") or ""
        })
    return {"citations": citations}

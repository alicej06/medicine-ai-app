# apps/api/src/services/retrieval/retrieve.py

from typing import Dict, List
from .search import top_k


def retrieve_with_citations(query: str, k: int = 4) -> Dict:
    """
    Use the same vector search as search.top_k, and adapt rows into a
    citation structure for the explainer.

    Returns:
      {
        "citations": [
          {
            "id": 1,
            "rx_cui": "...",
            "section": "...",
            "source_url": null,
            "snippet": "..."
          },
          ...
        ]
      }
    """
    rows = top_k(query, k=k)  # each row has id, rx_cui, section, chunk_text

    citations: List[Dict] = []
    for i, r in enumerate(rows, start=1):
        citations.append({
            "id": i,  # local index for LLM
            "rx_cui": r.get("rx_cui"),
            "section": r.get("section"),
            "source_url": None,                       # no column yet
            "snippet": (r.get("chunk_text") or "")[:450],
        })

    return {"citations": citations}

# take long section texts and split them into smaller, overlap friendly chunks that are good for RAG later

from typing import List, Dict

def chunk_sections(
    rows: List[Dict],
    max_chars: int = 900,
    overlap: int = 150
) -> List[Dict]:
    # input shape (rows): [{"rx_cui": str, "section": str, "text": "very long string"}, ...]
    # output shape: [{"rx_cui": str, "section": str, "chunk_text": "shorter piece"}, ...]
    # step through each section text and end at a period near the window end + keep a small overlap so adjacent chunks share context
    out: List[Dict] = []

    for r in rows:
        text = (r.get("text") or "").strip()
        if not text:
            continue
        start = 0
        n = len(text)

        while start < n:
            end = min(n, start + max_chars)
            snap = text.rfind(".", start, end)
            if snap != -1 and snap > start + 200:
                end = snap +1
            
            chunk = text[start:end].strip()
            if chunk:
                out.append({
                    "rx_cui": r["rx_cui"],
                    "section": r["section"],
                    "chunk_text": chunk
                })
            start = max(end - overlap, end)
    return out

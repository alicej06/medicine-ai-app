# apps/api/src/services/etl/chunk.py
# Take long section texts and split them into overlap-friendly chunks for RAG.

from __future__ import annotations
from typing import List, Dict, Iterable
import re
import hashlib

_ABBREV = r"(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Fig|Eq|Ref|No|Inc|Ltd|Co|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)"
_SENT_BOUND = re.compile(
    rf"""
    # sentence enders: ., ?, !
    (?P<ender>[\.\?\!])
    # not an abbreviation like 'Dr.' or 'mg.' (lowercase unit) or a one/two-letter capital acronym
    (?<!\b{_ABBREV})
    (?<!\b[A-Z]\.)
    (?<!\b[A-Z][a-z]?\.)
    # not a decimal number like 2.5
    (?<!\d)\.(?!\d)
    """,
    re.VERBOSE,
)

_WS = re.compile(r"\s+")
_SQBRacketCite = re.compile(r"\s*\[\d+\]\s*")  

def _normalize(text: str) -> str:
    text = text.replace("\u00A0", " ") 
    text = _SQBRacketCite.sub(" ", text)
    text = _WS.sub(" ", text).strip()
    return text

def _split_sentences(text: str) -> List[str]:
    text = _normalize(text)
    if not text:
        return []
    parts: List[str] = []
    last = 0
    for m in _SENT_BOUND.finditer(text):
        end = m.end()
        while end < len(text) and text[end] in ['"', "'", ")", "]"]:
            end += 1
        parts.append(text[last:end].strip())
        last = end
    if last < len(text):
        tail = text[last:].strip()
        if tail:
            parts.append(tail)
    return parts

def _approx_tokens(s: str) -> int:
    n_words = len(s.split())
    return int(n_words * 0.8)

def _hash(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()  

def chunk_sections(
    rows: List[Dict],
    max_tokens: int = 280,  
    min_tokens: int = 90,   
    overlap_sentences: int = 2,
    prefer_chars: bool = False,
    max_chars: int = 900,   
) -> List[Dict]:
    """
    Input rows: [{"rx_cui": str, "section": str, "text": str}, ...]
    Output rows: [{"rx_cui": str, "section": str, "chunk_text": str}, ...]

    Strategy:
      - Split into sentences, pack sentences into chunks respecting max_tokens
      - Keep sentence-level overlap (overlap_sentences)
      - Merge small leftovers with previous chunk
      - Optional char-based window if prefer_chars=True
    """
    out: List[Dict] = []

    for r in rows:
        text = (r.get("text") or "").strip()
        if not text:
            continue
        rx = r.get("rx_cui")
        section = r.get("section")

        if prefer_chars:
            n = len(text)
            start = 0
            while start < n:
                end = min(n, start + max_chars)
                window = text[start:end]
                snap = max(window.rfind("."), window.rfind("?"), window.rfind("!"))
                if snap != -1 and snap > len(window) * 0.5:
                    end = start + snap + 1
                chunk = _normalize(text[start:end])
                if chunk:
                    out.append({"rx_cui": rx, "section": section, "chunk_text": chunk})
                ov = max(120, int(0.15 * max_chars))
                start = max(end - ov, end)
            continue

        sents = _split_sentences(text)
        i = 0
        while i < len(sents):
            tokens = 0
            buf: List[str] = []
            j = i
            while j < len(sents):
                t = _approx_tokens(sents[j])
                if buf and tokens + t > max_tokens:
                    break
                buf.append(sents[j])
                tokens += t
                j += 1

            if tokens < min_tokens and j < len(sents):
                t = _approx_tokens(sents[j])
                if tokens + t <= max_tokens * 1.15:  
                    tokens += t
                    j += 1

            chunk_text = _normalize(" ".join(buf))
            if chunk_text:
                out.append({"rx_cui": rx, "section": section, "chunk_text": chunk_text})

            if j >= len(sents):
                break
            i = max(j - overlap_sentences, j)

    seen = set()
    deduped: List[Dict] = []
    for c in out:
        h = _hash(c["chunk_text"])
        if h in seen:
            continue
        seen.add(h)
        deduped.append(c)
    return deduped

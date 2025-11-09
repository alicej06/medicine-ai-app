
from __future__ import annotations
import argparse
import json
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from dataclasses import dataclass

from sqlalchemy import text

from src.db.session import get_session
from src.services.etl.embed import embed_text

try:
    from src.services.etl.chunk import chunk_sections  # sentence-based chunking
    HAVE_CHUNKER = True
except Exception:
    HAVE_CHUNKER = False


@dataclass
class ChunkMeta:
    rx_cui: Optional[str] = None
    section: Optional[str] = None
    source_url: Optional[str] = None

def _dedupe_by_text(rows: Iterable[Dict]) -> List[Dict]:
    import hashlib
    seen = set()
    out: List[Dict] = []
    for r in rows:
        key = hashlib.sha1((r.get("snippet") or "").encode("utf-8")).hexdigest()
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


def insert_chunk(snippet: str, meta: ChunkMeta) -> None:
    emb = embed_text(snippet)  
    sql = text("""
        INSERT INTO label_chunk (rx_cui, section, source_url, snippet, emb)
        VALUES (:rx, :sec, :url, :snip, :emb)
    """)
    with get_session() as s:
        s.execute(sql, {"rx": meta.rx_cui, "sec": meta.section, "url": meta.source_url, "snip": snippet, "emb": emb})
        s.commit()

def bulk_insert(chunks: Iterable[Dict], dedup: bool = True) -> int:
    """
    chunks: iterable of dicts with keys:
      snippet (str, required), rx_cui (opt), section (opt), source_url (opt)
    """
    batch = list(chunks)
    if dedup:
        batch = _dedupe_by_text(batch)
    if not batch:
        return 0

    with get_session() as s:
        for c in batch:
            emb = embed_text(c["snippet"])
            s.execute(
                text("""INSERT INTO label_chunk (rx_cui, section, source_url, snippet, emb)
                        VALUES (:rx, :sec, :url, :snip, :emb)"""),
                {
                    "rx": c.get("rx_cui"),
                    "sec": c.get("section"),
                    "url": c.get("source_url"),
                    "snip": c["snippet"],
                    "emb": emb,
                }
            )
        s.commit()
    return len(batch)

def ensure_ivfflat_index(lists: int = 100) -> None:
    lists_val = int(lists)
    sql = text(f"""
        CREATE INDEX IF NOT EXISTS label_chunk_emb_idx
        ON label_chunk USING ivfflat (emb vector_l2_ops) WITH (lists = {lists_val})
    """)
    with get_session() as s:
        s.execute(sql)
        s.commit()


def chunks_from_text(raw_text: str, meta: ChunkMeta,
                     prefer_chars: bool, max_tokens: int, overlap_sentences: int, max_chars: int) -> List[Dict]:
    """
    Produce [{"snippet": "...", "rx_cui": ..., "section": ..., "source_url": ...}, ...]
    from a long raw string using sentence-based or char-based chunking.
    """
    if HAVE_CHUNKER:
        rows = [{"rx_cui": meta.rx_cui, "section": meta.section, "text": raw_text}]
        parts = chunk_sections(
            rows,
            max_tokens=max_tokens,
            overlap_sentences=overlap_sentences,
            prefer_chars=prefer_chars,
            max_chars=max_chars,
        )
        return [{"snippet": p["chunk_text"], "rx_cui": p["rx_cui"], "section": p["section"], "source_url": meta.source_url}
                for p in parts]
    # Fallback: naive fixed windows (not recommended)
    CH = max_chars
    s = " ".join((raw_text or "").split())
    out: List[Dict] = []
    start = 0
    while start < len(s):
        end = min(len(s), start + CH)
        window = s[start:end]
        snap = max(window.rfind("."), window.rfind("?"), window.rfind("!"))
        if snap != -1 and snap > len(window) * 0.5:
            end = start + snap + 1
        chunk = s[start:end].strip()
        if chunk:
            out.append({"snippet": chunk, "rx_cui": meta.rx_cui, "section": meta.section, "source_url": meta.source_url})
        ov = max(120, int(0.15 * CH))
        start = max(end - ov, end)
    return out

def chunks_from_json_rows(rows: List[Dict], prefer_chars: bool, max_tokens: int, overlap_sentences: int, max_chars: int) -> List[Dict]:
    """
    Accepts rows like:
      { "rx_cui": "6809", "section": "overview", "text": "long...", "source_url": "..." }
    or:
      { "rx_cui": "6809", "section": "safety",  "snippet": "short already", "source_url": "..." }
    """
    out: List[Dict] = []
    to_chunk: List[Dict] = []
    for r in rows:
        rx = r.get("rx_cui")
        sec = r.get("section")
        url = r.get("source_url")
        if r.get("snippet"):
            out.append({"snippet": r["snippet"], "rx_cui": rx, "section": sec, "source_url": url})
        elif r.get("text"):
            to_chunk.append({"rx_cui": rx, "section": sec, "text": r["text"], "source_url": url})

    if to_chunk:
        if HAVE_CHUNKER:
            parts = chunk_sections(
                [{"rx_cui": x["rx_cui"], "section": x["section"], "text": x["text"]} for x in to_chunk],
                max_tokens=max_tokens,
                overlap_sentences=overlap_sentences,
                prefer_chars=prefer_chars,
                max_chars=max_chars,
            )
            out.extend([{"snippet": p["chunk_text"], "rx_cui": p["rx_cui"], "section": p["section"],
                         "source_url": next((x["source_url"] for x in to_chunk if x["rx_cui"] == p["rx_cui"] and x["section"] == p["section"]), None)}
                        for p in parts])
        else:
            # crude fallback: chunk each text independently
            for x in to_chunk:
                meta = ChunkMeta(rx_cui=x["rx_cui"], section=x["section"], source_url=x["source_url"])
                out.extend(chunks_from_text(x["text"], meta, prefer_chars, max_tokens, overlap_sentences, max_chars))
    return out

# ---------- CLI ----------

def _load_jsonl(path: Path) -> List[Dict]:
    rows: List[Dict] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows

def _load_json(path: Path) -> List[Dict]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
        assert isinstance(data, list), "JSON must be an array of row objects"
        return data  # type: ignore[return-value]

def main():
    p = argparse.ArgumentParser(description="Load chunks + embeddings into Postgres (label_chunk).")
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--demo", action="store_true", help="Insert two demo metformin chunks")
    src.add_argument("--text-file", type=Path, help="Path to a plain text file to chunk and load")
    src.add_argument("--jsonl", type=Path, help="Path to a JSONL/NDJSON file of rows")
    src.add_argument("--json", type=Path, help="Path to a JSON array file of rows")

    p.add_argument("--rx-cui", dest="rx_cui", type=str, help="RxCUI for --text-file mode")
    p.add_argument("--section", type=str, help="Section name for --text-file mode")
    p.add_argument("--source-url", dest="source_url", type=str, help="Source URL for --text-file mode")

    p.add_argument("--prefer-chars", action="store_true", help="Use char-based windows instead of sentence-based chunking")
    p.add_argument("--max-tokens", type=int, default=280, help="Approx tokens per chunk for sentence-based splitting")
    p.add_argument("--overlap-sentences", type=int, default=2, help="Sentence overlap between chunks")
    p.add_argument("--max-chars", type=int, default=900, help="Max chars per chunk when --prefer-chars")

    p.add_argument("--dedup", dest="dedup", action="store_true", default=True, help="Enable deduplication (default)")
    p.add_argument("--no-dedup", dest="dedup", action="store_false", help="Disable deduplication")
    p.add_argument("--ensure-index", action="store_true", help="Create IVFFlat index on emb if missing")

    args = p.parse_args()

    if args.ensure_index:
        ensure_ivfflat_index()

    total_inserted = 0

    if args.demo:
        rows = [
            {
                "snippet": "Metformin is an oral medication for type 2 diabetes. It lowers blood glucose by reducing hepatic glucose production and improving insulin sensitivity.",
                "rx_cui": "6809",
                "section": "overview",
                "source_url": "https://example.org/metformin"
            },
            {
                "snippet": "Common side effects include gastrointestinal upset (nausea, diarrhea). Rare risk: lactic acidosis; avoid in severe renal impairment.",
                "rx_cui": "6809",
                "section": "safety",
                "source_url": "https://example.org/metformin-safety"
            }
        ]
        total_inserted = bulk_insert(rows, dedup=args.dedup)

    elif args.text_file:
        assert args.rx_cui and args.section, "--rx-cui and --section required with --text-file"
        raw = args.text_file.read_text(encoding="utf-8")
        meta = ChunkMeta(rx_cui=args.rx_cui, section=args.section, source_url=args.source_url)
        rows = chunks_from_text(
            raw, meta,
            prefer_chars=args.prefer_chars,
            max_tokens=args.max_tokens,
            overlap_sentences=args.overlap_sentences,
            max_chars=args.max_chars,
        )
        total_inserted = bulk_insert(rows, dedup=args.dedup)

    elif args.jsonl:
        rows_in = _load_jsonl(args.jsonl)
        rows = chunks_from_json_rows(
            rows_in,
            prefer_chars=args.prefer_chars,
            max_tokens=args.max_tokens,
            overlap_sentences=args.overlap_sentences,
            max_chars=args.max_chars,
        )
        total_inserted = bulk_insert(rows, dedup=args.dedup)

    elif args.json:
        rows_in = _load_json(args.json)
        rows = chunks_from_json_rows(
            rows_in,
            prefer_chars=args.prefer_chars,
            max_tokens=args.max_tokens,
            overlap_sentences=args.overlap_sentences,
            max_chars=args.max_chars,
        )
        total_inserted = bulk_insert(rows, dedup=args.dedup)

    print(f"Inserted {total_inserted} chunk(s).")

if __name__ == "__main__":
    main()
# apps/api/src/services/etl/openfda_loader.py

import time, textwrap
from typing import Optional

from src.services.clients.openfda_client import OpenFDAClient
from src.db.session import SessionLocal
from src.db.models import Drug, LabelChunk


def simple_chunk_text(s: str, max_chars: int = 2000):
    if not s:
        return []
    paras = [p.strip() for p in s.split("\n\n") if p.strip()]
    chunks = []
    cur = ""
    for p in paras:
        if len(cur) + len(p) + 2 <= max_chars:
            cur = (cur + "\n\n" + p).strip() if cur else p
        else:
            chunks.append(cur)
            cur = p
    if cur:
        chunks.append(cur)
    out = []
    for c in chunks:
        if len(c) <= max_chars:
            out.append(c)
        else:
            out.extend(textwrap.wrap(c, max_chars))
    return out


def _extract_first_rxcui(openfda_block: dict) -> Optional[str]:
    if not openfda_block:
        return None
    rxcuis = openfda_block.get("rxcui") or []
    if isinstance(rxcuis, list) and rxcuis:
        return rxcuis[0]
    if isinstance(rxcuis, str):
        return rxcuis
    return None


class OpenFDALoader:
    def __init__(self, client: OpenFDAClient | None = None):
        self.client = client or OpenFDAClient()

    def ingest_by_query(self, query: str, limit=50, batch=25):
        """
        - query: openFDA search string, e.g. 'openfda.generic_name:"ibuprofen"'
        - limit: max number of label records to fetch
        """
        session = SessionLocal()
        try:
            total_labels = 0
            total_chunks = 0
            fetched = 0
            skip = 0

            # keep track of rxcuis we have already handled in this run
            seen_rx_cuis: set[str] = set()

            while fetched < limit:
                to_fetch = min(batch, 100)
                resp = self.client.search_labels(query=query, limit=to_fetch, skip=skip)
                results = resp.get("results", [])
                if not results:
                    break

                for label in results:
                    openfda_block = label.get("openfda") or {}
                    rx_cui = _extract_first_rxcui(openfda_block)
                    if not rx_cui:
                        # skip labels we can't associate to an RxCUI
                        continue

                    generic = (openfda_block.get("generic_name") or [None])[0]
                    brands = openfda_block.get("brand_name") or []

                    # --- upsert Drug but avoid duplicate inserts in this run ---
                    if rx_cui not in seen_rx_cuis:
                        # check if it already exists in DB
                        drug = session.query(Drug).filter_by(rx_cui=rx_cui).first()
                        if not drug:
                            drug = Drug(
                                rx_cui=rx_cui,
                                generic_name=generic or "",
                                brand_names=brands,
                                extra=openfda_block,
                            )
                            session.add(drug)
                        else:
                            # optional: update generic/brands/extra if you want
                            if not drug.generic_name and generic:
                                drug.generic_name = generic
                            if not drug.brand_names and brands:
                                drug.brand_names = brands
                        seen_rx_cuis.add(rx_cui)

                    # --- create LabelChunks for sections ---
                    sections = [
                        "indications_and_usage",
                        "warnings_and_cautions",
                        "boxed_warning",
                        "adverse_reactions",
                        "drug_interactions",
                        "dosage_and_administration",
                        "contraindications",
                        "description",
                    ]

                    for sec in sections:
                        sec_text = label.get(sec)
                        if isinstance(sec_text, list):
                            sec_text = "\n\n".join(sec_text)
                        if not sec_text:
                            continue

                        for chunk in simple_chunk_text(sec_text):
                            lc = LabelChunk(
                                rx_cui=rx_cui,
                                section=sec,
                                chunk_text=chunk,
                            )
                            session.add(lc)
                            total_chunks += 1

                    total_labels += 1

                session.commit()
                fetched += len(results)
                skip += len(results)
                print(f"Ingested labels so far: {fetched}, chunks total: {total_chunks}")
                time.sleep(0.2)

            return {
                "labels_processed": total_labels,
                "chunks_created": total_chunks,
            }
        finally:
            session.close()


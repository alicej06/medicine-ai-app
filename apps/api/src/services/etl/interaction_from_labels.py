# apps/api/src/services/etl/interaction_from_labels.py

import os
import json
from typing import List, Dict

from sqlalchemy.orm import Session

from src.db.session import SessionLocal
from src.db.models import LabelChunk, InteractionRule

# OPTIONAL: if you're actually using Gemini via google-generativeai
# pip install google-generativeai
try:
    import google.generativeai as genai

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        GEMINI_MODEL = genai.GenerativeModel("gemini-2.5-flash")  # or your chosen model
    else:
        GEMINI_MODEL = None
except ImportError:
    GEMINI_MODEL = None


def call_llm_to_extract_interactions(a_rx_cui: str, chunk_text: str) -> List[Dict]:
    """
    Call Gemini (or another LLM) to extract structured interactions from text.

    Returns a list of dicts like:
    [
      {
        "other_drug": "warfarin",
        "severity": "major",
        "mechanism": "...",
        "guidance": "..."
      }
    ]
    """

    # If Gemini isn't configured yet, just return empty result
    if GEMINI_MODEL is None:
        print("⚠️ GEMINI_MODEL is not configured; returning [] from call_llm_to_extract_interactions")
        return []

    prompt = f"""
You are a clinical NLP assistant. Your job is to extract structured drug-drug
interactions from FDA drug label text.

You are analyzing the label for a "source drug" identified by RxCUI: {a_rx_cui}.

From the text below, identify any other drugs that have drug-drug interactions
with the source drug. Return ONLY a JSON array with the following schema:

[
  {{
    "other_drug": "<name of the other interacting drug>",
    "severity": "<one of: minor | moderate | major | unknown>",
    "mechanism": "<short explanation of why or how they interact>",
    "guidance": "<short, practical clinical guidance (e.g., avoid, monitor, adjust dose)>"
  }}
]

Rules:
- If no interactions are present in THIS TEXT, return [].
- Only report interactions that are explicitly described in the text.
- "other_drug" MUST be a drug name that literally appears in the TEXT above.
- Do NOT infer interactions from general medical knowledge if they are not in the text.
- "other_drug" should be a simple drug name, not a full sentence.
- Be conservative; only include interactions clearly implied by the text.
- Do not add any keys beyond those specified.
- Output MUST be valid JSON. Do not wrap it in code fences.


TEXT:
{chunk_text}
"""

    # 1. Call Gemini with error handling for 500s
    try:
        response = GEMINI_MODEL.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,
            },
        )

    except Exception as e:
        # This will catch InternalServerError and similar
        print(f"❌ Gemini API error for rx_cui={a_rx_cui}: {repr(e)}")
        return []

    raw = (response.text or "").strip()

    # 2. Strip ```json ... ``` fences if present
    if raw.startswith("```"):
        # remove leading/trailing backticks
        raw_stripped = raw.strip("`").strip()
        # drop leading 'json' or 'JSON'
        if raw_stripped.lower().startswith("json"):
            raw_stripped = raw_stripped[4:].lstrip()
        raw = raw_stripped

    # 3. Try to load as-is first
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        else:
            print("⚠️ LLM returned non-list JSON, ignoring:", raw[:200])
            return []
    except json.JSONDecodeError:
        # 4. As a fallback, try to extract the JSON array between first '[' and last ']'
        start = raw.find("[")
        end = raw.rfind("]")
        if start != -1 and end != -1 and end > start:
            sliced = raw[start : end + 1]
            try:
                data = json.loads(sliced)
                if isinstance(data, list):
                    return data
                else:
                    print("⚠️ Fallback JSON was not a list, ignoring:", sliced[:200])
                    return []
            except json.JSONDecodeError:
                print("⚠️ Failed to parse JSON from LLM after fallback:", sliced[:200])
                return []
        else:
            print("⚠️ Failed to parse JSON from LLM:", raw[:200])
            return []


def extract_interactions_for_all_drugs() -> None:
    """
    Go through label_chunk rows in the 'drug_interactions' section,
    call the LLM, and insert InteractionRule rows.
    """
    session: Session = SessionLocal()
    try:
        # 1) get all rx_cui values that have any drug_interactions text
        rx_cuis = (
            session.query(LabelChunk.rx_cui)
            .filter(LabelChunk.section == "drug_interactions")
            .distinct()
            .all()
        )
        rx_cuis = [row[0] for row in rx_cuis]
        print(f"Found {len(rx_cuis)} drugs with drug_interactions text")

        for a_rx_cui in rx_cuis:
            print(f"\n=== Processing interactions for a_rx_cui={a_rx_cui} ===")

            chunks = (
                session.query(LabelChunk)
                .filter(
                    LabelChunk.rx_cui == a_rx_cui,
                    LabelChunk.section == "drug_interactions",
                )
                .all()
            )

            for chunk in chunks:
                print(f"  → Chunk id={chunk.id}, length={len(chunk.chunk_text)}")
                interactions = call_llm_to_extract_interactions(
                    a_rx_cui=a_rx_cui,
                    chunk_text=chunk.chunk_text,
                )

                if not interactions:
                    continue

                for item in interactions:
                    other = (item.get("other_drug") or "").strip()
                    if not other:
                        continue

                    # 🔒 NEW: require that the other_drug string actually appears in the text
                    # This kills a ton of hallucinations where the LLM invents a plausible drug.
                    chunk_text_lower = (chunk.chunk_text or "").lower()
                    other_lower = other.lower()

                    if other_lower not in chunk_text_lower:
                        # Optional: debug log
                        print(
                            f"Skipping hallucinated interaction: a_rx_cui={a_rx_cui}, "
                            f"other_drug='{other}' not found in chunk text"
                        )
                        continue

                    severity = (item.get("severity") or "unknown").strip()
                    mechanism = (item.get("mechanism") or "").strip()
                    guidance = (item.get("guidance") or "").strip()

                    existing = (
                        session.query(InteractionRule)
                        .filter(
                            InteractionRule.a_rx_cui == a_rx_cui,
                            InteractionRule.b_rx_cui == other,
                            InteractionRule.mechanism == mechanism,
                        )
                        .first()
                    )

                    if existing:
                        continue  # skip duplicate

                    rule = InteractionRule(
                        a_rx_cui=a_rx_cui,
                        b_rx_cui=other,
                        severity=severity,
                        mechanism=mechanism,
                        guidance=guidance,
                    )

                    session.add(rule)



                session.commit()
                print(f"    Saved {len(interactions)} interactions from chunk {chunk.id}")

    finally:
        session.close()


if __name__ == "__main__":
    extract_interactions_for_all_drugs()

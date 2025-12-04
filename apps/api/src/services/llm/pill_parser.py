# apps/api/src/services/llm/pill_parser.py

from typing import Dict, Any
import json
import logging
import os
from src.core.config import settings  
from google import generativeai as genai  
import re

logger = logging.getLogger(__name__)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # default to 2.5
HF_MODEL = os.getenv("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")

PILL_PARSE_SYSTEM = """
You are helping parse text from a prescription pill bottle or pharmacy label.
The text may be noisy OCR output. Your job is to extract structured fields.

The OCR text can include:
- Patient info (name, address)
- Pharmacy info (name, phone, address)
- Drug name and strength
- Directions (SIG), refills, warnings, dates, etc.

Your job is to identify the PRIMARY PRESCRIBED DRUG on this label and extract:
- drug_name: The generic drug name if clearly present (e.g. "metformin"), otherwise the main brand name.
- strength: Strength + unit if present, e.g. "500 mg", "10 mg/5 mL".
- raw_sig: The main line of instructions as close to the label as possible.
- directions_summary: A short plain-language summary of the instructions. DO NOT change the meaning.
- notes: Any short, helpful extra info directly from the label (e.g. "take with food", "avoid alcohol", "for blood pressure").
- confidence: A number 0.0–1.0 for how confident you are overall.

CRITICAL RULES:
- Work ONLY from the provided OCR text.
- If you are not sure about a field, set it to null.
- Do NOT invent new drugs, strengths, or instructions.
- If there appear to be multiple drugs, choose the one that looks like the MAIN dispensed medication (often in ALL CAPS near "RX" or "TAKE ONE TABLET").
- NEVER give medical advice beyond restating the label.
- NEVER suggest changes to how the patient should take the medication.

Output MUST be valid JSON with this exact schema:

{
  "drug_name": string or null,
  "strength": string or null,
  "raw_sig": string or null,
  "directions_summary": string or null,
  "notes": string or null,
  "confidence": number or null
}
"""


def _very_basic_local_parse(ocr_text: str) -> Dict[str, Any]:
    """
    Fallback parser if Gemini fails.
    Very rough heuristic:
    - Strength: first "<number> mg" or "<number> mcg" or "<number> mL"
    - Drug name: first ALLCAPS-ish word before the strength
    - raw_sig: first line containing TAKE / BY MOUTH / PO
    """
    lines = [ln.strip() for ln in ocr_text.splitlines() if ln.strip()]
    joined = " ".join(lines)

    # strength like "500 MG" or "10 mg" or "5 mL"
    strength_match = re.search(r"(\d+\s*(mg|MG|mcg|MCG|g|G|mL|ML))", joined)
    strength = strength_match.group(1) if strength_match else None

    drug_name = None
    if strength_match:
        idx = strength_match.start()
        prefix = joined[:idx]
        # Look for last ALLCAPS-ish word before strength
        caps = re.findall(r"\b[A-Z][A-Z0-9]{2,}\b", prefix)
        if caps:
            drug_name = caps[-1].title()

    # raw_sig: first line with TAKE / BY MOUTH / PO
    raw_sig = None
    for ln in lines:
        up = ln.upper()
        if "TAKE" in up or "BY MOUTH" in up or " PO " in up:
            raw_sig = ln
            break

    directions_summary = None
    if raw_sig:
        directions_summary = f"Label instructions: {raw_sig}"

    confidence = 0.4 if (drug_name or strength or raw_sig) else 0.1

    return {
        "drug_name": drug_name,
        "strength": strength,
        "raw_sig": raw_sig,
        "directions_summary": directions_summary,
        "notes": None,
        "confidence": confidence,
    }


def parse_pill_label_with_llm(ocr_text: str) -> Dict[str, Any]:
    """
    Use Gemini to parse OCR text. If anything fails, fall back to a simple heuristic parser.
    """
    try:
        genai.configure(api_key=settings.gemini_api_key or GEMINI_API_KEY)

        model = genai.GenerativeModel(
            model_name=settings.gemini_model or GEMINI_MODEL,
            system_instruction=PILL_PARSE_SYSTEM,
            generation_config={"response_mime_type": "application/json"},
        )

        user_prompt = f'''
OCR_TEXT:
"""{ocr_text}"""

TASK:
Read this OCR text and extract the fields described in the schema.
If multiple drugs appear, focus on the primary prescribed drug.
Return ONLY JSON.
'''

        response = model.generate_content(user_prompt)
        raw = response.text or "{}"
        data = json.loads(raw)

        return {
            "drug_name": data.get("drug_name"),
            "strength": data.get("strength"),
            "raw_sig": data.get("raw_sig"),
            "directions_summary": data.get("directions_summary"),
            "notes": data.get("notes"),
            "confidence": data.get("confidence"),
        }
    except Exception as e:
        logger.exception(
            "Gemini pill-label parsing failed, falling back to local heuristic: %s", e
        )
        return _very_basic_local_parse(ocr_text)
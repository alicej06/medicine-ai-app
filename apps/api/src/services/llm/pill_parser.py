# apps/api/src/services/llm/pill_parser.py

from typing import Dict, Any
import json
import logging

from ..core.config import settings  # your existing config
from google import generativeai as genai  # same as explainer

logger = logging.getLogger(__name__)

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


def parse_pill_label_with_llm(ocr_text: str) -> Dict[str, Any]:
    """
    Use Gemini to parse noisy OCR text from a pill bottle label into structured fields.
    """
    genai.configure(api_key=settings.GEMINI_API_KEY)

    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=PILL_PARSE_SYSTEM,
        generation_config={"response_mime_type": "application/json"},
    )

    user_prompt = f"""
OCR_TEXT:
\"\"\"{ocr_text}\"\"\"

TASK:
Read this OCR text and extract the fields described in the schema.
If multiple drugs appear, focus on the primary prescribed drug.
Return ONLY JSON.
"""

    try:
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
        logger.exception("Failed to parse pill label with LLM: %s", e)
        # Very safe fallback
        return {
            "drug_name": None,
            "strength": None,
            "raw_sig": None,
            "directions_summary": "We could not confidently read this label.",
            "notes": None,
            "confidence": None,
        }

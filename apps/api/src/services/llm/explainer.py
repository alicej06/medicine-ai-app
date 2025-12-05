# apps/api/src/services/llm/explainer.py
import os, json, re
from typing import List, Dict
import logging
from ..retrieval.retrieve import retrieve_with_citations
from src.core.config import settings
logger = logging.getLogger(__name__)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "") or settings.gemini_api_key
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash") or settings.gemini_model
HF_MODEL = os.getenv("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")

SYSTEM = """You are a medical explanation assistant for consumers.
Requirements:
- Explain in plain language at ~8th-grade level.
- Summarize ONLY from the provided CONTEXT; if unknown, say so.
- Output 4–6 concise bullets.
- Add a brief cautionary bullet if applicable.
- Never give medical advice or dosing instructions; use a disclaimer tone.
- No hallucinations. If evidence is weak, say "uncertain".
- Return strict JSON with keys: bullets[], used_citation_ids[].
"""

USER_TEMPLATE = """DRUG: {drug}
QUESTION: {question}

CONTEXT (citations):
{context}

INSTRUCTIONS:
- Use context verbatim for facts; do not invent.
- Refer to citations by [C{{i}}] indices (we will map them).
- Return JSON: {{"bullets": string[], "used_citation_ids": number[]}} ONLY.
"""

SYSTEM_MED_LIST = """
You are a medical explanation assistant for consumers.

Requirements:
- Explain in plain language at about an 8th-grade reading level.
- Summarize ONLY from the provided CONTEXT; if something is unknown, say so.
- Do NOT give dosing instructions, do NOT tell the user to change how they take their medication.
- Focus on what the medicines do overall, what conditions they treat, and major safety themes.
- Be concise and organized.

Output MUST be valid JSON with this structure:

{
  "overview_bullets": [
    "Overall, your medicines help with ...",
    "...",
    "..."
  ],
  "per_drug": [
    {
      "medication_id": 1,
      "name": "Lisinopril",
      "summary": "Short plain-language summary of what this drug does for the user.",
      "used_citation_ids": [1, 3]
    },
    {
      "medication_id": 2,
      "name": "Metformin",
      "summary": "...",
      "used_citation_ids": [4]
    }
  ],
  "used_citation_ids": [1, 3, 4]
}
"""

_JSON_BLOCK = re.compile(r"\{[\s\S]*\}")

def _build_context(citations: List[Dict]) -> str:
    lines = []
    for c in citations:
        snippet = (c.get("snippet") or "").replace("\n", " ").strip()
        section = c.get("section") or "unknown"
        rx = c.get("rx_cui") or "n/a"
        cid = c.get("id") or 0
        lines.append(f"[C{cid}] ({section}, rx_cui={rx}): {snippet}")
    return "\n".join(lines)

def _postprocess_json(text: str) -> Dict:
    data: Dict = {}
    if text:
        try:
            data = json.loads(text)
        except Exception:
            m = _JSON_BLOCK.search(text)
            if m:
                try:
                    data = json.loads(m.group(0))
                except Exception:
                    data = {}
    bullets = [str(b).strip() for b in (data.get("bullets") or [])][:6]
    used_raw = data.get("used_citation_ids") or data.get("usedIds") or []
    used: List[int] = []
    for i in used_raw:
        if isinstance(i, bool):
            continue
        try:
            used.append(int(i))
        except Exception:
            continue
    # dedupe preserving order
    seen = set()
    used = [u for u in used if not (u in seen or seen.add(u))]
    return {"bullets": bullets, "used_ids": used}

# ---------------- Gemini branch ----------------

_genai_models_cache: Dict[str, object] = {}

def _gemini_generate(prompt: str) -> Dict:
    if not GEMINI_API_KEY:
        return {"bullets": ["Gemini API key not configured."], "used_ids": []}

    try:
        import google.generativeai as genai
    except Exception as e:
        return {"bullets": [f"Gemini SDK not installed: {e}"], "used_ids": []}

    genai.configure(api_key=GEMINI_API_KEY)

    # Prefer 2.5 models; try your configured one first
    candidates = [
        GEMINI_MODEL,                 # from .env
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-flash-latest",
        "gemini-pro-latest",
    ]
    # remove blanks and keep order without duplicates
    seen = set()
    ordered = []
    for m in candidates:
        if m and m not in seen:
            seen.add(m)
            ordered.append(m)

    last_err = None
    tried: List[str] = []

    for model_name in ordered:
        tried.append(model_name)
        try:
            # cache model objects per name
            model = _genai_models_cache.get(model_name)
            if model is None:
                model = genai.GenerativeModel(
                    model_name,
                    generation_config={
                        "response_mime_type": "application/json",
                        "temperature": 0.2,
                        "max_output_tokens": 450,
                    },
                    system_instruction=SYSTEM,
                )
                _genai_models_cache[model_name] = model

            req = (
                # Single-part prompt is fine; JSON mode is set above
                prompt
            )
            resp = model.generate_content([req])
            text = getattr(resp, "text", "") or ""
            if not text and getattr(resp, "candidates", None):
                # try to recover text from candidates if present
                for cand in resp.candidates:
                    content = getattr(cand, "content", None)
                    parts = getattr(content, "parts", None) if content else None
                    if parts:
                        for p in parts:
                            if getattr(p, "text", None):
                                text = p.text
                                break
                        if text:
                            break
            if not text:
                # try next model
                last_err = RuntimeError("Empty response body")
                continue

            return _postprocess_json(text)

        except Exception as e:
            # try next model
            last_err = e
            continue

    msg = f"Gemini error after trying {tried}: {type(last_err).__name__}: {str(last_err)}" if last_err else \
          f"Gemini error: no usable model from candidates {ordered}"
    return {"bullets": [msg], "used_ids": []}

# ---------------- HF fallback ----------------

def _hf_generate(prompt: str) -> Dict:
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
    except Exception:
        return {
            "bullets": ["LLM provider not available. Set LLM_PROVIDER=gemini or install transformers."],
            "used_ids": [],
        }

    tok = AutoTokenizer.from_pretrained(HF_MODEL)
    model = AutoModelForCausalLM.from_pretrained(
        HF_MODEL,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
    )
    ids = tok(prompt, return_tensors="pt").to(model.device)
    out = model.generate(
        **ids, max_new_tokens=500, temperature=0.2, do_sample=False, eos_token_id=tok.eos_token_id
    )
    text = tok.decode(out[0], skip_special_tokens=True)
    m = _JSON_BLOCK.search(text)
    text = m.group(0) if m else text
    return _postprocess_json(text)

# ---------------- Public API ----------------

def explain_with_llm(drug: str, question: str, citations: List[Dict]) -> Dict:
    """
    Returns: {"bullets": List[str], "used_ids": List[int]}
    """
    ctx = _build_context(citations)
    user = USER_TEMPLATE.format(
        drug=drug,
        question=question or "key facts and warnings",
        context=ctx
    )
    prompt = (
        f"{SYSTEM}\n\n{user}\n\n"
        'Return ONLY valid JSON like: {"bullets": ["..."], "used_citation_ids": [1,2]}'
    )

    if LLM_PROVIDER == "gemini":
        return _gemini_generate(prompt)

    return _hf_generate(prompt)

def build_med_list_context(medications: List[Dict[str, any]], citations: List[Dict[str, any]]) -> str:
    """
    Build a text context block listing the user's meds and citations.

    medications: [
      {"id": 1, "name": "Lisinopril", "rx_cui": "123"},
      ...
    ]

    citations: [
      {"id": 1, "rx_cui": "...", "section": "...", "snippet": "...", "drug_name": "..."},
      ...
    ]
    """
    lines = []
    lines.append("PATIENT MEDICATION LIST:")
    for m in medications:
        lines.append(f"- [{m['id']}] {m['name']} (rx_cui={m.get('rx_cui')})")
    lines.append("")
    lines.append("CONTEXT (citations):")
    for c in citations:
        cid = c["id"]
        section = c.get("section") or "Unknown section"
        rx_cui = c.get("rx_cui")
        drug_name = c.get("drug_name") or ""
        header = f"[C{cid}] ({drug_name or rx_cui} – {section})"
        snippet = c.get("snippet") or ""
        lines.append(f"{header}: {snippet}")
    return "\n".join(lines)


def explain_med_list_with_llm(
    medications: List[Dict[str, any]],
    citations: List[Dict[str, any]],
) -> Dict[str, any]:
    """
    Call the LLM to generate an overview of the user's med list, using the
    provided list of medications and citations.

    Returns a dict matching MedListOverviewResponse (field names pre-alias):
    {
      "overview_bullets": [...],
      "per_drug": [
        {
          "medication_id": int,
          "name": str,
          "summary": str,
          "used_citation_ids": [int, ...]
        },
        ...
      ],
      "used_citation_ids": [int, ...]
    }
    """
    from google import generativeai as genai  # assuming you're already using this

    context_text = build_med_list_context(medications, citations)

    user_prompt = f"""
You are given a patient's medication list and contextual snippets from trusted drug information sources.

{context_text}

TASK:
- Provide 3–6 short bullets explaining what this combination of medicines is doing overall for the patient.
- Group medicines by what they treat (e.g., blood pressure, diabetes, cholesterol) in your wording.
- Mention major safety themes only at a high level (e.g., "may cause dizziness" or "can affect blood sugar"), without giving specific dosing instructions.
- For each individual drug, provide a 1–2 sentence summary in plain language.
- ONLY use information that is explicit or strongly implied in the context.

Remember: Output MUST be valid JSON and match the schema in the instructions.
"""

    # Configure Gemini client (same pattern as explain_with_llm)
    genai.configure(api_key=settings.gemini_api_key or GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name=settings.gemini_model or GEMINI_MODEL,
        system_instruction=SYSTEM_MED_LIST,
        generation_config={"response_mime_type": "application/json"},
    )

    try:
        response = model.generate_content(user_prompt)
        raw = response.text or "{}"
        data = json.loads(raw)

        # Basic normalization
        overview = data.get("overview_bullets") or []
        per_drug = data.get("per_drug") or []
        used_ids = data.get("used_citation_ids") or []

        return {
            "overview_bullets": overview,
            "per_drug": per_drug,
            "used_citation_ids": used_ids,
        }
    except Exception as e:
        logger.exception("Failed to generate med list overview with LLM: %s", e)
        # Fallback: simple message
        return {
            "overview_bullets": [
                "We could not generate an overview of your medications right now.",
                "Please try again later.",
            ],
            "per_drug": [],
            "used_citation_ids": [],
        }

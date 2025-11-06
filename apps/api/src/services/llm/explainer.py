import os, json, re
from typing import List, Dict

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")

SYSTEM = """You are a medical explanation assistant for consumers.
Requirements:
- Explain in plain language at ~8th-grade level.
- Summarize *only* from the provided CONTEXT; if unknown, say so.
- Output 4–6 concise bullets.
- Add short cautionary bullet if applicable.
- Never give medical advice or dosing instructions; use the disclaimer tone.
- No hallucinations. If evidence is weak, say "uncertain".
- Return strict JSON with keys: bullets[], used_citation_ids[]
"""

USER_TEMPLATE = """DRUG: {drug}
QUESTION: {question}

CONTEXT (citations):
{context}

INSTRUCTIONS:
- Use context verbatim for facts; do not invent.
- Refer to citations by [C{{i}}] indices (we will map them).
- Return JSON: {{"bullets": string[], "used_citation_ids": number[]}}
"""

def _build_context(citations: List[Dict]) -> str:
    lines = []
    for c in citations:
        snippet = (c.get("snippet") or "").replace("\n", " ").strip()
        section = c.get("section") or "unknown"
        rx = c.get("rx_cui") or "n/a"
        lines.append(f"[C{c['id']}] ({section}, rx_cui={rx}): {snippet}")
    return "\n".join(lines)

def _postprocess_json(text: str) -> Dict:
    try:
        data = json.loads(text)
    except Exception:
        m = re.search(r"\{.*\}", text, re.S)
        data = json.loads(m.group(0)) if m else {}
    bullets = (data.get("bullets") or [])[:6]
    used = [i for i in (data.get("used_citation_ids") or []) if isinstance(i, int)]
    return {"bullets": bullets, "used_ids": used}

def explain_with_llm(drug: str, question: str, citations: List[Dict]) -> Dict:
    ctx = _build_context(citations)
    user = USER_TEMPLATE.format(
        drug=drug,
        question=question or "key facts and warnings",
        context=ctx
    )

    if LLM_PROVIDER == "gemini":
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"bullets": ["Gemini API key not configured."], "used_ids": []}

        genai.configure(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

        model = genai.GenerativeModel(
            model_name,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
                "max_output_tokens": 450,
            },
            system_instruction=SYSTEM,
        )

        prompt = user + '\n\nReturn ONLY valid JSON like: {"bullets": ["..."], "used_citation_ids": [1,2]}'
        resp = model.generate_content([prompt])
        text = getattr(resp, "text", "") or ""
        return _postprocess_json(text)

    # Hugging Face fallback (offline)
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    model_id = os.getenv("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")
    tok = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
    )

    prompt = (
        f"{SYSTEM}\n\n{user}\n\n"
        'Return ONLY valid JSON like: {"bullets": ["..."], "used_citation_ids": [1,2]}'
    )
    ids = tok(prompt, return_tensors="pt").to(model.device)
    out = model.generate(
        **ids, max_new_tokens=500, temperature=0.2, do_sample=False, eos_token_id=tok.eos_token_id
    )
    text = tok.decode(out[0], skip_special_tokens=True)
    # If model echoes prompt, trim
    text = text.split('{"bullets"', 1)
    if len(text) == 2:
        text = '{"bullets' + text[1]
    else:
        text = text[0]
    return _postprocess_json(text)
"""
Enterprise RAG Module for MedGPT: Structured prompt generation + GPT-4 API inference.
"""

import json
import logging
import hashlib
from openai import AzureOpenAI
from config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION
)

# ---------------------- Logging Setup ----------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.FileHandler("logs/chatbot.log", encoding="utf-8")
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)

# ---------------------- Azure GPT-4 Client ----------------------
try:
    client = AzureOpenAI(
        api_key=AZURE_OPENAI_API_KEY,
        api_version=AZURE_OPENAI_API_VERSION,
        azure_endpoint=AZURE_OPENAI_ENDPOINT
    )
    logger.debug("[RAG] ✅ Azure OpenAI client initialized.")
except Exception:
    logger.exception("[RAG] ❌ Azure client initialization failed.")
    client = None

# ---------------------- Context Formatter ----------------------
def serialize_context(data, max_len=6000, indent=2) -> str:
    """
    Converts MongoDB data into structured, markdown-like format.
    """
    if not data:
        logger.debug("[RAG] No context data found.")
        return "⚠️ No records found in the system for the requested query."

    try:
        output = []
        if isinstance(data, dict):
            for section, val in data.items():
                output.append(f"\n### {section.upper()}")
                if isinstance(val, list):
                    for item in val:
                        formatted = json.dumps(item, indent=indent, default=str)
                        output.append(formatted)
                else:
                    output.append(json.dumps(val, indent=indent, default=str))

        elif isinstance(data, list):
            for entry in data:
                output.append(json.dumps(entry, indent=indent, default=str))

        else:
            output.append(str(data))

        full_output = "\n".join(output)
        if len(full_output) > max_len:
            logger.warning("[RAG] Context truncated due to length limit.")
            return full_output[:max_len] + "\n\n⚠️ Context truncated due to length."

        return full_output

    except Exception:
        logger.exception("[RAG] Failed to serialize context.")
        return "⚠️ Failed to prepare context for the assistant."

# ---------------------- Prompt Generator ----------------------
def build_prompt(user_query: str, context: str) -> str:
    """
    Builds structured prompt with explicit clinical instructions.
    """
    return f"""
You are MedGPT, an AI medical assistant for doctors in a hospital.
Respond clearly and concisely using **only** the data provided below.
If information is missing or incomplete, **say that explicitly**.

-----------------------
[INTERNAL MEDICAL DATA]
{context}
-----------------------

[DOCTOR'S QUESTION]
{user_query}

Instructions:
- NEVER hallucinate or assume facts.
- If no data is found, respond: "No relevant records were found for this query."
- Maintain a professional, clinical tone.
""".strip()

# ---------------------- GPT Inference ----------------------
def generate_response(user_query: str, context_data) -> str:
    """
    Runs full RAG pipeline: context → prompt → GPT → response.
    """
    try:
        logger.debug("[RAG] Serializing context for prompt...")
        context = serialize_context(context_data)
        prompt = build_prompt(user_query, context)

        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()[:10]
        logger.debug(f"[RAG] Prompt hash: {prompt_hash} | Length: {len(prompt)}")

        if not client:
            raise RuntimeError("Azure GPT client is not available.")

        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are a factual, helpful, and concise medical assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=350,
            n=1,
        )

        result = response.choices[0].message.content.strip()
        logger.debug("[RAG] ✅ Response generated. Tokens used: ~%d", len(result.split()))
        return result

    except Exception as e:
        logger.exception("[RAG] GPT-4 call failed.")
        return (
            "⚠️ A system error occurred while generating the answer. "
            "Please try again later or consult technical support."
        )

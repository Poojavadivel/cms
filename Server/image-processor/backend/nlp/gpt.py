import os
import json
import re
from typing import Dict, Any
from dotenv import load_dotenv
from openai import AzureOpenAI
from backend.utils.logger import logger

load_dotenv()

# --- Load Config ---
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")

# --- Validate Config ---
if not all([AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT, AZURE_API_VERSION]):
    logger.critical("❌ Azure OpenAI configuration is missing required variables.")
    raise EnvironmentError("Azure OpenAI configuration is incomplete.")

# --- Initialize Azure OpenAI client ---
client = AzureOpenAI(
    api_key=AZURE_API_KEY,
    api_version=AZURE_API_VERSION,
    azure_endpoint=AZURE_ENDPOINT,
)

# --- GPT System Prompt ---
SYSTEM_PROMPT = """
You are a medical data extraction assistant. You will be given OCR text from a medical document (lab report, prescription, vitals, etc).

Your task is to extract only the information present and return it as valid JSON in the following format:
{
  "cbc": { "hemoglobin": { "value": 12.5, "unit": "g/dL" }, ... },
  "lft": { ... },
  "kft": { ... },
  "lipid": { ... },
  "thyroid": { ... },
  "sugar": { ... },
  "electrolytes": { ... },
  "dialysis": { ... },
  "prescription": {
    "prescription_date": "YYYY-MM-DD",
    "medications": [ "Metformin 500mg", ... ],
    "diagnosis": "...",
    "follow_up": "YYYY-MM-DD"
  },
  "vitals": { ... },
  "metadata": {
    "patient_name": "...",
    "doctor_name": "...",
    "report_date": "YYYY-MM-DD"
  }
}

Rules:
- Return only fields visible in the OCR text.
- Do not hallucinate or guess values.
- Avoid initials
- Omit sections that are not present.
- Normalize names: strip prefixes/suffixes like Mr, Mrs, Dr, Prof, H M, etc.
  Only return core name (e.g., 'Mr Sanjit Sriram H M' → 'Sanjit Sriram').
  Also remove initials and return only the full name (e.g., 'S Ram', 'S R Ram', 'Ram S R' → 'Ram').
- Output must be valid JSON. No comments or extra explanation.

Start parsing.
""".strip()


# --- Name Normalizer ---
def normalize_name(name: str) -> str:
    try:
        name = name.strip()
        name = re.sub(r"\b(Mr|Mrs|Ms|Dr|Prof|HM|H\.M\.|Smt|Sri|Shri)\b\.?", "", name, flags=re.IGNORECASE)
        name = re.sub(r"\s+", " ", name).strip()
        return name.title()
    except Exception as e:
        logger.warning(f"Name normalization failed for '{name}': {e}")
        return name


# --- GPT Structuring Function ---
def get_gpt_structured_data(ocr_text: str) -> Dict[str, Any]:
    logger.info("📤 Sending OCR text to Azure GPT for structuring...")

    if not ocr_text.strip():
        raise ValueError("OCR text is empty. Cannot send to GPT.")

    try:
        response = client.chat.completions.create(
            model=AZURE_DEPLOYMENT,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": ocr_text.strip()},
            ],
            temperature=0.2,
            max_tokens=2048,
        )

        content = response.choices[0].message.content.strip()
        logger.debug(f"🧠 Raw GPT Response:\n{content[:1000]}")

        if not content:
            raise ValueError("Empty response received from GPT.")

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            logger.warning("🛑 GPT returned invalid JSON. Attempting fix...")
            fixed = (
                content.replace("None", "null")
                       .replace("True", "true")
                       .replace("False", "false")
                       .strip("` \n")
            )
            if fixed.lower().startswith("json"):
                fixed = fixed[4:].strip(": \n`")
            parsed = json.loads(fixed)

        # Normalize names inside metadata
        if "metadata" in parsed:
            for key in ["patient_name", "doctor_name"]:
                if key in parsed["metadata"]:
                    parsed["metadata"][key] = normalize_name(parsed["metadata"][key])

        return parsed

    except Exception as e:
        logger.exception("❌ Azure GPT processing failed.")
        raise RuntimeError("GPT returned unfixable JSON.") from e

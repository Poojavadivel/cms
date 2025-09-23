"""
Doctor Chatbot service wrapper.
Keeps original process_query logic, exposes HTTP endpoints,
and adds robust logging + health endpoints to play nicely with your pipeline.
"""

import os
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta

import dateparser
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import spacy
import subprocess

# =========================
# Paths & directories
# =========================
BASE = Path(__file__).parent
LOG_DIR = BASE / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

MODEL_DIR = BASE / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# =========================
# Logger
# =========================
logger = logging.getLogger("chatbot")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(ch)

    if os.getenv("LOG_TO_FILE", "0") == "1":
        fh = logging.FileHandler(LOG_DIR / "chatbot.log", encoding="utf-8")
        fh.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
        logger.addHandler(fh)

# =========================
# spaCy model auto-download
# =========================
def download_spacy_model(model_name: str, output_dir: Path):
    try:
        # Check if already exists
        model_path = output_dir / model_name
        if not model_path.exists():
            logger.info("Downloading spaCy model: %s", model_name)
            spacy.cli.download(model_name, output_dir=str(output_dir))
        else:
            logger.info("spaCy model %s already exists", model_name)
    except Exception as e:
        logger.exception("Failed to download spaCy model %s: %s", model_name, e)
        raise

# Download models at startup
download_spacy_model("en_core_web_sm", MODEL_DIR)
download_spacy_model("en_core_web_trf", MODEL_DIR)

# =========================
# Import local modules
# =========================
try:
    from nlp import detect_intent_and_entity
    from mongo import (
        get_patient_history,
        get_patient_dob,
        get_patient_contact,
        get_todays_appointments,
        get_appointments_on_date,
        get_all_staff,
        get_admissions_for_patient,
        get_lab_applications_for_patient,
        get_lab_items_list,
        get_diagnosis_for_admission,
        get_prescriptions_for_admission,
        get_notes_for_admission,
    )
    from rag import generate_response
except Exception as e:
    logger.exception("Failed to import local modules (nlp/mongo/rag): %s", e)
    raise

# =========================
# FastAPI app
# =========================
app = FastAPI(title="Doctor Chatbot API", version="1.0")

EXTRA_INTENTS = [
    "get_patient_dob",
    "get_patient_contact",
    "admissions_for_patient",
    "lab_applications_for_patient",
    "lab_items_list",
    "diagnosis_for_admission",
    "prescriptions_for_admission",
    "notes_for_admission",
]

# =========================
# Business logic
# =========================
async def process_query(user_query: str) -> str:
    logger.debug("[MAIN] Query: %s", user_query)
    intent, entity = detect_intent_and_entity(user_query)
    logger.debug("[MAIN] NLP → intent: %s, entity: %s", intent, entity)

    try:
        if intent in ("appointments_today", "appointments"):
            data = await get_todays_appointments()
        elif intent == "appointments_on_date":
            if not entity:
                return "⚠️ Please mention a specific date (e.g., 'on June 21st')."
            ent = entity.lower()
            parsed_date = (
                datetime.today() + timedelta(days=1)
                if ent == "tomorrow"
                else datetime.today()
                if ent == "today"
                else dateparser.parse(entity)
            )
            if not parsed_date:
                return "⚠️ Couldn't parse the date."
            data = await get_appointments_on_date(parsed_date.strftime("%Y-%m-%d"))
        elif intent in ("staff", "staff_info"):
            data = await get_all_staff()
        elif intent == "patient_info":
            if not entity:
                return "⚠️ Please specify a patient name."
            data = await get_patient_history(entity)
        elif intent == "get_patient_dob":
            if not entity:
                return "⚠️ Please specify a patient."
            data = await get_patient_dob(entity)
        elif intent == "get_patient_contact":
            if not entity:
                return "⚠️ Please specify a patient."
            data = await get_patient_contact(entity)
        elif intent == "admissions_for_patient":
            if not entity:
                return "⚠️ Need patient ID."
            data = await get_admissions_for_patient(entity)
        elif intent == "lab_applications_for_patient":
            if not entity:
                return "⚠️ Need patient ID."
            data = await get_lab_applications_for_patient(entity)
        elif intent == "lab_items_list":
            data = await get_lab_items_list()
        elif intent == "diagnosis_for_admission":
            if not entity:
                return "⚠️ Need admission ID."
            data = await get_diagnosis_for_admission(entity)
        elif intent == "prescriptions_for_admission":
            if not entity:
                return "⚠️ Need admission ID."
            data = await get_prescriptions_for_admission(entity)
        elif intent == "notes_for_admission":
            if not entity:
                return "⚠️ Need admission ID."
            data = await get_notes_for_admission(entity)
        else:
            return "🤖 Sorry, I didn’t understand. Ask about appointments, staff, or patient records."

        return generate_response(user_query, data)

    except Exception as e:
        logger.exception("[MAIN] Error processing %s: %s", intent, e)
        return "❌ Internal error, please try again later."

# =========================
# API Models
# =========================
class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    reply: str

# =========================
# Endpoints
# =========================
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    msg = (req.message or "").strip()
    if not msg:
        logger.warning("Empty chat message received")
        raise HTTPException(status_code=400, detail="`message` is required and must be non-empty")
    reply = await process_query(msg)
    return {"reply": reply}

@app.get("/healthz")
async def healthz():
    try:
        return {"ok": True}
    except Exception as e:
        logger.exception("Health check failed: %s", e)
        return {"ok": False, "details": str(e)}

# =========================
# Startup / Shutdown hooks
# =========================
@app.on_event("startup")
async def on_startup():
    logger.info("Chatbot service starting up. CWD=%s", BASE)

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Chatbot service shutting down.")

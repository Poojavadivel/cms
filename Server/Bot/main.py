"""
Main async routing for Doctor Chatbot.
Maintains original intents and adds new ones for CSV‐based lookups.
"""

import logging
from datetime import datetime, timedelta
import dateparser
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
    get_notes_for_admission
)
from rag import generate_response

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.FileHandler("logs/chatbot.log", encoding="utf-8")
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)

EXTRA_INTENTS = [
    "get_patient_dob", "get_patient_contact",
    "admissions_for_patient", "lab_applications_for_patient", "lab_items_list",
    "diagnosis_for_admission", "prescriptions_for_admission", "notes_for_admission"
]

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
            parsed_date = datetime.today() + timedelta(days=1) if ent == "tomorrow" \
                          else datetime.today() if ent=="today" \
                          else dateparser.parse(entity)
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
            if not entity: return "⚠️ Please specify a patient."
            data = await get_patient_dob(entity)

        elif intent == "get_patient_contact":
            if not entity: return "⚠️ Please specify a patient."
            data = await get_patient_contact(entity)

        elif intent == "admissions_for_patient":
            if not entity: return "⚠️ Need patient ID."
            data = await get_admissions_for_patient(entity)

        elif intent == "lab_applications_for_patient":
            if not entity: return "⚠️ Need patient ID."
            data = await get_lab_applications_for_patient(entity)

        elif intent == "lab_items_list":
            data = await get_lab_items_list()

        elif intent == "diagnosis_for_admission":
            if not entity: return "⚠️ Need admission ID."
            data = await get_diagnosis_for_admission(entity)

        elif intent == "prescriptions_for_admission":
            if not entity: return "⚠️ Need admission ID."
            data = await get_prescriptions_for_admission(entity)

        elif intent == "notes_for_admission":
            if not entity: return "⚠️ Need admission ID."
            data = await get_notes_for_admission(entity)

        else:
            return "🤖 Sorry, I didn’t understand. Ask about appointments, staff, or patient records."

        return generate_response(user_query, data)

    except Exception as e:
        logger.exception("[MAIN] Error processing %s: %s", intent, e)
        return "❌ Internal error, please try again later."

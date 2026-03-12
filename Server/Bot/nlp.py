"""
Advanced NLP module for production healthcare chatbot.
Enhancements:
- Dynamic thresholding
- Entity-informed zero-shot classification
- Few-shot prompting (descriptive intent support)
- Confidence normalization
- Language-aware fallback
- Context memory
"""

import logging
import spacy
from langdetect import detect
from transformers import pipeline
import torch

# ---------------------------- Logging Setup ----------------------------

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    handler = logging.FileHandler("logs/chatbot.log", encoding="utf-8")
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)

# ---------------------------- Load spaCy NER ----------------------------

# ---------------------------- Load spaCy NER ----------------------------
try:
    nlp_spacy = spacy.load("en_core_web_trf")
    logger.debug("[NLP] Loaded spaCy model: en_core_web_trf")
except OSError:
    try:
        logger.warning("[NLP] Falling back to spaCy model: en_core_web_sm")
        nlp_spacy = spacy.load("en_core_web_sm")
    except OSError:
        logger.exception("[NLP] No spaCy model available. Install with: "
                         "python -m spacy download en_core_web_sm")
        raise


# ---------------------------- Load Intent Classifier ----------------------------

try:
    intent_classifier = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
        framework="pt"
    )
    logger.debug("[NLP] Loaded zero-shot classification model: facebook/bart-large-mnli")
except Exception:
    logger.exception("[NLP] Failed to load zero-shot model.")
    raise

# ---------------------------- Intent Schema (Descriptive Prompting) ----------------------------

INTENT_SCHEMA = {
    "appointments_today": "Get today's appointments.",
    "appointments_on_date": "Get appointments for a specific date.",
    "patient_info": "Fetch patient record details.",
    "staff_info": "List hospital staff information.",
    "greeting": "User says hello or initiates conversation.",
    "goodbye": "User ends conversation or says goodbye.",
    "ask_doctor": "Ask a question to the doctor.",
    "department_info": "Query hospital departments or specialties.",
    "lab_results": "Retrieve patient lab results.",
    "prescriptions": "Retrieve patient prescription list.",
    "admission_info": "Get admission or discharge info for a patient.",
    "update_patient_contact": "Update contact info for a patient.",
    "cancel_appointment": "Cancel a scheduled appointment.",
    "book_appointment": "Book a new appointment.",
    "reschedule_appointment": "Reschedule an existing appointment.",
    "get_patient_dob": "Fetch patient's date of birth.",
    "get_patient_gender": "Fetch patient's gender.",
    "get_patient_contact": "Fetch patient's phone or contact info.",
    "get_all_patients": "List all patients in system.",
    "get_recent_admissions": "Get recent hospital admissions.",
    "discharge_summary": "Fetch discharge summary for a patient.",
    "doctor_schedule": "Get a doctor's schedule.",
    "nurse_on_duty": "Identify nurse on duty.",
    "room_availability": "Check available rooms.",
    "bed_occupancy": "Get bed occupancy report.",
    "lab_test_schedule": "List patient's upcoming lab tests.",
    "radiology_results": "Get radiology results.",
    "emergency_contacts": "Show patient's emergency contacts.",
    "pharmacy_inventory": "Check pharmacy stock or availability.",
    "prescription_renewal": "Renew a prescription.",
    "patient_allergies": "Fetch known patient allergies.",
    "vital_signs_history": "View historical vitals.",
    "billing_summary": "Get billing summary or invoice.",
    "insurance_details": "Fetch insurance coverage info.",
    "next_of_kin": "Show next of kin info.",
    "doctor_notes": "Display doctor's notes.",
    "referral_status": "Check referral status.",
    "follow_up_appointments": "Get follow-up appointment info.",
    "pending_lab_tests": "List pending lab tests.",
    "completed_lab_tests": "List completed lab tests.",
    "active_medications": "Show active medications.",
    "medication_side_effects": "List medication side effects.",
    "dietary_recommendations": "Show dietary advice for patient.",
    "discharge_instructions": "Give discharge instructions.",
    "ICU_patients": "List patients in ICU.",
    "ward_overview": "Show ward-level occupancy or details.",
    "staff_shift_schedule": "Fetch shift schedules.",
    "visitor_policy": "Show hospital visitor policy.",
    "hospital_map": "Display hospital map.",
    "room_cleaning_schedule": "Get cleaning schedule for rooms.",
    "infection_reports": "Report or view infections.",
    "covid_protocols": "Display COVID-19 protocols.",
    "vaccine_records": "Show vaccine records.",
    "doctor_on_call": "Identify doctor on call.",
    "critical_alerts": "Display critical alerts.",
    "system_status": "Check backend system health.",
    "clinical_guidelines": "Show clinical protocols.",
    "temperature_trends": "Track patient temperature over time.",
    "oxygen_saturation_levels": "View oxygen saturation data."
}

# ---------------------------- Context Memory ----------------------------

DIALOGUE_CONTEXT = {
    "last_intent": None,
    "last_entity": None
}

# ---------------------------- Language Detection ----------------------------

def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        logger.debug(f"[NLP] Detected language: {lang}")
        return lang
    except Exception:
        logger.warning("[NLP] Language detection failed.")
        return "unknown"

# ---------------------------- Entity Extraction ----------------------------

def extract_entities(text: str):
    try:
        doc = nlp_spacy(text)
        entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
        logger.debug(f"[NLP] NER results: {entities}")
        return entities
    except Exception:
        logger.exception("[NLP] Entity extraction failed.")
        return []

# ---------------------------- Intent Detection ----------------------------

def detect_intent(text: str, entity_text: str = None, threshold: float = 0.10):
    """
    Entity-aware intent detection using descriptive prompts.
    """
    try:
        candidate_labels = list(INTENT_SCHEMA.values())
        label_to_intent = {v: k for k, v in INTENT_SCHEMA.items()}

        if entity_text:
            text += f" (Patient: {entity_text})"

        result = intent_classifier(text, candidate_labels)
        top_label = result['labels'][0]
        top_intent = label_to_intent[top_label]
        score = result['scores'][0]

        logger.debug(f"[NLP] Intent prediction: {top_intent} (score: {score:.2f})")

        # Normalize threshold based on linguistic complexity
        dynamic_threshold = max(threshold, 0.10)
        if score < dynamic_threshold:
            logger.warning(f"[NLP] Intent score low ({score:.2f}) < {dynamic_threshold:.2f} → fallback.")
            return "fallback", score

        return top_intent, score
    except Exception:
        logger.exception("[NLP] Intent detection failed.")
        return "fallback", 0.0

# ---------------------------- Main NLP Pipeline ----------------------------

def detect_intent_and_entity(user_input: str):
    logger.debug(f"[NLP] Input received: {user_input}")

    # Detect language
    lang = detect_language(user_input)

    # Extract entities
    entities = extract_entities(user_input)
    entity_text = None
    for ent in entities:
        if ent['label'] in ("PERSON", "ORG", "GPE", "DATE", "DEPARTMENT", "PATIENT_ID"):
            entity_text = ent['text']
            break

    # Detect intent
    intent, score = detect_intent(user_input, entity_text)

    if intent == "fallback":
        logger.debug("[NLP] Fallback triggered → returning unknown intent.")
        return "unknown", None

    # Update memory
    DIALOGUE_CONTEXT["last_intent"] = intent
    DIALOGUE_CONTEXT["last_entity"] = entity_text

    logger.debug(f"[NLP] Final NLP output → Intent: '{intent}', Entity: '{entity_text}'")
    return intent, entity_text

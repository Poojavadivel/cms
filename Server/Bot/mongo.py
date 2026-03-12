"""
Asynchronous MongoDB access layer using Motor.
Handles patient records, appointments, staff queries, and field‑based lookups.
"""

import logging
import asyncio
import json
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from config import MONGO_URI, MONGO_DB_NAME
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

# -------------------- Logging Setup --------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    handler = logging.FileHandler("logs/chatbot.log")
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# -------------------- Mongo Client Per Event Loop --------------------
_clients = {}

def get_db():
    loop = asyncio.get_event_loop()
    if loop not in _clients:
        logger.debug("[MONGO] Initializing AsyncIOMotorClient for current event loop.")
        _clients[loop] = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    return _clients[loop][MONGO_DB_NAME]

# -------------------- Retry Decorator --------------------
retry_mongo = retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(1),
    retry=retry_if_exception_type(PyMongoError)
)

# -------------------- Helper for logging result data --------------------
def log_data(label, data):
    safe_data = json.dumps(data, indent=2, default=str)[:1000]  # truncate for safety
    logger.debug("[MONGO] %s -> %s", label, safe_data)
    print(f"[DEBUG] {label} → {safe_data}")

# -------------------- Core Queries --------------------

@retry_mongo
async def get_patient_history(name: str) -> dict:
    db = get_db()
    patient = await db.patients.find_one({"name": {"$regex": name, "$options": "i"}})
    if not patient:
        logger.info(f"[MONGO] No patient found with name: {name}")
        return {"error": "Patient not found."}

    pid = patient.get("patient_id")
    admissions = await db.admissions.find({"patient_id": pid}).to_list(100)
    prescriptions = await db.prescriptions.find({"patient_id": pid}).to_list(100)
    diagnoses = await db.diagnosis_icd.find({"patient_id": pid}).to_list(100)
    labs = await db.application.find({"patient_id": pid}).to_list(100)
    notes = await db.noteevents.find({"patient_id": pid}).to_list(100)

    result = {
        "patient": patient,
        "admissions": admissions,
        "prescriptions": prescriptions,
        "diagnoses": diagnoses,
        "lab_applications": labs,
        "notes": notes
    }
    log_data("get_patient_history", result)
    return result

@retry_mongo
async def get_patient_dob(name: str) -> dict:
    db = get_db()
    result = await db.patients.find_one({"name": {"$regex": name, "$options": "i"}}, {"dob": 1, "name": 1, "_id": 0})
    log_data("get_patient_dob", result or {"error": "Patient not found."})
    return result or {"error": "Patient not found."}

@retry_mongo
async def get_patient_contact(name: str) -> dict:
    db = get_db()
    result = await db.patients.find_one({"name": {"$regex": name, "$options": "i"}}, {"contact": 1, "name": 1, "_id": 0})
    log_data("get_patient_contact", result or {"error": "Patient not found."})
    return result or {"error": "Patient not found."}

@retry_mongo
async def get_todays_appointments() -> list:
    db = get_db()
    today = datetime.today().strftime('%Y-%m-%d')
    result = await db.appointments.find({"date": today}).to_list(100)
    log_data("get_todays_appointments", result)
    return result

@retry_mongo
async def get_appointments_on_date(date_str: str) -> list:
    db = get_db()
    result = await db.appointments.find({"date": date_str}).to_list(100)
    log_data("get_appointments_on_date", result)
    return result

@retry_mongo
async def get_all_staff() -> list:
    db = get_db()
    result = await db.staff.find({"status": "active"}).to_list(100)
    log_data("get_all_staff", result)
    return result

# -------------------- Extended Field Lookups --------------------

@retry_mongo
async def get_admissions_for_patient(pid: str) -> list:
    db = get_db()
    result = await db.admissions.find({"patient_id": pid}).to_list(100)
    log_data("get_admissions_for_patient", result)
    return result

@retry_mongo
async def get_lab_applications_for_patient(pid: str) -> list:
    db = get_db()
    result = await db.application.find({"patient_id": pid}).to_list(100)
    log_data("get_lab_applications_for_patient", result)
    return result

@retry_mongo
async def get_lab_items_list() -> list:
    db = get_db()
    result = await db.d_labitems.find().to_list(100)
    log_data("get_lab_items_list", result)
    return result

@retry_mongo
async def get_diagnosis_for_admission(aid: str) -> list:
    db = get_db()
    result = await db.diagnosis_icd.find({"admission_id": aid}).to_list(100)
    log_data("get_diagnosis_for_admission", result)
    return result

@retry_mongo
async def get_prescriptions_for_admission(aid: str) -> list:
    db = get_db()
    result = await db.prescriptions.find({"admission_id": aid}).to_list(100)
    log_data("get_prescriptions_for_admission", result)
    return result

@retry_mongo
async def get_notes_for_admission(aid: str) -> list:
    db = get_db()
    result = await db.noteevents.find({"admission_id": aid}).to_list(100)
    log_data("get_notes_for_admission", result)
    return result

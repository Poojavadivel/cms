# backend/db/mongo_handler.py

import os
from datetime import datetime
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.collection import Collection
from bson.objectid import ObjectId
from dotenv import load_dotenv
from backend.utils.logger import logger

# === Load environment variables ===
load_dotenv()

# === MongoDB Config ===
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "medical_db")

# === Connect to MongoDB ===
try:
    client: MongoClient = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    # Collections
    patients_collection: Collection = db["patients"]
    blood_tests_collection: Collection = db["blood_tests"]
    prescriptions_collection: Collection = db["prescriptions"]
    xray_reports_collection: Collection = db["xray_reports"]

    logger.info("✅ Connected to MongoDB Atlas.")
except Exception as e:
    logger.exception("❌ Failed to connect to MongoDB:")
    raise RuntimeError("MongoDB connection failed.") from e

# === Core Patient Functions ===

def upsert_patient_basic_info(structured_data: Dict[str, Any]) -> str:
    metadata = structured_data.get("metadata", {})
    name = metadata.get("patient_name", "Unknown")
    timestamp = datetime.utcnow()

    existing_patient = patients_collection.find_one({"name": name})
    if existing_patient:
        patients_collection.update_one(
            {"_id": existing_patient["_id"]},
            {"$set": {"last_updated": timestamp}}
        )
        logger.info(f"📁 Updated patient '{name}' (ID: {existing_patient['_id']})")
        return str(existing_patient["_id"])
    else:
        new_patient = {
            "name": name,
            "created_at": timestamp,
            "last_updated": timestamp
        }
        result = patients_collection.insert_one(new_patient)
        logger.info(f"🆕 Created new patient '{name}' with ID: {result.inserted_id}")
        return str(result.inserted_id)

# === Report Insertion Functions ===

def insert_blood_test(patient_id: str, structured_data: Dict[str, Any], raw_text: str) -> str:
    try:
        report = {
            "patient_id": ObjectId(patient_id),
            "test_type": structured_data.get("metadata", {}).get("test_type", "Unknown"),
            "results": structured_data,
            "raw_text": raw_text,
            "timestamp": datetime.utcnow()
        }
        result = blood_tests_collection.insert_one(report)
        logger.info(f"🩸 Blood test inserted for patient ID {patient_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.exception("❌ Failed to insert blood test:")
        raise

def insert_prescription(patient_id: str, structured_data: Dict[str, Any]) -> str:
    try:
        prescription_data = structured_data.get("prescription", {})
        prescription = {
            "patient_id": ObjectId(patient_id),
            "medications": prescription_data.get("medications", []),
            "doctor": structured_data.get("metadata", {}).get("doctor_name", "Unknown"),
            "diagnosis": prescription_data.get("diagnosis", ""),
            "prescription_date": prescription_data.get("prescription_date", ""),
            "follow_up": prescription_data.get("follow_up", ""),
            "timestamp": datetime.utcnow()
        }
        result = prescriptions_collection.insert_one(prescription)
        logger.info(f"💊 Prescription inserted for patient ID {patient_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.exception("❌ Failed to insert prescription:")
        raise

def insert_xray_report(patient_id: str, structured_data: Dict[str, Any], image_url: str) -> str:
    try:
        report = {
            "patient_id": ObjectId(patient_id),
            "image_url": image_url,
            "description": structured_data.get("description", ""),
            "findings": structured_data.get("findings", {}),
            "timestamp": datetime.utcnow()
        }
        result = xray_reports_collection.insert_one(report)
        logger.info(f"🩻 X-ray report inserted for patient ID {patient_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.exception("❌ Failed to insert x-ray report:")
        raise

# === Auto-detection and Routing ===

def detect_report_type(structured_data: Dict[str, Any]) -> str:
    """
    Detects report type by inspecting structured_data keys.
    Returns: 'blood_test', 'prescription', 'xray', or 'unknown'
    """
    if "cbc" in structured_data or "lipid" in structured_data or "thyroid" in structured_data:
        return "blood_test"
    elif "prescription" in structured_data:
        return "prescription"
    elif "findings" in structured_data or "image_url" in structured_data:
        return "xray"
    else:
        logger.warning("⚠️ Unknown report type detected in structured data.")
        return "unknown"

def insert_report_auto(structured_data: Dict[str, Any], raw_text: str = "", image_url: str = "") -> str:
    """
    Master handler: auto-detects type and routes to correct insert function.
    Returns report ID.
    """
    patient_id = upsert_patient_basic_info(structured_data)
    report_type = detect_report_type(structured_data)

    if report_type == "blood_test":
        return insert_blood_test(patient_id, structured_data, raw_text)
    elif report_type == "prescription":
        return insert_prescription(patient_id, structured_data)
    elif report_type == "xray":
        return insert_xray_report(patient_id, structured_data, image_url)
    else:
        raise ValueError("Could not detect report type for structured data.")

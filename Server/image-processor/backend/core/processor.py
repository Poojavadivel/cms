# backend/core/processor.py

import os
from backend.ocr.tesseract_ocr import extract_text
from backend.nlp.gpt import get_gpt_structured_data
from backend.db.mongo_handler import insert_report_auto
from backend.utils.logger import logger

def detect_report_type(ocr_text: str) -> str:
    """
    Heuristic-based classification of report type from OCR content.
    """
    text_lower = ocr_text.lower()
    if any(term in text_lower for term in ["hemoglobin", "rbc", "wbc", "platelets"]):
        return "cbc"
    elif any(term in text_lower for term in ["sgpt", "sgot", "bilirubin"]):
        return "lft"
    elif any(term in text_lower for term in ["urea", "creatinine", "bun"]):
        return "kft"
    elif any(term in text_lower for term in ["dialysis", "hemodialysis", "av fistula"]):
        return "dialysis"
    elif any(term in text_lower for term in ["tablet", "capsule", "dose", "prescription"]):
        return "prescription"
    elif any(term in text_lower for term in ["hdl", "ldl", "cholesterol", "triglyceride"]):
        return "lipid"
    elif any(term in text_lower for term in ["tsh", "t3", "t4", "thyroid"]):
        return "thyroid"
    elif any(term in text_lower for term in ["glucose", "fasting", "random sugar"]):
        return "sugar"
    elif any(term in text_lower for term in ["sodium", "potassium", "chloride"]):
        return "electrolytes"
    elif any(term in text_lower for term in ["bp", "pulse", "temperature", "vitals"]):
        return "vitals"
    else:
        return "unknown"


# backend/core/processor.py




def process_document(file_path: str, job_id: str = None) -> dict:
    """
    Main pipeline:
    - OCR
    - NLP parsing
    - Auto route to MongoDB (blood test, prescription, xray, etc.)
    """
    logger.info("📄 Starting GPT-based document processing...")
    logger.info(f"[{job_id}] 📂 File path received: {file_path}")

    try:
        # Step 1: OCR
        raw_text = extract_text(file_path, job_id=job_id)
        logger.info(f"[{job_id}] ✅ OCR completed.")
        logger.debug(f"[{job_id}] 🔍 OCR Preview: {raw_text[:500]}")

        if not raw_text.strip():
            raise ValueError("OCR returned empty text. Document may be blank, blurry, or corrupted.")

        # Step 2: GPT NLP Structuring
        structured_data = get_gpt_structured_data(raw_text)
        if not structured_data or not isinstance(structured_data, dict):
            raise ValueError("GPT did not return structured data or returned invalid format.")

        logger.info(f"[{job_id}] ✅ GPT extracted keys: {list(structured_data.keys())}")

        # Step 3: MongoDB Auto Insert Based on Structure
        patient_id = insert_report_auto(structured_data, raw_text=raw_text)

        logger.info(f"[{job_id}] 🗃️ MongoDB insert complete. Patient ID: {patient_id}")

        return {
            "status": "success",
            "structured_data": structured_data,
            "patient_id": patient_id,
            "raw_text": raw_text,
            "job_id": job_id,
            "db_status": f"Inserted patient report successfully: {patient_id}"
        }

    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Processing error occurred.")
        return {
            "status": "error",
            "message": f"Processing failed: {str(e)}",
            "job_id": job_id
        }

    finally:
        # Cleanup
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"[{job_id}] 🧹 Cleaned up temp file: {file_path}")
        except Exception as cleanup_err:
            logger.warning(f"[{job_id}] ⚠️ File cleanup failed: {cleanup_err}")

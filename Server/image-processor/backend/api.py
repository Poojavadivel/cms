from fastapi import FastAPI, UploadFile, File, HTTPException
from backend.core.processor import process_document
from backend.utils.logger import logger
from backend.utils.file_utils import (
    save_uploaded_file,
    is_allowed_file,
    get_file_size_mb,
    move_to_processed
)
from pathlib import Path

MAX_FILES = 20
MAX_SIZE_MB = 50

app = FastAPI(title="Smart Medical Doc Processor API")

@app.post("/process")
async def process_files(files: list[UploadFile] = File(...)):
    """
    Upload up to 20 PDF or image files for OCR → GPT parsing → MongoDB storage.
    Returns structured JSON + OCR text + DB status for each file.
    """
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Too many files. Max allowed is {MAX_FILES}.")

    results_list = []

    for uploaded_file in files:
        try:
            ext = Path(uploaded_file.filename).suffix.lower()
            if not is_allowed_file(uploaded_file.filename):
                results_list.append({
                    "file": uploaded_file.filename,
                    "status": "error",
                    "message": "Unsupported file type."
                })
                continue

            file_size_mb = uploaded_file.size / (1024 * 1024) if uploaded_file.size else 0
            if file_size_mb > MAX_SIZE_MB:
                results_list.append({
                    "file": uploaded_file.filename,
                    "status": "error",
                    "message": f"File too large ({file_size_mb:.2f} MB). Max allowed is {MAX_SIZE_MB} MB."
                })
                continue

            # Save file
            file_path, job_id = save_uploaded_file(uploaded_file)

            # Process document (OCR → GPT → DB)
            results = process_document(file_path, job_id=job_id)

            # Move processed file
            try:
                move_to_processed(file_path)
            except Exception as move_err:
                logger.warning(f"Error moving file {file_path} to processed: {move_err}")

            # Append results
            results_list.append({
                "file": uploaded_file.filename,
                "job_id": job_id,
                "status": results.get("status", "unknown"),
                "ocr_text": results.get("raw_text", ""),
                "structured_data": results.get("structured_data", {}),
                "db_status": results.get("db_status", "No DB response."),
                "message": results.get("message", "")
            })

        except Exception as e:
            logger.exception(f"[API] Error processing file {uploaded_file.filename}: {e}")
            results_list.append({
                "file": uploaded_file.filename,
                "status": "error",
                "message": str(e)
            })

    return {"results": results_list}
 
 
 #uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000



# file_utils.py — Enterprise-grade file handling for medical OCR system

import os
import shutil
import mimetypes
from pathlib import Path
from typing import Tuple, Union
from datetime import datetime
from uuid import uuid4
from werkzeug.utils import secure_filename
from backend.utils.logger import logger

# Allowed file types
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

# Directory setup
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

def is_allowed_file(filename: str) -> bool:
    """
    Check if the file has an allowed extension.
    """
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS

def get_file_mime_type(file_path: Union[str, Path]) -> str:
    """
    Guess the MIME type of a file based on its path.
    """
    mime_type, _ = mimetypes.guess_type(str(file_path))
    return mime_type or "application/octet-stream"

def save_uploaded_file(uploaded_file, subfolder: str = "") -> Tuple[str, str]:
    """
    Saves an uploaded file to the uploads directory, optionally into a subfolder.
    Returns the saved file path and a unique job ID.
    """
    try:
        filename = secure_filename(uploaded_file.name)
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}")

        uid = uuid4().hex[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        job_id = f"job_{uid}_{timestamp}"

        save_dir = UPLOAD_DIR / subfolder if subfolder else UPLOAD_DIR
        save_dir.mkdir(parents=True, exist_ok=True)
        final_path = save_dir / f"{job_id}_{filename}"

        with open(final_path, "wb") as f:
            shutil.copyfileobj(uploaded_file, f)

        logger.info(f"File saved: {final_path}")
        return str(final_path), job_id

    except Exception as e:
        logger.exception(f"Failed to save uploaded file: {e}")
        raise

def move_to_processed(file_path: Union[str, Path]) -> str:
    """
    Moves a file from uploads to the processed directory.
    """
    try:
        src = Path(file_path)
        if not src.exists():
            raise FileNotFoundError(f"File not found: {src}")

        dest = PROCESSED_DIR / src.name
        shutil.move(str(src), str(dest))

        logger.info(f"Moved file to processed: {dest}")
        return str(dest)

    except Exception as e:
        logger.warning(f"Error moving file to processed: {e}")
        return str(file_path)

def get_file_size_mb(uploaded_file: Union[str, Path, object]) -> float:
    """
    Returns file size in megabytes.
    Supports file path or Streamlit UploadedFile-like objects.
    """
    try:
        if isinstance(uploaded_file, (str, Path)):
            return os.path.getsize(str(uploaded_file)) / (1024 * 1024)
        else:
            uploaded_file.seek(0, os.SEEK_END)
            size_bytes = uploaded_file.tell()
            uploaded_file.seek(0)
            return size_bytes / (1024 * 1024)
    except Exception as e:
        logger.error(f"Error getting file size: {e}")
        return 0.0

def cleanup_temp_dirs(days_old: int = 1):
    """
    Removes files older than `days_old` days from UPLOAD and PROCESSED directories.
    """
    try:
        cutoff = datetime.now().timestamp() - (days_old * 86400)
        for folder in [UPLOAD_DIR, PROCESSED_DIR]:
            for item in folder.iterdir():
                if item.is_file() and item.stat().st_mtime < cutoff:
                    item.unlink()
                    logger.info(f"Old file removed: {item}")
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")

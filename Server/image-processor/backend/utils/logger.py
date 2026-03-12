# logger.py — Enterprise-grade logging with rotation and console support

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path
import sys

# Attempt to fix Unicode output in Windows console
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    # For older Python versions or non-Windows systems
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Log file directory and name
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "app.log"

def setup_logger(name: str = "ocr_logger", log_file: str = str(LOG_FILE)) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Prevent adding handlers multiple times
    if logger.hasHandlers():
        return logger

    # File Handler with rotation (10 MB x 5 backups)
    file_handler = RotatingFileHandler(
        log_file, maxBytes=10 * 1024 * 1024, backupCount=5, encoding='utf-8'
    )
    file_format = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(file_format)
    file_handler.setLevel(logging.DEBUG)

    # Console Handler (INFO+ only)
    console_handler = logging.StreamHandler()
    console_format = logging.Formatter(fmt="%(levelname)s | %(message)s")
    console_handler.setFormatter(console_format)
    console_handler.setLevel(logging.INFO)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

logger = setup_logger()

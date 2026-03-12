import os
import tempfile
import time
import uuid
import concurrent.futures
from typing import Tuple, Union, List, Dict
from PIL import Image, ImageOps, ImageFilter, ExifTags
from pdf2image import convert_from_path
import pytesseract
from backend.utils.logger import logger
from langdetect import detect
import json

# --- Tesseract Path ---
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# --- Config ---
MAX_FILE_SIZE_MB = 50
SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".pdf"]
DEFAULT_LANGUAGES = "eng+hin+tam"


# --- Utilities ---
def is_valid_file(file_path: str) -> bool:
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    ext = os.path.splitext(file_path)[-1].lower()
    if size_mb > MAX_FILE_SIZE_MB:
        logger.warning(f"File too large: {file_path} ({size_mb:.2f} MB)")
        return False
    if ext not in SUPPORTED_EXTENSIONS:
        logger.warning(f"Unsupported file type: {ext}")
        return False
    return True


def preprocess_image(img: Image.Image) -> Image.Image:
    try:
        try:
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            exif = img._getexif()
            if exif:
                orientation_value = exif.get(orientation, None)
                if orientation_value == 3:
                    img = img.rotate(180, expand=True)
                elif orientation_value == 6:
                    img = img.rotate(270, expand=True)
                elif orientation_value == 8:
                    img = img.rotate(90, expand=True)
        except:
            pass

        img = ImageOps.grayscale(img)
        img = img.filter(ImageFilter.MedianFilter())
        img = img.filter(ImageFilter.SHARPEN)
        img = img.resize((int(img.width * 1.5), int(img.height * 1.5)))
        return img
    except Exception as e:
        logger.warning(f"Image preprocessing failed: {e}")
        return img


def detect_language(sample_img: Image.Image) -> str:
    try:
        sample_text = pytesseract.image_to_string(sample_img, lang='eng')
        detected_lang = detect(sample_text)
        lang_map = {'en': 'eng', 'hi': 'hin', 'ta': 'tam'}
        return lang_map.get(detected_lang, DEFAULT_LANGUAGES)
    except Exception as e:
        logger.warning(f"Language detection failed: {e}")
        return DEFAULT_LANGUAGES


def ocr_with_confidence(img: Image.Image, lang: str, job_id: str) -> Dict:
    try:
        data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)
        text = " ".join(data['text']).strip()
        confidences = [int(conf) for conf in data['conf'] if isinstance(conf, str) and conf.isdigit() and int(conf) > 0]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        logger.info(f"[OCR:{job_id}] Avg confidence: {avg_conf:.2f} from {len(confidences)} blocks")
        return {
            "text": text,
            "confidence": avg_conf,
            "blocks": len(confidences),
        }
    except Exception as e:
        logger.exception(f"[OCR:{job_id}] OCR data extraction failed: {e}")
        return {"text": "", "confidence": 0.0, "blocks": 0}


def ocr_image(image: Union[str, Image.Image], lang: str = None, job_id: str = None) -> Dict:
    try:
        job_id = job_id or str(uuid.uuid4())
        start = time.time()
        img = Image.open(image) if isinstance(image, str) else image
        img = preprocess_image(img)
        lang = lang or detect_language(img)
        result = ocr_with_confidence(img, lang, job_id)
        result.update({
            "job_id": job_id,
            "time_taken": round(time.time() - start, 2),
            "lang_used": lang
        })
        logger.info(f"[OCR:{job_id}] Image OCR completed in {result['time_taken']}s")
        return result
    except Exception as e:
        logger.exception(f"[OCR:{job_id}] Image OCR error: {e}")
        return {"text": "", "confidence": 0.0, "blocks": 0, "job_id": job_id or "", "time_taken": 0, "lang_used": lang or DEFAULT_LANGUAGES}


def ocr_pdf(pdf_path: str, lang: str = None, job_id: str = None) -> Dict:
    try:
        if not is_valid_file(pdf_path):
            return {}

        job_id = job_id or str(uuid.uuid4())
        start = time.time()
        with tempfile.TemporaryDirectory() as temp_dir:
            images = convert_from_path(pdf_path, dpi=300, output_folder=temp_dir)
            logger.info(f"[OCR:{job_id}] Converted {len(images)} pages to images")

            def process_page(i, img):
                pre_img = preprocess_image(img)
                return {"page": i + 1, **ocr_with_confidence(pre_img, lang or detect_language(pre_img), f"{job_id}-pg{i+1}")}

            with concurrent.futures.ThreadPoolExecutor() as executor:
                results = list(executor.map(lambda p: process_page(*p), enumerate(images)))

        full_text = "\n\n".join([f"--- Page {r['page']} (conf: {r['confidence']:.2f}) ---\n{r['text']}" for r in results])
        avg_conf = sum([r['confidence'] for r in results]) / len(results) if results else 0.0

        return {
            "text": full_text.strip(),
            "confidence": avg_conf,
            "pages": len(images),
            "job_id": job_id,
            "time_taken": round(time.time() - start, 2),
            "lang_used": lang or DEFAULT_LANGUAGES
        }
    except Exception as e:
        logger.exception(f"[OCR:{job_id}] PDF OCR error: {e}")
        return {}


def extract_text(file_path: str, lang: str = None, job_id: str = None) -> str:
    try:
        job_id = job_id or str(uuid.uuid4())
        if not is_valid_file(file_path):
            return json.dumps({"error": "Invalid file"})

        ext = os.path.splitext(file_path)[-1].lower()
        result = {}

        if ext == ".pdf":
            result = ocr_pdf(file_path, lang, job_id)
        else:
            result = ocr_image(file_path, lang, job_id)

        logger.debug(f"[OCR:{job_id}] Extracted OCR JSON:\n{json.dumps(result, indent=2)[:1000]}...")
        return json.dumps(result, indent=2)

    except Exception as e:
        logger.exception(f"[OCR:{job_id}] OCR processing error: {e}")
        return json.dumps({"error": "OCR processing failed"})

import re
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from datetime import datetime
from fuzzywuzzy import fuzz
from backend.utils.logger import logger

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    SPACY_ENABLED = True
except Exception as e:
    logger.warning("spaCy NER disabled due to load error.")
    SPACY_ENABLED = False

# ----------------------
# Field Alias Dictionary
# ----------------------
FIELD_ALIASES = {
    "hemoglobin": ["hemoglobin", "hgb", "hb"],
    "wbc": ["wbc", "white blood cells"],
    "rbc": ["rbc", "red blood cells"],
    "platelets": ["platelets", "plt"],
    "mcv": ["mcv"],
    "mch": ["mch"],
    "mchc": ["mchc"],
    "sgot": ["sgot", "ast"],
    "sgpt": ["sgpt", "alt"],
    "bilirubin_total": ["bilirubin total", "total bilirubin"],
    "bilirubin_direct": ["bilirubin direct", "direct bilirubin"],
    "alp": ["alkaline phosphatase", "alp"],
    "urea": ["urea", "blood urea"],
    "creatinine": ["creatinine"],
    "uric_acid": ["uric acid"],
    "bun": ["bun", "blood urea nitrogen"],
    "cholesterol_total": ["total cholesterol"],
    "hdl": ["hdl"],
    "ldl": ["ldl"],
    "triglycerides": ["triglycerides"],
    "t3": ["t3"],
    "t4": ["t4"],
    "tsh": ["tsh"],
    "fbs": ["fbs", "fasting blood sugar"],
    "ppbs": ["ppbs", "postprandial blood sugar"],
    "rbs": ["rbs", "random blood sugar"],
    "hba1c": ["hba1c"],
    "sodium": ["sodium", "na"],
    "potassium": ["potassium", "k"],
    "chloride": ["chloride", "cl"],
    "calcium": ["calcium", "ca"],
    "temperature": ["temperature"],
    "heart_rate": ["heart rate", "pulse"],
    "respiratory_rate": ["respiratory rate"],
    "spo2": ["spo2", "oxygen saturation"],
    "bp": ["blood pressure", "bp"],
}

EXPECTED_UNITS = ["mg/dL", "g/dL", "%", "mmHg", "mmol/L"]

# ------------------------
# Abstract Parsing Handler
# ------------------------
class AbstractParser(ABC):
    def __init__(self, ocr_text: str):
        self.raw_text = ocr_text
        self.cleaned_text = self._clean_text(ocr_text)
        self.data = {}

    def _clean_text(self, text: str) -> str:
        text = re.sub(r"[\t|:–—]", " ", text)
        text = re.sub(r"\s{2,}", " ", text.replace("\n", " ").strip())
        return text

    def extract_by_alias(self, aliases: List[str], cast_type=float) -> Optional[Dict[str, Any]]:
        for alias in aliases:
            pattern = rf"{alias}[\s\-:]*([><~]?[\d\.]+)(?:\s*(?:-|\u2013|to)\s*([\d\.]+))?\s*({ '|'.join(EXPECTED_UNITS) })?"
            match = re.search(pattern, self.cleaned_text, re.IGNORECASE)
            if match:
                try:
                    val1 = float(match.group(1).replace("~", "").replace(">", ""))
                    val2 = match.group(2)
                    unit = match.group(3) or ""
                    value = round((val1 + float(val2)) / 2, 2) if val2 else val1
                    return {"value": value, "unit": unit, "confidence": 0.95}
                except Exception as e:
                    logger.warning(f"Failed parsing {alias}: {e}")
        # Fuzzy fallback
        for word in self.cleaned_text.split(" "):
            for alias in aliases:
                if fuzz.partial_ratio(alias.lower(), word.lower()) > 85:
                    num = re.search(r"\d+(\.\d+)?", word)
                    if num:
                        return {"value": float(num.group()), "unit": "", "confidence": 0.6}
        return None

    def extract_text_field(self, label: str) -> Optional[str]:
        pattern = rf"{label}[\s\-:]+([A-Za-z0-9\s,\.]+)"
        match = re.search(pattern, self.cleaned_text, re.IGNORECASE)
        return match.group(1).strip() if match else None

    def extract_date(self, label="Date") -> Optional[str]:
        pattern = rf"{label}[\s\-:]+(\d{{1,2}}[\/\-]\d{{1,2}}[\/\-]\d{{2,4}})"
        match = re.search(pattern, self.cleaned_text, re.IGNORECASE)
        if match:
            try:
                d = datetime.strptime(match.group(1), "%d-%m-%Y")
                return d.strftime("%Y-%m-%d")
            except:
                return match.group(1)
        return None

    def extract_bp(self) -> Optional[str]:
        match = re.search(r"(BP|Blood Pressure)[\s\-:]+(\d{2,3}/\d{2,3})", self.cleaned_text, re.IGNORECASE)
        return match.group(2) if match else None

    def extract_name(self) -> Optional[str]:
        name_patterns = ["Patient Name", "Pt Name", "Name", "Name of Patient"]
        for label in name_patterns:
            name = self.extract_text_field(label)
            if name and len(name.split()) >= 2:
                return name

        # Fuzzy fallback
        lines = self.cleaned_text.split(". ")
        for line in lines:
            if fuzz.partial_ratio("name", line.lower()) > 80:
                name_match = re.search(r"Name[\s\-:]*([A-Za-z\s]+)", line, re.IGNORECASE)
                if name_match:
                    return name_match.group(1).strip()

        # spaCy NER fallback
        if SPACY_ENABLED:
            doc = nlp(self.cleaned_text)
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    return ent.text.strip()
        return None

    @abstractmethod
    def parse(self) -> Dict[str, Any]:
        pass

# ------------------ Specialized Parsers ------------------
class CBCParser(AbstractParser):
    def parse(self):
        self.data = {
            k: self.extract_by_alias(FIELD_ALIASES[k])
            for k in ["hemoglobin", "wbc", "rbc", "platelets", "mcv", "mch", "mchc"]
        }
        return {k: v for k, v in self.data.items() if v}


class LFTParser(AbstractParser):
    def parse(self):
        self.data = {
            k: self.extract_by_alias(FIELD_ALIASES[k])
            for k in ["sgot", "sgpt", "bilirubin_total", "bilirubin_direct", "alp"]
        }
        return {k: v for k, v in self.data.items() if v}


class KFTParser(AbstractParser):
    def parse(self):
        self.data = {
            k: self.extract_by_alias(FIELD_ALIASES[k])
            for k in ["urea", "creatinine", "uric_acid", "bun"]
        }
        return {k: v for k, v in self.data.items() if v}


class LipidParser(AbstractParser):
    def parse(self):
        self.data = {
            k: self.extract_by_alias(FIELD_ALIASES[k])
            for k in ["cholesterol_total", "hdl", "ldl", "triglycerides"]
        }
        return {k: v for k, v in self.data.items() if v}


class ThyroidParser(AbstractParser):
    def parse(self):
        self.data = {
            k: self.extract_by_alias(FIELD_ALIASES[k])
            for k in ["t3", "t4", "tsh"]
        }
        return {k: v for k, v in self.data.items() if v}


class SugarParser(AbstractParser):
    def parse(self):
        self.data = {
            k: self.extract_by_alias(FIELD_ALIASES[k])
            for k in ["fbs", "ppbs", "rbs", "hba1c"]
        }
        return {k: v for k, v in self.data.items() if v}


class ElectrolyteParser(AbstractParser):
    def parse(self):
        self.data = {
            k: self.extract_by_alias(FIELD_ALIASES[k])
            for k in ["sodium", "potassium", "chloride", "calcium"]
        }
        return {k: v for k, v in self.data.items() if v}

class DialysisParser(AbstractParser):
    def parse(self):
        self.data = {
            "pre_weight": self.extract_by_alias(["pre-weight", "pre weight"]),
            "post_weight": self.extract_by_alias(["post-weight", "post weight"]),
            "bp_pre": self.extract_bp(),
            "uf_volume": self.extract_by_alias(["uf volume"]),
            "session_duration": self.extract_by_alias(["session duration"]),
            "machine_id": self.extract_text_field("Machine ID"),
            "dialysis_type": self.extract_text_field("Dialysis Type")
        }
        return {k: v for k, v in self.data.items() if v}

class PrescriptionParser(AbstractParser):
    def parse(self):
        meds = re.findall(r"\b([A-Z][a-z]+(?: [0-9]+mg)?)", self.cleaned_text)
        self.data = {
            "prescription_date": self.extract_date("Date"),
            "medications": list(set(meds)),
            "timing": self.extract_text_field("Timing"),
            "diagnosis": self.extract_text_field("Diagnosis"),
            "follow_up": self.extract_date("Follow-up")
        }
        return {k: v for k, v in self.data.items() if v}

class VitalsParser(AbstractParser):
    def parse(self):
        self.data = {
            "temperature": self.extract_by_alias(FIELD_ALIASES["temperature"]),
            "heart_rate": self.extract_by_alias(FIELD_ALIASES["heart_rate"]),
            "respiratory_rate": self.extract_by_alias(FIELD_ALIASES["respiratory_rate"]),
            "spo2": self.extract_by_alias(FIELD_ALIASES["spo2"]),
            "bp": self.extract_bp()
        }
        return {k: v for k, v in self.data.items() if v}

class MetadataParser(AbstractParser):
    def parse(self):
        self.data = {
            "patient_name": self.extract_name(),
            "patient_id": self.extract_text_field("Patient ID"),
            "report_date": self.extract_date(),
            "lab_name": self.extract_text_field("Lab"),
            "sample_id": self.extract_text_field("Sample ID"),
            "doctor_name": self.extract_text_field("Doctor"),
            "report_status": self.extract_text_field("Report Status")
        }
        return {k: v for k, v in self.data.items() if v}

# -------------- Parser Dispatcher ----------------
def parse_all_reports(ocr_text: str) -> Dict[str, Dict[str, Any]]:
    logger.info("Dispatching all report parsers...")
    return {
        k: v for k, v in {
            "cbc": CBCParser(ocr_text).parse(),
            "lft": LFTParser(ocr_text).parse(),
            "kft": KFTParser(ocr_text).parse(),
            "lipid": LipidParser(ocr_text).parse(),
            "thyroid": ThyroidParser(ocr_text).parse(),
            "sugar": SugarParser(ocr_text).parse(),
            "electrolytes": ElectrolyteParser(ocr_text).parse(),
            "dialysis": DialysisParser(ocr_text).parse(),
            "prescription": PrescriptionParser(ocr_text).parse(),
            "vitals": VitalsParser(ocr_text).parse(),
            "metadata": MetadataParser(ocr_text).parse(),
        }.items() if v  # Filter empty dictionaries
    }

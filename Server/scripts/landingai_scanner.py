#!/usr/bin/env python3
"""
LandingAI ADE Scanner for Medical Documents
Uses LandingAI's Document Parsing and Extraction API
"""

from __future__ import annotations

import os
import sys
import json
from io import BytesIO
from pathlib import Path
from typing import List, Optional

from landingai_ade import LandingAIADE
from landingai_ade.lib import pydantic_to_json_schema
from pydantic import BaseModel, Field


# ============================================================================
# PYDANTIC SCHEMAS FOR MEDICAL DOCUMENTS
# ============================================================================

class DoctorDetails(BaseModel):
    name: str = Field(
        default="",
        description='Full name of the doctor, including titles and qualifications.',
        title='Doctor Name',
    )
    specialization: str = Field(
        default="",
        description='The medical specialization of the doctor.',
        title='Specialization',
    )
    hospital: str = Field(
        default="",
        description='The hospital where the doctor consults.',
        title='Hospital Name',
    )
    license: str = Field(
        default="",
        description="The doctor's medical license number.",
        title='Medical License',
    )


class PatientDetails(BaseModel):
    name: str = Field(
        default="",
        description='The full name of the patient.',
        title='Patient Name'
    )
    firstName: str = Field(
        default="",
        description='First name of the patient.',
        title='First Name'
    )
    lastName: str = Field(
        default="",
        description='Last name of the patient.',
        title='Last Name'
    )
    uhid_no: str = Field(
        default="",
        description='Unique Hospital Identification Number for the patient.',
        title='UHID Number',
    )
    age: str = Field(
        default="",
        description="The age of the patient, including units (e.g., '92 M').",
        title='Patient Age',
    )
    gender: str = Field(
        default="",
        description="The gender of the patient (e.g., 'Male', 'Female', 'Other').",
        title='Patient Gender',
    )
    phone: str = Field(
        default="",
        description="Patient's contact phone number.",
        title='Phone Number',
    )
    email: str = Field(
        default="",
        description="Patient's email address.",
        title='Email',
    )
    dateOfBirth: str = Field(
        default="",
        description="Patient's date of birth in YYYY-MM-DD format.",
        title='Date of Birth',
    )


class Address(BaseModel):
    street_address: str = Field(
        default="",
        description='Street number and name.',
        title='Street Address'
    )
    city: str = Field(
        default="",
        description='The city.',
        title='City'
    )
    state: str = Field(
        default="",
        description='The state or province.',
        title='State'
    )
    pincode: str = Field(
        default="",
        description='The postal/ZIP code.',
        title='Pincode'
    )
    country: str = Field(
        default="India",
        description='The country.',
        title='Country'
    )


class Medication(BaseModel):
    type: str = Field(
        default="",
        description='Type of medication (e.g., Cap., Tab., Syrup, Injection).',
        title='Medication Type',
    )
    name: str = Field(
        default="",
        description='The brand or generic name of the drug.',
        title='Medication Name',
    )
    dose: str = Field(
        default="",
        description='The dosage strength of the medication.',
        title='Dose'
    )
    frequency: str = Field(
        default="",
        description='How often to take (e.g., 1-0-1, twice daily).',
        title='Frequency'
    )
    duration: str = Field(
        default="",
        description='Duration of medication (e.g., 7 days, 1 month).',
        title='Duration'
    )
    instructions: str = Field(
        default="",
        description='Special instructions (e.g., before food, after food).',
        title='Instructions'
    )


class TestResult(BaseModel):
    testName: str = Field(
        default="",
        description='Name of the lab test or parameter.',
        title='Test Name'
    )
    value: str = Field(
        default="",
        description='Test result value.',
        title='Value'
    )
    unit: str = Field(
        default="",
        description='Unit of measurement.',
        title='Unit'
    )
    normalRange: str = Field(
        default="",
        description='Normal reference range.',
        title='Normal Range'
    )
    flag: str = Field(
        default="Normal",
        description='Result flag: Normal, High, Low, Critical.',
        title='Flag'
    )
    notes: str = Field(
        default="",
        description='Additional notes about this test.',
        title='Notes'
    )


class LabReport(BaseModel):
    testType: str = Field(
        default="",
        description='Type of test (e.g., THYROID, BLOOD_COUNT, LIPID).',
        title='Test Type'
    )
    testCategory: str = Field(
        default="",
        description='Category (e.g., Hematology, Biochemistry).',
        title='Test Category'
    )
    labName: str = Field(
        default="",
        description='Name of the laboratory.',
        title='Lab Name'
    )
    reportDate: str = Field(
        default="",
        description='Date when report was issued.',
        title='Report Date'
    )
    testDate: str = Field(
        default="",
        description='Date when test was performed.',
        title='Test Date'
    )
    doctorName: str = Field(
        default="",
        description='Referring doctor name.',
        title='Doctor Name'
    )
    results: List[TestResult] = Field(
        default_factory=list,
        description='List of test results.',
        title='Test Results'
    )
    interpretation: str = Field(
        default="",
        description='Clinical interpretation or notes.',
        title='Interpretation'
    )
    notes: str = Field(
        default="",
        description='General notes or observations.',
        title='Notes'
    )


class PrescriptionDocument(BaseModel):
    doctor_details: DoctorDetails = Field(
        default_factory=DoctorDetails,
        description='Information about the consulting doctor.',
        title='Doctor Details',
    )
    contact_numbers: List[str] = Field(
        default_factory=list,
        description='List of contact phone numbers for the hospital or clinic.',
        title='Contact Numbers',
    )
    patient_details: PatientDetails = Field(
        default_factory=PatientDetails,
        description='Information about the patient.',
        title='Patient Details'
    )
    prescription_date: str = Field(
        default="",
        description='The date when the prescription was issued.',
        title='Prescription Date',
    )
    medications: List[Medication] = Field(
        default_factory=list,
        description='List of prescribed medications.',
        title='Medications'
    )
    review_date: str = Field(
        default="",
        description='The date for the next patient review.',
        title='Review Date'
    )
    clinic_address: Address = Field(
        default_factory=Address,
        description='The address of the medical facility.',
        title='Clinic Address'
    )
    diagnosis: str = Field(
        default="",
        description='Diagnosis or reason for prescription.',
        title='Diagnosis'
    )
    notes: str = Field(
        default="",
        description='Additional notes or instructions.',
        title='Notes'
    )


class LabReportDocument(BaseModel):
    patient_details: PatientDetails = Field(
        default_factory=PatientDetails,
        description='Information about the patient.',
        title='Patient Details'
    )
    labReport: LabReport = Field(
        default_factory=LabReport,
        description='Lab report details and results.',
        title='Lab Report'
    )
    clinic_address: Address = Field(
        default_factory=Address,
        description='Address of the lab/clinic.',
        title='Clinic Address'
    )


class MedicalHistoryDocument(BaseModel):
    patient_details: PatientDetails = Field(
        default_factory=PatientDetails,
        description='Information about the patient.',
        title='Patient Details'
    )
    medicalHistory: str = Field(
        default="",
        description='Patient medical history.',
        title='Medical History'
    )
    allergies: str = Field(
        default="",
        description='Known allergies.',
        title='Allergies'
    )
    chronicConditions: List[str] = Field(
        default_factory=list,
        description='List of chronic conditions.',
        title='Chronic Conditions'
    )
    surgicalHistory: List[str] = Field(
        default_factory=list,
        description='Previous surgeries.',
        title='Surgical History'
    )
    familyHistory: str = Field(
        default="",
        description='Family medical history.',
        title='Family History'
    )
    currentMedications: List[str] = Field(
        default_factory=list,
        description='Current medications.',
        title='Current Medications'
    )
    diagnosis: str = Field(
        default="",
        description='Current diagnosis.',
        title='Diagnosis'
    )
    recordDate: str = Field(
        default="",
        description='Date of medical history record.',
        title='Record Date'
    )


# ============================================================================
# LANDINGAI ADE CLIENT
# ============================================================================

class LandingAIScanner:
    def __init__(self, api_key: str):
        self.client = LandingAIADE(apikey=api_key)
        
    def detect_document_type(self, markdown_text: str) -> str:
        """
        Detect document type based on markdown content
        Returns: PRESCRIPTION, LAB_REPORT, MEDICAL_HISTORY, or GENERAL
        """
        markdown_lower = markdown_text.lower()
        
        # Prescription indicators
        prescription_keywords = ['prescription', 'rx', 'medication', 'medicine', 'drug', 'tablet', 'capsule', 'dosage']
        if any(keyword in markdown_lower for keyword in prescription_keywords):
            return 'PRESCRIPTION'
        
        # Lab report indicators
        lab_keywords = ['lab report', 'test result', 'pathology', 'blood test', 'hemoglobin', 'glucose', 'cholesterol']
        if any(keyword in markdown_lower for keyword in lab_keywords):
            return 'LAB_REPORT'
        
        # Medical history indicators
        history_keywords = ['medical history', 'patient history', 'discharge', 'admission', 'diagnosis']
        if any(keyword in markdown_lower for keyword in history_keywords):
            return 'MEDICAL_HISTORY'
        
        return 'GENERAL'
    
    def scan_document(self, document_path: str, document_type: Optional[str] = None) -> dict:
        """
        Scan and extract data from medical document
        
        Args:
            document_path: Path to PDF or image file
            document_type: Optional document type (PRESCRIPTION, LAB_REPORT, MEDICAL_HISTORY)
        
        Returns:
            Dictionary with extracted data
        """
        try:
            # Step 1: Parse document to markdown
            print(f"[LandingAI] Parsing document: {document_path}", file=sys.stderr)
            parse_response = self.client.parse(
                document=Path(document_path),
                model="dpt-2",
            )
            
            markdown_text = parse_response.markdown
            print(f"[LandingAI] Parsed {len(markdown_text)} characters of markdown", file=sys.stderr)
            
            # Step 2: Detect document type if not provided
            if not document_type:
                document_type = self.detect_document_type(markdown_text)
                print(f"[LandingAI] Detected document type: {document_type}", file=sys.stderr)
            
            # Step 3: Select appropriate schema
            if document_type == 'PRESCRIPTION':
                schema_model = PrescriptionDocument
            elif document_type == 'LAB_REPORT':
                schema_model = LabReportDocument
            elif document_type == 'MEDICAL_HISTORY':
                schema_model = MedicalHistoryDocument
            else:
                # Fallback to prescription schema
                schema_model = PrescriptionDocument
            
            # Step 4: Extract structured data
            schema = pydantic_to_json_schema(schema_model)
            print(f"[LandingAI] Extracting data using schema: {schema_model.__name__}", file=sys.stderr)
            
            extract_response = self.client.extract(
                schema=schema,
                markdown=BytesIO(markdown_text.encode('utf-8')),
            )
            
            # Step 5: Format response
            result = {
                'success': True,
                'documentType': document_type,
                'extractedData': extract_response.model_dump(),
                'markdown': markdown_text[:5000],  # First 5000 chars for reference
                'confidence': 0.95,  # LandingAI typically has high confidence
                'engine': 'landingai-ade',
                'model': 'dpt-2'
            }
            
            print(f"[LandingAI] Extraction successful", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"[LandingAI] Error: {str(e)}", file=sys.stderr)
            return {
                'success': False,
                'error': str(e),
                'documentType': document_type or 'UNKNOWN'
            }


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Command-line interface for testing"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python landingai_scanner.py <document_path> [document_type]'
        }))
        sys.exit(1)
    
    document_path = sys.argv[1]
    document_type = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Get API key from environment
    api_key = os.environ.get("LANDINGAI_API_KEY") or "ZHpvajlwZDk3ZHI2NGhvNG51aDNtOjM5Zk5NU21GOXpxblNoOWhVVFVuQTc0d1VUNWtRY0ZL"
    
    # Initialize scanner
    scanner = LandingAIScanner(api_key=api_key)
    
    # Scan document
    result = scanner.scan_document(document_path, document_type)
    
    # Output JSON result
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

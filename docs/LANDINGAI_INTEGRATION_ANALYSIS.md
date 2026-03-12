# DOCUMENT UPLOAD & LANDING.AI INTEGRATION ANALYSIS

## Overview
The system uses Landing.AI to extract data from medical documents (prescriptions, lab reports, medical history). The extracted data flows through a verification process before being saved to final collections.

## Data Flow Process

### 1. DOCUMENT UPLOAD
**Route:** \POST /api/scanner-enterprise/scan\
**File:** \Server/routes/scanner-enterprise.js\

- User uploads document (PDF/Image) through frontend
- File is temporarily stored in \Server/uploads/temp/\
- Landing.AI scanner processes the document

### 2. LANDING.AI EXTRACTION
**File:** \Server/utils/landingai_scanner.js\

**Process:**
1. **Parse Step:** Document → Markdown text
2. **Detect Type:** Auto-detect PRESCRIPTION, LAB_REPORT, or MEDICAL_HISTORY
3. **Extract Step:** Markdown → Structured data using schema

**Schemas Used:**
- **PrescriptionDocumentSchema:** Extracts prescription_summary, date_time, hospital, doctor, medical_notes
- **LabReportDocumentSchema:** Extracts test results, lab name, report dates
- **MedicalHistoryDocumentSchema:** Extracts medical_summary, services, hospital, doctor

### 3. TEMPORARY STORAGE (Verification Stage)
**Collection:** \ScannedDataVerification\
**Model:** \Server/Models/ScannedDataVerification.js\

**Saved Data:**
- patientId
- sessionId
- documentType
- pdfId (reference to PatientPDF)
- extractedData (raw Landing.AI response)
- dataRows[] (converted to editable rows for verification UI)
- verificationStatus: 'pending'
- metadata (OCR engine, confidence, markdown)

**Auto-expiry:** Documents are auto-deleted after 24 hours if not verified

### 4. VERIFICATION & CONFIRMATION
**Route:** \POST /api/scanner-enterprise/verification/:verificationId/confirm\

After user verifies/edits data in DataVerificationModal, the confirmed data is saved to:

## Final Collections (Where Data is Saved)

### A. PRESCRIPTION Documents
**Collection:** \prescriptiondocuments\
**Model:** \Server/Models/PrescriptionDocument.js\

**Fields Saved:**
\\\javascript
{
  patientId: String,
  pdfId: String,                    // Link to original document
  prescriptionSummary: String,      // Main prescription content
  doctorName: String,               // ✅ Doctor who issued prescription
  hospitalName: String,             // ✅ Hospital name
  prescriptionDate: Date,           // ✅ Date and time of prescription
  medicalNotes: String,             // Additional notes
  diagnosis: String,                // Legacy: stores prescriptionSummary
  instructions: String,             // Legacy: stores medicalNotes
  ocrEngine: 'landingai-ade',
  ocrConfidence: Number,
  extractedData: Object,            // Full Landing.AI response
  status: 'completed'
}
\\\

### B. LAB REPORT Documents
**Collection:** \labreportdocuments\
**Model:** \Server/Models/LabReportDocument.js\

**Fields Saved:**
\\\javascript
{
  patientId: String,
  pdfId: String,
  testType: String,
  testCategory: String,
  labName: String,
  reportDate: Date,
  results: [{
    testName: String,
    value: String,
    unit: String,
    referenceRange: String,
    flag: String (normal/high/low)
  }],
  ocrEngine: 'landingai-ade',
  extractedData: Object
}
\\\

### C. MEDICAL HISTORY Documents
**Collection:** \medicalhistorydocuments\
**Model:** \Server/Models/MedicalHistoryDocument.js\

**Fields Saved:**
\\\javascript
{
  patientId: String,
  pdfId: String,
  title: 'Medical History Record',
  category: String,
  medicalHistory: String,           // Medical summary
  diagnosis: String,
  doctorName: String,               // ✅ Doctor name
  hospitalName: String,             // ✅ Hospital name
  recordDate: Date,                 // ✅ Date and time
  chronicConditions: [String],      // Services provided
  ocrEngine: 'landingai-ade',
  extractedData: Object
}
\\\

### D. PDF Storage
**Collection:** \patientpdfs\
**Model:** \Server/Models/PatientPDF.js\

Stores the actual binary data of uploaded documents (images/PDFs)

## Frontend API Endpoints

### Fetching Prescriptions
**Service:** \eact/hms/src/services/prescriptionService.js\

**Endpoint:** \GET /api/scanner-enterprise/prescriptions/:patientId\

Returns prescriptions from \PrescriptionDocument\ collection with fields:
- prescriptionSummary (reason/content)
- doctorName
- hospitalName
- prescriptionDate
- pdfId (for viewing document)

### Current Frontend Display
The prescription tables in:
- \AppointmentPreviewDialog.jsx\
- \PatientDetailsDialog.jsx\
- \patientview.jsx\

Now show: **S.No, Date and Time, Hospital, Doctor, Reason, Action**

## Key Points

✅ **Extracted Fields from Landing.AI:**
- prescription_summary → prescriptionSummary (shown as "Reason")
- date_time → prescriptionDate (shown as "Date and Time")
- hospital → hospitalName (shown as "Hospital")
- doctor → doctorName (shown as "Doctor")
- medical_notes → medicalNotes

✅ **Data is stored in:** \PrescriptionDocument\ collection
✅ **Frontend fetches from:** \/api/scanner-enterprise/prescriptions/:patientId\
✅ **View action opens:** PDF using pdfId via \eportService.viewPdf()\

## Verification Flow

1. Upload → ScannedDataVerification (temporary, 24hr expiry)
2. User verifies data in DataVerificationModal
3. Confirm → PrescriptionDocument (permanent storage)
4. Reference added to Patient.medicalReports[]


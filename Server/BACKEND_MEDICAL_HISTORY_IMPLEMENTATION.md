# Backend Medical History Implementation

## Overview
Added backend support for medical history document storage and retrieval, following the same pattern as prescriptions and lab reports.

## Changes Made

### 1. New Model: MedicalHistoryDocument.js

Created a new MongoDB model for storing medical history documents with the following schema:

```javascript
{
  _id: String (UUID),
  patientId: String (ref: Patient, indexed),
  pdfId: String (ref: PatientPDF, indexed),
  
  // Extracted data
  title: String (default: 'Medical History Record'),
  category: Enum ['General', 'Chronic', 'Acute', 'Surgical', 'Family', 'Other'],
  medicalHistory: String,
  diagnosis: String,
  allergies: String,
  chronicConditions: [String],
  surgicalHistory: [String],
  familyHistory: String,
  medications: String,
  
  // Date fields
  recordDate: Date,
  reportDate: Date,
  
  // Provider info
  doctorName: String,
  hospitalName: String,
  specialty: String,
  
  // OCR metadata
  ocrText: String,
  ocrEngine: Enum ['vision', 'google-vision', 'tesseract', 'manual', 'gemini'],
  ocrConfidence: Number,
  
  // Additional metadata
  extractedData: Mixed,
  intent: String (default: 'MEDICAL_HISTORY'),
  notes: String,
  status: Enum ['processing', 'completed', 'failed'],
  uploadedBy: String (ref: User),
  uploadDate: Date
}
```

**Indexes:**
- `{ patientId: 1, uploadDate: -1 }`
- `{ pdfId: 1 }`
- `{ category: 1 }`

### 2. Updated Models/index.js

Added export for `MedicalHistoryDocument` model.

### 3. Updated routes/scanner-enterprise.js

#### a) Added Import
```javascript
const { ..., MedicalHistoryDocument, ... } = require('../Models');
```

#### b) New GET Endpoint: `/medical-history/:patientId`

**Authentication:** Required (via auth middleware)

**Query Parameters:**
- `limit` (default: 100) - Number of records to fetch
- `skip` (default: 0) - Number of records to skip (pagination)

**Response:**
```json
{
  "success": true,
  "ok": true,
  "patientId": "patient-id",
  "count": 10,
  "medicalHistory": [
    {
      "id": "...",
      "_id": "...",
      "patientId": "...",
      "pdfId": "...",
      "title": "Medical History Record",
      "category": "General",
      "intent": "MEDICAL_HISTORY",
      "medicalHistory": "Patient has history of...",
      "diagnosis": "...",
      "allergies": "...",
      "chronicConditions": [...],
      "surgicalHistory": [...],
      "familyHistory": "...",
      "medications": "...",
      "recordDate": "2024-01-15T00:00:00.000Z",
      "reportDate": "2024-01-15T00:00:00.000Z",
      "date": "2024-01-15T00:00:00.000Z",
      "doctorName": "Dr. Smith",
      "hospitalName": "City Hospital",
      "specialty": "Internal Medicine",
      "notes": "...",
      "extractedData": {...},
      "uploadDate": "2024-01-15T10:30:00.000Z",
      "uploadedBy": "user-id",
      "ocrConfidence": 0.95,
      "status": "completed"
    }
  ]
}
```

**Implementation:**
- Fetches from `MedicalHistoryDocument` collection
- Sorts by `uploadDate` (descending)
- Supports pagination via `limit` and `skip`
- Formats response with all relevant fields

#### c) Updated POST Endpoint: `/scan-medical`

**New Logic:** Automatically saves medical history documents when intent is detected as:
- `MEDICAL_HISTORY`
- `DISCHARGE` (discharge summaries)

**Storage Flow:**
1. Detects intent via AI
2. If intent is MEDICAL_HISTORY or DISCHARGE:
   - Saves PDF to `PatientPDF` collection
   - Creates `MedicalHistoryDocument` entry
   - Extracts and stores:
     - Medical history
     - Diagnosis
     - Allergies
     - Chronic conditions
     - Surgical history
     - Family history
     - Current medications
     - Doctor/hospital information

**Code Addition:**
```javascript
} else if (intentResult.primaryIntent === 'MEDICAL_HISTORY' || intentResult.primaryIntent === 'DISCHARGE') {
  const patientData = extractedData.patient || {};
  const medicalHistoryDoc = new MedicalHistoryDocument({
    patientId: patientId,
    pdfId: pdfIdString,
    title: intentResult.primaryIntent === 'DISCHARGE' ? 'Discharge Summary' : 'Medical History Record',
    category: 'General',
    medicalHistory: patientData.medicalHistory?.join(', ') || '',
    diagnosis: extractedData.labReport?.diagnosis || '',
    allergies: patientData.allergies?.join(', ') || '',
    chronicConditions: patientData.chronicConditions || [],
    surgicalHistory: patientData.surgeries || [],
    familyHistory: patientData.familyHistory || '',
    medications: patientData.currentMedications?.map(m => m.name).join(', ') || '',
    // ... (additional fields)
  });
  await medicalHistoryDoc.save();
}
```

#### d) Updated POST Endpoint: `/update-patient-id`

Added medical history document updates when patient ID changes (from temp to real ID):

```javascript
// Update MedicalHistoryDocument collection
const medicalHistoryResult = await MedicalHistoryDocument.updateMany(
  { patientId: oldPatientId },
  { $set: { patientId: newPatientId } }
);
```

**Response Now Includes:**
```json
{
  "success": true,
  "updated": 15,
  "details": {
    "patientPdf": 5,
    "prescriptions": 3,
    "labReports": 4,
    "medicalHistory": 3  // NEW
  }
}
```

## API Endpoints Summary

### GET /api/scanner-enterprise/medical-history/:patientId
- **Auth:** Required
- **Purpose:** Fetch all medical history documents for a patient
- **Returns:** Array of medical history records
- **Sorting:** By upload date (newest first)
- **Pagination:** Supported

### POST /api/scanner-enterprise/scan-medical
- **Auth:** Required
- **Purpose:** Upload and process medical document
- **New Behavior:** Auto-saves to MedicalHistoryDocument when intent is MEDICAL_HISTORY or DISCHARGE
- **Returns:** Extracted data + saved document info

### POST /api/scanner-enterprise/update-patient-id
- **Auth:** Required
- **Purpose:** Update patient ID across all document collections
- **New Behavior:** Also updates MedicalHistoryDocument collection
- **Returns:** Count of updated documents per collection

## Database Collections

### MedicalHistoryDocument Collection
- **Purpose:** Store scanned medical history documents
- **Index Strategy:** Fast queries by patientId, pdfId, and category
- **Related Collections:**
  - `PatientPDF` - Binary storage for images/PDFs
  - `Patient` - Patient master record

## Intent Detection

The system now recognizes:
- `MEDICAL_HISTORY` - General medical history documents
- `DISCHARGE` - Hospital discharge summaries (also stored as medical history)

Both are stored in the `MedicalHistoryDocument` collection with appropriate titles.

## Testing the Backend

### 1. Upload Medical History Document
```bash
curl -X POST http://localhost:5000/api/scanner-enterprise/scan-medical \
  -H "x-auth-token: YOUR_TOKEN" \
  -F "image=@medical_history.pdf" \
  -F "patientId=PATIENT_ID"
```

### 2. Fetch Medical History
```bash
curl -X GET http://localhost:5000/api/scanner-enterprise/medical-history/PATIENT_ID \
  -H "x-auth-token: YOUR_TOKEN"
```

### 3. Verify in MongoDB
```javascript
// Connect to MongoDB
use karur_db

// Check medical history documents
db.medicalhistorydocuments.find({ patientId: "PATIENT_ID" })

// Count by category
db.medicalhistorydocuments.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } }
])
```

## Migration Notes

**For Existing Deployments:**

No migration needed! The new collection will be created automatically when first document is saved.

Existing prescriptions and lab reports are unaffected.

## Error Handling

All endpoints include:
- Try-catch blocks
- Console logging with emojis for easy debugging
- Proper HTTP status codes
- Detailed error messages in response

## Logging

Look for these log messages:
- `📋 [MEDICAL HISTORY] Fetching for patient: {id}`
- `📋 Created MedicalHistoryDocument: {id}`
- `[UPDATE PATIENT ID] Updated documents: ... MedicalHistoryDocument: {count}`

## Performance Considerations

- Indexes on `patientId` ensure fast queries
- Pagination prevents large result sets
- Binary data stored separately in PatientPDF collection
- Lean queries used for better performance

## Security

- All endpoints require authentication
- User ID captured in `uploadedBy` field for audit trail
- Patient ID validated before storage
- Files cleaned up after processing

## Next Steps

Consider adding:
1. Full-text search on medical history text
2. Category-based filtering in GET endpoint
3. Date range queries
4. Export functionality (PDF generation)
5. Merge/split document operations

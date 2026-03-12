/**
 * MEDICAL HISTORY LANDING AI - QUICK REFERENCE
 * ==============================================
 * 
 * This guide shows how the Medical History integration works,
 * following the same pattern as Prescription documents.
 */

// ============================================================================
// 1. LANDING AI SCHEMA (what AI extracts)
// ============================================================================

const MEDICAL_HISTORY_SCHEMA = {
  // REQUIRED FIELDS
  medical_type: 'appointment_summary' | 'discharge_summary',
  date: 'DD/MM/YYYY',
  hospital_name: 'Hospital Name',
  doctor_name: 'Dr. Name',
  
  // SUMMARY FIELDS (at least one required based on medical_type)
  appointment_summary: 'Full appointment summary text...',
  discharge_summary: 'Full discharge summary text...',
  
  // OPTIONAL FIELDS
  time: 'HH:MM AM/PM',
  hospital_location: 'Address of hospital',
  department: 'Cardiology / Neurology / etc.',
  
  services: {
    consultation: true/false,
    lab_tests: ['Blood Test', 'X-Ray'],
    procedures: ['Surgery', 'Angioplasty'],
    admission: 'Admission details',
    discharge: 'Discharge instructions'
  },
  
  doctor_notes: 'Notes from doctor',
  observations: 'Clinical observations',
  remarks: 'Additional remarks'
};

// ============================================================================
// 2. API USAGE (same pattern as prescription)
// ============================================================================

// STEP 1: Upload and Scan Document
// ---------------------------------
/*
POST /api/scanner-enterprise/scan-medical
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  image: <PDF or Image file>
  patientId: <patient-uuid>
  documentType: "MEDICAL_HISTORY"  // This tells it to use medical history schema

Response:
{
  "success": true,
  "intent": "MEDICAL_HISTORY",
  "verificationId": "verify-patient-1234567890",
  "verificationRequired": true,
  "extractedData": {
    "extraction": {
      "medical_type": "appointment_summary",
      "appointment_summary": "Patient visited for...",
      "date": "15/02/2026",
      "time": "10:30 AM",
      "hospital_name": "City Hospital",
      "doctor_name": "Dr. Smith",
      // ... all other fields
    }
  }
}
*/

// STEP 2: Review Extracted Data (Optional)
// ----------------------------------------
/*
GET /api/scanner-enterprise/verification/:verificationId

Response:
{
  "success": true,
  "verification": {
    "dataRows": [
      {
        "fieldName": "medical_type",
        "displayLabel": "Medical Type",
        "originalValue": "appointment_summary",
        "currentValue": "appointment_summary",
        "dataType": "string",
        "category": "diagnosis",
        "confidence": 0.95
      },
      {
        "fieldName": "appointment_summary",
        "displayLabel": "Appointment Summary",
        "originalValue": "Patient visited...",
        "currentValue": "Patient visited...",
        ...
      },
      // ... 11 more rows for other fields
    ]
  }
}
*/

// STEP 3: Edit Field (Optional)
// -----------------------------
/*
PUT /api/scanner-enterprise/verification/:verificationId/row/0
Content-Type: application/json

Body:
{
  "currentValue": "discharge_summary"  // Change from appointment to discharge
}
*/

// STEP 4: Confirm and Save to Database
// ------------------------------------
/*
POST /api/scanner-enterprise/verification/:verificationId/confirm

Response:
{
  "success": true,
  "reportId": "medical-history-doc-uuid",
  "documentType": "MEDICAL_HISTORY"
}

This saves to MedicalHistoryDocument collection with all fields:
- medicalType
- appointmentSummary / dischargeSummary
- date, time
- hospitalName, hospitalLocation
- doctorName, department
- services (object)
- doctorNotes, observations, remarks
*/

// ============================================================================
// 3. DATABASE MODEL (MedicalHistoryDocument)
// ============================================================================

const SAVED_DOCUMENT_STRUCTURE = {
  _id: 'uuid',
  patientId: 'patient-uuid',
  pdfId: 'pdf-uuid',
  
  // NEW FIELDS (from Landing AI)
  medicalType: 'appointment_summary',
  appointmentSummary: 'Full text...',
  dischargeSummary: '',
  date: '15/02/2026',
  time: '10:30 AM',
  hospitalName: 'City Hospital',
  hospitalLocation: '123 Main St',
  doctorName: 'Dr. Smith',
  department: 'Cardiology',
  services: {
    consultation: true,
    lab_tests: ['Blood Test'],
    procedures: [],
    admission: '',
    discharge: ''
  },
  doctorNotes: 'Patient stable',
  observations: 'BP normal',
  remarks: 'Follow-up in 2 weeks',
  
  // LEGACY FIELDS (auto-populated)
  title: 'Appointment Summary',
  category: 'General',
  medicalHistory: 'Full text...',  // Copy of appointmentSummary
  recordDate: Date('2026-02-15'),  // Parsed from date field
  
  // METADATA
  ocrEngine: 'landingai-ade',
  ocrConfidence: 0.95,
  uploadDate: Date.now(),
  status: 'completed'
};

// ============================================================================
// 4. FETCHING MEDICAL HISTORY RECORDS
// ============================================================================

/*
GET /api/scanner-enterprise/medical-history/:patientId

Response:
{
  "success": true,
  "medicalHistory": [
    {
      "_id": "uuid-1",
      "medicalType": "appointment_summary",
      "appointmentSummary": "...",
      "date": "15/02/2026",
      "time": "10:30 AM",
      "hospitalName": "City Hospital",
      "doctorName": "Dr. Smith",
      ...
    },
    {
      "_id": "uuid-2",
      "medicalType": "discharge_summary",
      "dischargeSummary": "...",
      "date": "10/02/2026",
      ...
    }
  ]
}
*/

// ============================================================================
// 5. FRONTEND TABLE DISPLAY
// ============================================================================

// Example table structure for displaying records:
const TABLE_COLUMNS = [
  { field: 'medicalType', label: 'Type', render: (value) => <Badge>{value}</Badge> },
  { field: 'date', label: 'Date' },
  { field: 'time', label: 'Time' },
  { field: 'doctorName', label: 'Doctor' },
  { field: 'hospitalName', label: 'Hospital' },
  { field: 'department', label: 'Department' },
  { 
    field: 'summary', 
    label: 'Summary', 
    render: (row) => {
      const text = row.medicalType === 'discharge_summary' 
        ? row.dischargeSummary 
        : row.appointmentSummary;
      return text.substring(0, 100) + '...';
    }
  },
  {
    field: 'actions',
    label: 'Actions',
    render: (row) => (
      <>
        <Button onClick={() => viewDetails(row._id)}>View Details</Button>
        <Button onClick={() => downloadPDF(row.pdfId)}>Download</Button>
        <Button onClick={() => editRecord(row._id)}>Edit</Button>
        <Button onClick={() => deleteRecord(row._id)}>Delete</Button>
      </>
    )
  }
];

// ============================================================================
// 6. TESTING
// ============================================================================

/*
# Test with a medical document:
node test_medical_history_landingai.js sample_document.pdf

# Expected output:
✅ All 13 fields extracted
✅ medical_type detected (appointment_summary or discharge_summary)
✅ Date parsed correctly
✅ Services object structured properly
✅ Optional fields handled gracefully
*/

// ============================================================================
// 7. COMPARISON: OLD vs NEW SCHEMA
// ============================================================================

// OLD SCHEMA (Before):
const OLD = {
  medical_summary: 'Combined summary',
  date_time: '15/02/2026 10:30',
  hospital: 'City Hospital',
  doctor: 'Dr. Smith',
  services: ['consultation', 'lab test'],
  medical_notes: 'Notes'
};

// NEW SCHEMA (Now):
const NEW = {
  medical_type: 'appointment_summary',
  appointment_summary: 'Detailed appointment text',
  discharge_summary: '',
  date: '15/02/2026',
  time: '10:30 AM',
  hospital_name: 'City Hospital',
  hospital_location: '123 Main St',
  doctor_name: 'Dr. Smith',
  department: 'Cardiology',
  services: {
    consultation: true,
    lab_tests: ['Blood Test'],
    procedures: [],
    admission: '',
    discharge: ''
  },
  doctor_notes: 'Clinical notes',
  observations: 'Observations',
  remarks: 'Remarks'
};

// ============================================================================
// 8. KEY FEATURES
// ============================================================================

/*
✅ SAME PATTERN AS PRESCRIPTION
   - Two-phase flow: scan → verify → confirm
   - All fields editable before saving
   - Verification expiration (24 hours)

✅ 13 EXTRACTED FIELDS
   - 4 required: medical_type, date, hospital_name, doctor_name
   - 9 optional: time, location, department, summaries, notes, etc.

✅ SMART SERVICES OBJECT
   - Boolean for consultation
   - Arrays for lab_tests and procedures
   - Strings for admission/discharge details

✅ DATE HANDLING
   - Supports DD/MM/YY and DD/MM/YYYY
   - Converts to Date object for database
   - Preserves original string for display

✅ BACKWARD COMPATIBLE
   - Legacy fields still populated
   - Old queries still work
   - Gradual migration possible
*/

// ============================================================================
// END OF QUICK REFERENCE
// ============================================================================

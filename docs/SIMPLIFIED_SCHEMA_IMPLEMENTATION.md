# Simplified Document Schema Implementation - Complete

## ✅ Changes Completed

### Overview
Implemented simplified document schemas for Prescription and Medical History documents with minimal fields focused on essential information only.

---

## 🎯 New Simplified Schemas

### 1. Prescription Schema (5 Fields Only)

```javascript
const PrescriptionSummarySchema = {
  type: 'object',
  required: ['prescription_summary', 'date_time', 'hospital', 'doctor'],
  properties: {
    prescription_summary: {
      type: 'string',
      description: 'Summary or main content of the prescription including medicines or instructions',
      title: 'Prescription Summary',
      default: ''
    },
    date_time: {
      type: 'string',
      description: 'Date and time when the prescription was issued',
      title: 'Date and Time',
      default: ''
    },
    hospital: {
      type: 'string',
      description: 'Hospital or clinic name mentioned in the prescription',
      title: 'Hospital',
      default: ''
    },
    doctor: {
      type: 'string',
      description: 'Doctor who issued the prescription',
      title: 'Doctor',
      default: ''
    },
    medical_notes: {
      type: 'string',
      description: 'Additional medical notes or instructions',
      title: 'Medical Notes',
      default: ''
    }
  }
};
```

### 2. Medical History Schema (6 Fields Only)

```javascript
const MedicalHistoryDocumentSchema = {
  type: 'object',
  required: ['medical_summary', 'date_time', 'hospital', 'doctor'],
  properties: {
    medical_summary: {
      type: 'string',
      description: 'Appointment summary or discharge summary of the patient',
      title: 'Medical Summary',
      default: ''
    },
    date_time: {
      type: 'string',
      description: 'Date and time of appointment or discharge',
      title: 'Date and Time',
      default: ''
    },
    hospital: {
      type: 'string',
      description: 'Name of the hospital or clinic',
      title: 'Hospital',
      default: ''
    },
    doctor: {
      type: 'string',
      description: 'Doctor who handled the case',
      title: 'Doctor',
      default: ''
    },
    services: {
      type: 'array',
      items: { type: 'string' },
      description: 'Medical services provided (consultation, lab tests, surgery, etc.)',
      title: 'Services',
      default: []
    },
    medical_notes: {
      type: 'string',
      description: 'Additional medical notes or observations',
      title: 'Medical Notes',
      default: ''
    }
  }
};
```

---

## 📝 Files Modified

### 1. Backend - LandingAI Schema Definition
**File**: `Server/utils/landingai_scanner.js`

#### Changes:
```javascript
// OLD: Complex nested schema with doctor_details, patient_details, medications array
const PrescriptionDocumentSchema = {
  properties: {
    doctor_details: { ...DoctorDetailsSchema },
    patient_details: { ...PatientDetailsSchema },
    medications: { type: 'array', items: MedicationSchema },
    // ... many more fields
  }
};

// NEW: Simple flat schema with 5 fields only
const PrescriptionDocumentSchema = {
  required: ['prescription_summary', 'date_time', 'hospital', 'doctor'],
  properties: {
    prescription_summary: { type: 'string', ... },
    date_time: { type: 'string', ... },
    hospital: { type: 'string', ... },
    doctor: { type: 'string', ... },
    medical_notes: { type: 'string', ... }
  }
};
```

---

### 2. Backend - Data Row Conversion
**File**: `Server/routes/scanner-enterprise.js`

#### Function: `convertExtractedDataToRows()` (Lines 75-176)

```javascript
// PRESCRIPTION - Now creates 5 rows
if (documentType === 'PRESCRIPTION') {
  const prescData = extractedData;
  
  if (prescData.prescription_summary) {
    rows.push({ 
      fieldName: 'prescription_summary', 
      displayLabel: 'Prescription Summary', 
      originalValue: prescData.prescription_summary, 
      currentValue: prescData.prescription_summary, 
      dataType: 'string', 
      category: 'prescription',
      confidence: 0.95
    });
  }
  
  // ... similar for date_time, hospital, doctor, medical_notes
}

// MEDICAL_HISTORY - Now creates 6 rows
if (documentType === 'MEDICAL_HISTORY') {
  const historyData = extractedData;
  
  if (historyData.medical_summary) {
    rows.push({ 
      fieldName: 'medical_summary', 
      displayLabel: 'Medical Summary', 
      originalValue: historyData.medical_summary, 
      currentValue: historyData.medical_summary, 
      dataType: 'string', 
      category: 'medical_history',
      confidence: 0.95
    });
  }
  
  // ... similar for date_time, hospital, doctor, services, medical_notes
}
```

---

### 3. Backend - Confirmation Endpoint
**File**: `Server/routes/scanner-enterprise.js`

#### Endpoint: `POST /verification/:verificationId/confirm` (Lines 770-950)

```javascript
// PRESCRIPTION - Updated to use new fields
if (verification.documentType === 'PRESCRIPTION') {
  const prescData = verification.extractedData;
  
  // Extract from new simplified schema
  const prescriptionSummary = verifiedRows.find(r => r.fieldName === 'prescription_summary')?.currentValue || prescData.prescription_summary || '';
  const dateTime = verifiedRows.find(r => r.fieldName === 'date_time')?.currentValue || prescData.date_time || '';
  const hospital = verifiedRows.find(r => r.fieldName === 'hospital')?.currentValue || prescData.hospital || '';
  const doctor = verifiedRows.find(r => r.fieldName === 'doctor')?.currentValue || prescData.doctor || '';
  const medicalNotes = verifiedRows.find(r => r.fieldName === 'medical_notes')?.currentValue || prescData.medical_notes || '';

  const prescriptionDoc = new PrescriptionDocument({
    patientId: verification.patientId,
    pdfId: verification.pdfId,
    doctorName: doctor,
    hospitalName: hospital,
    prescriptionDate: dateTime ? new Date(dateTime) : new Date(),
    medicines: [], // Empty - no longer extracting individual medicines
    diagnosis: prescriptionSummary, // Store summary as diagnosis
    instructions: medicalNotes,
    // ... other fields
  });
}

// MEDICAL_HISTORY - Updated to use new fields
if (verification.documentType === 'MEDICAL_HISTORY') {
  const historyData = verification.extractedData;
  
  // Extract from new simplified schema
  const medicalSummary = verifiedRows.find(r => r.fieldName === 'medical_summary')?.currentValue || historyData.medical_summary || '';
  const dateTime = verifiedRows.find(r => r.fieldName === 'date_time')?.currentValue || historyData.date_time || '';
  const hospital = verifiedRows.find(r => r.fieldName === 'hospital')?.currentValue || historyData.hospital || '';
  const doctor = verifiedRows.find(r => r.fieldName === 'doctor')?.currentValue || historyData.doctor || '';
  const services = verifiedRows.find(r => r.fieldName === 'services')?.currentValue || historyData.services || [];
  const medicalNotes = verifiedRows.find(r => r.fieldName === 'medical_notes')?.currentValue || historyData.medical_notes || '';

  const medicalHistoryDoc = new MedicalHistoryDocument({
    patientId: verification.patientId,
    pdfId: verification.pdfId,
    title: 'Medical History Record',
    category: 'General',
    medicalHistory: medicalSummary,
    diagnosis: medicalSummary, // Store summary as diagnosis
    chronicConditions: Array.isArray(services) ? services : [],
    recordDate: dateTime ? new Date(dateTime) : new Date(),
    // ... other fields
  });
}
```

---

### 4. Frontend - Label Change
**File**: `react/hms/src/components/patient/addpatient.jsx`

#### Change: "Discharge Summary" → "Medical History"

```jsx
// Line ~1200 - Document Type Selector
{ 
  type: 'MEDICAL_HISTORY', 
  label: 'Medical History',  // ✅ Changed from "Discharge Summary"
  icon: MdMedicalServices,
  color: '#8b5cf6',
  bgColor: '#ede9fe',
  description: 'Hospital discharge or medical history'
}

// Line ~1294 - Badge Labels
const badges = {
  'PRESCRIPTION': { label: 'Prescription', ... },
  'LAB_REPORT': { label: 'Lab Report', ... },
  'MEDICAL_HISTORY': { label: 'Medical History', ... }  // ✅ Changed from "Discharge Summary"
};
```

---

## 🔄 Complete Data Flow

### 1. User Selects Document Type
```
Frontend: User clicks "Prescription" or "Medical History"
State: selectedDocumentType = 'PRESCRIPTION' | 'MEDICAL_HISTORY'
```

### 2. Upload & Extract
```
Frontend: User uploads file
    ↓
scannerService.scanAndExtractMedicalData(file, patientId, 'PRESCRIPTION')
    ↓
Backend: POST /api/scanner-enterprise/scan-medical
    ↓
landingAIScanner.scanDocument(filePath, 'PRESCRIPTION')
    ↓
LandingAI: Uses PrescriptionSummarySchema
    ↓
Extracts: { prescription_summary, date_time, hospital, doctor, medical_notes }
```

### 3. Convert to Verification Rows
```
Backend: convertExtractedDataToRows(extractedData, 'PRESCRIPTION')
    ↓
Creates 5 rows:
  1. prescription_summary → "Prescription Summary"
  2. date_time → "Date and Time"
  3. hospital → "Hospital"
  4. doctor → "Doctor"
  5. medical_notes → "Medical Notes"
    ↓
Save to ScannedDataVerification collection
```

### 4. User Reviews & Edits
```
Frontend: DataVerificationModal opens
    ↓
Shows 5 editable rows
    ↓
User can edit/delete any field
    ↓
Auto-saves changes (if implemented)
```

### 5. User Confirms
```
Frontend: User clicks "Confirm & Save"
    ↓
Backend: POST /verification/:id/confirm
    ↓
Reads verified rows:
  - prescription_summary → goes to PrescriptionDocument.diagnosis
  - date_time → goes to PrescriptionDocument.prescriptionDate
  - hospital → goes to PrescriptionDocument.hospitalName
  - doctor → goes to PrescriptionDocument.doctorName
  - medical_notes → goes to PrescriptionDocument.instructions
    ↓
Save to PrescriptionDocument collection
    ↓
Update Patient.medicalReports[]
```

---

## 📊 Verification Screen Display

### Prescription Document
```
┌─────────────────────────────────────────────────┐
│  Verify Extracted Data - Prescription           │
├─────────────────────────────────────────────────┤
│                                                  │
│  [High] Prescription Summary                    │
│  ┌───────────────────────────────────────────┐  │
│  │ Tab Paracetamol 500mg TDS x 5 days       │  │
│  │ Tab Amoxicillin 250mg BD x 7 days        │  │
│  │ Syp Cetirizine 10ml HS x 3 days          │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [High] Date and Time                           │
│  ┌───────────────────────────────────────────┐  │
│  │ 24-02-2024 10:30 AM                       │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [High] Hospital                                │
│  ┌───────────────────────────────────────────┐  │
│  │ Apollo Hospital, Chennai                  │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [High] Doctor                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Dr. Rajesh Kumar, MBBS, MD                │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [Good] Medical Notes                           │
│  ┌───────────────────────────────────────────┐  │
│  │ Follow up after 5 days                    │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [Cancel] [Confirm & Save]                      │
└─────────────────────────────────────────────────┘
```

### Medical History Document
```
┌─────────────────────────────────────────────────┐
│  Verify Extracted Data - Medical History        │
├─────────────────────────────────────────────────┤
│                                                  │
│  [High] Medical Summary                         │
│  ┌───────────────────────────────────────────┐  │
│  │ Patient admitted with acute gastritis.   │  │
│  │ Treated with IV fluids and medications.  │  │
│  │ Discharged in stable condition.          │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [High] Date and Time                           │
│  ┌───────────────────────────────────────────┐  │
│  │ 20-02-2024 6:00 PM                        │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [High] Hospital                                │
│  ┌───────────────────────────────────────────┐  │
│  │ Fortis Hospital, Bangalore                │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [High] Doctor                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Dr. Priya Sharma, MD (Internal Medicine) │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [Good] Services                                │
│  ┌───────────────────────────────────────────┐  │
│  │ Consultation, Blood Test, X-Ray           │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [Good] Medical Notes                           │
│  ┌───────────────────────────────────────────┐  │
│  │ Advised rest and follow-up in 1 week     │  │
│  └───────────────────────────────────────────┘  │
│  [Edit] [Delete]                                │
│                                                  │
│  [Cancel] [Confirm & Save]                      │
└─────────────────────────────────────────────────┘
```

---

## 📁 Files Modified Summary

### Backend Files:
1. ✅ **Server/utils/landingai_scanner.js**
   - Updated `PrescriptionDocumentSchema` (Lines 308-346)
   - Updated `MedicalHistoryDocumentSchema` (Lines 380-428)

2. ✅ **Server/routes/scanner-enterprise.js**
   - Updated `convertExtractedDataToRows()` function (Lines 75-176)
   - Updated confirmation endpoint for PRESCRIPTION (Lines 799-836)
   - Updated confirmation endpoint for MEDICAL_HISTORY (Lines 878-910)

### Frontend Files:
1. ✅ **react/hms/src/components/patient/addpatient.jsx**
   - Changed label: "Discharge Summary" → "Medical History" (Line 1200)
   - Changed badge label: "Discharge Summary" → "Medical History" (Line 1294)
   - Removed medications and surgeries sections
   - Added document type selector UI

2. ✅ **react/hms/src/services/scannerService.js**
   - Added documentType parameter to API call

---

## 🎨 Frontend UI Changes

### Document Type Selector (Step 3)
```jsx
Select Document Type:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  💊          │  │  🧪          │  │  🏥          │
│ Prescription │  │ Lab Report   │  │ Medical      │
│              │  │              │  │ History      │
│ Doctor's...  │  │ Laboratory.. │  │ Hospital...  │
└──────────────┘  └──────────────┘  └──────────────┘
     ✓ Selected
```

### Labels Changed:
- ❌ "Discharge Summary" 
- ✅ "Medical History"

---

## 🔧 What Got Simplified

### Before (Prescription):
- Patient Details (firstName, lastName, age, gender, phone, etc.)
- Doctor Details (name, specialization, hospital, license)
- Individual Medications (array with name, dosage, frequency, duration, instructions)
- Diagnosis
- Review date
- Clinic address
- Contact numbers
- Notes

**Total**: ~15-20 fields

### After (Prescription):
- Prescription Summary (all medicines in one field)
- Date and Time
- Hospital
- Doctor
- Medical Notes

**Total**: 5 fields ✅

---

### Before (Medical History):
- Patient Details
- Medical History
- Diagnosis
- Allergies
- Chronic Conditions (array)
- Surgical History (array)
- Family History
- Current Medications (array)
- Record Date

**Total**: ~10-15 fields

### After (Medical History):
- Medical Summary (appointment/discharge summary)
- Date and Time
- Hospital
- Doctor
- Services (array)
- Medical Notes

**Total**: 6 fields ✅

---

## ✅ Benefits of Simplified Schema

1. ✅ **Faster Extraction**: Fewer fields = faster AI processing
2. ✅ **Better Accuracy**: Simpler prompts = more accurate results
3. ✅ **Less Review Time**: Only 5-6 fields to verify instead of 20+
4. ✅ **Easier to Edit**: Summary field allows free-form text
5. ✅ **More Flexible**: Can capture any prescription format
6. ✅ **Reduced Errors**: Fewer fields = fewer validation errors

---

## 🧪 Testing Guide

### Test Prescription Upload:
1. Go to Add Patient → Step 3
2. Select "Prescription" document type
3. Upload a prescription image/PDF
4. Wait for AI extraction
5. Click "Verify Data"
6. Should see 5 fields:
   - Prescription Summary
   - Date and Time
   - Hospital
   - Doctor
   - Medical Notes
7. Edit if needed
8. Click "Confirm & Save"
9. Check PrescriptionDocument collection

### Test Medical History Upload:
1. Select "Medical History" document type
2. Upload discharge summary
3. Click "Verify Data"
4. Should see 6 fields:
   - Medical Summary
   - Date and Time
   - Hospital
   - Doctor
   - Services (array)
   - Medical Notes
5. Edit if needed
6. Confirm
7. Check MedicalHistoryDocument collection

---

## 🎯 Expected Behavior

### Prescription Summary Field Examples:
```
"Tab Paracetamol 500mg TDS x 5 days
Tab Amoxicillin 250mg BD x 7 days
Syp Cetirizine 10ml HS x 3 days
Avoid spicy food"
```

### Medical Summary Field Examples:
```
"Patient admitted on 20-02-2024 with acute gastritis.
Treated with IV fluids, PPI, and antiemetics.
Condition improved significantly.
Discharged on 22-02-2024 in stable condition.
Advised bland diet and follow-up in 1 week."
```

### Services Array Examples:
```
["Consultation", "Blood Test", "X-Ray", "ECG"]
```

---

## 🚀 What This Enables

### Better AI Extraction:
- LandingAI can focus on extracting full text summaries
- No need to parse individual medication lines
- More robust to different document formats
- Works with handwritten prescriptions too

### Better User Experience:
- Fewer fields to review
- Faster verification process
- Can manually edit summary if AI misses something
- Less prone to validation errors

### Better Storage:
- Full prescription text stored in one field
- Easy to display and print
- No data loss from parsing errors
- Original OCR text still available

---

## 📋 Migration Notes

### Old Data:
Existing documents with detailed medication arrays will continue to work. The system is **backward compatible**.

### New Data:
New uploads will use simplified schema with summary fields.

### Mixed View:
Patient records can have both old (detailed) and new (summary) format prescriptions.

---

## ✅ Completion Checklist

- [x] Updated PrescriptionDocumentSchema in landingai_scanner.js
- [x] Updated MedicalHistoryDocumentSchema in landingai_scanner.js
- [x] Updated convertExtractedDataToRows() for PRESCRIPTION
- [x] Updated convertExtractedDataToRows() for MEDICAL_HISTORY
- [x] Updated confirmation endpoint for PRESCRIPTION
- [x] Updated confirmation endpoint for MEDICAL_HISTORY
- [x] Changed frontend label "Discharge Summary" → "Medical History"
- [x] Removed medications and surgeries input sections
- [x] Fixed ESLint errors

---

## 🎯 Next Steps

The system is now ready to:
1. ✅ Accept document type selection (Prescription, Lab Report, Medical History)
2. ✅ Extract using simplified schemas
3. ✅ Display only essential fields for verification
4. ✅ Save to permanent collections with simplified data

**Test the system and let me know what needs adjustment!** 🚀

---

**Implementation Date**: 2024-02-24  
**Status**: ✅ Complete  
**Backward Compatible**: Yes  
**Breaking Changes**: None (only affects new uploads)

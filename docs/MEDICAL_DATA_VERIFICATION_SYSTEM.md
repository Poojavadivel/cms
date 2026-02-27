# Medical Data Verification System - Complete Implementation

## Overview
This document describes the complete implementation of the medical data verification system for the HMS application. The system allows users to scan medical documents (prescriptions, lab reports, medical history) using LandingAI, review the extracted data in a verification modal, edit/delete rows, and confirm to save the data to the original collections.

---

## Architecture

### Flow Diagram
```
User uploads document 
    ↓
LandingAI processes & extracts data
    ↓
Data saved to ScannedDataVerification (dummy/staging collection)
    ↓
User clicks "Verify Data" info button
    ↓
Verification Modal opens showing extracted data rows
    ↓
User can:
  - Edit row values
  - Delete rows
  - Cancel/Reject entire scan
    ↓
User clicks "Confirm & Save"
    ↓
Backend validates and saves to original collections:
  - PrescriptionDocument
  - LabReportDocument  
  - MedicalHistoryDocument
    ↓
Patient record updated with medical reports
```

---

## Backend Implementation

### 1. Database Model: ScannedDataVerification
**File**: `Server/Models/ScannedDataVerification.js`

**Purpose**: Temporary staging collection for unverified extracted data

**Key Features**:
- Auto-expires after 24 hours if not verified
- Stores extracted data as structured rows
- Tracks modification status for each row
- Supports soft-delete (marking rows as deleted)

**Schema Fields**:
```javascript
{
  patientId: String (required, indexed)
  sessionId: String (unique, indexed)
  documentType: 'PRESCRIPTION' | 'LAB_REPORT' | 'MEDICAL_HISTORY' | 'GENERAL'
  pdfId: String (reference to PatientPDF)
  fileName: String
  extractedData: Object (raw LandingAI response)
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'partially_verified'
  dataRows: [{
    fieldName: String
    displayLabel: String
    originalValue: Mixed
    currentValue: Mixed
    dataType: 'string' | 'number' | 'date' | 'array' | 'object'
    isModified: Boolean
    isDeleted: Boolean
    isVerified: Boolean
    confidence: Number (0-1)
    category: 'patient_details' | 'medications' | 'vitals' | 'diagnosis' | 'lab_results' | 'other'
  }]
  metadata: {
    ocrEngine: String
    ocrConfidence: Number
    processingTimeMs: Number
    markdown: String
  }
  uploadedBy: ObjectId (User)
  verifiedBy: ObjectId (User)
  createdAt: Date (with TTL index - 24 hours)
  verifiedAt: Date
}
```

### 2. Updated Scanner Route
**File**: `Server/routes/scanner-enterprise.js`

**Modified Endpoints**:

#### POST `/api/scanner/scan-medical`
**Change**: Now saves to verification collection instead of final collections
- Processes document with LandingAI
- Converts extracted data to structured rows
- Saves to `ScannedDataVerification` with status 'pending'
- Returns `verificationId` and `verificationRequired: true`

#### New Endpoints:

##### GET `/api/scanner/verification/:verificationId`
**Purpose**: Fetch verification session data
**Response**:
```json
{
  "success": true,
  "verification": {
    "id": "...",
    "patientId": "...",
    "sessionId": "...",
    "documentType": "PRESCRIPTION",
    "fileName": "prescription.pdf",
    "dataRows": [...],
    "verificationStatus": "pending",
    "metadata": {...},
    "createdAt": "2024-...",
    "expiresAt": "2024-..."
  }
}
```

##### GET `/api/scanner/verification/patient/:patientId`
**Purpose**: Get all pending verifications for a patient
**Response**: Array of verification sessions

##### PUT `/api/scanner/verification/:verificationId/row/:rowIndex`
**Purpose**: Update a specific data row
**Body**:
```json
{
  "currentValue": "Updated value",
  "isDeleted": false
}
```

##### DELETE `/api/scanner/verification/:verificationId/row/:rowIndex`
**Purpose**: Mark a row as deleted (soft delete)

##### POST `/api/scanner/verification/:verificationId/confirm`
**Purpose**: Verify and save data to original collections
**Process**:
1. Fetch verification session
2. Filter out deleted rows
3. Build final data structure from verified rows
4. Save to appropriate collection based on document type:
   - `PrescriptionDocument`
   - `LabReportDocument`
   - `MedicalHistoryDocument`
5. Update patient's `medicalReports` array
6. Mark verification as 'verified'

##### POST `/api/scanner/verification/:verificationId/reject`
**Purpose**: Reject and discard verification
**Process**:
1. Mark verification as 'rejected'
2. Optionally delete the PDF file

### 3. Data Row Conversion Function
**Function**: `convertExtractedDataToRows(extractedData, documentType)`

**Purpose**: Transforms raw LandingAI extraction into structured verification rows

**Example for PRESCRIPTION**:
```javascript
// Input: LandingAI extracted data
{
  patient_details: { firstName: "John", age: 45 },
  doctor_details: { name: "Dr. Smith" },
  diagnosis: "Diabetes",
  medications: [
    { name: "Metformin", dose: "500mg", frequency: "Twice daily" }
  ]
}

// Output: Structured rows
[
  {
    fieldName: 'patient_firstName',
    displayLabel: 'First Name',
    originalValue: 'John',
    currentValue: 'John',
    dataType: 'string',
    category: 'patient_details'
  },
  {
    fieldName: 'medication_0',
    displayLabel: 'Medication 1',
    originalValue: { name: "Metformin", dose: "500mg", ... },
    currentValue: { name: "Metformin", dose: "500mg", ... },
    dataType: 'object',
    category: 'medications'
  },
  ...
]
```

---

## Frontend Implementation

### 1. Verification Modal Component
**File**: `react/hms/src/components/modals/DataVerificationModal.jsx`

**Key Features**:
- Beautiful animated UI with category badges
- Inline editing for each row
- JSON editor for complex objects
- Statistics panel showing active/deleted/modified rows
- Real-time updates to backend
- Confidence score display
- Expiration timer

**Props**:
```javascript
{
  isOpen: boolean
  onClose: function
  verificationId: string
  onConfirm: function(result)
}
```

**User Actions**:
1. **View Data**: See all extracted fields organized by category
2. **Edit Row**: Click edit button, modify value, save
3. **Delete Row**: Click delete button, row is marked as deleted
4. **Confirm & Save**: Validates and saves to original collections
5. **Reject & Discard**: Cancels verification and removes data

**UI Components**:
- **Category Badges**: Color-coded by data type (patient, medications, vitals, etc.)
- **Modified Badge**: Shows which rows were edited
- **Deleted State**: Grayed out with strikethrough
- **Edit Mode**: Inline input/textarea for editing
- **Stats Row**: Shows counts of total/active/deleted/modified rows
- **Info Banner**: Shows confidence score and expiration time

### 2. Updated Add Patient Component
**File**: `react/hms/src/components/patient/addpatient.jsx`

**Changes Made**:

#### 1. Added Import
```javascript
import DataVerificationModal from '../modals/DataVerificationModal';
import { MdInfo } from 'react-icons/md';
```

#### 2. Added State
```javascript
const [verificationModalOpen, setVerificationModalOpen] = useState(false);
const [currentVerificationId, setCurrentVerificationId] = useState(null);
```

#### 3. Updated File Upload Handler
Now stores verification ID in uploaded files:
```javascript
setUploadedFiles(prev => [...prev, { 
  file, 
  name: file.name, 
  scannedResult,
  verificationId: scannedResult.verificationId,
  requiresVerification: scannedResult.verificationRequired || false
}]);
```

#### 4. Updated Uploaded Files Display
Added "Verify Data" button with info icon:
```jsx
{file.requiresVerification && file.verificationId && (
  <button
    onClick={() => {
      setCurrentVerificationId(file.verificationId);
      setVerificationModalOpen(true);
    }}
    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-[#207DC0] rounded-lg hover:bg-blue-100 transition-all font-bold text-xs"
  >
    <MdInfo className="text-base" /> Verify Data
  </button>
)}
```

#### 5. Added Modal Component
```jsx
<DataVerificationModal
  isOpen={verificationModalOpen}
  onClose={() => {
    setVerificationModalOpen(false);
    setCurrentVerificationId(null);
  }}
  verificationId={currentVerificationId}
  onConfirm={(result) => {
    console.log('Data verified and saved:', result);
  }}
/>
```

### 3. Updated Scanner Service
**File**: `react/hms/src/services/scannerService.js`

**Changes**:
Added verification fields to response:
```javascript
return {
  // ... existing fields ...
  verificationRequired: result.verificationRequired || false,
  verificationId: result.verificationId || null,
  // ...
};
```

### 4. CSS Styling
**File**: `react/hms/src/components/modals/DataVerificationModal.css`

**Key Styles**:
- Glassmorphism effects
- Color-coded category badges
- Smooth animations and transitions
- Responsive design (mobile-friendly)
- Professional medical UI aesthetics

---

## Usage Flow

### For Users (Hospital Staff)

1. **Upload Document**
   - Navigate to Add Patient → Medical Records section
   - Click "Scan Medical Records"
   - Upload prescription/lab report/medical history

2. **Document Processing**
   - System shows "Scanning document with AI..."
   - LandingAI processes the document (2-5 seconds)
   - Success message appears with "Verify Data" button

3. **Verify Extracted Data**
   - Click blue "Verify Data" button next to uploaded file
   - Verification modal opens showing all extracted fields
   - Review each row for accuracy

4. **Edit Data (if needed)**
   - Click edit icon on any row
   - Modify the value
   - Click "Save" to update

5. **Delete Incorrect Data**
   - Click delete icon on any incorrect row
   - Row is marked as deleted (can't be recovered)

6. **Confirm and Save**
   - Review statistics (Active/Deleted/Modified counts)
   - Click "Confirm & Save" button
   - Data is saved to permanent collections
   - Patient record is updated

7. **Or Reject**
   - Click "Reject & Discard" to cancel
   - All data is removed

### For Developers

#### Adding New Document Types

1. **Update convertExtractedDataToRows function**:
```javascript
else if (documentType === 'NEW_TYPE') {
  // Add conversion logic
  rows.push({
    fieldName: 'field_name',
    displayLabel: 'Display Label',
    originalValue: value,
    currentValue: value,
    dataType: 'string',
    category: 'category_name'
  });
}
```

2. **Update confirmation handler**:
```javascript
else if (verification.documentType === 'NEW_TYPE') {
  // Create new document type
  const newDoc = new NewDocumentModel({
    // Map verified rows to model fields
  });
  await newDoc.save();
}
```

#### Extending Data Categories

Add new categories to the enum in `ScannedDataVerification.js`:
```javascript
category: { 
  type: String, 
  enum: ['patient_details', 'medications', 'vitals', 'diagnosis', 'lab_results', 'imaging', 'other'],
  default: 'other'
}
```

Update color mapping in `DataVerificationModal.jsx`:
```javascript
const getCategoryColor = (category) => {
  const colors = {
    // ... existing colors ...
    imaging: '#a855f7',
    // ...
  };
  return colors[category] || colors.other;
};
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/scanner/scan-medical` | Upload and scan document |
| GET | `/api/scanner/verification/:verificationId` | Get verification data |
| GET | `/api/scanner/verification/patient/:patientId` | List pending verifications |
| PUT | `/api/scanner/verification/:verificationId/row/:rowIndex` | Update a row |
| DELETE | `/api/scanner/verification/:verificationId/row/:rowIndex` | Delete a row |
| POST | `/api/scanner/verification/:verificationId/confirm` | Confirm and save |
| POST | `/api/scanner/verification/:verificationId/reject` | Reject verification |

---

## Database Collections

### Staging/Temporary
- **ScannedDataVerification**: Stores unverified extracted data (auto-expires after 24h)

### Permanent (After Verification)
- **PrescriptionDocument**: Verified prescriptions
- **LabReportDocument**: Verified lab reports
- **MedicalHistoryDocument**: Verified medical history
- **PatientPDF**: PDF file storage
- **Patient**: Updated with medical reports array

---

## Security Features

1. **Authentication**: All endpoints require auth token
2. **User Tracking**: Stores who uploaded and verified data
3. **Auto-Expiration**: Unverified data expires after 24 hours
4. **Audit Trail**: Tracks original vs modified values
5. **Soft Delete**: Deleted rows are marked, not removed (audit trail)

---

## Testing

### Manual Testing Steps

1. **Test Upload**:
   ```
   - Upload a prescription image
   - Verify verificationId is returned
   - Check MongoDB for ScannedDataVerification document
   ```

2. **Test Verification Modal**:
   ```
   - Click "Verify Data" button
   - Verify all fields are displayed correctly
   - Test editing a row
   - Test deleting a row
   - Check stats are accurate
   ```

3. **Test Confirmation**:
   ```
   - Click "Confirm & Save"
   - Check PrescriptionDocument collection
   - Verify Patient.medicalReports is updated
   - Verify verification status is 'verified'
   ```

4. **Test Rejection**:
   ```
   - Upload and verify a document
   - Click "Reject & Discard"
   - Verify verification status is 'rejected'
   - Verify PDF is deleted (if configured)
   ```

---

## Troubleshooting

### Issue: Verification modal not opening
**Solution**: Check browser console for errors, verify verificationId is present

### Issue: Data not saving on confirm
**Solution**: Check server logs for validation errors, verify all required fields are present

### Issue: Rows not updating
**Solution**: Verify API endpoints are returning success, check network tab

### Issue: Auto-expiration not working
**Solution**: Ensure MongoDB TTL index is created (check with `db.scanneddataverifications.getIndexes()`)

---

## Future Enhancements

1. **Batch Verification**: Verify multiple documents at once
2. **Collaborative Review**: Multiple users can review before confirmation
3. **Version History**: Track all changes made during verification
4. **AI Confidence Threshold**: Auto-approve high-confidence extractions
5. **Custom Field Mapping**: Allow users to map extracted fields to custom patient fields
6. **Mobile App Integration**: Native mobile verification interface
7. **Voice Commands**: Edit fields using voice input
8. **Smart Suggestions**: AI suggests corrections based on patient history

---

## Support

For issues or questions, contact the development team or refer to:
- Backend documentation: `Server/routes/scanner-enterprise.js`
- Frontend documentation: `react/hms/src/components/modals/DataVerificationModal.jsx`
- Model documentation: `Server/Models/ScannedDataVerification.js`

---

**Last Updated**: 2024-02-22
**Version**: 1.0.0
**Author**: HMS Development Team

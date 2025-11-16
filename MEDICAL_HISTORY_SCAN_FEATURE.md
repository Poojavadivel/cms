# Medical History Scan Feature Implementation

## Overview
Added medical history report scanning and display functionality to the HMS application, similar to the existing pharmacy and pathology report features.

## Changes Made

### 1. API Constants (`lib/Services/api_constants.dart`)
- Added new endpoint for fetching medical history reports:
  ```dart
  static String getMedicalHistory(String patientId) => '$_base/medical-history/$patientId';
  ```

### 2. Auth Service (`lib/Services/Authservices.dart`)
- Added `getMedicalHistory()` method to fetch medical history reports from the backend
- Implements same pattern as `getPrescriptions()` and `getLabReports()`
- Supports dedicated endpoint with fallback to combined reports endpoint
- Filters reports by intent: 'MEDICAL_HISTORY' or 'MEDICAL HISTORY'

**Method signature:**
```dart
Future<List<Map<String, dynamic>>> getMedicalHistory({
  required String patientId, 
  int limit = 50, 
  int page = 0
})
```

### 3. Doctor Appointment Preview (`lib/Modules/Doctor/widgets/doctor_appointment_preview.dart`)

#### Updated `_PatientProfileTab` Widget
- Replaced sample data with real API integration
- Now fetches medical history from backend using `AuthService.getMedicalHistory()`
- Added loading states, error handling, and empty states
- Displays data using new `_MedicalHistoryTable` component

#### New Components Added:

**a) `_MedicalHistoryTable`**
- Displays medical history records in a tabular format
- Features:
  - Search functionality across title, notes, category, and date
  - Category filter dropdown (All, General, Chronic, Acute)
  - Pagination (10 items per page)
  - View document action
  - Extracts data from various backend field structures

**b) `_MedicalHistoryImageViewer`**
- Dialog for viewing medical history document images
- Features:
  - Image zoom/pan with `InteractiveViewer`
  - Uses MongoDB PDF storage via public endpoint
  - Loading and error states
  - Header with record title and date

**c) `_MedicalHistoryDetailsDialog`**
- Dialog for displaying extracted medical history data (when PDF not available)
- Shows:
  - Medical History text
  - Diagnosis
  - Allergies
- Clean, structured layout with proper formatting

## Data Flow

```
1. Patient Form (enterprise_patient_form.dart)
   └─> User uploads medical history document (image/PDF)
   └─> _pickAndUploadImage() → _processImageWithScanner()
   └─> scanAndExtractMedicalDataFromXFile() in AuthService
   └─> Backend /api/scanner-enterprise/scan-medical
   └─> AI extracts: medicalHistory, allergies, diagnosis
   └─> Stored in MongoDB with patient ID

2. Doctor Appointment Preview
   └─> Opens dialog with patient details
   └─> Medical History tab (_PatientProfileTab)
   └─> _fetchMedicalHistory() calls AuthService.getMedicalHistory()
   └─> Backend /api/scanner-enterprise/medical-history/{patientId}
   └─> Displays in _MedicalHistoryTable
   └─> User can view PDF or extracted data
```

## Backend Endpoint Expected

The implementation expects a backend endpoint:
```
GET /api/scanner-enterprise/medical-history/{patientId}
```

**Expected Response:**
```json
{
  "success": true,
  "medicalHistory": [
    {
      "id": "...",
      "pdfId": "...",
      "patientId": "...",
      "intent": "MEDICAL_HISTORY",
      "title": "Medical History Record",
      "category": "General",
      "reportDate": "2024-01-15",
      "uploadDate": "2024-01-15T10:30:00Z",
      "extractedData": {
        "medicalHistory": "Patient has history of...",
        "diagnosis": "...",
        "allergies": "..."
      },
      "notes": "..."
    }
  ]
}
```

**Fallback:** If dedicated endpoint not available, filters from `/api/scanner-enterprise/reports/{patientId}` by intent type.

## UI Features

### Medical History Tab Display
- **Table Headers:** Title, Date, Category, Notes, Document
- **Search:** Real-time search across all fields
- **Filter:** Category dropdown (All/General/Chronic/Acute)
- **Pagination:** 10 records per page with prev/next controls
- **Actions:** View icon to open document or details dialog

### Empty States
- "No medical history found" with upload instructions
- Error state with retry button

### Document Viewer
- Zoomable/pannable PDF/image viewer
- Proper authentication headers
- Graceful error handling

## Testing Recommendations

1. **Upload Medical History Document:**
   - Go to Admin → Patients → Add/Edit Patient
   - Navigate to "Medical History" step
   - Upload medical history document (image/PDF)
   - Verify AI extraction populates fields

2. **View in Doctor Appointment:**
   - Go to Doctor → Appointments
   - Click on any patient
   - Navigate to "Medical History" tab
   - Verify records display correctly
   - Click "View" to see document

3. **Test Edge Cases:**
   - No medical history records
   - Network errors
   - Large number of records (pagination)
   - Search and filter functionality

## Integration Points

The feature integrates with:
- ✅ Patient registration form (scanning upload)
- ✅ Scanner backend API
- ✅ MongoDB storage for PDFs
- ✅ AI extraction service (Gemini)
- ✅ Doctor appointment preview dialog
- ✅ Generic table component

## Notes

- Follows same pattern as Prescriptions and Lab Reports tabs
- Uses existing `GenericDataTable` component for consistency
- Maintains visual design consistency with other tabs
- Properly handles web and mobile platforms
- All string literals use proper null-safety

## Files Modified

### Frontend (Flutter)
1. `lib/Services/api_constants.dart` - Added endpoint
2. `lib/Services/Authservices.dart` - Added fetch method
3. `lib/Modules/Doctor/widgets/doctor_appointment_preview.dart` - Updated tab and added table components

### Backend (Node.js)
1. `Server/Models/MedicalHistoryDocument.js` - New model (Created)
2. `Server/Models/index.js` - Export new model
3. `Server/routes/scanner-enterprise.js` - Added endpoint and storage logic
   - Added `/medical-history/:patientId` GET endpoint
   - Updated `/scan-medical` POST to save medical history documents
   - Updated `/update-patient-id` POST to include medical history updates

**Total Lines Changed:** 
- Frontend: ~550 lines
- Backend: ~120 lines

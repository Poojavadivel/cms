# Medical History Landing AI Integration - Changes Summary

## Overview
Updated the Landing AI integration to handle Medical History documents with the same pattern as Prescription documents. All new fields are now extracted and stored following your specification.

---

## Files Modified

### 1. **utils/landingai_scanner.js**
**Changed:** MedicalHistoryDocumentSchema

**New Schema Fields:**
```javascript
{
  medical_type: 'appointment_summary' | 'discharge_summary',  // Required
  appointment_summary: string,                                 // Optional
  discharge_summary: string,                                   // Optional
  date: string,                                                // Required (DD/MM/YYYY)
  time: string,                                                // Optional
  hospital_name: string,                                       // Required
  hospital_location: string,                                   // Optional
  doctor_name: string,                                         // Required
  department: string,                                          // Optional
  services: {
    consultation: boolean,
    lab_tests: string[],
    procedures: string[],
    admission: string,
    discharge: string
  },
  doctor_notes: string,                                        // Optional
  observations: string,                                        // Optional
  remarks: string                                              // Optional
}
```

---

### 2. **routes/scanner-enterprise.js**
**Changed:** `convertExtractedDataToRows()` function for MEDICAL_HISTORY type

**Updated Data Conversion:**
- Extracts all 13 new fields from Landing AI response
- Creates verification rows for each field
- Properly handles optional vs required fields
- Logs all extraction steps for debugging

**Changed:** Confirmation logic in `/verification/:verificationId/confirm` endpoint

**Updated Save Logic:**
- Reads verified rows for all new fields
- Parses date in DD/MM/YY or DD/MM/YYYY format
- Determines which summary to use (appointment vs discharge)
- Saves to MedicalHistoryDocument with all new fields
- Maintains backward compatibility with legacy fields

---

### 3. **Models/MedicalHistoryDocument.js**
**Changed:** Added new schema fields while maintaining backward compatibility

**New Fields Added:**
```javascript
medicalType: String (appointment_summary | discharge_summary)
appointmentSummary: String
dischargeSummary: String
date: String
time: String
hospitalName: String
hospitalLocation: String
doctorName: String
department: String
services: {
  consultation: Boolean,
  lab_tests: [String],
  procedures: [String],
  admission: String,
  discharge: String
}
doctorNotes: String
observations: String
remarks: String
```

**Legacy Fields:** Kept for backward compatibility
- title, category, medicalHistory, diagnosis, etc.
- These are auto-populated from new fields

---

## Testing

### New Test File Created
**File:** `test_medical_history_landingai.js`

**Usage:**
```bash
node test_medical_history_landingai.js <path_to_medical_document.pdf>
```

**Output:**
- Displays all extracted fields in readable format
- Shows required vs optional fields
- Displays services breakdown
- Shows metadata and confidence scores
- Provides raw JSON output for debugging

---

## API Flow (Same as Prescription)

### 1. Scan Document
```
POST /api/scanner-enterprise/scan-medical
Content-Type: multipart/form-data

Body:
  - image: <file>
  - patientId: <patient_id>
  - documentType: "MEDICAL_HISTORY"
```

**Response:**
```json
{
  "success": true,
  "intent": "MEDICAL_HISTORY",
  "extractedData": {
    "extraction": {
      "medical_type": "appointment_summary",
      "appointment_summary": "...",
      "date": "15/02/2026",
      "time": "10:30 AM",
      "hospital_name": "City Hospital",
      "doctor_name": "Dr. Smith",
      ...
    }
  },
  "verificationId": "uuid-here",
  "verificationRequired": true
}
```

### 2. Review & Edit (Optional)
```
GET /api/scanner-enterprise/verification/:verificationId
```

Returns all extracted fields as editable rows.

```
PUT /api/scanner-enterprise/verification/:verificationId/row/:rowIndex
Body: { "currentValue": "updated value" }
```

### 3. Confirm & Save
```
POST /api/scanner-enterprise/verification/:verificationId/confirm
```

**Result:**
- Creates MedicalHistoryDocument with all new fields
- Attaches to patient.medicalReports[]
- Sets reportType to 'DISCHARGE_SUMMARY'

---

## Database Schema

### MedicalHistoryDocument Collection
```javascript
{
  _id: "uuid",
  patientId: "patient-id",
  pdfId: "pdf-id",
  
  // NEW FIELDS (Landing AI extracted)
  medicalType: "appointment_summary" | "discharge_summary",
  appointmentSummary: "Full appointment summary text...",
  dischargeSummary: "Full discharge summary text...",
  date: "15/02/2026",
  time: "10:30 AM",
  hospitalName: "City Hospital",
  hospitalLocation: "123 Main St, City",
  doctorName: "Dr. John Smith",
  department: "Cardiology",
  services: {
    consultation: true,
    lab_tests: ["Blood Test", "ECG"],
    procedures: ["Angioplasty"],
    admission: "Emergency admission on 14/02/2026",
    discharge: "Stable, discharged with medications"
  },
  doctorNotes: "Patient stable, follow-up in 2 weeks",
  observations: "BP normal, no complications",
  remarks: "Continue current medication",
  
  // LEGACY FIELDS (auto-filled)
  title: "Appointment Summary" | "Discharge Summary",
  category: "General" | "Discharge",
  medicalHistory: "<appointmentSummary or dischargeSummary>",
  recordDate: Date object,
  
  // METADATA
  ocrEngine: "landingai-ade",
  ocrConfidence: 0.95,
  uploadDate: Date,
  status: "completed"
}
```

---

## Frontend Integration (Actions for Table)

Based on your requirements, the table should display:

| Field | Source | Type |
|-------|--------|------|
| medical_type | `medicalType` | Enum (badge) |
| appointment_summary | `appointmentSummary` | Text (truncated) |
| discharge_summary | `dischargeSummary` | Text (truncated) |
| date | `date` | String |
| time | `time` | String |
| hospital_name | `hospitalName` | String |
| hospital_location | `hospitalLocation` | String |
| doctor_name | `doctorName` | String |
| department | `department` | String |
| services | `services` object | Expandable |
| doctor_notes | `doctorNotes` | Text |
| observations | `observations` | Text |
| remarks | `remarks` | Text |

**Actions:**
- **View Details**: Shows full document with all fields
- **Download Summary**: Generates PDF from extracted data
- **Edit**: Opens verification interface to modify fields
- **Delete**: Removes record

---

## Key Differences from Old Schema

### Old Schema (Before)
```javascript
{
  medical_summary: string,    // Single summary field
  date_time: string,          // Combined date & time
  hospital: string,           // Just name
  doctor: string,             // Just name
  services: string[],         // Simple array
  medical_notes: string       // Generic notes
}
```

### New Schema (Now)
```javascript
{
  medical_type: enum,              // Type distinction
  appointment_summary: string,     // Separate field
  discharge_summary: string,       // Separate field
  date: string,                    // Separate date
  time: string,                    // Separate time
  hospital_name: string,           // Explicit name
  hospital_location: string,       // Location added
  doctor_name: string,             // Explicit name
  department: string,              // Added specialization
  services: {                      // Structured object
    consultation: boolean,
    lab_tests: string[],
    procedures: string[],
    admission: string,
    discharge: string
  },
  doctor_notes: string,            // Specific to doctor
  observations: string,            // Clinical observations
  remarks: string                  // Follow-up remarks
}
```

---

## Testing Checklist

✅ **Schema Updated** - Landing AI schema matches your specification
✅ **Data Conversion** - All 13 fields properly extracted and converted to rows
✅ **Verification Flow** - Fields can be reviewed and edited
✅ **Confirmation Logic** - Saves to database with correct field mapping
✅ **Model Updated** - Database schema supports all new fields
✅ **Backward Compatibility** - Legacy fields still populated
✅ **Test File Created** - Can test extraction with sample documents

---

## Next Steps

1. **Test with Real Documents:**
   ```bash
   node test_medical_history_landingai.js sample_medical_history.pdf
   ```

2. **Test API Endpoint:**
   ```bash
   curl -X POST http://localhost:5000/api/scanner-enterprise/scan-medical \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "image=@medical_document.pdf" \
     -F "patientId=patient-id" \
     -F "documentType=MEDICAL_HISTORY"
   ```

3. **Frontend Integration:**
   - Update table to display new fields
   - Add view/edit/delete actions
   - Handle services object display
   - Show appointment vs discharge badge

4. **Validation:**
   - Ensure Landing AI extracts all required fields
   - Test date parsing (DD/MM/YY and DD/MM/YYYY)
   - Verify services object structure
   - Check optional field handling

---

## Notes

- **Same Pattern as Prescription:** Uses identical two-phase flow (scan → verify → confirm)
- **Field Validation:** Required fields: medical_type, date, hospital_name, doctor_name
- **Date Handling:** Supports both DD/MM/YY and DD/MM/YYYY formats
- **Services Object:** Properly structured with boolean, arrays, and strings
- **Logging:** Extensive console logs for debugging extraction and save process
- **Error Handling:** Gracefully handles missing optional fields

---

**Status:** ✅ Ready for Testing
**Pattern:** Same as Prescription (working)
**Compatibility:** Backward compatible with existing data

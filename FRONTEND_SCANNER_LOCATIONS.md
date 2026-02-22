# 📍 LandingAI Scanner - All Frontend Locations

## Summary

The LandingAI scanner is available in **2 main places** in the React frontend:

---

## 🎯 Location 1: Add Patient Form (Primary Use)

### **File**: `react/hms/src/components/patient/addpatient.jsx`

### **Where**: 
- **Step 2 of 4** - "Medical Information" section
- Inside the patient registration/edit modal

### **UI Location**:
```
Add Patient Modal
└── Step 1: Personal Info
└── Step 2: Medical Information ⭐ (Scanner is here)
    ├── File Upload Section
    │   ├── "AI-Powered Document Scanner"
    │   ├── "Powered by LandingAI • Auto-fills form data"
    │   └── Upload area (drag & drop or click)
    ├── Uploaded Documents List
    │   └── Shows: name, type badge, confidence, report ID
    ├── Vitals Section
    └── Medical History Fields (auto-filled by scanner)
└── Step 3: Insurance & Appointment
└── Step 4: Review & Submit
```

### **Functionality**:
- **Purpose**: Extract patient data from medical documents to auto-fill the form
- **Endpoint**: `POST /api/scanner-enterprise/scan-medical`
- **Input**: Single or multiple files (PDF/JPG/PNG)
- **Auto-fills**:
  - Medical History → Known Conditions field
  - Allergies → Allergies field
  - Medications → Current Medications list
  - Diagnosis → Known Conditions (appended)
- **Shows**:
  - Document type badge (PRESCRIPTION, LAB_REPORT, MEDICAL_HISTORY)
  - Confidence percentage (e.g., 95% ✓)
  - Success message with report ID
  - Error messages if upload fails

### **How to Access**:
1. Click "Add Patient" button in any module
2. Fill Step 1 (Personal Info) and click "Next"
3. In Step 2, scroll to "AI-Powered Document Scanner" section
4. Upload medical documents

---

## 🎯 Location 2: Admin Settings - Bulk Upload

### **File**: `react/hms/src/modules/admin/settings/Settings.jsx`

### **Where**:
- **Admin Settings page**
- Bulk upload section for multiple patient documents

### **UI Location**:
```
Admin Dashboard
└── Settings Menu
    └── Bulk Lab Report Scanner Upload ⭐ (Scanner is here)
        ├── Upload Section
        │   ├── "Upload Lab Reports (Bulk)"
        │   ├── Multiple file selector
        │   └── Max 10 files at once
        ├── Progress Log
        │   └── Shows processing status for each file
        └── Results Summary
            └── Shows matched patients and created records
```

### **Functionality**:
- **Purpose**: Bulk upload medical documents for multiple patients
- **Endpoint**: `POST /api/scanner-enterprise/bulk-upload-with-matching`
- **Input**: Multiple files (up to 10, JPG/PNG only in current code)
- **Process**:
  1. Uploads all files at once
  2. Scans each document
  3. Extracts patient information
  4. Automatically matches to existing patients (by name/phone)
  5. Creates new patient if no match found
  6. Saves document to patient record
- **Shows**:
  - Processing log for each file
  - Success/failure status
  - Patient matching results
  - Total processed vs failed count

### **How to Access**:
1. Login as Admin
2. Navigate to "Settings" in sidebar/menu
3. Look for "Bulk Lab Report Scanner Upload" section
4. Upload multiple medical documents

---

## 📊 Comparison

| Feature | Add Patient Form | Admin Settings (Bulk) |
|---------|------------------|----------------------|
| **Location** | Step 2 of Add Patient modal | Admin Settings page |
| **Purpose** | Auto-fill single patient form | Bulk process multiple patients |
| **Endpoint** | `/scan-medical` | `/bulk-upload-with-matching` |
| **File Limit** | 10 files | 10 files |
| **File Types** | PDF, JPG, PNG | JPG, PNG (can be changed to support PDF) |
| **Patient Matching** | Uses provided patientId | Auto-matches by name/phone |
| **Auto-fill** | Yes - fills form fields | No - creates records directly |
| **UI Feedback** | Rich (badges, confidence %) | Log-based (text output) |
| **User Type** | Any staff member | Admin only |
| **Use Case** | Registering/updating one patient | Batch processing old records |

---

## 🔧 Behind the Scenes (Service Layer)

### **File**: `react/hms/src/services/scannerService.js`

This service is used by both locations above. It provides:

### **Functions**:
1. **`scanAndExtractMedicalData(file, patientId)`**
   - Used by Add Patient form
   - Returns: `{ medicalHistory, allergies, medications, diagnosis, documentType, confidence, ... }`

2. **`getPatientReports(patientId)`**
   - Get all scanned reports for a patient
   - Returns: Array of reports

3. **`deleteScannedDocument(pdfId)`**
   - Delete a scanned document
   - Returns: Success status

### **API Endpoints Defined**: `react/hms/src/services/apiConstants.js`
```javascript
ScannerEndpoints = {
  scan: '/scanner-enterprise/scan',
  upload: '/scanner-enterprise/upload',
  getReports: (patientId) => `/scanner-enterprise/reports/${patientId}`,
  getPdf: (pdfId) => `/scanner-enterprise/pdf/${pdfId}`,
  ...
}
```

---

## 🔍 How to Find It in Your App

### **Method 1: From Navigation**

**Add Patient Scanner:**
```
Dashboard → Patients → Add Patient Button → Step 2 → Upload Section
```

**Bulk Scanner:**
```
Dashboard → Settings → Bulk Upload Section
```

### **Method 2: From URL**

**Add Patient:**
- URL: `http://localhost:3000/patients` (then click Add Patient)
- The upload section appears in the modal

**Bulk Scanner:**
- URL: `http://localhost:3000/admin/settings`
- Scroll to bulk upload section

---

## 🎨 Visual Indicators

### **Add Patient Form - You'll see:**
```
📤 AI-Powered Document Scanner
Upload prescriptions, lab reports, or medical records
Powered by LandingAI • Auto-fills form data

[Drag & drop or click to upload]

Uploaded Documents (1)
┌──────────────────────────────────────────┐
│ prescription.pdf [PRESCRIPTION] 95% ✓ 🗑️ │
│ ✅ Data extracted & saved • ID: abc123   │
└──────────────────────────────────────────┘
```

### **Bulk Upload - You'll see:**
```
📤 Bulk Lab Report Scanner Upload

[Select Multiple Files]

📋 Processing Log:
📤 Uploading 3 file(s) with scanner...
   ➤ report1.jpg (245.3 KB)
   ➤ report2.jpg (189.7 KB)
   ➤ report3.jpg (312.1 KB)
✅ Processing complete: 3 success, 0 failed
```

---

## 🚀 Quick Test

### **To test Add Patient Scanner:**
```bash
# 1. Start frontend
cd react/hms
npm start

# 2. Open browser to http://localhost:3000

# 3. Login and click "Add Patient"

# 4. Go to Step 2 and upload a medical document
```

### **To test Bulk Scanner:**
```bash
# 1. Login as Admin

# 2. Go to Settings page

# 3. Find "Bulk Upload" section

# 4. Select multiple medical documents (JPG/PNG)

# 5. Watch the processing log
```

---

## 📝 Notes

1. **Both locations use the same LandingAI backend** via `scannerService.js`

2. **Add Patient form is the primary use case** with rich UI feedback

3. **Bulk upload is for administrative batch processing** of old records

4. **All scanned documents are saved to MongoDB** with patient associations

5. **The service automatically detects document type** (Prescription, Lab Report, Medical History)

6. **Confidence scores** help users know extraction accuracy

---

## ✅ What's Working

- ✅ Add Patient form scanner (Step 2)
- ✅ Bulk upload scanner (Admin Settings)
- ✅ Document type detection
- ✅ Auto-fill functionality
- ✅ Patient matching
- ✅ Database storage
- ✅ Visual feedback (badges, confidence)
- ✅ Error handling

---

**Summary**: The scanner is available in **2 places** - the main one being **Add Patient form Step 2** with rich UI, and an admin **Bulk Upload** tool in Settings for batch processing! 🎉

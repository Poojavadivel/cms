# 📊 Lab Report Data Storage Analysis

## Complete Data Flow for Lab Reports

---

## 🗄️ Database Collections (MongoDB)

### 1. **LabReportDocument** Collection ⭐ PRIMARY STORAGE
**File:** `Server/Models/LabReportDocument.js`  
**Mongoose Model:** `LabReportDocument`  
**MongoDB Collection Name:** `labreportdocuments` (auto-pluralized by Mongoose)

**Purpose:** Stores scanned/uploaded lab reports from LandingAI scanner

**Schema:**
```javascript
{
  _id: String (UUID),                    // Primary key
  patientId: String (ref: Patient),      // Link to patient
  pdfId: String (ref: PatientPDF),       // Link to PDF file
  
  // Lab Report Data
  testType: String,                      // e.g., "BLOOD_COUNT", "THYROID"
  testCategory: String,                  // e.g., "Hematology", "Biochemistry"
  intent: String,                        // e.g., "GENERAL"
  labName: String,                       // Laboratory name
  reportDate: Date,                      // When report was issued
  
  // Test Results (Array)
  results: [{
    testName: String,                    // e.g., "Hemoglobin"
    value: String,                       // e.g., "14.5"
    unit: String,                        // e.g., "g/dL"
    referenceRange: String,              // e.g., "12.0-16.0"
    flag: String                         // "normal", "high", "low"
  }],
  
  // OCR Metadata
  ocrText: String,                       // Raw OCR text
  ocrEngine: String,                     // "landingai-ade"
  ocrConfidence: Number,                 // 0.95
  extractedData: Mixed,                  // Full extraction data
  extractionQuality: String,             // "excellent", "good", "fair"
  
  // Status
  status: String,                        // "completed", "processing", "failed"
  uploadedBy: String (ref: User),
  uploadDate: Date
}
```

**Indexes:**
- `patientId + uploadDate` (for fast patient queries)
- `pdfId` (for PDF lookups)
- `testType` (for filtering by type)

---

### 2. **LabReport** Collection (LEGACY)
**File:** `Server/Models/LabReport.js`  
**Mongoose Model:** `LabReport`  
**MongoDB Collection Name:** `labreports`

**Purpose:** Old/manual lab reports (before scanner was implemented)

**Note:** This is separate from LabReportDocument. Used by pathology module.

---

### 3. **PatientPDF** Collection (File Storage)
**File:** `Server/Models/PatientPDF.js`  
**Mongoose Model:** `PatientPDF`  
**MongoDB Collection Name:** `patientpdfs`

**Purpose:** Stores the actual PDF/image binary data

**Schema:**
```javascript
{
  _id: String (UUID),
  patientId: String,
  pdfData: Buffer,                      // Binary PDF data
  fileName: String,
  fileType: String,                     // "application/pdf", "image/jpeg"
  fileSize: Number,
  uploadDate: Date
}
```

**Relationship:**
```
LabReportDocument.pdfId → PatientPDF._id
```

---

### 4. **ScannedDataVerification** Collection (TEMPORARY)
**File:** `Server/Models/ScannedDataVerification.js`  
**Mongoose Model:** `ScannedDataVerification`  
**MongoDB Collection Name:** `scanneddataverifications`

**Purpose:** Temporary storage during scan → verify → confirm workflow

**Schema:**
```javascript
{
  _id: String,
  sessionId: String,
  patientId: String,
  documentType: String,                 // "LAB_REPORT"
  pdfId: String,
  extractedData: Mixed,                 // LandingAI extraction result
  verificationStatus: String,           // "pending", "verified", "rejected"
  dataRows: [{                          // Editable verification rows
    fieldName: String,
    displayLabel: String,
    originalValue: Mixed,
    currentValue: Mixed,
    dataType: String,
    category: String,
    confidence: Number,
    isModified: Boolean,
    isDeleted: Boolean
  }],
  metadata: {
    ocrEngine: String,
    ocrConfidence: Number,
    markdown: String                    // OCR text
  },
  expiresAt: Date                       // Auto-deletes after 24 hours
}
```

**Lifecycle:**
1. Created during `/scan-medical` upload
2. User reviews/edits in verification UI
3. Deleted after `/verification/:id/confirm` (data moved to LabReportDocument)

---

### 5. **Patient** Collection (Links)
**File:** `Server/Models/Patient.js`  
**MongoDB Collection Name:** `patients`

**Purpose:** Patient record with references to all documents

**Relevant Field:**
```javascript
{
  _id: String,
  firstName: String,
  lastName: String,
  // ... other patient data
  
  medicalReports: [{
    reportId: String,                   // Points to LabReportDocument._id
    reportType: String,                 // "LAB_REPORT"
    imagePath: String,                  // Same as pdfId
    uploadDate: Date,
    uploadedBy: String,
    pdfId: String                       // Points to PatientPDF._id
  }]
}
```

---

## 📍 Complete Data Save Flow

### Step 1: Upload (`POST /scan-medical`)
**File:** `Server/routes/scanner-enterprise.js` (Lines 400-565)

```javascript
// 1. Upload PDF
req.file → multer → temp storage

// 2. Save PDF to database
const pdfDoc = new PatientPDF({
  pdfData: Buffer.from(pdfBuffer),
  fileName: originalFilename,
  patientId: patientId
});
await pdfDoc.save();
// Saved to: patientpdfs collection

// 3. Scan with LandingAI
const scanResult = await landingAIScanner.scanDocument(buffer);
// Returns: extracted data with labReport fields

// 4. Create verification session
const verificationDoc = new ScannedDataVerification({
  sessionId: sessionId,
  patientId: patientId,
  pdfId: pdfDoc._id,
  documentType: 'LAB_REPORT',
  extractedData: scanResult.extractedData,
  dataRows: convertExtractedDataToRows(...)
});
await verificationDoc.save();
// Saved to: scanneddataverifications collection

// Returns: verificationId for user review
```

---

### Step 2: Confirm (`POST /verification/:id/confirm`)
**File:** `Server/routes/scanner-enterprise.js` (Lines 1030-1082)

```javascript
// 1. Get verification session
const verification = await ScannedDataVerification.findById(verificationId);

// 2. Reconstruct lab results from verified rows
const results = verifiedRows
  .filter(r => r.fieldName.startsWith('labResult_'))
  .map(r => ({
    testName: r.currentValue.testName,
    value: r.currentValue.value,
    unit: r.currentValue.unit,
    referenceRange: r.currentValue.referenceRange,
    flag: r.currentValue.flag
  }));

// 3. Create LabReportDocument
const labReportDoc = new LabReportDocument({
  patientId: verification.patientId,
  pdfId: verification.pdfId,
  testType: verifiedRows.find(r => r.fieldName === 'testType')?.currentValue,
  testCategory: verifiedRows.find(r => r.fieldName === 'testCategory')?.currentValue,
  labName: verifiedRows.find(r => r.fieldName === 'labName')?.currentValue,
  reportDate: verifiedRows.find(r => r.fieldName === 'reportDate')?.currentValue,
  results: results,
  ocrEngine: 'landingai-ade',
  ocrConfidence: 0.95,
  status: 'completed'
});

await labReportDoc.save();
// ⭐ SAVED TO: labreportdocuments collection

// 4. Link to patient
const patient = await Patient.findById(verification.patientId);
patient.medicalReports.push({
  reportId: labReportDoc._id,
  reportType: 'LAB_REPORT',
  pdfId: verification.pdfId,
  uploadDate: new Date()
});
await patient.save();
// Updated: patients collection

// 5. Delete verification session
// (happens automatically after 24h via TTL index)
```

---

## 🔍 How Frontend Retrieves Data

### API Endpoint
`GET /api/scanner-enterprise/lab-reports/:patientId`

**File:** `Server/routes/scanner-enterprise.js` (Lines ~1380)

```javascript
router.get('/lab-reports/:patientId', auth, async (req, res) => {
  const labReports = await LabReportDocument.find({
    patientId: patientId
  })
  .sort({ reportDate: -1, uploadDate: -1 })
  .lean();

  return res.json({
    success: true,
    labReports: labReports  // ⭐ From labreportdocuments collection
  });
});
```

### Frontend Service
**File:** `react/hms/src/services/prescriptionService.js`

```javascript
export const fetchLabReports = async (patientId) => {
  // Try 1: Pathology endpoint (manual lab reports)
  const response1 = await axios.get(`/pathology/reports?patientId=${patientId}`);
  // Queries: labreports collection (legacy)
  
  if (response1.data.reports.length === 0) {
    // Try 2: Scanner endpoint (scanned lab reports) ✅ FIXED
    const response2 = await axios.get(`/api/scanner-enterprise/lab-reports/${patientId}`);
    // Queries: labreportdocuments collection ⭐
    return response2.data.labReports;
  }
}
```

---

## 📊 Collection Summary Table

| Collection Name | Model | Purpose | Data Type | Auto-Delete |
|----------------|-------|---------|-----------|-------------|
| **labreportdocuments** | LabReportDocument | Scanned lab reports | Permanent | No |
| labreports | LabReport | Manual lab reports (legacy) | Permanent | No |
| patientpdfs | PatientPDF | PDF/image files | Permanent | No |
| scanneddataverifications | ScannedDataVerification | Temp verification data | Temporary | Yes (24h) |
| patients | Patient | Patient records + links | Permanent | No |

---

## 🎯 Key Points

1. **PRIMARY STORAGE:** `labreportdocuments` collection
   - This is where ALL scanned lab reports are saved
   - Created by `LabReportDocument` model
   - Stores structured data + test results array

2. **FILE STORAGE:** `patientpdfs` collection
   - Stores actual PDF binary data
   - Linked via `pdfId` field

3. **TEMPORARY STORAGE:** `scanneddataverifications` collection
   - Only used during upload → verify → confirm flow
   - Auto-deleted after 24 hours
   - Not used for retrieval

4. **PATIENT LINKS:** `patients.medicalReports[]` array
   - Contains references to lab reports
   - `reportId` points to `labreportdocuments._id`
   - `pdfId` points to `patientpdfs._id`

5. **LEGACY:** `labreports` collection
   - Old manual lab reports
   - NOT used by scanner
   - Queried by pathology endpoint

---

## 🔍 MongoDB Queries to Check Data

```javascript
// Check scanned lab reports
db.labreportdocuments.find({ patientId: "16686d13-3bc9-4609-9dc5-6c9c533339c7" })

// Check patient's report links
db.patients.findOne({ _id: "16686d13-3bc9-4609-9dc5-6c9c533339c7" }, { medicalReports: 1 })

// Check PDFs
db.patientpdfs.find({ patientId: "16686d13-3bc9-4609-9dc5-6c9c533339c7" })

// Check pending verifications
db.scanneddataverifications.find({ patientId: "16686d13-3bc9-4609-9dc5-6c9c533339c7" })

// Count all lab reports
db.labreportdocuments.countDocuments()
```

---

## 📝 Summary

**Answer: Data is saved in `labreportdocuments` collection**

- Model: `LabReportDocument`
- Location: Line 1065 in `scanner-enterprise.js`
- Command: `await labReportDoc.save()`
- Retrieval: `GET /api/scanner-enterprise/lab-reports/:patientId`
- Frontend: Now fixed to actually query this collection!

**The bug we fixed:** Frontend was returning empty array from pathology endpoint without trying the scanner endpoint that queries `labreportdocuments` collection.

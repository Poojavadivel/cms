# 🗺️ Lab Report Data Flow - Visual Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          LAB REPORT UPLOAD FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: UPLOAD
═══════════════════════════════════════════════════════════════════════════
User uploads PDF
        ↓
POST /api/scanner-enterprise/scan-medical
        ↓
┌───────────────────────────────┐
│  Save PDF to Database         │
│  Collection: patientpdfs      │
│  Model: PatientPDF            │
│  Data: Binary PDF buffer      │
│  Returns: pdfId               │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  Scan with LandingAI          │
│  OCR + AI Extraction          │
│  Returns: Structured data     │
│  - testType                   │
│  - labName                    │
│  - results[]                  │
└───────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│  Create Verification Session          │
│  Collection: scanneddataverifications │
│  Model: ScannedDataVerification       │
│  Data: Extracted + editable rows      │
│  TTL: 24 hours (auto-delete)          │
│  Returns: verificationId              │
└───────────────────────────────────────┘
        ↓
Response: { verificationId: "..." }


STEP 2: USER REVIEW (Optional)
═══════════════════════════════════════════════════════════════════════════
GET /api/scanner-enterprise/verification/:id
        ↓
Displays extracted data rows
User can edit/delete rows
        ↓
PUT /api/scanner-enterprise/verification/:id/row/:idx
(Save edits back to scanneddataverifications)


STEP 3: CONFIRM & SAVE
═══════════════════════════════════════════════════════════════════════════
POST /api/scanner-enterprise/verification/:id/confirm
        ↓
┌──────────────────────────────────────────┐
│ Read from: scanneddataverifications      │
│ Get verified data rows                   │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ Create LabReportDocument                 │
│ ⭐ Collection: labreportdocuments ⭐      │
│ Model: LabReportDocument                 │
│ Data:                                    │
│   - patientId                            │
│   - pdfId (link to patientpdfs)          │
│   - testType                             │
│   - testCategory                         │
│   - labName                              │
│   - reportDate                           │
│   - results: [                           │
│       { testName, value, unit,           │
│         referenceRange, flag }           │
│     ]                                    │
│   - ocrEngine: "landingai-ade"           │
│   - ocrConfidence: 0.95                  │
│   - status: "completed"                  │
└──────────────────────────────────────────┘
        ↓
        await labReportDoc.save() ⭐⭐⭐
        ↓
┌──────────────────────────────────────────┐
│ Update Patient Record                    │
│ Collection: patients                     │
│ Add to: medicalReports[] array           │
│ Data:                                    │
│   - reportId (link to labreportdocuments)│
│   - reportType: "LAB_REPORT"             │
│   - pdfId (link to patientpdfs)          │
│   - uploadDate                           │
└──────────────────────────────────────────┘
        ↓
Response: { success: true, reportId: "..." }


STEP 4: RETRIEVE LAB REPORTS
═══════════════════════════════════════════════════════════════════════════
GET /api/scanner-enterprise/lab-reports/:patientId
        ↓
┌──────────────────────────────────────────┐
│ Query: labreportdocuments                │
│ Filter: { patientId: "..." }             │
│ Sort: reportDate DESC, uploadDate DESC   │
└──────────────────────────────────────────┘
        ↓
Response: { 
  success: true, 
  labReports: [...]  ← From labreportdocuments
}


═══════════════════════════════════════════════════════════════════════════
                         DATABASE COLLECTIONS
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│ 1. patientpdfs (PERMANENT)                                              │
├─────────────────────────────────────────────────────────────────────────┤
│ Purpose: Store PDF/image files                                          │
│ Data: Binary PDF data, fileName, fileSize                               │
│ Created: During upload                                                   │
│ Size: Can be large (50MB per file)                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 2. scanneddataverifications (TEMPORARY - 24h TTL)                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Purpose: Temporary storage during review                                │
│ Data: Extracted data + editable rows                                    │
│ Created: During upload                                                   │
│ Deleted: After confirm OR after 24 hours                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 3. labreportdocuments (PERMANENT) ⭐ PRIMARY STORAGE                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Purpose: Store structured lab report data                               │
│ Data: testType, labName, reportDate, results[]                          │
│ Created: After user confirms                                            │
│ Retrieved: GET /lab-reports/:patientId                                  │
│ Indexed: patientId, pdfId, testType                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 4. patients (PERMANENT)                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Purpose: Patient records with document links                            │
│ Data: Patient info + medicalReports[] references                        │
│ Updated: After lab report created                                       │
│ Links: reportId → labreportdocuments._id                                │
│        pdfId → patientpdfs._id                                          │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         FRONTEND BUG (FIXED)
═══════════════════════════════════════════════════════════════════════════

BEFORE FIX:
───────────
fetchLabReports(patientId)
  ↓
Try pathology endpoint → Returns { reports: [] }
  ↓
❌ if (reports) → TRUE (empty array is truthy!)
  ↓
❌ return []  ← STOPS HERE, never tries scanner!
  ↓
User sees: "No Data"


AFTER FIX:
──────────
fetchLabReports(patientId)
  ↓
Try pathology endpoint → Returns { reports: [] }
  ↓
✅ if (reports && reports.length > 0) → FALSE
  ↓
✅ Try scanner endpoint → /lab-reports/:patientId
  ↓
✅ Query labreportdocuments collection
  ↓
✅ Returns { labReports: [...] }
  ↓
User sees: Lab reports table with data!


═══════════════════════════════════════════════════════════════════════════
                         COLLECTION RELATIONSHIPS
═══════════════════════════════════════════════════════════════════════════

patients
  └── medicalReports[]
        ├── reportId ────────────┐
        └── pdfId ───────┐       │
                         │       │
                         ↓       ↓
                   patientpdfs   labreportdocuments
                   (Binary PDF)  (Structured Data)
                         ↑             ↓
                         └─── pdfId ───┘


═══════════════════════════════════════════════════════════════════════════
                         ANSWER TO YOUR QUESTION
═══════════════════════════════════════════════════════════════════════════

Q: Where is the data saved after scan?

A: Data is saved in 3 collections:

1. patientpdfs           → PDF file (binary)
2. labreportdocuments    → Lab report data (structured) ⭐ MAIN
3. patients              → Links to above (references)

Temporary during review:
4. scanneddataverifications → Auto-deleted after 24h


Main storage:  labreportdocuments
Query command: db.labreportdocuments.find({ patientId: "..." })
API endpoint:  GET /api/scanner-enterprise/lab-reports/:patientId
Model name:    LabReportDocument
Code location: Server/routes/scanner-enterprise.js:1065

```

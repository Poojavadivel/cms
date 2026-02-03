# Hospital Management System - Database Schema & Relationships

## 📊 Collections Overview

### Core Collections (19 Total)

1. **User** - System users (doctors, admins, staff)
2. **Patient** - Patient records
3. **Staff** - Staff members (separate from User)
4. **Appointment** - Appointment bookings
5. **Intake** - Patient intake/triage records
6. **Medicine** - Medicine catalog
7. **MedicineBatch** - Medicine inventory batches
8. **PharmacyRecord** - Pharmacy dispensing records
9. **LabReport** - Lab test reports (legacy)
10. **LabReportDocument** - Lab reports with OCR (new)
11. **PrescriptionDocument** - Prescription documents with OCR
12. **MedicalHistoryDocument** - Medical history documents
13. **PatientPDF** - Binary storage for PDFs/images
14. **File** - General file storage
15. **AuthSession** - User authentication sessions
16. **AuditLog** - System audit trails
17. **Bot** - AI chatbot conversations
18. **Payroll** - Staff payroll records
19. **Invoice** - (if exists)

---

## 🔗 Collection Relationships & Interconnections

### 1️⃣ **User Collection**
**Purpose:** Core authentication & authorization (doctors, admins, pharmacists, pathologists, reception)

**Schema:**
```javascript
{
  _id: String (UUID),
  role: String (enum: ['superadmin', 'admin', 'doctor', 'pharmacist', 'pathologist', 'reception']),
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  is_active: Boolean,
  metadata: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships:**
- → **Staff**: User.role='doctor' can be synced to Staff collection
- → **Appointment**: Referenced as `doctorId`
- → **Intake**: Referenced as `doctorId` and `createdBy`
- → **Patient**: Referenced as `doctorId` (primary doctor)
- → **LabReport**: Referenced as `uploadedBy`
- → **Payroll**: Referenced as staff member
- → **AuthSession**: Referenced as `userId`
- → **AuditLog**: Referenced as `userId`

---

### 2️⃣ **Patient Collection**
**Purpose:** Canonical patient master records

**Schema:**
```javascript
{
  _id: String (UUID),
  patientCode: String (unique),
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  age: Number,
  gender: String (enum),
  bloodGroup: String,
  phone: String (indexed),
  email: String,
  address: {
    houseNo, street, line1, city, state, pincode, country
  },
  vitals: {
    heightCm, weightKg, bmi, bp, temp, pulse, spo2
  },
  doctorId: String (ref: User),
  allergies: [String],
  prescriptions: [{
    prescriptionId, appointmentId, doctorId,
    medicines: [], notes, issuedAt
  }],
  medicalReports: [{
    reportId, reportType, imagePath, uploadDate,
    uploadedBy, extractedData, ocrText, intent
  }],
  telegramUserId: String,
  telegramUsername: String,
  deleted_at: Date
}
```

**Relationships:**
- → **Appointment**: Referenced as `patientId`
- → **Intake**: Referenced as `patientId`
- → **LabReport**: Referenced as `patientId`
- → **LabReportDocument**: Referenced as `patientId`
- → **PrescriptionDocument**: Referenced as `patientId`
- → **MedicalHistoryDocument**: Referenced as `patientId`
- → **PatientPDF**: Referenced as `patientId`
- → **PharmacyRecord**: Referenced as `patientId`
- → **User**: References `doctorId` (assigned doctor)
- → **Bot**: Patient can interact with chatbot
- **Embedded**: `prescriptions[]` array (denormalized)
- **Embedded**: `medicalReports[]` array stores references to PatientPDF

---

### 3️⃣ **Staff Collection**
**Purpose:** Staff directory (separate from User auth)

**Schema:**
```javascript
{
  _id: String (UUID),
  name: String,
  designation: String,
  department: String,
  patientFacingId: String,
  contact: String,
  email: String,
  avatarUrl: String,
  gender: String,
  status: String (enum: ['Available', 'Off Duty', 'On Leave', 'On Call']),
  shift: String,
  roles: [String],
  qualifications: [String],
  experienceYears: Number,
  joinedAt: Date,
  lastActiveAt: Date,
  appointmentsCount: Number,
  metadata: Mixed
}
```

**Relationships:**
- ← **User**: Can be synced from User.role='doctor'
- → **Payroll**: Referenced as `staffId`
- → **Appointment**: Can be referenced for staff scheduling

---

### 4️⃣ **Appointment Collection**
**Purpose:** Appointment scheduling & follow-up management

**Schema:**
```javascript
{
  _id: String (UUID),
  appointmentCode: String (unique),
  patientId: String (ref: Patient),
  doctorId: String (ref: User),
  appointmentType: String,
  startAt: Date,
  endAt: Date,
  location: String,
  status: String (enum: ['Scheduled', 'Confirmed', 'Pending', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled']),
  vitals: Mixed,
  notes: String,
  followUp: {
    isFollowUp: Boolean,
    isRequired: Boolean,
    reason: String,
    instructions: String,
    priority: String,
    recommendedDate: Date,
    scheduledDate: Date,
    diagnosis: String,
    treatmentPlan: String,
    labTests: [],
    imaging: [],
    procedures: [],
    prescriptionReview: Boolean,
    medicationCompliance: String,
    previousAppointmentId: String (ref: Appointment),
    nextAppointmentId: String (ref: Appointment),
    outcome: String
  }
}
```

**Relationships:**
- ← **Patient**: References `patientId`
- ← **User**: References `doctorId`
- → **Intake**: Can create Intake record
- → **LabReport**: Can be linked via `appointmentId`
- **Self-referencing**: `followUp.previousAppointmentId` and `nextAppointmentId` create appointment chains

---

### 5️⃣ **Intake Collection**
**Purpose:** Patient triage & admission records (immutable snapshots)

**Schema:**
```javascript
{
  _id: String (UUID),
  patientId: String (ref: Patient),
  patientSnapshot: {
    firstName, lastName, dateOfBirth, gender, phone, email
  },
  doctorId: String (ref: User),
  appointmentId: String,
  triage: {
    chiefComplaint: String,
    vitals: { bp, temp, pulse, spo2, weightKg, heightCm, bmi },
    priority: String (enum: ['Normal', 'Urgent', 'Emergency']),
    triageCategory: String (enum: ['Green', 'Yellow', 'Red'])
  },
  consent: {
    consentGiven: Boolean,
    consentAt: Date,
    consentBy: String,
    consentFileId: String (ref: File)
  },
  insurance: {
    hasInsurance: Boolean,
    payer: String,
    policyNumber: String,
    coverageMeta: Mixed
  },
  attachments: [String] (ref: File),
  status: String (enum: ['New', 'Reviewed', 'Converted', 'Rejected']),
  createdBy: String (ref: User),
  convertedAt: Date,
  convertedBy: String (ref: User)
}
```

**Relationships:**
- ← **Patient**: References `patientId`
- ← **User**: References `doctorId` and `createdBy`
- → **Appointment**: Referenced via `appointmentId`
- → **File**: References `attachments[]` and `consentFileId`

---

### 6️⃣ **Medicine Collection**
**Purpose:** Medicine catalog/master data

**Schema:**
```javascript
{
  _id: String (UUID),
  name: String,
  genericName: String,
  sku: String (unique),
  form: String,
  strength: String,
  unit: String,
  manufacturer: String,
  brand: String,
  category: String,
  description: String,
  status: String (enum: ['In Stock', 'Out of Stock', 'Discontinued']),
  deleted_at: Date
}
```

**Relationships:**
- → **MedicineBatch**: Referenced as `medicineId`
- → **PharmacyRecord**: Referenced in dispensing records
- → **Patient.prescriptions**: Referenced as `medicineId`

---

### 7️⃣ **MedicineBatch Collection**
**Purpose:** Inventory batch tracking (expiry, stock levels)

**Schema:**
```javascript
{
  _id: String (UUID),
  medicineId: String (ref: Medicine),
  batchNumber: String,
  expiryDate: Date,
  manufactureDate: Date,
  quantity: Number,
  costPrice: Number,
  sellingPrice: Number,
  supplier: String,
  receivedDate: Date,
  status: String
}
```

**Relationships:**
- ← **Medicine**: References `medicineId`
- → **PharmacyRecord**: Batches are consumed during dispensing

---

### 8️⃣ **PharmacyRecord Collection**
**Purpose:** Medicine dispensing transactions

**Schema:**
```javascript
{
  _id: String (UUID),
  patientId: String (ref: Patient),
  appointmentId: String,
  prescriptionId: String,
  dispensedBy: String (ref: User),
  dispensedAt: Date,
  items: [{
    medicineId: String (ref: Medicine),
    batchId: String (ref: MedicineBatch),
    quantity: Number,
    price: Number,
    instructions: String
  }],
  totalAmount: Number,
  paymentStatus: String,
  notes: String
}
```

**Relationships:**
- ← **Patient**: References `patientId`
- ← **Appointment**: References `appointmentId`
- ← **Medicine**: References `medicineId` in items
- ← **MedicineBatch**: References `batchId` in items
- ← **User**: References `dispensedBy`

---

### 9️⃣ **LabReport Collection** (Legacy)
**Purpose:** Lab test results (older system)

**Schema:**
```javascript
{
  _id: String (UUID),
  patientId: String (ref: Patient),
  appointmentId: String,
  documentId: String (ref: MedicalDocument),
  testName: String,
  testType: String,
  testCategory: String,
  status: String,
  priority: String,
  results: Mixed,
  testResults: Array,
  patientName: String,
  collectionDate: Date,
  reportDate: Date,
  doctorName: String,
  technician: String,
  fileRef: String (ref: PatientPDF),
  uploadedBy: String (ref: User),
  remarks: String,
  rawText: String (OCR),
  enhancedText: String,
  metadata: Mixed
}
```

**Relationships:**
- ← **Patient**: References `patientId`
- ← **Appointment**: References `appointmentId`
- ← **PatientPDF**: References `fileRef`
- ← **User**: References `uploadedBy`

---

### 🔟 **LabReportDocument Collection** (New)
**Purpose:** OCR-scanned lab reports with structured data

**Schema:**
```javascript
{
  _id: String (UUID),
  patientId: String (ref: Patient),
  pdfId: String (ref: PatientPDF),
  testType: String,
  testCategory: String,
  intent: String,
  labName: String,
  reportDate: Date,
  results: [{
    testName: String,
    value: String,
    unit: String,
    referenceRange: String,
    flag: String (enum: ['normal', 'high', 'low'])
  }],
  ocrText: String,
  ocrEngine: String,
  ocrConfidence: Number,
  extractedData: Mixed,
  extractionQuality: String,
  status: String,
  uploadedBy: String (ref: User),
  uploadDate: Date
}
```

**Relationships:**
- ← **Patient**: References `patientId`
- ← **PatientPDF**: References `pdfId` (binary storage)
- ← **User**: References `uploadedBy`

---

### 1️⃣1️⃣ **PrescriptionDocument Collection**
**Purpose:** OCR-scanned prescriptions with medicine extraction

**Schema:**
```javascript
{
  _id: String (UUID),
  patientId: String (ref: Patient),
  pdfId: String (ref: PatientPDF),
  doctorName: String,
  hospitalName: String,
  prescriptionDate: Date,
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  diagnosis: String,
  instructions: String,
  ocrText: String,
  ocrEngine: String,
  ocrConfidence: Number,
  extractedData: Mixed,
  intent: String,
  status: String,
  uploadedBy: String (ref: User),
  uploadDate: Date
}
```

**Relationships:**
- ← **Patient**: References `patientId`
- ← **PatientPDF**: References `pdfId` (binary storage)
- ← **User**: References `uploadedBy`

---

### 1️⃣2️⃣ **MedicalHistoryDocument Collection**
**Purpose:** Medical history records, discharge summaries

**Schema:**
```javascript
{
  _id: String (UUID),
  patientId: String (ref: Patient),
  pdfId: String (ref: PatientPDF),
  title: String,
  category: String,
  intent: String,
  medicalHistory: String,
  diagnosis: String,
  allergies: String,
  chronicConditions: [String],
  surgicalHistory: [String],
  familyHistory: String,
  medications: String,
  recordDate: Date,
  reportDate: Date,
  doctorName: String,
  hospitalName: String,
  ocrText: String,
  ocrEngine: String,
  ocrConfidence: Number,
  extractedData: Mixed,
  status: String,
  uploadedBy: String (ref: User),
  uploadDate: Date
}
```

**Relationships:**
- ← **Patient**: References `patientId`
- ← **PatientPDF**: References `pdfId` (binary storage)
- ← **User**: References `uploadedBy`

---

### 1️⃣3️⃣ **PatientPDF Collection**
**Purpose:** Binary storage for PDFs/images (GridFS alternative)

**Schema:**
```javascript
{
  _id: String (UUID),
  patientId: String (ref: Patient),
  title: String,
  fileName: String,
  mimeType: String,
  data: Buffer (binary),
  size: Number,
  uploadedAt: Date
}
```

**Relationships:**
- ← **Patient**: References `patientId`
- → **LabReport**: Referenced as `fileRef`
- → **LabReportDocument**: Referenced as `pdfId`
- → **PrescriptionDocument**: Referenced as `pdfId`
- → **MedicalHistoryDocument**: Referenced as `pdfId`

---

### 1️⃣4️⃣ **File Collection**
**Purpose:** General file storage (consent forms, attachments)

**Schema:**
```javascript
{
  _id: String (UUID),
  fileName: String,
  mimeType: String,
  size: Number,
  path: String,
  uploadedBy: String (ref: User),
  uploadedAt: Date,
  metadata: Mixed
}
```

**Relationships:**
- ← **User**: References `uploadedBy`
- → **Intake**: Referenced in `attachments[]` and `consentFileId`

---

### 1️⃣5️⃣ **AuthSession Collection**
**Purpose:** JWT session management & refresh tokens

**Schema:**
```javascript
{
  _id: String (UUID),
  userId: String (ref: User),
  token: String,
  refreshToken: String,
  expiresAt: Date (indexed, TTL),
  ipAddress: String,
  userAgent: String,
  isActive: Boolean,
  createdAt: Date
}
```

**Relationships:**
- ← **User**: References `userId`

---

### 1️⃣6️⃣ **AuditLog Collection**
**Purpose:** System audit trail (HIPAA compliance)

**Schema:**
```javascript
{
  _id: String (UUID),
  userId: String (ref: User),
  action: String,
  resource: String,
  resourceId: String,
  changes: Mixed,
  ipAddress: String,
  timestamp: Date
}
```

**Relationships:**
- ← **User**: References `userId`

---

### 1️⃣7️⃣ **Bot Collection**
**Purpose:** AI chatbot conversation storage

**Schema:**
```javascript
{
  _id: String (UUID),
  userId: String (ref: User),
  sessions: [{
    sessionId: String,
    messages: [{
      role: String,
      content: String,
      timestamp: Date
    }],
    metadata: Mixed
  }],
  model: String
}
```

**Relationships:**
- ← **User**: References `userId`
- ← **Patient**: Can query patient data during chat

---

### 1️⃣8️⃣ **Payroll Collection**
**Purpose:** Staff salary & payroll management

**Schema:**
```javascript
{
  _id: String (UUID),
  staffId: String (ref: Staff),
  employeeCode: String,
  employeeName: String,
  department: String,
  designation: String,
  payPeriod: {
    month: Number,
    year: Number,
    startDate: Date,
    endDate: Date
  },
  salaryComponents: [{
    name: String,
    type: String (enum: ['earning', 'deduction', 'reimbursement']),
    amount: Number,
    isPercentage: Boolean,
    isTaxable: Boolean
  }],
  attendance: {
    totalDays: Number,
    presentDays: Number,
    absentDays: Number,
    leaves: { casual, sick, earned, unpaid, other }
  },
  statutory: {
    pfNumber, esiNumber, uanNumber, panNumber,
    employeePF, employerPF, employeeESI, employerESI,
    professionalTax, tdsDeducted
  },
  grossEarnings: Number,
  totalDeductions: Number,
  netSalary: Number,
  status: String,
  paymentDate: Date,
  approvedBy: String (ref: User)
}
```

**Relationships:**
- ← **Staff**: References `staffId`
- ← **User**: References `approvedBy`

---

## 📈 Relationship Diagram (Visual Summary)

```
┌──────────────────────────────────────────────────────────────────┐
│                         CORE ENTITIES                            │
└──────────────────────────────────────────────────────────────────┘

                    ┌─────────┐
                    │  User   │ (Auth & Roles)
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐    ┌────────────┐   ┌─────────┐
    │ Staff  │    │ AuthSession│   │ AuditLog│
    └───┬────┘    └────────────┘   └─────────┘
        │
        ▼
    ┌────────┐
    │Payroll │
    └────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      PATIENT WORKFLOW                            │
└──────────────────────────────────────────────────────────────────┘

         ┌─────────┐
         │ Patient │ (Master Record)
         └────┬────┘
              │
    ┌─────────┼─────────┬─────────┬──────────┬─────────┐
    │         │         │         │          │         │
    ▼         ▼         ▼         ▼          ▼         ▼
┌────────┐┌─────────┐┌───────┐┌─────────┐┌─────────┐┌──────┐
│Intake  ││Appoint  ││LabRep ││Prescrip ││MedHist  ││ Bot  │
│        ││ment     ││ort    ││tion     ││ory      ││      │
└────────┘└────┬────┘└───┬───┘└────┬────┘└────┬────┘└──────┘
              │          │         │          │
              │          └─────────┴──────────┘
              │                    │
              ▼                    ▼
         ┌─────────┐         ┌──────────┐
         │Pharmacy │         │PatientPDF│ (Binary Storage)
         │ Record  │         └──────────┘
         └─────────┘
              │
              ▼
         ┌─────────┐
         │Medicine │
         │ Batch   │
         └─────────┘
              │
              ▼
         ┌─────────┐
         │Medicine │ (Catalog)
         └─────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    DOCUMENT MANAGEMENT                           │
└──────────────────────────────────────────────────────────────────┘

                   ┌──────────────┐
                   │  PatientPDF  │ (Binary Storage)
                   └───────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│LabReportDocument │ │Prescription   │ │MedicalHistory    │
│                  │ │Document       │ │Document          │
└──────────────────┘ └───────────────┘ └──────────────────┘
         │                 │                 │
         └─────────────────┴─────────────────┘
                           │
                           ▼
                    ┌──────────┐
                    │  Patient │
                    └──────────┘
```

---

## 🔑 Key Design Patterns

### 1. **Reference Pattern**
Most collections use UUID strings (_id) for references instead of ObjectId.

### 2. **Embedded vs Referenced**
- **Embedded**: `Patient.prescriptions[]`, `Patient.medicalReports[]` (for quick access)
- **Referenced**: Separate collections for large/frequently updated data

### 3. **Snapshot Pattern**
`Intake.patientSnapshot` stores immutable patient data at intake time.

### 4. **Binary Storage**
`PatientPDF.data` stores file buffers directly in MongoDB (alternative to GridFS).

### 5. **Soft Deletes**
`deleted_at` field instead of hard deletes (HIPAA compliance).

### 6. **OCR Workflow**
```
Upload → PatientPDF (binary) → OCR Processing → 
{LabReportDocument | PrescriptionDocument | MedicalHistoryDocument} → 
Patient.medicalReports[]
```

---

## 📊 Statistics

- **Total Collections**: 19
- **Core Entities**: 5 (User, Patient, Staff, Appointment, Intake)
- **Document Storage**: 4 (PatientPDF, LabReportDocument, PrescriptionDocument, MedicalHistoryDocument)
- **Transactional**: 3 (PharmacyRecord, Payroll, Invoice)
- **Support**: 7 (Medicine, MedicineBatch, File, AuthSession, AuditLog, Bot, LabReport)

---

## 🚀 API Integration Points

### Main Routes
- `/api/auth` - Authentication
- `/api/patients` - Patient CRUD
- `/api/appointments` - Appointment management
- `/api/intake` - Triage & intake
- `/api/pharmacy` - Medicine dispensing
- `/api/pathology` - Lab reports
- `/api/scanner-enterprise` - OCR document upload
- `/api/staff` - Staff management
- `/api/payroll` - Payroll processing
- `/api/bot` - AI chatbot
- `/api/card` - Patient profile cards
- `/api/reports` - Analytics & reports

---

**Generated on:** 2026-02-03  
**System Version:** HMS Karur v2.0

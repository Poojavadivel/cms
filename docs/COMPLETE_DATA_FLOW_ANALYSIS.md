# 🏥 COMPLETE HMS DATA FLOW ANALYSIS - A to Z
## Karur Gastro Foundation Hospital Management System

**Generated:** December 3, 2024  
**Analysis Depth:** Complete System Architecture, Data Flow, Metadata & Sample Data

---

## 📊 EXECUTIVE SUMMARY

This Hospital Management System (HMS) is a full-stack enterprise application with:
- **Backend:** Node.js + Express + MongoDB (Mongoose ODM)
- **Frontend:** Flutter (Web, Android, iOS)
- **Database:** MongoDB (NoSQL, Document-based)
- **AI Integration:** Google Gemini API for chatbot & OCR
- **Real-time:** WebSocket-capable architecture
- **Authentication:** JWT-based with bcrypt password hashing

---

## 🗄️ DATABASE ARCHITECTURE

### Database Type: MongoDB
- **Location:** Cloud-hosted MongoDB Atlas
- **Connection:** `process.env.MONGODB_URL`
- **ODM:** Mongoose (Object Data Modeling)
- **ID Strategy:** UUID v4 (not MongoDB ObjectId)

### Collections Overview (14 Total)

| Collection | Purpose | Documents Created | Key References |
|------------|---------|------------------|----------------|
| **users** | System users (doctors, admin, pharmacist, pathologist) | 2 doctors | Role-based access |
| **staff** | Staff management | 12 (2 doctors + 10 staff) | Links to users |
| **patients** | Patient records | 20 patients | Central entity |
| **appointments** | Appointment scheduling | ~41 appointments | Links patients↔doctors |
| **medicines** | Medicine catalog | 15 medicines | Used in prescriptions |
| **medicinebatches** | Inventory batches | 15 batches | Stock management |
| **pharmacyrecords** | Dispensing records | ~32 records | Prescription fulfillment |
| **labreports** | Lab test results | 30 reports | Structured results |
| **intakes** | Patient intake forms | ~20 intakes | Admission data |
| **payrolls** | Staff salary records | 30 payrolls | 3 months × 10 staff |
| **patientpdfs** | Binary PDF/image storage | ~62 files | Base64/Buffer storage |
| **prescriptiondocuments** | Prescription metadata | ~32 docs | Links to patientpdfs |
| **labreportdocuments** | Lab report metadata | 30 docs | Links to patientpdfs |
| **bots** | Chatbot conversation history | Dynamic | AI assistant data |

**Total Sample Documents Created: ~341 documents**

---

## 🔄 COMPLETE DATA FLOW ANALYSIS

### 1️⃣ USER AUTHENTICATION FLOW

```
┌─────────────┐
│ Login Page  │
│ (Flutter)   │
└──────┬──────┘
       │ POST /api/auth/login
       │ { email, password }
       ▼
┌─────────────────────┐
│ Auth Middleware     │
│ • Verify credentials│
│ • Hash comparison   │
│ • Generate JWT      │
└──────┬──────────────┘
       │ Returns:
       │ • accessToken (JWT)
       │ • refreshToken (hashed)
       │ • user { id, role, firstName, lastName, email }
       ▼
┌─────────────────────┐
│ Store in            │
│ SharedPreferences   │
│ (Flutter Local)     │
└─────────────────────┘
```

**Data Used:**
- **Input:** Email (lowercase, validated), Password (plain text)
- **Processing:** bcrypt.compare() with 10 salt rounds
- **Output:** JWT token (expires in 1005 minutes), User object
- **Storage:** SharedPreferences (Flutter), AuthSession collection (MongoDB)

**Metadata Fields:**
- `deviceId`: Device identifier
- `ip`: Request IP address
- `userAgent`: Browser/app info
- `loginAt`: Timestamp
- `expiresAt`: Token expiration

---

### 2️⃣ PATIENT MANAGEMENT FLOW

```
┌──────────────────┐
│ Patient Form     │
│ (Flutter)        │
│ • Demographics   │
│ • Contact Info   │
│ • Medical Info   │
└────────┬─────────┘
         │ POST /api/patients
         │ Complete patient object
         ▼
┌──────────────────────────┐
│ Patient Model (MongoDB)  │
│ • Generate UUID          │
│ • Validate data          │
│ • Calculate BMI          │
│ • Assign doctor          │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Patient Document Saved   │
│ _id: UUID                │
│ firstName, lastName      │
│ dateOfBirth, age         │
│ vitals { bp, temp, etc } │
│ address { nested }       │
│ prescriptions: []        │
│ medicalReports: []       │
└──────────────────────────┘
```

**Sample Patient Data Created:**

```javascript
{
  _id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  firstName: "Kavya",
  lastName: "Iyer",
  dateOfBirth: "1985-03-15T00:00:00.000Z",
  age: 38,
  gender: "Female",
  bloodGroup: "O+",
  phone: "+919876543210",
  email: "kavya.iyer@example.com",
  address: {
    houseNo: "45",
    street: "Gandhi Road",
    city: "Karur",
    state: "Tamil Nadu",
    pincode: "639002",
    country: "India"
  },
  vitals: {
    heightCm: 162,
    weightKg: 58,
    bmi: "22.10",
    bp: "120/80",
    temp: 98.2,
    pulse: 75,
    spo2: 98
  },
  doctorId: "doctor-uuid-sanjit",
  allergies: ["Penicillin"],
  prescriptions: [ /* array of prescriptions */ ],
  notes: "Regular patient. Cooperative.",
  metadata: {
    registrationDate: "2024-01-15T10:30:00.000Z",
    insuranceProvider: "Star Health",
    emergencyContact: "+919876543211"
  },
  createdAt: "2024-12-03T04:00:00.000Z",
  updatedAt: "2024-12-03T04:00:00.000Z"
}
```

**Data Sources:**
- **Manual Entry:** Flutter forms (Admin/Doctor modules)
- **Telegram Bot:** Automated patient registration
- **Intake Forms:** Reception data capture

---

### 3️⃣ APPOINTMENT SCHEDULING FLOW

```
┌────────────────────┐
│ Calendar Widget    │
│ (Flutter)          │
│ • Select date/time │
│ • Choose doctor    │
│ • Select patient   │
└──────┬─────────────┘
       │ POST /api/appointments
       │ { patientId, doctorId, startAt, appointmentType }
       ▼
┌──────────────────────────┐
│ Appointment Model        │
│ • Generate UUID          │
│ • Generate code (APT-XX) │
│ • Set status: Scheduled  │
│ • Initialize followUp    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Appointment Document Saved           │
│ appointmentCode: "APT-LXYZ-ABCD"    │
│ patientId → references patients      │
│ doctorId → references users          │
│ startAt: ISO timestamp               │
│ status: Scheduled/Completed/etc      │
│ followUp: { nested object }          │
└──────────────────────────────────────┘
```

**Sample Appointment Data:**

```javascript
{
  _id: "apt-uuid-12345",
  appointmentCode: "APT-LXYZ1234-ABCD",
  patientId: "patient-uuid-kavya",
  doctorId: "doctor-uuid-sanjit",
  appointmentType: "Consultation",
  startAt: "2024-12-05T10:00:00.000Z",
  endAt: "2024-12-05T10:30:00.000Z",
  location: "Consultation Room 3",
  status: "Scheduled",
  vitals: {
    bp: "122/78",
    temp: 98.4,
    pulse: 72,
    spo2: 99
  },
  notes: "Abdominal pain",
  metadata: {
    chiefComplaint: "Chronic constipation",
    diagnosis: null, // Set after appointment
    treatmentPlan: null
  },
  followUp: {
    isFollowUp: false,
    isRequired: false,
    reason: "",
    priority: "Routine",
    recommendedDate: null,
    scheduledDate: null,
    labTests: [],
    imaging: [],
    procedures: []
  },
  createdAt: "2024-12-03T04:00:00.000Z"
}
```

**41 Appointments Created:**
- **Scheduled (Future):** ~12 appointments
- **Completed (Past):** ~27 appointments
- **Cancelled/No-Show:** ~2 appointments
- **Appointment Types:** Consultation, Follow-up, Emergency, Checkup
- **Time Distribution:** Last 90 days to next 30 days

---

### 4️⃣ PRESCRIPTION & PHARMACY FLOW

```
┌────────────────────────┐
│ Doctor Consultation    │
│ (Completed Appt)       │
│ • Diagnosis made       │
│ • Medicines selected   │
└──────┬─────────────────┘
       │ POST /api/appointments/{id}
       │ Update with prescription
       ▼
┌──────────────────────────────────┐
│ 1. Patient.prescriptions[] ←──┐  │
│    Embedded prescription array │  │
└──────┬─────────────────────────┘  │
       │                             │
       ▼                             │
┌──────────────────────────────────┐│
│ 2. PatientPDF Collection        ││
│    Store PDF binary (Buffer)    ││
└──────┬─────────────────────────┬─┘│
       │                         │   │
       ▼                         │   │
┌──────────────────────────────┐ │  │
│ 3. PrescriptionDocument      │ │  │
│    Metadata + OCR text       │ │  │
│    pdfId → PatientPDF        │─┘  │
└──────┬───────────────────────┘    │
       │                             │
       ▼                             │
┌──────────────────────────────────┐│
│ 4. PharmacyRecord               ││
│    Dispensing transaction       ││
│    Items, quantities, payment   ││
└─────────────────────────────────┘│
```

**Sample Prescription Data:**

**In Patient.prescriptions array:**
```javascript
{
  prescriptionId: "rx-uuid-12345",
  appointmentId: "apt-uuid-12345",
  doctorId: "doctor-uuid-sanjit",
  medicines: [
    {
      medicineId: "med-uuid-omeprazole",
      name: "Omeprazole",
      dosage: "1-0-1",
      frequency: "After food",
      duration: "7 days",
      quantity: 14
    },
    {
      medicineId: "med-uuid-domperidone",
      name: "Domperidone",
      dosage: "1-1-1",
      frequency: "Before food",
      duration: "5 days",
      quantity: 15
    }
  ],
  notes: "Take medicines as prescribed. Avoid spicy food.",
  issuedAt: "2024-11-28T10:30:00.000Z"
}
```

**PatientPDF Document:**
```javascript
{
  _id: "pdf-uuid-12345",
  patientId: "patient-uuid-kavya",
  title: "Prescription",
  fileName: "prescription_1733199600000.pdf",
  mimeType: "application/pdf",
  data: <Buffer 53 61 6d 70 6c 65 20 70 72...>, // Binary data
  size: 2048,
  uploadedAt: "2024-11-28T10:30:00.000Z"
}
```

**PrescriptionDocument (Metadata):**
```javascript
{
  _id: "presc-doc-uuid-12345",
  patientId: "patient-uuid-kavya",
  pdfId: "pdf-uuid-12345", // References PatientPDF
  doctorName: "Dr. Sanjit Kumar",
  hospitalName: "Karur Gastro Foundation",
  prescriptionDate: "2024-11-28T10:30:00.000Z",
  medicines: [ /* structured medicine data */ ],
  diagnosis: "Gastritis",
  instructions: "Take as prescribed. Avoid spicy food.",
  ocrText: "Prescription for Kavya Iyer...",
  ocrEngine: "manual",
  ocrConfidence: 100,
  status: "completed",
  uploadedBy: "doctor-uuid-sanjit"
}
```

**PharmacyRecord (Dispensing):**
```javascript
{
  _id: "pharm-uuid-12345",
  type: "Dispense",
  patientId: "patient-uuid-kavya",
  appointmentId: "apt-uuid-12345",
  items: [
    {
      medicineId: "med-uuid-omeprazole",
      sku: "MED1234",
      name: "Omeprazole",
      dosage: "1-0-1",
      frequency: "After food",
      duration: "7 days",
      quantity: 14,
      unitPrice: 8,
      taxPercent: 5,
      lineTotal: 112
    }
  ],
  total: 320,
  paid: true,
  paymentMethod: "Card",
  notes: "Prescription dispensed",
  metadata: {
    dispensedBy: "Pharmacist"
  }
}
```

**32 Prescriptions Created** with:
- 2-5 medicines per prescription
- Complete dosage information
- Pharmacy dispensing records
- PDF documents with metadata

---

### 5️⃣ LAB REPORTS FLOW

```
┌────────────────────────┐
│ Lab Test Ordered       │
│ (Doctor/Pathologist)   │
│ • Test type selected   │
│ • Sample collected     │
└──────┬─────────────────┘
       │ POST /api/pathology/reports
       │ { patientId, testType, results }
       ▼
┌──────────────────────────────────┐
│ 1. LabReport Collection          │
│    Structured test results       │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 2. PatientPDF Collection         │
│    Store report PDF binary       │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 3. LabReportDocument             │
│    Metadata + OCR results        │
│    pdfId → PatientPDF            │
└──────────────────────────────────┘
```

**Sample Lab Report Data:**

**LabReport Document:**
```javascript
{
  _id: "lab-uuid-12345",
  patientId: "patient-uuid-kavya",
  testType: "Complete Blood Count (CBC)",
  testCategory: "Blood Test",
  results: {
    hemoglobin: "13.5",
    wbc: 7500,
    platelets: 250000,
    rbc: "4.8"
  },
  rawText: "Test: CBC\nResults: {...}",
  metadata: {
    reportDate: "2024-11-20T09:00:00.000Z",
    lab: "Karur Gastro Lab",
    technician: "Kumar",
    status: "Completed"
  }
}
```

**LabReportDocument (Metadata):**
```javascript
{
  _id: "lab-doc-uuid-12345",
  patientId: "patient-uuid-kavya",
  pdfId: "pdf-lab-uuid-12345",
  testType: "Complete Blood Count (CBC)",
  testCategory: "Blood Test",
  labName: "Karur Gastro Lab",
  reportDate: "2024-11-20T09:00:00.000Z",
  results: [
    {
      testName: "hemoglobin",
      value: "13.5",
      unit: "g/dL",
      referenceRange: "12-16",
      flag: "normal"
    },
    {
      testName: "wbc",
      value: "7500",
      unit: "cells/μL",
      referenceRange: "4000-11000",
      flag: "normal"
    }
  ],
  ocrText: "CBC Report...",
  ocrEngine: "manual",
  ocrConfidence: 95,
  extractionQuality: "good",
  status: "completed"
}
```

**30 Lab Reports Created:**
- **Test Types:** CBC, LFT, KFT, Lipid Profile, Blood Glucose, H. Pylori, Ultrasound, Endoscopy, etc.
- **Categories:** Blood Test, Imaging, Endoscopy, Stool Test
- **Results:** Structured JSON with realistic medical values
- **PDF Storage:** Binary data in PatientPDF collection

---

### 6️⃣ STAFF & PAYROLL MANAGEMENT FLOW

```
┌────────────────────────┐
│ Staff Management       │
│ (Admin Module)         │
│ • Add staff member     │
│ • Assign role/dept     │
└──────┬─────────────────┘
       │ POST /api/staff
       │ { name, designation, contact, etc }
       ▼
┌──────────────────────────────────┐
│ Staff Collection                 │
│ • Employee details               │
│ • Department, designation        │
│ • Salary structure               │
└──────┬───────────────────────────┘
       │
       │ Monthly (Automated/Manual)
       ▼
┌──────────────────────────────────┐
│ Payroll Generation               │
│ POST /api/payroll/bulk/generate  │
│ • Calculate salaries             │
│ • Apply deductions (PF, ESI, PT) │
│ • Generate payslips              │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Payroll Collection               │
│ • Monthly salary records         │
│ • Earnings & deductions          │
│ • Payment status tracking        │
└──────────────────────────────────┘
```

**Sample Staff Data:**

```javascript
{
  _id: "staff-uuid-12345",
  name: "Arun Krishnan",
  designation: "Senior Nurse",
  department: "Gastroenterology",
  patientFacingId: "EMP1234",
  contact: "+919876543220",
  email: "arun.krishnan@example.com",
  gender: "Male",
  status: "Available",
  shift: "Morning",
  roles: ["senior_nurse"],
  qualifications: ["BSc Nursing"],
  experienceYears: 8,
  joinedAt: "2016-03-01T00:00:00.000Z",
  metadata: {
    employeeCode: "EMP1234",
    aadhar: "1234-5678-9012",
    pan: "ABCDE1234F"
  }
}
```

**Sample Payroll Data:**

```javascript
{
  _id: "payroll-uuid-12345",
  staffId: "staff-uuid-12345",
  staffName: "Arun Krishnan",
  staffCode: "EMP1234",
  department: "Gastroenterology",
  designation: "Senior Nurse",
  
  // Pay Period
  payPeriodMonth: 11,
  payPeriodYear: 2024,
  payPeriodStart: "2024-11-01T00:00:00.000Z",
  payPeriodEnd: "2024-11-30T23:59:59.999Z",
  paymentDate: "2024-11-30T00:00:00.000Z",
  status: "paid",
  
  // Salary Components
  basicSalary: 35000,
  earnings: [
    { name: "HRA", type: "earning", amount: 14000, isTaxable: true },
    { name: "DA", type: "earning", amount: 5250, isTaxable: true },
    { name: "Conveyance", type: "earning", amount: 1600, isTaxable: false },
    { name: "Medical Allowance", type: "earning", amount: 1250, isTaxable: false }
  ],
  deductions: [
    { name: "PF", type: "deduction", amount: 1800, isStatutory: true },
    { name: "Professional Tax", type: "deduction", amount: 200, isStatutory: true }
  ],
  
  // Calculated Amounts
  totalEarnings: 57100,
  totalDeductions: 2000,
  grossSalary: 57100,
  netSalary: 55100,
  ctc: 685200, // Annual CTC
  
  // Attendance
  attendance: {
    totalDays: 30,
    presentDays: 24,
    absentDays: 1,
    leaves: {
      casual: 1,
      sick: 0
    }
  },
  
  // Statutory Compliance
  statutory: {
    pfApplicable: true,
    esiApplicable: false,
    ptApplicable: true,
    employeePF: 1800,
    employerPF: 1800,
    professionalTax: 200
  },
  
  // Payment Details
  paymentMode: "bank_transfer",
  bankName: "HDFC Bank",
  accountNumber: "123456789012",
  ifscCode: "HDFC0123456",
  
  metadata: {
    payrollCode: "PAY202411-0001",
    generatedAt: "2024-11-30T00:00:00.000Z"
  }
}
```

**10 Staff Members Created:**
- Senior Nurse, Staff Nurse, Lab Technician, Pharmacist, Receptionist
- Medical Assistant, Ward Boy, Cleaner, Admin Staff, IT Support

**30 Payroll Records Created:**
- 3 months of salary records (October, November, December 2024)
- Status: `draft`, `pending`, `approved`, `paid`
- Automatic calculation of PF (12%), ESI (0.75%), Professional Tax
- Complete attendance tracking

---

### 7️⃣ DOCTOR MANAGEMENT & SCHEDULES

**2 Doctors Created:**

**Dr. Sanjit Kumar (Gastroenterology):**
```javascript
{
  _id: "doctor-uuid-sanjit",
  role: "doctor",
  firstName: "Sanjit",
  lastName: "Kumar",
  email: "dr.sanjit@karurgastro.com",
  phone: "+919876543210",
  password: "[hashed with bcrypt]",
  is_active: true,
  metadata: {
    specialization: "Gastroenterology",
    department: "Gastroenterology",
    experience: 15,
    qualification: "MBBS, MD (Gastro)",
    consultationFee: 800,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    timings: "09:00 AM - 05:00 PM"
  }
}
```

**Dr. Sriram Iyer (General Medicine):**
```javascript
{
  _id: "doctor-uuid-sriram",
  role: "doctor",
  firstName: "Sriram",
  lastName: "Iyer",
  email: "dr.sriram@karurgastro.com",
  phone: "+919876543211",
  password: "[hashed with bcrypt]",
  is_active: true,
  metadata: {
    specialization: "General Medicine",
    department: "Medicine",
    experience: 12,
    qualification: "MBBS, MD",
    consultationFee: 600,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    timings: "09:00 AM - 05:00 PM"
  }
}
```

**Doctor Staff Records:**
- Both doctors also have entries in `staff` collection
- patientFacingId: DOC101, DOC102
- Linked via metadata.userId

**Patient Distribution:**
- ~10 patients assigned to Dr. Sanjit
- ~10 patients assigned to Dr. Sriram
- Appointments distributed across both doctors

---

### 8️⃣ MEDICINE CATALOG

**15 Medicines Created:**

| Medicine | Generic Name | Form | Strength | Category | SKU |
|----------|--------------|------|----------|----------|-----|
| Omeprazole | Omeprazole | Capsule | 20mg | Antacid | MED1234 |
| Ranitidine | Ranitidine | Tablet | 150mg | H2 Blocker | MED1235 |
| Pantoprazole | Pantoprazole | Tablet | 40mg | PPI | MED1236 |
| Metoclopramide | Metoclopramide | Tablet | 10mg | Antiemetic | MED1237 |
| Domperidone | Domperidone | Tablet | 10mg | Prokinetic | MED1238 |
| Loperamide | Loperamide | Capsule | 2mg | Antidiarrheal | MED1239 |
| Bisacodyl | Bisacodyl | Tablet | 5mg | Laxative | MED1240 |
| Mebeverine | Mebeverine | Tablet | 135mg | Antispasmodic | MED1241 |
| Ciprofloxacin | Ciprofloxacin | Tablet | 500mg | Antibiotic | MED1242 |
| Paracetamol | Acetaminophen | Tablet | 500mg | Analgesic | MED1243 |
| Ibuprofen | Ibuprofen | Tablet | 400mg | NSAID | MED1244 |
| Simethicone | Simethicone | Syrup | 40mg/5ml | Anti-gas | MED1245 |
| Lactulose | Lactulose | Syrup | 10g/15ml | Laxative | MED1246 |
| Ondansetron | Ondansetron | Tablet | 4mg | Antiemetic | MED1247 |
| Probiotic | Lactobacillus | Capsule | 1B CFU | Probiotic | MED1248 |

**Medicine Batches:**
- Each medicine has a batch record
- Batch number format: `BATCH-{timestamp}-{random}`
- Quantity: 500-1000 units per batch
- Expiry: 2 years from creation
- Suppliers: ABC Distributors, XYZ Medical Supplies, PQR Pharma
- Price range: ₹10-500 per unit

---

### 9️⃣ AI CHATBOT INTEGRATION

**Technology:** Google Gemini API (gemini-2.5-flash)

**Features:**
- Role-based system prompts (Doctor, Admin, Pharmacist, Pathologist)
- Context-aware conversations
- Medical terminology understanding
- Patient history access
- Appointment scheduling assistance
- Medicine lookup and interaction checking

**Data Flow:**
```
User Query → Flutter ChatBot Widget
    ↓
POST /api/bot/chat
    ↓
Gemini API Processing
    ↓
Bot Collection (conversation history saved)
    ↓
Response returned to Flutter
```

**Bot Document Structure:**
```javascript
{
  _id: "bot-uuid-12345",
  userId: "user-uuid-doctor",
  sessions: [
    {
      sessionId: "session-uuid-12345",
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          text: "What are the symptoms of gastritis?",
          timestamp: "2024-12-03T10:00:00.000Z"
        },
        {
          role: "assistant",
          text: "Gastritis symptoms include...",
          timestamp: "2024-12-03T10:00:02.000Z"
        }
      ],
      metadata: {
        tokensUsed: 150,
        modelVersion: "gemini-2.5-flash"
      },
      createdAt: "2024-12-03T10:00:00.000Z"
    }
  ],
  archived: false
}
```

---

### 🔟 INTAKE FORMS FLOW

**Purpose:** Patient admission and triage

**Data Captured:**
- Patient snapshot (demographics at admission time)
- Triage information (chief complaint, vitals, priority)
- Consent forms
- Insurance information

**Sample Intake:**
```javascript
{
  _id: "intake-uuid-12345",
  patientId: "patient-uuid-kavya",
  patientSnapshot: {
    firstName: "Kavya",
    lastName: "Iyer",
    dateOfBirth: "1985-03-15T00:00:00.000Z",
    gender: "Female",
    phone: "+919876543210",
    email: "kavya.iyer@example.com"
  },
  doctorId: "doctor-uuid-sanjit",
  appointmentId: "apt-uuid-12345",
  triage: {
    chiefComplaint: "Abdominal pain",
    vitals: {
      bp: "120/80",
      temp: 98.2,
      pulse: 75,
      spo2: 98,
      weightKg: 58,
      heightCm: 162,
      bmi: "22.10"
    },
    priority: "Normal",
    triageCategory: "Green"
  },
  consent: {
    consentGiven: true,
    consentAt: "2024-12-03T09:00:00.000Z",
    consentBy: "digital"
  },
  notes: "Initial assessment completed",
  status: "Converted",
  createdBy: "doctor-uuid-sanjit",
  convertedAt: "2024-12-03T09:15:00.000Z"
}
```

**~20 Intake Forms Created**

---

## 🎯 METADATA ANALYSIS

### Timestamps & Audit Trail
Every document includes:
- `createdAt`: Auto-generated by Mongoose
- `updatedAt`: Auto-updated on changes
- Custom timestamps for business logic (appointmentAt, dispensedAt, etc.)

### Indexing Strategy
**Key Indexes:**
- Patient phone numbers (for quick lookup)
- Doctor IDs (for appointment queries)
- Appointment codes (unique identifiers)
- Date ranges (for reports and analytics)
- Status fields (for filtering)

### Data Validation
- Email: Regex validation `/^\S+@\S+\.\S+$/`
- Phone: 7-15 digits with optional + prefix
- Enum fields: Strict value validation
- Required fields: Enforced at schema level
- UUID format: v4 standard

### Security & Privacy
- Passwords: bcrypt hashed with 10 salt rounds
- JWT tokens: Signed with secret, 1005 min expiry
- Sensitive data: Not logged in production
- CORS: Configured for specific origins
- Input sanitization: Mongoose schema validation

---

## 📈 DATA STATISTICS

### Document Counts (Sample Data)
```
Users (Doctors):           2
Staff:                    12  (2 doctors + 10 staff)
Patients:                 20
Appointments:             41
Medicines:                15
Medicine Batches:         15
Pharmacy Records:         32
Lab Reports:              30
Intake Forms:             20
Payroll Records:          30  (3 months × 10 staff)
Patient PDFs:             62  (32 prescriptions + 30 lab reports)
Prescription Documents:   32
Lab Report Documents:     30
──────────────────────────────
TOTAL DOCUMENTS:         341+
```

### Storage Breakdown
- **Text Data:** ~5 MB (JSON documents)
- **Binary Data:** ~10 MB (PDF files in PatientPDF)
- **Total Database Size:** ~15 MB (sample data)

### Time Range
- **Historical Data:** Last 90 days (completed appointments)
- **Future Data:** Next 30 days (scheduled appointments)
- **Payroll:** Last 3 months (October-December 2024)
- **Lab Reports:** Last 180 days

---

## 🔐 ACCESS CONTROL & ROLES

### Role Hierarchy
```
superadmin
    └── admin
            ├── doctor
            ├── pharmacist
            ├── pathologist
            └── reception
```

### Permissions by Role

**Doctor:**
- View assigned patients
- Create/update appointments
- Write prescriptions
- Request lab tests
- Access patient medical history
- Generate reports

**Pharmacist:**
- View pending prescriptions
- Dispense medicines
- Manage inventory
- Update medicine catalog
- Generate pharmacy reports

**Pathologist:**
- View lab test orders
- Upload test results
- Manage lab reports
- Access patient test history

**Admin/Superadmin:**
- Full system access
- User management
- Staff management
- Payroll processing
- System configuration
- Analytics and reports

---

## 🌐 API ENDPOINTS SUMMARY

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/validate-token` - Verify JWT

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Pharmacy
- `GET /api/pharmacy/medicines` - List medicines
- `POST /api/pharmacy/medicines` - Add medicine
- `GET /api/pharmacy/pending-prescriptions` - Pending dispenses
- `POST /api/pharmacy/prescriptions/:id/dispense` - Dispense

### Pathology
- `GET /api/pathology/reports` - List lab reports
- `POST /api/pathology/reports` - Create report
- `GET /api/pathology/reports/:id` - Get report details

### Staff & Payroll
- `GET /api/staff` - List staff
- `POST /api/staff` - Add staff member
- `GET /api/payroll` - List payroll records
- `POST /api/payroll/bulk/generate` - Generate monthly payroll

### Chatbot
- `POST /api/bot/chat` - Chat with AI assistant
- `GET /api/bot/chats` - Get conversation history

### Documents
- `POST /api/scanner-enterprise/upload` - Upload medical documents
- `GET /api/scanner-enterprise/prescriptions/:patientId` - Get prescriptions
- `GET /api/scanner-enterprise/lab-reports/:patientId` - Get lab reports

---

## 🔄 DATA SYNCHRONIZATION

### Flutter to Backend
- HTTP requests using `http` package
- JSON serialization with Dart models
- SharedPreferences for local caching
- Token-based authentication headers

### Backend to Database
- Mongoose ODM for MongoDB
- Connection pooling (max: 10, min: 0)
- Retry logic (3 attempts, 2s delay)
- Transaction support for critical operations

### Real-time Updates
- Polling mechanism in Flutter
- Refresh indicators on list views
- Auto-refresh on app resume
- Manual refresh triggers

---

## 📱 FLUTTER APP STRUCTURE

### Modules
- **Common:** Login, Splash, No Internet, Chatbot
- **Admin:** Dashboard, Patients, Appointments, Staff, Pharmacy, Pathology, Payroll, Settings
- **Doctor:** Dashboard, Patients, Appointments, Schedule, Follow-ups, Settings
- **Pharmacist:** Dashboard, Medicines, Prescriptions, Settings
- **Pathologist:** Dashboard, Test Reports, Patients, Settings

### State Management
- **Provider:** App-level state (user, theme, etc.)
- **Riverpod:** Feature-specific state
- **SharedPreferences:** Local persistence

### Key Widgets
- `GenericDataTable`: Reusable data table with pagination
- `EnterpriseChatbotWidget`: AI assistant interface
- `EnterprisePatientForm`: Comprehensive patient form
- `DoctorAppointmentPreview`: Appointment details with actions
- `PayrollFormEnhanced`: Payroll entry/editing

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Backend (Node.js)
- **Hosting:** Render.com (or similar cloud platform)
- **URL:** https://hms-dev.onrender.com
- **Environment:** Production/Staging
- **Process Manager:** PM2 (if self-hosted)

### Database (MongoDB)
- **Hosting:** MongoDB Atlas (Cloud)
- **Tier:** M0/M2 (Shared/Dedicated)
- **Region:** Closest to users (likely Asia-Pacific)
- **Backup:** Automated daily backups

### Frontend (Flutter)
- **Web:** Hosted on Firebase Hosting or Netlify
- **Mobile:** APK/IPA distribution
- **Build:** Production build with minification

---

## 📊 SAMPLE DATA SUMMARY

### What Was Created:
✅ **2 Doctors** (Dr. Sanjit Kumar, Dr. Sriram Iyer)  
✅ **20 Patients** with complete demographics, vitals, medical history  
✅ **41 Appointments** (past and future, various statuses)  
✅ **32 Prescriptions** with 2-5 medicines each  
✅ **32 Pharmacy Dispense Records** with payment tracking  
✅ **30 Lab Reports** with realistic test results  
✅ **62 PDF Documents** (binary storage)  
✅ **15 Medicines** in catalog with batch information  
✅ **10 Staff Members** (nurses, technicians, admin staff)  
✅ **30 Payroll Records** (3 months of salary data)  
✅ **20 Intake Forms** with triage information  

### Data Realism:
- Realistic Indian names, addresses, phone numbers
- Medical terminology and diagnoses
- Appropriate medicine dosages and frequencies
- Standard lab test values and ranges
- Professional designations and qualifications
- Salary structures with statutory deductions

### Login Credentials:
```
Dr. Sanjit Kumar
Email: dr.sanjit@karurgastro.com
Password: Doctor@123

Dr. Sriram Iyer
Email: dr.sriram@karurgastro.com
Password: Doctor@123
```

---

## 🎯 KEY INSIGHTS

### Data Relationships
- **Patient-centric:** All data revolves around patient records
- **UUID References:** Consistent cross-collection linking
- **Embedded vs. Referenced:** Mix of both patterns for optimization
- **Audit Trail:** Complete history with timestamps

### Performance Considerations
- Indexes on frequently queried fields
- Lean queries for list views
- Populated queries for detail views
- Pagination for large datasets

### Business Logic
- Automatic BMI calculation
- Age calculation from DOB
- Payroll auto-calculation (PF, ESI, PT)
- Appointment code generation
- Follow-up tracking system

### Future Scalability
- Microservices-ready architecture
- Horizontal scaling with MongoDB sharding
- Load balancing capability
- Caching layer (Redis) ready
- Message queue (RabbitMQ) integration possible

---

## 📝 CONCLUSION

This HMS system demonstrates **enterprise-grade architecture** with:
- ✅ Comprehensive data modeling
- ✅ Role-based access control
- ✅ Complete medical workflow coverage
- ✅ AI integration for assistance
- ✅ Financial management (payroll)
- ✅ Document management (PDF storage)
- ✅ Audit and compliance features
- ✅ Mobile and web support

The sample data created provides a **realistic testing environment** with interconnected records spanning all major features of the hospital management system.

---

**Generated with ❤️ for Karur Gastro Foundation HMS**  
*Last Updated: December 3, 2024*

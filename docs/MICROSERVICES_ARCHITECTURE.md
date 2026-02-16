# Microservices Architecture Documentation
## Karur Gastro Hospital Management System

**Version:** 1.0  
**Last Updated:** 2024-12-04  
**Architecture:** Modular Monolith with Service-Oriented Components

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Registry](#service-registry)
3. [Core Services](#core-services)
4. [External Services](#external-services)
5. [Communication Patterns](#communication-patterns)
6. [Data Contracts](#data-contracts)
7. [Service Dependencies](#service-dependencies)
8. [Deployment Architecture](#deployment-architecture)

---

## Architecture Overview

The Karur HMS follows a **modular monolith** architecture with clear service boundaries. While deployed as a single application, services are designed with loose coupling and high cohesion for future microservices migration.

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Express)                    │
│                     Port: 5000 (Backend)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Core Services│  │ AI Services  │  │ Integration  │
│              │  │              │  │  Services    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │   MongoDB Atlas   │
                 │  (Primary Store)  │
                 └──────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API Gateway** | Express.js 5.x | HTTP routing, middleware |
| **Core Backend** | Node.js 18+ | Business logic |
| **AI Services** | Python (FastAPI) | NLP, OCR, Chatbot |
| **Bot Service** | Node.js + Telegram API | Telegram integration |
| **Image Processing** | Python (Flask) | OCR, document processing |
| **Database** | MongoDB Atlas | Primary data store |
| **Auth** | JWT + bcrypt | Authentication |
| **PDF Generation** | PDFKit, PDFMake | Report generation |

---

## Service Registry

### Internal Services

| Service Name | Type | Port | Technology | Status |
|--------------|------|------|------------|--------|
| **API Gateway** | HTTP | 5000 | Node.js/Express | Active |
| **Auth Service** | HTTP | - | Node.js | Active |
| **Patient Service** | HTTP | - | Node.js | Active |
| **Appointment Service** | HTTP | - | Node.js | Active |
| **Pharmacy Service** | HTTP | - | Node.js | Active |
| **Pathology Service** | HTTP | - | Node.js | Active |
| **Staff Service** | HTTP | - | Node.js | Active |
| **Payroll Service** | HTTP | - | Node.js | Active |
| **Intake Service** | HTTP | - | Node.js | Active |
| **Report Service** | HTTP | - | Node.js | Active |
| **Doctor Service** | HTTP | - | Node.js | Active |
| **Card Service** | HTTP | - | Node.js | Active |
| **Telegram Bot** | WebSocket | 3001 | Node.js | Active |
| **AI Chatbot** | HTTP | 8000 | Python/FastAPI | Active |
| **Image Processor** | HTTP | 5001 | Python/Flask | Active |
| **Scanner Service** | HTTP | - | Node.js | Active |

### External Services

| Service Name | Provider | Purpose | Integration Method |
|--------------|----------|---------|-------------------|
| **Azure OpenAI** | Microsoft | GPT-4 for chatbot | REST API |
| **Google Cloud Vision** | Google | OCR for documents | REST API |
| **Gemini AI** | Google | Telegram bot AI | REST API |
| **MongoDB Atlas** | MongoDB | Database | Native Driver |
| **Telegram Bot API** | Telegram | Bot messaging | WebSocket/Polling |

---

## Core Services

### 1. Authentication Service

**File:** `routes/auth.js`  
**Responsibility:** User authentication, session management, token generation

#### Service Contract

```javascript
// POST /api/auth/login
Request: {
  email: string,
  password: string,
  deviceId?: string
}

Response: {
  success: boolean,
  accessToken: string,
  refreshToken: string,
  sessionId: string,
  user: {
    id: string,
    email: string,
    role: string,
    firstName: string,
    lastName: string
  }
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTPS
- **Authentication:** None (public endpoint)
- **Rate Limiting:** 5 requests/minute per IP

#### Data Contract

```typescript
interface AuthUser {
  _id: string;              // UUID
  email: string;            // Unique, lowercase
  password: string;         // Bcrypt hashed
  role: 'superadmin' | 'admin' | 'doctor' | 'pharmacist' | 'pathologist' | 'reception';
  firstName: string;
  lastName: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthSession {
  _id: string;              // UUID
  userId: string;           // FK to User
  deviceId?: string;
  refreshTokenHash: string;
  ip?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}
```

#### Dependencies
- **Upstream:** None
- **Downstream:** All services (provides JWT tokens)
- **Database:** MongoDB (users, authsessions collections)

---

### 2. Patient Service

**File:** `routes/patients.js`  
**Responsibility:** Patient master data management, CRUD operations

#### Service Contract

```javascript
// POST /api/patients
Request: {
  firstName: string,
  lastName?: string,
  phone: string,
  email?: string,
  dateOfBirth?: Date,
  gender?: 'Male' | 'Female' | 'Other',
  bloodGroup?: string,
  address?: AddressObject,
  vitals?: VitalsObject,
  allergies?: string[],
  doctorId?: string,
  metadata?: object
}

Response: {
  success: boolean,
  patient: PatientObject,
  message?: string
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTPS
- **Authentication:** JWT Bearer token
- **Authorization:** Admin, Doctor, Reception

#### Data Contract

```typescript
interface Patient {
  _id: string;              // UUID
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  phone: string;            // Indexed
  email?: string;           // Indexed
  address?: {
    houseNo?: string;
    street?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  vitals?: {
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    bp?: string;
    temp?: number;
    pulse?: number;
    spo2?: number;
  };
  doctorId?: string;        // FK to User
  allergies: string[];
  prescriptions: Prescription[];
  notes: string;
  metadata: Record<string, any>;
  medicalReports: MedicalReport[];
  telegramUserId?: string;
  telegramUsername?: string;
  deleted_at?: Date;        // Soft delete
  createdAt: Date;
  updatedAt: Date;
}
```

#### Dependencies
- **Upstream:** Auth Service (JWT validation)
- **Downstream:** Appointment, Intake, Pharmacy, Pathology services
- **Database:** MongoDB (patients collection)

---

### 3. Appointment Service

**File:** `routes/appointment.js`  
**Responsibility:** Appointment scheduling, follow-up management

#### Service Contract

```javascript
// POST /api/appointments
Request: {
  patientId: string,
  doctorId: string,
  appointmentType: string,
  startAt: Date,
  endAt?: Date,
  location?: string,
  status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show' | 'Rescheduled',
  vitals?: object,
  notes?: string,
  followUp?: FollowUpObject
}

Response: {
  success: boolean,
  message: string,
  appointment: AppointmentObject
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTPS
- **Authentication:** JWT Bearer token
- **Authorization:** Admin, Doctor, Reception

#### Data Contract

```typescript
interface Appointment {
  _id: string;              // UUID
  appointmentCode: string;  // Auto-generated (APT-XXX)
  patientId: string;        // FK to Patient
  doctorId: string;         // FK to User
  appointmentType: string;
  startAt: Date;            // Indexed
  endAt?: Date;
  location: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show' | 'Rescheduled';
  vitals: Record<string, any>;
  notes: string;
  metadata: Record<string, any>;
  followUp: {
    isFollowUp: boolean;
    isRequired: boolean;
    reason: string;
    instructions: string;
    priority: 'Routine' | 'Important' | 'Urgent' | 'Critical';
    recommendedDate?: Date;
    scheduledDate?: Date;
    diagnosis: string;
    treatmentPlan: string;
    labTests: LabTest[];
    imaging: Imaging[];
    procedures: Procedure[];
    previousAppointmentId?: string;  // Self-referencing
    nextAppointmentId?: string;      // Self-referencing
    outcome: 'Improved' | 'Stable' | 'Worsened' | 'Resolved' | 'Pending';
  };
  telegramUserId?: string;
  telegramChatId?: string;
  bookingSource: 'web' | 'telegram' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Dependencies
- **Upstream:** Auth Service, Patient Service
- **Downstream:** Intake Service, Telegram Bot
- **Database:** MongoDB (appointments collection)

---

### 4. Pharmacy Service

**File:** `routes/pharmacy.js`  
**Responsibility:** Medicine inventory, batch management, dispensing

#### Service Contract

```javascript
// POST /api/pharmacy/records/dispense
Request: {
  items: [
    {
      medicineId: string,
      batchId: string,
      quantity: number,
      unitPrice: number
    }
  ],
  patientId?: string,
  appointmentId?: string,
  paid: boolean,
  paymentMethod?: string,
  notes?: string
}

Response: {
  success: boolean,
  record: PharmacyRecordObject,
  stockReductions: object[]
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTPS
- **Authentication:** JWT Bearer token
- **Authorization:** Admin, Pharmacist, Doctor (read-only)

#### Data Contract

```typescript
interface Medicine {
  _id: string;              // UUID
  name: string;             // Indexed
  genericName: string;
  sku?: string;             // Unique, indexed
  form: string;             // Tablet, Syrup, etc.
  strength: string;
  unit: string;
  manufacturer: string;
  brand: string;
  category: string;
  description: string;
  status: 'In Stock' | 'Out of Stock' | 'Discontinued';
  metadata: Record<string, any>;
  deleted_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MedicineBatch {
  _id: string;              // UUID
  medicineId: string;       // FK to Medicine
  batchNumber: string;
  expiryDate?: Date;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  supplier: string;
  location: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface PharmacyRecord {
  _id: string;              // UUID
  type: 'PurchaseReceive' | 'Dispense' | 'Return' | 'Adjustment';
  patientId?: string;       // FK to Patient
  appointmentId?: string;
  createdBy?: string;       // FK to User
  items: PharmacyItem[];
  total: number;
  paid: boolean;
  paymentMethod?: string;
  notes?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Dependencies
- **Upstream:** Auth Service, Patient Service
- **Downstream:** Intake Service (prescriptions)
- **Database:** MongoDB (medicines, medicinebatches, pharmacyrecords collections)

---

### 5. Pathology Service

**File:** `routes/pathology.js`  
**Responsibility:** Lab report management, test tracking

#### Service Contract

```javascript
// POST /api/pathology/lab-reports
Request: {
  patientId: string,
  appointmentId?: string,
  testType: string,
  testCategory: string,
  results: object,
  fileRef?: string,
  uploadedBy?: string
}

Response: {
  success: boolean,
  labReport: LabReportObject
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTPS
- **Authentication:** JWT Bearer token
- **Authorization:** Admin, Pathologist, Doctor (read-only)

#### Data Contract

```typescript
interface LabReport {
  _id: string;              // UUID
  patientId: string;        // FK to Patient
  appointmentId?: string;
  documentId?: string;      // FK to MedicalDocument
  testType: string;
  testCategory: string;
  results: Record<string, any>;
  fileRef?: string;         // FK to PatientPDF
  uploadedBy?: string;      // FK to User
  rawText: string;          // OCR output
  enhancedText: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Dependencies
- **Upstream:** Auth Service, Patient Service
- **Downstream:** Image Processor Service (OCR)
- **Database:** MongoDB (labreports collection)

---

### 6. Staff & Payroll Service

**File:** `routes/staff.js`, `routes/payroll.js`  
**Responsibility:** Staff management, payroll processing

#### Service Contract

```javascript
// POST /api/payroll
Request: {
  staffId: string,
  payPeriodMonth: number,
  payPeriodYear: number,
  basicSalary: number,
  earnings: Component[],
  deductions: Component[],
  attendance: AttendanceObject,
  statutory: StatutoryObject
}

Response: {
  success: boolean,
  payroll: PayrollObject
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTPS
- **Authentication:** JWT Bearer token
- **Authorization:** Admin only

#### Data Contract

```typescript
interface Staff {
  _id: string;              // UUID
  name: string;
  designation: string;
  department: string;
  patientFacingId: string;
  contact: string;
  email: string;
  avatarUrl: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  status: 'Available' | 'Off Duty' | 'On Leave' | 'On Call';
  shift: string;
  roles: string[];
  qualifications: string[];
  experienceYears: number;
  joinedAt?: Date;
  lastActiveAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface Payroll {
  _id: string;              // UUID
  staffId: string;          // FK to Staff
  staffName: string;
  payPeriodMonth: number;
  payPeriodYear: number;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  paymentDate?: Date;
  status: 'draft' | 'pending' | 'approved' | 'processed' | 'paid' | 'rejected' | 'on_hold';
  basicSalary: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  reimbursements: SalaryComponent[];
  totalEarnings: number;
  totalDeductions: number;
  totalReimbursements: number;
  grossSalary: number;
  netSalary: number;
  ctc: number;
  attendance: AttendanceSummary;
  statutory: StatutoryCompliance;
  historyLog: HistoryEntry[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Dependencies
- **Upstream:** Auth Service
- **Downstream:** None
- **Database:** MongoDB (staff, payrolls collections)

---

### 7. Intake Service

**File:** `routes/intake.js`  
**Responsibility:** Patient consultation snapshots, intake records

#### Service Contract

```javascript
// POST /api/patients/:id/intake
Request: {
  complaints: string,
  diagnosis: string,
  vitals: VitalsObject,
  treatment: string,
  prescriptions: Prescription[],
  pharmacyItems: PharmacyItem[],
  labTests: LabTest[],
  followUp?: FollowUpObject,
  notes: string
}

Response: {
  success: boolean,
  intake: IntakeObject,
  pharmacyRecord?: PharmacyRecordObject
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTPS
- **Authentication:** JWT Bearer token
- **Authorization:** Admin, Doctor

#### Data Contract

```typescript
interface Intake {
  _id: string;              // UUID
  patientId?: string;       // FK to Patient (nullable)
  patientSnapshot: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: string;
    phone?: string;
    email?: string;
  };
  doctorId: string;         // FK to User
  appointmentId?: string;
  triage: {
    chiefComplaint: string;
    vitals: VitalsObject;
    priority: 'Normal' | 'Urgent' | 'Emergency';
    triageCategory: 'Green' | 'Yellow' | 'Red';
  };
  consent: {
    consentGiven: boolean;
    consentAt?: Date;
    consentBy: 'digital' | 'paper' | 'verbal';
    consentFileId?: string;
  };
  insurance: {
    hasInsurance: boolean;
    payer: string;
    policyNumber: string;
    coverageMeta: Record<string, any>;
  };
  attachments: string[];
  notes: string;
  meta: Record<string, any>;
  status: 'New' | 'Reviewed' | 'Converted' | 'Rejected';
  createdBy: string;        // FK to User
  convertedAt?: Date;
  convertedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Dependencies
- **Upstream:** Auth Service, Patient Service
- **Downstream:** Pharmacy Service (prescriptions), Pathology Service (lab tests)
- **Database:** MongoDB (intakes collection)

---

### 8. Report Service

**Files:** `routes/reports.js`, `routes/enterpriseReports.js`, `routes/properReports.js`  
**Responsibility:** PDF report generation (patient reports, prescriptions)

#### Service Contract

```javascript
// GET /api/reports/patient/:patientId
Request: {
  // patientId in URL params
}

Response: {
  // Binary PDF stream
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="patient_report.pdf"'
  }
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTPS
- **Authentication:** JWT Bearer token
- **Response Type:** Binary (PDF file)

#### Dependencies
- **Upstream:** Auth Service, Patient Service
- **Libraries:** PDFKit, PDFMake
- **Database:** MongoDB (read-only access)

---

## External Services

### 1. AI Chatbot Service

**Location:** `Bot/app.py`  
**Technology:** Python FastAPI  
**Port:** 8000  
**Responsibility:** NLP-based chatbot, intent detection, conversation management

#### Service Contract

```python
# POST /chat
Request: {
  "message": str,
  "user_id": str,
  "conversation_id": Optional[str]
}

Response: {
  "response": str,
  "intent": str,
  "entities": dict,
  "conversation_id": str
}
```

#### Communication Method
- **Type:** Asynchronous REST API
- **Protocol:** HTTP/HTTPS
- **Integration:** Node.js → Python via HTTP
- **Fallback:** If service unavailable, use fallback responses

#### Data Contract

```python
class ChatMessage(BaseModel):
    message: str
    user_id: str
    conversation_id: Optional[str] = None
    
class ChatResponse(BaseModel):
    response: str
    intent: str
    entities: Dict[str, Any]
    conversation_id: str
    timestamp: datetime
```

#### Dependencies
- **External APIs:** Azure OpenAI (GPT-4), Google Gemini
- **Libraries:** spaCy, transformers, FastAPI
- **Database:** MongoDB (optional conversation persistence)

---

### 2. Telegram Bot Service

**Location:** `Bot/telegram_bot.js`  
**Technology:** Node.js + node-telegram-bot-api  
**Port:** 3001 (webhook mode)  
**Responsibility:** Telegram integration, appointment booking via chat

#### Service Contract

```javascript
// Webhook: POST /api/bot/webhook
Request: {
  // Telegram Update object
  message: {
    chat: { id: number },
    text: string,
    from: { id: number, username: string }
  }
}

Response: {
  // Telegram API responses
  method: 'sendMessage',
  chat_id: number,
  text: string,
  reply_markup?: object
}
```

#### Communication Method
- **Type:** Event-driven (Polling/Webhook)
- **Protocol:** HTTPS (Telegram Bot API)
- **Integration Method:** Standalone service with database access
- **State Management:** In-memory (Map) or Redis

#### Data Contract

```typescript
interface TelegramConversation {
  chatId: number;
  state: ConversationState;
  data: {
    firstName?: string;
    lastName?: string;
    age?: number;
    phone?: string;
    appointmentDate?: Date;
    // ... other fields
  };
  messageCount: number;
  lastActivity: Date;
}

enum ConversationState {
  IDLE = 'idle',
  BOOKING_FIRST_NAME = 'booking_first_name',
  BOOKING_DATE = 'booking_date',
  // ... other states
}
```

#### Dependencies
- **External APIs:** Telegram Bot API, Google Gemini
- **Database:** MongoDB (patients, appointments collections)
- **Upstream:** Appointment Service (via direct database access)

---

### 3. Image Processor Service

**Location:** `image-processor/app.py`  
**Technology:** Python Flask  
**Port:** 5001  
**Responsibility:** OCR processing, document classification

#### Service Contract

```python
# POST /process-image
Request: {
  "image": base64_string,
  "document_type": Optional[str]
}

Response: {
  "success": bool,
  "text": str,
  "confidence": float,
  "entities": dict,
  "classification": str
}
```

#### Communication Method
- **Type:** Synchronous REST API
- **Protocol:** HTTP/HTTPS
- **Integration:** Node.js → Python via HTTP
- **Timeout:** 30 seconds

#### Data Contract

```python
class ImageProcessRequest(BaseModel):
    image: str          # Base64 encoded
    document_type: Optional[str] = None
    
class ImageProcessResponse(BaseModel):
    success: bool
    text: str
    confidence: float
    entities: Dict[str, Any]
    classification: str
    processing_time: float
```

#### Dependencies
- **External APIs:** Google Cloud Vision API
- **Libraries:** Tesseract OCR, OpenCV, PIL
- **Storage:** Temporary file system

---

## Communication Patterns

### 1. Synchronous REST API

**Used For:** Core CRUD operations, real-time data

```
Client → API Gateway → Service → Database → Response
```

**Characteristics:**
- Request-Response pattern
- JWT authentication
- HTTP status codes
- JSON payload
- Timeout: 30 seconds

---

### 2. Asynchronous API Calls

**Used For:** AI processing, OCR, long-running tasks

```
Client → API Gateway → Service → [Background Processing] → Response
      ← (Immediate ACK)
```

**Characteristics:**
- Non-blocking
- Job ID returned immediately
- Polling or callback for results
- Timeout handling
- Retry logic

---

### 3. Event-Driven (Telegram Bot)

**Used For:** Telegram messaging, real-time notifications

```
Telegram API → Bot Service → Database
              ↓
         Business Logic
              ↓
      Telegram API (Response)
```

**Characteristics:**
- Webhook or polling
- Stateful conversations
- In-memory state management
- Asynchronous processing

---

### 4. Internal Service-to-Service

**Used For:** Service dependencies within backend

```
Service A → Direct Function Call → Service B
          (Same process space)
```

**Characteristics:**
- Shared database access
- No network overhead
- Direct model imports
- Transaction support

---

## Data Contracts

### Standard Response Format

```typescript
interface StandardResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: Date;
  };
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errorCode: number;
  details?: any;
  stack?: string;  // Only in development
}
```

### Pagination Format

```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## Service Dependencies

### Dependency Graph

```
┌──────────────┐
│ Auth Service │
└───────┬──────┘
        │ (provides JWT)
        ▼
┌───────────────────────────────────────┐
│  All Services (require authentication) │
└───────────────────────────────────────┘
        │
        ├─────────────┬─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
  ┌─────────┐  ┌────────────┐  ┌─────────┐  ┌──────────┐
  │ Patient │  │Appointment │  │Pharmacy │  │Pathology │
  └────┬────┘  └──────┬─────┘  └────┬────┘  └────┬─────┘
       │              │             │            │
       └──────────────┼─────────────┼────────────┘
                      ▼             ▼
               ┌──────────────────────┐
               │   Intake Service     │
               └──────────────────────┘
```

### Critical Dependencies

| Service | Critical Dependencies | Optional Dependencies |
|---------|----------------------|----------------------|
| Auth | MongoDB | - |
| Patient | Auth, MongoDB | - |
| Appointment | Auth, Patient, MongoDB | Telegram Bot |
| Pharmacy | Auth, Patient, MongoDB | Intake |
| Pathology | Auth, Patient, MongoDB | Image Processor |
| Intake | Auth, Patient, MongoDB | Pharmacy, Pathology |
| Telegram Bot | MongoDB, Gemini AI | Appointment |
| AI Chatbot | Azure OpenAI | MongoDB |
| Image Processor | Google Cloud Vision | - |

---

## Deployment Architecture

### Current Deployment

```
┌─────────────────────────────────────────────┐
│           Single Server Instance            │
├─────────────────────────────────────────────┤
│  Node.js Process (Port 5000)               │
│  ├─ API Gateway (Express)                  │
│  ├─ All Route Handlers                     │
│  └─ Shared Database Connection             │
│                                             │
│  Python Process (Port 8000)                │
│  └─ AI Chatbot Service                     │
│                                             │
│  Python Process (Port 5001)                │
│  └─ Image Processor Service                │
│                                             │
│  Node.js Process (Port 3001)               │
│  └─ Telegram Bot Service                   │
└─────────────────────────────────────────────┘
           │
           ▼
   ┌──────────────────┐
   │  MongoDB Atlas   │
   │  (Cloud Hosted)  │
   └──────────────────┘
```

### Service Scaling Strategy

| Service | Scaling Method | Max Instances | Load Balancer |
|---------|---------------|---------------|---------------|
| **API Gateway** | Horizontal (PM2/Cluster) | 4 (per CPU) | Nginx |
| **AI Chatbot** | Horizontal (Gunicorn) | 3 workers | Nginx |
| **Image Processor** | Horizontal (Gunicorn) | 2 workers | Nginx |
| **Telegram Bot** | Vertical (Single instance) | 1 | N/A |
| **Database** | Vertical (MongoDB Atlas) | Cluster | Atlas LB |

---

## Service Health Checks

### Health Check Endpoints

```javascript
// Node.js Services
GET /api/health
Response: {
  status: 'healthy',
  uptime: 12345,
  timestamp: Date,
  services: {
    database: 'connected',
    auth: 'operational'
  }
}

// Python Services
GET /health
Response: {
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600.5
}
```

### Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| **Response Time** | New Relic | > 2s (p95) |
| **Error Rate** | Sentry | > 1% |
| **CPU Usage** | Azure Monitor | > 80% |
| **Memory Usage** | Azure Monitor | > 85% |
| **Database Connections** | MongoDB Atlas | > 80% pool |
| **API Uptime** | UptimeRobot | < 99.5% |

---

## Security Considerations

### Service-to-Service Authentication

```javascript
// Internal service calls use JWT tokens
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'X-Service-Name': 'appointment-service',
  'X-Request-ID': '<unique-id>'
}
```

### Rate Limiting

| Service | Rate Limit | Window |
|---------|-----------|--------|
| Auth API | 5 req/min | Per IP |
| Public APIs | 100 req/15min | Per user |
| Internal APIs | 1000 req/min | Per service |
| AI Services | 10 req/min | Per user |

### Data Encryption

- **In Transit:** TLS 1.3
- **At Rest:** MongoDB encryption
- **Secrets:** Azure Key Vault
- **Passwords:** bcrypt (10 rounds)
- **JWT:** RS256 algorithm

---

## Migration to True Microservices

### Recommended Approach

1. **Phase 1:** Extract AI services (already separate processes)
2. **Phase 2:** Extract Telegram Bot service
3. **Phase 3:** Extract Image Processor
4. **Phase 4:** Containerize with Docker
5. **Phase 5:** Deploy to Kubernetes
6. **Phase 6:** Implement API Gateway (Kong/Nginx)
7. **Phase 7:** Add message queue (RabbitMQ/Kafka)
8. **Phase 8:** Implement service mesh (Istio)

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-04  
**Maintained By:** Backend Team  
**Next Review:** 2025-03-04

---

*This document describes the current service architecture and contracts. Update when adding new services or modifying existing ones.*

# Database Schema Documentation
## Karur Gastro Hospital Management System

**Version:** 1.0  
**Database:** MongoDB  
**Generated:** 2025-12-04

---

## Table of Contents

1. [User Management](#1-user-management)
   - [Users](#users-table)
   - [AuthSession](#authsession-table)
2. [Patient Management](#2-patient-management)
   - [Patient](#patient-table)
   - [Intake](#intake-table)
3. [Appointment Management](#3-appointment-management)
   - [Appointment](#appointment-table)
4. [Pharmacy Management](#4-pharmacy-management)
   - [Medicine](#medicine-table)
   - [MedicineBatch](#medicinebatch-table)
   - [PharmacyRecord](#pharmacyrecord-table)
5. [Staff & Payroll](#5-staff--payroll)
   - [Staff](#staff-table)
   - [Payroll](#payroll-table)
6. [Laboratory](#6-laboratory)
   - [LabReport](#labreport-table)
7. [Relationships Diagram](#relationships-diagram)

---

## 1. User Management

### Users Table

**Collection Name:** `users`  
**Description:** Stores system users (admins, doctors, pharmacists, pathologists, reception staff)

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Unique user identifier |
| `role` | String | REQUIRED, INDEXED, ENUM | User role: superadmin, admin, doctor, pharmacist, pathologist, reception |
| `firstName` | String | REQUIRED, INDEXED | User's first name |
| `lastName` | String | DEFAULT: '' | User's last name |
| `email` | String | REQUIRED, UNIQUE, INDEXED, Lowercase | User's email address |
| `phone` | String | INDEXED, Validated | Contact phone number |
| `password` | String | REQUIRED, SELECT: false | Bcrypt hashed password |
| `is_active` | Boolean | DEFAULT: true | Account active status |
| `metadata` | Mixed | DEFAULT: {} | Additional user metadata |
| `createdAt` | Date | Auto-generated | Record creation timestamp |
| `updatedAt` | Date | Auto-generated | Record update timestamp |

#### Indexes

```javascript
- { _id: 1 } // Primary key
- { email: 1 } // Unique
- { role: 1 }
- { firstName: 1 }
- { phone: 1 }
```

#### Sample Data

```json
{
  "_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role": "doctor",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@hospital.com",
  "phone": "+91-9876543210",
  "password": "$2a$10$...", // bcrypt hash
  "is_active": true,
  "metadata": {
    "specialization": "Gastroenterology",
    "department": "Medicine",
    "licenseNumber": "MED-12345"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Business Rules

- Password must be hashed using bcrypt before storage (SALT_ROUNDS: 10)
- Email must be unique and validated
- Role determines access permissions
- Virtual field `fullName` combines firstName + lastName

---

### AuthSession Table

**Collection Name:** `authsessions`  
**Description:** Manages authentication sessions and refresh tokens

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Session identifier |
| `userId` | String (UUID) | REQUIRED, INDEXED, FK → Users._id | Reference to user |
| `deviceId` | String | INDEXED, Nullable | Device identifier |
| `refreshTokenHash` | String | REQUIRED | Bcrypt hashed refresh token |
| `ip` | String | Optional | Client IP address |
| `userAgent` | String | Optional | Browser/device user agent |
| `expiresAt` | Date | REQUIRED, INDEXED, TTL | Session expiration timestamp |
| `metadata` | Mixed | DEFAULT: {} | Additional session data |
| `createdAt` | Date | Auto-generated | Session creation time |
| `updatedAt` | Date | Auto-generated | Last update time |

#### Indexes

```javascript
- { userId: 1 }
- { deviceId: 1 }
- { expiresAt: 1 } // TTL index - auto-delete expired sessions
```

#### Sample Data

```json
{
  "_id": "session-uuid-12345",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "deviceId": "web-chrome-device-001",
  "refreshTokenHash": "$2a$10$...",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "expiresAt": "2025-02-04T10:30:00.000Z",
  "metadata": {},
  "createdAt": "2025-01-04T10:30:00.000Z",
  "updatedAt": "2025-01-04T10:30:00.000Z"
}
```

---

## 2. Patient Management

### Patient Table

**Collection Name:** `patients`  
**Description:** Master patient records with medical history

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Unique patient identifier |
| `firstName` | String | REQUIRED, INDEXED | Patient's first name |
| `lastName` | String | DEFAULT: '' | Patient's last name |
| `dateOfBirth` | Date | Optional | Date of birth |
| `age` | Number | Optional | Patient's age |
| `gender` | String | ENUM: Male, Female, Other | Patient's gender |
| `bloodGroup` | String | ENUM: A+, A-, B+, B-, AB+, AB-, O+, O-, Unknown | Blood group |
| `phone` | String | INDEXED, Validated | Contact phone number |
| `email` | String | INDEXED, Validated | Email address |
| `address` | Object | Embedded | Patient's address details |
| `address.houseNo` | String | Optional | House/Building number |
| `address.street` | String | Optional | Street name |
| `address.line1` | String | Optional | Address line 1 |
| `address.city` | String | Optional | City |
| `address.state` | String | Optional | State |
| `address.pincode` | String | Optional | Postal code |
| `address.country` | String | Optional | Country |
| `vitals` | Object | Embedded | Patient vitals |
| `vitals.heightCm` | Number | Optional | Height in centimeters |
| `vitals.weightKg` | Number | Optional | Weight in kilograms |
| `vitals.bmi` | Number | Optional | Body Mass Index |
| `vitals.bp` | String | Optional | Blood pressure (e.g., "120/80") |
| `vitals.temp` | Number | Optional | Temperature in Celsius |
| `vitals.pulse` | Number | Optional | Pulse rate |
| `vitals.spo2` | Number | Optional | Blood oxygen saturation % |
| `doctorId` | String (UUID) | INDEXED, FK → Users._id | Assigned doctor |
| `allergies` | Array[String] | DEFAULT: [] | List of allergies |
| `prescriptions` | Array[Object] | DEFAULT: [] | Prescription history |
| `notes` | String | DEFAULT: '' | Clinical notes |
| `metadata` | Mixed | DEFAULT: {} | Additional patient data |
| `medicalReports` | Array[Object] | DEFAULT: [] | Medical reports/documents |
| `telegramUserId` | String | INDEXED | Telegram user ID (if applicable) |
| `telegramUsername` | String | Optional | Telegram username |
| `deleted_at` | Date | Nullable | Soft delete timestamp |
| `createdAt` | Date | Auto-generated | Record creation time |
| `updatedAt` | Date | Auto-generated | Last update time |

#### Indexes

```javascript
- { firstName: 1 }
- { phone: 1 }
- { email: 1 }
- { doctorId: 1 }
- { telegramUserId: 1 }
- { lastName: 1, dateOfBirth: 1 }
- { phone: 1, dateOfBirth: 1 }
```

#### Sample Data

```json
{
  "_id": "patient-uuid-001",
  "firstName": "Ramesh",
  "lastName": "Kumar",
  "dateOfBirth": "1980-05-15T00:00:00.000Z",
  "age": 44,
  "gender": "Male",
  "bloodGroup": "O+",
  "phone": "+91-9876543210",
  "email": "ramesh.kumar@email.com",
  "address": {
    "houseNo": "123",
    "street": "MG Road",
    "city": "Karur",
    "state": "Tamil Nadu",
    "pincode": "639001",
    "country": "India"
  },
  "vitals": {
    "heightCm": 175,
    "weightKg": 75,
    "bmi": 24.5,
    "bp": "120/80",
    "temp": 37.0,
    "pulse": 72,
    "spo2": 98
  },
  "doctorId": "doctor-uuid-001",
  "allergies": ["Penicillin", "Pollen"],
  "prescriptions": [],
  "notes": "Healthy patient, regular checkups",
  "metadata": {
    "patientCode": "PAT-001",
    "insuranceNumber": "INS123456",
    "emergencyContactName": "Lakshmi Kumar",
    "emergencyContactPhone": "+91-9876543211"
  },
  "medicalReports": [],
  "deleted_at": null,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-06-15T14:30:00.000Z"
}
```

---

### Intake Table

**Collection Name:** `intakes`  
**Description:** Patient intake records (immutable snapshots + status tracking)

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Intake record identifier |
| `patientId` | String (UUID) | INDEXED, FK → Patient._id, Nullable | Reference to patient |
| `patientSnapshot` | Object | REQUIRED | Patient details snapshot |
| `patientSnapshot.firstName` | String | REQUIRED, INDEXED | Patient's first name |
| `patientSnapshot.lastName` | String | DEFAULT: '' | Patient's last name |
| `patientSnapshot.dateOfBirth` | Date | Optional | Date of birth |
| `patientSnapshot.gender` | String | ENUM: Male, Female, Other | Gender |
| `patientSnapshot.phone` | String | INDEXED, Validated | Phone number |
| `patientSnapshot.email` | String | Validated | Email address |
| `doctorId` | String (UUID) | REQUIRED, INDEXED, FK → Users._id | Attending doctor |
| `appointmentId` | String (UUID) | Nullable | Related appointment |
| `triage` | Object | Embedded | Triage information |
| `triage.chiefComplaint` | String | DEFAULT: '' | Main complaint |
| `triage.vitals` | Object | Embedded | Vital signs at triage |
| `triage.priority` | String | ENUM: Normal, Urgent, Emergency | Priority level |
| `triage.triageCategory` | String | ENUM: Green, Yellow, Red | Triage category |
| `consent` | Object | Embedded | Consent details |
| `consent.consentGiven` | Boolean | DEFAULT: false | Consent status |
| `consent.consentAt` | Date | Optional | Consent timestamp |
| `consent.consentBy` | String | ENUM: digital, paper, verbal | Consent method |
| `consent.consentFileId` | String | FK → File._id | Consent document |
| `insurance` | Object | Embedded | Insurance information |
| `insurance.hasInsurance` | Boolean | DEFAULT: false | Insurance status |
| `insurance.payer` | String | DEFAULT: '' | Insurance provider |
| `insurance.policyNumber` | String | DEFAULT: '' | Policy number |
| `insurance.coverageMeta` | Mixed | DEFAULT: {} | Coverage details |
| `attachments` | Array[String] | FK → File._id | Attached documents |
| `notes` | String | DEFAULT: '' | Intake notes |
| `meta` | Mixed | DEFAULT: {} | Additional metadata |
| `status` | String | INDEXED, ENUM: New, Reviewed, Converted, Rejected | Intake status |
| `createdBy` | String (UUID) | REQUIRED, INDEXED, FK → Users._id | Created by user |
| `convertedAt` | Date | Nullable | Conversion timestamp |
| `convertedBy` | String (UUID) | FK → Users._id | Converted by user |
| `createdAt` | Date | Auto-generated | Creation timestamp |
| `updatedAt` | Date | Auto-generated | Update timestamp |

#### Indexes

```javascript
- { patientId: 1 }
- { doctorId: 1 }
- { status: 1 }
- { createdBy: 1 }
- { 'patientSnapshot.phone': 1 }
- { sourceRef: 1 } // sparse
```

#### Sample Data

```json
{
  "_id": "intake-uuid-001",
  "patientId": "patient-uuid-001",
  "patientSnapshot": {
    "firstName": "Ramesh",
    "lastName": "Kumar",
    "dateOfBirth": "1980-05-15T00:00:00.000Z",
    "gender": "Male",
    "phone": "+91-9876543210",
    "email": "ramesh.kumar@email.com"
  },
  "doctorId": "doctor-uuid-001",
  "appointmentId": "appointment-uuid-001",
  "triage": {
    "chiefComplaint": "Abdominal pain",
    "vitals": {
      "bp": "120/80",
      "temp": 37.2,
      "pulse": 75,
      "spo2": 98,
      "weightKg": 75,
      "heightCm": 175,
      "bmi": 24.5
    },
    "priority": "Normal",
    "triageCategory": "Green"
  },
  "consent": {
    "consentGiven": true,
    "consentAt": "2024-12-04T10:00:00.000Z",
    "consentBy": "digital",
    "consentFileId": null
  },
  "insurance": {
    "hasInsurance": true,
    "payer": "Star Health Insurance",
    "policyNumber": "SH12345678",
    "coverageMeta": {
      "coverageAmount": 500000,
      "expiryDate": "2025-12-31"
    }
  },
  "attachments": [],
  "notes": "Patient presents with mild abdominal discomfort",
  "meta": {
    "pharmacyItems": [],
    "pharmacyId": null
  },
  "status": "Reviewed",
  "createdBy": "reception-user-001",
  "convertedAt": null,
  "convertedBy": null,
  "createdAt": "2024-12-04T10:00:00.000Z",
  "updatedAt": "2024-12-04T10:30:00.000Z"
}
```

---

## 3. Appointment Management

### Appointment Table

**Collection Name:** `appointments`  
**Description:** Patient appointments with follow-up tracking

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Appointment identifier |
| `appointmentCode` | String | UNIQUE, INDEXED | Human-readable code (APT-XXX) |
| `patientId` | String (UUID) | REQUIRED, INDEXED, FK → Patient._id | Patient reference |
| `doctorId` | String (UUID) | REQUIRED, INDEXED, FK → Users._id | Doctor reference |
| `appointmentType` | String | DEFAULT: 'Consultation' | Type of appointment |
| `startAt` | Date | REQUIRED, INDEXED | Appointment start time |
| `endAt` | Date | Optional | Appointment end time |
| `location` | String | DEFAULT: '' | Appointment location |
| `status` | String | INDEXED, ENUM | Scheduled, Completed, Cancelled, No-Show, Rescheduled |
| `vitals` | Mixed | DEFAULT: {} | Recorded vitals |
| `notes` | String | DEFAULT: '' | Appointment notes |
| `metadata` | Mixed | DEFAULT: {} | Additional data |
| `followUp` | Object | Embedded | Follow-up management |
| `followUp.isFollowUp` | Boolean | INDEXED, DEFAULT: false | Is this a follow-up? |
| `followUp.isRequired` | Boolean | DEFAULT: false | Follow-up required? |
| `followUp.reason` | String | DEFAULT: '' | Follow-up reason |
| `followUp.instructions` | String | DEFAULT: '' | Patient instructions |
| `followUp.priority` | String | ENUM: Routine, Important, Urgent, Critical | Follow-up priority |
| `followUp.recommendedDate` | Date | Nullable | Suggested date |
| `followUp.scheduledDate` | Date | Nullable | Actual scheduled date |
| `followUp.diagnosis` | String | DEFAULT: '' | Diagnosis |
| `followUp.treatmentPlan` | String | DEFAULT: '' | Treatment plan |
| `followUp.labTests` | Array[Object] | DEFAULT: [] | Lab tests tracking |
| `followUp.imaging` | Array[Object] | DEFAULT: [] | Imaging tracking |
| `followUp.procedures` | Array[Object] | DEFAULT: [] | Procedures tracking |
| `followUp.previousAppointmentId` | String (UUID) | FK → Appointment._id | Previous appointment |
| `followUp.nextAppointmentId` | String (UUID) | FK → Appointment._id | Next appointment |
| `followUp.outcome` | String | ENUM | Improved, Stable, Worsened, Resolved, Pending |
| `telegramUserId` | String | INDEXED | Telegram integration |
| `telegramChatId` | String | INDEXED | Telegram chat ID |
| `bookingSource` | String | ENUM: web, telegram, admin | Booking source |
| `createdAt` | Date | Auto-generated | Creation time |
| `updatedAt` | Date | Auto-generated | Update time |

#### Indexes

```javascript
- { appointmentCode: 1 } // Unique
- { patientId: 1 }
- { doctorId: 1 }
- { startAt: 1 }
- { status: 1 }
- { doctorId: 1, startAt: 1 }
- { 'followUp.isFollowUp': 1 }
- { telegramUserId: 1 }
```

#### Sample Data

```json
{
  "_id": "appointment-uuid-001",
  "appointmentCode": "APT-2024-ABC123",
  "patientId": "patient-uuid-001",
  "doctorId": "doctor-uuid-001",
  "appointmentType": "Consultation",
  "startAt": "2024-12-05T10:00:00.000Z",
  "endAt": "2024-12-05T10:30:00.000Z",
  "location": "Consultation Room 1",
  "status": "Scheduled",
  "vitals": {
    "bp": "120/80",
    "pulse": 72,
    "temp": 37.0
  },
  "notes": "Regular checkup",
  "metadata": {
    "mode": "in-person",
    "priority": "normal"
  },
  "followUp": {
    "isFollowUp": false,
    "isRequired": true,
    "reason": "Check treatment progress",
    "instructions": "Take medications as prescribed",
    "priority": "Routine",
    "recommendedDate": "2025-01-05T10:00:00.000Z",
    "scheduledDate": null,
    "diagnosis": "Gastritis",
    "treatmentPlan": "H2 blockers for 4 weeks",
    "labTests": [],
    "imaging": [],
    "procedures": [],
    "previousAppointmentId": null,
    "nextAppointmentId": null,
    "outcome": "Pending"
  },
  "bookingSource": "web",
  "createdAt": "2024-12-01T10:00:00.000Z",
  "updatedAt": "2024-12-01T10:00:00.000Z"
}
```

---

## 4. Pharmacy Management

### Medicine Table

**Collection Name:** `medicines`  
**Description:** Medicine catalog/master data

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Medicine identifier |
| `name` | String | REQUIRED, INDEXED | Medicine name |
| `genericName` | String | DEFAULT: '' | Generic/chemical name |
| `sku` | String | UNIQUE (sparse), INDEXED | Stock Keeping Unit |
| `form` | String | DEFAULT: 'Tablet' | Medicine form (Tablet, Syrup, etc.) |
| `strength` | String | DEFAULT: '' | Dosage strength (e.g., "500mg") |
| `unit` | String | DEFAULT: 'pcs' | Unit of measurement |
| `manufacturer` | String | DEFAULT: '' | Manufacturer name |
| `brand` | String | DEFAULT: '' | Brand name |
| `category` | String | DEFAULT: '' | Medicine category |
| `description` | String | DEFAULT: '' | Description |
| `status` | String | ENUM: In Stock, Out of Stock, Discontinued | Stock status |
| `metadata` | Mixed | DEFAULT: {} | Additional metadata |
| `deleted_at` | Date | Nullable | Soft delete timestamp |
| `createdAt` | Date | Auto-generated | Creation time |
| `updatedAt` | Date | Auto-generated | Update time |

#### Indexes

```javascript
- { name: 1 }
- { sku: 1 } // Unique, sparse
- { name: 'text', genericName: 'text', brand: 'text', sku: 'text' } // Full-text search
```

#### Sample Data

```json
{
  "_id": "medicine-uuid-001",
  "name": "Paracetamol",
  "genericName": "Acetaminophen",
  "sku": "MED-PARA-500",
  "form": "Tablet",
  "strength": "500mg",
  "unit": "pcs",
  "manufacturer": "Cipla Ltd",
  "brand": "Calpol",
  "category": "Analgesics",
  "description": "Pain reliever and fever reducer",
  "status": "In Stock",
  "metadata": {
    "reorderLevel": 100,
    "taxPercent": 12
  },
  "deleted_at": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-12-01T10:00:00.000Z"
}
```

---

### MedicineBatch Table

**Collection Name:** `medicinebatches`  
**Description:** Medicine batch tracking for inventory management

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Batch identifier |
| `medicineId` | String (UUID) | REQUIRED, INDEXED, FK → Medicine._id | Medicine reference |
| `batchNumber` | String | DEFAULT: '' | Batch/lot number |
| `expiryDate` | Date | Optional | Expiry date |
| `quantity` | Number | DEFAULT: 0 | Available quantity |
| `purchasePrice` | Number | DEFAULT: 0 | Purchase price per unit |
| `salePrice` | Number | DEFAULT: 0 | Sale price per unit |
| `supplier` | String | DEFAULT: '' | Supplier name |
| `location` | String | DEFAULT: '' | Storage location |
| `metadata` | Mixed | DEFAULT: {} | Additional data |
| `createdAt` | Date | Auto-generated | Batch creation time |
| `updatedAt` | Date | Auto-generated | Last update time |

#### Indexes

```javascript
- { medicineId: 1 }
- { medicineId: 1, expiryDate: 1 }
```

#### Sample Data

```json
{
  "_id": "batch-uuid-001",
  "medicineId": "medicine-uuid-001",
  "batchNumber": "BATCH-2024-001",
  "expiryDate": "2025-12-31T00:00:00.000Z",
  "quantity": 500,
  "purchasePrice": 5.0,
  "salePrice": 8.0,
  "supplier": "Medical Supplies Co.",
  "location": "Shelf A-12",
  "metadata": {
    "receivedDate": "2024-01-15T00:00:00.000Z",
    "qualityChecked": true
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-12-04T12:00:00.000Z"
}
```

---

### PharmacyRecord Table

**Collection Name:** `pharmacyrecords`  
**Description:** Pharmacy transactions (dispense, purchase, returns, adjustments)

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Record identifier |
| `type` | String | REQUIRED, INDEXED, ENUM | PurchaseReceive, Dispense, Return, Adjustment |
| `patientId` | String (UUID) | INDEXED, FK → Patient._id, Nullable | Patient reference (for dispense) |
| `appointmentId` | String (UUID) | Nullable | Related appointment |
| `createdBy` | String (UUID) | FK → Users._id | User who created record |
| `items` | Array[Object] | DEFAULT: [] | Transaction items |
| `items.medicineId` | String (UUID) | FK → Medicine._id | Medicine reference |
| `items.batchId` | String (UUID) | FK → MedicineBatch._id | Batch reference |
| `items.sku` | String | Nullable | SKU code |
| `items.name` | String | Nullable | Medicine name |
| `items.dosage` | String | Nullable | Dosage instruction |
| `items.frequency` | String | Nullable | Frequency instruction |
| `items.duration` | String | Nullable | Duration |
| `items.notes` | String | Nullable | Item notes |
| `items.quantity` | Number | DEFAULT: 0 | Quantity |
| `items.unitPrice` | Number | DEFAULT: 0 | Unit price |
| `items.taxPercent` | Number | DEFAULT: 0 | Tax percentage |
| `items.lineTotal` | Number | DEFAULT: 0 | Line total |
| `items.metadata` | Mixed | DEFAULT: {} | Item metadata |
| `total` | Number | DEFAULT: 0 | Total amount |
| `paid` | Boolean | DEFAULT: false | Payment status |
| `paymentMethod` | String | Nullable | Payment method |
| `notes` | String | Nullable | Record notes |
| `metadata` | Mixed | DEFAULT: {} | Additional metadata |
| `createdAt` | Date | Auto-generated | Creation time |
| `updatedAt` | Date | Auto-generated | Update time |

#### Indexes

```javascript
- { type: 1 }
- { patientId: 1 }
- { createdAt: -1 }
- { patientId: 1, createdAt: -1 }
```

#### Sample Data

```json
{
  "_id": "pharma-record-uuid-001",
  "type": "Dispense",
  "patientId": "patient-uuid-001",
  "appointmentId": "appointment-uuid-001",
  "createdBy": "pharmacist-user-001",
  "items": [
    {
      "medicineId": "medicine-uuid-001",
      "batchId": "batch-uuid-001",
      "sku": "MED-PARA-500",
      "name": "Paracetamol 500mg",
      "dosage": "1 tablet",
      "frequency": "Three times daily",
      "duration": "5 days",
      "notes": "Take after meals",
      "quantity": 15,
      "unitPrice": 8.0,
      "taxPercent": 12,
      "lineTotal": 120.0,
      "metadata": {}
    }
  ],
  "total": 120.0,
  "paid": true,
  "paymentMethod": "Cash",
  "notes": "Dispensed prescription for appointment APT-2024-ABC123",
  "metadata": {
    "intakeId": "intake-uuid-001"
  },
  "createdAt": "2024-12-04T14:30:00.000Z",
  "updatedAt": "2024-12-04T14:30:00.000Z"
}
```

---

## 5. Staff & Payroll

### Staff Table

**Collection Name:** `staff`  
**Description:** Staff member records (separate from system users)

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Staff identifier |
| `name` | String | REQUIRED, INDEXED | Staff full name |
| `designation` | String | DEFAULT: '' | Job designation |
| `department` | String | DEFAULT: '' | Department |
| `patientFacingId` | String | DEFAULT: '' | External ID (e.g., DOC102) |
| `contact` | String | Validated | Phone number |
| `email` | String | Validated, Lowercase | Email address |
| `avatarUrl` | String | DEFAULT: '' | Profile picture URL |
| `gender` | String | ENUM: Male, Female, Other, '' | Gender |
| `status` | String | ENUM: Available, Off Duty, On Leave, On Call | Work status |
| `shift` | String | DEFAULT: '' | Work shift |
| `roles` | Array[String] | DEFAULT: [] | Job roles |
| `qualifications` | Array[String] | DEFAULT: [] | Qualifications |
| `experienceYears` | Number | DEFAULT: 0 | Years of experience |
| `joinedAt` | Date | Nullable | Joining date |
| `lastActiveAt` | Date | Nullable | Last active timestamp |
| `location` | String | DEFAULT: '' | Location |
| `dob` | Date | Nullable | Date of birth |
| `notes` | Mixed | DEFAULT: {} | Additional notes |
| `appointmentsCount` | Number | DEFAULT: 0 | Appointment count |
| `tags` | Array[String] | DEFAULT: [] | Tags |
| `metadata` | Mixed | DEFAULT: {} | Additional metadata |
| `createdAt` | Date | Auto-generated | Creation time |
| `updatedAt` | Date | Auto-generated | Update time |

#### Indexes

```javascript
- { name: 1 }
- { patientFacingId: 1 }
- { name: 'text', designation: 'text', department: 'text' }
```

#### Sample Data

```json
{
  "_id": "staff-uuid-001",
  "name": "Dr. Priya Sharma",
  "designation": "Senior Consultant",
  "department": "Gastroenterology",
  "patientFacingId": "DOC-101",
  "contact": "+91-9876543210",
  "email": "priya.sharma@hospital.com",
  "avatarUrl": "https://cdn.hospital.com/avatars/priya.jpg",
  "gender": "Female",
  "status": "Available",
  "shift": "Morning",
  "roles": ["Consultant", "Head of Department"],
  "qualifications": ["MBBS", "MD (Gastroenterology)", "MRCP"],
  "experienceYears": 15,
  "joinedAt": "2010-06-15T00:00:00.000Z",
  "lastActiveAt": "2024-12-04T16:00:00.000Z",
  "location": "Karur",
  "dob": "1978-03-20T00:00:00.000Z",
  "notes": {},
  "appointmentsCount": 1250,
  "tags": ["Specialist", "Senior"],
  "metadata": {
    "staffCode": "STF-001",
    "licenseNumber": "MED-TN-12345"
  },
  "createdAt": "2010-06-15T00:00:00.000Z",
  "updatedAt": "2024-12-04T10:00:00.000Z"
}
```

---

### Payroll Table

**Collection Name:** `payrolls`  
**Description:** Enterprise payroll management with comprehensive salary calculation

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Payroll identifier |
| `staffId` | String (UUID) | REQUIRED, INDEXED, FK → Staff._id | Staff reference |
| `staffName` | String | REQUIRED, INDEXED | Staff name |
| `staffCode` | String | INDEXED | Staff code |
| `department` | String | INDEXED | Department |
| `designation` | String | DEFAULT: '' | Designation |
| `email` | String | DEFAULT: '' | Email |
| `contact` | String | DEFAULT: '' | Contact |
| `payPeriodMonth` | Number | REQUIRED, INDEXED, MIN: 1, MAX: 12 | Pay month |
| `payPeriodYear` | Number | REQUIRED, INDEXED, MIN: 2000, MAX: 2100 | Pay year |
| `payPeriodStart` | Date | REQUIRED | Period start date |
| `payPeriodEnd` | Date | REQUIRED | Period end date |
| `paymentDate` | Date | Nullable | Actual payment date |
| `status` | String | INDEXED, ENUM | draft, pending, approved, processed, paid, rejected, on_hold |
| `basicSalary` | Number | REQUIRED, DEFAULT: 0 | Basic salary |
| `earnings` | Array[Object] | DEFAULT: [] | Earning components |
| `deductions` | Array[Object] | DEFAULT: [] | Deduction components |
| `reimbursements` | Array[Object] | DEFAULT: [] | Reimbursements |
| `totalEarnings` | Number | DEFAULT: 0 | Calculated total earnings |
| `totalDeductions` | Number | DEFAULT: 0 | Calculated total deductions |
| `totalReimbursements` | Number | DEFAULT: 0 | Calculated reimbursements |
| `grossSalary` | Number | DEFAULT: 0 | Gross salary |
| `netSalary` | Number | DEFAULT: 0 | Net salary (take-home) |
| `ctc` | Number | DEFAULT: 0 | Cost to Company (annual) |
| `attendance` | Object | DEFAULT: {} | Attendance summary |
| `statutory` | Object | DEFAULT: {} | Statutory compliance (PF, ESI, PT) |
| `loansAdvances` | Array[Object] | DEFAULT: [] | Loans and advances |
| `totalLoanDeduction` | Number | DEFAULT: 0 | Total loan deduction |
| `overtimePay` | Number | DEFAULT: 0 | Overtime payment |
| `bonus` | Number | DEFAULT: 0 | Bonus amount |
| `incentives` | Number | DEFAULT: 0 | Incentives |
| `arrears` | Number | DEFAULT: 0 | Arrears |
| `lossOfPayDays` | Number | DEFAULT: 0 | Loss of pay days |
| `lossOfPayAmount` | Number | DEFAULT: 0 | Loss of pay amount |
| `paymentMode` | String | ENUM: bank_transfer, cash, cheque, online | Payment mode |
| `bankName` | String | DEFAULT: '' | Bank name |
| `accountNumber` | String | DEFAULT: '' | Account number |
| `ifscCode` | String | DEFAULT: '' | IFSC code |
| `transactionId` | String | DEFAULT: '' | Transaction ID |
| `submittedBy` | String | DEFAULT: '' | Submitted by |
| `submittedAt` | Date | Nullable | Submission date |
| `approvedBy` | String | DEFAULT: '' | Approved by |
| `approvedAt` | Date | Nullable | Approval date |
| `rejectedBy` | String | DEFAULT: '' | Rejected by |
| `rejectedAt` | Date | Nullable | Rejection date |
| `rejectionReason` | String | DEFAULT: '' | Rejection reason |
| `notes` | String | DEFAULT: '' | Notes |
| `internalNotes` | String | DEFAULT: '' | Internal notes |
| `adminRemarks` | String | DEFAULT: '' | Admin remarks |
| `revisionNumber` | Number | DEFAULT: 1 | Revision number |
| `previousRevisionId` | String | DEFAULT: '' | Previous revision |
| `isRevision` | Boolean | DEFAULT: false | Is revision? |
| `tags` | Array[String] | DEFAULT: [] | Tags |
| `payrollGroup` | String | DEFAULT: 'regular' | Payroll group |
| `attachments` | Array[Object] | DEFAULT: [] | Attachments |
| `metadata` | Mixed | DEFAULT: {} | Additional metadata |
| `historyLog` | Array[Object] | DEFAULT: [] | Audit trail |
| `createdAt` | Date | Auto-generated | Creation time |
| `updatedAt` | Date | Auto-generated | Update time |

#### Indexes

```javascript
- { staffId: 1, payPeriodYear: -1, payPeriodMonth: -1 }
- { payPeriodYear: -1, payPeriodMonth: -1, status: 1 }
- { status: 1, paymentDate: -1 }
- { department: 1, payPeriodYear: -1, payPeriodMonth: -1 }
- { staffCode: 1 }
- { 'metadata.payrollCode': 1 }
```

#### Sample Data

```json
{
  "_id": "payroll-uuid-001",
  "staffId": "staff-uuid-001",
  "staffName": "Dr. Priya Sharma",
  "staffCode": "STF-001",
  "department": "Gastroenterology",
  "designation": "Senior Consultant",
  "email": "priya.sharma@hospital.com",
  "contact": "+91-9876543210",
  "payPeriodMonth": 12,
  "payPeriodYear": 2024,
  "payPeriodStart": "2024-12-01T00:00:00.000Z",
  "payPeriodEnd": "2024-12-31T23:59:59.999Z",
  "paymentDate": "2025-01-05T00:00:00.000Z",
  "status": "approved",
  "basicSalary": 80000,
  "earnings": [
    {
      "name": "HRA",
      "type": "earning",
      "amount": 32000,
      "isPercentage": true,
      "percentageOf": "basic",
      "isTaxable": true,
      "isStatutory": false,
      "description": "House Rent Allowance (40% of basic)"
    }
  ],
  "deductions": [
    {
      "name": "Professional Tax",
      "type": "deduction",
      "amount": 200,
      "isPercentage": false,
      "isTaxable": false,
      "isStatutory": true,
      "description": "Professional Tax"
    }
  ],
  "reimbursements": [],
  "totalEarnings": 112000,
  "totalDeductions": 10400,
  "totalReimbursements": 0,
  "grossSalary": 112000,
  "netSalary": 101600,
  "ctc": 1344000,
  "attendance": {
    "totalDays": 31,
    "presentDays": 30,
    "absentDays": 0,
    "halfDays": 1,
    "lateDays": 0,
    "overtimeHours": 0,
    "leaves": {
      "casual": 1,
      "sick": 0,
      "earned": 0,
      "unpaid": 0,
      "other": 0
    },
    "holidays": 4,
    "weekends": 8
  },
  "statutory": {
    "pfNumber": "KA/BLR/12345",
    "pfApplicable": true,
    "esiApplicable": false,
    "ptApplicable": true,
    "employeePF": 9600,
    "employerPF": 9600,
    "employeeESI": 0,
    "employerESI": 0,
    "professionalTax": 200,
    "tdsDeducted": 600
  },
  "loansAdvances": [],
  "totalLoanDeduction": 0,
  "overtimePay": 0,
  "bonus": 0,
  "incentives": 0,
  "arrears": 0,
  "lossOfPayDays": 0,
  "lossOfPayAmount": 0,
  "paymentMode": "bank_transfer",
  "bankName": "HDFC Bank",
  "accountNumber": "12345678901234",
  "ifscCode": "HDFC0001234",
  "transactionId": "TXN123456789",
  "submittedBy": "hr-admin-001",
  "submittedAt": "2024-12-30T10:00:00.000Z",
  "approvedBy": "admin-user-001",
  "approvedAt": "2024-12-31T14:00:00.000Z",
  "notes": "Regular monthly salary",
  "metadata": {
    "payrollCode": "PAY202412-0001"
  },
  "historyLog": [
    {
      "action": "Created",
      "performedBy": "hr-admin-001",
      "performedAt": "2024-12-30T10:00:00.000Z",
      "changes": {},
      "remarks": "Payroll generated for December 2024"
    },
    {
      "action": "Approved",
      "performedBy": "admin-user-001",
      "performedAt": "2024-12-31T14:00:00.000Z",
      "changes": { "status": "approved" },
      "remarks": "Approved for payment"
    }
  ],
  "createdAt": "2024-12-30T10:00:00.000Z",
  "updatedAt": "2024-12-31T14:00:00.000Z"
}
```

---

## 6. Laboratory

### LabReport Table

**Collection Name:** `labreports`  
**Description:** Laboratory test reports with OCR integration

#### Schema Definition

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `_id` | String (UUID) | PRIMARY KEY, Auto-generated | Report identifier |
| `patientId` | String (UUID) | REQUIRED, INDEXED, FK → Patient._id | Patient reference |
| `appointmentId` | String (UUID) | Nullable | Related appointment |
| `documentId` | String (UUID) | INDEXED, FK → MedicalDocument._id | Document reference |
| `testType` | String | DEFAULT: 'Auto-OCR' | Type of test |
| `testCategory` | String | DEFAULT: 'General' | Test category |
| `results` | Mixed | DEFAULT: {} | Test results |
| `fileRef` | String (UUID) | FK → PatientPDF._id | PDF file reference |
| `uploadedBy` | String (UUID) | FK → Users._id | Uploaded by user |
| `rawText` | String | DEFAULT: '' | OCR raw text |
| `enhancedText` | String | DEFAULT: '' | OCR enhanced text |
| `metadata` | Mixed | DEFAULT: {} | OCR metadata |
| `createdAt` | Date | Auto-generated | Creation time |
| `updatedAt` | Date | Auto-generated | Update time |

#### Indexes

```javascript
- { patientId: 1 }
- { patientId: 1, testType: 1 }
- { patientId: 1, testCategory: 1 }
- { documentId: 1 }
- { createdAt: -1 }
```

#### Sample Data

```json
{
  "_id": "labreport-uuid-001",
  "patientId": "patient-uuid-001",
  "appointmentId": "appointment-uuid-001",
  "documentId": "document-uuid-001",
  "testType": "Blood Test",
  "testCategory": "Hematology",
  "results": {
    "hemoglobin": "14.5 g/dL",
    "wbc": "7500 cells/μL",
    "platelets": "250000 cells/μL",
    "rbc": "5.2 million cells/μL"
  },
  "fileRef": "pdf-uuid-001",
  "uploadedBy": "pathologist-user-001",
  "rawText": "Patient Name: Ramesh Kumar\nHemoglobin: 14.5 g/dL\nWBC: 7500...",
  "enhancedText": "Complete Blood Count Report...",
  "metadata": {
    "ocrEngine": "Tesseract",
    "confidence": 0.95,
    "processingTime": 2.3
  },
  "createdAt": "2024-12-04T15:00:00.000Z",
  "updatedAt": "2024-12-04T15:00:00.000Z"
}
```

---

## Relationships Diagram

```
┌─────────────────┐
│     Users       │───┐
│  (Auth/Staff)   │   │
└─────────────────┘   │
         │            │
         │ doctorId   │ createdBy
         │            │
         ▼            ▼
┌─────────────────┬─────────────────┐
│    Patient      │     Intake      │
│  (Master Data)  │  (Snapshots)    │
└─────────────────┴─────────────────┘
         │                │
         │ patientId      │ patientId
         │                │
         ▼                ▼
┌─────────────────────────────────────┐
│          Appointment                │
│    (Booking & Follow-ups)           │
└─────────────────────────────────────┘
         │
         │ appointmentId
         │
         ▼
┌─────────────────┬─────────────────┐
│  PharmacyRecord │   LabReport     │
│  (Dispense)     │  (Test Results) │
└─────────────────┴─────────────────┘
         │
         │ medicineId
         │
         ▼
┌─────────────────┐
│    Medicine     │
│ (Catalog/Master)│
└─────────────────┘
         │
         │ medicineId
         │
         ▼
┌─────────────────┐
│ MedicineBatch   │
│ (Inventory)     │
└─────────────────┘

┌─────────────────┐
│     Staff       │
│ (HR Records)    │
└─────────────────┘
         │
         │ staffId
         │
         ▼
┌─────────────────┐
│    Payroll      │
│  (Salary Mgmt)  │
└─────────────────┘

┌─────────────────┐
│   AuthSession   │
│ (JWT Tokens)    │
└─────────────────┘
         │
         │ userId
         │
         ▼
┌─────────────────┐
│     Users       │
└─────────────────┘
```

### Relationships Summary

| Parent Table | Child Table | Relationship | Foreign Key | Type |
|--------------|-------------|--------------|-------------|------|
| Users | Patient | One-to-Many | `doctorId` | Optional |
| Users | Intake | One-to-Many | `doctorId`, `createdBy` | Required |
| Users | Appointment | One-to-Many | `doctorId` | Required |
| Users | AuthSession | One-to-Many | `userId` | Required |
| Users | PharmacyRecord | One-to-Many | `createdBy` | Optional |
| Users | LabReport | One-to-Many | `uploadedBy` | Optional |
| Patient | Appointment | One-to-Many | `patientId` | Required |
| Patient | Intake | One-to-Many | `patientId` | Optional |
| Patient | PharmacyRecord | One-to-Many | `patientId` | Optional |
| Patient | LabReport | One-to-Many | `patientId` | Required |
| Appointment | PharmacyRecord | One-to-One | `appointmentId` | Optional |
| Appointment | LabReport | One-to-Many | `appointmentId` | Optional |
| Appointment | Appointment | Self-Referencing | `followUp.previousAppointmentId`, `followUp.nextAppointmentId` | Optional |
| Medicine | MedicineBatch | One-to-Many | `medicineId` | Required |
| Medicine | PharmacyRecord.items | One-to-Many | `items.medicineId` | Optional |
| MedicineBatch | PharmacyRecord.items | One-to-Many | `items.batchId` | Optional |
| Staff | Payroll | One-to-Many | `staffId` | Required |

---

## Data Types Reference

| MongoDB Type | JavaScript Type | Description | Example |
|--------------|-----------------|-------------|---------|
| String | string | Text data | "John Doe" |
| Number | number | Numeric values | 42, 3.14 |
| Boolean | boolean | True/False | true, false |
| Date | Date | Timestamp | 2024-12-04T10:00:00.000Z |
| Array | array | List of values | ["A", "B", "C"] |
| Object | object | Embedded document | { key: "value" } |
| Mixed | any | Dynamic type | Can be any type |
| UUID (String) | string | Universally Unique ID | "a1b2c3d4-e5f6-7890..." |

---

## Common Patterns

### Soft Delete Pattern
```javascript
deleted_at: { type: Date, default: null }
// Query for active records: { deleted_at: null }
// Soft delete: { $set: { deleted_at: new Date() } }
```

### Audit Trail Pattern
```javascript
createdAt: Date // Auto-generated on insert
updatedAt: Date // Auto-updated on save
```

### UUID Primary Keys
```javascript
_id: { type: String, default: () => uuidv4() }
// All collections use UUID strings as primary keys
```

### Metadata Pattern
```javascript
metadata: { type: Schema.Types.Mixed, default: {} }
// Flexible field for additional unstructured data
```

---

## Constraints & Validations

### Email Validation
```javascript
email: {
  type: String,
  validate: {
    validator: (v) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
    message: 'Invalid email format'
  }
}
```

### Phone Validation
```javascript
phone: {
  type: String,
  validate: {
    validator: (v) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/.test(v),
    message: 'Invalid phone format'
  }
}
```

### Enum Constraints
```javascript
status: {
  type: String,
  enum: ['Active', 'Inactive', 'Pending'],
  default: 'Active'
}
```

---

## Performance Considerations

### Index Strategy
- Create compound indexes for frequently queried field combinations
- Use sparse indexes for optional unique fields (e.g., `sku`)
- Text indexes for full-text search capabilities
- TTL indexes for automatic document expiration (e.g., `AuthSession`)

### Query Optimization
- Use `.lean()` for read-only queries to improve performance
- Populate references selectively - only load needed fields
- Use pagination for large result sets
- Implement proper limit/skip patterns

### Data Denormalization
- `patientSnapshot` in Intake for immutable history
- `staffName`, `staffCode` in Payroll for quick access
- Embedded objects for tightly coupled data (address, vitals, etc.)

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-04  
**Maintained By:** Development Team  
**Contact:** dev@hospital.com

---

## Appendix: Collection Sizes & Estimates

| Collection | Estimated Docs | Growth Rate | Retention Period |
|------------|----------------|-------------|------------------|
| Users | ~100 | Low | Permanent |
| AuthSession | ~500 | High | 30 days (TTL) |
| Patient | ~10,000 | Medium | Permanent |
| Appointment | ~50,000 | High | Permanent |
| Intake | ~50,000 | High | 1 year |
| Medicine | ~1,000 | Low | Permanent |
| MedicineBatch | ~5,000 | Medium | Until expired |
| PharmacyRecord | ~100,000 | High | Permanent |
| Staff | ~200 | Low | Permanent |
| Payroll | ~2,400 | Medium | 7 years |
| LabReport | ~20,000 | Medium | Permanent |

---

*This document serves as the technical reference for the database architecture of the Karur Gastro Hospital Management System.*

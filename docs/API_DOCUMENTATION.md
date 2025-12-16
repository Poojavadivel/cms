# Hospital Management System - API Documentation

## Overview
This document provides a comprehensive list of all API endpoints available in the Karur Gastro Foundation Hospital Management System.

**Base URL:** `http://localhost:5000/api` (default)

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Patient APIs](#patient-apis)
3. [Doctor APIs](#doctor-apis)
4. [Appointment APIs](#appointment-apis)
5. [Intake Form APIs](#intake-form-apis)
6. [Pharmacy APIs](#pharmacy-apis)
7. [Pathology/Lab Report APIs](#pathologylab-report-apis)
8. [Staff Management APIs](#staff-management-apis)
9. [Payroll APIs](#payroll-apis)
10. [Report Generation APIs](#report-generation-apis)
11. [Bot/AI Assistant APIs](#botai-assistant-apis)

---

## Authentication APIs

### Base Route: `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/validate-token` | Validate current token | Yes |
| POST | `/auth/signout` | Sign out user | Yes |

#### POST `/auth/login`
**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "password123",
  "deviceId": "device-uuid" // optional
}
```

**Response:**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "sessionId": "session-uuid",
  "user": {
    "id": "user-id",
    "email": "doctor@example.com",
    "role": "doctor",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST `/auth/refresh`
**Request Body:**
```json
{
  "refreshToken": "refresh-token",
  "sessionId": "session-uuid",
  "userId": "user-id"
}
```

#### POST `/auth/validate-token`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "user-id",
  "email": "doctor@example.com",
  "role": "doctor",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST `/auth/signout`
**Request Body:**
```json
{
  "sessionId": "session-uuid", // optional
  "refreshToken": "refresh-token", // optional
  "userId": "user-id" // optional
}
```

---

## Patient APIs

### Base Route: `/api/patients`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/patients` | Create new patient | Yes |
| GET | `/patients` | List all patients (with search & pagination) | Yes |
| GET | `/patients/:id` | Get patient by ID | Yes |
| PUT | `/patients/:id` | Update patient | Yes |
| PATCH | `/patients/:id` | Partial update patient | Yes |
| DELETE | `/patients/:id` | Soft delete patient | Yes |

#### POST `/patients`
**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "phone": "1234567890",
  "email": "john@example.com",
  "address": {
    "houseNo": "123",
    "street": "Main St",
    "city": "Karur",
    "state": "Tamil Nadu",
    "pincode": "639001",
    "country": "India"
  },
  "vitals": {
    "heightCm": 170,
    "weightKg": 70,
    "bmi": 24.2,
    "bp": "120/80",
    "temp": 98.6,
    "pulse": 72,
    "spo2": 98
  },
  "doctorId": "doctor-uuid",
  "allergies": ["Penicillin"],
  "notes": "Patient notes",
  "metadata": {
    "bloodGroup": "O+",
    "insuranceNumber": "INS123456",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "9876543210"
  }
}
```

#### GET `/patients`
**Query Parameters:**
- `q` - Search query (name, phone, email, etc.)
- `page` - Page number (default: 0)
- `limit` - Items per page (default: 20, max: 100)
- `meta` - Return metadata (1 or 0)

**Response:**
```json
[
  {
    "_id": "patient-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "doctorId": {
      "_id": "doctor-uuid",
      "firstName": "Dr. Smith",
      "lastName": "Johnson"
    },
    "doctorName": "Dr. Smith Johnson",
    "vitals": { ... },
    "metadata": { ... }
  }
]
```

#### GET `/patients/:id`
**Response:**
```json
{
  "_id": "patient-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "age": 34,
  "gender": "Male",
  "phone": "1234567890",
  "email": "john@example.com",
  "address": { ... },
  "vitals": { ... },
  "doctorId": { ... },
  "allergies": ["Penicillin"],
  "prescriptions": [ ... ],
  "metadata": { ... }
}
```

---

## Doctor APIs

### Base Route: `/api/doctors`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/doctors` | List all doctors | Yes |
| GET | `/doctors/patients/my` | Get doctor's assigned patients | Yes (Doctor role) |

#### GET `/doctors`
**Response:**
```json
[
  {
    "id": "doctor-uuid",
    "name": "Dr. John Smith",
    "firstName": "John",
    "lastName": "Smith",
    "email": "doctor@example.com",
    "phone": "1234567890",
    "specialization": "Gastroenterology",
    "department": "Surgery",
    "role": "doctor"
  }
]
```

#### GET `/doctors/patients/my`
**Response:**
```json
{
  "success": true,
  "patients": [
    {
      "_id": "patient-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "1234567890",
      "patientCode": "PAT-001",
      "lastVisitDate": "2024-01-15T10:30:00.000Z",
      "metadata": {
        "patientCode": "PAT-001"
      }
    }
  ]
}
```

---

## Appointment APIs

### Base Route: `/api/appointments`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/appointments` | Create appointment | Yes |
| GET | `/appointments` | List appointments | Yes |
| GET | `/appointments/:id` | Get appointment by ID | Yes |
| PUT | `/appointments/:id` | Update appointment | Yes |
| PATCH | `/appointments/:id/status` | Update appointment status | Yes |
| DELETE | `/appointments/:id` | Delete appointment | Yes |
| POST | `/appointments/:id/follow-up` | Create follow-up appointment | Yes |
| GET | `/appointments/patient/:patientId/follow-ups` | Get patient's follow-ups | Yes |
| GET | `/appointments/:id/follow-up-chain` | Get follow-up chain | Yes |

#### POST `/appointments`
**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "appointmentType": "Consultation",
  "startAt": "2024-01-20T10:00:00.000Z",
  "date": "2024-01-20", // alternative
  "time": "10:00", // alternative
  "durationMinutes": 20,
  "location": "Room 101",
  "status": "Scheduled",
  "notes": "Follow-up visit",
  "metadata": {
    "mode": "In-Person",
    "priority": "Normal",
    "chiefComplaint": "Stomach pain"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "appointment": {
    "_id": "appointment-uuid",
    "patientId": { ... },
    "doctorId": { ... },
    "doctor": "Dr. John Smith",
    "startAt": "2024-01-20T10:00:00.000Z",
    "endAt": "2024-01-20T10:20:00.000Z",
    "status": "Scheduled",
    "appointmentType": "Consultation"
  }
}
```

#### GET `/appointments`
**Query Parameters:**
- `doctorId` - Filter by doctor ID
- `patientId` - Filter by patient ID
- `hasFollowUp` - Filter appointments with follow-ups (true/false)

#### POST `/appointments/:id/follow-up`
**Request Body:**
```json
{
  "followUpDate": "2024-02-01T10:00:00.000Z",
  "followUpReason": "Check medication effectiveness",
  "appointmentType": "Follow-Up",
  "location": "Room 102",
  "notes": "Review lab results"
}
```

---

## Intake Form APIs

### Base Route: `/api/patients/:id/intake`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/patients/:id/intake` | Create intake record | Yes |
| GET | `/patients/:id/intake` | List patient intakes | Yes |
| GET | `/patients/:id/intake/:intakeId` | Get single intake | Yes |

#### POST `/patients/:id/intake`
**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "appointmentId": "appointment-uuid",
  "chiefComplaint": "Abdominal pain",
  "vitals": {
    "bp": "120/80",
    "temp": 98.6,
    "pulse": 72,
    "spo2": 98,
    "heightCm": 170,
    "weightKg": 70,
    "bmi": 24.2
  },
  "priority": "Normal",
  "triageCategory": "Green",
  "consent": {
    "consentGiven": true,
    "consentAt": "2024-01-15T10:00:00.000Z",
    "consentBy": "digital"
  },
  "pharmacy": [
    {
      "medicineId": "medicine-uuid",
      "Medicine": "Paracetamol",
      "Dosage": "500mg",
      "Frequency": "Twice daily",
      "quantity": 10,
      "unitPrice": 5.0,
      "Notes": "After meals"
    }
  ],
  "pathology": [
    {
      "Test Name": "Blood Test",
      "Category": "Hematology",
      "Priority": "Normal",
      "Notes": "Fasting required"
    }
  ],
  "followUp": {
    "isRequired": true,
    "priority": "Normal",
    "recommendedDate": "2024-02-01T10:00:00.000Z",
    "reason": "Review test results",
    "instructions": "Bring all reports",
    "diagnosis": "Gastritis",
    "treatmentPlan": "Medication and diet control",
    "labTests": ["Blood Test", "Urine Test"],
    "imaging": ["X-Ray"],
    "procedures": [],
    "prescriptionReview": true
  },
  "notes": "Patient reported symptoms for 3 days"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Intake recorded successfully",
  "intake": { ... },
  "patient": { ... },
  "pharmacy": { ... },
  "labReportIds": ["lab-report-uuid"],
  "appointment": { ... }
}
```

#### GET `/patients/:id/intake`
**Query Parameters:**
- `limit` - Items per page (default: 20, max: 200)
- `skip` - Skip items (default: 0)
- `start` - Start date filter
- `end` - End date filter

---

## Pharmacy APIs

### Base Route: `/api/pharmacy`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/pharmacy/medicines` | Create medicine | Yes |
| GET | `/pharmacy/medicines` | List medicines | Yes |
| GET | `/pharmacy/medicines/:id` | Get medicine by ID | Yes |
| PUT | `/pharmacy/medicines/:id` | Update medicine | Yes (Admin/Pharmacist) |
| DELETE | `/pharmacy/medicines/:id` | Delete medicine | Yes (Admin/Pharmacist) |
| POST | `/pharmacy/batches` | Create batch | Yes (Admin/Pharmacist) |
| GET | `/pharmacy/batches` | List batches | Yes |
| PUT | `/pharmacy/batches/:id` | Update batch | Yes (Admin/Pharmacist) |
| DELETE | `/pharmacy/batches/:id` | Delete batch | Yes (Admin/Pharmacist) |
| POST | `/pharmacy/records/dispense` | Dispense medicines | Yes |
| GET | `/pharmacy/records` | List pharmacy records | Yes |
| GET | `/pharmacy/records/:id` | Get record by ID | Yes |
| GET | `/pharmacy/pending-prescriptions` | List pending prescriptions | Yes |
| POST | `/pharmacy/prescriptions/create-from-intake` | Create prescription from intake | Yes |
| POST | `/pharmacy/prescriptions/:intakeId/dispense` | Mark prescription as dispensed | Yes (Admin/Pharmacist) |
| GET | `/pharmacy/admin/analytics` | Get inventory analytics | Yes (Admin/Pharmacist) |
| GET | `/pharmacy/admin/low-stock` | Get low stock medicines | Yes (Admin/Pharmacist) |
| GET | `/pharmacy/admin/expiring-batches` | Get expiring batches | Yes (Admin/Pharmacist) |
| POST | `/pharmacy/admin/bulk-import` | Bulk import medicines | Yes (Admin/Pharmacist) |
| GET | `/pharmacy/admin/inventory-report` | Get inventory report | Yes (Admin/Pharmacist) |

#### POST `/pharmacy/medicines`
**Request Body:**
```json
{
  "name": "Paracetamol",
  "genericName": "Acetaminophen",
  "sku": "MED-001",
  "form": "Tablet",
  "strength": "500mg",
  "unit": "pcs",
  "manufacturer": "PharmaCo",
  "brand": "Crocin",
  "category": "Pain Relief",
  "description": "Pain and fever relief",
  "status": "In Stock",
  "stock": 100, // Initial stock
  "salePrice": 5.0,
  "costPrice": 3.0,
  "reorderLevel": 20
}
```

#### GET `/pharmacy/medicines`
**Query Parameters:**
- `q` - Search query (name, SKU, brand)
- `category` - Filter by category
- `lowStock` - Show only low stock items (1 or 0)
- `page` - Page number (default: 0)
- `limit` - Items per page (default: 50, max: 200)
- `meta` - Return metadata (1 or 0)

#### POST `/pharmacy/records/dispense`
**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "appointmentId": "appointment-uuid",
  "items": [
    {
      "medicineId": "medicine-uuid",
      "batchId": "batch-uuid", // optional
      "quantity": 10,
      "unitPrice": 5.0
    }
  ],
  "paid": true,
  "paymentMethod": "Cash",
  "notes": "Dispensed for consultation"
}
```

#### GET `/pharmacy/admin/analytics`
**Response:**
```json
{
  "success": true,
  "analytics": {
    "inventory": {
      "totalMedicines": 150,
      "inStock": 120,
      "lowStock": 25,
      "outOfStock": 5
    },
    "transactions": {
      "last30Days": 450,
      "totalRevenue": "125000.00"
    },
    "alerts": {
      "expiringBatches": 8,
      "lowStockItems": 25
    },
    "topMedicines": [
      {
        "id": "medicine-uuid",
        "name": "Paracetamol",
        "quantityDispensed": 500,
        "revenue": "2500.00"
      }
    ]
  }
}
```

---

## Pathology/Lab Report APIs

### Base Route: `/api/pathology`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/pathology/pending-tests` | Get pending lab tests from intakes | Yes |
| POST | `/pathology/lab-reports` | Create lab report | Yes |
| GET | `/pathology/lab-reports` | List lab reports | Yes |
| GET | `/pathology/lab-reports/:id` | Get lab report by ID | Yes |
| PUT | `/pathology/lab-reports/:id` | Update lab report | Yes (Admin/Pathologist) |
| DELETE | `/pathology/lab-reports/:id` | Delete lab report | Yes (Admin/Pathologist) |
| POST | `/pathology/lab-reports/:id/upload` | Upload report file | Yes |

#### GET `/pathology/pending-tests`
**Query Parameters:**
- `page` - Page number (default: 0)
- `limit` - Items per page (default: 50, max: 200)

**Response:**
```json
{
  "success": true,
  "pendingTests": [
    {
      "_id": "intake-uuid",
      "patientName": "John Doe",
      "patientId": "patient-uuid",
      "patientPhone": "1234567890",
      "doctorId": "doctor-uuid",
      "tests": [
        {
          "testName": "Blood Test",
          "category": "Hematology",
          "priority": "Normal"
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 0,
  "limit": 50
}
```

---

## Staff Management APIs

### Base Route: `/api/staff`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/staff` | Create staff member | Yes (Admin) |
| GET | `/staff` | List staff members | Yes |
| GET | `/staff/:id` | Get staff by ID | Yes |
| PUT | `/staff/:id` | Update staff | Yes (Admin) |
| PATCH | `/staff/:id/status` | Update staff status | Yes (Admin) |
| DELETE | `/staff/:id` | Delete staff | Yes (Admin) |

#### POST `/staff`
**Request Body:**
```json
{
  "name": "John Doe",
  "designation": "Nurse",
  "department": "General",
  "contact": "1234567890",
  "email": "nurse@example.com",
  "gender": "Male",
  "status": "active",
  "shift": "Day",
  "roles": ["nursing", "reception"],
  "qualifications": ["B.Sc Nursing"],
  "experienceYears": 5,
  "joinedAt": "2020-01-01",
  "location": "Karur",
  "dob": "1990-01-01",
  "notes": "Excellent performance"
}
```

**Response:**
```json
{
  "success": true,
  "staff": {
    "_id": "staff-uuid",
    "name": "John Doe",
    "designation": "Nurse",
    "metadata": {
      "staffCode": "STF-001"
    }
  }
}
```

#### GET `/staff`
**Query Parameters:**
- `q` - Search query (name, designation, email)
- `department` - Filter by department
- `page` - Page number (default: 0)
- `limit` - Items per page (default: 50, max: 100)

---

## Payroll APIs

### Base Route: `/api/payroll`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payroll` | Create payroll record | Yes (Admin) |
| GET | `/payroll` | List payroll records | Yes (Admin) |
| GET | `/payroll/:id` | Get payroll by ID | Yes (Admin) |
| PUT | `/payroll/:id` | Update payroll | Yes (Admin) |
| PATCH | `/payroll/:id/status` | Update payroll status | Yes (Admin) |
| DELETE | `/payroll/:id` | Delete payroll | Yes (Admin) |
| POST | `/payroll/:id/approve` | Approve payroll | Yes (Admin) |
| POST | `/payroll/:id/reject` | Reject payroll | Yes (Admin) |
| POST | `/payroll/:id/process-payment` | Process payment | Yes (Admin) |

#### POST `/payroll`
**Request Body:**
```json
{
  "staffId": "staff-uuid",
  "staffName": "John Doe",
  "staffCode": "STF-001",
  "department": "Nursing",
  "designation": "Staff Nurse",
  "payPeriodMonth": 1,
  "payPeriodYear": 2024,
  "payPeriodStart": "2024-01-01",
  "payPeriodEnd": "2024-01-31",
  "basicSalary": 30000,
  "earnings": {
    "hra": 5000,
    "da": 3000,
    "medicalAllowance": 2000
  },
  "deductions": {
    "pf": 2000,
    "esi": 500,
    "tax": 1500
  },
  "grossSalary": 40000,
  "netSalary": 36000,
  "attendance": {
    "workingDays": 26,
    "presentDays": 24,
    "absentDays": 2,
    "leaves": 2,
    "halfDays": 0
  },
  "paymentMode": "Bank Transfer",
  "bankName": "HDFC Bank",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234",
  "status": "Draft",
  "notes": "Regular monthly salary"
}
```

---

## Report Generation APIs

### Base Route: `/api/reports`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/reports/patient/:patientId` | Generate patient report PDF | Yes |
| GET | `/reports/doctor/:doctorId` | Generate doctor performance report PDF | Yes |

#### GET `/reports/patient/:patientId`
**Response:** PDF file download

**PDF Contains:**
- Patient Information
- Assigned Doctor
- Vital Signs
- Medical History
- Known Allergies
- Appointment History
- Summary Statistics

#### GET `/reports/doctor/:doctorId`
**Response:** PDF file download

**PDF Contains:**
- Doctor Information
- Report Period (last 7 days)
- Overall Statistics
- Performance Metrics
- This Week's Appointments
- Daily Breakdown
- Active Patients
- Summary

---

## Bot/AI Assistant APIs

### Base Route: `/api/bot`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bot/chat` | Send message to AI assistant | Yes |
| GET | `/bot/conversations` | Get user's conversations | Yes |
| GET | `/bot/conversations/:conversationId` | Get conversation by ID | Yes |
| DELETE | `/bot/conversations/:conversationId` | Delete conversation | Yes |
| POST | `/bot/conversations/:conversationId/clear` | Clear conversation history | Yes |

#### POST `/bot/chat`
**Request Body:**
```json
{
  "message": "Show me patient information for John Doe",
  "conversationId": "conversation-uuid", // optional
  "metadata": {
    "source": "web",
    "context": "patient-view"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Here is the information for John Doe...",
  "conversationId": "conversation-uuid",
  "messageId": "message-uuid",
  "metadata": {
    "model": "gemini-2.5-flash",
    "tokensUsed": 150
  }
}
```

---

## Additional Endpoints

### Enterprise Reports
- **Base Route:** `/api/enterprise-reports`
- Document scanning and processing features
- Advanced PDF generation with enhanced formatting

### Scanner Enterprise
- **Base Route:** `/api/scanner-enterprise`
- Document upload and processing
- OCR integration
- Document classification

### Telegram Bot
- **Base Route:** `/api/telegram`
- Telegram bot webhook integration
- Message handling
- User registration

### Card Management
- **Base Route:** `/api/card`
- Patient card generation
- QR code generation
- Card printing

---

## Error Codes Reference

| Code | Description |
|------|-------------|
| 1000 | Missing email or password |
| 1002 | Invalid credentials / User not found |
| 1003 | Incorrect password |
| 1006 | Missing required fields |
| 1007 | Resource not found |
| 1008 | Missing field in request |
| 1009 | Forbidden / Unauthorized access |
| 2000 | Missing refresh token or identifiers |
| 2001 | Invalid refresh token |
| 2002 | User not found for session |
| 3000-3999 | Patient-related errors |
| 4000-4999 | Appointment-related errors |
| 5000-5999 | Server errors |
| 6000-6999 | Pharmacy-related errors |
| 7000-7999 | Pathology-related errors |
| 10000-10999 | Intake form errors |

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": 1234,
  "detail": "Additional error details"
}
```

---

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Rate Limiting

- Default rate limit: 100 requests per minute per IP
- Higher limits available for authenticated users
- Burst allowance: Up to 200 requests in short bursts

---

## Pagination

Endpoints supporting pagination use the following parameters:
- `page` - Page number (starts at 0)
- `limit` - Items per page
- `skip` - Number of items to skip

Response includes:
```json
{
  "success": true,
  "data": [ ... ],
  "total": 500,
  "page": 0,
  "limit": 20
}
```

---

## Date Formats

All dates should be in ISO 8601 format:
- `2024-01-15T10:30:00.000Z` (full timestamp)
- `2024-01-15` (date only)

---

## Support

For API support and questions:
- Email: support@karurgastro.com
- Documentation: [Coming Soon]
- API Version: 1.0

---

**Last Updated:** 2024-01-15
**API Version:** 1.0.0
**Server Version:** Node.js + Express + MongoDB

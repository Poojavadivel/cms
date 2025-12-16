# API Documentation - Karur Gastro Hospital Management System

## Table of Contents
1. [Authentication](#authentication)
2. [Patients](#patients)
3. [Doctors](#doctors)
4. [Appointments](#appointments)
5. [Pharmacy](#pharmacy)
6. [Staff](#staff)
7. [Intake](#intake)
8. [Reports](#reports)
9. [Payroll](#payroll)

---

## Authentication

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Auth | `/api/auth/login` | POST | User login | `{ email, password, deviceId }` | — | `{ accessToken, refreshToken, sessionId, user }` | No | 200, 400, 500 |
| Auth | `/api/auth/refresh` | POST | Refresh access token | `{ refreshToken, sessionId, userId }` | — | `{ accessToken, refreshToken, sessionId }` | No | 200, 400, 401, 404, 500 |
| Auth | `/api/auth/validate-token` | POST | Validate current token | — | — | `{ id, email, role, firstName, lastName }` | Yes | 200, 404, 500 |
| Auth | `/api/auth/signout` | POST | Sign out user | `{ sessionId, refreshToken, userId }` | — | `{ message }` | Yes | 200, 400, 404, 500 |

---

## Patients

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Patient | `/api/patients` | POST | Register new patient | `{ firstName, lastName, phone, email, dateOfBirth, gender, address, vitals, allergies, metadata }` | — | Created patient object | Yes (Admin/Reception/Doctor) | 201, 400, 500 |
| Patient | `/api/patients` | GET | List all patients with search | — | `q, page, limit, meta` | Array of patient objects or `{ patients, total, page, limit }` | Yes | 200, 500 |
| Patient | `/api/patients/{id}` | GET | Get patient details by ID | — | `id` | Patient object | Yes | 200, 404, 500 |
| Patient | `/api/patients/{id}` | PUT | Update patient info (full) | `{ firstName, lastName, phone, email, address, vitals, allergies, metadata }` | `id` | Updated patient object | Yes | 200, 404, 500 |
| Patient | `/api/patients/{id}` | PATCH | Partial update patient | `{ field: value }` | `id` | `{ success, patient }` | Yes | 200, 404, 500 |
| Patient | `/api/patients/{id}` | DELETE | Soft delete patient | — | `id` | `{ success, message, deletedId }` | Yes | 200, 404, 500 |

---

## Doctors

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Doctor | `/api/doctors` | GET | List all doctors | — | — | Array of doctor objects | Yes | 200, 500 |
| Doctor | `/api/doctors/patients/my` | GET | Get doctor's patients | — | — | `{ success, patients }` | Yes (Doctor) | 200, 403, 500 |

---

## Appointments

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Appointment | `/api/appointments` | POST | Create new appointment | `{ patientId, appointmentType, startAt, endAt, location, status, vitals, notes, metadata }` | — | `{ success, message, appointment }` | Yes | 201, 400, 404, 500 |
| Appointment | `/api/appointments` | GET | List all appointments | — | `doctorId, patientId, hasFollowUp` | `{ success, appointments }` | Yes | 200, 500 |
| Appointment | `/api/appointments/{id}` | GET | Get appointment by ID | — | `id` | `{ success, appointment }` | Yes | 200, 403, 404, 500 |
| Appointment | `/api/appointments/{id}` | PUT | Update appointment (full) | `{ patientId, appointmentType, startAt, endAt, location, status, vitals, notes, metadata, followUp }` | `id` | `{ success, message, appointment }` | Yes | 200, 403, 404, 500 |
| Appointment | `/api/appointments/{id}/status` | PATCH | Update appointment status | `{ status }` | `id` | `{ success, message, appointment }` | Yes | 200, 400, 403, 404, 500 |
| Appointment | `/api/appointments/{id}` | DELETE | Delete appointment | — | `id` | `{ success, message }` | Yes | 200, 403, 404, 500 |
| Appointment | `/api/appointments/{id}/follow-up` | POST | Create follow-up appointment | `{ followUpDate, followUpReason, appointmentType, location, notes }` | `id` | `{ success, message, appointment, followUpId }` | Yes | 201, 400, 403, 404, 500 |
| Appointment | `/api/appointments/patient/{patientId}/follow-ups` | GET | Get follow-up history | — | `patientId` | `{ success, followUps, count }` | Yes | 200, 500 |
| Appointment | `/api/appointments/{id}/follow-up-chain` | GET | Get follow-up chain | — | `id` | `{ success, chain, count }` | Yes | 200, 404, 500 |

---

## Pharmacy

### Medicines

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Pharmacy | `/api/pharmacy/medicines` | POST | Create new medicine | `{ name, genericName, sku, form, strength, unit, manufacturer, brand, category, description, status, metadata }` | — | Medicine object | Yes | 201, 400, 409, 500 |
| Pharmacy | `/api/pharmacy/medicines` | GET | List medicines | — | `q, category, lowStock, page, limit, meta` | Array of medicines or `{ success, medicines, total, page, limit }` | Yes | 200, 500 |
| Pharmacy | `/api/pharmacy/medicines/{id}` | GET | Get medicine by ID | — | `id, meta` | Medicine object with batches | Yes | 200, 404, 500 |
| Pharmacy | `/api/pharmacy/medicines/{id}` | PUT | Update medicine | `{ name, genericName, brand, description, category, unit, status, reorderLevel, stock, salePrice }` | `id` | `{ success, medicine }` | Yes (Admin/Pharmacist) | 200, 404, 500 |
| Pharmacy | `/api/pharmacy/medicines/{id}` | DELETE | Delete medicine | — | `id` | `{ success, message, deletedId }` | Yes (Admin/Pharmacist) | 200, 400, 404, 500 |

### Batches

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Pharmacy | `/api/pharmacy/batches` | POST | Create medicine batch | `{ medicineId, batchNumber, expiryDate, quantity, purchasePrice, salePrice, supplier, location, metadata }` | — | `{ success, batch, record }` | Yes (Admin/Pharmacist) | 201, 400, 404, 500 |
| Pharmacy | `/api/pharmacy/batches` | GET | List batches | — | `medicineId, expiryBefore, expiryAfter, page, limit` | `{ success, batches, total, page, limit }` | Yes | 200, 500 |
| Pharmacy | `/api/pharmacy/batches/{id}` | PUT | Update batch | `{ batchNumber, expiryDate, purchasePrice, salePrice, supplier, location, quantity }` | `id` | `{ success, batch }` | Yes (Admin/Pharmacist) | 200, 404, 500 |
| Pharmacy | `/api/pharmacy/batches/{id}` | DELETE | Delete batch | — | `id` | `{ success, message, deletedId }` | Yes (Admin/Pharmacist) | 200, 404, 500 |

### Pharmacy Records & Dispensing

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Pharmacy | `/api/pharmacy/records/dispense` | POST | Dispense medicines (transactional) | `{ items: [{ medicineId, batchId, quantity, unitPrice }], patientId, appointmentId, paid, paymentMethod, notes, metadata }` | — | `{ success, record }` | Yes | 201, 400, 404, 500 |
| Pharmacy | `/api/pharmacy/records` | GET | List pharmacy records | — | `q, patientId, type, from, to, page, limit` | `{ success, records, total, page, limit }` | Yes | 200, 500 |
| Pharmacy | `/api/pharmacy/records/{id}` | GET | Get record by ID | — | `id` | `{ success, record }` | Yes | 200, 404, 500 |

### Prescriptions

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Pharmacy | `/api/pharmacy/pending-prescriptions` | GET | Get pending prescriptions | — | `page, limit` | `{ success, prescriptions, total, page, limit }` | Yes | 200, 500 |
| Pharmacy | `/api/pharmacy/prescriptions/create-from-intake` | POST | Create prescription from intake | `{ items: [{ medicineId, name, dosage, frequency, quantity, price }], patientId, appointmentId, paid, paymentMethod, notes, metadata }` | — | `{ success, record, stockReductions, total }` | Yes | 201, 400, 500 |
| Pharmacy | `/api/pharmacy/prescriptions/{intakeId}/dispense` | POST | Mark prescription as dispensed | `{ items, paid, paymentMethod, notes, metadata }` | `intakeId` | `{ success, record }` | Yes (Admin/Pharmacist) | 201, 400, 404, 500 |
| Pharmacy | `/api/pharmacy/prescriptions/{intakeId}/pdf` | GET | Generate prescription PDF | — | `intakeId` | PDF file | Yes | 200, 404, 500 |

### Admin Analytics

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Pharmacy | `/api/pharmacy/admin/analytics` | GET | Get inventory analytics | — | — | `{ success, analytics }` | Yes (Admin/Pharmacist) | 200, 500 |
| Pharmacy | `/api/pharmacy/admin/low-stock` | GET | Get low stock medicines | — | `threshold` | `{ success, lowStockMedicines, count }` | Yes (Admin/Pharmacist) | 200, 500 |
| Pharmacy | `/api/pharmacy/admin/expiring-batches` | GET | Get expiring batches | — | `days` | `{ success, expiringBatches, count }` | Yes (Admin/Pharmacist) | 200, 500 |
| Pharmacy | `/api/pharmacy/admin/bulk-import` | POST | Bulk import medicines | `{ medicines: [{ name, sku, ... }] }` | — | `{ success, results }` | Yes (Admin/Pharmacist) | 200, 400, 500 |
| Pharmacy | `/api/pharmacy/admin/inventory-report` | GET | Get inventory report | — | — | `{ success, report, summary }` | Yes (Admin/Pharmacist) | 200, 500 |

---

## Staff

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Staff | `/api/staff` | POST | Create staff member | `{ name, designation, department, contact, email, avatarUrl, gender, status, shift, roles, qualifications, experienceYears, joinedAt, metadata }` | — | `{ success, staff }` | Yes (Admin) | 201, 400, 500 |
| Staff | `/api/staff` | GET | List staff members | — | `q, department, page, limit` | `{ success, staff, total, page, limit }` | Yes | 200, 500 |
| Staff | `/api/staff/{id}` | GET | Get staff by ID | — | `id` | `{ success, staff }` | Yes | 200, 404, 500 |
| Staff | `/api/staff/{id}` | PUT | Update staff member | `{ name, designation, department, contact, email, status, shift, roles, qualifications, metadata }` | `id` | `{ success, staff }` | Yes (Admin) | 200, 404, 500 |
| Staff | `/api/staff/{id}/status` | PATCH | Update staff status | `{ is_active, status, lastActiveAt }` | `id` | `{ success, staff }` | Yes (Admin) | 200, 404, 500 |
| Staff | `/api/staff/{id}` | DELETE | Delete staff member | — | `id` | `{ success, deletedId }` | Yes (Admin) | 200, 404, 500 |

---

## Intake

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Intake | `/api/patients/{id}/intake` | POST | Create patient intake record | `{ complaints, diagnosis, vitals, treatment, prescriptions, pharmacyItems, labTests, followUp, notes }` | `id` (patient ID) | `{ success, intake }` | Yes | 201, 400, 404, 500 |

---

## Reports

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Reports | `/api/reports/patient/{patientId}` | GET | Generate patient report PDF | — | `patientId` | PDF file | Yes | 200, 404, 500 |

---

## Payroll

| Module | API Endpoint | Method | Description | Request Body | Params | Response | Auth | Status Codes |
|--------|--------------|--------|-------------|--------------|---------|----------|------|--------------|
| Payroll | `/api/payroll` | POST | Create payroll record | `{ staffId, staffName, payPeriodMonth, payPeriodYear, basicSalary, earnings, deductions, reimbursements, attendance, status, paymentMode, notes }` | — | `{ success, payroll }` | Yes (Admin) | 201, 400, 409, 500 |
| Payroll | `/api/payroll` | GET | List payroll records | — | `staffId, month, year, status, page, limit` | `{ success, payroll, total, page, limit }` | Yes (Admin) | 200, 500 |
| Payroll | `/api/payroll/{id}` | GET | Get payroll by ID | — | `id` | `{ success, payroll }` | Yes (Admin) | 200, 404, 500 |
| Payroll | `/api/payroll/{id}` | PUT | Update payroll record | `{ basicSalary, earnings, deductions, status, paymentMode, notes }` | `id` | `{ success, payroll }` | Yes (Admin) | 200, 404, 500 |
| Payroll | `/api/payroll/{id}/status` | PATCH | Update payroll status | `{ status, approvedBy, rejectedBy, rejectionReason }` | `id` | `{ success, payroll }` | Yes (Admin) | 200, 404, 500 |
| Payroll | `/api/payroll/{id}` | DELETE | Delete payroll record | — | `id` | `{ success, deletedId }` | Yes (Admin) | 200, 404, 500 |

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": 1000
}
```

## Error Codes Reference

### Authentication Errors (1000-1999)
| Code | Description |
|------|-------------|
| 1000 | Please enter email and password |
| 1002 | Invalid credentials / Forbidden |
| 1003 | Invalid credentials (incorrect password) |
| 1006 | Missing required fields: patientId, appointmentType, startAt |
| 1007 | Appointment/Patient not found |
| 1008 | Status is required |
| 1009 | Forbidden |
| 1010 | Not authorized to create follow-up for this appointment |

### Session & Token Errors (2000-2999)
| Code | Description |
|------|-------------|
| 2000 | Missing refresh token or identifiers |
| 2001 | Session not found / Invalid refresh token |
| 2002 | User not found |
| 2006 | Missing required field: staffId |
| 2007 | Payroll/Staff not found |
| 2008 | Payroll already exists for this staff and period |
| 2009 | Payroll already approved or paid |
| 2010 | Payroll must be approved before processing payment |
| 2011 | Cannot delete processed or paid payroll |

### Session Management (3000-3999)
| Code | Description |
|------|-------------|
| 3000 | No session identifier provided |
| 3001 | Session not found |
| 3006 | Missing required fields: firstName, phone |
| 3007 | Patient not found |

### Access Control (4000-4999)
| Code | Description |
|------|-------------|
| 4001 | Patient not found (card) |
| 4010 | Forbidden (non-doctor access) |

### Server Errors (5000-5999)
| Code | Description |
|------|-------------|
| 5000 | Failed to create appointment / Server error |
| 5001 | Failed to fetch appointments |
| 5002 | Failed to fetch appointment |
| 5003 | Failed to update status |
| 5004 | Failed to delete appointment |
| 5005 | Failed to update appointment |
| 5006 | Failed to create follow-up appointment |
| 5007 | Failed to fetch follow-up history |
| 5008 | Failed to fetch follow-up chain |

### Pharmacy - Medicine Errors (6000-6099)
| Code | Description |
|------|-------------|
| 6001 | Missing required field: name (medicine) |
| 6002 | Forbidden: admin/pharmacist role required |
| 6003 | Medicine with this SKU already exists |
| 6004 | Cannot delete medicine with existing batches or records. Archive it instead. |
| 6007 | Medicine not found |

### Pharmacy - Batch Errors (6100-6199)
| Code | Description |
|------|-------------|
| 6101 | medicineId and quantity are required |
| 6102 | Medicine not found (batch creation) |
| 6103 | Batch not found |

### Pharmacy - Dispense Errors (6200-6299)
| Code | Description |
|------|-------------|
| 6201 | No items provided |
| 6202 | Patient not found (dispense) |
| 6203 | Invalid item: medicineId & positive quantity required |
| 6208 | Record not found |
| 6209 | Intake not found |
| 6210 | No medicine items provided |
| 6211 | Prescription already dispensed |

### Pharmacy - Admin Operations (6300-6399)
| Code | Description |
|------|-------------|
| 6301 | medicines array is required |

### Pharmacy - Operation Failures (6500-6599)
| Code | Description |
|------|-------------|
| 6500 | Failed to create medicine |
| 6501 | Failed to fetch medicines |
| 6502 | Failed to fetch medicine |
| 6503 | Failed to update medicine |
| 6504 | Failed to delete medicine |
| 6505 | Failed to create batch |
| 6506 | Failed to fetch batches |
| 6507 | Failed to update batch |
| 6508 | Failed to delete batch |
| 6509 | Failed to dispense items |
| 6510 | Failed to fetch records |
| 6511 | Failed to fetch record |
| 6512 | Failed to fetch pending prescriptions |
| 6513 | Failed to dispense prescription |
| 6514 | Failed to create prescription |
| 6515 | Prescription not found |
| 6516 | Failed to fetch expiring batches |
| 6517 | Failed to bulk import |
| 6518 | No medicines in prescription / Failed to generate PDF |

### Pathology/Lab Errors (7000-7999)
| Code | Description |
|------|-------------|
| 7001 | Intake model not available |
| 7002 | Forbidden: admin/pathologist role required |
| 7003 | Intake model not available |
| 7004 | Failed to fetch pending lab tests |
| 7005 | LabReport model not available |
| 7006 | patientId is required |
| 7007 | Patient not found (lab report) |
| 7008 | Failed to create lab report |
| 7009 | Failed to fetch lab reports |
| 7010 | Lab report not found |
| 7011 | Failed to fetch lab report |
| 7012 | Failed to update lab report |
| 7013 | Failed to delete lab report |
| 7014 | No file attached to this report |
| 7015 | File not found on server |
| 7016 | Failed to download lab report |

### Intake Errors (10000+)
| Code | Description |
|------|-------------|
| 10010 | id (param) is required |
| 10011 | patientId or patientSnapshot required |
| 10012 | patientSnapshot.firstName is required (patient resolution failed) |
| 10020 | patientId (param) is required |
| 10030 | patientId and intakeId are required |
| 10031 | Intake not found |
| 10032 | Forbidden (intake access) |

---

## Authentication

All authenticated endpoints require an `Authorization` header with a Bearer token:

```
Authorization: Bearer <accessToken>
```

## Role-Based Access

- **Admin/SuperAdmin**: Full access to all endpoints
- **Doctor**: Access to their own patients and appointments
- **Pharmacist**: Access to pharmacy module
- **Reception**: Access to patient registration and appointments

---

**Generated**: 2025-12-04  
**Version**: 1.0  
**System**: Karur Gastro Hospital Management System

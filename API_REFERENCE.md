# HMS API Reference Guide

## Base URL
```
https://hms-dev.onrender.com/api
```

## Authentication
All requests require Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Staff APIs

### Get All Staff
```http
GET /staff
```

**Response**:
```json
[
  {
    "id": "staff123",
    "name": "Dr. John Doe",
    "email": "john@hospital.com",
    "contact": "1234567890",
    "designation": "Doctor",
    "department": "Cardiology",
    "status": "Available",
    ...
  }
]
```

### Get Staff by ID
```http
GET /staff/:id
```

### Create Staff
```http
POST /staff
Content-Type: application/json

{
  "name": "Dr. Jane Smith",
  "email": "jane@hospital.com",
  "contact": "9876543210",
  "gender": "Female",
  "designation": "Surgeon",
  "department": "Surgery",
  "status": "Available"
}
```

### Update Staff
```http
PUT /staff/:id
Content-Type: application/json

{
  "id": "staff123",
  "status": "On Leave",
  ...
}
```

### Delete Staff
```http
DELETE /staff/:id
```

### Download Staff Report
```http
GET /reports-proper/staff/:staffId
```
**Response**: PDF file

### Download Doctor Report
```http
GET /reports-proper/doctor/:doctorId
```
**Response**: PDF file (includes appointments and patients)

---

## Pathology APIs

### Get All Reports
```http
GET /pathology/reports
```

### Get Report by ID
```http
GET /pathology/reports/:id
```

### Create Report
```http
POST /pathology/reports
Content-Type: application/json

{
  "patientName": "John Patient",
  "patientId": "P123",
  "testName": "Blood Test",
  "testType": "Hematology",
  "status": "Pending",
  "doctorName": "Dr. Smith",
  "technician": "Tech A",
  "collectionDate": "2024-12-15T10:00:00Z"
}
```

### Update Report
```http
PUT /pathology/reports/:id
```

### Delete Report
```http
DELETE /pathology/reports/:id
```

### Download Report
```http
GET /pathology/reports/:id/download
```
**Response**: PDF file

---

## Pharmacy APIs

### Get All Medicines
```http
GET /pharmacy/medicines
```

### Get Medicine by ID
```http
GET /pharmacy/medicines/:id
```

### Create Medicine
```http
POST /pharmacy/medicines
```

### Update Medicine
```http
PUT /pharmacy/medicines/:id
```

### Delete Medicine
```http
DELETE /pharmacy/medicines/:id
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": { ... }
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or missing token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "..."
}
```

---

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user

## Notes
- All dates in ISO 8601 format
- All IDs are strings
- Boolean fields: use `true`/`false`
- Arrays can be empty `[]`

---

**Last Updated**: December 15, 2024  
**API Version**: v1.0

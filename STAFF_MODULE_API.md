# Staff Module API Documentation

## Overview
Complete API documentation for the Staff Management module based on Flutter implementation.

## Base Configuration

### Flutter Configuration
```dart
// Base URL: http://localhost:3000 or http://10.230.173.132:3000
// Endpoint Base: /api/staff
```

### React Configuration
```javascript
// Base URL: https://hms-dev.onrender.com/api
// Endpoint: /staff
// Full URL: https://hms-dev.onrender.com/api/staff
```

## API Endpoints

### 1. Fetch All Staff
**Endpoint:** `GET /api/staff`
**Description:** Retrieve all staff members with optional caching

#### Request
```http
GET /api/staff HTTP/1.1
Host: hms-dev.onrender.com
Authorization: Bearer {token}
Content-Type: application/json
```

#### Response Formats (Multiple supported)
```json
// Format 1: Direct array
[
  {
    "id": "staff123",
    "name": "Dr. Sarah Johnson",
    "designation": "Cardiologist",
    "department": "Cardiology",
    ...
  }
]

// Format 2: Wrapped in 'staff' key
{
  "staff": [...]
}

// Format 3: Wrapped in 'data' key
{
  "data": [...]
}
```

### 2. Fetch Staff by ID
**Endpoint:** `GET /api/staff/:id`
**Description:** Retrieve a single staff member by ID

#### Request
```http
GET /api/staff/staff123 HTTP/1.1
Host: hms-dev.onrender.com
Authorization: Bearer {token}
```

#### Response
```json
{
  "staff": {
    "id": "staff123",
    "name": "Dr. Sarah Johnson",
    ...
  }
}
```

### 3. Create Staff
**Endpoint:** `POST /api/staff`
**Description:** Create a new staff member

#### Request
```http
POST /api/staff HTTP/1.1
Host: hms-dev.onrender.com
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Dr. Sarah Johnson",
  "designation": "Cardiologist",
  "department": "Cardiology",
  "patientFacingId": "DOC001",
  "contact": "+1234567890",
  "email": "sarah@hospital.com",
  "gender": "Female",
  "status": "Available",
  "shift": "Morning",
  "roles": ["Doctor"],
  "qualifications": ["MBBS", "MD Cardiology"],
  "experienceYears": 5,
  "location": "Main Branch",
  "notes": {},
  "tags": []
}
```

#### Response
```json
{
  "staff": {
    "id": "generated-id",
    "name": "Dr. Sarah Johnson",
    ...
  }
}
```

### 4. Update Staff
**Endpoint:** `PUT /api/staff/:id`
**Description:** Update an existing staff member

#### Request
```http
PUT /api/staff/staff123 HTTP/1.1
Host: hms-dev.onrender.com
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "staff123",
  "name": "Dr. Sarah Johnson",
  ...
}
```

#### Response (Multiple formats supported)
```json
// Format 1: Success boolean
{
  "success": true,
  "status": 200
}

// Format 2: Updated object
{
  "staff": {
    "id": "staff123",
    ...
  }
}
```

### 5. Delete Staff
**Endpoint:** `DELETE /api/staff/:id`
**Description:** Delete a staff member

#### Request
```http
DELETE /api/staff/staff123 HTTP/1.1
Host: hms-dev.onrender.com
Authorization: Bearer {token}
```

#### Response
```json
{
  "success": true,
  "status": 200
}
```

### 6. Download Staff Report
**Endpoint:** `GET /api/reports-proper/staff/:id`
**Description:** Download PDF report for staff member

#### Request
```http
GET /api/reports-proper/staff/staff123 HTTP/1.1
Host: hms-dev.onrender.com
Authorization: Bearer {token}
```

#### Response
- **Success (200):** Binary PDF file
- **Headers:** `Content-Disposition: attachment; filename="Staff_Report.pdf"`

### 7. Download Doctor Report
**Endpoint:** `GET /api/reports-proper/doctor/:id`
**Description:** Download PDF report for doctor (includes appointments & patients)

#### Request
```http
GET /api/reports-proper/doctor/staff123 HTTP/1.1
Host: hms-dev.onrender.com
Authorization: Bearer {token}
```

#### Response
- **Success (200):** Binary PDF file
- **Headers:** `Content-Disposition: attachment; filename="Doctor_Report.pdf"`

## Staff Model Structure

### Complete Staff Object
```json
{
  "id": "string",                      // Unique identifier
  "_id": "string",                     // MongoDB ID (alternative)
  "name": "string",                    // Full name
  "designation": "string",             // Job title
  "department": "string",              // Department/specialty
  "patientFacingId": "string",         // Staff code (e.g., "DOC001")
  "contact": "string",                 // Phone number
  "email": "string",                   // Email address
  "avatarUrl": "string",               // Profile picture URL
  "gender": "string",                  // "Male", "Female", "Other"
  "status": "string",                  // "Available", "Off Duty", "On Leave"
  "shift": "string",                   // "Morning", "Evening", "Night"
  "roles": ["string"],                 // ["Doctor", "Nurse", etc.]
  "qualifications": ["string"],        // ["MBBS", "MD", etc.]
  "experienceYears": number,           // Years of experience
  "joinedAt": "string",                // ISO date
  "lastActiveAt": "string",            // ISO date
  "dob": "string",                     // ISO date
  "location": "string",                // Branch/location
  "notes": {                           // Key-value pairs
    "key": "value"
  },
  "appointmentsCount": number,         // Total appointments
  "tags": ["string"],                  // Custom tags
  "isSelected": boolean                // UI state
}
```

## Flutter Implementation Reference

### Service Methods
```dart
// Fetch all staff
Future<List<Staff>> fetchStaffs({bool forceRefresh = false})

// Fetch by ID
Future<Staff> fetchStaffById(String id)

// Create staff
Future<Staff?> createStaff(Staff staffDraft)

// Update staff
Future<bool> updateStaff(Staff staffDraft)

// Delete staff
Future<bool> deleteStaff(String id)
```

### Key Features
1. **Caching:** Staff list cached in memory, refreshed on demand
2. **Deduplication:** Remove duplicate entries by ID
3. **Optimistic Updates:** UI updates immediately, rollback on error
4. **Staff Code Logic:** Multiple fallback strategies (patientFacingId → notes → tags)
5. **Gender-based Avatars:** Male/Female asset images as fallback
6. **Role Detection:** Special handling for doctor role (different report)

## React Implementation

### Service Methods
```javascript
// Fetch all staff
const fetchStaffs = async (forceRefresh = false)

// Fetch by ID
const fetchStaffById = async (id)

// Create staff
const createStaff = async (staffDraft)

// Update staff
const updateStaff = async (staffDraft)

// Delete staff
const deleteStaff = async (id)

// Download reports
const downloadStaffReport = async (staffId)
const downloadDoctorReport = async (doctorId)

// Utility
const findLocalStaffById = (id)
const clearStaffCache = ()
const getCurrentStaff = ()
const getStaffList = ()
```

## Error Handling

### Common Error Codes
- **400:** Bad Request - Invalid data
- **401:** Unauthorized - Missing/invalid token
- **404:** Not Found - Staff member doesn't exist
- **500:** Server Error - Backend issue

### Error Response Format
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "status": 404
}
```

## Caching Strategy

### Flutter
```dart
List<Staff> _staffList = []; // In-memory cache
```

### React
```javascript
let staffCache = []; // Module-level cache
```

### Cache Invalidation
- On create: Add to beginning of cache
- On update: Replace in cache
- On delete: Remove from cache
- On forceRefresh: Clear and re-fetch

## Best Practices

1. **Always use deduplication** to prevent duplicate entries
2. **Implement optimistic updates** for better UX
3. **Handle multiple response formats** for flexibility
4. **Use staff code fallback logic** for consistency
5. **Cache locally** to reduce network calls
6. **Show loading states** during async operations
7. **Provide meaningful error messages** to users
8. **Support offline mode** with cached data

## Testing

### Test Scenarios
1. Fetch all staff (empty, populated)
2. Create staff (success, failure, duplicate)
3. Update staff (success, failure, not found)
4. Delete staff (success, failure, not found)
5. Search and filter operations
6. Pagination edge cases
7. Network failure recovery
8. Cache consistency

## Migration Notes

### From Flutter to React
1. Maintain same API endpoints
2. Keep same caching strategy
3. Use same staff code logic
4. Preserve gender avatar fallback
5. Match status and role options
6. Implement same validation rules

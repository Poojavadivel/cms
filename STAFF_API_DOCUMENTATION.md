# Staff Module API Documentation

## Overview
Complete API documentation for the Staff Management module, analyzed from Flutter implementation and mapped to React.

## Base URLs
- **Development**: `https://hms-dev.onrender.com`
- **API Base Path**: `/api`

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

## Staff API Endpoints

### 1. Get All Staff
**Endpoint**: `GET /api/staff`

**Purpose**: Fetch all staff members with optional pagination and filtering

**Flutter Implementation**:
```dart
Future<List<Staff>> fetchStaffs({bool forceRefresh = false}) async {
  final response = await _apiHandler.get(ApiEndpoints.getStaffs().url, token: token);
  // Handles: List, {staff: []}, {data: []}
}
```

**React Implementation**:
```javascript
const fetchStaffs = async (forceRefresh = false) => {
  const response = await api.get('/api/staff');
  // Handle multiple response formats
};
```

**Response Formats**:
- `[...]` - Direct array
- `{staff: [...]}` - Wrapped in staff key
- `{data: [...]}` - Wrapped in data key

**Response Fields**:
```json
{
  "_id": "string",
  "name": "string",
  "employeeId": "string",
  "email": "string",
  "contact": "string",
  "department": "string",
  "designation": "string",
  "roles": ["string"],
  "status": "Active|Inactive|On Leave",
  "joinDate": "ISO 8601 date",
  "salary": "number",
  "gender": "Male|Female|Other",
  "address": "string",
  "avatarUrl": "string",
  "notes": {},
  "tags": ["string"],
  "patientFacingId": "string"
}
```

---

### 2. Get Staff by ID
**Endpoint**: `GET /api/staff/:id`

**Purpose**: Fetch detailed information for a specific staff member

**Flutter Implementation**:
```dart
Future<Staff> fetchStaffById(String id) async {
  final response = await _apiHandler.get(ApiEndpoints.getStaffById(id).url, token: token);
  return Staff.fromMap(response);
}
```

**React Implementation**:
```javascript
const fetchStaffById = async (id) => {
  const response = await api.get(`/api/staff/${id}`);
  return Staff.fromJSON(response.data);
};
```

**URL Parameters**:
- `id` (required): Staff MongoDB ObjectId

**Response**: Same as staff object in Get All Staff

---

### 3. Create Staff
**Endpoint**: `POST /api/staff`

**Purpose**: Create a new staff member

**Flutter Implementation**:
```dart
Future<Staff?> createStaff(Staff staffDraft) async {
  final response = await _apiHandler.post(
    ApiEndpoints.createStaff().url,
    token: token,
    body: staffDraft.toJson(),
  );
  return Staff.fromMap(response);
}
```

**React Implementation**:
```javascript
const createStaff = async (staffDraft) => {
  const payload = staffDraft instanceof Staff ? staffDraft.toJSON() : staffDraft;
  const response = await api.post('/api/staff', payload);
  return Staff.fromJSON(response.data);
};
```

**Request Body**:
```json
{
  "name": "string (required)",
  "employeeId": "string (optional, auto-generated)",
  "email": "string (required, unique)",
  "contact": "string (required)",
  "department": "string (required)",
  "designation": "string (required)",
  "roles": ["string"],
  "status": "Active",
  "joinDate": "ISO 8601 date",
  "salary": "number",
  "gender": "string",
  "address": "string",
  "notes": {},
  "tags": []
}
```

**Response**: Created staff object with `_id`

---

### 4. Update Staff
**Endpoint**: `PUT /api/staff/:id`

**Purpose**: Update existing staff member information

**Flutter Implementation**:
```dart
Future<bool> updateStaff(Staff staffDraft) async {
  final response = await _apiHandler.put(
    ApiEndpoints.updateStaff(staffDraft.id).url,
    token: token,
    body: staffDraft.toJson(),
  );
  return response['success'] == true;
}
```

**React Implementation**:
```javascript
const updateStaff = async (staffDraft) => {
  const payload = staffDraft instanceof Staff ? staffDraft.toJSON() : staffDraft;
  const id = payload._id || payload.id;
  const response = await api.put(`/api/staff/${id}`, payload);
  return response.data.success === true;
};
```

**URL Parameters**:
- `id` (required): Staff MongoDB ObjectId

**Request Body**: Same as Create Staff

**Response Formats**:
- `{success: true, status: 200}` - Success without data
- `{staff: {...}}` - Success with updated data
- `{data: {...}}` - Success with updated data

---

### 5. Delete Staff
**Endpoint**: `DELETE /api/staff/:id`

**Purpose**: Soft delete or permanently delete a staff member

**Flutter Implementation**:
```dart
Future<bool> deleteStaff(String id) async {
  final response = await _apiHandler.delete(
    ApiEndpoints.deleteStaff(id).url,
    token: token
  );
  return response['success'] == true;
}
```

**React Implementation**:
```javascript
const deleteStaff = async (id) => {
  const response = await api.delete(`/api/staff/${id}`);
  return response.data.success === true;
};
```

**URL Parameters**:
- `id` (required): Staff MongoDB ObjectId

**Response**:
```json
{
  "success": true,
  "status": 200,
  "message": "Staff member deleted successfully"
}
```

---

## Report API Endpoints

### 6. Download Staff Report (PDF)
**Endpoint**: `GET /api/reports-proper/staff/:id`

**Purpose**: Generate and download PDF report for staff member

**Flutter Implementation**:
```dart
Future<Map<String, dynamic>> downloadStaffReport(String staffId) async {
  final url = '${ApiEndpoints.baseUrl}/reports-proper/staff/$staffId';
  final response = await http.get(url, headers: {'Authorization': 'Bearer $token'});
  
  if (response.statusCode == 200) {
    // Save file and return success
    return {'success': true, 'message': 'Report downloaded'};
  }
  return {'success': false, 'message': 'Failed to download'};
}
```

**React Implementation**:
```javascript
const downloadStaffReport = async (staffId) => {
  const url = `${baseURL}/api/reports-proper/staff/${staffId}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 200) {
    const blob = await response.blob();
    // Trigger download
    return { success: true, message: 'Report downloaded' };
  }
  return { success: false, message: 'Failed to download' };
};
```

**URL Parameters**:
- `id` (required): Staff MongoDB ObjectId

**Response**: PDF file (application/pdf)

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Staff_Report_<name>_<date>.pdf"
```

---

### 7. Download Doctor Report (PDF)
**Endpoint**: `GET /api/reports-proper/doctor/:id`

**Purpose**: Generate and download PDF report for staff members with doctor role (includes appointments and patient data)

**Flutter Implementation**:
```dart
Future<Map<String, dynamic>> downloadDoctorReport(String doctorId) async {
  final url = '${ApiEndpoints.baseUrl}/reports-proper/doctor/$doctorId';
  final response = await http.get(url, headers: {'Authorization': 'Bearer $token'});
  
  if (response.statusCode == 200) {
    return {'success': true, 'message': 'Doctor report downloaded'};
  }
  return {'success': false, 'message': 'Failed to download'};
}
```

**React Implementation**: Same as Staff Report but with `/doctor/` endpoint

**URL Parameters**:
- `id` (required): Staff/Doctor MongoDB ObjectId

**Response**: PDF file with extended doctor information

---

## Staff Model Structure

### Complete Staff Model (TypeScript/JavaScript)
```typescript
class Staff {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  contact: string;
  department: string;
  designation: string;
  roles: string[];
  status: 'Active' | 'Inactive' | 'On Leave';
  joinDate: string;
  salary?: number;
  gender?: string;
  address?: string;
  avatarUrl?: string;
  notes?: Record<string, any>;
  tags?: string[];
  patientFacingId?: string;
  createdAt?: string;
  updatedAt?: string;
  
  constructor(data: any) {
    this.id = data._id || data.id || '';
    this.name = data.name || '';
    this.employeeId = data.employeeId || data.employee_id || '';
    // ... map all fields
  }
  
  static fromJSON(json: any): Staff {
    return new Staff(json);
  }
  
  toJSON(): object {
    return {
      _id: this.id,
      name: this.name,
      employeeId: this.employeeId,
      // ... all fields
    };
  }
}
```

### Flutter Staff Model
```dart
class Staff {
  final String id;
  final String name;
  final String employeeId;
  final String email;
  final String contact;
  final String department;
  final String designation;
  final List<String> roles;
  final String status;
  final String joinDate;
  final double? salary;
  final String gender;
  final String address;
  final String avatarUrl;
  final Map<String, String> notes;
  final List<String> tags;
  final String? patientFacingId;
  
  Staff({...});
  
  factory Staff.fromMap(Map<String, dynamic> map) { ... }
  
  Map<String, dynamic> toJson() { ... }
}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "staff": { /* staff object */ }
}
```

### Error Response
```json
{
  "success": false,
  "status": 400,
  "message": "Error message",
  "error": "Detailed error information"
}
```

---

## Error Codes

| Status Code | Meaning | Common Causes |
|------------|---------|---------------|
| 200 | Success | Operation completed successfully |
| 400 | Bad Request | Invalid data format, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Staff member with given ID doesn't exist |
| 409 | Conflict | Email or employeeId already exists |
| 500 | Server Error | Database error, server malfunction |

---

## Implementation Notes

### Caching Strategy
Both Flutter and React implement client-side caching:

**Flutter**:
```dart
List<Staff> _staffList = [];
Staff? _currentStaff;

// Cache check
if (_staffList.isNotEmpty && !forceRefresh) return _staffList;
```

**React**:
```javascript
let staffCache = [];
let currentStaff = null;

// Cache check
if (staffCache.length > 0 && !forceRefresh) return staffCache;
```

### Deduplication
Both implementations deduplicate staff by ID to prevent duplicates:

**Flutter**:
```dart
List<Staff> _dedupeById(List<Staff> input) {
  final seen = <String>{};
  final out = <Staff>[];
  for (final s in input) {
    final key = (s.id.isNotEmpty) ? s.id : '\$tmp-${s.hashCode}';
    if (!seen.contains(key)) {
      seen.add(key);
      out.add(s);
    }
  }
  return out;
}
```

**React**:
```javascript
const dedupeById = (input) => {
  const seen = new Set();
  const output = [];
  for (const s of input) {
    const key = s.id || `tmp-${s.hashCode}`;
    if (!seen.has(key)) {
      seen.add(key);
      output.push(s);
    }
  }
  return output;
};
```

### Staff Code Generation
Staff codes are generated in multiple formats:
- `patientFacingId` field
- `metadata.staffCode` or `metadata.staff_code`
- Tags starting with `STF-`
- Fallback to `-` if none available

---

## Testing API Endpoints

### Using cURL

**Get All Staff**:
```bash
curl -X GET \
  https://hms-dev.onrender.com/api/staff \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Create Staff**:
```bash
curl -X POST \
  https://hms-dev.onrender.com/api/staff \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Dr. John Doe",
    "email": "john.doe@hospital.com",
    "contact": "+1234567890",
    "department": "Cardiology",
    "designation": "Cardiologist",
    "roles": ["Doctor"],
    "status": "Active"
  }'
```

**Download Report**:
```bash
curl -X GET \
  https://hms-dev.onrender.com/api/reports-proper/staff/STAFF_ID \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  --output staff_report.pdf
```

---

## Related Documentation
- [Staff Model Documentation](./STAFF_MODEL.md)
- [API Integration Guide](./API_INTEGRATION_GUIDE.md)
- [Authentication Documentation](./AUTHENTICATION.md)
- [Report Generation Guide](./REPORT_GENERATION.md)

---

## Changelog
- **2025-12-15**: Initial documentation created
- Analyzed from Flutter StaffPage.dart and Authservices.dart
- Mapped all APIs to React implementation
- Added comprehensive examples and error handling

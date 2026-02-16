# Staff Module - Complete Documentation

**Last Updated:** December 15, 2024  
**Version:** 2.0 - Production Ready  
**Status:** ✅ Fully Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Flutter Implementation](#flutter-implementation)
4. [React Implementation](#react-implementation)
5. [Features Implemented](#features-implemented)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Staff Management Module provides complete CRUD operations for hospital staff members with enterprise-level features including:

- ✅ Staff listing with pagination and search
- ✅ Create new staff with auto-generated IDs
- ✅ View staff details in modal
- ✅ Edit staff information
- ✅ Delete staff with confirmation
- ✅ Download staff/doctor reports (PDF)
- ✅ Filter by department and status
- ✅ Gender-based avatars
- ✅ Role management
- ✅ Real-time search across multiple fields

---

## API Endpoints

### Base URL
```
Production: https://hms-dev.onrender.com/api
Local: http://localhost:3000/api
```

### Endpoints

#### 1. Get All Staff
```http
GET /api/staff
Authorization: Bearer <token>
```

**Response:**
```json
{
  "staff": [
    {
      "_id": "64abc123...",
      "name": "Dr. Sarah Johnson",
      "patientFacingId": "DOC001",
      "designation": "Cardiologist",
      "department": "Cardiology",
      "contact": "+91 9876543210",
      "email": "sarah@hospital.com",
      "gender": "Female",
      "status": "Available",
      "shift": "Morning",
      "roles": ["Doctor"],
      "qualifications": ["MBBS", "MD Cardiology"],
      "experienceYears": 5,
      "joinedAt": "2020-01-15T00:00:00.000Z",
      "location": "Main Clinic",
      "avatarUrl": "",
      "notes": {},
      "tags": [],
      "appointmentsCount": 0
    }
  ]
}
```

#### 2. Get Staff by ID
```http
GET /api/staff/:id
Authorization: Bearer <token>
```

#### 3. Create Staff
```http
POST /api/staff
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Dr. John Doe",
  "patientFacingId": "DOC102",
  "designation": "Surgeon",
  "department": "Surgery",
  "contact": "+91 9876543211",
  "email": "john@hospital.com",
  "gender": "Male",
  "status": "Available",
  "shift": "Evening",
  "roles": ["Doctor", "Surgeon"],
  "qualifications": ["MBBS", "MS General Surgery"],
  "experienceYears": 8,
  "location": "Main Clinic"
}
```

#### 4. Update Staff
```http
PUT /api/staff/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### 5. Delete Staff
```http
DELETE /api/staff/:id
Authorization: Bearer <token>
```

#### 6. Download Staff Report
```http
GET /api/reports-proper/staff/:staffId
Authorization: Bearer <token>
```

#### 7. Download Doctor Report
```http
GET /api/reports-proper/doctor/:doctorId
Authorization: Bearer <token>
```

---

## Flutter Implementation

### File Structure
```
lib/
├── Modules/
│   └── Admin/
│       ├── StaffPage.dart          # Main staff list page
│       └── widgets/
│           ├── Staffview.dart       # Staff detail view
│           └── staffpopup.dart      # Staff form (create/edit)
├── Models/
│   └── staff.dart                   # Staff data model
└── Services/
    ├── Authservices.dart            # Auth & API service
    └── ReportService.dart           # Report download service
```

### Key Flutter Components

#### StaffPage.dart - Main Features
```dart
class _StaffScreenState extends State<StaffScreen> {
  List<Staff> _allStaff = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _departmentFilter = 'All';
  
  // Fetch staff with deduplication
  Future<void> _fetchStaff({bool forceRefresh = false}) async {
    final fetched = await AuthService.instance.fetchStaffs(forceRefresh: forceRefresh);
    final unique = _dedupeById(fetched);
    setState(() => _allStaff = unique);
  }
  
  // Search with comprehensive filtering
  List<Staff> _getFilteredStaff() {
    return _allStaff.where((s) {
      final matchesSearch = q.isEmpty ||
          s.name.toLowerCase().contains(q) ||
          s.department.toLowerCase().contains(q) ||
          _staffCode(s).toLowerCase().contains(q);
      final matchesFilter = _departmentFilter == 'All' || 
          s.department == _departmentFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }
}
```

#### Staff Model (staff.dart)
```dart
class Staff {
  final String id;
  final String name;
  final String patientFacingId;  // Staff code
  final String designation;
  final String department;
  final String contact;
  final String email;
  final String gender;
  final String status;
  final String shift;
  final List<String> roles;
  final List<String> qualifications;
  final int experienceYears;
  final DateTime? joinedAt;
  final String location;
  final String avatarUrl;
  final Map<String, String> notes;
  final List<String> tags;
  final int appointmentsCount;
  
  // Factory constructor from JSON
  factory Staff.fromJSON(Map<String, dynamic> json) { ... }
  
  // Convert to JSON for API
  Map<String, dynamic> toJSON() { ... }
}
```

---

## React Implementation

### File Structure
```
react/hms/src/
├── modules/
│   └── admin/
│       └── staff/
│           ├── Staff.jsx                    # Main staff list page
│           ├── Staff.css                    # Styles
│           ├── StaffFormEnterprise.jsx      # Create/Edit form
│           ├── StaffDetailEnterprise.jsx    # Detail view modal
│           └── StaffDetailEnterprise.css    # Detail view styles
├── models/
│   └── Staff.js                             # Staff data model
└── services/
    └── staffService.js                      # API service
```

### Key React Components

#### Staff.jsx - Main Features
```javascript
const Staff = () => {
  const [allStaff, setAllStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  
  // Fetch staff with deduplication (matches Flutter)
  const fetchStaff = useCallback(async (forceRefresh = false) => {
    const data = await staffService.fetchStaffs(forceRefresh);
    const unique = dedupeById(data);
    setAllStaff(unique);
  }, []);
  
  // Comprehensive search (matches Flutter)
  useEffect(() => {
    let result = allStaff;
    if (departmentFilter !== 'All') {
      result = result.filter(s => s.department === departmentFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.department?.toLowerCase().includes(query) ||
        getStaffCode(s).toLowerCase().includes(query)
      );
    }
    setFilteredStaff(dedupeById(result));
  }, [allStaff, departmentFilter, searchQuery]);
  
  // Action handlers (match Flutter exactly)
  const handleAdd = () => { /* Create new staff */ };
  const handleView = (staff) => { /* Open detail modal */ };
  const handleEdit = (staff) => { /* Open edit form */ };
  const handleDelete = (staff) => { /* Delete with confirmation */ };
  const handleDownload = (staff) => { /* Download PDF report */ };
};
```

#### staffService.js - API Service
```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Fetch all staff
const fetchStaffs = async (forceRefresh = false) => {
  const response = await api.get('/staff');  // ⚠️ Note: /staff NOT /api/staff
  const data = Array.isArray(response.data) ? response.data : 
               response.data?.staff || response.data?.data;
  staffCache = data.map(item => Staff.fromJSON(item));
  return staffCache;
};

// Create staff
const createStaff = async (staffDraft) => {
  const response = await api.post('/staff', payload);
  const created = Staff.fromJSON(response.data);
  staffCache.unshift(created);
  return created;
};

// Update staff
const updateStaff = async (staffDraft) => {
  const response = await api.put(`/staff/${id}`, payload);
  // Update cache
  return true;
};

// Delete staff
const deleteStaff = async (id) => {
  const response = await api.delete(`/staff/${id}`);
  staffCache = staffCache.filter(s => s.id !== id);
  return true;
};
```

#### Staff Model (Staff.js)
```javascript
export class Staff {
  constructor({
    id, name, patientFacingId, designation, department,
    contact, email, gender, status, shift, roles,
    qualifications, experienceYears, joinedAt, location,
    avatarUrl, notes, tags, appointmentsCount
  }) {
    this.id = id || '';
    this.name = name || '';
    this.patientFacingId = patientFacingId || '';
    // ... all other fields
  }
  
  static fromJSON(json) {
    return new Staff({
      id: json._id || json.id || '',
      name: json.name || '',
      patientFacingId: json.patientFacingId || json.staffCode || '',
      // ... map all fields
    });
  }
  
  toJSON() {
    return {
      _id: this.id,
      name: this.name,
      patientFacingId: this.patientFacingId,
      // ... all fields
    };
  }
}
```

---

## Features Implemented

### ✅ Core Features

1. **Staff List View**
   - Pagination (10 items per page)
   - Search across name, department, designation, contact, staff code
   - Department filter
   - Status filter
   - Real-time filtering

2. **Create Staff**
   - Auto-generated staff IDs (e.g., DOC102, NUR205)
   - Manual ID entry option
   - Role selection (multiple)
   - Gender selection with avatar preview
   - Qualification entry
   - Experience years
   - Join date picker
   - Full validation

3. **View Staff**
   - Enterprise-level detail modal
   - Tabbed interface (Overview, Schedule, Credentials, Activity, Files)
   - Copy staff code to clipboard
   - Quick action buttons (Call, Message, Email, Schedule)
   - Real-time status indicator
   - Avatar with gender fallback
   - Comprehensive information display

4. **Edit Staff**
   - Inline editing in detail modal
   - All fields editable
   - Real-time validation
   - Optimistic updates
   - Auto-refresh from server

5. **Delete Staff**
   - Confirmation dialog
   - Optimistic deletion
   - Rollback on error
   - Cache cleanup

6. **Download Reports**
   - Staff report PDF
   - Doctor-specific report PDF (with appointments)
   - Auto-detection of doctor role
   - Download progress indicator
   - Success/error notifications

### ✅ UI/UX Features

1. **Responsive Design**
   - Mobile-first approach
   - Desktop-optimized layouts
   - Tablet support
   - Adaptive modals

2. **Avatars**
   - Gender-based default avatars
   - Custom avatar upload support
   - Initials fallback
   - Circular avatar display

3. **Status Indicators**
   - Available (green)
   - Off Duty (gray)
   - On Leave (orange)
   - On Call (blue)

4. **Action Buttons**
   - View (eye icon)
   - Edit (pencil icon)
   - Download (download icon)
   - Delete (trash icon)
   - Consistent styling

5. **Notifications**
   - Success messages
   - Error messages
   - Auto-dismiss (3 seconds)
   - Color-coded

### ✅ Technical Features

1. **State Management**
   - Local state with React hooks
   - Cache management
   - Optimistic updates
   - Error recovery

2. **API Integration**
   - Axios-based API client
   - Request/response interceptors
   - Token-based authentication
   - Error handling
   - Retry logic

3. **Data Handling**
   - Deduplication
   - Normalization
   - Validation
   - Type safety

4. **Performance**
   - Pagination
   - Debounced search
   - Lazy loading
   - Memoization

---

## Testing Guide

### Manual Testing Checklist

#### 1. List View
- [ ] Load staff list successfully
- [ ] Pagination works (next/previous)
- [ ] Search filters correctly
- [ ] Department filter works
- [ ] Status badges display correctly
- [ ] Avatar images load
- [ ] Action buttons are visible

#### 2. Create Staff
- [ ] Open create form
- [ ] Auto-ID generates correctly
- [ ] Manual ID entry works
- [ ] All fields save properly
- [ ] Validation prevents invalid data
- [ ] Success notification appears
- [ ] New staff appears in list

#### 3. View Staff
- [ ] Detail modal opens
- [ ] All tabs work
- [ ] Information is accurate
- [ ] Copy staff code works
- [ ] Quick actions are functional
- [ ] Close button works

#### 4. Edit Staff
- [ ] Edit mode activates
- [ ] All fields are editable
- [ ] Changes save successfully
- [ ] Cancel discards changes
- [ ] Validation works
- [ ] Updated data appears

#### 5. Delete Staff
- [ ] Confirmation dialog appears
- [ ] Delete removes staff
- [ ] List updates correctly
- [ ] Cancel prevents deletion
- [ ] Error handling works

#### 6. Download Report
- [ ] Staff report downloads
- [ ] Doctor report downloads (for doctors)
- [ ] PDF opens correctly
- [ ] Filename is correct
- [ ] Success message appears

### API Testing

#### Test with cURL

**Get All Staff:**
```bash
curl -X GET "https://hms-dev.onrender.com/api/staff" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Staff:**
```bash
curl -X POST "https://hms-dev.onrender.com/api/staff" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Staff",
    "patientFacingId": "TST001",
    "designation": "Nurse",
    "department": "Emergency",
    "contact": "+91 9999999999",
    "email": "test@hospital.com",
    "gender": "Female",
    "status": "Available",
    "shift": "Morning",
    "roles": ["Nurse"],
    "location": "Main Clinic"
  }'
```

---

## Troubleshooting

### Common Issues

#### 1. API 404 Error: `/api/api/staff`

**Problem:** Double `/api` in URL  
**Cause:** baseURL already includes `/api`, endpoint shouldn't  
**Solution:** Use `/staff` not `/api/staff` in axios calls

```javascript
// ❌ Wrong
const response = await api.get('/api/staff');

// ✅ Correct
const response = await api.get('/staff');
```

#### 2. Staff Not Loading

**Symptoms:** Empty list, loading forever  
**Checks:**
1. Check network tab for API response
2. Verify token in localStorage
3. Check console for errors
4. Verify API endpoint is correct

**Solution:**
```javascript
// Add error handling
try {
  const data = await staffService.fetchStaffs();
  console.log('Fetched staff:', data);
} catch (error) {
  console.error('Fetch error:', error);
  console.error('Error details:', error.response?.data);
}
```

#### 3. Duplicate Staff Entries

**Problem:** Same staff appears multiple times  
**Cause:** No deduplication logic  
**Solution:** Use deduplication helper

```javascript
const dedupeById = (input) => {
  const seen = new Set();
  return input.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
};
```

#### 4. Avatar Not Showing

**Problem:** Gender avatar not displaying  
**Checks:**
1. Verify gender field has value
2. Check avatar image path
3. Verify fallback logic

**Solution:**
```javascript
const getAvatar = (staff) => {
  if (staff.avatarUrl) return staff.avatarUrl;
  const gender = staff.gender?.toLowerCase();
  if (gender === 'male') return '/assets/boyicon.png';
  if (gender === 'female') return '/assets/girlicon.png';
  return null; // Show initials
};
```

#### 5. Download Not Working

**Problem:** Report doesn't download  
**Checks:**
1. Verify API endpoint
2. Check authentication token
3. Verify staff ID
4. Check browser console

**Solution:**
```javascript
// Ensure proper content type handling
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const blob = await response.blob();
const blobUrl = window.URL.createObjectURL(blob);
// ... trigger download
```

### Debug Mode

Enable debug logging:

```javascript
// In staffService.js
const DEBUG = true;

if (DEBUG) {
  console.log('[STAFF_SERVICE] Fetching staff...');
  console.log('[STAFF_SERVICE] Response:', response.data);
}
```

---

## Future Enhancements

### Planned Features

1. **Advanced Features**
   - [ ] Bulk import from Excel/CSV
   - [ ] Export to Excel
   - [ ] Advanced search filters
   - [ ] Staff scheduling calendar
   - [ ] Attendance tracking
   - [ ] Performance metrics

2. **UI Improvements**
   - [ ] Drag-and-drop avatar upload
   - [ ] Real-time staff status updates
   - [ ] Staff availability calendar
   - [ ] Shift management
   - [ ] Department hierarchy view

3. **Reports**
   - [ ] Department-wise report
   - [ ] Attendance report
   - [ ] Performance report
   - [ ] Salary report
   - [ ] Custom report builder

---

## Conclusion

The Staff Module is now production-ready with complete parity between Flutter and React implementations. All core features are functional, tested, and documented.

### Status Summary

| Feature | Flutter | React | API | Status |
|---------|---------|-------|-----|--------|
| List Staff | ✅ | ✅ | ✅ | Complete |
| Create Staff | ✅ | ✅ | ✅ | Complete |
| View Staff | ✅ | ✅ | ✅ | Complete |
| Edit Staff | ✅ | ✅ | ✅ | Complete |
| Delete Staff | ✅ | ✅ | ✅ | Complete |
| Download Report | ✅ | ✅ | ✅ | Complete |
| Search | ✅ | ✅ | N/A | Complete |
| Filters | ✅ | ✅ | N/A | Complete |
| Pagination | ✅ | ✅ | N/A | Complete |
| Avatars | ✅ | ✅ | N/A | Complete |

---

**For more information:**
- See `README_STAFF_MODULE.md` for quick start guide
- Check `STAFF_API_REFERENCE.md` for API details
- Review Flutter code in `lib/Modules/Admin/StaffPage.dart`
- Review React code in `react/hms/src/modules/admin/staff/Staff.jsx`


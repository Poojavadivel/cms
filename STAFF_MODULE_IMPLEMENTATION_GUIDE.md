# Staff Module - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Flutter Reference Implementation](#flutter-reference-implementation)
3. [React Implementation](#react-implementation)
4. [API Integration](#api-integration)
5. [Features Checklist](#features-checklist)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

## Overview

The Staff Module is a complete CRUD system for managing hospital staff members including doctors, nurses, technicians, and administrative staff. It provides:

- Staff listing with pagination and search
- Create/Update/Delete operations
- Detailed staff profiles
- Department and role management
- Report generation (PDF downloads)
- Gender-based avatar system
- Status tracking (Available, On Leave, etc.)

## Flutter Reference Implementation

### File Structure
```
lib/
├── Modules/
│   └── Admin/
│       ├── StaffPage.dart          # Main list page
│       └── widgets/
│           ├── staffpopup.dart     # Create/Edit form
│           └── Staffview.dart      # Detail view
├── Models/
│   └── staff.dart                  # Staff model
└── Services/
    └── Authservices.dart           # API calls
```

### Key Features from Flutter

#### 1. Staff Code Logic (Multiple Fallbacks)
```dart
String _staffCode(Staff s) {
  // 1. Try patientFacingId
  final pf = (s.patientFacingId ?? '').toString().trim();
  if (pf.isNotEmpty) return pf;

  // 2. Try notes metadata
  try {
    final notes = s.notes;
    if (notes != null && notes.isNotEmpty) {
      final v1 = notes['staffCode'] ?? notes['staff_code'] ?? 
                 notes['code'] ?? notes['patientFacingId'];
      if (v1 != null && v1.toString().trim().isNotEmpty) 
        return v1.toString().trim();
    }
  } catch (_) {}

  // 3. Try tags
  if (s.tags.isNotEmpty) {
    final maybe = s.tags.firstWhere(
      (t) => t.startsWith('STF-') || t.startsWith('STF'), 
      orElse: () => ''
    );
    if (maybe.isNotEmpty) return maybe;
  }

  return '-';
}
```

#### 2. Gender-Based Avatars
```dart
Widget _smallAvatarForList(Staff s, {double size = 28}) {
  // 1. Try network avatar
  if (s.avatarUrl.isNotEmpty) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(size / 2),
      child: Image.network(
        s.avatarUrl, 
        width: size, 
        height: size, 
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _genderAssetOrInitials(s, size)
      ),
    );
  }
  
  return _genderAssetOrInitials(s, size);
}

Widget _genderAssetOrInitials(Staff s, double size) {
  final gender = (s.gender ?? '').toLowerCase();
  
  // 2. Try gender-specific assets
  if (gender == 'male' || gender == 'm') {
    return Image.asset('assets/boyicon.png', width: size, height: size);
  } else if (gender == 'female' || gender == 'f') {
    return Image.asset('assets/girlicon.png', width: size, height: size);
  }

  // 3. Fallback to initials
  final initials = s.name.trim()
    .split(RegExp(r'\s+'))
    .where((p) => p.isNotEmpty)
    .map((p) => p[0])
    .take(2)
    .join()
    .toUpperCase();
    
  return Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: Colors.grey.shade200, 
      borderRadius: BorderRadius.circular(size / 2)
    ),
    alignment: Alignment.center,
    child: Text(initials.isEmpty ? '-' : initials),
  );
}
```

#### 3. Deduplication Strategy
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

#### 4. Optimistic Updates Pattern
```dart
// Create
Future<void> _onAddPressed() async {
  try {
    final created = await showStaffFormPopup(context);
    if (created == null) return;

    // Optimistic insert
    setState(() {
      final idx = _allStaff.indexWhere((s) => s.id == created.id);
      if (idx == -1) {
        _allStaff.insert(0, created);
      } else {
        _allStaff[idx] = created;
      }
    });

    // Resync if temp id
    if (created.id.startsWith('temp-')) {
      await _fetchStaff(forceRefresh: true);
    }
  } catch (e) {
    // Error handling
  }
}

// Update
Future<void> _onEdit(int index, List<Staff> list) async {
  final original = list[index];
  
  try {
    final updated = await showStaffFormPopup(context, initial: original);
    if (updated == null) return;

    // Optimistic update
    setState(() {
      final idx = _allStaff.indexWhere((s) => s.id == original.id);
      if (idx != -1) {
        _allStaff[idx] = updated;
      }
    });

    // Fetch authoritative data
    if (!updated.id.startsWith('temp-')) {
      final fresh = await AuthService.instance.fetchStaffById(updated.id);
      setState(() {
        final i = _allStaff.indexWhere((s) => s.id == updated.id);
        if (i != -1) _allStaff[i] = fresh;
      });
    }
  } catch (e) {
    // Revert on error
    setState(() {
      final idx = _allStaff.indexWhere((s) => s.id == original.id);
      if (idx != -1) _allStaff[idx] = original;
    });
  }
}

// Delete
Future<void> _onDelete(int index, List<Staff> list) async {
  final staffMember = list[index];
  
  // Confirm
  final confirm = await showDialog<bool>(/*...*/);
  if (confirm != true) return;

  // Optimistic delete
  final removedIndex = _allStaff.indexWhere((s) => s.id == staffMember.id);
  Staff? removed;
  if (removedIndex != -1) {
    removed = _allStaff.removeAt(removedIndex);
    setState(() {});
  }

  try {
    final ok = await AuthService.instance.deleteStaff(staffMember.id);
    if (!ok) {
      // Revert on failure
      if (removed != null) {
        setState(() => _allStaff.insert(removedIndex, removed!));
      }
    }
  } catch (e) {
    // Revert on error
    if (removed != null) {
      setState(() => _allStaff.insert(removedIndex, removed!));
    }
  }
}
```

#### 5. Report Download (Role-Based)
```dart
Future<void> _onDownloadReport(int index, List<Staff> list) async {
  final staffMember = list[index];
  
  // Check if doctor
  final isDoctor = staffMember.roles.any((role) => role.toLowerCase() == 'doctor') ||
                   staffMember.designation.toLowerCase().contains('doctor');
  
  setState(() => _isDownloading = true);
  
  try {
    Map<String, dynamic> result;
    
    if (isDoctor) {
      result = await _reportService.downloadDoctorReport(staffMember.id);
    } else {
      result = await _reportService.downloadStaffReport(staffMember.id);
    }
    
    if (result['success'] == true) {
      // Show success
    } else {
      // Show error
    }
  } finally {
    setState(() => _isDownloading = false);
  }
}
```

## React Implementation

### File Structure
```
src/
├── modules/
│   └── admin/
│       └── staff/
│           ├── Staff.jsx                    # Main list component
│           ├── Staff.css                    # Styling (no duplicates!)
│           ├── StaffFormEnterprise.jsx      # Create/Edit form
│           ├── StaffDetailEnterprise.jsx    # Detail view
│           └── StaffDetailEnterprise.css    # Detail styling
├── models/
│   └── Staff.js                            # Staff model
├── services/
│   └── staffService.js                     # API service
└── docs/
    ├── STAFF_MODULE_API.md                 # API documentation
    └── STAFF_MODULE_IMPLEMENTATION_GUIDE.md # This file
```

### Key Implementation Details

#### 1. Staff Code Logic (React)
```javascript
const getStaffCode = (staff) => {
  // 1. Try patientFacingId
  if (staff.patientFacingId && staff.patientFacingId.trim()) {
    return staff.patientFacingId.trim();
  }
  
  // 2. Try notes
  if (staff.notes) {
    const code = staff.notes.staffCode || staff.notes.staff_code || 
                 staff.notes.code || staff.notes.patientFacingId;
    if (code && code.trim()) return code.trim();
  }
  
  // 3. Try tags
  if (staff.tags && staff.tags.length > 0) {
    const codeTag = staff.tags.find(t => 
      t.startsWith('STF-') || t.startsWith('STF')
    );
    if (codeTag) return codeTag;
  }
  
  return '-';
};
```

#### 2. Gender-Based Avatars (React)
```javascript
const getAvatarSrc = (staff) => {
  // 1. Try network avatar
  if (staff.avatarUrl) return staff.avatarUrl;
  
  // 2. Try gender-specific assets
  const gender = staff.gender?.toLowerCase() || '';
  if (gender === 'male' || gender === 'm') return '/boyicon.png';
  if (gender === 'female' || gender === 'f') return '/girlicon.png';
  
  // 3. Default fallback
  return '/boyicon.png';
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim()
    .split(/\s+/)
    .filter(p => p)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

// Usage in JSX
<img 
  src={getAvatarSrc(staff)} 
  alt={staff.name}
  className="patient-avatar"
  onError={(e) => {
    e.target.src = '/boyicon.png'; // Fallback
  }}
/>
```

#### 3. Deduplication (React)
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

// Apply after fetching and filtering
useEffect(() => {
  let result = allStaff;
  // ... filters ...
  setFilteredStaff(dedupeById(result));
}, [allStaff, filters]);
```

#### 4. Optimistic Updates (React)
```javascript
// Create
const handleFormSubmit = async (formData) => {
  try {
    if (formMode === 'create') {
      const created = await staffService.createStaff(formData);
      
      // Optimistic insert
      setAllStaff(prev => {
        const idx = prev.findIndex(s => s.id === created.id);
        if (idx === -1) {
          return [created, ...prev];
        } else {
          const copy = [...prev];
          copy[idx] = created;
          return copy;
        }
      });

      // Resync if temp id
      if (created.id?.startsWith('temp-')) {
        await fetchStaff(true);
      }

      showNotification('Staff created successfully', 'success');
    }
  } catch (error) {
    showNotification(`Failed: ${error.message}`, 'error');
    await fetchStaff(true); // Revert
  }
};

// Delete with rollback
const handleDelete = async (staff, index) => {
  const confirmed = window.confirm(`Delete ${staff.name}?`);
  if (!confirmed) return;

  // Optimistic delete
  const removedIndex = allStaff.findIndex(s => s.id === staff.id);
  let removed = null;
  if (removedIndex !== -1) {
    removed = allStaff[removedIndex];
    setAllStaff(prev => prev.filter(s => s.id !== staff.id));
  }

  setIsLoading(true);
  try {
    const ok = await staffService.deleteStaff(staff.id);
    if (ok) {
      showNotification(`Deleted ${staff.name}`, 'success');
    } else {
      // Revert on failure
      if (removed) {
        setAllStaff(prev => {
          const copy = [...prev];
          copy.splice(removedIndex, 0, removed);
          return copy;
        });
      }
      showNotification('Delete failed', 'error');
    }
  } catch (error) {
    // Revert on error
    if (removed) {
      setAllStaff(prev => {
        const copy = [...prev];
        copy.splice(removedIndex, 0, removed);
        return copy;
      });
    }
    showNotification(`Delete failed: ${error.message}`, 'error');
  } finally {
    setIsLoading(false);
  }
};
```

#### 5. Report Download (React)
```javascript
const handleDownload = async (staff, index) => {
  if (isDownloading) return;

  // Check if doctor (Flutter pattern)
  const isDoctor = staff.roles?.some(role => role.toLowerCase() === 'doctor') ||
                   staff.designation?.toLowerCase().includes('doctor');

  setIsDownloading(true);
  try {
    let result;
    if (isDoctor) {
      result = await staffService.downloadDoctorReport(staff.id);
    } else {
      result = await staffService.downloadStaffReport(staff.id);
    }

    if (result.success) {
      showNotification(result.message || 'Report downloaded successfully', 'success');
    } else {
      showNotification(result.message || 'Failed to download report', 'error');
    }
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    setIsDownloading(false);
  }
};
```

## API Integration

### API Endpoints (Corrected)
```javascript
// Base URL: https://hms-dev.onrender.com/api
// Endpoints use relative paths from baseURL

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Fetch all staff
// Full URL: https://hms-dev.onrender.com/api/staff
const response = await api.get('/staff');

// Fetch by ID
// Full URL: https://hms-dev.onrender.com/api/staff/12345
const response = await api.get(`/staff/${id}`);

// Create
// Full URL: https://hms-dev.onrender.com/api/staff
const response = await api.post('/staff', payload);

// Update
// Full URL: https://hms-dev.onrender.com/api/staff/12345
const response = await api.put(`/staff/${id}`, payload);

// Delete
// Full URL: https://hms-dev.onrender.com/api/staff/12345
const response = await api.delete(`/staff/${id}`);
```

### Important: NO Duplicate `/api` in URLs
❌ **WRONG:** `await api.get('/api/staff')` → Results in `/api/api/staff`
✅ **CORRECT:** `await api.get('/staff')` → Results in `/api/staff`

## Features Checklist

### ✅ Completed Features
- [x] Staff listing with pagination
- [x] Search functionality (name, ID, department, designation, contact, code)
- [x] Department filter
- [x] Status filter (Active, Inactive)
- [x] Create staff member
- [x] Update staff member
- [x] Delete staff member
- [x] View staff details
- [x] Download staff reports (PDF)
- [x] Download doctor reports (PDF)
- [x] Gender-based avatars with fallback
- [x] Staff code with multiple fallback logic
- [x] Deduplication to prevent duplicates
- [x] Optimistic updates for better UX
- [x] Error handling with rollback
- [x] Caching to reduce API calls
- [x] Loading states
- [x] Toast notifications
- [x] Responsive design
- [x] Hide scrollbars
- [x] Action buttons (View, Edit, Delete, Download)

### 🔄 Enhancements Needed
- [ ] Advanced filters (role, qualification, experience)
- [ ] Bulk operations (import/export CSV)
- [ ] Staff scheduling
- [ ] Attendance tracking
- [ ] Performance reviews
- [ ] Document management
- [ ] Real-time updates via WebSocket
- [ ] Offline mode support
- [ ] Print preview for reports
- [ ] Email reports
- [ ] Audit log viewing

## Testing Guide

### Unit Tests
```javascript
// staffService.test.js
describe('Staff Service', () => {
  test('fetches all staff', async () => {
    const staff = await staffService.fetchStaffs();
    expect(Array.isArray(staff)).toBe(true);
  });

  test('handles duplicate response formats', async () => {
    // Test array response
    // Test wrapped response
    // Test data key response
  });

  test('deduplicates staff by ID', () => {
    const input = [
      { id: '1', name: 'John' },
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' }
    ];
    const result = dedupeById(input);
    expect(result.length).toBe(2);
  });
});
```

### Integration Tests
1. Create staff member → Verify in list
2. Update staff member → Verify changes persist
3. Delete staff member → Verify removal
4. Search functionality → Verify results
5. Pagination → Verify page navigation
6. Download report → Verify PDF download

### Manual Testing Checklist
- [ ] Create staff with all fields
- [ ] Create staff with minimal fields
- [ ] Update existing staff
- [ ] Delete staff with confirmation
- [ ] Search by name
- [ ] Search by employee ID
- [ ] Search by department
- [ ] Filter by department
- [ ] Filter by status
- [ ] Clear all filters
- [ ] Navigate through pages
- [ ] View staff details
- [ ] Download staff report
- [ ] Download doctor report
- [ ] Test avatar fallbacks (no URL, male, female)
- [ ] Test on mobile viewport
- [ ] Test with no data
- [ ] Test with large dataset (100+ records)
- [ ] Test error scenarios (network failure, invalid data)

## Troubleshooting

### Issue: 404 Error `/api/api/staff`
**Cause:** Double `/api` in URL
**Solution:** Ensure endpoints use `/staff` not `/api/staff` when baseURL already includes `/api`

### Issue: Horizontal Scroll Bar Visible
**Cause:** Table or content overflowing
**Solution:** 
```css
.modern-table-wrapper {
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modern-table-wrapper::-webkit-scrollbar {
  display: none;
}
```

### Issue: Action Buttons Overflow
**Cause:** Too many buttons, not enough space
**Solution:**
```css
.action-buttons-group {
  gap: 2px !important;
  max-width: 110px !important;
}

.btn-action {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
}
```

### Issue: Duplicate Staff Entries
**Cause:** Same staff appears multiple times
**Solution:** Apply deduplication after fetch and filters
```javascript
setFilteredStaff(dedupeById(result));
```

### Issue: Staff Code Shows `-`
**Cause:** Multiple fields need to be checked
**Solution:** Implement fallback logic (patientFacingId → notes → tags)

### Issue: Avatar Not Loading
**Cause:** URL invalid or network issue
**Solution:** Implement onError fallback
```javascript
<img 
  src={avatarSrc}
  onError={(e) => { e.target.src = '/boyicon.png'; }}
/>
```

### Issue: Report Download Not Working
**Cause:** Authentication or endpoint issue
**Solution:** 
1. Verify token is being sent
2. Check endpoint URL is correct
3. Verify response is binary PDF
4. Check Content-Disposition header

## Performance Optimization

### Caching Strategy
```javascript
// Module-level cache
let staffCache = [];

const fetchStaffs = async (forceRefresh = false) => {
  if (staffCache.length > 0 && !forceRefresh) {
    return staffCache;
  }
  
  const response = await api.get('/staff');
  staffCache = response.data.map(item => Staff.fromJSON(item));
  return staffCache;
};
```

### Pagination Best Practices
- Always paginate on backend for large datasets
- Client-side pagination acceptable for <1000 records
- Consider infinite scroll for mobile

### Search Optimization
- Debounce search input (300ms)
- Consider backend search for large datasets
- Index searchable fields

## Migration Checklist

From Flutter to React:
- [x] Port Staff model
- [x] Port API service
- [x] Port list component
- [x] Port form component
- [x] Port detail component
- [x] Match styling/design
- [x] Implement same features
- [x] Test all CRUD operations
- [x] Test report downloads
- [x] Document everything

## Next Steps

1. **Pathology Module** - Similar implementation pattern
2. **Advanced Filters** - Add more filter options
3. **Bulk Operations** - Import/export functionality
4. **Staff Scheduling** - Integrate calendar
5. **Attendance System** - Track staff attendance
6. **Performance Reviews** - Annual review system

## References

- Flutter Code: `/lib/Modules/Admin/StaffPage.dart`
- React Code: `/react/hms/src/modules/admin/staff/Staff.jsx`
- API Docs: `/docs/STAFF_MODULE_API.md`
- Server: `https://hms-dev.onrender.com`

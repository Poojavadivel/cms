# Staff Module - Quick Reference Guide

## 🚀 Quick Start

### Running the Application
```bash
cd react/hms
npm install
npm start
```

### Access Staff Module
```
URL: http://localhost:3000/admin/staff
Login Required: Yes
Role Required: Admin
```

---

## 🔌 API Endpoints

### Base URL
```
https://hms-dev.onrender.com
```

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff` | Fetch all staff |
| GET | `/api/staff/:id` | Fetch one staff |
| POST | `/api/staff` | Create staff |
| PUT | `/api/staff/:id` | Update staff |
| DELETE | `/api/staff/:id` | Delete staff |
| GET | `/api/reports-proper/staff/:id` | Staff report |
| GET | `/api/reports-proper/doctor/:id` | Doctor report |

### Authentication
```javascript
// Headers automatically added by axios interceptor
Authorization: `Bearer ${token}`
```

---

## 📦 Key Components

### Staff.jsx (Main List)
```javascript
import Staff from './modules/admin/staff/Staff';

// Props: None (standalone)
<Staff />
```

### StaffFormEnterprise.jsx (Create/Edit Form)
```javascript
import StaffFormEnterprise from './modules/admin/staff/StaffFormEnterprise';

<StaffFormEnterprise
  initial={staff}        // null for create, staff object for edit
  onSubmit={handleSave}  // Callback after save
  onCancel={handleClose} // Callback on cancel
/>
```

### StaffDetailEnterprise.jsx (Detail View)
```javascript
import StaffDetailEnterprise from './modules/admin/staff/StaffDetailEnterprise';

<StaffDetailEnterprise
  staffId={staff.id}     // Required
  initial={staff}        // Optional for faster load
  onClose={handleClose}  // Callback on close
  onUpdate={handleEdit}  // Callback to enter edit mode
/>
```

---

## 🎨 Styling

### Colors
```css
--primary: #2663FF        /* Buttons, links */
--secondary: #28C76F      /* Success states */
--accent-yellow: #F4B400  /* Warnings */
--accent-red: #FF5A5F     /* Errors, delete */

--bg-page: #F7F9FC        /* Page background */
--bg-card: #FFFFFF        /* Card background */
--text-title: #1E293B     /* Headings */
--text-body: #334155      /* Body text */
--text-muted: #64748B     /* Secondary text */
```

### Status Colors
```javascript
Available    → Green (#22C55E)
On Leave     → Yellow (#F4B400)
Off Duty     → Gray (#6B7280)
Busy         → Blue (#3B82F6)
```

### Responsive Breakpoints
```css
Mobile:  < 768px
Tablet:  768px - 1199px
Desktop: ≥ 1200px
```

---

## 📝 Data Model

### Staff Object Structure
```typescript
interface Staff {
  // Identity
  id: string;
  patientFacingId: string;  // Staff code (e.g., "DOC101")
  
  // Personal Info
  name: string;
  email: string;
  contact: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dob?: string;
  avatarUrl?: string;
  
  // Professional Info
  designation: string;      // e.g., "Doctor", "Nurse"
  department: string;       // e.g., "Cardiology"
  qualifications: string[];
  experienceYears: number;
  
  // Employment
  status: 'Available' | 'On Leave' | 'Off Duty' | 'Busy';
  shift: 'Morning' | 'Evening' | 'Night' | 'Rotational';
  roles: string[];          // e.g., ["Doctor", "Admin"]
  location: string;
  joinedAt?: Date;
  lastActiveAt?: Date;
  
  // Additional
  notes: { [key: string]: string };
  tags: string[];
  appointmentsCount?: number;
}
```

---

## 🛠️ Common Operations

### Create New Staff
```javascript
const newStaff = {
  name: 'Dr. John Doe',
  email: 'john@hospital.com',
  contact: '+91 9876543210',
  gender: 'Male',
  designation: 'Cardiologist',
  department: 'Cardiology',
  status: 'Available',
  shift: 'Morning',
  roles: ['Doctor'],
  qualifications: ['MBBS', 'MD Cardiology'],
  experienceYears: 10
};

await staffService.createStaff(newStaff);
```

### Update Staff
```javascript
const updated = {
  ...existingStaff,
  status: 'On Leave',
  shift: 'Evening'
};

await staffService.updateStaff(updated);
```

### Search Staff
```javascript
// Client-side search (already implemented)
const filtered = allStaff.filter(s =>
  s.name.toLowerCase().includes(query) ||
  s.department.toLowerCase().includes(query) ||
  s.designation.toLowerCase().includes(query)
);
```

### Download Report
```javascript
// For doctors
if (staff.roles.includes('Doctor')) {
  await staffService.downloadDoctorReport(staff.id);
} else {
  await staffService.downloadStaffReport(staff.id);
}
```

---

## 🐛 Common Issues & Solutions

### Issue: 404 on /api/staff
**Solution**: Base URL should NOT end with /api
```javascript
// ❌ Wrong
baseURL: 'https://hms-dev.onrender.com/api'

// ✅ Correct
baseURL: 'https://hms-dev.onrender.com'
```

### Issue: Horizontal scrollbar appears
**Solution**: Already fixed in CSS
```css
.modern-table-wrapper {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modern-table-wrapper::-webkit-scrollbar {
  display: none;
}
```

### Issue: Action buttons cut off
**Solution**: Column widths already optimized
```javascript
// Total should be 100%
Staff Code: 16%
Staff Name: 18%
Designation: 14%
Department: 14%
Contact: 14%
Status: 10%
Actions: 14%
```

### Issue: Avatar not showing
**Solution**: Check gender field and fallback
```javascript
const getAvatarSrc = (staff) => {
  if (staff.avatarUrl) return staff.avatarUrl;
  
  const gender = staff.gender?.toLowerCase();
  if (gender === 'male' || gender === 'm') return '/boyicon.png';
  if (gender === 'female' || gender === 'f') return '/girlicon.png';
  
  return '/boyicon.png'; // Default fallback
};
```

---

## 📊 Performance Tips

### Optimize Re-renders
```javascript
// Use useCallback for handlers
const handleEdit = useCallback((staff) => {
  // ...
}, [dependencies]);

// Memoize filtered data
const filteredStaff = useMemo(() => {
  return allStaff.filter(/* ... */);
}, [allStaff, searchQuery, filters]);
```

### Reduce API Calls
```javascript
// Cache in staffService
let staffCache = [];

const fetchStaffs = async (forceRefresh = false) => {
  if (staffCache.length > 0 && !forceRefresh) {
    return staffCache;
  }
  // Fetch from API
};
```

### Lazy Load Components
```javascript
const StaffDetailEnterprise = React.lazy(() => 
  import('./modules/admin/staff/StaffDetailEnterprise')
);

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <StaffDetailEnterprise />
</Suspense>
```

---

## 🔐 Security Checklist

- [x] Auth token required for all API calls
- [x] Token stored in localStorage
- [x] Interceptor adds token to requests
- [x] 401 errors handled (redirect to login)
- [x] Input validation on forms
- [x] XSS prevention (React auto-escapes)
- [x] No sensitive data in console logs (prod)

---

## 📱 Responsive Behavior

### Desktop (>1200px)
- Full table visible
- Modals 95% width, centered
- All columns show
- Hover effects enabled

### Tablet (768-1199px)
- Table horizontal scroll allowed
- Modals 90% width
- Touch-friendly targets (44x44px min)
- Reduced animations

### Mobile (<768px)
- Full-screen modals
- Single-column forms
- Large touch targets
- Simplified navigation

---

## 🎯 Key Features

### ✅ Implemented
- CRUD operations (Create, Read, Update, Delete)
- Real-time search
- Multi-filter (department, status)
- Pagination (10 per page)
- Optimistic UI updates
- Gender-based avatars
- Status badges
- Report downloads (staff & doctor)
- Inline editing
- Form validation
- Error handling
- Loading states
- Success notifications
- Responsive design
- Accessibility support

### 🚧 Future Enhancements
- Bulk operations
- Export to Excel/CSV
- Advanced analytics
- Attendance tracking
- Schedule integration
- Email/SMS notifications
- Performance reviews
- Document uploads

---

## 📞 Support

### Documentation
- Full Guide: `docs/STAFF_IMPLEMENTATION_COMPLETE.md`
- Changes Log: `docs/CHANGES_SUMMARY_2024-12-15.md`
- Testing Guide: `docs/TESTING_GUIDE.md`
- This Guide: `docs/QUICK_REFERENCE.md`

### Code Locations
```
react/hms/src/
├── models/Staff.js
├── services/staffService.js
└── modules/admin/staff/
    ├── Staff.jsx
    ├── Staff.css
    ├── StaffFormEnterprise.jsx
    ├── StaffDetailEnterprise.jsx
    └── StaffDetailEnterprise.css
```

### Need Help?
1. Check this guide first
2. Review full documentation
3. Search codebase for examples
4. Check console for errors
5. Contact development team

---

## 🎉 Quick Wins

### Customization
```javascript
// Change items per page
const itemsPerPage = 20; // Default: 10

// Add new filter
const [roleFilter, setRoleFilter] = useState('All');

// Change status options
const statuses = ['Available', 'On Leave', 'Off Duty', 'Busy', 'Inactive'];
```

### Theming
```css
/* Change primary color */
:root {
  --primary: #YOUR_COLOR;
  --primary-hover: #YOUR_COLOR_DARKER;
}
```

### Localization
```javascript
// Add language strings
const strings = {
  title: 'Staff Management',
  addButton: '+ New Staff Member',
  searchPlaceholder: 'Search...'
};
```

---

Last Updated: December 15, 2024
Version: 1.0.0
Status: Production Ready ✅

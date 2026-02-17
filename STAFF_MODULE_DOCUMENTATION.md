# Staff Module - Complete Documentation

## Overview
The Staff Module is a comprehensive staff management system built with React that mirrors the Flutter implementation. It provides complete CRUD operations, advanced filtering, search, pagination, and report generation.

## Features

### 1. **Staff List View** (`Staff.jsx`)
- **Display**: Shows all staff members in a clean, modern table
- **Search**: Real-time search across name, ID, department, designation, contact, and staff code
- **Filters**: 
  - Status filter (All, Active, Inactive, On Leave)
  - Department filter (dropdown with all unique departments)
  - Advanced filters panel
- **Pagination**: 10 items per page with previous/next navigation
- **Actions**: View, Edit, Delete, Download Report buttons for each staff
- **Staff Code Column**: Displays avatar + unique staff code (with fallback logic)
- **Deduplication**: Prevents duplicate staff entries

### 2. **Staff Form** (`StaffFormEnterprise.jsx`)
- **Multi-Step Form**: 4 progressive steps
  - Step 1: Personal Information (name, email, contact, gender, DOB, photo)
  - Step 2: Professional Information (staff ID, designation, department, qualifications)
  - Step 3: Employment Details (join date, shift, status, location)
  - Step 4: Additional Information (roles, emergency contact, address, notes)
- **Validation**: Real-time field validation with error messages
- **Image Upload**: Profile picture upload with preview
- **Responsive**: Adapts to mobile, tablet, and desktop screens
- **Modern UI**: Clean indigo color scheme, smooth animations

### 3. **Staff Detail View** (`StaffDetailEnterprise.jsx`)
- **Header**: Avatar, name, designation, department, status badge
- **Action Buttons**: Call, Message, Email, Schedule
- **5 Tabs**:
  - Overview: Complete staff information
  - Schedule: Work schedule (coming soon)
  - Credentials: Login and access details
  - Activity: Activity log
  - Files: Document management
- **Edit Mode**: Inline editing with save functionality
- **Responsive**: Fullscreen on mobile, modal on desktop

### 4. **API Integration** (`staffService.js`)
Complete API service with:
- `fetchStaffs()` - Get all staff (with caching)
- `fetchStaffById(id)` - Get single staff
- `createStaff(data)` - Create new staff
- `updateStaff(data)` - Update existing staff
- `deleteStaff(id)` - Delete staff
- `downloadStaffReport(id)` - Download staff PDF report
- `downloadDoctorReport(id)` - Download doctor-specific report
- Token-based authentication
- Error logging

## API Endpoints

### Base URL
```
https://hms-dev.onrender.com/api
```

### Endpoints

#### GET /staff
Fetch all staff members
```javascript
Response: Array<Staff> or { staff: Array<Staff> }
```

#### GET /staff/:id
Fetch single staff by ID
```javascript
Response: Staff object or { staff: Staff }
```

#### POST /staff
Create new staff member
```javascript
Body: Staff object
Response: Created Staff object
```

#### PUT /staff/:id
Update existing staff
```javascript
Body: Updated Staff object
Response: { success: true } or Updated Staff object
```

#### DELETE /staff/:id
Delete staff member
```javascript
Response: { success: true, status: 200 }
```

#### GET /reports-proper/staff/:id
Download staff report PDF
```javascript
Response: PDF file (Content-Type: application/pdf)
```

#### GET /reports-proper/doctor/:doctorId
Download doctor report PDF (includes appointments, patients)
```javascript
Response: PDF file (Content-Type: application/pdf)
```

## Data Model

### Staff Object
```javascript
{
  id: String,                    // Unique identifier
  name: String,                  // Full name
  email: String,                 // Email address
  contact: String,               // Phone number
  gender: String,                // Male/Female/Other
  dob: String,                   // Date of birth (ISO)
  avatarUrl: String,             // Profile picture URL
  
  patientFacingId: String,       // Staff code (e.g., STF-001)
  designation: String,           // Job title
  department: String,            // Department name
  qualifications: Array<String>, // Educational qualifications
  experienceYears: Number,       // Years of experience
  
  joinedAt: String,              // Join date (ISO)
  shift: String,                 // Work shift
  status: String,                // Available/On Leave/Off Duty/Busy
  location: String,              // Work location
  
  roles: Array<String>,          // User roles
  emergencyContact: String,      // Emergency phone number
  address: String,               // Address
  notes: Object,                 // Additional notes
  tags: Array<String>            // Tags for categorization
}
```

## Component Structure

```
src/modules/admin/staff/
├── Staff.jsx                    # Main list view component
├── Staff.css                    # Styles for list view
├── StaffFormEnterprise.jsx      # Create/Edit form (multi-step)
├── StaffDetailEnterprise.jsx    # Detail view (modal/page)
├── StaffDetailEnterprise.css    # Styles for detail view
└── [Legacy components]
```

## Usage Examples

### 1. Fetching Staff
```javascript
import staffService from '../../../services/staffService';

// Fetch all staff
const allStaff = await staffService.fetchStaffs();

// Force refresh from server
const freshStaff = await staffService.fetchStaffs(true);

// Fetch single staff
const staff = await staffService.fetchStaffById('staff123');
```

### 2. Creating Staff
```javascript
const newStaff = {
  name: 'Dr. John Doe',
  email: 'john.doe@hospital.com',
  contact: '1234567890',
  gender: 'Male',
  designation: 'Doctor',
  department: 'Cardiology',
  status: 'Available'
};

const created = await staffService.createStaff(newStaff);
```

### 3. Updating Staff
```javascript
const updated = { ...existingStaff, status: 'On Leave' };
await staffService.updateStaff(updated);
```

### 4. Deleting Staff
```javascript
const success = await staffService.deleteStaff('staff123');
```

### 5. Downloading Reports
```javascript
// Staff report
const result = await staffService.downloadStaffReport('staff123');
if (result.success) {
  console.log('Downloaded:', result.filename);
}

// Doctor report (includes appointments, patients)
const doctorReport = await staffService.downloadDoctorReport('doctor456');
```

## Key Features Explained

### Staff Code Logic
The staff code is retrieved with fallback logic:
1. Try `patientFacingId` field
2. Try `notes.staffCode` or `notes.staff_code`
3. Try tags starting with "STF-"
4. Default to "-"

### Deduplication
Staff list is deduplicated by ID to prevent duplicate entries:
```javascript
const dedupeById = (input) => {
  const seen = new Set();
  return input.filter(s => {
    const key = s.id || `tmp-${s.hashCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
```

### Optimistic Updates
Following Flutter pattern, updates happen optimistically:
1. Update UI immediately
2. Call API
3. Revert on error or refresh on success

### Report Generation
The system supports two types of reports:
- **Staff Report**: General staff information
- **Doctor Report**: Doctor-specific with appointments and patient data

## Styling & Design

### Color Scheme
- **Primary**: Indigo (#4F46E5)
- **Success**: Green (#22C55E)
- **Warning**: Amber (#F59E0B)
- **Danger**: Red (#EF4444)
- **Text**: Slate (#1E293B, #334155, #64748B)
- **Background**: Gray (#F7F9FC, #FFFFFF)

### Responsive Breakpoints
- **Mobile**: < 768px (fullscreen modals)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px (centered modals with max-width)

### Animations
- Fade in on mount
- Smooth transitions on hover
- Loading spinners for async operations

## Error Handling

### Network Errors
```javascript
try {
  await staffService.fetchStaffs();
} catch (error) {
  // Display user-friendly error message
  showNotification('Failed to fetch staff: ' + error.message, 'error');
}
```

### Validation Errors
Form validation prevents invalid submissions:
- Required fields checked
- Email format validated
- Phone number format validated
- Minimum/maximum length enforced

## Performance Optimization

### Caching
- Staff data cached in memory
- Reduced API calls for repeated access
- Force refresh available when needed

### Pagination
- Only 10 items rendered at a time
- Reduces DOM size
- Faster rendering

### Lazy Loading
- Components load on demand
- Images lazy loaded
- Reduces initial bundle size

## Security

### Authentication
- Token-based authentication
- Token stored in localStorage
- Token sent in Authorization header

### Authorization
- Role-based access control
- Admin-only operations protected
- Sensitive data encrypted

## Testing

### Manual Testing Checklist
- [ ] Create new staff
- [ ] Edit existing staff
- [ ] Delete staff (with confirmation)
- [ ] Search staff by name, ID, department
- [ ] Filter by status and department
- [ ] Navigate pages (previous/next)
- [ ] View staff details
- [ ] Download staff report
- [ ] Download doctor report
- [ ] Upload profile picture
- [ ] Mobile responsiveness
- [ ] Error handling (network failures)

## Known Issues & Limitations

1. **Image Upload**: Currently stores base64 or URL, consider cloud storage for production
2. **Offline Mode**: No offline support yet
3. **Real-time Updates**: No WebSocket integration for live updates
4. **Bulk Operations**: No bulk delete/update yet
5. **Export**: Currently only PDF, consider Excel/CSV export

## Future Enhancements

1. **Advanced Search**: Full-text search, filters by qualification, experience
2. **Bulk Operations**: Import/export CSV, bulk status updates
3. **Attendance**: Integrate with attendance tracking
4. **Payroll**: Link to payroll system
5. **Performance Reviews**: Add review module
6. **Notifications**: Email/SMS notifications for updates
7. **Audit Log**: Track all changes with timestamps
8. **Permissions**: Granular permission system
9. **Schedule Management**: Shift scheduling, leave management
10. **Document Management**: Store and manage staff documents

## Migration from Flutter

The React implementation maintains parity with Flutter:

| Flutter | React | Status |
|---------|-------|--------|
| StaffScreen | Staff.jsx | ✅ Complete |
| StaffFormPage | StaffFormEnterprise.jsx | ✅ Complete |
| StaffDetailPage | StaffDetailEnterprise.jsx | ✅ Complete |
| AuthService.fetchStaffs | staffService.fetchStaffs | ✅ Complete |
| ReportService.downloadStaffReport | staffService.downloadStaffReport | ✅ Complete |

## Support & Maintenance

### Common Issues

**Issue**: API returns 404
- **Solution**: Check base URL in `.env` file, verify API endpoint

**Issue**: Staff not showing
- **Solution**: Check console for errors, verify authentication token

**Issue**: Form validation failing
- **Solution**: Ensure all required fields filled, check field formats

**Issue**: Horizontal scroll appears
- **Solution**: Already fixed with `overflow-x: hidden` and responsive table design

### Contact
For issues or questions, contact the development team.

---

**Last Updated**: December 15, 2024  
**Version**: 2.0.0  
**Maintainer**: HMS Development Team

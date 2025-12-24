# Patients Module

## Overview
React implementation of the Flutter Patients page with full API integration. This module provides comprehensive patient management capabilities for the admin dashboard.

## Files Structure

```
patients/
├── PatientsReal.jsx          # Main patients page with API integration
├── PatientsReal.css          # Styles for patients page
├── Patients.jsx              # Legacy patients page (keep for reference)
├── Patients.css              # Legacy styles
├── index.js                  # Module exports
└── README.md                 # This file
```

## Features

### ✅ Implemented Features

1. **Patient Listing**
   - Display all patients in a responsive table
   - Glassmorphism design matching appointment page
   - Avatar display based on gender (boyicon/girlicon)
   - Real-time data from backend API

2. **Search & Filter**
   - Real-time search by patient name, doctor, or ID
   - Filter by assigned doctor
   - Instant results without page reload

3. **Pagination**
   - 10 patients per page
   - Previous/Next navigation
   - Page number display
   - Total count display

4. **CRUD Operations**
   - **View**: Preview patient details
   - **Edit**: Update patient information
   - **Delete**: Remove patient with confirmation
   - **Download**: Generate patient report PDF

5. **Data Fields**
   - Name (with gender avatar)
   - Age
   - Gender
   - Last Visit (formatted date)
   - Doctor (assigned physician)
   - Condition (medical history)

## API Integration

### Service: `patientsService.js`

Located at: `src/services/patientsService.js`

#### Methods:

```javascript
// Fetch all patients
fetchPatients({ page, limit, q, status })

// Fetch patient by ID
fetchPatientById(id)

// Create new patient
createPatient(patientData)

// Update existing patient
updatePatient(id, patientData)

// Delete patient
deletePatient(id)

// Download patient report
downloadPatientReport(patientId)
```

### API Endpoints

```javascript
GET    /api/patients              // Get all patients
GET    /api/patients/:id          // Get patient by ID
POST   /api/patients              // Create patient
PUT    /api/patients/:id          // Update patient
DELETE /api/patients/:id          // Delete patient
GET    /api/reports/:id/download  // Download report
```

## Data Transformation

### Flutter to React Mapping

```javascript
// Flutter PatientDetails -> React Patient
{
  id: patient._id || patient.id || patient.patientId,
  name: patient.name || `${firstName} ${lastName}`,
  age: patient.age || 0,
  gender: patient.gender || 'Other',
  lastVisit: patient.lastVisit || patient.lastVisitDate || patient.updatedAt,
  doctor: extractDoctorName(patient),
  condition: extractCondition(patient),
  reason: patient.reason || ''
}
```

### Condition Extraction Logic

Mirrors Flutter's condition extraction:
1. Check `condition` field
2. Check `medicalHistory` array
3. Check `metadata.medicalHistory`
4. Check `metadata.condition`
5. Check `notes` field
6. Fallback to 'N/A'

### Doctor Name Extraction

Handles multiple field variations:
- `patient.doctor.name` (nested object)
- `patient.doctor` (string)
- `patient.assignedDoctor`
- `patient.doctorName`
- `patient.doctorId`

## Design Reference

### Based on Flutter's `PatientsPage.dart`

Key similarities:
- ✅ Generic data table structure
- ✅ Search and filter toolbar
- ✅ Gender-based avatars
- ✅ Date formatting (dd/mm/yyyy)
- ✅ Pagination controls
- ✅ Action menu (View/Edit/Download/Delete)
- ✅ Loading states
- ✅ Empty states

### Styled like AppointmentsReal

- Consistent glassmorphism design
- Same color scheme
- Matching button styles
- Similar table layout
- Unified animations

## Usage

```jsx
import { PatientsReal } from '../modules/admin/patients';

// In your routes
<Route path="/admin/patients" element={<PatientsReal />} />
```

## State Management

```javascript
const [patients, setPatients] = useState([]);           // All patients
const [filteredPatients, setFilteredPatients] = useState([]); // Filtered list
const [isLoading, setIsLoading] = useState(true);       // Loading state
const [isDownloading, setIsDownloading] = useState(false); // Download state
const [searchQuery, setSearchQuery] = useState('');     // Search text
const [currentPage, setCurrentPage] = useState(0);      // Current page
const [doctorFilter, setDoctorFilter] = useState('All'); // Doctor filter
const [showDoctorMenu, setShowDoctorMenu] = useState(false); // Filter menu
const [actionMenuIndex, setActionMenuIndex] = useState(null); // Action menu
```

## Key Functions

### Data Fetching
```javascript
fetchPatients()  // Load all patients from API
```

### Filtering
```javascript
useEffect(() => {
  // Apply search and doctor filters
  // Reset to page 0
}, [searchQuery, doctorFilter, patients]);
```

### Actions
```javascript
handleView(patient)      // View patient details
handleEdit(patient)      // Edit patient info
handleDelete(patient)    // Delete patient
handleDownload(patient)  // Download report
```

## Styling

### CSS Classes

- `.patients-real` - Main container
- `.patients-header` - Header with title and add button
- `.patients-toolbar` - Search and filter bar
- `.patients-table-container` - Table wrapper
- `.patients-table` - Main table
- `.patient-cell` - Patient name cell with avatar
- `.action-menu` - Action menu dropdown
- `.pagination` - Pagination controls

### Responsive Breakpoints

- Desktop: > 1024px (full table)
- Tablet: 768px - 1024px (reduced padding)
- Mobile: < 768px (stacked layout)

## TODO / Future Enhancements

### Modals (Not Yet Implemented)
- [ ] NewPatientModal - Add new patient form
- [ ] EditPatientModal - Edit patient form
- [ ] PatientPreviewModal - View patient details
- [ ] PatientVitalsModal - View/edit vitals

### Features
- [ ] Bulk operations
- [ ] Export to Excel/PDF
- [ ] Advanced filters (age, gender, status)
- [ ] Sort by column headers
- [ ] Patient vitals display
- [ ] Medical history timeline
- [ ] Appointment history

### Performance
- [ ] Virtual scrolling for large lists
- [ ] Debounced search
- [ ] Cached API responses
- [ ] Optimistic updates

## Testing

### Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Patients display correctly
- [ ] Search works (name, doctor, ID)
- [ ] Filter by doctor works
- [ ] Pagination works
- [ ] View action works
- [ ] Edit action works
- [ ] Delete action works (with confirmation)
- [ ] Download report works
- [ ] Loading states display
- [ ] Empty state displays
- [ ] Responsive on mobile/tablet

### API Testing

```bash
# Test fetch patients
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/patients

# Test delete patient
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/patients/PATIENT_ID
```

## Troubleshooting

### Common Issues

1. **"Failed to load patients"**
   - Check API endpoint is correct
   - Verify auth token is valid
   - Check network connection

2. **"Failed to delete patient"**
   - Verify user has admin permissions
   - Check patient ID is valid
   - Confirm patient can be deleted (no dependencies)

3. **Avatars not showing**
   - Check `/public/boyicon.png` exists
   - Check `/public/girlicon.png` exists
   - Verify avatar paths in code

4. **Download not working**
   - Check report endpoint is implemented
   - Verify patient has report data
   - Check CORS settings for file download

## References

### Flutter Code
- `lib/Modules/Admin/PatientsPage.dart` - Main Flutter implementation
- `lib/Services/Authservices.dart` - Patient API methods
- `lib/Models/Patients.dart` - Patient data model

### React Code
- `src/modules/admin/patients/PatientsReal.jsx` - Main React page
- `src/services/patientsService.js` - API service
- `src/utils/avatarHelpers.js` - Avatar utilities
- `src/utils/dateHelpers.js` - Date formatting

## Change Log

### v1.0.0 - Initial Implementation
- ✅ Created PatientsReal.jsx component
- ✅ Created patientsService.js
- ✅ Added to admin routes
- ✅ Implemented all CRUD operations
- ✅ Added search and filter
- ✅ Added pagination
- ✅ Styled with glassmorphism design
- ✅ Matched appointment page design

---

**Status**: ✅ COMPLETE - Core functionality implemented and ready for use

**Next Steps**: Implement patient form modals and preview modal

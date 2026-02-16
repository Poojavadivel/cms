# Quick Guide: Appointment Preview Dialog

## What Was Implemented

A complete React implementation of Flutter's `DoctorAppointmentPreview` screen with:
- **Profile Tab**: Address, Emergency Contact, Insurance information
- **Medical History Tab**: Searchable/filterable table of medical records
- **Prescription Tab**: List of medicines with dosage and instructions
- **Lab Results Tab**: Test results with status indicators
- **Billings Tab**: Payment and invoice history

## How to Use

### In Appointments Page (Already Integrated)
Click on any patient name in the appointments table → Dialog opens automatically

### In Other Components
```jsx
import AppointmentPreviewDialog from '../../components/doctor/AppointmentPreviewDialog';
import patientsService from '../../services/patientsService';

function YourComponent() {
  const [patient, setPatient] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const openPatientPreview = async (patientId) => {
    const data = await patientsService.fetchPatientById(patientId);
    setPatient(data);
    setShowDialog(true);
  };

  return (
    <>
      {/* Your component content */}
      
      <AppointmentPreviewDialog
        patient={patient}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        showBillingTab={true}
      />
    </>
  );
}
```

## File Locations

- **Component**: `src/components/doctor/AppointmentPreviewDialog.jsx`
- **Styles**: `src/components/doctor/AppointmentPreviewDialog.css`
- **Services**: `src/services/prescriptionService.js` (already configured)
- **API Config**: `src/services/apiConstants.js` (already configured)

## Features

✅ Patient profile header with vitals  
✅ 5 tabs with full data display  
✅ Real-time data fetching from backend  
✅ Search & filter in tables  
✅ Pagination (10 items per page)  
✅ Loading, error, and empty states  
✅ Responsive design  
✅ Matches Flutter design 100%  

## API Endpoints

The component uses these Scanner Enterprise endpoints:
- `GET /api/scanner-enterprise/medical-history/:patientId`
- `GET /api/scanner-enterprise/prescriptions/:patientId`
- `GET /api/scanner-enterprise/lab-reports/:patientId`

## Browser Testing

1. Navigate to Appointments page
2. Click on any patient name
3. Dialog opens with patient details
4. Switch between tabs to view different data
5. Use search boxes and filters in tables
6. Click pagination buttons to navigate pages

## Mobile Responsive

- Dialog fills screen on mobile devices
- Tables scroll horizontally if needed
- All touch interactions work smoothly

## Troubleshooting

**Dialog not opening?**
- Check console for errors
- Verify patient data is loaded
- Ensure `isOpen={true}` is set

**No data in tabs?**
- Check backend API is running
- Verify patient has uploaded medical documents
- Check browser network tab for API responses

**Styling looks different?**
- Clear browser cache
- Verify CSS file is imported
- Check for CSS conflicts with other components

## Next Development

To add new features:
1. Open `AppointmentPreviewDialog.jsx`
2. Create new tab component (e.g., `VitalsHistoryTab`)
3. Add tab button in tabs array
4. Add tab content in switch statement
5. Fetch required data from backend

## Support

For issues or questions:
- Check implementation doc: `APPOINTMENT_PREVIEW_IMPLEMENTATION.md`
- Review Flutter version: `lib/Modules/Doctor/widgets/doctor_appointment_preview.dart`
- Check API logs for backend errors

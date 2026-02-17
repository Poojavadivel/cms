# Intake Form Implementation Plan - Flutter to React

## Current Status

### Flutter Intake Form (Complete ✅)
**Location:** `lib/Modules/Doctor/widgets/intakeform.dart`

**Features:**
1. ✅ Patient Profile Header Card (with vitals display)
2. ✅ Vitals Section (Height, Weight, BMI auto-calc, SpO2)
3. ✅ Current Notes Section (multiline text)
4. ✅ Pharmacy Section (Enhanced table with medicine search, dosage, frequency, auto-calculation)
5. ✅ Pathology Section (Lab tests table)
6. ✅ Follow-Up Planning Section
7. ✅ Stock Warnings (before save)
8. ✅ Save button with loading state
9. ✅ Floating close button (top-right)
10. ✅ Full-screen dialog layout
11. ✅ Responsive design
12. ✅ Auto BMI calculation
13. ✅ Complete API integration

### React Intake Form (Basic ❌)
**Location:** `react/hms/src/components/appointments/AppointmentIntakeModal.jsx`

**Current Features:**
- ✅ Basic modal dialog
- ✅ Patient name display
- ✅ Height, Weight, BMI, SpO2 inputs
- ✅ Auto BMI calculation
- ✅ Current Notes textarea
- ✅ Basic save functionality

**Missing Features:**
- ❌ Patient Profile Header Card
- ❌ Pharmacy section with medicine table
- ❌ Pathology section with lab tests
- ❌ Follow-up planning section
- ❌ Expandable sections (collapsible cards)
- ❌ Stock warnings
- ❌ Enhanced UI matching Flutter exactly
- ❌ Comprehensive API integration
- ❌ Medicine search/autocomplete
- ❌ Dosage calculator
- ❌ Price calculation

## Implementation Requirements

### 1. Patient Profile Header Card
**Reuse existing component:**
```javascript
import PatientProfileHeaderCard from '../doctor/PatientProfileHeaderCard';

// Inside modal:
<PatientProfileHeaderCard 
  patient={patientFromAppointment}
  onEdit={null} // No edit in intake form
/>
```

### 2. Expandable Section Cards
Create collapsible sections matching Flutter's `_SectionCard`:

```javascript
<SectionCard 
  icon={<MdMonitorHeart />}
  title="Vital Signs"
  description="Record patient vitals"
  initiallyExpanded={true}
>
  {/* Vitals inputs */}
</SectionCard>
```

### 3. Pharmacy Section
**Flutter has:** `EnhancedPharmacyTable` with:
- Medicine search/autocomplete
- Dosage input
- Frequency dropdown
- Notes
- Price calculation
- Quantity tracking
- Auto-calculation
- Stock warnings

**React needs:**
```javascript
<PharmacyTable 
  rows={pharmacyRows}
  onRowsChanged={setPharmacyRows}
  onStockWarnings={handleStockWarnings}
/>
```

### 4. Pathology Section
**Flutter has:** Custom editable table with:
- Test Name
- Category
- Priority
- Notes
- Add/Remove rows

**React needs:**
```javascript
<PathologyTable 
  rows={pathologyRows}
  onRowsChanged={setPathologyRows}
  columns={['Test Name', 'Category', 'Priority', 'Notes']}
/>
```

### 5. Follow-Up Planning Section
**Flutter has:** Complete follow-up planning with:
- Follow-up required checkbox
- Date picker
- Time picker
- Reason/notes
- Auto-schedule appointment

**React needs:**
```javascript
<FollowUpPlanning 
  pathologyRows={pathologyRows}
  followUpData={followUpData}
  onDataChanged={setFollowUpData}
/>
```

## UI Design Specifications (Flutter Match)

### Colors
```css
--primary: #EF4444
--background: #F9FAFB
--card-bg: #FFFFFF
--border: #E5E7EB
--text-primary: #111827
--text-secondary: #6B7280
```

### Layout
```
┌────────────────────────────────────────────────────┐
│  [X Close Button]                                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ Patient Profile Header Card                   │  │
│  │ - Avatar, Name, Age, Gender, Blood Group      │  │
│  │ - Vitals Grid (Height, Weight, BMI, SpO2)    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ [📋] Vital Signs ▼                            │  │
│  │ ────────────────────────────────────────────  │  │
│  │ [Height (cm)]  [Weight (kg)]                  │  │
│  │ [BMI]          [SpO2 (%)]                     │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ [📝] Current Notes ▼                          │  │
│  │ ────────────────────────────────────────────  │  │
│  │ [Multiline textarea]                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ [💊] Pharmacy ▶                               │  │
│  │ ────────────────────────────────────────────  │  │
│  │ [Collapsed initially]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ [🔬] Pathology ▶                              │  │
│  │ ────────────────────────────────────────────  │  │
│  │ [Collapsed initially]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ [📅] Follow-Up Planning ▶                     │  │
│  │ ────────────────────────────────────────────  │  │
│  │ [Collapsed initially]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ──────────────────────────────────────────────    │
│  [Cancel]                    [💾 Save Intake]      │
└────────────────────────────────────────────────────┘
```

### Dimensions
- Dialog max-width: 1350px
- Dialog max-height: 90vh
- Border radius: 22px
- Section card border-radius: 16px
- Input height: 40px
- Button height: 44px

## API Endpoints Required

### Save Intake
```javascript
POST /api/intakes
Body: {
  patientId: string
  appointmentId: string
  vitals: {
    heightCm: string
    weightKg: string
    bmi: string
    spo2: string
  }
  currentNotes: string
  pharmacy: [
    {
      Medicine: string
      Dosage: string
      Frequency: string
      Notes: string
      quantity: number
      price: number
    }
  ]
  pathology: [
    {
      'Test Name': string
      Category: string
      Priority: string
      Notes: string
    }
  ]
  followUp: {
    isRequired: boolean
    date: string
    time: string
    reason: string
  }
}
```

### Get Medicines (for autocomplete)
```javascript
GET /api/medicines?search=<query>
Response: [
  {
    _id: string
    name: string
    stock: number
    price: number
  }
]
```

## Implementation Steps

### Phase 1: Enhanced Modal Layout ✅ (Can Start Now)
1. Update AppointmentIntakeModal.jsx structure
2. Add Patient Profile Header Card
3. Create SectionCard component
4. Update CSS to match Flutter

### Phase 2: Vitals Section ✅ (Partially Done)
1. Keep existing vitals inputs
2. Enhance styling to match Flutter
3. Ensure auto BMI calculation works
4. Add validation

### Phase 3: Pharmacy Section 🔄 (Complex)
1. Create PharmacyTable component
2. Add medicine search/autocomplete
3. Implement dosage calculator
4. Add price calculation
5. Stock checking
6. Add/remove rows functionality

### Phase 4: Pathology Section 🔄 (Medium)
1. Create PathologyTable component
2. Editable cells
3. Add/remove rows
4. Category dropdown
5. Priority dropdown

### Phase 5: Follow-Up Planning 🔄 (Medium)
1. Create FollowUpPlanning component
2. Date/time pickers
3. Checkbox for required
4. Integration with appointment creation

### Phase 6: Save & Validation ✅ (Basic Done)
1. Update save function
2. Add loading states
3. Stock warnings before save
4. Success/error messages
5. Close modal after save

## Files to Create/Modify

### New Files:
1. `components/appointments/SectionCard.jsx`
2. `components/appointments/PharmacyTable.jsx`
3. `components/appointments/PathologyTable.jsx`
4. `components/appointments/FollowUpPlanning.jsx`
5. `components/appointments/SectionCard.css`
6. `components/appointments/PharmacyTable.css`
7. `components/appointments/PathologyTable.css`
8. `components/appointments/FollowUpPlanning.css`

### Modify:
1. `components/appointments/AppointmentIntakeModal.jsx` (major update)
2. `components/appointments/AppointmentIntakeModal.css` (major update)
3. `services/intakeService.js` (create new service)
4. `services/medicinesService.js` (create new service)

## Estimated Complexity

### Time Estimates:
- Phase 1 (Layout): 2-3 hours ⏰
- Phase 2 (Vitals): 1 hour ⏰
- Phase 3 (Pharmacy): 5-6 hours ⏰⏰⏰ (Most complex)
- Phase 4 (Pathology): 3-4 hours ⏰⏰
- Phase 5 (Follow-Up): 2-3 hours ⏰⏰
- Phase 6 (Save): 1-2 hours ⏰

**Total: 14-19 hours of development**

### Complexity Rating:
- Layout & Styling: 🟢 Easy
- Vitals Section: 🟢 Easy
- Notes Section: 🟢 Easy
- Pharmacy Table: 🔴 Complex (medicine search, calculations, stock)
- Pathology Table: 🟡 Medium (editable table)
- Follow-Up Planning: 🟡 Medium (date/time pickers)
- API Integration: 🟡 Medium
- Stock Warnings: 🟡 Medium

## Priority Order

### High Priority (Core Functionality):
1. ✅ Enhanced modal layout
2. ✅ Patient profile header
3. ✅ Vitals section
4. ✅ Current notes
5. ✅ Basic save functionality

### Medium Priority (Important Features):
6. 🔄 Pharmacy section with search
7. 🔄 Pathology section
8. 🔄 Stock warnings

### Lower Priority (Nice to Have):
9. 🔄 Follow-up planning
10. 🔄 Advanced calculations
11. 🔄 Print/export

## Next Steps

### Immediate Actions:
1. ✅ Update AppointmentIntakeModal layout
2. ✅ Add PatientProfileHeaderCard
3. ✅ Create SectionCard component
4. 🔄 Start PharmacyTable component
5. 🔄 Create intakeService.js

### Testing Requirements:
- [ ] Modal opens correctly
- [ ] Patient data displays
- [ ] Vitals calculate BMI
- [ ] Notes save correctly
- [ ] Pharmacy items add/remove
- [ ] Pathology items add/remove
- [ ] Follow-up planning works
- [ ] Save button works
- [ ] Stock warnings show
- [ ] Success message displays
- [ ] Modal closes after save

## Dependencies

### Existing Components to Reuse:
- ✅ PatientProfileHeaderCard
- ✅ Modal overlay system
- ✅ Button components
- ✅ Input components

### New Dependencies Needed:
- 🔄 Medicine search API
- 🔄 Stock checking API
- 🔄 Date/time picker library (react-datepicker?)
- 🔄 Autocomplete component
- 🔄 Editable table component

## Summary

The React intake form needs **significant enhancement** to match Flutter's comprehensive implementation. The most complex part is the **Pharmacy section** with medicine search, stock checking, and calculations.

**Recommendation:** 
1. Start with Phase 1 (layout improvements)
2. Implement Pharmacy section as separate component
3. Add Pathology section
4. Add Follow-up planning last

This will create a fully functional intake form matching Flutter's design and functionality exactly.

---

**Status:** 📋 Planning Complete - Ready for Implementation
**Created:** December 14, 2024
**Flutter Reference:** `lib/Modules/Doctor/widgets/intakeform.dart`

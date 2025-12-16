# Follow-Up Feature Documentation

## Overview
The Follow-Up feature allows doctors to schedule future appointments for patients to monitor treatment progress, review results, or conduct follow-up examinations. This is a critical feature in healthcare management for ensuring continuity of care.

## What is a Follow-Up?
A **follow-up** is a scheduled appointment that occurs after an initial consultation or treatment. It allows doctors to:
- Monitor patient recovery and treatment effectiveness
- Review laboratory or test results
- Adjust medications or treatment plans
- Conduct post-operative checkups
- Ensure patient compliance with treatment regimens

## Architecture

### Backend Implementation

#### 1. Database Schema (Appointment Model)
Location: `Server/Models/Appointment.js`

**New Fields Added:**
```javascript
{
  isFollowUp: Boolean,              // Indicates if this is a follow-up appointment
  previousAppointmentId: String,    // Links to the original appointment
  followUpReason: String,           // Reason for the follow-up
  followUpDate: Date,              // Scheduled date for follow-up
  hasFollowUp: Boolean,            // Indicates if appointment has a follow-up scheduled
  nextFollowUpId: String           // Links to the next follow-up appointment
}
```

This creates a **bidirectional linked chain** of appointments, allowing you to:
- Navigate forward through follow-ups
- Navigate backward to original appointments
- Track entire patient journey

#### 2. API Endpoints
Location: `Server/routes/appointment.js`

##### a) Create Follow-Up Appointment
**POST** `/appointments/:id/follow-up`

Creates a new follow-up appointment linked to an existing appointment.

**Request Body:**
```json
{
  "followUpDate": "2024-12-25T10:00:00Z",
  "followUpReason": "Review lab results",
  "appointmentType": "Follow-Up",
  "location": "Main Clinic",
  "notes": "Check blood pressure and prescribe accordingly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Follow-up appointment created successfully",
  "appointment": { /* appointment object */ },
  "followUpId": "uuid"
}
```

**Features:**
- Automatically links to original appointment
- Sets patient and doctor from original appointment
- Marks original appointment with `hasFollowUp: true`
- Creates bidirectional link between appointments

##### b) Get Follow-Up History
**GET** `/appointments/patient/:patientId/follow-ups`

Retrieves all follow-up appointments for a specific patient.

**Response:**
```json
{
  "success": true,
  "followUps": [ /* array of follow-up appointments */ ],
  "count": 5
}
```

**Authorization:**
- Doctors can only see their own patient follow-ups
- Admins can see all follow-ups

##### c) Get Follow-Up Chain
**GET** `/appointments/:id/follow-up-chain`

Retrieves the complete chain of appointments (previous → current → next).

**Response:**
```json
{
  "success": true,
  "chain": [ /* array of appointments in chronological order */ ],
  "count": 3
}
```

**Use Case:** View patient's complete appointment history in sequence

### Frontend Implementation

#### 1. Follow-Up Dialog Widget
Location: `lib/Modules/Doctor/widgets/follow_up_dialog.dart`

An enterprise-grade dialog for scheduling follow-ups with:

**Features:**
- **Quick Date Selection**: Pre-defined buttons (1 week, 2 weeks, 1 month, 3 months)
- **Date & Time Pickers**: Calendar and time selection with theme matching
- **Appointment Types**: Dropdown with common follow-up types
- **Follow-Up Reason**: Text field for documenting the reason
- **Location Field**: Specify appointment location
- **Notes Field**: Additional comments or instructions
- **Patient Info Card**: Shows patient details for context
- **Loading States**: Proper UX during API calls
- **Success/Error Feedback**: Snackbar notifications

**Appointment Types Available:**
1. Follow-Up (default)
2. Check-Up
3. Review
4. Post-Treatment
5. Lab Results Review
6. Medication Review

**User Flow:**
1. Doctor clicks follow-up icon next to patient
2. Dialog opens with patient information pre-filled
3. Doctor selects date (quick select or custom date/time)
4. Selects appointment type and adds reason
5. Adds optional location and notes
6. Clicks "Schedule Follow-Up"
7. System creates appointment and shows success message
8. Patient list refreshes automatically

#### 2. Patient Screen Integration
Location: `lib/Modules/Doctor/PatientsPage.dart`

**Changes Made:**
- Added follow-up icon (calendar_add) next to view icon in actions column
- Icon color: Success green to indicate positive action
- Tooltip: "Schedule Follow-Up"
- Integrated FollowUpDialog.show() method
- Auto-refresh patient list after successful follow-up creation

**Icon Details:**
```dart
Icon: Iconsax.calendar_add
Color: AppColors.kSuccess (green)
Position: Next to view icon in actions column
Size: 36x36 px container, 16px icon
```

## Usage Guide

### For Doctors

#### Scheduling a Follow-Up:
1. Navigate to **Patients** screen in Doctor module
2. Find the patient you want to schedule a follow-up for
3. Click the **green calendar icon** (📅) in the Actions column
4. In the dialog:
   - Use quick buttons for common timeframes or pick custom date/time
   - Select appropriate appointment type
   - Enter the reason for follow-up
   - Add any additional notes
   - Verify or update location
5. Click **"Schedule Follow-Up"**
6. Success message will appear with appointment details

#### Quick Date Options:
- **1 Week**: Typically for medication adjustments or minor issues
- **2 Weeks**: Standard follow-up for most treatments
- **1 Month**: Long-term treatment monitoring
- **3 Months**: Chronic condition management

### For Admins

#### Viewing Follow-Up History:
```javascript
// API call to get all follow-ups for a patient
GET /appointments/patient/{patientId}/follow-ups
```

#### Viewing Appointment Chain:
```javascript
// API call to see complete appointment sequence
GET /appointments/{appointmentId}/follow-up-chain
```

## Data Flow

### Creating a Follow-Up:
```
Doctor Action (Click Follow-Up Icon)
         ↓
FollowUpDialog Opens
         ↓
Doctor Fills Form & Submits
         ↓
POST /appointments (with isFollowUp: true)
         ↓
Backend Creates New Appointment
         ↓
Backend Updates Original Appointment (hasFollowUp: true)
         ↓
Response Sent to Frontend
         ↓
Success Message Displayed
         ↓
Patient List Refreshes
```

### Follow-Up Chain:
```
Original Appointment (ID: A)
    ↓ (previousAppointmentId points backward)
Follow-Up 1 (ID: B)
    ↓
Follow-Up 2 (ID: C)
    ↓
Future Follow-Up (ID: D)

A.nextFollowUpId → B
B.previousAppointmentId → A
B.nextFollowUpId → C
C.previousAppointmentId → B
...and so on
```

## Security & Authorization

### Access Control:
- **Doctors**: Can only create follow-ups for their own patients
- **Admins/Superadmins**: Can create follow-ups for any patient
- **Backend Validation**: Checks appointment ownership before creation

### Data Integrity:
- Follow-up appointments automatically inherit patient and doctor from original
- Bidirectional links ensure data consistency
- Timestamps tracked for audit purposes

## Testing

### Manual Testing Steps:

1. **Create Follow-Up:**
   ```
   - Login as doctor
   - Go to Patients screen
   - Click follow-up icon for any patient
   - Fill form and submit
   - Verify success message
   - Check if appointment appears in appointments list
   ```

2. **Verify Link:**
   ```
   - Get appointment ID from response
   - Call GET /appointments/{id}/follow-up-chain
   - Verify chain includes both original and follow-up
   ```

3. **Test Authorization:**
   ```
   - Try creating follow-up for another doctor's patient
   - Should fail with 403 Forbidden
   ```

### API Testing with cURL:

```bash
# Create Follow-Up
curl -X POST http://localhost:5000/appointments/{appointmentId}/follow-up \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_TOKEN" \
  -d '{
    "followUpDate": "2024-12-25T10:00:00Z",
    "followUpReason": "Check treatment progress",
    "appointmentType": "Follow-Up",
    "location": "Main Clinic"
  }'

# Get Follow-Up History
curl -X GET http://localhost:5000/appointments/patient/{patientId}/follow-ups \
  -H "x-auth-token: YOUR_TOKEN"

# Get Appointment Chain
curl -X GET http://localhost:5000/appointments/{appointmentId}/follow-up-chain \
  -H "x-auth-token: YOUR_TOKEN"
```

## Future Enhancements

### Potential Improvements:
1. **Automated Reminders**: Send notifications to patients before follow-up
2. **Smart Scheduling**: AI-suggested follow-up dates based on diagnosis
3. **Follow-Up Analytics**: Dashboard showing follow-up compliance rates
4. **Template Reasons**: Pre-defined follow-up reason templates
5. **Recurring Follow-Ups**: Schedule multiple follow-ups at once
6. **Follow-Up Notes**: Pre-populate notes from previous appointment
7. **Patient Portal**: Allow patients to see upcoming follow-ups
8. **Follow-Up Completion**: Mark follow-ups as complete with outcomes

## Troubleshooting

### Common Issues:

1. **Follow-up not appearing:**
   - Check if appointment creation was successful (check response)
   - Verify patient list refresh happened
   - Check browser console for errors

2. **Authorization errors:**
   - Verify user is logged in as doctor
   - Check if doctor has access to the patient
   - Verify auth token is valid

3. **Date/Time issues:**
   - Ensure selected date is in the future
   - Check timezone handling (backend stores in UTC)
   - Verify date format in ISO 8601

## Code Organization

```
Server/
├── Models/
│   └── Appointment.js          # Updated with follow-up fields
└── routes/
    └── appointment.js          # Follow-up endpoints added

lib/
├── Modules/
│   └── Doctor/
│       ├── PatientsPage.dart   # Follow-up icon integration
│       └── widgets/
│           └── follow_up_dialog.dart  # Dialog component
```

## Dependencies

### Backend:
- mongoose (existing)
- express (existing)
- uuid (existing)

### Frontend:
- flutter (existing)
- iconsax (existing)
- google_fonts (existing)
- intl (existing)

No new dependencies required!

## Conclusion

The Follow-Up feature is now fully integrated into the Hospital Management System. It provides doctors with an intuitive way to schedule follow-up appointments while maintaining data integrity through bidirectional appointment chains. The feature is production-ready and follows enterprise-grade design patterns.

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-19  
**Author:** Development Team  
**Status:** ✅ Production Ready

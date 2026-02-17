# Availability Checking System - Usage Guide

## Overview

The availability checking system prevents double-booking and helps manage doctor and patient schedules efficiently. It provides real-time conflict detection and suggests alternative time slots.

## Features

### 1. **Doctor Availability Checking**
- Checks if doctor has any appointments during the requested time
- Shows conflicting appointments with patient details
- Suggests available time slots

### 2. **Patient Availability Checking**
- Checks if patient has any appointments during the requested time
- Shows conflicting appointments with doctor details
- Prevents patients from booking overlapping appointments

### 3. **Smart Scheduling**
- Calculates available time slots automatically
- Shows doctor's daily schedule with utilization percentage
- Recommends optimal booking times

## Backend API Endpoints

### 1. Check Availability
```
POST /api/appointments/check-availability
```

**Request Body:**
```json
{
  "doctorId": "doctor-uuid",
  "patientId": "patient-uuid",
  "startAt": "2024-02-05T10:00:00Z",
  "endAt": "2024-02-05T10:30:00Z",
  "duration": 30,
  "excludeAppointmentId": "appointment-uuid-to-exclude" // Optional, for editing
}
```

**Response:**
```json
{
  "success": true,
  "availability": {
    "isAvailable": false,
    "doctorAvailable": false,
    "patientAvailable": true,
    "conflicts": [
      {
        "type": "doctor",
        "message": "Doctor has 1 appointment(s) during this time",
        "appointments": [
          {
            "id": "apt-123",
            "patientName": "John Doe",
            "startAt": "2024-02-05T10:00:00Z",
            "endAt": "2024-02-05T10:30:00Z",
            "status": "Confirmed",
            "type": "Consultation"
          }
        ]
      }
    ],
    "availableSlots": [
      {
        "startAt": "2024-02-05T11:00:00Z",
        "endAt": "2024-02-05T12:00:00Z",
        "durationMinutes": 60
      }
    ],
    "recommendations": [
      "Consider selecting a different time slot",
      "Review the suggested available slots below"
    ]
  },
  "requestedTime": {
    "startAt": "2024-02-05T10:00:00Z",
    "endAt": "2024-02-05T10:30:00Z",
    "duration": 30
  }
}
```

### 2. Get Doctor's Schedule
```
GET /api/appointments/doctor/:doctorId/schedule?date=YYYY-MM-DD
```

**Response:**
```json
{
  "success": true,
  "schedule": {
    "date": "2024-02-05",
    "totalAppointments": 5,
    "utilizationPercentage": 62,
    "appointments": [
      {
        "id": "apt-123",
        "patientName": "John Doe",
        "patientPhone": "+1234567890",
        "startAt": "2024-02-05T09:00:00Z",
        "endAt": "2024-02-05T09:30:00Z",
        "duration": 30,
        "type": "Consultation",
        "status": "Confirmed",
        "location": "Room 101"
      }
    ],
    "busySlots": [
      {
        "startAt": "2024-02-05T09:00:00Z",
        "endAt": "2024-02-05T09:30:00Z",
        "durationMinutes": 30,
        "appointmentId": "apt-123"
      }
    ],
    "freeSlots": [
      {
        "startAt": "2024-02-05T09:30:00Z",
        "endAt": "2024-02-05T10:00:00Z",
        "durationMinutes": 30
      }
    ]
  }
}
```

## Frontend Integration

### 1. Import the Components

```javascript
import AvailabilityChecker from '../../components/appointments/AvailabilityChecker';
import availabilityService from '../../services/availabilityService';
```

### 2. Use in Appointment Form

```javascript
import React, { useState } from 'react';
import AvailabilityChecker from '../../components/appointments/AvailabilityChecker';

const NewAppointmentForm = () => {
  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    date: '',
    time: '',
    duration: 30
  });
  
  const [isAvailable, setIsAvailable] = useState(true);

  // Calculate startAt from date and time
  const startAt = formData.date && formData.time 
    ? new Date(`${formData.date}T${formData.time}`)
    : null;

  // Handle availability change
  const handleAvailabilityChange = (availability) => {
    setIsAvailable(availability.isAvailable);
    
    // You can prevent submission if not available
    if (!availability.isAvailable) {
      console.warn('Time slot not available:', availability.conflicts);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isAvailable) {
      alert('Please select an available time slot');
      return;
    }
    
    // Submit appointment...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Doctor Selection */}
      <select 
        value={formData.doctorId}
        onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
      >
        <option value="">Select Doctor</option>
        {/* Doctor options */}
      </select>

      {/* Patient Selection */}
      <select 
        value={formData.patientId}
        onChange={(e) => setFormData({...formData, patientId: e.target.value})}
      >
        <option value="">Select Patient</option>
        {/* Patient options */}
      </select>

      {/* Date & Time */}
      <input 
        type="date" 
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
      />
      
      <input 
        type="time" 
        value={formData.time}
        onChange={(e) => setFormData({...formData, time: e.target.value})}
      />

      {/* Availability Checker */}
      <AvailabilityChecker
        doctorId={formData.doctorId}
        patientId={formData.patientId}
        startAt={startAt}
        duration={formData.duration}
        onAvailabilityChange={handleAvailabilityChange}
        autoCheck={true}
        showSuggestions={true}
      />

      <button type="submit" disabled={!isAvailable}>
        Book Appointment
      </button>
    </form>
  );
};
```

### 3. Get Doctor's Schedule

```javascript
import availabilityService from '../../services/availabilityService';

// In your component
const viewDoctorSchedule = async (doctorId, date) => {
  try {
    const result = await availabilityService.getDoctorSchedule(doctorId, date);
    
    if (result.success) {
      console.log('Schedule:', result.schedule);
      console.log('Utilization:', result.schedule.utilizationPercentage + '%');
      console.log('Free slots:', result.schedule.freeSlots);
    }
  } catch (error) {
    console.error('Failed to get schedule:', error);
  }
};
```

### 4. Get Available Slots

```javascript
// Get available slots for specific duration
const getSlots = async (doctorId, date, duration = 30) => {
  try {
    const slots = await availabilityService.getAvailableSlots(doctorId, date, duration);
    
    // Display slots to user
    slots.forEach(slot => {
      console.log(slot.label); // e.g., "10:00 AM - 11:00 AM (60 min)"
    });
  } catch (error) {
    console.error('Failed to get slots:', error);
  }
};
```

## Component Props

### AvailabilityChecker Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `doctorId` | string | No | Doctor's ID to check availability |
| `patientId` | string | No | Patient's ID to check availability |
| `startAt` | Date/string | Yes | Start time of appointment |
| `endAt` | Date/string | No | End time (optional, will calculate from duration) |
| `duration` | number | No | Duration in minutes (default: 30) |
| `excludeAppointmentId` | string | No | Appointment ID to exclude (for editing) |
| `onAvailabilityChange` | function | No | Callback when availability changes |
| `autoCheck` | boolean | No | Auto-check when inputs change (default: true) |
| `showSuggestions` | boolean | No | Show available slot suggestions (default: true) |

## Best Practices

1. **Always check availability before booking**
   - Use the AvailabilityChecker component in appointment forms
   - Disable submit button if time slot is not available

2. **Show alternative time slots**
   - Display suggested available slots to users
   - Allow users to quickly select from available times

3. **Handle editing appointments**
   - Pass `excludeAppointmentId` when editing to exclude current appointment from conflict check

4. **Debounce checks**
   - The component automatically debounces API calls
   - Avoid manual checking on every keystroke

5. **Show visual feedback**
   - Use the built-in styling (green for available, yellow for conflicts)
   - Display conflict details clearly

6. **Working hours**
   - Default: 9 AM - 5 PM
   - Modify in backend if needed

## Error Handling

```javascript
try {
  const result = await availabilityService.checkAvailability({
    doctorId: 'doc-123',
    patientId: 'pat-456',
    startAt: new Date('2024-02-05T10:00:00Z'),
    duration: 30
  });
  
  if (!result.success) {
    // Handle API error
    console.error('Availability check failed');
  }
} catch (error) {
  if (error.response?.status === 403) {
    // Not authorized
    console.error('Not authorized to check availability');
  } else {
    // Network or other error
    console.error('Failed to check availability:', error);
  }
}
```

## Notes

- **Time Zone**: All times are stored in UTC, converted to local time on display
- **Cancelled Appointments**: Not counted as conflicts
- **No-Show Appointments**: Not counted as conflicts
- **Slot Duration**: Minimum 30 minutes recommended
- **Working Hours**: Configurable per clinic (default 9 AM - 5 PM)

## Example Workflow

1. User selects doctor and patient
2. User enters date and time
3. System automatically checks availability
4. If conflict exists:
   - Shows conflicting appointments
   - Suggests alternative time slots
   - Prevents booking
5. If available:
   - Shows green checkmark
   - Allows booking to proceed

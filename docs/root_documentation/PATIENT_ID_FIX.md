# Patient ID Lookup Fix

## Problem Identified

The appointment preview was failing with **404 Not Found** error:
```
GET https://hms-dev.onrender.com/api/patients/PAT-017 404 (Not Found)
```

## Root Cause

The code was trying to fetch patient details using **patientCode** (`PAT-017`) instead of the actual **patient UUID** (`3823b855-0dae-4193-a91c-241a77048b41`).

### Backend API Expectation
```
GET /api/patients/:id
```
Where `:id` must be the MongoDB `_id` (UUID), NOT the patientCode.

### Data Structure in Appointment
```javascript
{
  "patientId": {
    "_id": "3823b855-0dae-4193-a91c-241a77048b41",  // ← Need this!
    "firstName": "Rahul",
    "lastName": "Menon",
    "metadata": {
      "patientCode": "PAT-017"  // ← Was using this by mistake
    }
  }
}
```

## Solution Implemented

### 1. Store Original Patient Object in Transform
**File**: `modules/admin/appointments/Appointments.jsx`

```javascript
// Before:
return {
  patientId: patientCode || patientIdStr || `PT-${index}`,
  // ...
};

// After:
return {
  patientId: patientCode || patientIdStr || `PT-${index}`, // Display code
  patientIdObj: apt.patientId, // CRITICAL: Store original patient object with _id
  // ...
};
```

### 2. Extract UUID from Original Object
```javascript
const handlePatientNameClick = async (appointment) => {
  // Get original appointment with full patient object
  const originalApt = allAppointments.find(a => a.id === appointment.id);
  
  // Extract UUID (not patientCode!)
  if (originalApt && originalApt.patientIdObj) {
    patientUUID = originalApt.patientIdObj._id;  // ✅ Correct UUID
  }
  
  // Fetch using UUID
  const fullPatient = await patientsService.fetchPatientById(patientUUID);
};
```

### 3. Enrich with Appointment Metadata
Since the appointment often has richer metadata than the base patient record:

```javascript
// Add emergency contacts from appointment if not in patient record
if (appointmentMetadata.emergencyContactName) {
  fullPatient.emergencyContactName = appointmentMetadata.emergencyContactName;
  fullPatient.emergencyContactPhone = appointmentMetadata.emergencyContactPhone;
}

// Add insurance from appointment metadata
if (appointmentMetadata.insurance) {
  fullPatient.insuranceNumber = appointmentMetadata.insurance.policyNumber;
  fullPatient.expiryDate = appointmentMetadata.insurance.validUntil;
}

// Add medical history
if (appointmentMetadata.medicalHistory) {
  fullPatient.medicalHistory = appointmentMetadata.medicalHistory.currentConditions;
}
```

## Data Available from Appointment Metadata

The appointment response includes rich patient metadata:

```javascript
{
  "patientId": {
    "metadata": {
      "emergencyContactName": "Rajesh Kumar",
      "emergencyContactPhone": "+917913623344",
      "emergencyContactAddress": "829 Market Street, Karur",
      "insurance": {
        "provider": "Religare Health",
        "policyNumber": "INS157202A",
        "validFrom": "2025-09-24...",
        "validUntil": "2026-09-16...",
        "coverageAmount": 100000
      },
      "medicalHistory": {
        "currentConditions": ["Thyroid Disorder", "Hypertension"],
        "pastConditions": ["Hypertension", "Asthma"],
        "surgeries": ["Appendectomy", "Knee Surgery"]
      }
    }
  }
}
```

## Testing

After this fix:

1. ✅ Click on patient name in appointments → Dialog opens
2. ✅ Patient details load correctly (using UUID)
3. ✅ Emergency contact shows from appointment metadata
4. ✅ Insurance shows from appointment metadata  
5. ✅ Medical history shows from appointment metadata
6. ✅ No more 404 errors

## Key Takeaway

**Always use `_id` (UUID) for patient lookups, never `patientCode`!**

- `patientCode`: Display-only (e.g., "PAT-017")
- `_id`: Database lookup key (e.g., "3823b855-0dae-4193-a91c-241a77048b41")

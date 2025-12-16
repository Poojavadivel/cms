# Troubleshooting Blank Fields in Appointment Preview

## Problem
All fields in the Appointment Preview Dialog appear blank even though the component is loading.

## Root Cause Analysis

The React component is correctly mapping data from the backend response. The issue is likely:

1. **Patient records in database don't have the data**
2. **Data is stored in old format (flat fields instead of nested objects)**
3. **Backend response structure doesn't match expected format**

## Solution Steps

### Step 1: Check Browser Console

Open the appointment preview dialog and check console for these logs:

```
🔍 [PatientDetails.fromJSON] Raw data: {...}
📦 [PatientDetails] Extracted metadata: {...}
📦 [PatientDetails] Extracted addressObj: {...}
🔍 [AppointmentPreviewDialog] Received patient data: {...}
📋 [AppointmentPreviewDialog] Patient fields: {...}
```

**What to look for:**
- Is `address` an object or null?
- Is `metadata` an object or null?
- Is `vitals` an object or null?
- Are the individual fields empty strings or missing?

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Click on a patient name in appointments
3. Find the request: `GET /api/patients/:id`
4. Click on it and check the **Response** tab

**Expected response:**
```json
{
  "_id": "some-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "address": {
    "houseNo": "123",
    "street": "Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001",
    "country": "USA"
  },
  "vitals": {
    "heightCm": 175,
    "weightKg": 70,
    "bmi": 22.9,
    "spo2": 98
  },
  "metadata": {
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "1234567890",
    "insuranceNumber": "INS123456",
    "expiryDate": "2025-12-31"
  }
}
```

**If you see this instead:**
```json
{
  "_id": "some-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "address": null,   // ❌ Missing
  "metadata": {},    // ❌ Empty
  "vitals": null     // ❌ Missing
}
```

Then the patient record doesn't have the data in the database.

### Step 3: Check Database

Connect to MongoDB and run:

```javascript
db.patients.findOne({ _id: "patient-id-here" })
```

**Check if these fields exist:**
- `address` (should be an object)
- `vitals` (should be an object)
- `metadata` (should be an object)

**If they're missing or null**, the patient record needs to be updated.

### Step 4: Fix Patient Data

#### Option A: Update via Admin Panel (Recommended)
1. Go to Patients page
2. Click Edit on the patient
3. Fill in:
   - Address fields (House No, Street, City, State, Pincode, Country)
   - Emergency Contact (Name and Phone)
   - Insurance (Policy Number and Expiry Date)
   - Vitals (Height, Weight, BMI, SpO2)
4. Save

#### Option B: Update via MongoDB (For Testing)

Run this query to add sample data:

```javascript
db.patients.updateOne(
  { _id: "your-patient-id" },
  {
    $set: {
      address: {
        houseNo: "123",
        street: "Main Street",
        city: "New York",
        state: "NY",
        pincode: "10001",
        country: "USA"
      },
      vitals: {
        heightCm: 170,
        weightKg: 65,
        bmi: 22.5,
        bp: "120/80",
        pulse: 72,
        spo2: 98
      },
      metadata: {
        emergencyContactName: "Emergency Person",
        emergencyContactPhone: "9876543210",
        insuranceNumber: "INS-123456",
        expiryDate: "2025-12-31",
        medicalHistory: ["No significant history"]
      }
    }
  }
)
```

### Step 5: Verify Data Mapping

The React model (`src/models/Patients.js`) already has correct mapping:

```javascript
// ✅ Extracts from address object
houseNo: addressObj.houseNo?.toString() || json.houseNo?.toString() || '',
street: addressObj.street?.toString() || json.street?.toString() || '',

// ✅ Extracts from metadata object
emergencyContactName: metadata.emergencyContactName?.toString() || json.emergencyContactName?.toString() || '',

// ✅ Extracts from vitals object
height: PatientDetails._extractVital(json, 'heightCm', 'height'),
```

**This means:**
- If `address` object exists, it extracts from there
- Falls back to flat fields if object doesn't exist
- Same for metadata and vitals

## Common Scenarios

### Scenario 1: New Patient Record
**Symptom**: All fields blank for newly created patient
**Cause**: Patient created without optional fields
**Fix**: Edit patient and fill in missing information

### Scenario 2: Migrated Data
**Symptom**: Old patients have data, new ones don't
**Cause**: Old data might be in flat format, needs migration
**Fix**: Run data migration script or update manually

### Scenario 3: Backend Not Sending Data
**Symptom**: Database has data but React doesn't show it
**Cause**: Backend populate or lean() removing nested objects
**Fix**: Check `Server/routes/patients.js` GET /:id endpoint

## Quick Test

To verify the component is working correctly:

1. Create a test patient with complete data
2. Open appointment preview for that patient
3. Check if all tabs show data correctly

**Test patient data:**
```json
{
  "firstName": "Test",
  "lastName": "Patient",
  "phone": "1234567890",
  "address": {
    "houseNo": "456",
    "street": "Test Avenue",
    "city": "Test City",
    "state": "TS",
    "pincode": "54321",
    "country": "India"
  },
  "vitals": {
    "heightCm": 165,
    "weightKg": 60,
    "bmi": 22.0,
    "spo2": 97
  },
  "metadata": {
    "emergencyContactName": "Test Emergency",
    "emergencyContactPhone": "9999999999",
    "insuranceNumber": "TEST-INS-001",
    "expiryDate": "2026-12-31"
  }
}
```

## Verification Checklist

- [ ] Browser console shows patient data structure
- [ ] Network tab shows complete patient response
- [ ] Database has address, vitals, metadata objects
- [ ] Patient edit form saves data correctly
- [ ] Appointment preview shows "Not Provided" for missing fields
- [ ] Appointment preview shows actual data when available

## Expected Behavior

When data is properly stored:
- **Profile Tab**: Shows address, emergency contact, insurance with actual values
- **Medical History Tab**: Shows uploaded medical documents
- **Prescription Tab**: Shows medicines from uploaded prescriptions
- **Lab Results Tab**: Shows test results from uploaded reports
- **Billings Tab**: Shows sample billing data (until backend integration)

When data is missing:
- Fields show "Not Provided" in gray color
- No blank/empty rows
- User knows which information needs to be added

## Need More Help?

1. Share browser console logs (with patient data structure)
2. Share network tab response for GET /api/patients/:id
3. Share MongoDB query result for patient record
4. Check if server logs show any errors

## Files to Check

- **React Model**: `react/hms/src/models/Patients.js`
- **Component**: `react/hms/src/components/doctor/AppointmentPreviewDialog.jsx`
- **Backend Model**: `Server/Models/Patient.js`
- **Backend Route**: `Server/routes/patients.js`
- **Debug Guide**: `react/hms/DEBUG_DATA_MAPPING.md`

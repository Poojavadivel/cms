# Doctor Report - Debugging Guide

## Problem:
Doctor has patients and appointments in database, but report shows empty/no data.

## Root Causes:

### 1. **Doctor ID Mismatch**
- Doctor stored in `User` collection with one ID
- Doctor stored in `Staff` collection with different ID
- Patients reference one ID, appointments reference another
- **Solution:** Check both collections

### 2. **Field Not Set**
- `Patient.doctorId` field is `null` or empty string
- `Appointment.doctorId` field is `null` or empty string
- **Solution:** Search globally, check prescriptions array

### 3. **Case Sensitivity**
- Status field: `'Scheduled'` vs `'scheduled'`
- Multiple status variants in database
- **Solution:** Check multiple variants in queries

---

## Debug Steps Added:

### Step 1: Logging Added to Route
```javascript
console.log('[Doctor Report] Doctor ID: ${doctorId}, Patients found: ${patients.length}');
console.log('[Doctor Report] Weekly appointments found: ${weekAppointments.length}');
console.log('[Doctor Report] Total appointments found: ${totalAppointments.length}');
console.log('[Doctor Report] Active patients: ${activePatients.length}');
```

### Step 2: Global Patient Search
```javascript
// Try exact match
let patients = await Patient.find({ doctorId: doctorId });

// If no patients, search in prescriptions array
if (patients.length === 0) {
  patients = await Patient.find({ 'prescriptions.doctorId': doctorId });
}
```

### Step 3: Sample Data Check
```javascript
// Check if doctorId exists in any appointment
const anyAppointment = await Appointment.findOne().select('doctorId');
console.log('Sample appointment doctorId:', anyAppointment?.doctorId);
```

---

## How to Debug:

### 1. Start Server with Logs
```bash
cd Server
node Server.js
```

### 2. Trigger Doctor Report Download
- Go to Staff page
- Click any doctor
- Click "Download Report"

### 3. Check Console Output
Look for:
```
[Doctor Report] Doctor ID: abc-123-def-456, Patients found: 0
[Doctor Report] Sample appointment doctorId: xyz-789-ghi-012
[Doctor Report] Weekly appointments found: 0
[Doctor Report] Total appointments found: 0
```

**Analysis:**
- If `Doctor ID` ≠ `Sample appointment doctorId` → **ID MISMATCH**
- If `Patients found: 0` → **No patients assigned**
- If `Appointments found: 0` → **No appointments with this doctorId**

---

## Solutions:

### Solution 1: Doctor ID Mismatch

**Problem:** Doctor in Staff collection, but data references User collection ID

**Fix:**
```javascript
// Frontend should use correct doctor ID
// Check which collection doctor comes from

// If from Staff:
const staffDoctor = await Staff.findById(doctorId);
// Use staffDoctor._id for queries

// If from User:
const userDoctor = await User.findById(doctorId);
// Use userDoctor._id for queries
```

### Solution 2: Data Not Linked

**Problem:** Patients/Appointments don't have doctorId set

**Fix in Database:**
```javascript
// Update patients to link to doctor
await Patient.updateMany(
  { doctorId: null },
  { $set: { doctorId: 'correct-doctor-id' } }
);

// Update appointments to link to doctor
await Appointment.updateMany(
  { doctorId: null },
  { $set: { doctorId: 'correct-doctor-id' } }
);
```

### Solution 3: Wrong Collection

**Problem:** Looking in User collection, doctor is in Staff collection

**Fix:**
```javascript
// Route already handles this:
let doctor = await User.findById(doctorId);
if (!doctor) {
  doctor = await Staff.findById(doctorId);
}
```

---

## Manual Database Check:

### Check Doctors:
```javascript
db.users.find({ role: 'doctor' }, { _id: 1, firstName: 1, lastName: 1 })
db.staffs.find({}, { _id: 1, name: 1, designation: 1 })
```

### Check Patients:
```javascript
db.patients.find({ doctorId: 'doctor-id-here' }, { _id: 1, firstName: 1, lastName: 1, doctorId: 1 })
```

### Check Appointments:
```javascript
db.appointments.find({ doctorId: 'doctor-id-here' }, { _id: 1, appointmentCode: 1, doctorId: 1, patientId: 1 })
```

### Check for Orphaned Data:
```javascript
// Patients without doctor
db.patients.countDocuments({ $or: [{ doctorId: null }, { doctorId: '' }] })

// Appointments without doctor
db.appointments.countDocuments({ $or: [{ doctorId: null }, { doctorId: '' }] })
```

---

## Common Issues:

### Issue 1: "0 patients found"

**Reasons:**
- Doctor ID doesn't match
- Patients not assigned to this doctor
- doctorId field is null

**Check:**
```bash
# Look at console logs when downloading report
[Doctor Report] Doctor ID: abc-123
[Doctor Report] Patients found: 0
```

**Action:**
- Copy the Doctor ID from log
- Check database: `db.patients.find({ doctorId: 'abc-123' })`
- If empty, check: `db.patients.find({}).limit(5)` to see how doctorId is stored

---

### Issue 2: "0 appointments found"

**Reasons:**
- Doctor ID doesn't match
- No appointments created for this doctor
- Appointments use different doctorId

**Check:**
```bash
[Doctor Report] Total appointments found: 0
[Doctor Report] Sample appointment doctorId: xyz-789
```

**Action:**
- Compare doctor ID with sample appointment doctorId
- If different, there's an ID mismatch
- Check frontend: which ID is being sent to backend?

---

### Issue 3: Doctor not found

**Reasons:**
- Doctor ID doesn't exist in User or Staff collection
- Wrong ID sent from frontend

**Check:**
```bash
# Error response
{"success":false,"message":"Doctor not found"}
```

**Action:**
- Check frontend: `console.log('Downloading report for doctor:', doctorId);`
- Verify ID exists: `db.users.findOne({ _id: 'doctor-id' })`
- Or: `db.staffs.findOne({ _id: 'doctor-id' })`

---

## Test Checklist:

### Before Report Generation:
- [ ] Verify doctor exists in User or Staff collection
- [ ] Verify patients have doctorId field set
- [ ] Verify appointments have doctorId field set
- [ ] Verify doctorId values match across collections

### During Report Generation:
- [ ] Check console logs for doctor ID
- [ ] Check console logs for data counts
- [ ] Check for errors in console

### After Report Generation:
- [ ] PDF downloads successfully
- [ ] PDF contains patient data
- [ ] PDF contains appointment data
- [ ] Statistics show correct numbers

---

## Quick Fix Script:

If you know the correct doctor ID and need to link existing data:

```javascript
// Link all patients to specific doctor
const doctorId = 'correct-doctor-id-here';

await Patient.updateMany(
  { doctorId: null },
  { $set: { doctorId: doctorId } }
);

await Appointment.updateMany(
  { doctorId: null },
  { $set: { doctorId: doctorId } }
);

console.log('✅ Data linked to doctor');
```

---

## Status:

✅ Debug logging added to route
✅ Global patient search (checks prescriptions array)
✅ Console logs show data counts
✅ Sample appointment ID check
✅ Ready to debug live

## Next Steps:

1. Start server: `cd Server && node Server.js`
2. Download doctor report
3. Check console logs
4. Identify which data is missing
5. Check database manually
6. Fix data or ID mismatch

**DEBUG MODE ACTIVE - CHECK CONSOLE LOGS FOR DATA FLOW**

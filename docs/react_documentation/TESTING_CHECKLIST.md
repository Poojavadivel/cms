# 🎯 Quick Testing Checklist

## Hospital Management System - Workflow Verification

### Pre-requisites ✓
- [ ] Backend server running (`http://localhost:5000` or production URL)
- [ ] React app running (`http://localhost:3000`)
- [ ] Test credentials available for all roles
- [ ] Sample patient data ready

---

## 📝 Step-by-Step Testing Checklist

### ✅ STEP 1: Admin - Patient Creation
**URL**: `/admin/patients`

- [ ] Login as Admin successfully
- [ ] Navigate to Patients page
- [ ] Click "Add Patient" button opens modal
- [ ] Fill all required fields (Name, Age, Gender, Phone)
- [ ] Save patient successfully
- [ ] Patient appears in list with unique ID (PT-XXXX)
- [ ] Can search and find the created patient

**Expected Result**: ✅ Patient created and visible in list

---

### ✅ STEP 2: Admin - Appointment Creation
**URL**: `/admin/appointments`

- [ ] Navigate to Appointments page
- [ ] Click "New Appointment" button
- [ ] Patient dropdown shows created patient
- [ ] Select patient from dropdown
- [ ] Doctor dropdown shows available doctors
- [ ] Select doctor (e.g., Dr. Smith)
- [ ] Pick appointment date (today or future)
- [ ] Select time slot
- [ ] Enter service type (e.g., General Checkup)
- [ ] Set status to "Confirmed"
- [ ] Save appointment successfully
- [ ] Appointment appears in appointments list

**Expected Result**: ✅ Appointment created with patient and doctor assigned

---

### ✅ STEP 3: Doctor - View Appointment
**URL**: `/doctor/appointments`

- [ ] Logout from admin
- [ ] Login as Doctor (same doctor assigned in appointment)
- [ ] Navigate to Appointments page
- [ ] Created appointment is visible in list
- [ ] Patient name matches
- [ ] Appointment details are correct (date, time, service)
- [ ] Status shows "Confirmed"

**Expected Result**: ✅ Doctor can see their assigned appointment

---

### ✅ STEP 4: Doctor - Add Intake
**URL**: `/doctor/appointments` → **Click "Add Intake"**

#### 4.1 Open Intake Modal
- [ ] Click "Add Intake" button (clipboard icon)
- [ ] Intake modal opens
- [ ] Patient profile card displays correctly
- [ ] Patient name, age, gender show correctly

#### 4.2 Vitals Section
- [ ] Enter Height (e.g., 175 cm)
- [ ] Enter Weight (e.g., 70 kg)
- [ ] BMI auto-calculates correctly
- [ ] Enter SpO2 (e.g., 98%)
- [ ] All vitals fields accept input

#### 4.3 Clinical Notes
- [ ] Enter clinical notes/diagnosis
- [ ] Notes field accepts multi-line text
- [ ] Notes save properly

#### 4.4 Pharmacy Section (Medicines)
- [ ] Click "Add Medicine" button
- [ ] Medicine dropdown appears
- [ ] Search for medicine (e.g., Paracetamol)
- [ ] Medicine appears in search results
- [ ] Select medicine
- [ ] Enter dosage (e.g., 1-0-1)
- [ ] Enter duration (e.g., 3 days)
- [ ] Enter instructions (e.g., After food)
- [ ] Add second medicine (e.g., Cetrizine)
- [ ] Repeat for second medicine
- [ ] Both medicines appear in table
- [ ] Can edit medicine details
- [ ] Can delete medicine row

#### 4.5 Pathology Section (Tests)
- [ ] Click "Add Test" button
- [ ] Test name dropdown appears
- [ ] Search for test (e.g., CBC)
- [ ] Select test from dropdown
- [ ] Enter test instructions
- [ ] Add second test (e.g., Urine Routine)
- [ ] Both tests appear in table
- [ ] Can edit test details
- [ ] Can delete test row

#### 4.6 Stock Check
- [ ] Click "Check Stock" button (if available)
- [ ] Stock availability is verified
- [ ] Low stock warning appears if needed
- [ ] Can proceed even with warnings

#### 4.7 Save Intake
- [ ] Click "Save Intake" button
- [ ] Loading indicator appears
- [ ] Success message displays
- [ ] Modal closes after save
- [ ] Appointment status updates

**Expected Result**: ✅ Intake saved with vitals, notes, medicines, and tests

---

### ✅ STEP 5: Pharmacist - View Prescription
**URL**: `/pharmacist/prescriptions`

- [ ] Logout from doctor
- [ ] Login as Pharmacist
- [ ] Navigate to Prescriptions page
- [ ] Pending prescription appears for patient
- [ ] Patient name matches
- [ ] Doctor name shows correctly
- [ ] Prescription date is correct
- [ ] Status shows "Pending"

#### 5.1 View Details
- [ ] Click "View Details" button
- [ ] Medicine list displays
- [ ] Paracetamol shows with correct dosage (1-0-1)
- [ ] Cetrizine shows with correct dosage (0-0-1)
- [ ] Duration and instructions display
- [ ] All medicine details are accurate

#### 5.2 Dispense Prescription
- [ ] Click "Dispense" button
- [ ] Confirmation dialog appears
- [ ] Confirm dispensing
- [ ] Success message displays
- [ ] Prescription status changes to "Dispensed"
- [ ] Prescription moves from pending list
- [ ] Can view in "Dispensed" filter

#### 5.3 Stock Verification
- [ ] Navigate to Medicines page
- [ ] Check Paracetamol stock
- [ ] Stock reduced by dispensed quantity
- [ ] Check Cetrizine stock
- [ ] Stock reduced correctly

**Expected Result**: ✅ Prescription dispensed and stock updated

---

### ✅ STEP 6: Pathologist - View Test Reports
**URL**: `/pathologist/test-reports`

- [ ] Logout from pharmacist
- [ ] Login as Pathologist
- [ ] Navigate to Test Reports page
- [ ] Pending test reports appear
- [ ] CBC test shows for patient
- [ ] Urine Routine test shows for patient
- [ ] Status shows "Pending"
- [ ] Patient name matches
- [ ] Doctor name shows correctly

#### 6.1 View Test Details
- [ ] Click "View" button on CBC test
- [ ] Test details modal opens
- [ ] Patient information displays
- [ ] Test name shows correctly
- [ ] Collection date is correct
- [ ] Instructions display
- [ ] Modal closes properly

#### 6.2 Upload Test Results
- [ ] Click "Upload" button
- [ ] Upload modal opens
- [ ] File input accepts PDF
- [ ] Select test result PDF file
- [ ] Add comments/notes (optional)
- [ ] Click "Submit"
- [ ] Loading indicator appears
- [ ] Upload success message displays
- [ ] Status changes to "Completed"
- [ ] Test moves to completed list

#### 6.3 Download Report
- [ ] Find completed test report
- [ ] Click "Download" button
- [ ] PDF file downloads to computer
- [ ] File opens correctly
- [ ] Content matches uploaded file

**Expected Result**: ✅ Test results uploaded and downloadable

---

## 🎯 Final Verification

### Data Consistency Check
- [ ] Patient data consistent across all modules
- [ ] Appointment data accurate in admin and doctor views
- [ ] Prescription data matches intake medicines
- [ ] Test reports match intake pathology orders
- [ ] Stock changes reflected immediately

### Status Flow Check
- [ ] Appointment: Scheduled → Intake Added
- [ ] Prescription: Pending → Dispensed
- [ ] Test Report: Pending → Completed
- [ ] All status transitions work correctly

### Role-Based Access Check
- [ ] Admin can access all admin routes
- [ ] Doctor can only access doctor routes
- [ ] Pharmacist can only access pharmacy routes
- [ ] Pathologist can only access pathology routes
- [ ] Unauthorized routes redirect to /unauthorized

### API Integration Check
- [ ] All API calls succeed (check Network tab)
- [ ] No console errors
- [ ] Auth token sent in headers
- [ ] Response data parsed correctly
- [ ] Error handling works (try invalid data)

---

## 📊 Test Results Summary

| Module      | Status | Issues Found | Notes |
|-------------|--------|--------------|-------|
| Admin       | ⬜ Pass / ⬜ Fail | | |
| Doctor      | ⬜ Pass / ⬜ Fail | | |
| Pharmacist  | ⬜ Pass / ⬜ Fail | | |
| Pathologist | ⬜ Pass / ⬜ Fail | | |

---

## 🐛 Issues Tracker

| # | Issue Description | Module | Severity | Status |
|---|-------------------|--------|----------|--------|
| 1 | | | ⬜ High / ⬜ Medium / ⬜ Low | ⬜ Open / ⬜ Fixed |
| 2 | | | ⬜ High / ⬜ Medium / ⬜ Low | ⬜ Open / ⬜ Fixed |
| 3 | | | ⬜ High / ⬜ Medium / ⬜ Low | ⬜ Open / ⬜ Fixed |

---

## ✅ Sign-Off

**Tested By**: _______________________  
**Date**: _______________________  
**Environment**: ⬜ Development / ⬜ Staging / ⬜ Production  
**Overall Status**: ⬜ All Tests Pass / ⬜ Issues Found  

**Comments**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 📞 Support

If you encounter any issues:

1. Check browser console for JavaScript errors
2. Check Network tab for failed API calls
3. Verify backend server is running
4. Check authentication token in localStorage
5. Review server logs for backend errors

**Documentation**:
- Full Guide: `WORKFLOW_TESTING_GUIDE.md`
- Visual Flow: `FLOW_DIAGRAM.md`
- API Docs: `/Server/README.md`

---

**Happy Testing! 🚀**

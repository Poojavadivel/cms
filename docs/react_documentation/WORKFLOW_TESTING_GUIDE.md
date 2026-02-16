# Hospital Management System - Complete Workflow Testing Guide

## 🔄 Complete Patient Care Flow

This guide walks through the complete patient care workflow from patient registration to prescription fulfillment and pathology test results.

---

## 📋 Prerequisites

1. **Backend Server Running**: Ensure the Node.js backend server is running on `http://localhost:5000` or `https://hms-dev.onrender.com/api`
2. **React App Running**: Start the React app with `npm start` (runs on `http://localhost:3000`)
3. **Test Users**: Have credentials for Admin, Doctor, Pharmacist, and Pathologist roles

---

## 🏥 Workflow Steps

### **Step 1: Admin Login & Patient Creation** 👨‍💼

**Route**: `/admin`

#### 1.1 Login as Admin
- Navigate to `http://localhost:3000/login`
- Enter admin credentials
- You'll be redirected to `/admin/dashboard`

#### 1.2 Create a New Patient
- Navigate to **Admin → Patients** (`/admin/patients`)
- Click **"+ Add Patient"** button
- Fill in patient details:
  - **Name**: John Doe
  - **Age**: 35
  - **Gender**: Male
  - **Phone**: 9876543210
  - **Email**: john.doe@example.com
  - **Address**: 123 Main Street
  - **Blood Group**: O+
  - **Emergency Contact**: 9876543211
- Click **"Save"**
- Patient is created with a unique Patient ID (e.g., `PT-1234`)

**Files Involved**:
- `src/modules/admin/patients/Patients.jsx`
- `src/components/patient/addpatient.jsx`
- `src/services/patientsService.js`

---

### **Step 2: Admin Creates Appointment** 📅

**Route**: `/admin/appointments`

#### 2.1 Create Appointment
- Navigate to **Admin → Appointments** (`/admin/appointments`)
- Click **"+ New Appointment"** button
- Fill in appointment details:
  - **Patient**: Select "John Doe" from dropdown (searches patients)
  - **Doctor**: Select available doctor (e.g., Dr. Smith)
  - **Date**: Today or tomorrow
  - **Time**: 10:00 AM
  - **Service**: General Checkup
  - **Status**: Confirmed
- Click **"Create Appointment"**

**Files Involved**:
- `src/modules/admin/appointments/Appointments.jsx`
- `src/modules/admin/appointments/components/NewAppointmentForm.jsx`
- `src/services/appointmentsService.js`

**API Endpoint**: `POST /api/appointments`

---

### **Step 3: Doctor Login & View Appointment** 👨‍⚕️

**Route**: `/doctor`

#### 3.1 Login as Doctor
- Logout from admin
- Login with doctor credentials
- You'll be redirected to `/doctor/dashboard`

#### 3.2 View Appointments
- Navigate to **Doctor → Appointments** (`/doctor/appointments`)
- You should see the appointment for "John Doe" in the list
- Appointments are filtered to show only the logged-in doctor's appointments

**Files Involved**:
- `src/modules/doctor/appointments/Appointments.jsx`
- `src/services/appointmentsService.js`

---

### **Step 4: Doctor Adds Intake (Prescription & Tests)** 💊🔬

**Route**: `/doctor/appointments` → Click **"Add Intake"**

#### 4.1 Open Intake Form
- In the appointments list, find John Doe's appointment
- Click the **"Add Intake"** button (clipboard icon)
- The **Appointment Intake Modal** opens

#### 4.2 Fill Vitals Section
- **Height**: 175 cm
- **Weight**: 70 kg
- **BMI**: Auto-calculated (22.9)
- **SpO2**: 98%

#### 4.3 Add Current Notes
- **Notes**: Patient complains of fever and headache. Diagnosed with viral infection.

#### 4.4 Add Medicines (Pharmacy Section)
- Click **"+ Add Medicine"** button
- **Medicine 1**:
  - Name: Paracetamol 500mg
  - Dosage: 1-0-1
  - Duration: 3 days
  - Instructions: After food
- **Medicine 2**:
  - Name: Cetrizine 10mg
  - Dosage: 0-0-1
  - Duration: 5 days
  - Instructions: Before sleep
- Click **"Check Stock"** to verify availability

#### 4.5 Add Pathology Tests
- Click **"+ Add Test"** button
- **Test 1**:
  - Test Name: Complete Blood Count (CBC)
  - Instructions: Fasting required
- **Test 2**:
  - Test Name: Urine Routine
  - Instructions: Morning sample

#### 4.6 Add Follow-up (Optional)
- **Follow-up Date**: 1 week from today
- **Notes**: Review blood test results

#### 4.7 Save Intake
- Click **"Save Intake"** button
- System performs stock check for medicines
- If stock is low, a warning is shown but you can continue
- Data is saved to the appointment
- Prescriptions are automatically created for pharmacy
- Pathology reports are created with "Pending" status

**Files Involved**:
- `src/components/appointments/AppointmentIntakeModal.jsx`
- `src/components/appointments/PharmacyTable.jsx`
- `src/components/appointments/PathologyTable.jsx`
- `src/services/appointmentsService.js` → `updateIntake()`
- `src/services/pharmacyService.js` → `checkStockAvailability()`

**API Endpoints**:
- `PUT /api/appointments/:id/intake` - Save intake data
- `POST /api/pharmacy/prescriptions/create-from-intake` - Create prescriptions
- `POST /api/pathology/reports` - Create test reports

---

### **Step 5: Pharmacist Login & View Prescriptions** 💊

**Route**: `/pharmacist`

#### 5.1 Login as Pharmacist
- Logout from doctor
- Login with pharmacist credentials
- You'll be redirected to `/pharmacist/dashboard`

#### 5.2 View Pending Prescriptions
- Navigate to **Pharmacist → Prescriptions** (`/pharmacist/prescriptions`)
- You should see the prescription for "John Doe" with status **"Pending"**
- Prescription includes:
  - Patient Name: John Doe
  - Patient ID: PT-1234
  - Doctor: Dr. Smith
  - Date: Today
  - Medicines:
    - Paracetamol 500mg (1-0-1, 3 days)
    - Cetrizine 10mg (0-0-1, 5 days)

#### 5.3 View Medicine Details
- Click **"View Details"** to see full prescription
- Shows all medicine details, dosage, duration, instructions

#### 5.4 Dispense Prescription
- Click **"Dispense"** button
- Confirm dispensing
- Prescription status changes to **"Dispensed"**
- Medicine stock is automatically reduced

**Files Involved**:
- `src/modules/pharmacist/Prescriptions_Flutter.jsx`
- `src/services/pharmacyService.js` → `getPendingPrescriptions()`, `dispensePrescription()`

**API Endpoints**:
- `GET /api/pharmacy/pending-prescriptions` - Get all pending prescriptions
- `POST /api/pharmacy/prescriptions/:id/dispense` - Dispense prescription

---

### **Step 6: Pathologist Login & View Test Reports** 🔬

**Route**: `/pathologist`

#### 6.1 Login as Pathologist
- Logout from pharmacist
- Login with pathologist credentials
- You'll be redirected to `/pathologist/dashboard`

#### 6.2 View Pending Test Reports
- Navigate to **Pathologist → Test Reports** (`/pathologist/test-reports`)
- You should see test reports for "John Doe" with status **"Pending"**:
  - Complete Blood Count (CBC)
  - Urine Routine

#### 6.3 View Test Details
- Click **"View"** (eye icon) to see test details
- Shows:
  - Patient Name: John Doe
  - Patient ID: PT-1234
  - Test Name: Complete Blood Count (CBC)
  - Collection Date: Today
  - Status: Pending
  - Instructions: Fasting required

#### 6.4 Upload Test Results
- Click **"Upload"** button
- Select PDF file with test results
- Add notes/comments
- Click **"Submit"**
- Report status changes to **"Completed"**

#### 6.5 Download Test Report
- Once uploaded, click **"Download"** button
- PDF report is downloaded to your computer

**Files Involved**:
- `src/modules/pathologist/test-reports/TestReports.jsx`
- `src/services/pathologyService.js` → `fetchReports()`, `uploadReport()`, `downloadReport()`

**API Endpoints**:
- `GET /api/pathology/reports` - Get all pathology reports
- `POST /api/pathology/reports/:id/upload` - Upload test results
- `GET /api/pathology/reports/:id/download` - Download report

---

## 🔍 Verification Checklist

### ✅ Admin Module
- [ ] Can login as admin
- [ ] Can create new patient
- [ ] Can view patient list
- [ ] Can create appointment for patient
- [ ] Can view appointment list

### ✅ Doctor Module
- [ ] Can login as doctor
- [ ] Can view appointments (filtered by doctor)
- [ ] Can open intake form for appointment
- [ ] Can add vitals (height, weight, BMI, SpO2)
- [ ] Can add clinical notes
- [ ] Can add medicines with dosage and duration
- [ ] Can add pathology tests
- [ ] Can save intake successfully
- [ ] Stock check works for medicines

### ✅ Pharmacist Module
- [ ] Can login as pharmacist
- [ ] Can view pending prescriptions
- [ ] Can see all medicine details
- [ ] Can view prescription details
- [ ] Can dispense prescription
- [ ] Stock is reduced after dispensing

### ✅ Pathologist Module
- [ ] Can login as pathologist
- [ ] Can view pending test reports
- [ ] Can view test details
- [ ] Can upload test results (PDF)
- [ ] Can download completed reports
- [ ] Report status changes to "Completed"

---

## 🎯 Key Features Verified

### 1. **Patient Management**
- Patient creation with full details
- Patient search and filtering
- Patient profile view

### 2. **Appointment Management**
- Create appointment with patient and doctor
- View appointments by role (admin sees all, doctor sees own)
- Appointment status tracking

### 3. **Clinical Intake**
- Vitals recording (height, weight, BMI, SpO2)
- Clinical notes
- Medicine prescription with stock check
- Pathology test ordering
- Follow-up scheduling

### 4. **Pharmacy Integration**
- Prescription auto-creation from intake
- Pending prescriptions view
- Medicine details display
- Prescription dispensing
- Stock management

### 5. **Pathology Integration**
- Test report auto-creation from intake
- Pending tests view
- Test result upload
- Report download
- Status tracking

---

## 📊 Data Flow

```
Admin Creates Patient
    ↓
Admin Creates Appointment (Patient + Doctor)
    ↓
Doctor Views Appointment
    ↓
Doctor Adds Intake (Vitals + Notes + Medicines + Tests)
    ↓
    ├─→ Pharmacy Prescriptions Created (Pending)
    │       ↓
    │   Pharmacist Views Prescriptions
    │       ↓
    │   Pharmacist Dispenses Medicine
    │       ↓
    │   Stock Reduced
    │
    └─→ Pathology Reports Created (Pending)
            ↓
        Pathologist Views Test Reports
            ↓
        Pathologist Uploads Results
            ↓
        Report Status: Completed
```

---

## 🛠️ Technical Architecture

### Frontend (React)
- **Routing**: React Router with role-based routes
- **State Management**: React Hooks (useState, useEffect)
- **API Integration**: Axios with service layer
- **Authentication**: JWT token stored in localStorage
- **UI Components**: Custom components with Material Icons

### Backend (Node.js/Express)
- **Authentication**: JWT-based auth middleware
- **Database**: MongoDB with Mongoose
- **File Storage**: GridFS for PDF uploads
- **API**: RESTful API with role-based access control

### Key Services
- `authService.js` - Authentication and token management
- `patientsService.js` - Patient CRUD operations
- `appointmentsService.js` - Appointment management
- `pharmacyService.js` - Medicine and prescription management
- `pathologyService.js` - Test report management

---

## 🚨 Common Issues & Solutions

### Issue 1: Appointment not showing for doctor
**Solution**: Ensure appointment `doctorId` matches logged-in doctor's ID

### Issue 2: Stock check fails
**Solution**: Verify medicine exists in pharmacy inventory with sufficient stock

### Issue 3: Prescription not created
**Solution**: Check intake data includes pharmacy items before saving

### Issue 4: Test report upload fails
**Solution**: Ensure file is PDF and backend has GridFS configured

### Issue 5: Authentication errors
**Solution**: Check JWT token in localStorage and backend auth middleware

---

## 📝 Testing Credentials (Example)

```javascript
// Admin
Username: admin@hospital.com
Password: admin123

// Doctor
Username: doctor.smith@hospital.com
Password: doctor123

// Pharmacist
Username: pharmacist@hospital.com
Password: pharma123

// Pathologist
Username: pathologist@hospital.com
Password: patho123
```

---

## 🎉 Success Indicators

1. **Patient Created**: Patient appears in patients list with unique ID
2. **Appointment Created**: Appointment shows in both admin and doctor views
3. **Intake Saved**: Appointment has intake data with vitals, notes, medicines, tests
4. **Prescription Generated**: Pharmacist sees pending prescription
5. **Medicine Dispensed**: Prescription status changes, stock reduced
6. **Test Ordered**: Pathologist sees pending test report
7. **Results Uploaded**: Report status changes to completed, PDF downloadable

---

## 📚 Related Documentation

- **Backend API**: `/Server/README.md`
- **Pharmacy Implementation**: `PHARMACY_IMPLEMENTATION_COMPLETE.md`
- **Pathology Guide**: `PATHOLOGY_GUIDE.md`
- **Flutter UI Reference**: `FLUTTER_UI_IMPLEMENTATION.md`

---

## 🔗 Component Files Reference

### Admin Components
- `src/modules/admin/patients/Patients.jsx`
- `src/modules/admin/appointments/Appointments.jsx`
- `src/components/patient/addpatient.jsx`
- `src/modules/admin/appointments/components/NewAppointmentForm.jsx`

### Doctor Components
- `src/modules/doctor/appointments/Appointments.jsx`
- `src/components/appointments/AppointmentIntakeModal.jsx`
- `src/components/appointments/PharmacyTable.jsx`
- `src/components/appointments/PathologyTable.jsx`

### Pharmacist Components
- `src/modules/pharmacist/Prescriptions_Flutter.jsx`
- `src/modules/pharmacist/Dashboard_Flutter.jsx`
- `src/modules/pharmacist/Medicines_Table.jsx`

### Pathologist Components
- `src/modules/pathologist/test-reports/TestReports.jsx`
- `src/modules/pathologist/dashboard/Dashboard.jsx`

### Services
- `src/services/authService.js`
- `src/services/patientsService.js`
- `src/services/appointmentsService.js`
- `src/services/pharmacyService.js`
- `src/services/pathologyService.js`

---

## 🎯 Next Steps

1. **Test the complete flow** with real data
2. **Verify API responses** in browser DevTools Network tab
3. **Check console logs** for any errors
4. **Review backend logs** for API call tracking
5. **Test edge cases** (invalid data, missing fields, etc.)
6. **Performance testing** with multiple concurrent users

---

**Happy Testing! 🚀**

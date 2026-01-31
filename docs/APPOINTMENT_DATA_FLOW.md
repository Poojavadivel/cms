# APPOINTMENT DATA FLOW - KARUR HMS

## 📊 SUMMARY

**Frontend (React)** → **API Call** → **Backend (Node.js/Express)** → **MongoDB Collection**

---

## 🔄 DATA FLOW LOGIC

### 1. **Frontend Request**
- **File**: \eact/hms/src/modules/admin/appointments/Appointments.jsx\
- **Line 641**: \const data = await appointmentsService.fetchAppointments();\

### 2. **Service Layer**
- **File**: \eact/hms/src/services/appointmentsService.js\
- **Function**: \etchAppointments()\
- **API Endpoint**: \GET /api/appointments\
- **Full URL**: \https://hms-dev.onrender.com/api/appointments\

### 3. **Backend Route**
- **File**: \Server/routes/appointment.js\
- **Line 159-199**: GET all appointments handler
- **Route**: \outer.get('/', auth, async (req, res) => {...})\

### 4. **Database Query**
\\\javascript
const appointments = await Appointment.find(query)
  .populate('patientId', 'firstName lastName phone email bloodGroup metadata dateOfBirth gender patientCode')
  .populate('doctorId', 'firstName lastName email')
  .sort({ startAt: -1 })
  .lean();
\\\

### 5. **MongoDB Collection**
- **Collection Name**: \ppointments\
- **Model File**: \Server/Models/Appointment.js\
- **Database**: MongoDB (connected via mongoose)

---

## 📋 APPOINTMENT SCHEMA STRUCTURE

\\\javascript
{
  _id: String (UUID),
  appointmentCode: String (unique),
  patientId: String (ref: 'Patient'),
  doctorId: String (ref: 'User'),
  appointmentType: String (default: 'Consultation'),
  startAt: Date (required),
  endAt: Date,
  location: String,
  status: String (Scheduled/Confirmed/Pending/Completed/Cancelled/No-Show/Rescheduled),
  vitals: Object,
  notes: String,
  metadata: Object,
  followUp: { ... complex follow-up tracking ... },
  createdAt: Date,
  updatedAt: Date
}
\\\

---

## 🔍 FILTERING LOGIC

### Role-Based Access:
- **Admin/SuperAdmin**: Can see ALL appointments
- **Doctor**: Can only see their own appointments (\query.doctorId = userId\)

### Query Parameters:
- \doctorId\: Filter by specific doctor
- \patientId\: Filter by specific patient
- \hasFollowUp=true\: Filter follow-up appointments only

---

## 📝 DATA TRANSFORMATION

**Backend normalizes data before sending to frontend:**
1. Populates \patientId\ with patient details
2. Populates \doctorId\ with doctor details
3. Calculates patient age from \dateOfBirth\
4. Extracts \patientCode\ from patient metadata
5. Sorts by \startAt\ date (newest first)

**Frontend transforms again:**
\\\javascript
// File: Appointments.jsx, Line 450-574
const transformed = data.map((apt, index) => transformAppointment(apt, index));
\\\

This adds:
- Formatted dates
- Gender icons
- Doctor initials
- Status colors
- Avatar URLs

---

## 🔐 AUTHENTICATION

- Uses JWT token from localStorage
- Header: \x-auth-token\
- Middleware: \Server/Middleware/Auth.js\

---

## 🌐 API BASE URL

**Development**: \https://hms-dev.onrender.com/api\
**Configured in**: \eact/hms/src/services/apiConstants.js\

---

## 📦 COMPLETE ENDPOINT PATH

\GET https://hms-dev.onrender.com/api/appointments\

**Returns**: Array of appointment objects with populated patient and doctor details

---

## 🎯 KEY POINTS

1. ✅ Data comes from **MongoDB \ppointments\ collection**
2. ✅ Backend at **Server/routes/appointment.js**
3. ✅ Frontend service at **appointmentsService.js**
4. ✅ Displays in **Appointments.jsx** component
5. ✅ Uses **Mongoose populate** to join patient & doctor data
6. ✅ Applies **role-based filtering** for security
7. ✅ Sorted by **date descending** (newest first)


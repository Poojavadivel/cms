# Complete Routes Analysis - Hospital Management System

## 📱 **Project Structure Overview**

This HMS project consists of three main platforms:
1. **Flutter Mobile App** (lib/)
2. **React Web App** (react/hms/)
3. **Node.js Backend API** (Server/)

---

## 🌐 **BACKEND API ROUTES (Node.js/Express)**

### Base URL: `http://localhost:5000/api`

---

### 1️⃣ **Authentication Routes** (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | User login with email & password | ❌ |
| POST | `/refresh` | Refresh access token using refresh token | ❌ |
| POST | `/validate-token` | Validate current access token | ✅ |
| POST | `/signout` | Sign out user (invalidate tokens) | ✅ |
| POST | `/create-user` | Create new user account | ✅ (Admin) |
| POST | `/change-password` | Change user password | ✅ |

**Features:**
- JWT-based authentication with access & refresh tokens
- Secure password hashing with bcryptjs
- Session management via AuthSession model
- Device ID tracking for multi-device support

---

### 2️⃣ **Appointment Routes** (`/api/appointments`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create new appointment | ✅ |
| GET | `/` | Get all appointments (with filters) | ✅ |
| GET | `/deleted/list` | Get soft-deleted appointments | ✅ (Admin) |
| GET | `/:id` | Get appointment by ID | ✅ |
| PATCH | `/:id/status` | Update appointment status | ✅ |
| DELETE | `/:id` | Soft delete appointment | ✅ |
| PUT | `/:id` | Update appointment | ✅ |
| POST | `/:id/follow-up` | Create follow-up appointment | ✅ |
| GET | `/patient/:patientId/follow-ups` | Get patient follow-ups | ✅ |
| GET | `/:id/follow-up-chain` | Get appointment follow-up chain | ✅ |
| POST | `/check-availability` | Check doctor availability | ✅ |
| GET | `/doctor/:doctorId/schedule` | Get doctor schedule | ✅ |

**Features:**
- Doctor-patient appointment scheduling
- Follow-up appointment tracking
- Availability checking
- Status management (scheduled, completed, cancelled, etc.)

---

### 3️⃣ **Patient Routes** (`/api/patients`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create new patient | ✅ |
| GET | `/` | Get all patients (with pagination & filters) | ✅ |
| GET | `/:id` | Get patient by ID | ✅ |
| PUT | `/:id` | Update patient (full update) | ✅ |
| PATCH | `/:id` | Update patient (partial update) | ✅ |
| DELETE | `/:id` | Soft delete patient | ✅ (Admin) |

**Features:**
- Patient registration & management
- Search by name, phone, patient code
- Pagination support
- Doctor assignment

---

### 4️⃣ **Doctor Routes** (`/api/doctors`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all doctors | ✅ |
| GET | `/patients/my` | Get patients assigned to logged-in doctor | ✅ (Doctor) |

**Features:**
- Doctor listing
- Doctor-specific patient access

---

### 5️⃣ **Staff Routes** (`/api/staff`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create new staff member | ✅ (Admin) |
| GET | `/` | Get all staff members | ✅ |
| GET | `/:id` | Get staff by ID | ✅ |
| PUT | `/:id` | Update staff member | ✅ (Admin) |
| POST | `/generate-id` | Generate unique staff ID | ✅ (Admin) |
| PATCH | `/:id/status` | Update staff status (active/inactive) | ✅ (Admin) |
| GET | `/check-unique/:patientFacingId` | Check if ID is unique | ✅ (Admin) |
| DELETE | `/:id` | Soft delete staff member | ✅ (Admin) |

**Features:**
- Staff management (nurses, receptionists, etc.)
- Unique ID generation
- Status management
- Role assignment

---

### 6️⃣ **Pharmacy Routes** (`/api/pharmacy`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/summary` | Get pharmacy overview summary | ✅ |
| POST | `/medicines` | Add new medicine | ✅ (Admin/Pharmacist) |
| GET | `/medicines` | Get all medicines | ✅ |
| GET | `/medicines/:id` | Get medicine by ID | ✅ |
| PUT | `/medicines/:id` | Update medicine | ✅ (Admin/Pharmacist) |
| DELETE | `/medicines/:id` | Delete medicine | ✅ (Admin) |
| POST | `/batches` | Add medicine batch | ✅ (Pharmacist) |
| GET | `/batches` | Get all batches | ✅ |
| PUT | `/batches/:id` | Update batch | ✅ (Pharmacist) |
| DELETE | `/batches/:id` | Delete batch | ✅ (Admin) |
| POST | `/records/dispense` | Dispense medication | ✅ (Pharmacist) |
| GET | `/records` | Get dispense records | ✅ |
| GET | `/records/:id` | Get dispense record by ID | ✅ |
| GET | `/pending-prescriptions` | Get pending prescriptions | ✅ (Pharmacist) |
| GET | `/prescriptions` | Get all prescriptions | ✅ |
| DELETE | `/prescriptions/:id` | Delete prescription | ✅ (Admin) |
| POST | `/prescriptions/create-from-intake` | Create prescription from patient intake | ✅ (Doctor) |
| POST | `/prescriptions/:intakeId/dispense` | Dispense prescription | ✅ (Pharmacist) |
| GET | `/prescriptions/:intakeId/pdf` | Download prescription PDF | ✅ |
| GET | `/admin/analytics` | Pharmacy analytics | ✅ (Admin) |
| GET | `/admin/low-stock` | Get low stock items | ✅ (Admin/Pharmacist) |
| GET | `/admin/expiring-batches` | Get expiring batches | ✅ (Admin/Pharmacist) |
| POST | `/admin/bulk-import` | Bulk import medicines | ✅ (Admin) |
| GET | `/admin/inventory-report` | Get inventory report | ✅ (Admin) |
| GET | `/patients/:id` | Get patient pharmacy history | ✅ |

**Features:**
- Medicine inventory management
- Batch tracking with expiry dates
- Prescription management
- Stock alerts & analytics
- Bulk operations

---

### 7️⃣ **Pathology Routes** (`/api/pathology`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/pending-tests` | Get pending pathology tests | ✅ (Pathologist) |
| GET | `/tests` | Get all tests | ✅ |
| POST | `/reports` | Create lab report | ✅ (Pathologist) |
| GET | `/reports` | Get all lab reports | ✅ |
| GET | `/reports/:id` | Get lab report by ID | ✅ |
| PUT | `/reports/:id` | Update lab report | ✅ (Pathologist) |
| DELETE | `/reports/:id` | Delete lab report | ✅ (Admin) |
| GET | `/reports/:id/download` | Download lab report PDF | ✅ |

**Features:**
- Lab test management
- Report generation with PDF export
- Test status tracking
- Patient lab history

---

### 8️⃣ **Intake Routes** (`/api/intake`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/:id/intake` | Create patient intake record | ✅ (Doctor) |
| GET | `/:id/intake` | Get patient intake records | ✅ |
| GET | `/:id/intake/:intakeId` | Get specific intake record | ✅ |

**Features:**
- Patient visit/consultation records
- Vital signs tracking
- Diagnosis & treatment notes
- Integration with prescriptions

---

### 9️⃣ **Ward/Bed Management Routes** (`/api/beds`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all wards & beds | ✅ |
| GET | `/patients` | Get admitted patients | ✅ |
| PUT | `/:id/assign` | Assign patient to bed | ✅ (Admin) |
| PUT | `/:id/discharge` | Discharge patient from bed | ✅ (Admin/Doctor) |
| PUT | `/:id/mark-available` | Mark bed as available | ✅ (Admin) |

**Features:**
- Ward & bed allocation
- Real-time occupancy tracking
- Patient admission/discharge
- Bed availability status

---

### 🔟 **Dashboard Routes** (`/api/dashboard`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats` | Get comprehensive dashboard statistics | ✅ |
| GET | `/stats/quick` | Get quick stats overview | ✅ |
| GET | `/recent-activity` | Get recent system activity | ✅ |

**Features:**
- Patient count, appointments, revenue
- Department-wise statistics
- Recent activity logs

---

### 1️⃣1️⃣ **Payroll Routes** (`/api/payroll`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create payroll entry | ✅ (Admin) |
| GET | `/` | Get all payroll entries | ✅ (Admin) |
| GET | `/staff/:staffId` | Get payroll for specific staff | ✅ |
| GET | `/:id` | Get payroll entry by ID | ✅ (Admin) |
| PUT | `/:id` | Update payroll entry | ✅ (Admin) |
| PATCH | `/:id/approve` | Approve payroll | ✅ (Admin) |
| PATCH | `/:id/reject` | Reject payroll | ✅ (Admin) |
| PATCH | `/:id/process-payment` | Process payment | ✅ (Admin) |
| PATCH | `/:id/mark-paid` | Mark as paid | ✅ (Admin) |
| POST | `/:id/calculate` | Calculate payroll amount | ✅ (Admin) |
| POST | `/bulk/generate` | Generate bulk payroll | ✅ (Admin) |
| GET | `/summary/stats` | Get payroll statistics | ✅ (Admin) |
| DELETE | `/:id` | Delete payroll entry | ✅ (Admin) |

**Features:**
- Staff payroll management
- Approval workflow
- Payment tracking
- Bulk generation
- Statistics & reports

---

### 1️⃣2️⃣ **Reports Routes** (`/api/reports` & `/api/reports-proper`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/patient/:patientId` | Generate patient medical report PDF | ✅ |
| GET | `/doctor/:doctorId` | Generate doctor activity report PDF | ✅ |
| GET | `/staff/:staffId` | Generate staff report PDF | ✅ (Admin) |
| GET | `/payroll/:id` | Generate payroll slip PDF | ✅ (Admin) |
| GET | `/pathology/:id` | Generate pathology report PDF | ✅ |

**Features:**
- PDF report generation
- Professional formatting
- Comprehensive data aggregation

---

### 1️⃣3️⃣ **AI Bot Routes** (`/api/bot`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Check bot health status | ❌ |
| GET | `/metrics` | Get bot performance metrics | ✅ (Admin) |
| POST | `/chat` | Send message to AI chatbot | ✅ |
| GET | `/chats` | Get user's chat history | ✅ |
| GET | `/chats/:id` | Get specific chat conversation | ✅ |
| DELETE | `/chats/:id` | Delete chat conversation | ✅ |
| POST | `/feedback` | Submit chat feedback | ✅ |

**Features:**
- OpenAI-compatible AI integration
- Patient query handling
- Medical information assistance
- Chat history tracking
- Circuit breaker for API resilience

---

### 1️⃣4️⃣ **Scanner Enterprise Routes** (`/api/scanner-enterprise`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/scan-medical` | Scan medical document with AI | ✅ |
| POST | `/bulk-upload-with-matching` | Bulk upload with patient matching | ✅ (Admin) |
| GET | `/pdf-public/:pdfId` | Get public PDF access | ❌ |
| GET | `/health` | Scanner service health check | ✅ |
| GET | `/verification/:verificationId` | Get verification data | ✅ |
| GET | `/verification/patient/:patientId` | Get patient verifications | ✅ |
| PUT | `/verification/:verificationId/row/:rowIndex` | Update verification row | ✅ |
| DELETE | `/verification/:verificationId/row/:rowIndex` | Delete verification row | ✅ |
| POST | `/verification/:verificationId/confirm` | Confirm verification | ✅ |
| POST | `/verification/:verificationId/reject` | Reject verification | ✅ |
| GET | `/prescriptions/:patientId` | Get scanned prescriptions | ✅ |
| GET | `/lab-reports/:patientId` | Get scanned lab reports | ✅ |
| GET | `/medical-history/:patientId` | Get scanned medical history | ✅ |

**Features:**
- LandingAI integration for document scanning
- Medical document OCR (prescriptions, lab reports)
- Data verification workflow
- Intelligent patient matching
- Multi-file bulk processing

---

### 1️⃣5️⃣ **Card Routes** (`/api/card`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:patientId` | Get patient card/ID information | ✅ |

---

### 1️⃣6️⃣ **API Analytics Routes** (`/api/analytics`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/today` | Get today's API usage | ✅ (Admin) |
| GET | `/daily/:days?` | Get daily usage statistics | ✅ (Admin) |
| GET | `/user/:userId` | Get user-specific analytics | ✅ (Admin) |
| GET | `/models` | Get AI model usage stats | ✅ (Admin) |
| GET | `/errors` | Get API error logs | ✅ (Admin) |
| GET | `/logs` | Get all API logs | ✅ (Admin) |
| GET | `/log/:id` | Get specific log entry | ✅ (Admin) |
| GET | `/summary` | Get analytics summary | ✅ (Admin) |

**Features:**
- Request tracking
- Performance monitoring
- Error logging
- Usage analytics

---

### 1️⃣7️⃣ **Telegram Bot Routes** (`/api/telegram`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/webhook` | Telegram webhook endpoint | ❌ |
| GET | `/health` | Bot health check | ✅ |

**Features:**
- Gemini AI integration
- Appointment booking via Telegram
- Patient query handling

---

## ⚛️ **REACT WEB APP ROUTES**

### Base Structure: React Router v6 with nested routes

### **Public Routes** (No authentication required)
| Path | Component | Description |
|------|-----------|-------------|
| `/` | SplashScreen | Entry point with auth check & redirect |
| `/login` | LoginPage | User authentication page |
| `/forgot-password` | ForgotPasswordPage | Password recovery |
| `/reset-password/:token` | ResetPasswordPage | Reset password with token |
| `/unauthorized` | UnauthorizedPage | Access denied page |
| `/404` | NotFoundPage | 404 error page |

---

### **Protected Routes** (Authentication required)
| Path | Component | Description | Roles |
|------|-----------|-------------|-------|
| `/profile` | ProfilePage | User profile (Coming Soon) | All |
| `/settings` | SettingsPage | User settings (Coming Soon) | All |

---

### **Admin Routes** (`/admin/*`)
**Base:** RoleBasedRoute (admin, superadmin only)  
**Layout:** AdminRoot (with navigation sidebar)

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | Redirect to `/admin/dashboard` | Auto-redirect |
| `/admin/dashboard` | AdminDashboard | Overview & statistics |
| `/admin/users` | AdminUsers | User management |
| `/admin/appointments` | AdminAppointments | Appointment management |
| `/admin/patients` | AdminPatients | Patient records |
| `/admin/staff` | AdminStaff | Staff management |
| `/admin/pharmacy` | AdminPharmacy | Pharmacy inventory |
| `/admin/invoice` | AdminInvoice | Billing & invoices |
| `/admin/pathology` | AdminPathology | Lab test management |
| `/admin/ward-map` | AdminWardMap | Ward/bed allocation |
| `/admin/settings` | AdminSettings | System settings |

---

### **Doctor Routes** (`/doctor/*`)
**Base:** RoleBasedRoute (doctor only)  
**Layout:** DoctorRoot

| Path | Component | Description |
|------|-----------|-------------|
| `/doctor` | Redirect to `/doctor/dashboard` | Auto-redirect |
| `/doctor/dashboard` | DoctorDashboard | Doctor's overview |
| `/doctor/appointments` | DoctorAppointments | Manage appointments |
| `/doctor/patients` | DoctorPatients | Patient list & records |
| `/doctor/schedule` | DoctorSchedule | Doctor's schedule |
| `/doctor/settings` | DoctorSettings | Personal settings |

---

### **Pharmacist Routes** (`/pharmacist/*`)
**Base:** RoleBasedRoute (pharmacist only)  
**Layout:** PharmacistRoot

| Path | Component | Description |
|------|-----------|-------------|
| `/pharmacist` | Redirect to `/pharmacist/dashboard` | Auto-redirect |
| `/pharmacist/dashboard` | PharmacistDashboard (Flutter-style) | Overview |
| `/pharmacist/medicines` | PharmacistMedicines (Table) | Medicine inventory |
| `/pharmacist/prescriptions` | PharmacistPrescriptions | Prescription management |
| `/pharmacist/settings` | PharmacistSettings | Settings |

---

### **Pathologist Routes** (`/pathologist/*`)
**Base:** RoleBasedRoute (pathologist only)  
**Layout:** PathologistRoot

| Path | Component | Description |
|------|-----------|-------------|
| `/pathologist` | Redirect to `/pathologist/dashboard` | Auto-redirect |
| `/pathologist/dashboard` | PathologistDashboard | Lab overview |
| `/pathologist/test-reports` | PathologistTestReports | Manage lab reports |
| `/pathologist/patients` | PathologistPatients | Patient lab history |
| `/pathologist/settings` | PathologistSettings | Settings |

---

### **Route Protection Mechanism**

1. **ProtectedRoute Component:**
   - Checks authentication token
   - Redirects to `/login` if not authenticated

2. **RoleBasedRoute Component:**
   - Checks user role
   - Redirects to `/unauthorized` if role not allowed
   - Props: `allowedRoles={['admin', 'doctor', ...]}`

3. **Lazy Loading:**
   - All pages use `React.lazy()` for code splitting
   - `<Suspense>` with LoadingFallback for better UX

---

## 📱 **FLUTTER MOBILE APP ROUTES**

### Navigation Structure: Imperative Navigation (MaterialPageRoute)

### **Entry Point**
```dart
main.dart → ConnectivityWrapper → SplashPage
```

### **SplashPage Routing Logic**
```dart
if (not authenticated) → LoginPage
else if (role == 'admin') → AdminRootPage
else if (role == 'doctor') → DoctorRootPage
else if (role == 'pharmacist') → PharmacistRootPage
else if (role == 'pathologist') → PathologistRootPage
else → LoginPage (fallback)
```

---

### **Module Structure**

#### **Common Module** (`lib/Modules/Common/`)
- SplashPage
- LoginPage
- NoInternetPage

#### **Admin Module** (`lib/Modules/Admin/`)
- AdminRootPage (Bottom Navigation)
- Dashboard
- Patient Management
- Appointment Management
- Staff Management
- Pharmacy Module
- Pathology Module
- Ward Map
- Settings

#### **Doctor Module** (`lib/Modules/Doctor/`)
- DoctorRootPage (Bottom Navigation)
- Dashboard
- Patient List
- Appointment Management
- Schedule
- Prescriptions
- Settings

#### **Pharmacist Module** (`lib/Modules/Pharmacist/`)
- PharmacistRootPage (Bottom Navigation)
- Dashboard
- Medicine Inventory
- Prescription Management
- Stock Alerts
- Settings

#### **Pathologist Module** (`lib/Modules/Pathologist/`)
- PathologistRootPage (Bottom Navigation)
- Dashboard
- Test Management
- Lab Reports
- Patient History
- Settings

---

### **Navigation Features**
- **Bottom Navigation Bar** (5 tabs per role)
- **Drawer Navigation** (additional options)
- **Role-based UI** (different screens per role)
- **Deep Linking** support
- **Offline Mode** detection with NoInternetPage

---

## 🔐 **Authentication Flow**

### **1. Login Process**
```
User enters credentials → POST /api/auth/login
→ Returns: { accessToken, refreshToken, user }
→ Store tokens in localStorage/SharedPreferences
→ Navigate based on role
```

### **2. Token Refresh**
```
Access token expires → POST /api/auth/refresh
→ Returns new accessToken
→ Update stored token
```

### **3. Token Validation**
```
App startup → POST /api/auth/validate-token
→ If valid: proceed to dashboard
→ If invalid: redirect to login
```

### **4. Logout**
```
User clicks logout → POST /api/auth/signout
→ Clear tokens
→ Navigate to login page
```

---

## 📊 **Data Flow Summary**

### **Typical User Journey:**

1. **Patient Registration:**
   ```
   POST /api/patients → Create patient record
   ```

2. **Appointment Booking:**
   ```
   POST /api/appointments/check-availability → Check doctor schedule
   POST /api/appointments → Book appointment
   ```

3. **Doctor Consultation:**
   ```
   POST /api/intake/:id/intake → Record vitals & diagnosis
   POST /api/pharmacy/prescriptions/create-from-intake → Create prescription
   ```

4. **Pharmacy Dispensing:**
   ```
   GET /api/pharmacy/pending-prescriptions → View pending
   POST /api/pharmacy/prescriptions/:intakeId/dispense → Dispense medicine
   ```

5. **Lab Tests:**
   ```
   POST /api/pathology/reports → Upload lab report
   GET /api/pathology/reports/:id/download → Download PDF
   ```

6. **Reporting:**
   ```
   GET /api/reports/patient/:patientId → Generate comprehensive report
   ```

---

## 🛠️ **Technical Stack**

### **Backend:**
- Node.js + Express.js
- MongoDB (Mongoose ODM)
- JWT Authentication
- Multer (file uploads)
- PDFKit (PDF generation)
- OpenAI API (chatbot)
- LandingAI (document scanning)

### **Frontend (React):**
- React 18
- React Router v6
- Axios (API calls)
- Material-UI / Custom components
- Lazy loading + Code splitting

### **Mobile (Flutter):**
- Flutter 3.x
- Provider (state management)
- SharedPreferences (local storage)
- HTTP package (API calls)
- Connectivity Plus (network detection)

---

## 🚀 **Key Features**

✅ **Multi-platform:** Web (React) + Mobile (Flutter)  
✅ **Role-based Access Control:** Admin, Doctor, Pharmacist, Pathologist  
✅ **Real-time Data:** Live updates across modules  
✅ **AI Integration:** Chatbot + Document scanning  
✅ **PDF Generation:** Reports, prescriptions, invoices  
✅ **Offline Support:** Mobile app works without internet (limited)  
✅ **Comprehensive Analytics:** Dashboard statistics + API monitoring  
✅ **Security:** JWT tokens, password hashing, input validation  
✅ **Scalability:** Microservices-ready architecture  

---

## 📝 **Notes**

- **API Base URL:** Default is `http://localhost:5000/api`
- **Authentication:** Required for most endpoints (except login, public PDFs)
- **Error Handling:** Consistent JSON error responses
- **CORS:** Enabled for all origins (configure in production)
- **File Uploads:** Handled via `/uploads` directory
- **Database:** MongoDB with UUID-based primary keys

---

## 🔗 **Related Documentation**

- LAB_REPORTS_CRITICAL_BUG_FIX.md
- LAB_REPORTS_DEBUGGING_GUIDE.md
- LAB_REPORT_DATA_FLOW_MAP.md
- LANDING_AI_OVERVIEW.md
- MEDICAL_HISTORY_INTEGRATION.md

---

**Last Updated:** March 2, 2026  
**Version:** 1.0.0  
**Generated by:** GitHub Copilot CLI

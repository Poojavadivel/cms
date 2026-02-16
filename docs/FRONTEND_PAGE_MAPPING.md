# Frontend Page Mapping Documentation
## Karur Gastro Hospital Management System - Flutter Application

**Version:** 1.0  
**Last Updated:** 2024-12-04  
**Platform:** Flutter (Cross-platform: Web, Android, iOS)

---

## Table of Contents

1. [Common Pages](#common-pages)
2. [Admin Module](#admin-module)
3. [Doctor Module](#doctor-module)
4. [Pharmacist Module](#pharmacist-module)
5. [Pathologist Module](#pathologist-module)
6. [Shared Widgets](#shared-widgets)
7. [Models](#models)
8. [Services](#services)
9. [Navigation Flow](#navigation-flow)

---

## Common Pages

### 🔐 Authentication & Initial Screens

| Screen Name | File Path | Description | Route | Access |
|-------------|-----------|-------------|-------|--------|
| **Splash Screen** | `lib/Modules/Common/SplashPage.dart` | App initialization screen with logo animation | `/splash` | Public |
| **Login Page** | `lib/Modules/Common/LoginPage.dart` | User authentication with email/password + CAPTCHA | `/login` | Public |
| **No Internet Screen** | `lib/Modules/Common/no_internet_screen.dart` | Offline mode indicator | `/no-internet` | Public |

### 💬 Communication

| Screen Name | File Path | Description | Route | Access |
|-------------|-----------|-------------|-------|--------|
| **Chatbot Widget** | `lib/Modules/Common/ChatbotWidget.dart` | Basic AI assistant for help | Overlay | All Users |
| **Enterprise Chatbot** | `lib/Modules/Common/EnterpriseChatbotWidget.dart` | Advanced AI assistant with OpenAI integration | Overlay | All Users |

### 💊 Shared Medical Pages

| Screen Name | File Path | Description | Route | Access |
|-------------|-----------|-------------|-------|--------|
| **Unified Medicines Page** | `lib/Modules/Common/unified_medicines_page.dart` | Common medicine catalog browser | `/medicines` | All Users |

---

## Admin Module

**Base Path:** `lib/Modules/Admin/`

### 📊 Core Admin Pages

| Screen Name | File Path | Description | Route | Access |
|-------------|-----------|-------------|-------|--------|
| **Admin Root Page** | `RootPage.dart` | Main admin navigation container with sidebar | `/admin` | Admin Only |
| **Admin Dashboard** | `DashboardPage.dart` | Overview with analytics, charts, calendar, and KPIs | `/admin/dashboard` | Admin Only |
| **Patients Management** | `PatientsPage.dart` | Patient records, search, add/edit patients | `/admin/patients` | Admin Only |
| **Appointments** | `AppoimentsScreen.dart` | Appointment scheduling and management | `/admin/appointments` | Admin Only |
| **Pharmacy Management** | `PharmacyPage.dart` | Medicine inventory, batches, dispensing | `/admin/pharmacy` | Admin Only |
| **Pathology Lab** | `PathalogyScreen.dart` | Lab reports and test management | `/admin/pathology` | Admin Only |
| **Pathology (Clean)** | `PathalogyScreen_clean.dart` | Refactored pathology screen | `/admin/pathology-v2` | Admin Only |
| **Staff Management** | `StaffPage.dart` | Staff records, roles, departments | `/admin/staff` | Admin Only |
| **Payroll Management** | `PayrollPageEnterprise.dart` | Enterprise payroll with salary components | `/admin/payroll` | Admin Only |
| **Invoices** | `InvoicePage.dart` | Financial invoices and billing | `/admin/invoices` | Admin Only |
| **Settings** | `SettingsPage.dart` | Admin configuration and preferences | `/admin/settings` | Admin Only |
| **Help** | `HelpPage.dart` | Documentation and support | `/admin/help` | Admin Only |

### 🔧 Admin Widgets (Sub-components)

| Widget Name | File Path | Description | Used In |
|-------------|-----------|-------------|---------|
| **Enterprise Patient Form** | `widgets/enterprise_patient_form.dart` | Advanced patient registration form | PatientsPage |
| **Enterprise Pharmacy Form** | `widgets/enterprise_pharmacy_form.dart` | Medicine/batch entry form | PharmacyPage |
| **Generic Data Table** | `widgets/generic_data_table.dart` | Reusable table component | Multiple pages |
| **Payroll Detail Enhanced** | `widgets/PayrollDetailEnhanced.dart` | Detailed payroll view popup | PayrollPage |
| **Payroll Form Enhanced** | `widgets/PayrollFormEnhanced.dart` | Payroll creation/edit form | PayrollPage |
| **Pharmacy Analytics** | `widgets/pharmacy_analytics_widget.dart` | Pharmacy statistics dashboard | PharmacyPage |
| **Staff Popup** | `widgets/staffpopup.dart` | Staff add/edit dialog | StaffPage |
| **Staff View** | `widgets/Staffview.dart` | Staff detail view | StaffPage |

---

## Doctor Module

**Base Path:** `lib/Modules/Doctor/`

### 🩺 Core Doctor Pages

| Screen Name | File Path | Description | Route | Access |
|-------------|-----------|-------------|-------|--------|
| **Doctor Root Page** | `RootPage.dart` | Main doctor navigation with sidebar | `/doctor` | Doctor Only |
| **Doctor Dashboard** | `DashboardPage.dart` | Legacy dashboard with patient overview | `/doctor/dashboard` | Doctor Only |
| **Doctor Dashboard (New)** | `DashboardPageNew.dart` | Enterprise single-screen dashboard (NO SCROLL) | `/doctor/dashboard-v2` | Doctor Only |
| **Patients List** | `PatientsPage.dart` | Doctor's assigned patients | `/doctor/patients` | Doctor Only |
| **Schedule Page** | `SchedulePage.dart` | Legacy appointment calendar | `/doctor/schedule` | Doctor Only |
| **Schedule Page (New)** | `SchedulePageNew.dart` | Enhanced appointment calendar with filters | `/doctor/schedule-v2` | Doctor Only |
| **Follow-Up Management** | `FollowUpManagementScreen.dart` | Comprehensive follow-up tracking system | `/doctor/follow-ups` | Doctor Only |
| **Settings** | `SettingsPAge.dart` | Doctor preferences | `/doctor/settings` | Doctor Only |

### 🔧 Doctor Widgets (Sub-components)

| Widget Name | File Path | Description | Used In |
|-------------|-----------|-------------|---------|
| **Add New Appointment** | `widgets/Addnewappoiments.dart` | Appointment creation dialog | SchedulePage |
| **Appointments Table** | `widgets/Appoimentstable.dart` | Appointment list view | SchedulePage |
| **Appointment Preview** | `widgets/doctor_appointment_preview.dart` | Quick appointment details | DashboardPage |
| **Edit Appointment** | `widgets/Editappoimentspage.dart` | Appointment modification form | SchedulePage |
| **Enhanced Pharmacy Table** | `widgets/enhanced_pharmacy_table.dart` | Medicine dispensing table | IntakeForm |
| **Eye Icon** | `widgets/eyeicon.dart` | Custom visibility toggle | Multiple |
| **Follow-Up Calendar Popup** | `widgets/follow_up_calendar_popup.dart` | Calendar picker for follow-ups | FollowUpScreen |
| **Follow-Up Dialog** | `widgets/follow_up_dialog.dart` | Create follow-up appointment | PatientsPage |
| **Intake Form** | `widgets/intakeform.dart` | **PRIMARY PATIENT CONSULTATION FORM** | PatientsPage |
| **Intake Form (Backup)** | `widgets/intakeform_backup.dart` | Previous version backup | N/A |
| **Patient Follow-Up Popup** | `widgets/patient_followup_popup.dart` | Follow-up details view | PatientsPage |
| **Patient Table** | `widgets/table.dart` | Patient list table | PatientsPage |

---

## Pharmacist Module

**Base Path:** `lib/Modules/Pharmacist/`

### 💊 Core Pharmacist Pages

| Screen Name | File Path | Description | Route | Access |
|-------------|-----------|-------------|-------|--------|
| **Pharmacist Root Page** | `root_page.dart` | Main pharmacist navigation | `/pharmacist` | Pharmacist Only |
| **Pharmacist Dashboard** | `dashboard_page.dart` | Pharmacy overview with pending prescriptions | `/pharmacist/dashboard` | Pharmacist Only |
| **Dashboard (Old Backup)** | `dashboard_page_old_backup.dart` | Previous version backup | N/A | N/A |
| **Medicines Management** | `medicines_page.dart` | Medicine catalog management | `/pharmacist/medicines` | Pharmacist Only |
| **Medicines (Enterprise)** | `medicines_page_enterprise.dart` | Advanced medicine inventory with batches | `/pharmacist/medicines-v2` | Pharmacist Only |
| **Prescriptions** | `prescriptions_page.dart` | Pending prescriptions to dispense | `/pharmacist/prescriptions` | Pharmacist Only |
| **Settings** | `settings_page.dart` | Pharmacist preferences | `/pharmacist/settings` | Pharmacist Only |

---

## Pathologist Module

**Base Path:** `lib/Modules/Pathologist/`

### 🔬 Core Pathologist Pages

| Screen Name | File Path | Description | Route | Access |
|-------------|-----------|-------------|-------|--------|
| **Pathologist Root Page** | `root_page.dart` | Main pathologist navigation | `/pathologist` | Pathologist Only |
| **Pathologist Dashboard** | `dashboard_page.dart` | Lab overview with pending tests | `/pathologist/dashboard` | Pathologist Only |
| **Patients** | `patients_page.dart` | Patient list for lab tests | `/pathologist/patients` | Pathologist Only |
| **Test Reports** | `test_reports_page.dart` | Lab report management and upload | `/pathologist/reports` | Pathologist Only |
| **Settings** | `settings_page.dart` | Pathologist preferences | `/pathologist/settings` | Pathologist Only |

---

## Shared Widgets

**Base Path:** `lib/Widgets/`

| Widget Name | File Path | Description | Used In |
|-------------|-----------|-------------|---------|
| **Generic Enterprise Table** | `generic_enterprise_table.dart` | Reusable data table with sorting/filtering | Multiple modules |
| **Patient Profile Header** | `patient_profile_header_card.dart` | Patient info card header | Patient detail pages |

---

## Models

**Base Path:** `lib/Models/`

| Model Name | File Path | Description | Used In |
|------------|-----------|-------------|---------|
| **User** | `User.dart` | System user (doctor, admin, etc.) | Authentication |
| **Admin** | `Admin.dart` | Admin-specific model | Admin module |
| **Doctor** | `Doctor.dart` | Doctor-specific model | Doctor module |
| **Pharmacist** | `Pharmacist.dart` | Pharmacist-specific model | Pharmacist module |
| **Pathologist** | `Pathologist.dart` | Pathologist-specific model | Pathologist module |
| **Patient** | `Patients.dart` | Patient master data model | All modules |
| **Patient Vitals** | `patient_vitals.dart` | Vitals (BP, temp, pulse, etc.) | Intake form |
| **Staff** | `Staff.dart` | Staff member model | Admin module |
| **Payroll** | `Payroll.dart` | Payroll model | Admin module |
| **Appointment Draft** | `appointment_draft.dart` | Temporary appointment data | Appointment forms |
| **Dashboard Models** | `dashboardmodels.dart` | Dashboard statistics models | All dashboards |

---

## Services

**Base Path:** `lib/Services/`

| Service Name | File Path | Description | Used In |
|--------------|-----------|-------------|---------|
| **Auth Services** | `Authservices.dart` | Authentication and user management | All modules |
| **Report Service** | `ReportService.dart` | PDF report generation | Admin, Doctor |
| **API Constants** | `api_constants.dart` | API endpoint definitions | All services |

### Utility Services

**Base Path:** `lib/Utils/`

| Utility Name | File Path | Description | Used In |
|--------------|-----------|-------------|---------|
| **API Handler** | `Api_handler.dart` | HTTP request wrapper | All API calls |
| **Dio API Handler** | `dio_api_handler.dart` | Dio-based API client | Modern API calls |
| **Dio Client** | `dio_client.dart` | Dio singleton configuration | API calls |
| **Colors** | `Colors.dart` | App color palette | All screens |
| **Image URL Helper** | `image_url_helper.dart` | Image URL utilities | Profile images |

---

## Navigation Flow

### Authentication Flow

```
┌─────────────┐
│ SplashPage  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  LoginPage  │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────┐   ┌──────────┐
│  Admin  │   │  Doctor  │
└─────────┘   └──────────┘
       │             │
       ▼             ▼
┌─────────┐   ┌──────────┐
│Pharmacist│  │Pathologist│
└─────────┘   └──────────┘
```

### Admin Navigation

```
┌──────────────────┐
│  Admin RootPage  │
├──────────────────┤
│  Sidebar Nav:    │
│  • Dashboard     │
│  • Patients      │
│  • Appointments  │
│  • Pharmacy      │
│  • Pathology     │
│  • Staff         │
│  • Payroll       │
│  • Invoices      │
│  • Settings      │
│  • Help          │
└──────────────────┘
```

### Doctor Navigation

```
┌──────────────────┐
│ Doctor RootPage  │
├──────────────────┤
│  Sidebar Nav:    │
│  • Dashboard     │
│  • Patients      │ ← Opens Intake Form
│  • Schedule      │
│  • Follow-Ups    │
│  • Settings      │
└──────────────────┘
```

### Pharmacist Navigation

```
┌──────────────────────┐
│ Pharmacist RootPage  │
├──────────────────────┤
│  Sidebar Nav:        │
│  • Dashboard         │
│  • Medicines         │
│  • Prescriptions     │
│  • Settings          │
└──────────────────────┘
```

### Pathologist Navigation

```
┌──────────────────────┐
│ Pathologist RootPage │
├──────────────────────┤
│  Sidebar Nav:        │
│  • Dashboard         │
│  • Patients          │
│  • Test Reports      │
│  • Settings          │
└──────────────────────┘
```

---

## Key User Flows

### 1. Patient Consultation Flow (Doctor)

```
Doctor Dashboard
    ↓
Patients Page
    ↓
[Click Patient] → Intake Form Widget
    ├─ Chief Complaint
    ├─ Vitals Entry
    ├─ Diagnosis
    ├─ Prescriptions (Enhanced Pharmacy Table)
    ├─ Lab Tests
    └─ Follow-Up (Follow-Up Dialog)
    ↓
[Submit] → Save to Backend
    ↓
Generate Prescription PDF
```

### 2. Medicine Dispensing Flow (Pharmacist)

```
Pharmacist Dashboard
    ↓
Prescriptions Page (Pending List)
    ↓
[Select Prescription]
    ↓
Review Medicine Items
    ↓
[Mark as Dispensed]
    ↓
Update Stock (Backend)
```

### 3. Staff Payroll Flow (Admin)

```
Admin Dashboard
    ↓
Payroll Page
    ↓
[Create Payroll] → Payroll Form Enhanced
    ├─ Select Staff
    ├─ Select Month/Year
    ├─ Enter Basic Salary
    ├─ Add Earnings (HRA, DA, etc.)
    ├─ Add Deductions (PF, Tax, etc.)
    └─ Review Net Salary
    ↓
[Submit] → Save Payroll
    ↓
[View Details] → Payroll Detail Enhanced
```

### 4. Lab Report Upload Flow (Pathologist)

```
Pathologist Dashboard
    ↓
Test Reports Page
    ↓
[Upload Report]
    ├─ Select Patient
    ├─ Select Test Type
    ├─ Upload PDF/Image
    └─ Enter Results (Optional OCR)
    ↓
[Submit] → Save to Backend
```

---

## Important Notes

### 🔴 Critical Files

| File | Importance | Reason |
|------|------------|--------|
| `intakeform.dart` | **HIGHEST** | Core patient consultation workflow |
| `DashboardPageNew.dart` | **HIGH** | Main doctor interface (new design) |
| `PayrollPageEnterprise.dart` | **HIGH** | Enterprise payroll system |
| `PharmacyPage.dart` | **HIGH** | Medicine inventory management |
| `LoginPage.dart` | **CRITICAL** | Authentication gateway |
| `Authservices.dart` | **CRITICAL** | Authentication logic |

### 🟡 Version Management

Some files have multiple versions:
- **DashboardPage.dart** vs **DashboardPageNew.dart** (Doctor)
- **SchedulePage.dart** vs **SchedulePageNew.dart** (Doctor)
- **medicines_page.dart** vs **medicines_page_enterprise.dart** (Pharmacist)
- **PathalogyScreen.dart** vs **PathalogyScreen_clean.dart** (Admin)

**Recommendation:** Use the "New" or "Enterprise" versions as they are enhanced/refactored.

### 📦 Backup Files

Files marked as `.backup` or `_backup` are previous versions kept for reference:
- `intakeform_backup.dart`
- `dashboard_page_old_backup.dart`
- `PharmacyPage.dart.backup`
- `PathalogyScreen.dart.broken`

**Do not use these in production.**

---

## File Organization Structure

```
lib/
├── main.dart                     # App entry point
├── Models/                       # Data models
│   ├── User.dart
│   ├── Patients.dart
│   ├── Staff.dart
│   └── ...
├── Modules/                      # Feature modules
│   ├── Common/                   # Shared screens
│   │   ├── LoginPage.dart
│   │   ├── SplashPage.dart
│   │   └── ChatbotWidget.dart
│   ├── Admin/                    # Admin module
│   │   ├── RootPage.dart
│   │   ├── DashboardPage.dart
│   │   ├── PatientsPage.dart
│   │   └── widgets/
│   ├── Doctor/                   # Doctor module
│   │   ├── RootPage.dart
│   │   ├── DashboardPageNew.dart
│   │   ├── PatientsPage.dart
│   │   └── widgets/
│   │       └── intakeform.dart   # KEY FILE
│   ├── Pharmacist/               # Pharmacist module
│   │   ├── root_page.dart
│   │   ├── dashboard_page.dart
│   │   └── prescriptions_page.dart
│   └── Pathologist/              # Pathologist module
│       ├── root_page.dart
│       ├── dashboard_page.dart
│       └── test_reports_page.dart
├── Services/                     # Business logic
│   ├── Authservices.dart
│   └── ReportService.dart
├── Utils/                        # Utilities
│   ├── Api_handler.dart
│   ├── Colors.dart
│   └── dio_client.dart
├── Widgets/                      # Reusable widgets
│   └── generic_enterprise_table.dart
└── Providers/                    # State management
    └── app_providers.dart
```

---

## Screen Naming Conventions

| Convention | Example | Module |
|------------|---------|--------|
| PascalCase | `DashboardPage.dart` | Admin, Doctor (old) |
| snake_case | `dashboard_page.dart` | Pharmacist, Pathologist |
| Suffix "Page" | `DashboardPage` | All pages |
| Suffix "Widget" | `ChatbotWidget` | Widgets |
| Suffix "Screen" | `AppoimentsScreen` | Full-screen views |

---

## Quick Reference Table

### Where is each feature implemented?

| Feature | Module | Page/Widget | File |
|---------|--------|-------------|------|
| **User Login** | Common | LoginPage | `Common/LoginPage.dart` |
| **Dashboard Overview** | Admin | DashboardPage | `Admin/DashboardPage.dart` |
| **Doctor Dashboard** | Doctor | DashboardPageNew | `Doctor/DashboardPageNew.dart` |
| **Patient Registration** | Admin | PatientsPage | `Admin/PatientsPage.dart` |
| **Patient Consultation** | Doctor | Intake Form Widget | `Doctor/widgets/intakeform.dart` |
| **Appointment Booking** | Doctor/Admin | Addnewappoiments | `Doctor/widgets/Addnewappoiments.dart` |
| **Follow-Up Management** | Doctor | FollowUpManagementScreen | `Doctor/FollowUpManagementScreen.dart` |
| **Medicine Inventory** | Admin/Pharmacist | PharmacyPage | `Admin/PharmacyPage.dart` |
| **Prescription Dispensing** | Pharmacist | prescriptions_page | `Pharmacist/prescriptions_page.dart` |
| **Lab Report Upload** | Pathologist | test_reports_page | `Pathologist/test_reports_page.dart` |
| **Staff Management** | Admin | StaffPage | `Admin/StaffPage.dart` |
| **Payroll Processing** | Admin | PayrollPageEnterprise | `Admin/PayrollPageEnterprise.dart` |
| **Chatbot Assistant** | All | EnterpriseChatbotWidget | `Common/EnterpriseChatbotWidget.dart` |

---

## Responsive Design

All pages are designed to be responsive for:
- 📱 **Mobile** (< 600px)
- 📱 **Tablet** (600px - 1024px)
- 💻 **Desktop** (> 1024px)

### Special Note:
`DashboardPageNew.dart` (Doctor) is specifically designed with **NO SCROLLING** - fully responsive single-screen design optimized for all devices.

---

## State Management

**Provider:** `lib/Providers/app_providers.dart`

Current state management uses:
- `AuthService.instance` (Singleton)
- Local state management with `setState()`
- Future builders for async data

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-04  
**Maintained By:** Frontend Team

---

*This document maps all Flutter pages and their purposes. Update this document when adding new screens or refactoring existing ones.*

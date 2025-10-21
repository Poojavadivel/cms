# 🏥 Karur Gastro Foundation - Hospital Management System

[![Flutter](https://img.shields.io/badge/Flutter-3.6.2-02569B?logo=flutter)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-3.6.2-0175C2?logo=dart)](https://dart.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?logo=mongodb)](https://www.mongodb.com/)

A comprehensive Hospital Management System (HMS) built with Flutter (Frontend) and Node.js (Backend) for Karur Gastro Foundation, providing seamless healthcare management across multiple platforms.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Key Implementations](#-key-implementations)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview

Karur Gastro Foundation HMS is a modern, full-stack hospital management solution designed to streamline healthcare operations. The system consists of:

- **Frontend**: Cross-platform Flutter application (Android, iOS, Web, Windows, Linux, macOS)
- **Backend**: RESTful API built with Node.js, Express.js, and MongoDB
- **Features**: Complete patient management, appointments, pharmacy, pathology, intake forms, and more

---

## ✨ Features

### 👨‍💼 Admin Module
- 📊 **Dashboard Analytics** - Real-time hospital metrics and statistics
- 👥 **Staff Management** - Add, edit, and manage hospital staff
- 🏥 **Patient Management** - Complete patient records with auto-generated patient codes (PAT-001, PAT-002, etc.)
- 📅 **Appointment Scheduling** - Comprehensive scheduling system with calendar integration
- 💊 **Pharmacy Management** - Medicine inventory and prescription tracking
- 🧪 **Pathology** - Lab reports and test management
- 💰 **Invoice Management** - Billing and payment tracking
- ⚙️ **Settings** - System configuration
- ❓ **Help & Support** - In-app assistance

### 👨‍⚕️ Doctor Module
- 📊 **Personal Dashboard** - Doctor's daily overview with appointment summaries
- 📅 **Appointment Management** - View, filter, and manage patient appointments
- 👥 **Patient Records** - Access complete patient information with:
  - Patient Code (PAT-XXX format)
  - Demographics (Age, Gender, Blood Group)
  - Medical History
  - Vitals (Height, Weight, BMI, SpO₂)
- 📝 **Intake Forms** - Create and view detailed patient intake records:
  - Medical Notes & Vitals
  - Pharmacy Prescriptions (Medicine, Dosage, Frequency, Notes)
  - Pathology Orders (Test Name, Category, Priority, Notes)
- 🗓️ **Schedule Management** - Set availability and working hours
- ⚙️ **Settings** - Personal preferences and profile

### 🔐 Common Features
- 🔒 **Secure Authentication** - JWT-based login system with role-based access control
- 🆔 **Auto-generated Patient Codes** - Unique sequential codes (PAT-001, PAT-002, etc.)
- 💉 **Blood Group Management** - Display and track patient blood types
- 📊 **Age Calculation** - Automatic age calculation from date of birth
- 🌐 **Offline Support** - Connectivity detection and offline mode
- 📱 **Responsive Design** - Adaptive UI for all screen sizes
- 🎨 **Modern UI/UX** - Clean interface with consistent design patterns
- 💾 **Persistent Storage** - SharedPreferences for local data
- 🔄 **Real-time Updates** - Live data synchronization
- 📄 **PDF Support** - Generate and view medical reports

---

## 🛠️ Tech Stack

### Frontend (Flutter)
```yaml
Flutter SDK: ^3.6.2
Dart: ^3.6.2

# State Management
flutter_riverpod: ^2.5.1
provider: ^6.1.5

# UI Components
google_fonts: ^6.3.0
cupertino_icons: ^1.0.8
iconsax: ^0.0.8
shimmer: ^3.0.0

# Data & Visualization
data_table_2: ^2.5.7
fl_chart: ^0.68.0
table_calendar: ^3.1.2
intl: ^0.20.0

# Networking
http: ^1.4.0

# Storage
shared_preferences: ^2.2.3
file_picker: ^8.0.3
path_provider: ^2.1.4

# Utilities
connectivity_plus: ^6.0.3
flutter_typeahead: ^5.2.0
```

### Backend (Node.js)
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3"
}
```

### Database
- **MongoDB**: Document-based NoSQL database
- **Collections**: Users, Patients, Appointments, Intakes, Counters

---

## 📁 Project Structure

```
karur/
├── 📱 lib/                          # Flutter frontend
│   ├── main.dart                    # Application entry point
│   ├── Models/                      # Data models
│   │   ├── User.dart
│   │   ├── Doctor.dart
│   │   ├── Patients.dart           # Patient model with patientCode support
│   │   ├── dashboardmodels.dart     # Appointment models with age/bloodGroup
│   │   └── ...
│   ├── Modules/                     # Feature modules
│   │   ├── Admin/                   # Admin interface
│   │   │   ├── RootPage.dart
│   │   │   ├── DashboardPage.dart
│   │   │   ├── PatientsPage.dart
│   │   │   └── widgets/
│   │   ├── Doctor/                  # Doctor interface
│   │   │   ├── RootPage.dart
│   │   │   ├── DashboardPage.dart
│   │   │   ├── PatientsPage.dart
│   │   │   └── widgets/
│   │   │       ├── eyeicon.dart            # Patient view dialog (READ)
│   │   │       ├── intakeform.dart         # Intake form (WRITE)
│   │   │       ├── Appoimentstable.dart    # Appointments table
│   │   │       └── ...
│   │   └── Common/                  # Shared screens
│   │       ├── SplashPage.dart
│   │       └── LoginPage.dart
│   ├── Providers/                   # State management
│   ├── Services/                    # API services
│   │   ├── Authservices.dart       # Authentication & API calls
│   │   └── Constants.dart          # API endpoints
│   ├── Utils/                       # Utilities
│   │   ├── Colors.dart             # App color palette
│   │   └── Api_handler.dart        # HTTP client
│   └── Widgets/                     # Shared widgets
│       └── patient_profile_header_card.dart  # Common patient profile card
│
├── 🖥️ Server/                       # Node.js backend
│   ├── server.js                    # Express server entry point
│   ├── Models/                      # Mongoose models
│   │   ├── User.js
│   │   ├── Patient.js              # Patient schema with bloodGroup
│   │   ├── Appointment.js
│   │   ├── Intake.js
│   │   └── Counter.js              # Auto-increment for patient codes
│   ├── routes/                      # API routes
│   │   ├── auth.js                 # Authentication endpoints
│   │   ├── doctors.js              # Doctor/patient endpoints
│   │   ├── appointment.js          # Appointment management
│   │   └── intakes.js              # Intake form endpoints
│   ├── Middleware/
│   │   └── Auth.js                 # JWT authentication middleware
│   └── .env                        # Environment variables
│
├── 📦 assets/                       # Images and resources
│   ├── loginbg.png
│   ├── karurlogo.png
│   ├── boyicon.png
│   ├── girlicon.png
│   └── ...
│
├── 📄 pubspec.yaml                  # Flutter dependencies
├── 📄 package.json                  # Node.js dependencies
└── 📄 README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

**Frontend:**
- Flutter SDK (^3.6.2)
- Dart SDK (^3.6.2)
- Android Studio / VS Code with Flutter extensions

**Backend:**
- Node.js (18.x or higher)
- MongoDB (6.0 or higher)
- npm or yarn

### Installation

#### 1️⃣ Clone the Repository
```bash
git clone <repository-url>
cd karur
```

#### 2️⃣ Backend Setup

```bash
# Navigate to server directory
cd Server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3000
MONGODB_URI=mongodb://localhost:27017/karur_gastro
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
EOF

# Start MongoDB (if not running)
# On Windows: Start MongoDB service
# On Mac/Linux: sudo systemctl start mongod

# Start the server
npm start
# Server runs on http://localhost:3000
```

#### 3️⃣ Frontend Setup

```bash
# Navigate back to root
cd ..

# Install Flutter dependencies
flutter pub get

# Update API endpoint in lib/Services/Constants.dart
# Change baseUrl to your backend URL

# Run the app
flutter run
```

### Platform-Specific Run Commands

```bash
# Android
flutter run -d android

# iOS (Mac only)
flutter run -d ios

# Web
flutter run -d chrome

# Windows
flutter run -d windows

# Linux
flutter run -d linux

# macOS (Mac only)
flutter run -d macos
```

---

## ⚙️ Configuration

### Backend Configuration

**Environment Variables** (`Server/.env`):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/karur_gastro
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
CORS_ORIGIN=*
```

**Database Setup:**
```javascript
// MongoDB automatically creates these collections:
- users          // Admin, Doctor, Staff users
- patients       // Patient records with bloodGroup, metadata.patientCode
- appointments   // Appointment scheduling
- intakes        // Patient intake forms
- counters       // Auto-increment sequences for patient codes
```

### Frontend Configuration

**API Endpoints** (`lib/Services/Constants.dart`):
```dart
class Constants {
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Update for production:
  // static const String baseUrl = 'https://your-domain.com/api';
}
```

**Color Theme** (`lib/Utils/Colors.dart`):
```dart
class AppColors {
  static const primary700 = Color(0xFF4F46E5);
  static const rowAlternate = Color(0xFFEEF2FF); // Table header blue
  static const tableHeader = Color(0xFF1E293B);
  static const kDanger = Color(0xFFEF4444);
  // ... more colors
}
```

---

## 🎯 Key Implementations

### 1. Patient Code Auto-Generation (PAT-XXX)

**Backend** (`Server/routes/doctors.js`):
```javascript
// Auto-generates unique patient codes: PAT-001, PAT-002, PAT-003...
function formatPatientCode(seq, width = 3) {
  return `PAT-${String(seq).padStart(width, '0')}`;
}

// Atomic counter increment
async function getNextSequence(key) {
  const result = await countersCollection.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result.value.seq;
}
```

**Frontend** (`lib/Models/Patients.dart`):
```dart
class PatientDetails {
  final String? patientCode;  // PAT-001, PAT-002, etc.
  
  // Display getter - shows code or falls back to UUID
  String get patientCodeOrId => 
    (patientCode != null && patientCode!.isNotEmpty) 
      ? patientCode! 
      : patientId;
}
```

**Display**: Patient codes are shown prominently in profile cards, appointment tables, and intake forms.

---

### 2. Blood Group Management

**Database Field**:
```javascript
// Patient schema includes bloodGroup
{
  bloodGroup: { type: String, default: 'O+' }
}
```

**API Response**:
```javascript
// GET /api/doctors/patients/my
{
  patientId: {
    bloodGroup: "O+",
    metadata: {
      patientCode: "PAT-001"
    }
  }
}
```

**Frontend Display**:
```dart
// Colored pill badge in profile card
_infoPill(Icons.bloodtype, 'Blood: ${bloodGroup}', AppColors.kDanger);
```

---

### 3. Age Calculation from Date of Birth

**Backend** (`Server/routes/appointment.js`):
```javascript
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age > 0 ? age : 0;
}
```

**Frontend** (`lib/Models/dashboardmodels.dart`):
```dart
// Fallback calculation in case backend doesn't provide age
if (p['dateOfBirth'] != null) {
  final dob = DateTime.tryParse(p['dateOfBirth'].toString());
  if (dob != null) {
    final today = DateTime.now();
    patientAge = today.year - dob.year;
    if (today.month < dob.month || 
        (today.month == dob.month && today.day < dob.day)) {
      patientAge--;
    }
  }
}
```

---

### 4. Intake Form - Write vs View Consistency

**Write Screen** (`intakeform.dart`):
- Editable tables with columns: Medicine, Dosage, Frequency, Notes
- Editable vitals: Height, Weight, BMI, SpO₂
- Blue-themed tables with `AppColors.rowAlternate`

**View Screen** (`eyeicon.dart`):
- ✅ **Same table columns** as write screen
- ✅ **Same blue color theme** (`AppColors.rowAlternate`)
- ✅ **Same vitals grid** display
- ✅ **Read-only mode** with proper styling

**Key Change**:
```dart
// Updated _ReadOnlyTable to match write screen
Container(
  color: AppColors.rowAlternate,  // Blue header
  child: Row(
    children: columns.map((c) => Expanded(
      child: Text(
        c.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          color: AppColors.tableHeader,
        ),
      ),
    )).toList(),
  ),
)
```

---

### 5. Common Patient Profile Widget

**Shared Widget** (`lib/Widgets/patient_profile_header_card.dart`):
```dart
class PatientProfileHeaderCard extends StatelessWidget {
  final PatientDetails patient;
  final Map<String, dynamic>? latestIntake;  // Optional intake data
  
  // Displays:
  // - Patient Code (PAT-001) with prominent badge
  // - Blood Group, Gender, Age in colored pills
  // - Date of Birth
  // - Vitals (Height, Weight, BMI, SpO₂) from latest intake
}
```

**Used in:**
- `eyeicon.dart` - Patient view dialog
- `doctor_appointment_preview.dart` - Appointment details
- Other screens requiring patient info display

---

## 📡 API Documentation

### Authentication

**POST** `/api/auth/login`
```json
Request:
{
  "email": "doctor@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "role": "doctor",
    "email": "doctor@example.com"
  }
}
```

### Patients

**GET** `/api/doctors/patients/my`
```json
Response:
{
  "success": true,
  "patients": [
    {
      "_id": "patient-id",
      "firstName": "Jane",
      "lastName": "Smith",
      "bloodGroup": "O+",
      "dateOfBirth": "1990-01-15",
      "metadata": {
        "patientCode": "PAT-001"
      },
      "patientCode": "PAT-001",
      "lastVisitDate": "2025-01-20T10:30:00.000Z"
    }
  ]
}
```

### Appointments

**GET** `/api/appointments`
```json
Response:
{
  "success": true,
  "appointments": [
    {
      "_id": "appt-id",
      "patientId": {
        "_id": "patient-id",
        "firstName": "Jane",
        "lastName": "Smith",
        "bloodGroup": "O+",
        "dateOfBirth": "1990-01-15",
        "metadata": {
          "patientCode": "PAT-001"
        }
      },
      "patientAge": 35,
      "startAt": "2025-01-20T10:00:00.000Z",
      "status": "Scheduled"
    }
  ]
}
```

### Intakes

**GET** `/api/intakes?patientId={id}`
```json
Response:
[
  {
    "_id": "intake-id",
    "patientId": "patient-id",
    "triage": {
      "vitals": {
        "heightCm": 175,
        "weightKg": 70,
        "bmi": 22.9,
        "spo2": 98
      }
    },
    "pharmacy": [
      {
        "Medicine": "Aspirin",
        "Dosage": "100mg",
        "Frequency": "Twice daily",
        "Notes": "After meals"
      }
    ],
    "pathology": [
      {
        "Test Name": "CBC",
        "Category": "Blood Test",
        "Priority": "High",
        "Notes": "Fasting required"
      }
    ]
  }
]
```

---

## 🚢 Deployment

### Backend Deployment

**1. MongoDB Atlas Setup:**
```bash
# Create free cluster at https://cloud.mongodb.com
# Get connection string and update .env:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/karur_gastro
```

**2. Deploy to Heroku/Railway/Render:**
```bash
# Example: Heroku
heroku create karur-gastro-api
heroku config:set MONGODB_URI=your-connection-string
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

### Frontend Deployment

**Web Deployment:**
```bash
# Build for web
flutter build web --release

# Deploy to Firebase Hosting / Netlify / Vercel
# Upload contents of build/web/
```

**Mobile App Release:**
```bash
# Android
flutter build apk --release  # APK
flutter build appbundle --release  # App Bundle for Play Store

# iOS (Mac only)
flutter build ios --release
# Then archive in Xcode and upload to App Store Connect
```

**Desktop:**
```bash
# Windows
flutter build windows --release

# Linux
flutter build linux --release

# macOS
flutter build macos --release
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Backend not connecting:**
```bash
# Check MongoDB is running
mongod --version

# Check server logs
cd Server
npm start
```

**2. Frontend API errors:**
```dart
// Update Constants.dart with correct backend URL
static const String baseUrl = 'http://YOUR_IP:3000/api';
// Use your local IP address, not localhost on mobile devices
```

**3. Age showing as 0:**
- ✅ **Fixed**: Backend now calculates age from `dateOfBirth`
- ✅ Frontend has fallback calculation
- Ensure `dateOfBirth` field is populated in patient records

**4. Blood group blank:**
- ✅ **Fixed**: Backend populates `bloodGroup` in appointment API
- ✅ Frontend extracts from `patientId.bloodGroup`
- Default value: "O+" if not specified

**5. Patient code not showing:**
- ✅ **Fixed**: Auto-generated on first patient list fetch
- Backend creates `counters` collection automatically
- Format: PAT-001, PAT-002, PAT-003, etc.

**6. Intake tables not matching:**
- ✅ **Fixed**: View screen now uses same blue theme
- ✅ Same columns in both write and view modes
- Pharmacy: Medicine, Dosage, Frequency, Notes
- Pathology: Test Name, Category, Priority, Notes

---

## 📊 Database Schema

### Patients Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String (Male/Female/Other),
  bloodGroup: String (A+, A-, B+, B-, O+, O-, AB+, AB-),
  phone: String,
  email: String,
  doctorId: ObjectId (ref: User),
  metadata: {
    patientCode: String  // PAT-001, PAT-002, etc.
  },
  deleted_at: Date
}
```

### Counters Collection
```javascript
{
  _id: "patientCode",  // Sequence name
  seq: Number          // Current sequence number
}
```

### Appointments Collection
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: Patient),
  doctorId: ObjectId (ref: User),
  startAt: Date,
  status: String (Scheduled/Completed/Cancelled),
  appointmentType: String,
  chiefComplaint: String
}
```

### Intakes Collection
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: Patient),
  doctorId: ObjectId (ref: User),
  triage: {
    chiefComplaint: String,
    vitals: {
      heightCm: Number,
      weightKg: Number,
      bmi: Number,
      spo2: Number,
      bp: String,
      temp: Number,
      pulse: Number
    }
  },
  pharmacy: [
    {
      Medicine: String,
      Dosage: String,
      Frequency: String,
      Notes: String
    }
  ],
  pathology: [
    {
      "Test Name": String,
      Category: String,
      Priority: String,
      Notes: String
    }
  ],
  createdAt: Date
}
```

---

## 📝 Recent Updates

### Latest Fixes & Improvements

1. ✅ **Patient Code System** - Auto-generated PAT-XXX codes for all patients
2. ✅ **Blood Group Display** - Properly shows in all views with color-coded pills
3. ✅ **Age Calculation** - Automatic calculation from date of birth (backend + frontend)
4. ✅ **Intake Form Consistency** - View screen matches write screen exactly
5. ✅ **Table Styling** - Blue theme consistent across write and view modes
6. ✅ **Profile Card Widget** - Common reusable widget for patient display
7. ✅ **Vitals Display** - Grid format showing Height, Weight, BMI, SpO₂

---

## 🤝 Contributing

This is a proprietary project for Karur Gastro Foundation. Internal contributions should follow these guidelines:

1. Create a feature branch from `main`
2. Make changes with clear commit messages
3. Test thoroughly on multiple platforms
4. Submit pull request with detailed description

---

## 📄 License

Proprietary software © 2025 Karur Gastro Foundation. All rights reserved.

---

## 📞 Support

For technical support or queries:
- **Email**: support@karurgastro.org
- **Phone**: +91-XXXX-XXXXX

---

## 🧪 Pathology & Pharmacy Modules

### Pharmacy Module

**Features:**
- 📦 **Medicine Inventory** - Track stock levels and manage medicines
- 💊 **Prescription Management** - View and fulfill doctor prescriptions
- 📊 **Dashboard** - Real-time pharmacy metrics
- 🔍 **Search & Filter** - Quick medicine lookup
- 📈 **Reports** - Dispensing history and analytics

### Pathology Module

**Features:**
- 🧪 **Lab Test Management** - Handle all pathology requests from doctors
- 📄 **Test Reports** - Upload and manage test results (PDF, images, documents)
- 📊 **Dashboard** - Lab metrics and pending tests overview
- 👥 **Patient-Centric** - All tests linked to patient codes (PAT-XXX)
- 🔍 **Search & Filter** - Quick report lookup with status filtering
- 📋 **Test Details** - Complete test information with patient details

#### Test Reports Page

**Enterprise-Level Features:**
✅ **Auto-fetched Patient Data** - Patient code (PAT-XXX) and name from database  
✅ **Uploader Tracking** - Shows who uploaded each report (name, not ID)  
✅ **Centered Columns** - "Uploaded By" and "Status" properly aligned  
✅ **Smart Status Display** - Compact pill badges (Pending/Completed)  
✅ **Date-only Format** - Clean date display without time  
✅ **Filter Dropdown** - Quick sort by status  
✅ **Pagination** - Enterprise-grade pagination (10 items per page)  
✅ **Overflow Fixed** - No render overflow errors  
✅ **Professional Table** - Proper padding and spacing  
✅ **White Add Button** - Clean, professional "Add Test Report" button  

**Table Columns:**
```
| PATIENT CODE | PATIENT NAME | TEST TYPE | DATE | UPLOADED BY | STATUS | ACTIONS |
|    PAT-001   | John Doe     | Blood Test| 1/20 |   Admin     | 🟡 Pending | 👁️ |
```

**Key Fixes Applied:**
1. ✅ Patient Code from Database (not PAT-00 default)
2. ✅ Patient Name displayed (not raw ID)
3. ✅ Uploader Name shown (from user ID lookup)
4. ✅ Status centered with proper alignment
5. ✅ Date format clean (M/D only)
6. ✅ Filter dropdown for status
7. ✅ Pagination footer optimized
8. ✅ No overflow errors
9. ✅ Enterprise-level padding
10. ✅ Professional icon and button design

**Backend Integration:**
```javascript
// GET /api/pathology/reports
{
  "success": true,
  "reports": [
    {
      "_id": "report-id",
      "patientId": {
        "_id": "patient-id",
        "firstName": "John",
        "lastName": "Doe",
        "metadata": {
          "patientCode": "PAT-001"
        }
      },
      "patientCode": "PAT-001",        // Auto-extracted
      "patientName": "John Doe",        // Auto-extracted
      "uploadedBy": {
        "_id": "user-id",
        "firstName": "Dr.",
        "lastName": "Smith"
      },
      "uploaderName": "Dr. Smith",      // Auto-extracted
      "testType": "Blood Test",
      "status": "pending",
      "fileRef": "path/to/file.pdf",
      "createdAt": "2025-01-20T10:30:00.000Z"
    }
  ]
}
```

**API Endpoints:**
- `GET /api/pathology/reports` - List all test reports with patient/uploader details
- `POST /api/pathology/reports` - Create new test report entry
- `PUT /api/pathology/reports/:id` - Update test report (upload file)
- `DELETE /api/pathology/reports/:id` - Delete test report

---

## 🎨 Design System

### Color Palette
```dart
// Primary Colors
AppColors.primary         // #4F46E5 (Indigo)
AppColors.kTextPrimary   // #0F172A (Slate-900)
AppColors.kTextSecondary // #64748B (Slate-500)
AppColors.kBg            // #F8FAFC (Slate-50)
AppColors.kMuted         // #E8EBF0 (Slate-200)

// Semantic Colors
AppColors.kDanger        // #EF4444 (Red)
Colors.green             // #10B981 (Success)
Colors.orange            // #F59E0B (Warning)
```

### Typography
```dart
// Primary Font: Google Fonts (Inter, Lexend)
GoogleFonts.lexend(      // Headings, titles
  fontSize: 24,
  fontWeight: FontWeight.bold,
)

GoogleFonts.inter(       // Body text, tables
  fontSize: 14,
  fontWeight: FontWeight.w600,
)
```

### Component Standards

**Stat Cards:**
- Padding: 20px
- Border Radius: 12px
- Shadow: 0.05 alpha, 10px blur
- Icon size: 24px with 10px padding
- Icon background: Color with 0.1 alpha

**Tables:**
- Row padding: 16px horizontal, 12px vertical
- Header background: AppColors.kBg
- Border: AppColors.kMuted with 0.3 alpha
- Font: Inter 13-14px
- Alignment: Left (text), Center (status/actions)

**Buttons:**
- Primary: White background, muted border
- Padding: 16px horizontal, 10px vertical
- Border Radius: 8px
- Icon + Text with 8px gap

---

## 🔄 Recent Pathology Updates

### Completed Improvements

1. ✅ **Patient Code Integration** - All reports show PAT-XXX codes from database
2. ✅ **Name Display Fix** - Shows patient and uploader names (not IDs)
3. ✅ **Column Centering** - "Uploaded By" and "Status" properly centered
4. ✅ **Status UI Enhancement** - Compact pill badges without overflow
5. ✅ **Date Format Cleanup** - Date only (no time) for cleaner display
6. ✅ **Filter Implementation** - Dropdown filter for quick status sorting
7. ✅ **Pagination Optimization** - Enterprise-grade footer with 10 items/page
8. ✅ **Overflow Resolution** - Fixed all render overflow errors
9. ✅ **Table Padding** - Professional enterprise-level spacing
10. ✅ **Button Design** - White "Add Report" button with proper icon

### Backend Enhancements

**Population Logic:**
```javascript
// Populate patient and uploader details
.populate({
  path: 'patientId',
  select: 'firstName lastName metadata.patientCode'
})
.populate({
  path: 'uploadedBy',
  select: 'firstName lastName'
})

// Extract for frontend convenience
report.patientCode = report.patientId?.metadata?.patientCode || 'PAT-00';
report.patientName = `${report.patientId?.firstName || ''} ${report.patientId?.lastName || ''}`.trim() || 'Unknown';
report.uploaderName = `${report.uploadedBy?.firstName || ''} ${report.uploadedBy?.lastName || ''}`.trim() || 'Admin';
```

---

🏥 **Built with ❤️ for Karur Gastro Foundation**

*Last Updated: January 2025*

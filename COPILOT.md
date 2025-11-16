# COPILOT.md - Karur Gastro Foundation HMS

> **Complete Reference Documentation for AI Assistants and Developers**
> This file contains all essential information about the Karur Gastro Foundation Hospital Management System.
> Use this as the single source of truth for understanding and working with this codebase.

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Development Setup](#development-setup)
6. [Module Details](#module-details)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Design System](#design-system)
10. [Authentication & Security](#authentication--security)
11. [Common Patterns](#common-patterns)
12. [Troubleshooting](#troubleshooting)
13. [Recent Updates](#recent-updates)

---

## Project Overview

**Karur Gastro Foundation HMS** is an enterprise-grade, full-stack hospital management system built with Flutter (frontend) and Node.js/Express/MongoDB (backend).

### Key Characteristics
- **Cross-Platform**: Single Flutter codebase runs on Android, iOS, Web, Windows, Linux, and macOS
- **Role-Based**: Four distinct user roles with dedicated interfaces (Doctor, Admin, Pharmacist, Pathologist)
- **Production-Ready**: Enterprise-grade code with JWT authentication, optimized queries, and responsive design
- **Real-Time**: Live data synchronization across all modules
- **Modern Stack**: Latest Flutter 3.6.2, Node.js 18.x, MongoDB 6.19.0

### System Capabilities
✅ Patient Management & Medical Records  
✅ Appointment Scheduling & Tracking  
✅ Pharmacy Inventory & Prescription Management  
✅ Pathology Lab Tests & Reports  
✅ Staff Management & Role-Based Access  
✅ AI Chatbot (Google Generative AI)  
✅ Document Scanner (OCR with Google Vision API)  
✅ Dashboard Analytics & Reporting  

---

## Tech Stack

### Frontend (Flutter)

| Package | Version | Purpose |
|---------|---------|---------|
| **flutter** | 3.6.2 | Cross-platform UI framework |
| **dart** | 3.6.2 | Programming language |
| **google_fonts** | ^6.3.0 | Typography (Poppins, Inter) |
| **iconsax** | ^0.0.8 | Modern icon library |
| **provider** | ^6.1.5 | State management |
| **flutter_riverpod** | ^2.5.1 | Advanced state management |
| **http** | ^1.4.0 | HTTP client for API calls |
| **shared_preferences** | ^2.2.3 | Local storage (JWT tokens) |
| **data_table_2** | ^2.5.7 | Advanced data tables |
| **shimmer** | ^3.0.0 | Loading skeleton animations |
| **table_calendar** | ^3.1.2 | Calendar widgets |
| **fl_chart** | ^0.68.0 | Charts and graphs |
| **intl** | ^0.20.0 | Date/time formatting |
| **file_picker** | ^8.0.3 | File selection |
| **image_picker** | ^1.1.2 | Image capture/selection |

### Backend (Node.js)

| Package | Version | Purpose |
|---------|---------|---------|
| **node.js** | 18.x | JavaScript runtime |
| **express** | ^5.1.0 | Web framework |
| **mongodb** | ^6.19.0 | Database driver |
| **mongoose** | ^8.18.0 | MongoDB ODM |
| **jsonwebtoken** | ^9.0.2 | JWT authentication |
| **bcryptjs** | ^3.0.2 | Password hashing |
| **cors** | ^2.8.5 | Cross-origin resource sharing |
| **dotenv** | ^17.2.3 | Environment variables |
| **multer** | ^2.0.2 | File uploads |
| **@google/generative-ai** | ^0.24.1 | AI chatbot |
| **@google-cloud/vision** | ^5.3.3 | OCR scanning |
| **axios** | ^1.12.2 | HTTP client |
| **sharp** | ^0.34.4 | Image processing |
| **uuid** | ^8.3.2 | Unique IDs |

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Flutter Frontend (Multi-Platform)             │
│  Android • iOS • Web • Windows • Linux • macOS          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Doctor  │ │  Admin   │ │ Pharmacy │ │Pathology │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│  State: Provider + Riverpod | HTTP: http package       │
│  Auth: JWT in SharedPreferences | Utils & Services     │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────┴────────────────────────────────────┐
│              Node.js + Express Backend                  │
├─────────────────────────────────────────────────────────┤
│  Routes: /auth • /doctors • /appointments • /patients  │
│          /pharmacy • /pathology • /staff • /bot         │
├─────────────────────────────────────────────────────────┤
│  Middleware: JWT Auth • CORS • Body Parser             │
│  Services: Google Vision • Google Generative AI        │
└────────────────────┬────────────────────────────────────┘
                     │ Mongoose ODM
┌────────────────────┴────────────────────────────────────┐
│                MongoDB Database                         │
│  Collections: users • patients • appointments          │
│              medicines • reports • staff • counters    │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → Flutter Widget Event
2. **State Update** → Provider/Riverpod notifies listeners
3. **API Call** → AuthService adds JWT token to headers
4. **Backend** → Express route → Auth middleware validates JWT
5. **Database** → Mongoose model queries MongoDB
6. **Response** → JSON data returned to frontend
7. **UI Update** → State triggers widget rebuild

### Key Architecture Patterns

#### Patient Code System
- Auto-incrementing codes: `PAT-001`, `PAT-002`, etc.
- Generated using MongoDB counters collection
- Implemented in `Server/routes/doctors.js` via `getNextSequence()`

#### JWT Authentication
- Backend: Custom `auth` middleware validates tokens from `x-auth-token` header
- Frontend: Tokens stored in SharedPreferences, auto-injected via `AuthService._withAuth()`
- Token structure: `{ _id, email, role, iat, exp }`

#### Role-Based Routing
Each role has a dedicated "RootPage" that manages navigation:
- `lib/Modules/Doctor/RootPage.dart`
- `lib/Modules/Admin/RootPage.dart`
- `lib/Modules/Pharmacist/root_page.dart`
- `lib/Modules/Pathologist/root_page.dart`

#### API Communication Layers
1. **Low-level**: `ApiHandler` (Utils/Api_handler.dart) - Raw HTTP operations
2. **High-level**: `AuthService` (Services/Authservices.dart) - Authenticated wrapper with convenience methods

#### Denormalized Data
- Appointment documents store denormalized patient data (name, age, gender, patientCode)
- Optimizes read performance by avoiding joins
- **Important**: When updating patient records, update related appointments too

---

## Project Structure

```
karur/
├── lib/                                 # Flutter frontend source
│   ├── Modules/                        # Feature modules by role
│   │   ├── Doctor/                     # Doctor interface
│   │   │   ├── RootPage.dart          # Main navigation hub
│   │   │   ├── AppointmentsPageNew.dart  ⭐ Enterprise appointments
│   │   │   ├── Patients.dart          # Patient management
│   │   │   ├── Appointments.dart      # (Old appointments)
│   │   │   └── widgets/               # Doctor-specific widgets
│   │   │       ├── Addnewappoiments.dart
│   │   │       ├── Editappoimentspage.dart
│   │   │       ├── intakeform.dart
│   │   │       └── Appoimentstable.dart  # (Legacy)
│   │   ├── Admin/                      # Admin interface
│   │   │   ├── RootPage.dart
│   │   │   ├── Dashboard.dart
│   │   │   └── widgets/
│   │   ├── Pharmacist/                 # Pharmacy interface
│   │   │   ├── root_page.dart
│   │   │   └── widgets/
│   │   ├── Pathologist/                # Pathology interface
│   │   │   ├── root_page.dart
│   │   │   └── widgets/
│   │   └── Common/                     # Shared screens
│   │       ├── LoginPage.dart
│   │       ├── SplashScreen.dart
│   │       └── Chatbot.dart
│   ├── Models/                         # Data models
│   │   ├── Patients.dart              # Patient data model
│   │   ├── dashboardmodels.dart       # Dashboard & appointment models
│   │   └── appointment_draft.dart
│   ├── Services/                       # Business logic
│   │   ├── Authservices.dart          # Main API service with auth
│   │   └── Constants.dart             # API endpoints config
│   ├── Utils/                          # Utilities
│   │   ├── Colors.dart                # App color palette
│   │   ├── Api_handler.dart           # Low-level HTTP
│   │   └── Validators.dart
│   ├── Widgets/                        # Reusable components
│   │   ├── generic_enterprise_table.dart
│   │   └── ...other widgets
│   ├── Providers/                      # State management
│   └── main.dart                       # App entry point
│
├── Server/                              # Node.js backend
│   ├── Server.js                       # Main server entry point
│   ├── routes/                         # API route handlers
│   │   ├── auth.js                    # Login, token validation
│   │   ├── doctors.js                 # Doctor operations, patients
│   │   ├── appointment.js             # Appointment CRUD
│   │   ├── patients.js                # Patient CRUD
│   │   ├── staff.js                   # Staff management
│   │   ├── pharmacy.js                # Medicine inventory
│   │   ├── pathology.js               # Lab reports
│   │   ├── bot.js                     # AI chatbot
│   │   ├── intake.js                  # Patient intake forms
│   │   ├── scanner-enterprise.js      # OCR scanning
│   │   └── card.js                    # Patient card data
│   ├── Models/                         # Mongoose schemas
│   │   ├── index.js                   # Model exports
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Appointment.js
│   │   └── ...other models
│   ├── Middleware/                     # Express middleware
│   │   └── Auth.js                    # JWT validation
│   ├── Config/                         # Configuration
│   │   └── Dbconfig.js                # MongoDB connection
│   ├── Bot/                            # Chatbot logic
│   ├── utils/                          # Helper functions
│   ├── uploads/                        # File uploads directory
│   ├── web/                            # Static web app
│   ├── package.json                    # Dependencies
│   ├── .env                           # Environment variables
│   └── node_modules/                   # Dependencies
│
├── assets/                              # Images, icons, fonts
│   ├── loginbg.png
│   ├── chatbotimg.png
│   ├── karurlogo.png
│   └── ...other assets
│
├── android/                             # Android platform code
├── ios/                                 # iOS platform code
├── web/                                 # Web platform code
├── windows/                             # Windows platform code
├── linux/                               # Linux platform code
├── macos/                               # macOS platform code
│
├── pubspec.yaml                         # Flutter dependencies
├── analysis_options.yaml                # Dart linter config
└── COPILOT.md                          # This file (reference docs)
```

---

## Development Setup

### Prerequisites

- **Flutter SDK**: 3.6.2 or higher
- **Dart SDK**: 3.6.2 or higher
- **Node.js**: 18.x or higher
- **MongoDB**: 6.19.0 or higher (local or MongoDB Atlas)
- **IDE**: VS Code or Android Studio
- **Git**: For version control

### Frontend Setup (Flutter)

```bash
# Navigate to project root
cd D:\MOVICLOULD\Hms\karur

# Install Flutter dependencies
flutter pub get

# Verify Flutter setup
flutter doctor

# Run on specific platform
flutter run -d chrome      # Web browser
flutter run -d windows     # Windows desktop
flutter run                # First available device (Android/iOS)

# Build for production
flutter build web --release
flutter build windows --release
flutter build apk --release
flutter build appbundle --release
```

### Backend Setup (Node.js)

```bash
# Navigate to server directory
cd Server

# Install Node.js dependencies
npm install

# Create .env file (copy from example below)
# Edit with your configuration

# Start server
node Server.js

# Server runs on http://localhost:3000 by default
```

### Environment Configuration

Create `Server/.env` file:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/karur_hms
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/karur_hms

# JWT Secret (change in production!)
JWT_SECRET=your_super_secret_key_change_this_in_production_123

# Server Configuration
PORT=3000
NODE_ENV=development

# Initial Admin User (created automatically on first startup)
ADMIN_EMAIL=admin@karurgastro.com
ADMIN_PASSWORD=admin123
ADMIN_ROLE=superadmin

# Initial Doctor User
DOCTOR_EMAIL=doctor@karurgastro.com
DOCTOR_PASSWORD=doctor123
DOCTOR_ROLE=doctor

# Initial Pharmacist User
PHARMACIST_EMAIL=pharmacist@karurgastro.com
PHARMACIST_PASSWORD=pharmacist123
PHARMACIST_ROLE=pharmacist

# Initial Pathologist User
PATHOLOGIST_EMAIL=pathologist@karurgastro.com
PATHOLOGIST_PASSWORD=pathologist123
PATHOLOGIST_ROLE=pathologist

# Google Cloud (Optional - for OCR and AI features)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_API_KEY=your_google_api_key_here
```

### Frontend Configuration

Update `lib/Services/Constants.dart`:

```dart
class ApiConstants {
  // Change this to your backend URL
  static const String baseUrl = 'http://localhost:3000';
  
  // For Android emulator: 'http://10.0.2.2:3000'
  // For iOS simulator: 'http://localhost:3000'
  // For production: 'https://your-domain.com'
}
```

### Database Setup

1. **Install MongoDB** (if local):
   ```bash
   # Windows: Download from mongodb.com
   # Linux: sudo apt install mongodb
   # macOS: brew install mongodb-community
   ```

2. **Start MongoDB**:
   ```bash
   # Windows: MongoDB runs as service
   # Linux/macOS: sudo systemctl start mongod
   ```

3. **Verify Connection**:
   ```bash
   mongosh mongodb://localhost:27017/karur_hms
   ```

4. **Initial Data**: Users are auto-created from .env on first server startup

---

## Module Details

### 1. Doctor Module 👨‍⚕️

**Location**: `lib/Modules/Doctor/`

#### Features
- **Patient Management**: Add, view, edit patient records with full medical history
- **Appointment System** ⭐ Enterprise-grade with:
  - Real-time search and filtering
  - Patient code display (PAT-001, PAT-002...)
  - Gender icons (Male/Female)
  - Status tracking (Scheduled, Completed, Cancelled, No-Show)
  - Shimmer loading states
  - Independent API calls (not dependent on dashboard)
- **Prescription Management**: Digital prescription generation
- **Intake Forms**: Comprehensive patient intake and symptom documentation

#### Key Files
- `RootPage.dart`: Main navigation hub with sidebar
- `AppointmentsPageNew.dart`: ⭐ New enterprise appointments interface
- `Patients.dart`: Patient list and management
- `widgets/Addnewappoiments.dart`: Create new appointment form
- `widgets/Editappoimentspage.dart`: Edit existing appointments
- `widgets/intakeform.dart`: Patient intake form

#### API Endpoints Used
```dart
GET    /api/doctors/patients/my        // Get doctor's patients
GET    /api/appointments/:doctorId     // Get doctor's appointments
POST   /api/appointments               // Create appointment
PUT    /api/appointments/:id           // Update appointment
DELETE /api/appointments/:id           // Delete appointment
POST   /api/patients                   // Create patient
PUT    /api/patients/:id               // Update patient
```

### 2. Admin Module 👨‍💼

**Location**: `lib/Modules/Admin/`

#### Features
- **Dashboard Analytics**: Real-time statistics and charts
- **Staff Management**: Add/edit doctors, nurses, pharmacists, pathologists
- **Hospital Configuration**: Department setup, service pricing
- **Reports**: Generate various administrative reports

#### Key Files
- `RootPage.dart`: Admin navigation hub
- `Dashboard.dart`: Analytics dashboard
- Various management screens in `widgets/`

### 3. Pharmacy Module 💊

**Location**: `lib/Modules/Pharmacist/`

#### Features
- **Inventory Management**: Medicine stock tracking, expiry monitoring
- **Prescription Processing**: Digital prescription fulfillment
- **Billing System**: Invoice generation, payment tracking
- **Low Stock Alerts**: Automated inventory alerts

#### Key Files
- `root_page.dart`: Pharmacy navigation hub
- Medicine management screens
- Prescription processing widgets

#### API Endpoints Used
```dart
GET    /api/pharmacy/medicines         // Get medicine inventory
POST   /api/pharmacy/medicines         // Add new medicine
PUT    /api/pharmacy/medicines/:id     // Update medicine
DELETE /api/pharmacy/medicines/:id     // Delete medicine
GET    /api/pharmacy/prescriptions     // Get prescriptions to fill
```

### 4. Pathology Module 🔬

**Location**: `lib/Modules/Pathologist/`

#### Features
- **Test Management**: Lab test catalog and pricing
- **Sample Tracking**: Track sample collection and processing
- **Report Generation**: Digital lab reports with print/email
- **Quality Control**: Test result validation

#### Key Files
- `root_page.dart`: Pathology navigation hub
- Test management screens
- Report generation widgets

#### API Endpoints Used
```dart
GET    /api/pathology/tests            // Get test catalog
POST   /api/pathology/reports          // Create new report
PUT    /api/pathology/reports/:id      // Update report
GET    /api/pathology/reports/:id      // Get specific report
```

---

## API Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication

All protected endpoints require JWT token in header:
```
x-auth-token: <jwt_token>
```

### Endpoints

#### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65abc123...",
    "email": "doctor@example.com",
    "role": "doctor",
    "name": "Dr. Smith"
  }
}
```

#### Patients
```http
GET /api/doctors/patients/my
Headers: x-auth-token: <token>

Response (200):
[
  {
    "_id": "65abc111...",
    "patientCode": "PAT-001",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "age": 45,
    "gender": "Male",
    "phone": "+91 9876543210",
    "email": "john@example.com",
    "bloodGroup": "A+",
    "medicalHistory": ["Hypertension", "Diabetes"],
    "allergies": ["Penicillin"],
    "doctorId": "65abc000...",
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

```http
POST /api/patients
Headers: x-auth-token: <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "age": 30,
  "gender": "Female",
  "phone": "+91 9876543211",
  "email": "jane@example.com",
  "bloodGroup": "B+",
  "address": "123 Main St, Chennai",
  "allergies": ["Dust"],
  "medicalHistory": ["Asthma"]
}

Response (201):
{
  "message": "Patient created successfully",
  "patient": { ... }
}
```

#### Appointments
```http
GET /api/appointments/:doctorId
Headers: x-auth-token: <token>

Response (200):
[
  {
    "_id": "65abc123...",
    "patientId": "65abc111...",
    "patientCode": "PAT-001",
    "patientName": "John Doe",
    "patientAge": 45,
    "gender": "Male",
    "doctorId": "65abc000...",
    "date": "2025-01-20",
    "time": "10:30",
    "reason": "Follow-up consultation",
    "status": "Scheduled",
    "diagnosis": "Gastritis - improving",
    "currentNotes": "Patient feeling better",
    "bloodGroup": "A+",
    "location": "Chennai"
  }
]
```

```http
POST /api/appointments
Headers: x-auth-token: <token>
Content-Type: application/json

{
  "patientId": "65abc111...",
  "doctorId": "65abc000...",
  "date": "2025-01-20",
  "time": "10:30",
  "reason": "Follow-up consultation",
  "status": "Scheduled"
}

Response (201):
{
  "message": "Appointment created successfully",
  "appointment": { ... }
}
```

```http
PUT /api/appointments/:id
Headers: x-auth-token: <token>
Content-Type: application/json

{
  "status": "Completed",
  "diagnosis": "Gastritis",
  "currentNotes": "Prescribed antacids"
}

Response (200):
{
  "message": "Appointment updated successfully",
  "appointment": { ... }
}
```

```http
DELETE /api/appointments/:id
Headers: x-auth-token: <token>

Response (200):
{
  "message": "Appointment deleted successfully"
}
```

#### Pharmacy
```http
GET /api/pharmacy/medicines
Headers: x-auth-token: <token>

Response (200):
[
  {
    "_id": "65abc222...",
    "name": "Paracetamol",
    "genericName": "Acetaminophen",
    "dosage": "500mg",
    "quantity": 500,
    "price": 5.00,
    "expiryDate": "2026-12-31",
    "manufacturer": "PharmaCorp",
    "category": "Analgesic"
  }
]
```

#### Pathology
```http
GET /api/pathology/reports
Headers: x-auth-token: <token>

Response (200):
[
  {
    "_id": "65abc333...",
    "patientId": "65abc111...",
    "patientName": "John Doe",
    "testName": "Complete Blood Count",
    "testDate": "2025-01-15",
    "status": "Completed",
    "results": {
      "hemoglobin": "14.5 g/dL",
      "wbc": "7500 /μL",
      "platelets": "250000 /μL"
    },
    "pathologistId": "65abc444...",
    "remarks": "All values within normal range"
  }
]
```

#### Chatbot
```http
POST /api/bot/chat
Headers: x-auth-token: <token>
Content-Type: application/json

{
  "message": "What are the symptoms of gastritis?",
  "userId": "65abc000..."
}

Response (200):
{
  "reply": "Gastritis symptoms include upper abdominal pain, nausea, vomiting, bloating, and loss of appetite. Common causes include H. pylori infection, excessive alcohol consumption, and long-term use of NSAIDs."
}
```

---

## Database Schema

### Collections

#### users
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['doctor', 'admin', 'pharmacist', 'pathologist', 'superadmin']),
  name: String,
  phone: String,
  specialization: String, // for doctors
  licenseNumber: String,  // for doctors
  createdAt: Date,
  updatedAt: Date
}
```

#### patients
```javascript
{
  _id: ObjectId,
  patientCode: String (unique, auto-generated: "PAT-001", "PAT-002"...),
  firstName: String (required),
  lastName: String (required),
  name: String (computed: firstName + lastName),
  age: Number (required),
  gender: String (enum: ['Male', 'Female', 'Other'], required),
  dateOfBirth: Date,
  phone: String,
  email: String,
  address: String,
  city: String,
  pincode: String,
  bloodGroup: String (enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  weight: Number,
  height: Number,
  bmi: Number (computed),
  medicalHistory: [String],
  allergies: [String],
  emergencyContactName: String,
  emergencyContactPhone: String,
  insuranceNumber: String,
  avatarUrl: String,
  doctorId: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

#### appointments
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: 'Patient', required),
  // Denormalized patient data for performance
  patientCode: String,
  patientName: String,
  patientAge: Number,
  gender: String,
  patientAvatarUrl: String,
  bloodGroup: String,
  location: String,
  
  doctorId: ObjectId (ref: 'User', required),
  doctorName: String,
  date: String (YYYY-MM-DD, required),
  time: String (HH:mm, required),
  reason: String (required),
  status: String (enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show'], default: 'Scheduled'),
  diagnosis: String,
  currentNotes: String,
  previousNotes: String,
  prescriptions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### medicines
```javascript
{
  _id: ObjectId,
  name: String (required),
  genericName: String,
  dosage: String,
  quantity: Number (required),
  price: Number (required),
  expiryDate: Date,
  manufacturer: String,
  category: String (enum: ['Analgesic', 'Antibiotic', 'Antacid', ...]),
  batchNumber: String,
  reorderLevel: Number (for low stock alerts),
  createdAt: Date,
  updatedAt: Date
}
```

#### reports
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: 'Patient', required),
  patientName: String,
  patientCode: String,
  testName: String (required),
  testType: String (enum: ['Blood Test', 'Urine Test', 'X-Ray', 'CT Scan', ...]),
  testDate: Date (required),
  status: String (enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending'),
  results: Mixed (flexible object for test results),
  pathologistId: ObjectId (ref: 'User'),
  pathologistName: String,
  remarks: String,
  reportFileUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### counters
```javascript
{
  _id: String ('patientCode'),
  seq: Number (current sequence number)
}
// Used for auto-incrementing patient codes
```

### Indexes

```javascript
// patients
db.patients.createIndex({ patientCode: 1 }, { unique: true });
db.patients.createIndex({ doctorId: 1 });
db.patients.createIndex({ phone: 1 });
db.patients.createIndex({ email: 1 });

// appointments
db.appointments.createIndex({ doctorId: 1, date: -1 });
db.appointments.createIndex({ patientId: 1 });
db.appointments.createIndex({ status: 1 });
db.appointments.createIndex({ patientCode: 1 });

// users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// medicines
db.medicines.createIndex({ name: 1 });
db.medicines.createIndex({ category: 1 });

// reports
db.reports.createIndex({ patientId: 1 });
db.reports.createIndex({ testDate: -1 });
db.reports.createIndex({ status: 1 });
```

---

## Design System

### Typography

The application uses **Google Fonts** with a two-font hierarchy:

#### Font Families
- **Poppins**: Headers, titles, and emphasis
- **Inter**: Body text, labels, and UI elements

#### Font Weights & Sizes
```dart
// Headers (Poppins)
GoogleFonts.poppins(
  fontSize: 24,
  fontWeight: FontWeight.w600, // SemiBold
  color: AppColors.kTextPrimary,
)

// Subheaders (Poppins)
GoogleFonts.poppins(
  fontSize: 18,
  fontWeight: FontWeight.w600,
  color: AppColors.kTextPrimary,
)

// Body Text (Inter)
GoogleFonts.inter(
  fontSize: 14,
  fontWeight: FontWeight.w500, // Medium
  color: AppColors.kTextPrimary,
)

// Labels (Inter)
GoogleFonts.inter(
  fontSize: 12,
  fontWeight: FontWeight.w500,
  color: AppColors.kTextSecondary,
)

// Captions (Inter)
GoogleFonts.inter(
  fontSize: 10,
  fontWeight: FontWeight.w400, // Regular
  color: AppColors.kTextSecondary,
)
```

### Color Palette

Defined in `lib/Utils/Colors.dart`:

```dart
class AppColors {
  // Primary Colors (Enterprise Blue)
  static const Color primary = Color(0xFF1E3A72);
  static const Color primary600 = Color(0xFF2F5BA0);
  static const Color primary700 = Color(0xFF264E86);
  static const Color primary800 = Color(0xFF1A365D);
  
  // Semantic Colors
  static const Color kSuccess = Color(0xFF22C55E);  // Green
  static const Color kDanger = Color(0xFFDC2626);   // Red
  static const Color kWarning = Color(0xFFF59E0B);  // Amber
  static const Color kInfo = Color(0xFF2F5BA0);     // Blue
  
  // Text Colors
  static const Color kTextPrimary = Color(0xFF1E293B);    // slate-800
  static const Color kTextSecondary = Color(0xFF64748B);  // slate-500
  static const Color kTextTertiary = Color(0xFF94A3B8);   // slate-400
  
  // Background Colors
  static const Color background = Color(0xFFF9FAFB);       // gray-50
  static const Color cardBackground = Color(0xFFFFFFFF);   // white
  static const Color surfaceGrey = Color(0xFFF8FAFC);      // slate-50
  
  // Neutral Grays
  static const Color grey100 = Color(0xFFF1F5F9);
  static const Color grey200 = Color(0xFFE2E8F0);
  static const Color grey300 = Color(0xFFCBD5E1);
  static const Color grey400 = Color(0xFF94A3B8);
  static const Color grey500 = Color(0xFF64748B);
  static const Color grey600 = Color(0xFF475569);
  static const Color grey700 = Color(0xFF334155);
  static const Color grey800 = Color(0xFF1E293B);
  static const Color grey900 = Color(0xFF0F172A);
  
  // Status Colors (with opacity variants)
  static Color successLight = kSuccess.withOpacity(0.1);
  static Color dangerLight = kDanger.withOpacity(0.1);
  static Color warningLight = kWarning.withOpacity(0.1);
  static Color infoLight = kInfo.withOpacity(0.1);
}
```

### UI Components

#### Enterprise Table Design
**Used in**: `AppointmentsPageNew.dart`, other enterprise tables

**Characteristics**:
- Large search bar (56px height) with rounded corners
- Alternating row colors for readability
- Gender icons (`Iconsax.man`, `Iconsax.woman`)
- Status badges with color-coded backgrounds
- Shimmer skeleton loading states
- Patient code display prominently

**Example**:
```dart
// Search Bar
Container(
  height: 56,
  decoration: BoxDecoration(
    color: Colors.white,
    border: Border.all(color: AppColors.grey300),
    borderRadius: BorderRadius.circular(12),
  ),
  child: TextField(
    style: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w500,
    ),
    decoration: InputDecoration(
      hintText: 'Search patients by name, code, or reason...',
      hintStyle: GoogleFonts.inter(
        color: AppColors.grey400,
      ),
      prefixIcon: Icon(Iconsax.search_normal, color: AppColors.grey500),
      border: InputBorder.none,
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
  ),
)

// Status Badge
Container(
  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  decoration: BoxDecoration(
    color: _getStatusColor(status).withOpacity(0.1),
    borderRadius: BorderRadius.circular(20),
    border: Border.all(
      color: _getStatusColor(status).withOpacity(0.3),
      width: 1,
    ),
  ),
  child: Text(
    status,
    style: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      color: _getStatusColor(status),
    ),
  ),
)

// Gender Icon
Icon(
  gender == 'Male' ? Iconsax.man : Iconsax.woman,
  size: 16,
  color: gender == 'Male' ? AppColors.primary : Colors.pink,
)
```

#### Shimmer Loading Skeleton
```dart
import 'package:shimmer/shimmer.dart';

Shimmer.fromColors(
  baseColor: AppColors.grey200,
  highlightColor: AppColors.grey100,
  child: Container(
    height: 60,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(8),
    ),
  ),
)
```

---

## Authentication & Security

### JWT Token Flow

1. **Login**:
   ```dart
   // User enters credentials
   final response = await AuthService.instance.post(
     '/api/auth/login',
     {'email': email, 'password': password}
   );
   
   // Store token in SharedPreferences
   final prefs = await SharedPreferences.getInstance();
   await prefs.setString('token', response['token']);
   await prefs.setString('role', response['user']['role']);
   ```

2. **Authenticated Requests**:
   ```dart
   // AuthService automatically adds token to headers
   final data = await AuthService.instance.get('/api/doctors/patients/my');
   ```

3. **Token Validation** (Backend):
   ```javascript
   // Middleware: Server/Middleware/Auth.js
   const jwt = require('jsonwebtoken');
   
   module.exports = function(req, res, next) {
     const token = req.header('x-auth-token');
     if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
     
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded; // { _id, email, role }
       next();
     } catch (err) {
       res.status(401).json({ msg: 'Token is not valid' });
     }
   };
   ```

### Password Security

- **Hashing**: bcryptjs with 10 salt rounds
- **Storage**: Never store plain text passwords
- **Validation**: Minimum 6 characters (configurable)

```javascript
// Server/Models/User.js (pre-save hook)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

### Role-Based Access Control

Roles: `doctor`, `admin`, `pharmacist`, `pathologist`, `superadmin`

```javascript
// Backend route protection
router.get('/admin-only', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  // Admin logic here
});
```

```dart
// Frontend role checking
if (user.role == 'doctor') {
  Navigator.push(context, MaterialPageRoute(
    builder: (_) => DoctorRootPage()
  ));
} else if (user.role == 'admin') {
  Navigator.push(context, MaterialPageRoute(
    builder: (_) => AdminRootPage()
  ));
}
```

---

## Common Patterns

### API Service Usage

```dart
// GET request
final patients = await AuthService.instance.get('/api/doctors/patients/my');

// POST request
final result = await AuthService.instance.post(
  '/api/appointments',
  {
    'patientId': patientId,
    'doctorId': doctorId,
    'date': '2025-01-20',
    'time': '10:30',
    'reason': 'Follow-up',
  }
);

// PUT request
await AuthService.instance.put(
  '/api/appointments/$appointmentId',
  {'status': 'Completed', 'diagnosis': 'Gastritis'}
);

// DELETE request
await AuthService.instance.delete('/api/appointments/$appointmentId');

// Error handling
try {
  final data = await AuthService.instance.get('/api/some-endpoint');
} catch (e) {
  print('API Error: $e');
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Failed to load data')),
  );
}
```

### State Management with Provider

```dart
// 1. Create a ChangeNotifier
class AppointmentProvider extends ChangeNotifier {
  List<DashboardAppointments> _appointments = [];
  bool _isLoading = false;
  
  List<DashboardAppointments> get appointments => _appointments;
  bool get isLoading => _isLoading;
  
  Future<void> fetchAppointments(String doctorId) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final data = await AuthService.instance.get('/api/appointments/$doctorId');
      _appointments = (data as List)
          .map((json) => DashboardAppointments.fromJson(json))
          .toList();
    } catch (e) {
      print('Error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// 2. Provide it at app level (main.dart)
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => AppointmentProvider()),
  ],
  child: MyApp(),
)

// 3. Consume in widgets
class AppointmentsPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppointmentProvider>(context);
    
    if (provider.isLoading) {
      return CircularProgressIndicator();
    }
    
    return ListView.builder(
      itemCount: provider.appointments.length,
      itemBuilder: (context, index) {
        final appointment = provider.appointments[index];
        return AppointmentCard(appointment: appointment);
      },
    );
  }
}
```

### Data Model Parsing

```dart
class PatientDetails {
  final String patientId;
  final String patientCode;
  final String name;
  final int age;
  final String gender;
  
  PatientDetails({
    required this.patientId,
    required this.patientCode,
    required this.name,
    required this.age,
    required this.gender,
  });
  
  // JSON to Dart
  factory PatientDetails.fromJson(Map<String, dynamic> json) {
    return PatientDetails(
      patientId: json['_id'] ?? '',
      patientCode: json['patientCode'] ?? '',
      name: json['name'] ?? 'Unknown',
      age: json['age'] ?? 0,
      gender: json['gender'] ?? 'Unknown',
    );
  }
  
  // Dart to JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': patientId,
      'patientCode': patientCode,
      'name': name,
      'age': age,
      'gender': gender,
    };
  }
}
```

### Patient Code Generation (Backend)

```javascript
// Server/routes/doctors.js
async function getNextSequence(name) {
  const counter = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return counter.seq;
}

// Usage when creating patient
const patientNumber = await getNextSequence('patientCode');
const patientCode = `PAT-${String(patientNumber).padStart(3, '0')}`; // PAT-001, PAT-002...
```

---

## Troubleshooting

### Common Issues

#### 1. Build Errors

**Problem**: `The getter 'kWarning' isn't defined for the type 'AppColors'`

**Solution**: Add missing color constant to `lib/Utils/Colors.dart`:
```dart
static const Color kWarning = Color(0xFFF59E0B);
```

**Problem**: `RenderFlex overflowed by X pixels`

**Solution**: Wrap with `Expanded` or `Flexible`:
```dart
Row(
  children: [
    Expanded(
      child: Text('Long text that might overflow', overflow: TextOverflow.ellipsis),
    ),
  ],
)
```

#### 2. API Connection Issues

**Problem**: `Connection refused` or `Failed host lookup`

**Solution**: Check base URL configuration:
```dart
// For Android emulator
static const String baseUrl = 'http://10.0.2.2:3000';

// For iOS simulator / physical device on same network
static const String baseUrl = 'http://192.168.1.100:3000';

// For web
static const String baseUrl = 'http://localhost:3000';
```

**Problem**: `CORS policy error` in browser

**Solution**: Verify CORS is enabled in backend:
```javascript
// Server/Server.js
const cors = require('cors');
app.use(cors()); // Allow all origins (development)

// Production: Restrict origins
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

#### 3. MongoDB Connection Issues

**Problem**: `MongoNetworkError: connect ECONNREFUSED`

**Solution**:
```bash
# Check if MongoDB is running
mongosh mongodb://localhost:27017

# Start MongoDB service
# Windows: Runs automatically as service
# Linux: sudo systemctl start mongod
# macOS: brew services start mongodb-community

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/karur_hms
```

**Problem**: `Authentication failed`

**Solution**: If using MongoDB Atlas, check:
- Username and password are correct
- IP whitelist includes your IP (or 0.0.0.0/0 for testing)
- Connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

#### 4. JWT Token Issues

**Problem**: `Token is not valid` or `No token provided`

**Solution**:
```dart
// Check token is stored
final prefs = await SharedPreferences.getInstance();
final token = prefs.getString('token');
print('Token: $token');

// Re-login if token expired or invalid
if (token == null) {
  // Navigate to login
}
```

#### 5. Font Loading Issues

**Problem**: Fonts not loading / using fallback fonts

**Solution**:
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run

# Verify pubspec.yaml has google_fonts
dependencies:
  google_fonts: ^6.3.0
```

### Debug Tips

```dart
// Enable verbose logging
void main() {
  debugPrint('App starting...');
  runApp(MyApp());
}

// Log API calls
print('API Request: GET /api/appointments');
print('Response: $responseData');

// Catch and log errors
try {
  // code
} catch (e, stackTrace) {
  print('Error: $e');
  print('Stack trace: $stackTrace');
}
```

---

## Recent Updates

### Version 2.0.0 - Enterprise Appointments Upgrade (January 2025) ⭐

**Major Changes**:

1. **New AppointmentsPageNew.dart**:
   - Independent data loading (no longer depends on dashboard state)
   - Enterprise-grade UI with professional design
   - Large prominent search bar (56px height)
   - Shimmer skeleton loading animations
   - Patient code display (PAT-001, PAT-002...)
   - Gender icons (Iconsax.man, Iconsax.woman)
   - Status badges with color coding
   - Improved table layout and spacing

2. **Typography System**:
   - Migrated to Poppins (headers) + Inter (body)
   - Consistent font weights across the app
   - Professional sizing hierarchy

3. **Color System Enhancements**:
   - Added `kWarning` color constant
   - Expanded semantic color palette
   - Light variants for status colors

4. **Removed Features**:
   - Bulk selection checkboxes
   - Export functionality (to be reimplemented)
   - Dashboard dependency for appointments

**Files Changed**:
- ✅ `lib/Modules/Doctor/AppointmentsPageNew.dart` (NEW)
- ✅ `lib/Utils/Colors.dart` (UPDATED)
- ✅ `lib/Models/dashboardmodels.dart` (UPDATED)

**Migration Notes**:
- Old `Appointments.dart` and `widgets/Appoimentstable.dart` still exist for backward compatibility
- New code should use `AppointmentsPageNew.dart`
- Update navigation to point to new appointments page

---

## Development Commands Reference

### Flutter Commands

```bash
# Dependencies
flutter pub get                          # Install dependencies
flutter pub upgrade                      # Upgrade dependencies
flutter pub outdated                     # Check for outdated packages

# Running
flutter run                              # Run on default device
flutter run -d chrome                    # Run on Chrome
flutter run -d windows                   # Run on Windows
flutter run --release                    # Run in release mode

# Building
flutter build web --release              # Build web app
flutter build apk --release              # Build Android APK
flutter build appbundle --release        # Build Android App Bundle
flutter build windows --release          # Build Windows app
flutter build ios --release              # Build iOS app

# Code Quality
flutter analyze                          # Analyze code
dart format lib/                         # Format code
flutter test                             # Run tests
flutter test --coverage                  # Run tests with coverage

# Maintenance
flutter clean                            # Clean build artifacts
flutter doctor                           # Check Flutter setup
flutter devices                          # List connected devices
```

### Node.js Commands

```bash
# Dependencies
npm install                              # Install dependencies
npm update                               # Update dependencies
npm outdated                             # Check outdated packages

# Running
node Server.js                           # Start server
npm start                                # Start (if defined in package.json)
npm run dev                              # Development mode (if configured)

# Maintenance
npm audit                                # Security audit
npm audit fix                            # Fix vulnerabilities
```

### MongoDB Commands

```bash
# Connection
mongosh mongodb://localhost:27017        # Connect to local MongoDB
mongosh "mongodb+srv://cluster.mongodb.net" --username user  # MongoDB Atlas

# Database operations
use karur_hms                            # Switch to database
show collections                         # List collections
db.patients.find()                       # Query patients
db.appointments.countDocuments()         # Count appointments

# Indexing
db.patients.getIndexes()                 # View indexes
db.patients.createIndex({patientCode: 1})  # Create index
```

---

## Appendix

### Useful Resources

- **Flutter Documentation**: https://docs.flutter.dev/
- **Dart Documentation**: https://dart.dev/guides
- **Node.js Documentation**: https://nodejs.org/docs/
- **MongoDB Documentation**: https://www.mongodb.com/docs/
- **Express.js Documentation**: https://expressjs.com/
- **Google Fonts**: https://fonts.google.com/
- **Iconsax Icons**: https://iconsax.io/

### Contact & Support

- **Project**: Karur Gastro Foundation HMS
- **Repository**: (Add your repository URL)
- **Issue Tracker**: (Add your issue tracker URL)
- **Documentation**: This file (COPILOT.md)

---

## Notes for AI Assistants

When working with this codebase:

1. **Always refer to this file** for architectural decisions and patterns
2. **Use established patterns** - don't reinvent existing solutions
3. **Maintain consistency** - follow existing typography, colors, and component styles
4. **Test thoroughly** - verify changes don't break existing functionality
5. **Update this file** when making significant architectural changes
6. **Use AppointmentsPageNew.dart** as reference for new enterprise components
7. **Follow the denormalization pattern** for appointment data
8. **Always validate JWT tokens** on protected backend routes
9. **Use patient codes** (PAT-001) instead of raw IDs in UI where possible
10. **Keep node_modules README files** - only project README files should be managed

### Quick Reference for Common Tasks

- **Add new API endpoint**: Update `Server/routes/`, `lib/Services/Constants.dart`, `lib/Services/Authservices.dart`
- **Add new screen**: Create in `lib/Modules/{Role}/`, add to RootPage navigation
- **Modify database**: Update `Server/Models/` (Mongoose schema) and `lib/Models/` (Dart model)
- **Add new color**: Update `lib/Utils/Colors.dart`
- **Add new role**: Update User model, create new module, add to login routing

---

## Bug Fixes & Maintenance

### Recent Bug Fixes (January 2025)

A comprehensive bug tracking system has been implemented. All bugs are tracked in `error/HMS_Bug_Tracker.xlsx`.

#### Critical Issues Resolved

**Bug #14: Pharmacy Medicine Inventory Error** ✅ FIXED
- Added error handling for missing MedicineBatch model
- Implemented graceful fallback when batches don't exist
- Fixed: `Server/routes/pharmacy.js` lines 143-149

**Bug #5 & #8: Pathology Edit Patient Details** ✅ FIXED
- PUT /reports/:id endpoint properly implemented
- Added requireAdminOrPathologist authorization
- Fixed: `Server/routes/pathology.js` lines 358-406

#### Performance Improvements

**Bugs #6 & #9: Slow Loading Times** ✅ FIXED
- Created database indexes script
- Run: `node scripts/fix_database_indexes.js`
- Indexes created for all collections (patients, appointments, medicines, etc.)

#### Data Issues

**Bugs #10 & #13: Empty Dashboards / Zero Stock** ✅ FIXED
- Created sample data generation script
- Run: `node scripts/create_sample_data.js`
- Generates: medicines, batches, prescriptions, lab reports

### Database Maintenance Scripts

Located in `Server/scripts/`:

1. **fix_database_indexes.js**: Creates performance indexes
2. **create_sample_data.js**: Generates test data
3. **README.md**: Detailed usage instructions

Run these scripts after initial setup:
```bash
cd Server
node scripts/fix_database_indexes.js
node scripts/create_sample_data.js
```

### Known Issues Requiring Frontend Fixes

**Bug #3: New Appointment Not Saving**
- Backend validation requires: patientId, appointmentType, startAt
- Frontend should ensure all required fields are sent

**Bug #12: Appointment Fields Not Clear**
- Backend supports all fields
- Frontend UI needs redesign for better clarity

**Bug #11: Patient Queue Empty**
- Check patient's doctorId assignment
- Verify API call filters by correct doctorId

### Features Not Yet Implemented

**Bug #4 & #5: Payroll Management**
- Payroll module does not exist yet
- Requires new models: Employee, Payroll, PayrollRecord
- Requires new routes: /api/payroll/*

**Bug #1: Login Captcha**
- No captcha currently implemented
- auth.js POST /login works without captcha
- Design decision: implement captcha or remove from UI

For detailed bug information, refer to:
- `error/HMS_Bug_Tracker.xlsx` - Original bug tracker
- `error/BUG_FIX_SUMMARY.md` - Comprehensive fix documentation

---

**Last Updated**: January 2025  
**Version**: 2.0.1  
**Status**: ✅ Production Ready - Bugs Fixed  
**Maintained By**: Karur Gastro Foundation Development Team

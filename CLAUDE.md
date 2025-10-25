# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Karur Gastro Foundation HMS** is an enterprise-grade hospital management system built with Flutter (frontend) and Node.js/Express/MongoDB (backend). The system supports four distinct user roles: Doctor, Admin, Pharmacist, and Pathologist, each with dedicated modules for managing different aspects of hospital operations.

## Tech Stack

### Frontend
- **Flutter** 3.6.2 with Dart 3.6.2
- **State Management**: Provider and Riverpod
- **HTTP Client**: http package
- **Typography**: Google Fonts (Poppins for headers, Inter for body text)
- **Icons**: Iconsax
- **UI Components**: data_table_2, shimmer, table_calendar, fl_chart

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express.js 5.x
- **Database**: MongoDB 6.19.0 with Mongoose 8.18.0
- **Authentication**: JWT (jsonwebtoken) with bcryptjs for password hashing
- **Additional Services**: Google Cloud Vision API, Google Generative AI

## Development Commands

### Frontend (Flutter)

```bash
# Install dependencies
flutter pub get

# Run the application (defaults to first available device)
flutter run

# Run on specific platform
flutter run -d chrome      # Web
flutter run -d windows     # Windows
flutter run                # Android/iOS

# Build for production
flutter build web --release
flutter build apk --release
flutter build appbundle --release
flutter build windows --release

# Code analysis and formatting
flutter analyze
dart format lib/

# Run tests
flutter test
flutter test --coverage

# Clean build artifacts
flutter clean
```

### Backend (Node.js)

```bash
# Navigate to server directory
cd Server

# Install dependencies
npm install

# Start server (development)
node Server.js    # or node server.js

# The server runs on port 3000 by default (configurable via PORT env var)
```

### Environment Setup

The backend requires a `.env` file in the `Server/` directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/karur_hms

# JWT Secret
JWT_SECRET=your_secret_key_here

# Server Port
PORT=3000

# Initial Users (created automatically on first startup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_ROLE=superadmin

DOCTOR_EMAIL=doctor@example.com
DOCTOR_PASSWORD=doctor123
DOCTOR_ROLE=doctor

PHARMACIST_EMAIL=pharmacist@example.com
PHARMACIST_PASSWORD=pharmacist123
PHARMACIST_ROLE=pharmacist

PATHOLOGIST_EMAIL=pathologist@example.com
PATHOLOGIST_PASSWORD=pathologist123
PATHOLOGIST_ROLE=pathologist
```

## Architecture Overview

### Frontend Module Structure

The Flutter app is organized by user role modules:

```
lib/
├── Modules/
│   ├── Doctor/        # Doctor interface (appointments, patients, prescriptions)
│   ├── Admin/         # Admin interface (staff management, dashboard analytics)
│   ├── Pharmacist/    # Pharmacy operations (medicines, prescriptions)
│   ├── Pathologist/   # Lab operations (test reports, patient samples)
│   └── Common/        # Shared components (login, splash, chatbot)
├── Models/            # Data models matching backend API schemas
├── Services/          # Business logic and API communication
│   ├── Authservices.dart  # Authentication and HTTP client wrapper
│   └── Constants.dart     # API endpoints and configuration
├── Utils/             # Utilities and helpers
│   ├── Colors.dart        # Centralized color palette
│   └── Api_handler.dart   # Low-level HTTP operations
├── Widgets/           # Reusable UI components
└── Providers/         # State management providers
```

### Backend Route Structure

```
Server/
├── routes/
│   ├── auth.js          # Login, token validation
│   ├── doctors.js       # Doctor-specific operations, patient management
│   ├── appointment.js   # Appointment CRUD
│   ├── patients.js      # Patient CRUD
│   ├── staff.js         # Staff management
│   ├── pharmacy.js      # Medicine inventory and prescriptions
│   ├── pathology.js     # Lab reports and test management
│   ├── bot.js           # Chatbot API (Google Generative AI)
│   ├── intake.js        # Patient intake forms
│   ├── scanner.js       # Document scanning and OCR
│   └── card.js          # Optimized patient profile card data
├── Models/              # Mongoose schemas
├── Middleware/
│   └── Auth.js          # JWT authentication middleware
├── Config/
│   └── Dbconfig.js      # MongoDB connection
└── Server.js            # Main entry point
```

### Data Flow

1. **Authentication**: User logs in via `LoginPage.dart` → `/api/auth/login` → JWT token stored in SharedPreferences
2. **API Requests**: All authenticated requests include JWT token in headers via `AuthService._withAuth()`
3. **State Management**: Data fetched via `AuthService` methods, stored in Provider/Riverpod state
4. **UI Updates**: Stateful widgets subscribe to providers and rebuild on data changes

### Key Architecture Patterns

**Patient Code System**: Patients are identified by auto-incrementing codes (PAT-001, PAT-002, etc.) generated using MongoDB counters collection. This is implemented in `Server/routes/doctors.js` using the `getNextSequence()` helper function.

**JWT Authentication**: The backend uses a custom `auth` middleware that validates JWT tokens from the `x-auth-token` header. Frontend stores tokens in SharedPreferences and includes them automatically via `AuthService._withAuth()`.

**Role-Based Routing**: Each user role has a dedicated "RootPage" component:
- `lib/Modules/Doctor/RootPage.dart`
- `lib/Modules/Admin/RootPage.dart`
- `lib/Modules/Pharmacist/root_page.dart`
- `lib/Modules/Pathologist/root_page.dart`

These root pages manage the navigation sidebar and route between module-specific screens.

**API Communication**: The frontend uses a two-layer API architecture:
1. `ApiHandler` (Utils/Api_handler.dart): Low-level HTTP operations
2. `AuthService` (Services/Authservices.dart): High-level authenticated API wrapper with convenience methods

**Denormalized Data**: To optimize read performance, appointment documents store denormalized patient data (name, age, gender, patientCode) to avoid joins. When updating patient records, remember to update related appointment documents.

## API Endpoint Patterns

All API endpoints are defined in `lib/Services/Constants.dart` as static methods returning `RestApi` objects.

### Common Patterns

```dart
// GET request
final data = await AuthService.instance.get('/api/doctors/patients/my');

// POST request
final result = await AuthService.instance.post(
  '/api/appointments',
  {'patientId': '123', 'date': '2025-01-15', 'time': '10:00'}
);

// PUT request
await AuthService.instance.put(
  '/api/patients/123',
  {'name': 'Updated Name', 'age': 30}
);

// DELETE request
await AuthService.instance.delete('/api/appointments/123');
```

### Key Backend Routes

- `POST /api/auth/login` - User authentication
- `GET /api/doctors/patients/my` - Get current doctor's patients
- `GET /api/appointments` - Get appointments (filtered by user role)
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/pharmacy/medicines` - Get medicine inventory
- `GET /api/pathology/reports` - Get lab reports
- `POST /api/bot/chat` - Chatbot interaction

## Design System

### Typography

The app uses Google Fonts with specific font families for hierarchy:

- **Headers**: Poppins SemiBold (FontWeight.w600) - sizes 20-28
- **Body Text**: Inter Medium (FontWeight.w500) - sizes 12-16
- **Captions**: Inter Regular (FontWeight.w400) - sizes 10-12

### Color Palette

Centralized in `lib/Utils/Colors.dart`:

```dart
// Primary (Enterprise Blue)
AppColors.primary           // #1E3A72
AppColors.primary600        // #2F5BA0
AppColors.primary700        // #264E86
AppColors.primary800        // #1A365D

// Semantic
AppColors.kSuccess          // Green (#22C55E)
AppColors.kDanger           // Red (#DC2626)
AppColors.kWarning          // Amber (#F59E0B)
AppColors.kInfo             // Blue (primary600)

// Text
AppColors.kTextPrimary      // #1E293B (slate-800)
AppColors.kTextSecondary    // #64748B (slate-500)

// Backgrounds
AppColors.background        // #F9FAFB (gray-50)
AppColors.cardBackground    // #FFFFFF
```

### UI Components

**Enterprise Table Pattern**: The appointments module uses an enterprise-grade table design:
- Large search bar (56px height) with rounded corners
- Alternating row colors for readability
- Gender icons (Iconsax.man, Iconsax.woman)
- Status badges with color-coded backgrounds
- Shimmer skeleton loading states

Example: `lib/Modules/Doctor/AppointmentsPageNew.dart`

**Generic Reusable Table**: `lib/Widgets/generic_enterprise_table.dart` provides a reusable table component for consistent styling across modules.

## Important Data Models

### Patient

```dart
class PatientDetails {
  final String patientId;
  final String patientCode;    // PAT-001, PAT-002, etc.
  final String name;
  final int age;
  final String gender;         // Male/Female/Other
  final String? phone;
  final String? email;
  final String? bloodGroup;
  final List<String>? allergies;
  final List<String>? medicalHistory;
}
```

### Appointment

```dart
class DashboardAppointments {
  final String id;
  final String patientId;
  final String patientCode;      // Denormalized from patient
  final String patientName;      // Denormalized from patient
  final int patientAge;          // Denormalized from patient
  final String gender;           // Denormalized from patient
  final String date;             // YYYY-MM-DD format
  final String time;             // HH:mm format
  final String reason;
  final String status;           // Scheduled/Completed/Cancelled/No-Show
  final String? diagnosis;
  final String? currentNotes;
}
```

MongoDB schemas are defined in `Server/Models/` using Mongoose.

## Backend Configuration

### MongoDB Connection

Connection is established in `Server/Config/Dbconfig.js` using the `MONGODB_URI` environment variable.

### Initial Users

On first startup, the server automatically creates initial users for each role (admin, doctor, pharmacist, pathologist) based on environment variables. Check `Server/Server.js` functions:
- `createInitialAdmin()`
- `createInitialDoctor()`
- `createInitialPharmacist()`
- `createInitialPathologist()`

### Authentication Middleware

The `Server/Middleware/Auth.js` middleware validates JWT tokens and attaches user information to `req.user`. All protected routes use this middleware:

```javascript
router.get('/protected-route', auth, async (req, res) => {
  // req.user contains decoded JWT payload
  const userId = req.user._id;
  const userRole = req.user.role;
});
```

## Working with the Codebase

### Adding a New API Endpoint

1. **Backend**: Add route handler in appropriate `Server/routes/*.js` file
2. **Frontend**: Add endpoint definition in `lib/Services/Constants.dart` → `ApiEndpoints` class
3. **Frontend**: Add convenience method in `lib/Services/Authservices.dart` if needed
4. **Frontend**: Create/update data model in `lib/Models/` to match API response

### Adding a New Module Screen

1. Create new file in `lib/Modules/{RoleName}/`
2. Import necessary dependencies (google_fonts, iconsax, AppColors)
3. Use consistent typography (Poppins for headers, Inter for body)
4. Follow enterprise table design patterns if displaying tabular data
5. Add navigation to module's RootPage.dart

### Modifying Database Schema

1. Update Mongoose model in `Server/Models/`
2. Update corresponding Dart model in `lib/Models/`
3. Consider data migration if schema changes affect existing records
4. Update any denormalized data patterns

### Common Issues

**CORS Errors**: Backend uses `cors()` middleware with default settings. For specific origins, modify `Server/Server.js`.

**API Base URL**: Change `ApiConstants.baseUrl` in `lib/Services/Constants.dart` to match your backend. Current default: `http://10.154.105.132:3000`

**Token Expiration**: JWT tokens don't have automatic refresh. User must re-login when token expires.

**Patient Code Generation**: Patient codes are auto-generated by the backend. Never manually set `patientCode` when creating patients.

## Testing

Currently, the project has minimal test coverage. When adding tests:

```bash
# Unit tests
flutter test test/models/patient_test.dart

# Widget tests
flutter test test/widgets/appointment_card_test.dart

# Integration tests
flutter drive --target=test_driver/app.dart
```

## Recent Major Changes

**Appointments Module Upgrade** (January 2025): The appointments interface was upgraded to enterprise standards with:
- New `AppointmentsPageNew.dart` with independent data loading (no longer depends on dashboard state)
- Poppins/Inter typography system
- Gender icons and patient code display
- Shimmer skeleton loading states
- Large prominent search bar (56px height)

The old appointments table (`widgets/Appoimentstable.dart`) still exists for backward compatibility but new work should use `AppointmentsPageNew.dart`.

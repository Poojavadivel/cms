# Frontend React Code Analysis

## Executive Summary

This is a comprehensive Hospital Management System (HMS) built with **React 19.2.1** and modern web technologies. The frontend follows a professional architecture with role-based access control, featuring separate dashboards for Admin, Doctor, Pharmacist, and Pathologist roles.

---

## 📊 Project Statistics

- **Total Files**: 272 source files
- **Framework**: React 19.2.1 (latest)
- **Build Tool**: React Scripts 5.0.1
- **Routing**: React Router DOM 7.10.1
- **Styling**: Tailwind CSS 3.4.19
- **State Management**: React Context API
- **HTTP Client**: Axios 1.13.2
- **UI Libraries**: Framer Motion, React Icons, Recharts

---

## 🏗️ Architecture Overview

### 1. **Project Structure**

```
react/hms/src/
├── components/          # Reusable UI components
├── modules/            # Feature-based modules (Admin, Doctor, Pharmacist, Pathologist)
├── pages/              # Page-level components with routing
├── services/           # API services and business logic
├── provider/           # React Context providers
├── routes/             # Route configuration
├── models/             # Data models (TypeScript-like classes)
├── utils/              # Utility functions
├── constants/          # App constants and configs
├── assets/             # Static assets
├── styles/             # Global styles
└── widgets/            # Specialized widgets
```

### 2. **Technology Stack**

#### Core Technologies
- **React 19.2.1** - Latest React with concurrent features
- **React Router DOM 7.10.1** - Client-side routing
- **Tailwind CSS 3.4.19** - Utility-first CSS framework
- **Axios 1.13.2** - HTTP client for API calls

#### UI/UX Libraries
- **Framer Motion 12.23.26** - Animation library
- **React Icons 5.5.0** - Icon library
- **Recharts 3.5.1** - Chart library for dashboards
- **React Calendar 6.0.0** - Calendar component

#### Utilities
- **date-fns 4.1.0** - Date manipulation
- **html2canvas 1.4.1** - Screenshot generation
- **jsPDF 4.0.0** - PDF generation
- **Winston 3.19.0** - Logging library

#### Testing
- **@testing-library/react 16.3.0**
- **@testing-library/jest-dom 6.9.1**
- **@testing-library/user-event 13.5.0**

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Login Process** (`authService.js`)
   - User enters credentials at `/login`
   - `authService.signIn()` sends request to backend
   - Receives JWT token and user data
   - Stores token in `localStorage` as `auth_token`
   - Stores user data in `localStorage` as `user_data`
   - Creates role-specific user model (Admin, Doctor, Pharmacist, Pathologist)

2. **Token Validation** (`SplashScreen.jsx`)
   - On app startup, checks for existing token
   - Calls `authService.getUserData()` to validate with backend
   - If valid, redirects to role-specific dashboard
   - If invalid, clears storage and redirects to login

3. **Protected Routes** (`ProtectedRoute.jsx`, `RoleBasedRoute.jsx`)
   - `ProtectedRoute` - Requires authentication
   - `RoleBasedRoute` - Requires specific role(s)
   - Auto-redirect to `/login` or `/unauthorized`

### User Models

Role-based models with inheritance structure:

```javascript
// Base User model
User {
  id, email, mobile, fullName, role, avatar, createdAt, updatedAt
}

// Role-specific models extend User
Admin extends User { permissions }
Doctor extends User { specialization, qualifications, experience }
Pharmacist extends User { licenseNumber }
Pathologist extends User { licenseNumber, specialization }
```

---

## 🎯 Routing System

### Route Structure

```javascript
/ (root)                    → SplashScreen (checks auth)
/login                      → LoginPage
/forgot-password            → ForgotPasswordPage
/reset-password/:token      → ResetPasswordPage
/unauthorized               → UnauthorizedPage
/404                        → NotFoundPage

// Protected Routes (requires authentication)
/profile                    → ProfilePage
/settings                   → SettingsPage

// Admin Routes (role: admin, superadmin)
/admin
  ├── /dashboard           → AdminDashboard
  ├── /users               → AdminUsers
  ├── /appointments        → AdminAppointments
  ├── /patients            → AdminPatients
  ├── /staff               → AdminStaff
  ├── /pharmacy            → AdminPharmacy
  ├── /invoice             → AdminInvoice
  ├── /pathology           → AdminPathology
  ├── /ward-map            → AdminWardMap
  └── /settings            → AdminSettings

// Doctor Routes (role: doctor)
/doctor
  ├── /dashboard           → DoctorDashboard
  ├── /appointments        → DoctorAppointments
  ├── /patients            → DoctorPatients
  ├── /schedule            → DoctorSchedule
  └── /settings            → DoctorSettings

// Pharmacist Routes (role: pharmacist)
/pharmacist
  ├── /dashboard           → PharmacistDashboard
  ├── /medicines           → PharmacistMedicines
  ├── /prescriptions       → PharmacistPrescriptions
  └── /settings            → PharmacistSettings

// Pathologist Routes (role: pathologist)
/pathologist
  ├── /dashboard           → PathologistDashboard
  ├── /test-reports        → PathologistTestReports
  ├── /patients            → PathologistPatients
  └── /settings            → PathologistSettings
```

### Lazy Loading

All page components use React's `lazy()` for code splitting:

```javascript
const AdminDashboard = lazy(() => import('../modules/admin/dashboard/Dashboard'));
const DoctorPatients = lazy(() => import('../modules/doctor/patients/Patients'));
// ... etc
```

Benefits:
- Reduced initial bundle size
- Faster initial page load
- Better performance

---

## 🔄 State Management

### Context API Architecture

The app uses React Context API with multiple specialized contexts:

#### 1. **AppContext** (Primary Auth Context)
- Manages authentication state
- Stores current user and token
- Provides login/logout methods
- Persists to localStorage

```javascript
const { user, token, setUser, clearUser, isLoading } = useApp();
```

#### 2. **ThemeContext**
- Manages UI theme (light/dark mode)
- Provides theme toggle functionality

```javascript
const { theme, toggleTheme } = useTheme();
```

#### 3. **LoadingContext**
- Global loading states
- Used for API calls and async operations

```javascript
const { showLoading, hideLoading, isLoading } = useLoading();
```

#### 4. **NotificationContext**
- Toast notifications
- Success/error/warning messages

```javascript
const { showNotification, showError, showSuccess } = useNotification();
```

#### 5. **NavigationContext**
- Navigation state
- Breadcrumb management

```javascript
const { currentPath, setBreadcrumb } = useNavigation();
```

### Context Hierarchy

```javascript
<AppProvider>              // Auth & User
  <ThemeProvider>          // UI Theme
    <LoadingProvider>      // Loading States
      <NotificationProvider>  // Notifications
        <NavigationProvider>  // Navigation
          {children}
        </NavigationProvider>
      </NotificationProvider>
    </LoadingProvider>
  </ThemeProvider>
</AppProvider>
```

---

## 📡 API Integration

### Service Layer Architecture

#### 1. **AuthService** (`authService.js`)

Central authentication service with singleton pattern:

```javascript
class AuthService {
  // Auth methods
  signIn(email, password)
  signOut()
  getUserData()
  changePassword(currentPassword, newPassword)
  
  // HTTP helpers
  get(path)
  post(path, body)
  put(path, body)
  patch(path, body)
  delete(path)
  
  // File operations
  uploadFile(path, file, additionalData)
  downloadFileAsBlob(path)
  
  // Core request handler
  makeAuthRequest(url, options)
}
```

Features:
- Automatic token attachment to requests
- Token refresh logic
- Error handling with ApiException
- Request/response logging with apiLogger
- Support for both JSON and file uploads

#### 2. **Specialized Services**

```javascript
// Patient Management
patientsService.js
  - getPatients()
  - getPatientById(id)
  - createPatient(data)
  - updatePatient(id, data)
  - deletePatient(id)

// Appointments
appointmentsService.js
  - getAppointments(filters)
  - scheduleAppointment(data)
  - updateAppointmentStatus(id, status)
  - cancelAppointment(id)

// Pharmacy
pharmacyService.js
  - getMedicines()
  - getPrescriptions()
  - dispenseMedicine(prescriptionId)

// Pathology
pathologyService.js
  - getTestReports()
  - uploadReport(data)
  - getReportById(id)

// Doctor
doctorService.js
  - getDoctors()
  - getDoctorAvailability(doctorId)
  - updateSchedule(data)

// Staff Management
staffService.js
  - getStaff()
  - addStaff(data)
  - updateStaff(id, data)

// Reports
reportService.js
  - generateReport(type, params)
  - downloadReport(reportId)
```

#### 3. **API Configuration**

```javascript
// Environment-based API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (isLocalhost 
    ? 'http://localhost:5000/api'
    : 'https://hms-dev.onrender.com/api');
```

#### 4. **API Helpers** (`apiHelpers.js`)

Utility functions for API interactions:

```javascript
// Query string building
buildQueryString(params)

// Response handling
handleResponse(response)

// Retry logic with exponential backoff
retryRequest(fn, maxRetries, delay)

// File operations
fileToBase64(file)
downloadFile(blob, filename)
validateFileType(file, allowedTypes)
validateFileSize(file, maxSize)

// Error parsing
parseErrorMessage(error)

// Utilities
debounce(func, wait)
throttle(func, limit)
formatDateForAPI(date)
parseDateFromAPI(dateString)
```

#### 5. **Logging System**

##### API Logger (`apiLogger.js`)
- Logs all API requests/responses
- Tracks authentication events
- Performance monitoring

##### Logger Service (`loggerService.js`)
- Winston-based logging
- Daily rotating log files
- Separate logs for errors, auth, API

---

## 🎨 UI Components

### Component Categories

#### 1. **Common Components** (`components/common/`)
- **ErrorBoundary** - Catches React errors
- **LoadingFallback** - Loading spinner for lazy routes
- **NetworkStatus** - Online/offline indicator
- **Layout components** - Headers, sidebars, footers

#### 2. **Specialized Components**

```
components/
├── appointments/       # Appointment-related components
├── chatbot/           # AI chatbot integration
├── doctor/            # Doctor-specific components
├── patient/           # Patient-specific components
├── modals/            # Modal dialogs
└── GenericDataTable/  # Reusable data table component
```

#### 3. **Generic Data Table** (`GenericDataTable.jsx`)

Powerful reusable table component with:
- Sorting
- Filtering
- Pagination
- Column configuration
- Action buttons
- Responsive design
- Export functionality

### Styling Approach

#### Tailwind CSS
- Utility-first approach
- Custom configuration in `tailwind.config.js`
- Custom animations (fade-in, slide-up)
- Responsive design utilities

```javascript
// Example: Custom animations
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
}
```

#### CSS Modules
- Component-specific styles
- Scoped CSS to prevent conflicts
- Example: `GenericDataTable.css`

---

## 📦 Module Organization

### Feature-Based Modules

Each role has its own module directory:

```
modules/
├── admin/
│   ├── dashboard/       # Admin dashboard with statistics
│   ├── users/           # User management
│   ├── appointments/    # Appointment oversight
│   ├── patients/        # Patient management
│   ├── staff/           # Staff management
│   ├── pharmacy/        # Pharmacy management
│   ├── invoice/         # Billing & invoices
│   ├── pathology/       # Lab management
│   ├── ward-map/        # Hospital ward visualization
│   └── settings/        # Admin settings
│
├── doctor/
│   ├── dashboard/       # Doctor dashboard
│   ├── appointments/    # Appointment management
│   ├── patients/        # Patient records
│   ├── schedule/        # Schedule management
│   └── settings/        # Doctor settings
│
├── pharmacist/
│   ├── Dashboard_Flutter # Main dashboard
│   ├── Medicines_Table   # Medicine inventory
│   ├── Prescriptions_Flutter # Prescription management
│   └── Settings          # Pharmacist settings
│
└── pathologist/
    ├── dashboard/       # Pathology dashboard
    ├── test-reports/    # Lab report management
    ├── patients/        # Patient records
    └── settings/        # Pathologist settings
```

### Module Pattern

Each module typically contains:
- **Main component** - Primary view
- **Sub-components** - Feature-specific components
- **Hooks** - Custom hooks for module logic
- **Utils** - Module-specific utilities
- **Styles** - Component styles

---

## 🔧 Utilities & Helpers

### Date Helpers (`dateHelpers.js`)
```javascript
formatDate(date)
formatTime(time)
calculateAge(birthDate)
isToday(date)
isFuture(date)
addDays(date, days)
```

### Avatar Helpers (`avatarHelpers.js`)
```javascript
getInitials(name)
generateAvatarColor(name)
getAvatarUrl(user)
```

### API Logger (`apiLogger.js`)
```javascript
logRequest(method, url, body, headers)
logResponse(method, url, status, data, duration)
logError(method, url, error, duration)
logAuth(event, data)
```

---

## 📱 Features by Role

### Admin Dashboard
- **Overview Statistics**
  - Total patients, appointments, staff
  - Revenue analytics
  - Bed occupancy
  
- **Management Modules**
  - User management (create, edit, delete users)
  - Staff management
  - Appointment oversight
  - Patient records
  - Pharmacy inventory
  - Pathology lab management
  - Billing & invoices
  - Ward/bed mapping
  
- **Reports & Analytics**
  - Revenue reports
  - Appointment analytics
  - Occupancy reports

### Doctor Dashboard
- **Appointment Management**
  - View scheduled appointments
  - Update appointment status
  - Patient consultation notes
  
- **Patient Management**
  - Patient medical records
  - Prescription writing
  - Treatment history
  
- **Schedule Management**
  - Set availability
  - Manage working hours
  - Leave management

### Pharmacist Dashboard
- **Medicine Inventory**
  - Stock management
  - Low stock alerts
  - Medicine search
  - Expiry tracking
  
- **Prescription Management**
  - View prescriptions
  - Dispense medicines
  - Update prescription status
  - Billing integration

### Pathologist Dashboard
- **Test Report Management**
  - Upload lab reports
  - Report templates
  - Test result entry
  
- **Patient Management**
  - View patient test history
  - Search reports
  
- **Report Generation**
  - PDF generation
  - Report downloads

---

## 🚀 Performance Optimizations

### 1. **Code Splitting**
- Lazy loading of all route components
- Reduces initial bundle size
- Faster time to interactive

### 2. **Memoization**
- `useCallback` for stable function references
- `useMemo` for expensive computations
- React.memo for component optimization

### 3. **Virtualization**
- Large lists use virtual scrolling
- Reduces DOM nodes
- Better performance with large datasets

### 4. **Caching**
- localStorage for auth data
- API response caching
- Image caching

### 5. **Bundle Optimization**
- Tailwind CSS purging (removes unused styles)
- Production builds minified
- Source maps for debugging

---

## 🔒 Security Features

### 1. **Authentication Security**
- JWT token-based authentication
- Token stored in localStorage (consider httpOnly cookies for production)
- Automatic token validation on app load
- Token expiry handling

### 2. **Authorization**
- Role-based access control (RBAC)
- Protected routes by role
- API-level permission checks

### 3. **Input Validation**
- Client-side validation
- Sanitization of user inputs
- File upload validation (type, size)

### 4. **Error Handling**
- ErrorBoundary for React errors
- API error handling
- User-friendly error messages
- No sensitive data in error messages

### 5. **CORS Configuration**
- Environment-based API URLs
- Proper CORS headers expected from backend

---

## 🌐 Network Handling

### Online/Offline Detection
```javascript
// App.js monitors network status
useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

### Network Status Banner
- Shows when offline
- Auto-dismisses when back online
- Prevents API calls when offline

### Retry Logic
- Exponential backoff for failed requests
- Maximum retry attempts
- Skip retries for 4xx errors

---

## 📄 Key Files Overview

### Core Application Files

| File | Purpose |
|------|---------|
| `App.js` | Main app component, routing setup, network monitoring |
| `index.js` | App entry point, React root rendering |
| `AppRoutes.jsx` | Central routing configuration |
| `ProtectedRoute.jsx` | Authentication guard for routes |
| `RoleBasedRoute.jsx` | Role-based authorization guard |

### Provider Files

| File | Purpose |
|------|---------|
| `AppContext.js` | Authentication & user state |
| `ThemeContext.js` | UI theme management |
| `LoadingContext.js` | Global loading states |
| `NotificationContext.js` | Toast notifications |
| `NavigationContext.js` | Navigation state |
| `AppProviders.js` | Combines all providers |

### Service Files

| File | Purpose |
|------|---------|
| `authService.js` | Authentication API calls |
| `patientsService.js` | Patient management APIs |
| `appointmentsService.js` | Appointment APIs |
| `pharmacyService.js` | Pharmacy/medicine APIs |
| `pathologyService.js` | Lab report APIs |
| `doctorService.js` | Doctor-specific APIs |
| `staffService.js` | Staff management APIs |
| `invoiceService.js` | Billing APIs |

### Model Files

| File | Purpose |
|------|---------|
| `User.js` | Base user model |
| `Admin.js` | Admin user model |
| `Doctor.js` | Doctor user model |
| `Pharmacist.js` | Pharmacist user model |
| `Pathologist.js` | Pathologist user model |
| `Patients.js` | Patient data model |
| `PatientVitals.js` | Patient vitals model |
| `Staff.js` | Staff model |
| `AppointmentDraft.js` | Appointment model |
| `DashboardModels.js` | Dashboard data models |

---

## 🧪 Testing Setup

### Testing Libraries
- **@testing-library/react** - Component testing
- **@testing-library/jest-dom** - Custom Jest matchers
- **@testing-library/user-event** - User interaction simulation

### Test Scripts
```json
{
  "test": "react-scripts test",
  "test-backend": "node test-backend.js"
}
```

### Test Files
- `App.test.js` - App component tests
- `setupTests.js` - Test configuration

---

## 🔨 Build & Deployment

### Development Scripts
```json
{
  "start": "react-scripts start",      // Dev server on port 3000
  "dev": "react-scripts start",        // Alias for start
  "test": "react-scripts test",        // Run tests
  "build": "react-scripts build",      // Production build
  "eject": "react-scripts eject"       // Eject from CRA
}
```

### Production Scripts
```json
{
  "prod-build": "REACT_APP_API_URL=https://hms-dev.onrender.com/api npm run build",
  "serve": "node server.js",           // Serve built files
  "prod": "npm run build && npm run serve"
}
```

### Environment Configuration

#### `.env` (Development)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### `.env.production` (Production)
```env
REACT_APP_API_URL=https://hms-dev.onrender.com/api
```

### Build Output
- Build directory: `build/`
- Static assets optimized
- Code splitting applied
- Minified and compressed

### Deployment
- `server.js` - Express server to serve static files
- `render.yaml` - Render.com deployment config
- Supports deployment to Render, Vercel, Netlify, etc.

---

## 🐛 Error Handling

### Error Boundary
```javascript
// ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error
    // Show fallback UI
  }
}
```

### API Error Handling
```javascript
// Custom ApiException class
class ApiException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
  }
}

// Usage in services
catch (error) {
  if (error instanceof ApiException) {
    showNotification(error.message, 'error');
  } else {
    showNotification('Network error', 'error');
  }
}
```

### User-Friendly Error Messages
- 401: "Unauthorized. Please log in again."
- 403: "Access denied. You do not have permission."
- 404: "Resource not found."
- 500: "Server error. Please try again later."

---

## 📊 Data Flow

### Authentication Flow
```
Login Page
  ↓
authService.signIn(email, password)
  ↓
Backend API (/api/auth/login)
  ↓
Receive { user, accessToken }
  ↓
Save to localStorage
  ↓
Create role-specific user model
  ↓
Update AppContext state
  ↓
Redirect to role-specific dashboard
```

### Data Fetching Flow
```
Component Mount
  ↓
useEffect hook
  ↓
Call service method (e.g., patientsService.getPatients())
  ↓
authService.makeAuthRequest()
  ↓
Attach auth token
  ↓
Fetch from API
  ↓
Handle response/error
  ↓
Update component state
  ↓
Render UI
```

### Form Submission Flow
```
User fills form
  ↓
Form validation (client-side)
  ↓
onSubmit handler
  ↓
showLoading()
  ↓
Call service method (e.g., createPatient(data))
  ↓
API request with auth token
  ↓
Handle response
  ↓
hideLoading()
  ↓
Show success/error notification
  ↓
Update UI / Navigate
```

---

## 🎯 Best Practices Observed

### 1. **Code Organization**
✅ Feature-based module structure
✅ Separation of concerns (components, services, models)
✅ Consistent file naming conventions
✅ Logical folder hierarchy

### 2. **React Patterns**
✅ Functional components with hooks
✅ Custom hooks for reusable logic
✅ Context API for global state
✅ Lazy loading for performance
✅ Error boundaries for error handling

### 3. **API Integration**
✅ Centralized service layer
✅ Singleton pattern for auth service
✅ Consistent error handling
✅ Request/response logging
✅ Automatic token attachment

### 4. **Security**
✅ Protected routes
✅ Role-based authorization
✅ Token validation
✅ Input validation
✅ Error message sanitization

### 5. **Performance**
✅ Code splitting
✅ Lazy loading
✅ Memoization where needed
✅ Optimized re-renders
✅ Efficient state updates

### 6. **User Experience**
✅ Loading indicators
✅ Error notifications
✅ Network status awareness
✅ Smooth animations
✅ Responsive design

---

## 🚧 Areas for Improvement

### 1. **Security Enhancements**
⚠️ Consider httpOnly cookies instead of localStorage for tokens
⚠️ Implement CSRF protection
⚠️ Add rate limiting on frontend
⚠️ Implement content security policy (CSP)

### 2. **Performance**
⚠️ Implement service workers for offline functionality
⚠️ Add request caching/deduplication
⚠️ Optimize large data tables with virtualization
⚠️ Consider React Query for better data fetching

### 3. **Testing**
⚠️ Increase test coverage
⚠️ Add integration tests
⚠️ Add E2E tests with Cypress or Playwright
⚠️ Test error scenarios

### 4. **Accessibility**
⚠️ Add ARIA labels
⚠️ Keyboard navigation support
⚠️ Screen reader compatibility
⚠️ Color contrast improvements

### 5. **Documentation**
⚠️ Add JSDoc comments to all functions
⚠️ Create component documentation
⚠️ API integration guide
⚠️ Deployment guide

### 6. **Monitoring**
⚠️ Add application monitoring (e.g., Sentry)
⚠️ Performance monitoring
⚠️ User analytics
⚠️ Error tracking

---

## 🔄 Comparison with Backend

### Alignment
✅ **Role Structure**: Matches backend roles (admin, doctor, pharmacist, pathologist)
✅ **API Endpoints**: Uses backend API structure
✅ **Data Models**: Mirrors backend models
✅ **Authentication**: JWT-based, matches backend

### Integration Points
- **Auth Endpoint**: `/api/auth/login`, `/api/auth/validate-token`
- **Patients**: `/api/patients/*`
- **Appointments**: `/api/appointments/*`
- **Pharmacy**: `/api/pharmacy/*`, `/api/medicines/*`
- **Pathology**: `/api/pathology/*`, `/api/lab-reports/*`
- **Doctors**: `/api/doctors/*`
- **Staff**: `/api/staff/*`

---

## 📝 Conclusion

This React frontend is a **professionally architected** Hospital Management System with:

✅ **Modern Tech Stack** - React 19, React Router 7, Tailwind CSS
✅ **Clean Architecture** - Feature-based modules, service layer, context API
✅ **Role-Based Access** - 4 distinct user roles with tailored dashboards
✅ **Comprehensive Features** - Patient management, appointments, pharmacy, pathology
✅ **Security Focused** - Protected routes, token auth, input validation
✅ **Performance Optimized** - Lazy loading, code splitting, memoization
✅ **Good UX** - Loading states, notifications, network awareness

The codebase demonstrates strong engineering practices and is well-suited for a production hospital management application. With the suggested improvements (especially in testing, accessibility, and security), it would be production-ready at enterprise level.

---

**Analysis Date**: 2026-03-03
**Total Lines Analyzed**: 272 files
**Framework Version**: React 19.2.1
**Architecture Pattern**: Feature-based modules with Context API

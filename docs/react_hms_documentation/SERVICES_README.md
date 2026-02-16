# Services Documentation

This directory contains all service files for API interactions, authentication, and utilities in the Hospital Management System.

## 📁 File Structure

```
services/
├── authService.js      # Authentication service (singleton)
├── apiConstants.js     # API endpoint constants
├── SplashScreen.jsx    # Splash/loading screen component
├── SplashScreen.css    # Splash screen styles
├── index.js            # Central exports
└── README.md           # This file
```

## 🔐 Authentication Service

**File**: `authService.js`

The `authService` is a singleton service that handles all authentication-related operations.

### Key Features

- **Token Management** - Store/retrieve/clear JWT tokens
- **User Authentication** - Sign in, sign out, validate token
- **Role-Based Parsing** - Automatically parse user data into correct model (Admin, Doctor, etc.)
- **API Request Helper** - Authenticated API calls with automatic token injection
- **Error Handling** - Custom ApiException for consistent error handling

### Usage Examples

#### Sign In
```javascript
import { authService } from './services';

const handleLogin = async (email, password) => {
  try {
    const authResult = await authService.signIn(email, password);
    console.log('User:', authResult.user);
    console.log('Token:', authResult.token);
    // User is automatically saved to localStorage
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};
```

#### Check Authentication on Startup
```javascript
import { authService } from './services';

const checkAuth = async () => {
  const authResult = await authService.getUserData();
  
  if (authResult) {
    // User is logged in
    console.log('Welcome back,', authResult.user.fullName);
  } else {
    // User is not logged in
    console.log('Please log in');
  }
};
```

#### Make Authenticated API Request
```javascript
import { authService } from './services';

// GET request
const patients = await authService.get('/patients');

// POST request
const newPatient = await authService.post('/patients', {
  firstName: 'John',
  lastName: 'Doe',
  // ...
});

// PUT request
const updated = await authService.put('/patients/123', {
  status: 'active'
});

// DELETE request
await authService.delete('/patients/123');
```

#### Upload File
```javascript
import { authService } from './services';

const uploadAvatar = async (file) => {
  try {
    const result = await authService.uploadFile(
      '/users/avatar',
      file,
      { userId: '123' }
    );
    console.log('Upload successful:', result.url);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

#### Sign Out
```javascript
import { authService } from './services';

const handleLogout = async () => {
  await authService.signOut();
  // Token and user data cleared from localStorage
  navigate('/login');
};
```

### API Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `signIn(email, password)` | Sign in user | `AuthResult` |
| `getUserData()` | Validate token & get user | `AuthResult` or `null` |
| `signOut()` | Clear session | `boolean` |
| `getToken()` | Get stored token | `string` or `null` |
| `saveToken(token)` | Save token | `boolean` |
| `clearToken()` | Clear all auth data | `boolean` |
| `get(path)` | Authenticated GET | `any` |
| `post(path, body)` | Authenticated POST | `any` |
| `put(path, body)` | Authenticated PUT | `any` |
| `delete(path)` | Authenticated DELETE | `any` |
| `uploadFile(path, file, data)` | Upload with auth | `any` |

### AuthResult Class

```javascript
class AuthResult {
  constructor(user, token) {
    this.user = user;    // Admin, Doctor, Pharmacist, or Pathologist instance
    this.token = token;  // JWT token string
  }
}
```

### ApiException Class

```javascript
class ApiException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
  }
}
```

## 🌐 API Constants

**File**: `apiConstants.js`

Centralized API endpoint definitions organized by feature.

### Available Endpoint Groups

- **AuthEndpoints** - Authentication endpoints
- **UserEndpoints** - User profile management
- **PatientEndpoints** - Patient management
- **AppointmentEndpoints** - Appointment scheduling
- **DoctorEndpoints** - Doctor-specific endpoints
- **StaffEndpoints** - Staff management
- **PayrollEndpoints** - Payroll processing
- **PharmacyEndpoints** - Pharmacy/medicine management
- **PathologyEndpoints** - Lab tests and reports
- **DashboardEndpoints** - Dashboard statistics
- **AdminEndpoints** - Admin operations
- **ChatbotEndpoints** - AI chatbot integration
- **ReportEndpoints** - Report generation
- **NotificationEndpoints** - Push notifications
- **FileEndpoints** - File upload/download

### Usage Examples

```javascript
import { AuthEndpoints, PatientEndpoints } from './services/apiConstants';

// Static endpoint
const response = await fetch(AuthEndpoints.login, {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// Dynamic endpoint with parameter
const patientId = '123';
const response = await fetch(PatientEndpoints.getById(patientId));
```

### Environment Configuration

Set the API base URL in your `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Or use the default (`http://localhost:5000/api`).

## 🎬 Splash Screen

**File**: `SplashScreen.jsx`

Initial loading screen that checks authentication status and routes users appropriately.

### Features

- ✅ Checks authentication on app startup
- ✅ Validates stored token
- ✅ Routes based on user role (Admin, Doctor, Pharmacist, Pathologist)
- ✅ Shows branded loading screen
- ✅ Minimum 2-second display for UX
- ✅ Handles errors gracefully

### Usage

```javascript
import { SplashScreen } from './services';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/doctor/*" element={<DoctorDashboard />} />
        {/* ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Navigation Flow

```
App Start
    ↓
SplashScreen (/)
    ↓
Check Token
    ↓
    ├─ Valid Token → Validate with backend
    │                      ↓
    │                  Parse user role
    │                      ↓
    │               ┌──────┴──────┐
    │               ↓             ↓
    │           Admin?        Doctor?
    │               ↓             ↓
    │         /admin        /doctor
    │               ↓             ↓
    │        Pharmacist?   Pathologist?
    │               ↓             ↓
    │        /pharmacist  /pathologist
    │
    └─ Invalid/No Token → /login
```

### Styling

The splash screen comes with multiple theme options:

```javascript
// Default gradient theme
<div className="splash-screen">

// Glassmorphism style
<div className="splash-screen glassmorphism">

// Minimalist style
<div className="splash-screen minimalist">

// Medical theme
<div className="splash-screen medical">

// Professional theme
<div className="splash-screen professional">
```

## 🔄 Flutter to React Mapping

| Flutter Service | React Equivalent |
|----------------|------------------|
| `AuthService.instance` | `authService` (singleton) |
| `AuthResult` class | `AuthResult` class |
| `ApiException` | `ApiException` class |
| `_getToken()` | `authService.getToken()` |
| `_saveToken()` | `authService.saveToken()` |
| `_clearToken()` | `authService.clearToken()` |
| `signIn()` | `authService.signIn()` |
| `getUserData()` | `authService.getUserData()` |
| `signOut()` | `authService.signOut()` |
| `ApiEndpoints` | `apiConstants` exports |
| `SplashPage` widget | `<SplashScreen />` component |

## 🛠️ Integration with Providers

The services are designed to work seamlessly with React Context providers:

```javascript
import { authService } from './services';
import { useApp, useNotification } from './provider';

function LoginPage() {
  const { setUser } = useApp();
  const { success, error } = useNotification();

  const handleLogin = async (email, password) => {
    try {
      const authResult = await authService.signIn(email, password);
      
      // Update context
      setUser(authResult.user, authResult.token);
      
      // Show notification
      success('Login successful!');
      
      // Navigate based on role
      if (authResult.user.role === 'doctor') {
        navigate('/doctor');
      }
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Login form */}
    </form>
  );
}
```

## 🔒 Security Best Practices

1. **Token Storage** - Tokens are stored in `localStorage` (XSS-protected)
2. **HTTPS Only** - Always use HTTPS in production
3. **Token Expiry** - Backend should implement token expiration
4. **Refresh Tokens** - Implement refresh token mechanism for long sessions
5. **CSRF Protection** - Use CSRF tokens for state-changing operations
6. **Input Validation** - Always validate and sanitize input data
7. **Error Messages** - Don't expose sensitive info in error messages

## 📝 Environment Variables

Create a `.env` file in the root of your React app:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Optional: Enable debug logging
REACT_APP_DEBUG=true

# Optional: API timeout
REACT_APP_API_TIMEOUT=30000
```

## 🧪 Testing

### Unit Tests Example

```javascript
import { authService, ApiException } from './services';

describe('AuthService', () => {
  it('should store token in localStorage', () => {
    const token = 'test-token-123';
    authService.saveToken(token);
    expect(authService.getToken()).toBe(token);
  });

  it('should clear token on logout', async () => {
    authService.saveToken('test-token');
    await authService.signOut();
    expect(authService.getToken()).toBeNull();
  });

  it('should throw ApiException on invalid login', async () => {
    await expect(
      authService.signIn('wrong@email.com', 'wrongpass')
    ).rejects.toThrow(ApiException);
  });
});
```

## 🐛 Common Issues & Solutions

### Issue: Token not persisting across page refresh
**Solution**: Make sure you're using `authService.saveToken()` after login.

### Issue: API calls return 401 Unauthorized
**Solution**: Check that token is valid and not expired. Call `authService.getUserData()` to validate.

### Issue: SplashScreen redirects to login immediately
**Solution**: Ensure backend `/auth/validate-token` endpoint is working correctly.

### Issue: Role-based navigation not working
**Solution**: Verify that user role is correctly set in the backend response.

## 📚 Additional Resources

- [React Router Documentation](https://reactrouter.com/)
- [JWT.io - JWT Debugger](https://jwt.io/)
- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [LocalStorage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

# React App Refresh Logic

## Overview
This document explains how the React HMS app handles page refresh/reload, maintaining user authentication state across browser refreshes. This implements the same logic as Flutter's authentication flow.

---

## 🔄 Refresh Flow (Step by Step)

### 1. **Initial Load / Page Refresh**
```
Browser Refresh → index.js → App.js → AppProviders → AppContext
```

When the page loads or refreshes:
- `index.js` renders `<App />`
- `App.js` wraps everything in `<AppProviders>`
- `AppContext` immediately loads authentication data from localStorage

### 2. **AppContext Initialization** (`AppContext.js`)
```javascript
useEffect(() => {
  const loadStoredAuth = () => {
    setIsCheckingAuth(true); // Signal that we're checking auth
    
    try {
      // Load token and user from localStorage
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      
      if (storedToken && storedUser) {
        // Reconstruct user object based on role
        const userData = JSON.parse(storedUser);
        setTokenState(storedToken);
        
        // Create proper class instance (Admin, Doctor, etc.)
        let reconstructedUser = parseUserByRole(userData);
        setUserState(reconstructedUser);
        
        console.log('✅ Restored user from localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading auth:', error);
      // Clear corrupted data
      localStorage.clear();
    } finally {
      setIsCheckingAuth(false); // Done checking
    }
  };
  
  loadStoredAuth();
}, []);
```

**Key Points:**
- `isCheckingAuth` flag prevents premature redirects
- User data is restored from localStorage first (fast)
- Token will be validated with backend on next step

---

### 3. **Route Rendering** (`AppRoutes.jsx`)

```
AppContext loads → Routes render → Check if auth required
```

**Public Routes** (no auth needed):
- `/login` - Login page
- `/forgot-password` - Password recovery
- `/reset-password/:token` - Password reset
- `/404`, `/unauthorized` - Error pages

**Protected Routes** (auth required):
All these routes use either `<ProtectedRoute>` or `<RoleBasedRoute>` wrapper:
- `/admin/*` - Admin dashboard (role: admin, superadmin)
- `/doctor/*` - Doctor dashboard (role: doctor)
- `/pharmacist/*` - Pharmacist dashboard (role: pharmacist)
- `/pathologist/*` - Pathologist dashboard (role: pathologist)
- `/profile`, `/settings` - Common pages (any authenticated user)

---

### 4. **Protected Route Guard** (`ProtectedRoute.jsx`)

```javascript
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isLoading, isCheckingAuth } = useApp();
  const location = useLocation();

  // WAIT while checking auth on mount (page refresh)
  if (isCheckingAuth || isLoading) {
    return <LoadingFallback message="Verifying authentication..." />;
  }

  // REDIRECT to login if not authenticated
  if (!isLoggedIn) {
    // Save current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ALLOW access - user is authenticated
  return children;
};
```

**Flow:**
1. **isCheckingAuth = true** → Show loading (localStorage is being read)
2. **isCheckingAuth = false && !isLoggedIn** → Redirect to `/login`
3. **isCheckingAuth = false && isLoggedIn** → Render protected content

---

### 5. **Role-Based Route Guard** (`RoleBasedRoute.jsx`)

Same as `ProtectedRoute` but also checks user role:

```javascript
const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { isLoggedIn, userRole, isCheckingAuth } = useApp();
  
  if (isCheckingAuth) {
    return <LoadingFallback />;
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};
```

**Example:**
```javascript
// Only admin and superadmin can access
<RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
  <AdminDashboard />
</RoleBasedRoute>
```

---

### 6. **Splash Screen (Optional)** (`SplashScreen.jsx`)

If user goes to root `/`, the splash screen:
1. Checks if token exists in localStorage
2. **Validates token with backend** via `/api/auth/validate-token`
3. Updates AppContext with validated user data
4. Redirects to appropriate dashboard based on role

```javascript
const checkAuthStatus = async () => {
  // Show splash for minimum 2 seconds
  const minSplashTime = new Promise(resolve => setTimeout(resolve, 2000));
  
  // Validate token with backend
  const authResult = await authService.getUserData();
  
  await minSplashTime;
  
  if (authResult) {
    // Token valid - update context and navigate
    setUser(authResult.user, authResult.token);
    
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'doctor') navigate('/doctor');
    // ... etc
  } else {
    // Token invalid or expired - go to login
    navigate('/login');
  }
};
```

**Why validate with backend?**
- localStorage can be manipulated by user
- Token might have expired
- Backend is the source of truth for authentication

---

## 🔐 Authentication Flow Comparison

### Flutter (Original)
```
App starts
  ↓
main.dart initializes SharedPreferences
  ↓
ConnectivityWrapper checks network
  ↓
SplashPage checks auth status
  ↓
AuthService.getUserData() validates token with backend
  ↓
If valid: Navigate to role dashboard
If invalid: Navigate to LoginPage
```

### React (New - EXACT SAME LOGIC)
```
App starts
  ↓
index.js renders App
  ↓
AppContext loads from localStorage (fast)
  ↓
Routes render with guards
  ↓
If protected route: Wait for isCheckingAuth
  ↓
If logged in: Render content
If not: Redirect to /login
  ↓
(Optional) SplashScreen validates token with backend
```

---

## 📦 Data Storage

### localStorage Keys
```javascript
'authToken'    - JWT token (string)
'authUser'     - User data (JSON string)
'remember_me'  - Remember Me checkbox (boolean)
'saved_email'  - Saved email for Remember Me (string)
```

### User Data Structure
```javascript
{
  id: '123',
  email: 'user@example.com',
  fullName: 'Dr. John Doe',
  role: 'doctor', // 'admin', 'doctor', 'pharmacist', 'pathologist'
  phone: '+91 1234567890',
  // ... other role-specific fields
}
```

---

## 🚀 Login Flow

### User clicks "Login" button:

1. **Validate form** (email, password, captcha)
2. **Call API** `POST /api/auth/login`
3. **Receive response:**
   ```json
   {
     "accessToken": "jwt_token_here",
     "refreshToken": "refresh_token_here",
     "user": { /* user object */ }
   }
   ```
4. **Save to localStorage:**
   ```javascript
   localStorage.setItem('authToken', accessToken);
   localStorage.setItem('authUser', JSON.stringify(user));
   ```
5. **Update AppContext:**
   ```javascript
   setUser(user, token);
   ```
6. **Navigate based on role:**
   - If user was trying to access protected route → Redirect back
   - Otherwise → Navigate to role dashboard

---

## 🔄 Logout Flow

### User clicks "Logout":

1. **Clear localStorage:**
   ```javascript
   localStorage.removeItem('authToken');
   localStorage.removeItem('authUser');
   ```
2. **Clear AppContext:**
   ```javascript
   signOut(); // Sets user and token to null
   ```
3. **Navigate to login:**
   ```javascript
   navigate('/login', { replace: true });
   ```

---

## 🛡️ Security Features

### 1. **Token Validation**
- Every app load validates token with backend
- Expired tokens are automatically cleared
- User is redirected to login if token invalid

### 2. **Protected Routes**
- All sensitive routes require authentication
- Role-based access control
- Prevents unauthorized access even if localStorage is manipulated

### 3. **Secure Storage**
- Tokens stored in localStorage (not sessionStorage)
- Data persists across browser sessions
- Automatically cleared on logout

### 4. **Network Detection**
- App detects online/offline status
- Shows network status banner when offline
- Refreshes connection on reconnect

---

## 🐛 Debugging Refresh Issues

### Check Browser Console

**On Page Refresh:**
```
🔍 [AppContext] Restored user from localStorage: Dr. John Doe
⏳ [ProtectedRoute] Checking authentication...
✅ [ProtectedRoute] Authenticated, rendering protected content
```

**If Not Logged In:**
```
⚠️ [AppContext] No stored authentication found
🚫 [ProtectedRoute] Not authenticated, redirecting to login
📍 [ProtectedRoute] Attempted path: /admin/dashboard
```

**On Login:**
```
✅ [Login] User authenticated: Dr. John Doe
👤 [Login] User role: doctor
➡️ [Login] Navigating to Doctor dashboard
```

### Common Issues

#### 1. **User redirected to login on every refresh**
**Cause:** localStorage not persisting
**Fix:** Check browser privacy settings, ensure localStorage is enabled

#### 2. **User stuck on loading screen**
**Cause:** `isCheckingAuth` never becomes false
**Fix:** Check AppContext useEffect is running

#### 3. **Wrong role dashboard**
**Cause:** User role not parsed correctly
**Fix:** Check user object structure in localStorage

#### 4. **Token expired but still showing dashboard**
**Cause:** Token not validated with backend
**Fix:** Ensure SplashScreen calls `getUserData()` API

---

## 📝 Best Practices

### ✅ DO:
- Always use `isCheckingAuth` flag before checking `isLoggedIn`
- Validate token with backend on app load
- Clear localStorage on logout
- Save attempted route for redirect after login
- Show loading state while checking auth

### ❌ DON'T:
- Don't trust localStorage alone for authentication
- Don't skip backend token validation
- Don't forget to handle token expiration
- Don't render protected content before auth check completes
- Don't store sensitive data in localStorage

---

## 🎯 Summary

**The React app handles refresh EXACTLY like Flutter:**

1. ✅ **Persists auth** using localStorage (like SharedPreferences)
2. ✅ **Validates token** with backend on app load
3. ✅ **Guards routes** using ProtectedRoute and RoleBasedRoute
4. ✅ **Redirects** based on authentication state
5. ✅ **Handles roles** correctly (admin, doctor, pharmacist, pathologist)
6. ✅ **Restores user** to previous location after login
7. ✅ **Shows loading** while checking authentication

**Key Difference:**
- Flutter: Single `SplashPage` checks auth before any navigation
- React: Guards check auth on EVERY route navigation (more secure!)

---

## 🔗 Related Files

**Core Authentication:**
- `src/provider/AppContext.js` - Global state management
- `src/services/authService.js` - API calls for authentication
- `src/routes/ProtectedRoute.jsx` - Auth guard for routes
- `src/routes/RoleBasedRoute.jsx` - Role-based auth guard
- `src/services/SplashScreen.jsx` - Initial auth check

**Login:**
- `src/pages/auth/LoginPageExact.jsx` - Login UI and logic

**Configuration:**
- `src/services/apiConstants.js` - API endpoints
- `src/services/apiClient.js` - HTTP client configuration

---

**Last Updated:** 2025-12-10
**Author:** HMS Development Team

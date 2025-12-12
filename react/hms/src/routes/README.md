# Professional Routing Structure

This document outlines the professional routing architecture for the Hospital Management System React application.

## 📁 Directory Structure

```
src/
├── routes/
│   ├── AppRoutes.jsx          # Main routing configuration
│   ├── ProtectedRoute.jsx     # Authentication guard
│   ├── RoleBasedRoute.jsx     # Role-based access control
│   ├── index.js                # Exports
│   └── README.md               # This file
├── App.js                      # Main app component
└── index.js                    # Entry point
```

## 🗺️ Route Structure

### Public Routes (No Authentication Required)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | SplashScreen | Initial loading, checks auth status |
| `/login` | LoginPage | User login |
| `/forgot-password` | ForgotPasswordPage | Password recovery |
| `/reset-password/:token` | ResetPasswordPage | Reset password with token |
| `/unauthorized` | UnauthorizedPage | Access denied page |
| `/404` | NotFoundPage | 404 error page |

### Protected Routes (Requires Authentication)

| Path | Component | Roles | Description |
|------|-----------|-------|-------------|
| `/profile` | ProfilePage | All | User profile |
| `/settings` | SettingsPage | All | User settings |

### Admin Routes (Role: admin, superadmin)

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | AdminDashboard | Admin dashboard (index) |
| `/admin/dashboard` | AdminDashboard | Admin dashboard |
| `/admin/users` | AdminUsers | User management |
| `/admin/settings` | AdminSettings | System settings |
| `/admin/reports` | AdminReports | System reports |

### Doctor Routes (Role: doctor)

| Path | Component | Description |
|------|-----------|-------------|
| `/doctor` | DoctorDashboard | Doctor dashboard (index) |
| `/doctor/dashboard` | DoctorDashboard | Doctor dashboard |
| `/doctor/patients` | DoctorPatients | Patient management |
| `/doctor/appointments` | DoctorAppointments | Appointments |
| `/doctor/prescriptions` | DoctorPrescriptions | Prescriptions |

### Pharmacist Routes (Role: pharmacist)

| Path | Component | Description |
|------|-----------|-------------|
| `/pharmacist` | PharmacistDashboard | Pharmacist dashboard (index) |
| `/pharmacist/dashboard` | PharmacistDashboard | Pharmacist dashboard |
| `/pharmacist/inventory` | PharmacyInventory | Medicine inventory |
| `/pharmacist/prescriptions` | PharmacyPrescriptions | Prescription management |

### Pathologist Routes (Role: pathologist)

| Path | Component | Description |
|------|-----------|-------------|
| `/pathologist` | PathologistDashboard | Pathologist dashboard (index) |
| `/pathologist/dashboard` | PathologistDashboard | Pathologist dashboard |
| `/pathologist/tests` | PathologyTests | Lab tests |
| `/pathologist/reports` | PathologyReports | Test reports |

## 🔒 Route Protection

### ProtectedRoute

Ensures user is authenticated. Redirects to login if not.

```javascript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

**Features:**
- Checks authentication status
- Shows loading state while verifying
- Redirects to `/login` if not authenticated
- Preserves attempted URL for post-login redirect

### RoleBasedRoute

Ensures user has required role(s). Redirects to unauthorized if not.

```javascript
<RoleBasedRoute allowedRoles={['admin', 'doctor']}>
  <YourComponent />
</RoleBasedRoute>
```

**Features:**
- Checks authentication first
- Validates user role against allowed roles
- Redirects to `/unauthorized` if role not allowed
- Shows loading state while verifying

## 🚀 Performance Optimizations

### Code Splitting (Lazy Loading)

All route components are lazy-loaded for optimal performance:

```javascript
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
```

**Benefits:**
- Faster initial page load
- Smaller bundle size
- Better performance on slow connections
- Only loads code when needed

### Suspense Boundaries

Loading fallback while lazy components load:

```javascript
<Suspense fallback={<LoadingFallback />}>
  <Routes>...</Routes>
</Suspense>
```

## 📋 Navigation Flow

### 1. Initial Load

```
User opens app (/)
    ↓
SplashScreen checks auth
    ↓
    ├─ Authenticated → Role-based redirect
    │   ├─ Admin → /admin
    │   ├─ Doctor → /doctor
    │   ├─ Pharmacist → /pharmacist
    │   └─ Pathologist → /pathologist
    │
    └─ Not authenticated → /login
```

### 2. Login Flow

```
User clicks Login (/login)
    ↓
LoginPage
    ↓
authService.signIn()
    ↓
Success → Update context
    ↓
Redirect based on role
    ↓
Load role-specific dashboard
```

### 3. Protected Route Access

```
User navigates to protected route
    ↓
ProtectedRoute checks auth
    ↓
    ├─ Authenticated → Render component
    └─ Not authenticated → Redirect to /login
                          (save attempted URL)
```

### 4. Role-Based Route Access

```
User navigates to role-specific route
    ↓
RoleBasedRoute checks auth
    ↓
Authenticated?
    ↓
    ├─ Yes → Check role
    │   ├─ Allowed → Render component
    │   └─ Not allowed → /unauthorized
    │
    └─ No → /login
```

## 🛠️ Adding New Routes

### 1. Create the Page Component

```javascript
// src/pages/admin/NewFeature.jsx
import React from 'react';

const NewFeature = () => {
  return (
    <div>
      <h1>New Feature</h1>
    </div>
  );
};

export default NewFeature;
```

### 2. Add Lazy Import

```javascript
// In AppRoutes.jsx
const NewFeature = lazy(() => import('../pages/admin/NewFeature'));
```

### 3. Add Route

```javascript
// In AppRoutes.jsx under Admin routes
<Route path="/admin/new-feature" element={<NewFeature />} />
```

### 4. Add Navigation Link

```javascript
// In your navigation component
<Link to="/admin/new-feature">New Feature</Link>
```

## 🎨 URL Parameters

### Route Parameters

```javascript
// Define route
<Route path="/patients/:id" element={<PatientDetail />} />

// Access in component
import { useParams } from 'react-router-dom';

const PatientDetail = () => {
  const { id } = useParams();
  // Use id...
};
```

### Query Parameters

```javascript
// Navigate with query params
navigate('/patients?search=john&status=active');

// Access in component
import { useSearchParams } from 'react-router-dom';

const PatientList = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search');
  const status = searchParams.get('status');
};
```

## 🔄 Programmatic Navigation

```javascript
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Simple navigation
    navigate('/admin/dashboard');

    // With state
    navigate('/patients/123', { state: { from: 'list' } });

    // Replace (no history entry)
    navigate('/login', { replace: true });

    // Go back
    navigate(-1);

    // Go forward
    navigate(1);
  };
};
```

## 🔗 Navigation Hooks

### useNavigate

```javascript
const navigate = useNavigate();
navigate('/path');
```

### useLocation

```javascript
const location = useLocation();
console.log(location.pathname); // "/admin/dashboard"
console.log(location.state); // Any passed state
```

### useParams

```javascript
const { id } = useParams(); // From /patients/:id
```

### useSearchParams

```javascript
const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page');
setSearchParams({ page: 2 });
```

## 🔐 Best Practices

1. **Always use lazy loading** for route components
2. **Use ProtectedRoute** for auth-required pages
3. **Use RoleBasedRoute** for role-specific pages
4. **Add Suspense boundaries** for loading states
5. **Use nested routes** for module organization
6. **Catch-all route** for 404 errors
7. **Preserve navigation state** for better UX
8. **Use semantic URLs** (RESTful)
9. **Handle navigation errors** gracefully
10. **Test all routes** including edge cases

## 🐛 Troubleshooting

### Route not found (404)
- Check route path spelling
- Ensure route is added to AppRoutes.jsx
- Check if nested routes need wildcard (*)

### Unauthorized access
- Verify user role in database
- Check allowedRoles array
- Ensure token is valid

### Infinite redirects
- Check if protected route redirects to protected route
- Verify SplashScreen logic
- Check role-based redirect logic

### Component not loading
- Check lazy import path
- Ensure component is exported correctly
- Check for JavaScript errors in component

## 📚 Additional Resources

- [React Router Documentation](https://reactrouter.com/)
- [Code Splitting](https://reactjs.org/docs/code-splitting.html)
- [React Suspense](https://reactjs.org/docs/react-api.html#reactsuspense)
- [Protected Routes Guide](https://reactrouter.com/docs/en/v6/examples/auth)

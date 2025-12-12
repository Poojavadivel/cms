# React Provider Documentation

This directory contains all the React Context providers for state management in the Hospital Management System. These are the React equivalent of Flutter's Provider/ChangeNotifier pattern.

## 📁 File Structure

```
provider/
├── AppContext.js           # Main authentication & user state
├── ThemeContext.js         # Theme & UI preferences
├── NotificationContext.js  # Toast notifications & alerts
├── LoadingContext.js       # Loading states management
├── NavigationContext.js    # Navigation & breadcrumbs
├── AppProviders.js         # Combined provider wrapper
├── hooks.js                # Custom reusable hooks
├── index.js                # Central exports
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Wrap your app with AppProviders

In your `index.js` or `App.js`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { AppProviders } from './provider';
import App from './App';

ReactDOM.render(
  <AppProviders>
    <App />
  </AppProviders>,
  document.getElementById('root')
);
```

### 2. Use hooks in components

```javascript
import { useApp, useNotification, useLoading } from './provider';

function MyComponent() {
  const { user, isLoggedIn, signOut } = useApp();
  const { success, error } = useNotification();
  const { isLoading, setLoading } = useLoading();

  // Your component logic
}
```

## 📚 Provider Details

### AppContext (Main Provider)

**Purpose**: Manages authentication state and user profile

**State**:
- `user` - Current user object (Admin, Doctor, Pharmacist, Pathologist)
- `token` - Authentication token
- `isLoading` - Global loading state

**Methods**:
- `setUser(user, token)` - Set logged-in user
- `signOut()` - Clear session and logout
- `updateUser(user)` - Update user data

**Computed Properties**:
- `isLoggedIn` - Boolean check if user is authenticated
- `isAdmin`, `isDoctor`, `isPharmacist`, `isPathologist` - Role checks
- `userRole` - Current user role string
- `userId` - Current user ID
- `userName` - Current user full name

**Usage Example**:

```javascript
import { useApp } from './provider';

function Dashboard() {
  const { user, isLoggedIn, isDoctor, signOut } = useApp();

  if (!isLoggedIn) {
    return <Redirect to="/login" />;
  }

  return (
    <div>
      <h1>Welcome, {user.fullName}</h1>
      {isDoctor && <DoctorDashboard />}
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### ThemeContext

**Purpose**: Manages theme preferences and UI state

**State**:
- `isDarkMode` - Dark mode toggle
- `primaryColor` - Primary theme color
- `sidebarCollapsed` - Sidebar state

**Methods**:
- `toggleTheme()` - Switch between light/dark
- `changePrimaryColor(color)` - Set primary color
- `toggleSidebar()` - Toggle sidebar
- `setSidebarCollapsed(bool)` - Set sidebar state

**Usage Example**:

```javascript
import { useTheme } from './provider';

function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {isDarkMode ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
```

### NotificationContext

**Purpose**: Display toast notifications and alerts

**State**:
- `notifications` - Array of active notifications

**Methods**:
- `addNotification(message, type, duration)` - Add notification
- `removeNotification(id)` - Remove specific notification
- `clearAllNotifications()` - Clear all
- `success(message)` - Show success notification
- `error(message)` - Show error notification
- `warning(message)` - Show warning notification
- `info(message)` - Show info notification

**Usage Example**:

```javascript
import { useNotification } from './provider';

function SaveButton() {
  const { success, error } = useNotification();

  const handleSave = async () => {
    try {
      await saveData();
      success('Data saved successfully!');
    } catch (err) {
      error('Failed to save data');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### LoadingContext

**Purpose**: Manage multiple loading states

**State**:
- `loadingStates` - Object of loading states by key
- `globalLoading` - Global loading flag

**Methods**:
- `setLoading(key, bool)` - Set loading for specific key
- `isLoading(key)` - Check if key is loading
- `isAnyLoading()` - Check if any operation is loading
- `executeWithLoading(key, asyncFn)` - Execute with auto loading state

**Usage Example**:

```javascript
import { useLoading } from './provider';

function DataTable() {
  const { isLoading, executeWithLoading } = useLoading();

  const loadData = async () => {
    const data = await executeWithLoading('tableData', async () => {
      return await fetchData();
    });
  };

  if (isLoading('tableData')) {
    return <Spinner />;
  }

  return <Table data={data} />;
}
```

### NavigationContext

**Purpose**: Manage navigation state and breadcrumbs

**State**:
- `breadcrumbs` - Breadcrumb navigation array
- `activeModule` - Current active module/section
- `navigationHistory` - Navigation history
- `currentPath` - Current route path

**Methods**:
- `navigateTo(path)` - Navigate to path
- `goBack()` - Go back in history
- `updateBreadcrumbs(crumbs)` - Set breadcrumbs
- `addBreadcrumb(crumb)` - Add breadcrumb
- `setActiveModule(module)` - Set active module

**Usage Example**:

```javascript
import { useNavigation } from './provider';

function Breadcrumbs() {
  const { breadcrumbs, navigateTo } = useNavigation();

  return (
    <nav>
      {breadcrumbs.map((crumb, i) => (
        <span key={i} onClick={() => navigateTo(crumb.path)}>
          {crumb.label}
        </span>
      ))}
    </nav>
  );
}
```

## 🎣 Custom Hooks

### useAppState()

Combined hook providing all context values:

```javascript
const { 
  user, 
  isLoggedIn, 
  success, 
  error, 
  isLoading, 
  navigateTo 
} = useAppState();
```

### useApiCall()

Hook for API calls with automatic loading and error handling:

```javascript
const { callApi } = useApiCall();

const fetchPatients = async () => {
  const result = await callApi(
    (token) => apiService.getPatients(token),
    {
      loadingKey: 'patients',
      successMessage: 'Patients loaded',
      showSuccessNotification: true
    }
  );
  
  if (result.success) {
    setPatients(result.data);
  }
};
```

### useFormSubmit()

Hook for form submissions:

```javascript
const { submitForm } = useFormSubmit();

const handleSubmit = async (formData) => {
  await submitForm(
    () => apiService.createPatient(formData),
    {
      successMessage: 'Patient created',
      onSuccess: (data) => navigate('/patients')
    }
  );
};
```

### usePagination()

Hook for pagination:

```javascript
const { 
  page, 
  pageSize, 
  total, 
  setTotal, 
  nextPage, 
  prevPage 
} = usePagination(1, 20);
```

### useSearch()

Hook for search and filters:

```javascript
const { 
  searchQuery, 
  setSearchQuery, 
  filters, 
  updateFilter, 
  clearFilters 
} = useSearch();
```

## 🔒 Protected Routes

### Using withAuth HOC:

```javascript
import { withAuth } from './provider';

const ProtectedComponent = () => {
  return <div>Protected Content</div>;
};

export default withAuth(ProtectedComponent);
```

### Using withRole HOC:

```javascript
import { withRole } from './provider';

const AdminOnlyComponent = () => {
  return <div>Admin Only Content</div>;
};

export default withRole(AdminOnlyComponent, ['admin', 'superadmin']);
```

## 🔄 Flutter to React Mapping

| Flutter | React Equivalent |
|---------|-----------------|
| `ChangeNotifier` | `Context + useState` |
| `notifyListeners()` | State setter functions |
| `Provider.of<T>(context)` | `useContext(Context)` |
| `Consumer<T>` | Custom hooks (useApp, etc.) |
| `ChangeNotifierProvider` | Context Provider |
| `MultiProvider` | Nested Providers / AppProviders |

## 💡 Best Practices

1. **Use custom hooks** instead of direct context access
2. **Combine contexts** using `useAppState()` when needed
3. **Keep context values minimal** - only store shared state
4. **Use loading keys** to track different operations
5. **Clear notifications** after navigation
6. **Persist important state** to localStorage
7. **Use HOCs** for route protection

## 🐛 Common Issues

### Issue: "useApp must be used within an AppProvider"
**Solution**: Make sure component is wrapped with `<AppProviders>`

### Issue: Infinite re-renders
**Solution**: Use `useCallback` and `useMemo` for derived values

### Issue: State not persisting on refresh
**Solution**: AppContext automatically persists to localStorage

## 📖 Additional Resources

- [React Context API](https://react.dev/reference/react/useContext)
- [Custom Hooks Guide](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Flutter Provider Package](https://pub.dev/packages/provider)

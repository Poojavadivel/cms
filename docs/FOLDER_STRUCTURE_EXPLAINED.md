# React HMS Folder Structure Explained

## 📁 Clear Separation of Concerns

### `src/pages/` - Root Layout Components ONLY
Contains the navigation shells with sidebars. These are NOT the actual pages.

```
pages/
├── admin/
│   ├── AdminRoot.jsx     ← Navigation container with sidebar
│   └── AdminRoot.css     ← Sidebar styles
├── doctor/
│   ├── DoctorRoot.jsx    ← Navigation container
│   └── DoctorRoot.css
├── pharmacist/
│   ├── PharmacistRoot.jsx
│   └── PharmacistRoot.css
├── pathologist/
│   ├── PathologistRoot.jsx
│   └── PathologistRoot.css
└── auth/
    └── Login.jsx
```

**Purpose:** These provide the navigation framework that wraps around actual page content.

---

### `src/modules/` - Actual Page Components
Contains the real page implementations with business logic, API calls, and UI.

```
modules/
└── admin/
    ├── dashboard/
    │   ├── Dashboard.jsx          ← The actual dashboard page
    │   ├── DashboardService.js    ← API calls for dashboard
    │   ├── Dashboard.css          ← Dashboard styles
    │   └── components/            ← Dashboard sub-components
    │       ├── StatsCard.jsx
    │       └── ChartWidget.jsx
    ├── users/
    │   ├── Users.jsx              ← The actual users page
    │   ├── UsersService.js        ← API calls for user management
    │   └── Users.css
    ├── reports/
    │   ├── Reports.jsx
    │   ├── ReportsService.js
    │   └── Reports.css
    └── settings/
        ├── Settings.jsx
        ├── SettingsService.js
        └── Settings.css
```

**Purpose:** These are the actual pages that users see and interact with.

---

## 🔄 How They Work Together

### Example: Admin Dashboard

```javascript
// 1. Route Configuration (App.js)
<Route path="/admin" element={<AdminRoot />}>           {/* Sidebar layout */}
  <Route path="dashboard" element={<AdminDashboard />} /> {/* Actual page */}
  <Route path="users" element={<AdminUsers />} />         {/* Actual page */}
</Route>

// 2. AdminRoot.jsx (Sidebar Container)
import { Outlet } from 'react-router-dom';

const AdminRoot = () => {
  return (
    <div className="admin-root">
      <Sidebar />           {/* Navigation sidebar */}
      <div className="main-content">
        <Outlet />          {/* Pages render here */}
      </div>
    </div>
  );
};

// 3. Dashboard.jsx (Actual Page - in modules/)
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    DashboardService.getStats().then(setStats);
  }, []);
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      {/* Actual dashboard content */}
    </div>
  );
};
```

---

## 📊 Visual Flow

```
URL: /admin/dashboard

1. Router matches route → Renders AdminRoot (sidebar)
                          ↓
2. AdminRoot shows sidebar + <Outlet />
                          ↓
3. <Outlet /> renders AdminDashboard (from modules/)
                          ↓
4. User sees: [Sidebar] [Dashboard Content]
```

---

## 🎯 Benefits of This Structure

### 1. **Reusability**
The same AdminRoot is used for ALL admin pages:
- /admin/dashboard → AdminRoot + Dashboard
- /admin/users → AdminRoot + Users
- /admin/settings → AdminRoot + Settings

### 2. **Maintainability**
Each feature is self-contained with:
- Component logic
- API service
- Styles
- Sub-components

### 3. **Scalability**
Easy to add new pages:
```
modules/admin/appointments/
├── Appointments.jsx
├── AppointmentsService.js
└── Appointments.css
```

### 4. **Team Collaboration**
Different developers can work on different modules without conflicts.

---

## 📝 File Naming Convention

### Root Layouts (pages/)
- **Naming:** `<Role>Root.jsx` (e.g., AdminRoot, DoctorRoot)
- **Purpose:** Navigation container with sidebar
- **Contains:** Sidebar, header, footer, navigation logic

### Page Components (modules/)
- **Naming:** `<Feature>.jsx` (e.g., Dashboard, Users, Reports)
- **Purpose:** Actual page content and business logic
- **Contains:** UI components, state management, API calls

### Services
- **Naming:** `<Feature>Service.js` (e.g., DashboardService, UsersService)
- **Purpose:** All API calls for that feature
- **Contains:** Functions that call backend APIs

### Styles
- **Naming:** `<Component>.css` (matches component name)
- **Purpose:** Component-specific styles
- **Contains:** CSS classes scoped to that component

---

## 🚀 Quick Start Guide

### Adding a New Admin Page

1. **Create module folder:**
```bash
mkdir -p src/modules/admin/appointments
```

2. **Create files:**
```
appointments/
├── Appointments.jsx       # Page component
├── AppointmentsService.js # API calls
└── Appointments.css       # Styles
```

3. **Implement component:**
```javascript
// Appointments.jsx
import React, { useState, useEffect } from 'react';
import AppointmentsService from './AppointmentsService';
import './Appointments.css';

const Appointments = () => {
  // Your implementation
  return <div>Appointments Page</div>;
};

export default Appointments;
```

4. **Create service:**
```javascript
// AppointmentsService.js
import { apiCall } from '../../../services/apiHelpers';

export const AppointmentsService = {
  getAll: async () => {
    return await apiCall('GET', '/api/appointments', null, {
      module: 'Appointments',
      action: 'Get All',
    });
  },
};

export default AppointmentsService;
```

5. **Add route:**
```javascript
// App.js
<Route path="/admin" element={<AdminRoot />}>
  <Route path="appointments" element={<Appointments />} />
</Route>
```

6. **Update sidebar navigation in AdminRoot.jsx:**
```javascript
const navItems = [
  // ... existing items
  { icon: <MdCalendar />, label: 'Appointments', path: '/admin/appointments' },
];
```

---

## 📂 Current Status

### ✅ Completed
- AdminRoot layout with sidebar
- DoctorRoot layout with sidebar
- PharmacistRoot layout with sidebar
- PathologistRoot layout with sidebar
- Admin Dashboard module (modules/admin/dashboard/)
- Admin Users module (modules/admin/users/)

### 🟡 In Progress
- Admin Reports module (folder exists, needs files)
- Admin Settings module (folder exists, needs files)

### ⏳ To Do
- Doctor module pages
- Pharmacist module pages
- Pathologist module pages
- Shared components

---

## 🔍 File Path Examples

```
✅ CORRECT:
- Layout: src/pages/admin/AdminRoot.jsx
- Page: src/modules/admin/dashboard/Dashboard.jsx
- Import: import AdminDashboard from '@/modules/admin/dashboard/Dashboard';

❌ WRONG:
- Page: src/pages/admin/Dashboard.jsx (No! This was deleted)
- Mixing: Having both pages/admin/Dashboard.jsx AND modules/admin/dashboard/Dashboard.jsx
```

---

## 💡 Remember

- **pages/** = Navigation shells (Root layouts)
- **modules/** = Actual page content
- **One feature = One sub-module** (component + service + css)
- **Each sub-module is self-contained**

---

**Last Updated:** 2025-12-10  
**Clean Structure:** ✅ No duplicates, clear separation of concerns

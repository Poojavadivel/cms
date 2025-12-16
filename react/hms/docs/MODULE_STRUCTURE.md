# Admin Module Structure

## Overview
The admin module follows a sub-module pattern where each feature has its own dedicated folder with components, services, and styles.

## Root Navigation Structure
All modules (Admin, Doctor, Pharmacist, Pathologist) now have dedicated Root pages with:
- ✅ **Collapsible Sidebar** - Smooth animation between expanded (280px) and collapsed (72px) states
- ✅ **Glassmorphism Design** - Matching Flutter implementation
- ✅ **Role-Based Navigation** - Different menu items per role
- ✅ **User Profile Section** - Shows user info with logout functionality
- ✅ **Chatbot Integration** - "Ask Movi" launcher (Admin & Doctor only)
- ✅ **Responsive Icons** - React Icons library matching Flutter's Iconsax

## Module Structure

```
src/
├── pages/
│   ├── admin/
│   │   ├── AdminRoot.jsx          # Main layout with sidebar
│   │   ├── AdminRoot.css          # Styles matching Flutter
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Reports.jsx
│   │   └── Settings.jsx
│   ├── doctor/
│   │   ├── DoctorRoot.jsx         # Doctor layout with sidebar
│   │   ├── DoctorRoot.css
│   │   └── [pages...]
│   ├── pharmacist/
│   │   ├── PharmacistRoot.jsx     # Pharmacist layout
│   │   ├── PharmacistRoot.css
│   │   └── [pages...]
│   └── pathologist/
│       ├── PathologistRoot.jsx    # Pathologist layout
│       ├── PathologistRoot.css
│       └── [pages...]
│
├── modules/
│   └── admin/
│       ├── dashboard/
│       │   ├── Dashboard.jsx      # Feature component
│       │   ├── DashboardService.js # API calls
│       │   └── Dashboard.css      # Feature styles
│       ├── users/
│       │   ├── Users.jsx
│       │   ├── UsersService.js
│       │   └── Users.css
│       ├── reports/
│       └── settings/
```

## Sub-Module Pattern

Each feature follows this structure:
```
feature_name/
├── FeatureName.jsx        # Main component
├── FeatureNameService.js  # All API calls for this feature
├── FeatureName.css        # Feature-specific styles
└── components/            # Optional sub-components
    ├── SubComponent.jsx
    └── SubComponent.css
```

## Benefits

1. **Maintainability** - Each feature is self-contained
2. **Scalability** - Easy to add new features
3. **Code Organization** - Clear separation of concerns
4. **Team Collaboration** - Multiple developers can work on different modules
5. **Testing** - Isolated features are easier to test
6. **API Management** - All API calls in one service file per feature

## All API calls are logged automatically via loggerService.js

Access logs in browser console:
```javascript
// View all logs
window.appLogger.printLogs();

// View only API logs  
window.appLogger.printLogs('API');

// Export logs
window.appLogger.exportLogsJSON();
window.appLogger.exportLogsCSV();

// View statistics
window.appLogger.printStats();
```

## Professional Routing
- Nested Routes: /admin/doctors, /admin/doctors/create
- Role-Based Access with Protected Routes
- Redirect to intended destination after login
- Page refresh handling via token validation

## Color Themes Per Role

- **Admin**: Blue (#3b82f6)
- **Doctor**: Green (#10b981)
- **Pharmacist**: Purple (#8b5cf6)
- **Pathologist**: Orange (#f59e0b)

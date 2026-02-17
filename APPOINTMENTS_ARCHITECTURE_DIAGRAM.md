# Appointments Module - Architecture Diagram

**React Implementation with Real API Integration**

---

## 🏗️ COMPLETE ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AppointmentsReal.jsx (Main Component)                      │   │
│  │  - Search & Filter UI                                        │   │
│  │  - Data Table                                                │   │
│  │  - Pagination Controls                                       │   │
│  │  - Action Menus                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│            ↓                ↓                ↓                       │
│  ┌────────────────┐  ┌────────────┐  ┌──────────────────────┐     │
│  │  StatusChip.jsx│  │ Avatars    │  │ Loading/Empty States │     │
│  │  (Component)   │  │ (Helper)   │  │ (UI States)          │     │
│  └────────────────┘  └────────────┘  └──────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT LAYER                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React Hooks (useState, useEffect, useCallback)             │   │
│  │                                                               │   │
│  │  State:                                                       │   │
│  │  - appointments          (full list from API)                │   │
│  │  - filteredAppointments  (after search/filter)               │   │
│  │  - isLoading            (loading state)                      │   │
│  │  - searchQuery          (search input)                       │   │
│  │  - currentPage          (pagination)                         │   │
│  │  - doctorFilter         (selected doctor)                    │   │
│  │                                                               │   │
│  │  Effects:                                                     │   │
│  │  - useEffect(() => fetchAppointments(), [])  // on mount     │   │
│  │  - useEffect(() => filterData(), [search])   // on search    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                           SERVICES LAYER                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  appointmentsService.js                                      │   │
│  │                                                               │   │
│  │  Methods:                                                     │   │
│  │  ✅ fetchAppointments()        → GET /api/appointments       │   │
│  │  ✅ fetchAppointmentById(id)   → GET /api/appointments/:id   │   │
│  │  ✅ createAppointment(data)    → POST /api/appointments      │   │
│  │  ✅ updateAppointment(id, data)→ PUT /api/appointments/:id   │   │
│  │  ✅ deleteAppointment(id)      → DELETE /api/appointments/:id│   │
│  │  ✅ fetchPatients()            → GET /api/patients           │   │
│  │                                                               │   │
│  │  Features:                                                    │   │
│  │  - Auth token injection                                       │   │
│  │  - Error handling                                             │   │
│  │  - Response normalization                                     │   │
│  │  - Logger integration                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                          UTILITIES LAYER                             │
│  ┌───────────────────────┐  ┌──────────────────────────────────┐   │
│  │  dateHelpers.js       │  │  avatarHelpers.js                │   │
│  │                       │  │                                   │   │
│  │  - formatDateShort()  │  │  - getGenderAvatar()             │   │
│  │  - formatDateLong()   │  │  - getGenderColor()              │   │
│  │  - formatTimeShort()  │  │  - getInitials()                 │   │
│  │  - formatTime12Hour() │  │  - getAvatarColorFromName()      │   │
│  │  - getCurrentDate()   │  │  - isValidAvatarUrl()            │   │
│  │  - getCurrentTime()   │  │  - getAvatarConfig()             │   │
│  │  - isToday()          │  │                                   │   │
│  │  - isPast()           │  │                                   │   │
│  │  - isFuture()         │  │                                   │   │
│  │  - parseDate()        │  │                                   │   │
│  └───────────────────────┘  └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                        HTTP CLIENT LAYER                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Axios Instance                                              │   │
│  │                                                               │   │
│  │  Configuration:                                               │   │
│  │  - Base URL: process.env.REACT_APP_API_URL                   │   │
│  │  - Headers:                                                   │   │
│  │    * Content-Type: application/json                          │   │
│  │    * Authorization: Bearer {token}                           │   │
│  │  - Timeout: 30000ms                                           │   │
│  │                                                               │   │
│  │  Interceptors:                                                │   │
│  │  - Request: Add auth token from localStorage                 │   │
│  │  - Response: Log API calls via loggerService                 │   │
│  │  - Error: Normalize error messages                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                         BACKEND API LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  https://hms-dev.onrender.com/api                           │   │
│  │                                                               │   │
│  │  Endpoints:                                                   │   │
│  │  GET    /appointments          → List all                    │   │
│  │  GET    /appointments/:id      → Get one                     │   │
│  │  POST   /appointments          → Create new                  │   │
│  │  PUT    /appointments/:id      → Update existing             │   │
│  │  DELETE /appointments/:id      → Delete                      │   │
│  │  GET    /appointments/today    → Today's list                │   │
│  │  GET    /appointments/upcoming → Upcoming list               │   │
│  │  PATCH  /appointments/:id/status → Update status             │   │
│  │  GET    /patients              → List patients               │   │
│  │                                                               │   │
│  │  Authentication:                                              │   │
│  │  - Requires: Authorization: Bearer {token}                   │   │
│  │  - Returns: 401 if unauthorized                              │   │
│  │  - Returns: 200 with data if success                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  MongoDB (Backend Database)                                  │   │
│  │                                                               │   │
│  │  Collections:                                                 │   │
│  │  - appointments                                               │   │
│  │  - patients                                                   │   │
│  │  - doctors                                                    │   │
│  │  - users                                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW EXAMPLE: Fetch Appointments

```
┌─────────┐
│  USER   │ → Loads page
└────┬────┘
     ↓
┌─────────────────┐
│ AppointmentsReal│ → useEffect(() => fetchAppointments(), [])
└────┬────────────┘
     ↓
┌──────────────────────┐
│ appointmentsService  │ → fetchAppointments()
└────┬─────────────────┘
     ↓
┌─────────────┐
│ Axios GET   │ → axios.get('/api/appointments', { headers: { Authorization: 'Bearer {token}' } })
└────┬────────┘
     ↓
┌────────────────┐
│ Backend API    │ → Validates token, queries MongoDB
└────┬───────────┘
     ↓
┌─────────────┐
│ Response    │ → { data: [...appointments] }
└────┬────────┘
     ↓
┌──────────────────────┐
│ appointmentsService  │ → Normalizes response, returns data
└────┬─────────────────┘
     ↓
┌─────────────────┐
│ AppointmentsReal│ → setAppointments(data), setFilteredAppointments(data)
└────┬────────────┘
     ↓
┌─────────┐
│   UI    │ → Table renders with data
└─────────┘
```

---

## 🗑️ DATA FLOW EXAMPLE: Delete Appointment

```
┌─────────┐
│  USER   │ → Clicks delete (⋮ menu)
└────┬────┘
     ↓
┌─────────────────┐
│ AppointmentsReal│ → handleDelete(appointment)
└────┬────────────┘
     ↓
┌─────────────┐
│ Confirm?    │ → window.confirm("Delete appointment?")
└────┬────────┘
     │ YES ↓
┌──────────────────────┐
│ appointmentsService  │ → deleteAppointment(id)
└────┬─────────────────┘
     ↓
┌─────────────────┐
│ Axios DELETE    │ → axios.delete('/api/appointments/:id', { headers: {...} })
└────┬────────────┘
     ↓
┌────────────────┐
│ Backend API    │ → Validates token, deletes from MongoDB
└────┬───────────┘
     ↓
┌─────────────┐
│ Response    │ → { success: true }
└────┬────────┘
     ↓
┌──────────────────────┐
│ appointmentsService  │ → Returns true
└────┬─────────────────┘
     ↓
┌─────────────────┐
│ AppointmentsReal│ → fetchAppointments() (refresh list)
└────┬────────────┘
     ↓
┌─────────┐
│   UI    │ → Table updates, shows success message
└─────────┘
```

---

## 🔍 DATA FLOW EXAMPLE: Search & Filter

```
┌─────────┐
│  USER   │ → Types in search box: "John"
└────┬────┘
     ↓
┌─────────────────┐
│ AppointmentsReal│ → setSearchQuery("John")
└────┬────────────┘
     ↓
┌─────────────────┐
│ useEffect       │ → Triggered by searchQuery change
└────┬────────────┘
     ↓
┌─────────────────────────────────────────┐
│ Filter Logic (Client-Side)              │
│ - Loop through appointments              │
│ - Check if patientName includes "john"  │
│ - Check if doctor includes "john"       │
│ - Check if patientId includes "john"    │
│ - Return matching results                │
└────┬────────────────────────────────────┘
     ↓
┌─────────────────┐
│ AppointmentsReal│ → setFilteredAppointments(results)
└────┬────────────┘
     ↓
┌─────────┐
│   UI    │ → Table re-renders with filtered data
└─────────┘
```

---

## 📦 FILE DEPENDENCY TREE

```
src/
│
├── services/
│   ├── appointmentsService.js ─┐
│   │   ├── uses: axios          │
│   │   ├── uses: apiConstants   │
│   │   └── uses: loggerService  │
│   │                             │
│   ├── apiConstants.js          │
│   │   └── exports: endpoints   │
│   │                             │
│   └── loggerService.js         │
│       └── exports: logger       │
│                                 │
├── utils/                        │
│   ├── dateHelpers.js            │
│   │   └── exports: 16 functions │
│   │                             │
│   └── avatarHelpers.js          │
│       └── exports: 6 functions  │
│                                 │
└── modules/admin/appointments/   │
    │                             │
    ├── AppointmentsReal.jsx ◄───┼───── Main Entry Point
    │   ├── imports: appointmentsService
    │   ├── imports: dateHelpers
    │   ├── imports: avatarHelpers
    │   └── imports: StatusChip
    │
    ├── AppointmentsReal.css
    │
    └── components/
        ├── StatusChip.jsx
        └── StatusChip.css
```

---

## 🎯 COMPONENT INTERACTION DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    AppointmentsReal                         │
│                                                              │
│  Props: none                                                 │
│  State: appointments, filteredAppointments, isLoading, etc. │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Header                                             │    │
│  │  - Title                                            │    │
│  │  - [+ New] Button ─── onClick ──→ handleAdd()      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Toolbar                                            │    │
│  │  - [🔍 Search] ──── onChange ──→ setSearchQuery()   │    │
│  │  - [Filter ▼] ───── onClick ──→ setDoctorFilter()  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Table                                              │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Row 1                                        │  │    │
│  │  │  - Avatar (avatarHelpers.getGenderAvatar)    │  │    │
│  │  │  - Patient Name                              │  │    │
│  │  │  - Doctor                                    │  │    │
│  │  │  - Date (dateHelpers.formatDateLong)        │  │    │
│  │  │  - Time (dateHelpers.formatTime12Hour)      │  │    │
│  │  │  - Reason                                    │  │    │
│  │  │  - <StatusChip status={apt.status} /> ──┐   │  │    │
│  │  │  - [⋮] Action Menu                        │   │  │    │
│  │  │     ├── View ─── onClick ──→ handleView() │   │  │    │
│  │  │     ├── Edit ─── onClick ──→ handleEdit() │   │  │    │
│  │  │     └── Delete ─ onClick ──→ handleDelete()│   │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ... (more rows)                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Pagination                                         │    │
│  │  - [◀ Previous] ─── onClick ──→ handlePreviousPage()│    │
│  │  - Page X of Y                                      │    │
│  │  - [Next ▶] ──────── onClick ──→ handleNextPage()   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ uses
                           ↓
           ┌───────────────────────────────┐
           │       StatusChip              │
           │                               │
           │  Props: status                │
           │  - Maps to color              │
           │  - Renders badge              │
           └───────────────────────────────┘
```

---

## 🔒 SECURITY FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
└──────────────────────────────────────────────────────────────┘

1. User logs in via LoginPage
   ↓
2. Backend returns authToken
   ↓
3. Token stored in localStorage.setItem('authToken', token)
   ↓
4. User navigates to Appointments page
   ↓
5. AppointmentsReal component mounts
   ↓
6. fetchAppointments() called
   ↓
7. appointmentsService reads token:
   const token = localStorage.getItem('authToken');
   ↓
8. Axios request includes header:
   Authorization: Bearer {token}
   ↓
9. Backend validates token:
   - If valid → Return appointments
   - If invalid/expired → Return 401
   ↓
10. On 401 error:
    - Service throws error
    - Component catches error
    - Shows "Unauthorized" message
    - User redirected to login

┌──────────────────────────────────────────────────────────────┐
│                    Authorization Flow                        │
└──────────────────────────────────────────────────────────────┘

Every API call:
1. Check if token exists in localStorage
2. If no token → Show error "Please login"
3. If token exists:
   - Add to request headers
   - Send to backend
   - Backend checks token validity
   - Backend checks user role (Admin/Doctor/etc.)
   - Backend checks permissions
   - If authorized → Process request
   - If unauthorized → Return 403
4. Handle response in frontend
```

---

## 📊 ERROR HANDLING FLOW

```
┌────────────────────────────────────────────────────────────┐
│                     Error Handling                         │
└────────────────────────────────────────────────────────────┘

Try:
  API Request (e.g., fetchAppointments)
  ↓
Catch Error:
  ├─ Network Error (no internet)
  │  └─→ Message: "Network error. Check connection."
  │
  ├─ 401 Unauthorized (token invalid/expired)
  │  └─→ Message: "Session expired. Please login."
  │
  ├─ 403 Forbidden (no permission)
  │  └─→ Message: "Access denied."
  │
  ├─ 404 Not Found (resource doesn't exist)
  │  └─→ Message: "Appointment not found."
  │
  ├─ 500 Server Error (backend issue)
  │  └─→ Message: "Server error. Try again later."
  │
  └─ Other Errors
     └─→ Message: error.response?.data?.message || "Unknown error"

Finally:
  ├─ setIsLoading(false)
  ├─ Log error to console
  └─ Show user-friendly message (alert/toast)
```

---

## 🎨 STYLING ARCHITECTURE

```
┌────────────────────────────────────────────────────────────┐
│                      Styling Layers                        │
└────────────────────────────────────────────────────────────┘

Layer 1: Global Styles (index.css)
  ├─ CSS Reset
  ├─ Font imports (Inter)
  └─ Global variables

Layer 2: Component Styles (AppointmentsReal.css)
  ├─ Layout (flexbox, grid)
  ├─ Spacing (padding, margin)
  ├─ Colors (background, text, borders)
  ├─ Typography (font-size, font-weight)
  ├─ Transitions (hover effects)
  └─ Responsive breakpoints (@media)

Layer 3: Sub-component Styles (StatusChip.css)
  ├─ Component-specific styles
  ├─ Inline styles for dynamic colors
  └─ Hover/active states

Layer 4: Inline Styles (JSX)
  ├─ Dynamic colors (based on status)
  ├─ Conditional rendering
  └─ Runtime calculations
```

---

**Document Version:** 1.0  
**Date:** December 11, 2025  
**Purpose:** Architecture Reference  
**Status:** ✅ Complete

# MIT Connect

MIT Connect is a multi-role college portal UI built with React, Vite, CSS, and React Router.

The project represents a campus management system for Movi Institute of Technology, with a branded split-screen login page and role-based dashboards for students, admin, faculty, and finance teams.

## Features

- Multi-role login interface for `Student`, `Admin`, `Faculty`, and `Finance`
- Split-screen login page with MIT Connect branding
- Role-based dashboard content after login
- Role-specific sidebar menus
- Blue and cyan themed UI across login and dashboard screens
- Responsive layout for desktop and mobile screens
- React component-based architecture
- Route-based navigation using React Router
- Demo authentication using front-end state and `localStorage`

## Roles Included

- Student
- Admin
- Faculty
- Finance

Each role has:

- Separate login credentials
- Different dashboard heading and quick stats
- Different tasks and alerts
- Different sidebar items based on permissions

## Demo Login Credentials

Use the following demo credentials on the login page:

| Role | User ID | Password |
|------|---------|----------|
| Student | `STU-2024-1547` | `student123` |
| Admin | `ADM-0001` | `admin123` |
| Faculty | `FAC-204` | `faculty123` |
| Finance | `FIN-880` | `finance123` |

## Project Structure

```text
cms/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── .venv/                          # Python virtual environment
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── components/                 # React components
│   │   ├── Layout.jsx
│   │   ├── TopBar.jsx
│   │   ├── AcademicSidebar.jsx
│   │   ├── NotificationCenter.jsx
│   │   ├── NotificationSenderModal.jsx
│   │   └── ...
│   ├── pages/                      # Page components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── StudentsPage.jsx
│   │   ├── NotificationPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useRealtimeNotifications.js
│   │   └── ...
│   ├── api/
│   │   ├── notificationsApi.js
│   │   ├── studentsApi.js
│   │   └── ...
│   ├── auth/
│   │   └── sessionController.js
│   ├── data/
│   │   ├── roleConfig.js
│   │   └── settingsConfig.js
│   └── context/
│       └── SettingsContext.jsx
│
├── backend/
│   ├── main.py                     # FastAPI app entry point
│   ├── db.py                       # MongoDB connection
│   ├── requirements.txt            # Python dependencies
│   ├── routes/
│   │   ├── notifications_enhanced.py   # Real-time notifications
│   │   ├── academics/
│   │   │   ├── exams.py            # Exam management with notify
│   │   │   ├── timetable.py
│   │   │   └── ...
│   │   └── finance/
│   │       └── fees.py             # Fee management with auto-triggers
│   ├── schemas/
│   │   ├── notifications.py        # Notification Pydantic models
│   │   └── academics.py
│   └── utils/
│       ├── websocket_manager.py    # WebSocket connection manager
│       ├── notification_scheduler.py  # Background tasks
│       └── mongo.py                # MongoDB helpers
```

## Pages

### `src/pages/LoginPage.jsx`

- Split layout inspired by a modern ERP login screen
- Left panel shows MIT Connect branding and platform highlights
- Right panel contains role switcher and login form
- Stores role and user ID in `localStorage`
- Redirects authenticated users to `/dashboard`

### `src/pages/DashboardPage.jsx`

- Displays role-specific dashboard content
- Reads current role from query string or `localStorage`
- Builds sidebar items dynamically based on selected role
- Shows overview cards, access sections, tasks, and alerts

### `src/styles.css`

- Contains all shared styling for login and dashboard pages
- Includes responsive layout behavior
- Defines MIT Connect brand colors and gradients

### `src/data/roleConfig.js`

- Stores demo users and role-specific dashboard data
- Stores role-wise sidebar menu configuration
- Centralizes role validation logic

## Sidebar Access By Role

### Student

- Overview: Dashboard, My Courses, Department
- Academics: Exams, Timetable, Attendance, Placement, Facility
- Administration: Fees, Invoices
- Intelligence: Notifications, Settings

### Admin

- Overview: Dashboard, Students, Faculty, Department
- Administration: Admission, Fees, Payroll, Invoices
- Intelligence: Analytics, Notifications, Settings
- Academics: Exams, Timetable, Attendance, Placement, Facility

### Faculty

- Overview: Dashboard, Students, Department
- Academics: Exams, Timetable, Attendance, Placement
- Intelligence: Analytics, Notifications, Settings

### Finance

- Overview: Dashboard, Department
- Administration: Fees, Payroll, Invoices
- Intelligence: Analytics, Notifications, Settings

## How To Run

### Prerequisites

- **Node.js** 16+ (for frontend)
- **Python** 3.9+ (for backend)
- **MongoDB** (optional - fallback data available if not running)

### Quick Start (Both Frontend & Backend)

**Option 1: Two Terminal Windows (Recommended)**

**Terminal 1 — Backend (FastAPI on port 5000):**
```bash
cd g:\n drive\INTERN\new\cms
.venv\Scripts\Activate.ps1         # Activate Python virtual environment
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 5000
```

**Terminal 2 — Frontend (Vite on port 5173):**
```bash
cd g:\n drive\INTERN\new\cms
npm install                        # Install dependencies (first time only)
npm run dev
```

Then open: **http://localhost:5173**

---

**Option 2: Using npm scripts (single terminal)**

```bash
npm install
npm run dev:full    # Runs both backend and frontend (if configured)
```

---

### Running Frontend Only

If you only want to run the frontend (useful for UI development):

```bash
npm install
npm run dev
```

Open: **http://localhost:5173**

---

### Running Backend Only

If you only want to run the backend API server:

```bash
.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 5000
```

API available at: **http://127.0.0.1:5000**

---

### Build for Production

**Frontend:**
```bash
npm run build
npm run preview    # Preview production build locally
```

**Backend:** For production, use a production ASGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
```

---

## Backend Features

### Real-Time Notifications (WebSocket)

Notifications are delivered in real-time via WebSocket connections:
- **Endpoint**: `ws://127.0.0.1:5000/api/notifications/ws/{userId}`
- **Auto-triggers**: Exam scheduled, Fee deadlines (7 days before), Attendance warnings
- **Manual notifications**: Admin, Faculty, Finance can broadcast to roles
- **Student-only**: Students can receive, read, delete — cannot send

### API Endpoints

**Notifications:**
- `GET /api/notifications/{role}` — List notifications for a role
- `POST /api/notifications/send` — Send broadcast notification (admin/faculty/finance)
- `PUT /api/notifications/{id}/read` — Mark as read
- `DELETE /api/notifications/{id}` — Delete notification
- `GET /api/notifications/preferences/{userId}` — Get notification preferences
- `PUT /api/notifications/preferences/{userId}` — Update preferences

**Exams:**
- `GET /api/exams` — List all exams
- `POST /api/exams` — Create exam (with optional `notify` to send notifications)
- `PUT /api/exams/{id}` — Update exam
- `DELETE /api/exams/{id}` — Delete exam

**Fees:**
- `GET /api/fees` — List all fees
- `POST /api/fees` — Create fee (with optional `notify`)
- `PUT /api/fees/{id}` — Update fee
- `DELETE /api/fees/{id}` — Delete fee
- `POST /api/fees/{id}/send-reminder` — Manually trigger fee reminder

**Students:**
- `GET /api/students` — List all students
- `POST /api/students` — Create student
- `GET /api/students/{id}` — Get student details

---

## Technologies Used

**Frontend:**
- React 18
- Vite
- React Router v6
- Tailwind CSS v4 (CDN)
- JavaScript (ES Modules)
- Google Fonts (`Inter`)

**Backend:**
- FastAPI (Python)
- Motor (async MongoDB driver)
- Pydantic (data validation)
- WebSocket (real-time notifications)
- Uvicorn (ASGI server)

---

## Notes

- **Authentication**: Front-end only for demo purposes
- **Database**: MongoDB optional — fallback in-memory data if not running
- **Real-time**: WebSocket connection required for live notifications
- **Cross-origin**: CORS enabled for localhost development
- Each role has specific permissions (students receive-only for notifications)

## Future Improvements

- MongoDB Atlas cloud database integration
- Email notifications via SendGrid/AWS SES
- Push notifications (browser + mobile)
- Unsubscribe/notification preferences UI
- Batch notifications with CSV upload
- Notification templates
- Attendance auto-triggers
- Read receipts
- Two-factor authentication
- Role-based API access control

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
└── README.md
	src/
	├── App.jsx
	├── main.jsx
	├── styles.css
	├── data/
	│   └── roleConfig.js
	└── pages/
		├── DashboardPage.jsx
		└── LoginPage.jsx
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

This is a Vite React project.

1. Open the project folder in VS Code.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the local Vite URL shown in the terminal.
5. Choose a role and sign in with one of the demo credentials.

To create a production build:

```bash
npm run build
```

## Technologies Used

- React
- Vite
- React Router
- CSS3
- JavaScript (ES Modules)
- Google Fonts (`Inter`)

## Notes

- Authentication is front-end only for demo purposes.
- There is no database or backend in this project.
- Role access is simulated in the UI.

## Future Improvements

- Connect login to a real backend authentication system
- Add persistent user profiles and data storage
- Create separate pages for each sidebar module
- Add charts and detailed analytics widgets
- Replace demo data with API-driven content

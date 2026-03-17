import { Navigate, Route, Routes } from 'react-router-dom';
import { getUserSession } from './auth/sessionController';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import TimetablePage from './pages/TimetablePage';
import AttendancePage from './pages/AttendancePage';
import ExamsPage from './pages/ExamsPage';
import PlacementPage from './pages/PlacementPage';
import FacilityPage from './pages/FacilityPage';
import SettingsPage from './pages/SettingsPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationPage from './pages/NotificationPage';
import ModulePlaceholderPage from './pages/ModulePlaceholderPage';
import StudentSettings from './pages/student/StudentSettings';
import AdminSettings from './pages/admin/AdminSettings';


export default function App() {
  const session = getUserSession();

  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? <Navigate to={`/dashboard?role=${encodeURIComponent(session.role)}`} replace /> : <LoginPage />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/timetable" element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
      <Route path="/placement" element={<ProtectedRoute><PlacementPage /></ProtectedRoute>} />
      <Route path="/facility" element={<ProtectedRoute><FacilityPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      <Route
        path="/courses"
        element={<ProtectedRoute><ModulePlaceholderPage title="My Courses" description="Course overview and registrations will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/department"
        element={<ProtectedRoute><ModulePlaceholderPage title="Department" description="Department announcements, structure, and members will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/faculty"
        element={<ProtectedRoute><ModulePlaceholderPage title="Faculty" description="Faculty listing and management dashboard will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/fees"
        element={<ProtectedRoute><ModulePlaceholderPage title="Fees" description="Fee summaries, due dates, and payment actions will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/invoices"
        element={<ProtectedRoute><ModulePlaceholderPage title="Invoices" description="Invoice generation and history will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/admission"
        element={<ProtectedRoute><ModulePlaceholderPage title="Admission" description="Admission workflows and approvals will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/payroll"
        element={<ProtectedRoute><ModulePlaceholderPage title="Payroll" description="Payroll processing and records will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/student/settings" element={<ProtectedRoute><StudentSettings /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

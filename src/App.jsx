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
      <Route path="/timetable" element={<ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}><TimetablePage /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}><AttendancePage /></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}><ExamsPage /></ProtectedRoute>} />
      <Route path="/placement" element={<ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}><PlacementPage /></ProtectedRoute>} />
      <Route path="/facility" element={<ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}><FacilityPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      <Route
        path="/courses"
        element={<ProtectedRoute allowedRoles={['student']}><ModulePlaceholderPage title="My Courses" description="Course overview and registrations will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/department"
        element={<ProtectedRoute><ModulePlaceholderPage title="Department" description="Department announcements, structure, and members will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/faculty"
        element={<ProtectedRoute allowedRoles={['admin']}><ModulePlaceholderPage title="Faculty" description="Faculty listing and management dashboard will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/fees"
        element={<ProtectedRoute allowedRoles={['student', 'admin', 'finance']}><ModulePlaceholderPage title="Fees" description="Fee summaries, due dates, and payment actions will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/invoices"
        element={<ProtectedRoute allowedRoles={['student', 'admin', 'finance']}><ModulePlaceholderPage title="Invoices" description="Invoice generation and history will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/admission"
        element={<ProtectedRoute allowedRoles={['admin']}><ModulePlaceholderPage title="Admission" description="Admission workflows and approvals will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/payroll"
        element={<ProtectedRoute allowedRoles={['admin', 'finance']}><ModulePlaceholderPage title="Payroll" description="Payroll processing and records will appear here." /></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/students" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><StudentsPage /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><StudentDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

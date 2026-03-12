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
import NotificationsPage from './pages/NotificationsPage';

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
      <Route path="/placement" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><PlacementPage /></ProtectedRoute>} />
      <Route path="/facility" element={<ProtectedRoute allowedRoles={['admin']}><FacilityPage /></ProtectedRoute>} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

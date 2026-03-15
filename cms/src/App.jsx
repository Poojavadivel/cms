import { Navigate, Route, Routes } from 'react-router-dom';
import { getUserSession } from './auth/sessionController';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { Navigate, useLocation } from 'react-router-dom';
import { hasActiveSession, getUserSession } from '../auth/sessionController';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const session = getUserSession();

  if (!hasActiveSession()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session?.role)) {
    return <Navigate to={`/dashboard?role=${encodeURIComponent(session?.role || 'student')}`} replace />;
  }

  return children;
}

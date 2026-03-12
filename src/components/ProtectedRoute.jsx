import { Navigate, useLocation } from 'react-router-dom';
import { getUserSession, hasActiveSession } from '../auth/sessionController';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();

  if (!hasActiveSession()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles) {
    const session = getUserSession();
    if (!session || !allowedRoles.includes(session.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

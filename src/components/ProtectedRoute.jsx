import { Navigate, useLocation } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to={`/dashboard?role=${encodeURIComponent(session.role)}`} replace />;
  }

  return children;
}

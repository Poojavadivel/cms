import { Navigate, useLocation } from 'react-router-dom';
import { hasActiveSession } from '../auth/sessionController';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasActiveSession()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}

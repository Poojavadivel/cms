import { Navigate } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';

export default function RoleGuard({ roles, children }) {
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (!roles.includes(session.role)) {
    return <Navigate to={`/dashboard?role=${encodeURIComponent(session.role)}`} replace />;
  }

  return children;
}

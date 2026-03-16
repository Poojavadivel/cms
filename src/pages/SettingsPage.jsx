import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';
import Layout from '../components/Layout';
import RoleGuard from '../components/RoleGuard';
import SettingsLayout from '../components/settings/SettingsLayout';
import UserSettingsPage from '../components/user-settings/SettingsPage';
import { cmsRoles } from '../data/roleConfig';
import '../settings.css';
import '../user-settings.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  const role = session.role;

  useEffect(() => {
    const roleLabel = cmsRoles[role]?.label || 'System';
    const titlePrefix = role === 'student' || role === 'faculty' ? 'User Settings' : 'System Settings';
    document.title = `EduCore - ${roleLabel} ${titlePrefix}`;

    const expectedSearch = `?role=${encodeURIComponent(role)}`;
    if (location.search !== expectedSearch) {
      navigate(`/settings${expectedSearch}`, { replace: true });
    }
  }, [location.search, navigate, role]);

  const title = role === 'student' || role === 'faculty' ? 'Settings' : 'System Settings';

  if (role !== 'student' && role !== 'faculty' && role !== 'admin' && role !== 'finance') {
    return <Navigate to={`/dashboard?role=${encodeURIComponent(role)}`} replace />;
  }

  return (
    <Layout title={title}>
      {(role === 'student' || role === 'faculty') && (
        <RoleGuard roles={['student', 'faculty']}>
          <UserSettingsPage role={role} userId={session.userId} />
        </RoleGuard>
      )}
      {(role === 'admin' || role === 'finance') && (
        <RoleGuard roles={['admin', 'finance']}>
          <SettingsLayout role={role} userId={session.userId} />
        </RoleGuard>
      )}
    </Layout>
  );
}

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
    if (role === 'faculty') {
      navigate('/faculty/settings', { replace: true });
      return;
    }

    if (role === 'finance') {
      navigate('/finance/settings', { replace: true });
      return;
    }

    const roleLabel = cmsRoles[role]?.label || 'System';
    const titlePrefix = role === 'student' ? 'User Settings' : 'System Settings';
    document.title = `MIT Connect - ${roleLabel} ${titlePrefix}`;

    const expectedSearch = `?role=${encodeURIComponent(role)}`;
    if (location.search !== expectedSearch) {
      navigate(`/settings${expectedSearch}`, { replace: true });
    }
  }, [location.search, navigate, role]);

  if (role === 'faculty' || role === 'finance') {
    return null;
  }

  const title = role === 'student' ? 'Settings' : 'System Settings';

  if (role !== 'student' && role !== 'faculty' && role !== 'admin' && role !== 'finance') {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout title={title}>
      {role === 'student' && (
        <RoleGuard roles={['student']}>
          <UserSettingsPage role={role} userId={session.userId} />
        </RoleGuard>
      )}
      {role === 'admin' && (
        <RoleGuard roles={['admin']}>
          <SettingsLayout role={role} userId={session.userId} />
        </RoleGuard>
      )}
    </Layout>
  );
}

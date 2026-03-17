import { Navigate } from 'react-router-dom';
import { getUserSession } from '../../auth/sessionController';
import Layout from '../../components/Layout';
import RoleGuard from '../../components/RoleGuard';
import SettingsLayout from '../../components/settings/SettingsLayout';
import '../../settings.css';
import '../../user-settings.css';

export default function AdminSettings() {
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role !== 'admin') {
    return <Navigate to={`/settings?role=${encodeURIComponent(session.role)}`} replace />;
  }

  return (
    <Layout title="System Settings">
      <RoleGuard roles={['admin']}>
        <SettingsLayout role="admin" userId={session.userId} />
      </RoleGuard>
    </Layout>
  );
}

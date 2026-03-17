import { Navigate } from 'react-router-dom';
import { getUserSession } from '../../auth/sessionController';
import Layout from '../../components/Layout';
import RoleGuard from '../../components/RoleGuard';
import UserSettingsPage from '../../components/user-settings/SettingsPage';
import '../../settings.css';
import '../../user-settings.css';

export default function StudentSettings() {
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role !== 'student') {
    return <Navigate to={`/settings?role=${encodeURIComponent(session.role)}`} replace />;
  }

  return (
    <Layout title="Settings">
      <RoleGuard roles={['student']}>
        <UserSettingsPage role="student" userId={session.userId} />
      </RoleGuard>
    </Layout>
  );
}

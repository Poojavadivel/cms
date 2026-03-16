import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import NotificationCenter from '../components/NotificationCenter';
import { getUserSession } from '../auth/sessionController';
import { getValidRole } from '../data/roleConfig';

export default function NotificationPage() {
  const [searchParams] = useSearchParams();
  const session = getUserSession();
  const queryRole = searchParams.get('role');
  const role = getValidRole(session?.role || queryRole || 'student');

  useEffect(() => {
    document.title = 'EduCore - Notifications';
  }, []);

  return (
    <Layout title="Notifications">
      <NotificationCenter role={role} />
    </Layout>
  );
}

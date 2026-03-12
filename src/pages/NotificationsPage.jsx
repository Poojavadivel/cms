import { useSearchParams, useNavigate } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';
import NotificationCenter from '../components/NotificationCenter';

export default function NotificationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = getUserSession();
  const role = searchParams.get('role') || session?.role || 'student';

  function handleBackToDashboard() {
    navigate(`/dashboard?role=${encodeURIComponent(role)}`);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={handleBackToDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          ← Back to Dashboard
        </button>
        <span style={{ color: '#94a3b8', fontSize: '13px' }}>
          MIT Connect — <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{role}</strong> Notifications
        </span>
      </div>
      <div style={{ padding: '20px' }}>
        <NotificationCenter role={role} />
      </div>
    </div>
  );
}

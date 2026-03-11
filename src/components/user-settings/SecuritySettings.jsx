import { useEffect, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionError, SectionLoader } from './SettingsCommon';

export default function SecuritySettings({ role, userId }) {
  const { markSectionDirty } = useSettingsContext();
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [sessionData, historyData] = await Promise.all([
        userSettingsApi.getSessions(role, userId),
        userSettingsApi.getLoginHistory(role, userId),
      ]);
      setSessions(sessionData);
      setLoginHistory(historyData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    markSectionDirty('security', false);
    load();
  }, [markSectionDirty, role, userId]);

  if (loading) {
    return <SectionLoader label="Loading security data..." />;
  }

  async function handleLogoutAll() {
    setRunningAction(true);
    setError('');

    try {
      const response = await userSettingsApi.logoutAllDevices(role, userId);
      setSessions(response.data || []);
      setToast('All active sessions were logged out.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setRunningAction(false);
    }
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Security</h3>
        <p>Review active sessions, login history, and secure account activity.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-security-grid">
        <article className="user-settings-panel">
          <div className="user-settings-panel-head">
            <h4>Active Sessions</h4>
            <button type="button" onClick={load} className="user-settings-inline-btn">
              Refresh
            </button>
          </div>

          <ul className="user-settings-list">
            {sessions.map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.device}</strong>
                  <p>
                    {session.location} | Last Seen: {new Date(session.lastSeen).toLocaleString()}
                  </p>
                </div>
                <span className={`user-settings-badge${session.active ? ' active' : ''}`}>
                  {session.active ? 'Active' : 'Logged Out'}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="user-settings-btn user-settings-btn-danger"
            onClick={handleLogoutAll}
            disabled={runningAction}
          >
            {runningAction ? 'Logging Out...' : 'Logout All Devices'}
          </button>
        </article>

        <article className="user-settings-panel">
          <h4>Login History</h4>
          <ul className="user-settings-list">
            {loginHistory.map((entry, index) => (
              <li key={`${entry.timestamp}-${index}`}>
                <div>
                  <strong>{new Date(entry.timestamp).toLocaleString()}</strong>
                  <p>IP: {entry.ip}</p>
                </div>
                <span className={`user-settings-badge ${entry.status === 'success' ? 'active' : 'failed'}`}>
                  {entry.status}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsToast from './SettingsToast';

const cardLabels = [
  { key: 'activeUsers', label: 'Active Users' },
  { key: 'failedLogins', label: 'Failed Login Attempts' },
  { key: 'uptime', label: 'System Uptime' },
  { key: 'errorLogs', label: 'Error Logs' },
];

export default function MonitoringDashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setRefreshing(true);
    const data = await settingsApi.getMonitoringSnapshot();
    setSnapshot(data);
    setRefreshing(false);
    setToast({ type: 'success', message: 'Monitoring snapshot refreshed.' });
  }

  if (!snapshot) {
    return <div className="settings-skeleton">Loading monitoring metrics...</div>;
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>System Monitoring</h3>
            <p>Track platform health, uptime, and authentication events.</p>
          </div>
          <button type="button" className="settings-btn settings-btn-primary" onClick={refresh} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </button>
        </div>

        <div className="settings-metric-grid">
          {cardLabels.map((card) => (
            <article key={card.key} className="settings-metric-card">
              <span>{card.label}</span>
              <strong>{snapshot[card.key]}</strong>
            </article>
          ))}
        </div>

        <div className="settings-monitor-footer">Last poll: {new Date(snapshot.polledAt).toLocaleString()}</div>
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

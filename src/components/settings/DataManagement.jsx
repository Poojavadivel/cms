import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

export default function DataManagement() {
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [runningJob, setRunningJob] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getDataManagementSettings();
      setForm(data);
      setBaseline(data);
    }

    load();
  }, []);

  if (!form) {
    return <div className="settings-skeleton">Loading data management settings...</div>;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const updated = await settingsApi.updateDataManagementSettings(form);
    setForm(updated);
    setBaseline(updated);
    setToast({ type: 'success', message: 'Data management policies saved.' });
    setSaving(false);
  }

  function handleReset() {
    setForm(baseline);
    setToast({ type: 'success', message: 'Data policies reset.' });
  }

  async function runBackup() {
    setRunningJob('backup');
    const response = await settingsApi.triggerBackup();
    setForm((current) => ({ ...current, lastBackupId: response.backupId }));
    setToast({ type: 'success', message: `Backup completed: ${response.backupId}` });
    setRunningJob('');
  }

  async function runRestore() {
    setRunningJob('restore');
    const response = await settingsApi.triggerRestore(form.lastBackupId);
    setToast({ type: 'success', message: `Restore completed from ${response.restoredFrom}` });
    setRunningJob('');
  }

  async function runExport() {
    setRunningJob('export');
    const response = await settingsApi.exportData();
    setToast({ type: 'success', message: `Export generated: ${response.fileName}` });
    setRunningJob('');
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <h3>Data Management</h3>
        <p>Control retention policies and run backup, restore, and export operations.</p>

        <div className="settings-form-grid compact">
          <label>
            Retention Period (Days)
            <input
              type="number"
              min="30"
              value={form.retentionDays}
              onChange={(event) => updateField('retentionDays', Number(event.target.value) || 30)}
            />
          </label>

          <label>
            Export Format
            <select value={form.exportFormat} onChange={(event) => updateField('exportFormat', event.target.value)}>
              <option>CSV</option>
              <option>JSON</option>
              <option>XLSX</option>
            </select>
          </label>

          <label className="settings-inline-toggle">
            <input
              type="checkbox"
              checked={form.autoBackupEnabled}
              onChange={(event) => updateField('autoBackupEnabled', event.target.checked)}
            />
            <span>Enable automatic backups</span>
          </label>

          <label>
            Latest Backup ID
            <input type="text" value={form.lastBackupId} readOnly />
          </label>
        </div>

        <div className="settings-inline-actions">
          <button type="button" className="settings-btn settings-btn-primary" onClick={runBackup} disabled={runningJob}>
            {runningJob === 'backup' ? 'Running Backup...' : 'Backup Database'}
          </button>
          <button type="button" className="settings-btn settings-btn-ghost" onClick={runRestore} disabled={runningJob}>
            {runningJob === 'restore' ? 'Restoring...' : 'Restore Backup'}
          </button>
          <button type="button" className="settings-btn settings-btn-ghost" onClick={runExport} disabled={runningJob}>
            {runningJob === 'export' ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        <SettingsActionBar onSave={handleSave} onReset={handleReset} saving={saving} />
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

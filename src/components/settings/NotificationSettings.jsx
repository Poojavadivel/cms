import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

export default function NotificationSettings() {
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getNotificationSettings();
      setForm(data);
      setBaseline(data);
    }

    load();
  }, []);

  if (!form) {
    return <div className="settings-skeleton">Loading notification settings...</div>;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const updated = await settingsApi.updateNotificationSettings(form);
    setBaseline(updated);
    setForm(updated);
    setToast({ type: 'success', message: 'Notification settings saved.' });
    setSaving(false);
  }

  function handleReset() {
    setForm(baseline);
    setToast({ type: 'success', message: 'Notification settings reset.' });
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <h3>Notification Settings</h3>
        <p>Manage email, SMS, push notifications, and announcement rules.</p>

        <div className="settings-form-grid">
          <label className="settings-form-span-2">
            Email Template
            <textarea
              rows="3"
              value={form.emailTemplate}
              onChange={(event) => updateField('emailTemplate', event.target.value)}
            />
          </label>

          <label className="settings-form-span-2">
            SMS Template
            <textarea
              rows="2"
              value={form.smsTemplate}
              onChange={(event) => updateField('smsTemplate', event.target.value)}
            />
          </label>

          <label className="settings-inline-toggle">
            <input
              type="checkbox"
              checked={form.pushEnabled}
              onChange={(event) => updateField('pushEnabled', event.target.checked)}
            />
            <span>Enable Push Notifications</span>
          </label>

          <label className="settings-form-span-2">
            Announcement Rules
            <textarea
              rows="3"
              value={form.announcementRule}
              onChange={(event) => updateField('announcementRule', event.target.value)}
            />
          </label>
        </div>

        <SettingsActionBar onSave={handleSave} onReset={handleReset} saving={saving} />
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

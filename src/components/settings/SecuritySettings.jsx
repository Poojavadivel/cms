import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

export default function SecuritySettings() {
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getSecuritySettings();
      setForm(data);
      setBaseline(data);
    }

    load();
  }, []);

  if (!form) {
    return <div className="settings-skeleton">Loading security settings...</div>;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const updated = await settingsApi.updateSecuritySettings(form);
    setBaseline(updated);
    setForm(updated);
    setToast({ type: 'success', message: 'Security policies updated.' });
    setSaving(false);
  }

  function handleReset() {
    setForm(baseline);
    setToast({ type: 'success', message: 'Security policies reset.' });
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <h3>Security Settings</h3>
        <p>Control password rules, MFA, login limits, and session policies.</p>

        <div className="settings-form-grid">
          <label>
            Minimum Password Length
            <input
              type="number"
              min="6"
              max="24"
              value={form.minPasswordLength}
              onChange={(event) => updateField('minPasswordLength', Number(event.target.value) || 8)}
            />
          </label>

          <label>
            Maximum Failed Logins
            <input
              type="number"
              min="3"
              value={form.maxLoginAttempts}
              onChange={(event) => updateField('maxLoginAttempts', Number(event.target.value) || 5)}
            />
          </label>

          <label>
            Session Timeout (minutes)
            <input
              type="number"
              min="5"
              value={form.sessionTimeout}
              onChange={(event) => updateField('sessionTimeout', Number(event.target.value) || 30)}
            />
          </label>

          <label className="settings-inline-toggle">
            <input
              type="checkbox"
              checked={form.requireUppercase}
              onChange={(event) => updateField('requireUppercase', event.target.checked)}
            />
            <span>Require uppercase letters</span>
          </label>

          <label className="settings-inline-toggle">
            <input
              type="checkbox"
              checked={form.mfaEnabled}
              onChange={(event) => updateField('mfaEnabled', event.target.checked)}
            />
            <span>Enable MFA for staff accounts</span>
          </label>

          <label className="settings-form-span-2">
            IP Restrictions
            <textarea
              rows="3"
              value={form.ipRestrictions}
              onChange={(event) => updateField('ipRestrictions', event.target.value)}
            />
          </label>
        </div>

        <SettingsActionBar onSave={handleSave} onReset={handleReset} saving={saving} />
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

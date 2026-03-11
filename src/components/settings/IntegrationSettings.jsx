import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

export default function IntegrationSettings() {
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getIntegrationSettings();
      setForm(data);
      setBaseline(data);
    }

    load();
  }, []);

  if (!form) {
    return <div className="settings-skeleton">Loading integrations...</div>;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const updated = await settingsApi.updateIntegrationSettings(form);
    setBaseline(updated);
    setForm(updated);
    setToast({ type: 'success', message: 'Integration settings saved.' });
    setSaving(false);
  }

  function handleReset() {
    setForm(baseline);
    setToast({ type: 'success', message: 'Integration settings reset.' });
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <h3>Integration Settings</h3>
        <p>Configure SMTP, payment services, webhooks, and external APIs.</p>

        <div className="settings-form-grid">
          <label>
            SMTP Host
            <input
              type="text"
              value={form.smtpHost}
              onChange={(event) => updateField('smtpHost', event.target.value)}
            />
          </label>

          <label>
            SMTP Port
            <input
              type="number"
              min="1"
              value={form.smtpPort}
              onChange={(event) => updateField('smtpPort', Number(event.target.value) || 587)}
            />
          </label>

          <label>
            SMTP User
            <input
              type="text"
              value={form.smtpUser}
              onChange={(event) => updateField('smtpUser', event.target.value)}
            />
          </label>

          <label>
            Payment Gateway
            <select
              value={form.paymentGatewayProvider}
              onChange={(event) => updateField('paymentGatewayProvider', event.target.value)}
            >
              <option>Razorpay</option>
              <option>PayU</option>
              <option>Stripe</option>
            </select>
          </label>

          <label className="settings-form-span-2">
            Webhook URL
            <input
              type="url"
              value={form.webhookUrl}
              onChange={(event) => updateField('webhookUrl', event.target.value)}
            />
          </label>

          <label>
            External API Base URL
            <input
              type="url"
              value={form.externalApiBaseUrl}
              onChange={(event) => updateField('externalApiBaseUrl', event.target.value)}
            />
          </label>

          <label>
            External API Token
            <input
              type="password"
              value={form.externalApiToken}
              onChange={(event) => updateField('externalApiToken', event.target.value)}
            />
          </label>
        </div>

        <SettingsActionBar onSave={handleSave} onReset={handleReset} saving={saving} />
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

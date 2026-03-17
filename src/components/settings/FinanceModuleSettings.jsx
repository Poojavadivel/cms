import { useEffect, useMemo, useState } from 'react';
import {
  SectionActions,
  SectionError,
  SectionLoader,
  SaveToast,
  ToggleSwitch,
  isDirty,
} from '../user-settings/SettingsCommon';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function fetchFinanceSettings(userId) {
  const res = await fetch(`${API_BASE}/api/settings/finance/${userId}`);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to load finance notification settings.');
  // backend returns { status, data }
  return json.data ?? json;
}

async function saveFinanceToggles(userId, toggles) {
  const res = await fetch(`${API_BASE}/api/settings/finance/toggles/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toggles),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to save finance notification settings.');
  // backend returns { status, data }
  return json.data ?? json;
}

export default function FinanceModuleSettings({ userId }) {
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    fetchFinanceSettings(userId)
      .then((data) => {
        if (!mounted) return;
        const toggles = {
          payment_notifications: Boolean(data.payment_notifications),
          refund_alerts: Boolean(data.refund_alerts),
        };
        setForm(toggles);
        setBaseline(toggles);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  const dirty = useMemo(() => isDirty(form, baseline), [form, baseline]);

  if (loading) {
    return <SectionLoader label="Loading finance notification settings..." />;
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = await saveFinanceToggles(userId, form);
      const toggles = {
        payment_notifications: Boolean(updated.payment_notifications),
        refund_alerts: Boolean(updated.refund_alerts),
      };
      setForm(toggles);
      setBaseline(toggles);
      setToast('Finance notification settings updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(baseline);
    setToast('');
  }

  return (
    <article className="settings-card">
      <h3>Finance Notification Settings</h3>
      <p>Control real-time alert preferences for the finance module.</p>

      <SectionError message={error} />

      {form ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <ToggleSwitch
              checked={form.payment_notifications}
              onChange={(val) => setForm((prev) => ({ ...prev, payment_notifications: val }))}
              label="Payment Notifications"
              description="Receive alerts when payment transactions are recorded or updated."
            />
            <ToggleSwitch
              checked={form.refund_alerts}
              onChange={(val) => setForm((prev) => ({ ...prev, refund_alerts: val }))}
              label="Refund Alerts"
              description="Get notified when refund requests are created or processed."
            />
          </div>
          <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
        </>
      ) : (
        <SectionError message={error || 'Unable to load notification settings.'} />
      )}

      <SaveToast message={toast} onClear={() => setToast('')} />
    </article>
  );
}

import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

export default function GeneralSettings() {
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getGeneralSettings();
      setForm(data);
      setBaseline(data);
    }

    load();
  }, []);

  if (!form) {
    return <div className="settings-skeleton">Loading general settings...</div>;
  }

  function setField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    const updated = await settingsApi.updateGeneralSettings(form);
    setBaseline(updated);
    setForm(updated);
    setToast({ type: 'success', message: 'General settings updated successfully.' });
    setSaving(false);
  }

  function handleReset() {
    setForm(baseline);
    setToast({ type: 'success', message: 'General settings were reset.' });
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <h3>Portal Preferences</h3>
        <p>Configure portal identity, locale, and display standards.</p>

        <div className="settings-form-grid">
          <label>
            Portal Name
            <input
              type="text"
              value={form.portalName}
              onChange={(event) => setField('portalName', event.target.value)}
            />
          </label>

          <label>
            Theme
            <select value={form.theme} onChange={(event) => setField('theme', event.target.value)}>
              <option>Ocean Blue</option>
              <option>Slate Gray</option>
              <option>Emerald Cloud</option>
            </select>
          </label>

          <label>
            Language
            <select value={form.language} onChange={(event) => setField('language', event.target.value)}>
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
            </select>
          </label>

          <label>
            Timezone
            <select value={form.timezone} onChange={(event) => setField('timezone', event.target.value)}>
              <option>Asia/Kolkata</option>
              <option>UTC</option>
              <option>Asia/Singapore</option>
            </select>
          </label>

          <label>
            Date Format
            <select value={form.dateFormat} onChange={(event) => setField('dateFormat', event.target.value)}>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </label>

          <label>
            University Logo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setField('logoFileName', event.target.files?.[0]?.name || form.logoFileName)}
            />
            <small>Current: {form.logoFileName}</small>
          </label>

          <label>
            Favicon
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setField('faviconFileName', event.target.files?.[0]?.name || form.faviconFileName)}
            />
            <small>Current: {form.faviconFileName}</small>
          </label>
        </div>

        <SettingsActionBar onSave={handleSave} onReset={handleReset} saving={saving} />
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

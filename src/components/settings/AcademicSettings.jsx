import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

export default function AcademicSettings() {
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getAcademicSettings();
      setForm(data);
      setBaseline(data);
    }

    load();
  }, []);

  if (!form) {
    return <div className="settings-skeleton">Loading academic configuration...</div>;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const updated = await settingsApi.updateAcademicSettings(form);
    setBaseline(updated);
    setForm(updated);
    setToast({ type: 'success', message: 'Academic configuration updated.' });
    setSaving(false);
  }

  function handleReset() {
    setForm(baseline);
    setToast({ type: 'success', message: 'Academic configuration reset.' });
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <h3>Academic Configuration</h3>
        <p>Manage academic years, semesters, credits, and grading standards.</p>

        <div className="settings-form-grid">
          <label>
            Current Academic Year
            <input
              type="text"
              value={form.currentYear}
              onChange={(event) => updateField('currentYear', event.target.value)}
            />
          </label>

          <label>
            Number of Semesters
            <input
              type="number"
              min="1"
              max="4"
              value={form.semesters}
              onChange={(event) => updateField('semesters', Number(event.target.value) || 1)}
            />
          </label>

          <label>
            Credit System
            <select value={form.creditSystem} onChange={(event) => updateField('creditSystem', event.target.value)}>
              <option>CBCS</option>
              <option>Choice Based Credit</option>
              <option>Fixed Credit</option>
            </select>
          </label>

          <label className="settings-form-span-2">
            Attendance Rules
            <textarea
              rows="3"
              value={form.attendanceRule}
              onChange={(event) => updateField('attendanceRule', event.target.value)}
            />
          </label>

          <label className="settings-form-span-2">
            Grade Rules
            <textarea
              rows="3"
              value={form.gradeRule}
              onChange={(event) => updateField('gradeRule', event.target.value)}
            />
          </label>
        </div>

        <SettingsActionBar onSave={handleSave} onReset={handleReset} saving={saving} />
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

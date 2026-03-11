import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionActions, SectionError, SectionLoader, isDirty } from './SettingsCommon';

export default function AppearanceSettings({ role, userId }) {
  const { setSectionData, markSectionDirty } = useSettingsContext();
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await userSettingsApi.getAppearance(role, userId);
        if (!mounted) {
          return;
        }

        setForm(data);
        setBaseline(data);
        setSectionData('appearance', data);
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
      markSectionDirty('appearance', false);
    };
  }, [markSectionDirty, role, setSectionData, userId]);

  const dirty = useMemo(() => isDirty(form, baseline), [baseline, form]);

  useEffect(() => {
    markSectionDirty('appearance', dirty);
  }, [dirty, markSectionDirty]);

  if (loading) {
    return <SectionLoader label="Loading appearance settings..." />;
  }

  if (!form) {
    return <SectionError message={error || 'Unable to load appearance settings.'} />;
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      const response = await userSettingsApi.updateAppearance(role, userId, form);
      const updated = response.data;
      setForm(updated);
      setBaseline(updated);
      setSectionData('appearance', updated);
      setToast('Appearance settings updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(baseline);
    setToast('Appearance settings reset.');
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Appearance</h3>
        <p>Customize theme, font size, accent color, and interface density.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-grid">
        <label>
          Theme
          <select value={form.theme || 'light'} onChange={(event) => updateField('theme', event.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </label>

        <label>
          Font Size
          <select value={form.fontSize || 'medium'} onChange={(event) => updateField('fontSize', event.target.value)}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>

        <label>
          Accent Color
          <select value={form.accentColor || 'blue'} onChange={(event) => updateField('accentColor', event.target.value)}>
            <option value="blue">Blue</option>
            <option value="teal">Teal</option>
            <option value="emerald">Emerald</option>
            <option value="orange">Orange</option>
          </select>
        </label>

        <label>
          Layout Density
          <select
            value={form.layoutDensity || 'comfortable'}
            onChange={(event) => updateField('layoutDensity', event.target.value)}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
            <option value="spacious">Spacious</option>
          </select>
        </label>
      </div>

      <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

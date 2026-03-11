import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionActions, SectionError, SectionLoader, isDirty } from './SettingsCommon';

export default function LanguageSettings({ role, userId }) {
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
        const data = await userSettingsApi.getLanguage(role, userId);
        if (!mounted) {
          return;
        }

        setForm(data);
        setBaseline(data);
        setSectionData('language', data);
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
      markSectionDirty('language', false);
    };
  }, [markSectionDirty, role, setSectionData, userId]);

  const dirty = useMemo(() => isDirty(form, baseline), [baseline, form]);

  useEffect(() => {
    markSectionDirty('language', dirty);
  }, [dirty, markSectionDirty]);

  if (loading) {
    return <SectionLoader label="Loading language settings..." />;
  }

  if (!form) {
    return <SectionError message={error || 'Unable to load language settings.'} />;
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
      const response = await userSettingsApi.updateLanguage(role, userId, form);
      const updated = response.data;
      setForm(updated);
      setBaseline(updated);
      setSectionData('language', updated);
      setToast('Language & region settings saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(baseline);
    setToast('Language settings reset.');
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Language & Region</h3>
        <p>Set preferred language, timezone, region, and date format.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-grid">
        <label>
          Language
          <select value={form.language || 'English'} onChange={(event) => updateField('language', event.target.value)}>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Tamil">Tamil</option>
          </select>
        </label>

        <label>
          Region
          <select value={form.region || 'India'} onChange={(event) => updateField('region', event.target.value)}>
            <option value="India">India</option>
            <option value="Singapore">Singapore</option>
            <option value="United Arab Emirates">United Arab Emirates</option>
          </select>
        </label>

        <label>
          Timezone
          <select
            value={form.timezone || 'Asia/Kolkata'}
            onChange={(event) => updateField('timezone', event.target.value)}
          >
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="UTC">UTC</option>
            <option value="Asia/Singapore">Asia/Singapore</option>
          </select>
        </label>

        <label>
          Date Format
          <select
            value={form.dateFormat || 'DD/MM/YYYY'}
            onChange={(event) => updateField('dateFormat', event.target.value)}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </label>
      </div>

      <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

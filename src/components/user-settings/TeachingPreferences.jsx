import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionActions, SectionError, SectionLoader, ToggleSwitch, isDirty } from './SettingsCommon';

export default function TeachingPreferences({ role, userId }) {
  const { setSectionData, markSectionDirty } = useSettingsContext();
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (role !== 'faculty') {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await userSettingsApi.getTeachingPreferences(userId);
        if (!mounted) {
          return;
        }

        setForm(data);
        setBaseline(data);
        setSectionData('teachingPreferences', data);
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
      markSectionDirty('teaching-preferences', false);
    };
  }, [markSectionDirty, role, setSectionData, userId]);

  const dirty = useMemo(() => isDirty(form, baseline), [baseline, form]);

  useEffect(() => {
    markSectionDirty('teaching-preferences', dirty);
  }, [dirty, markSectionDirty]);

  if (role !== 'faculty') {
    return <SectionError message="Teaching preferences are available only for faculty accounts." />;
  }

  if (loading) {
    return <SectionLoader label="Loading teaching preferences..." />;
  }

  if (!form) {
    return <SectionError message={error || 'Unable to load teaching preferences.'} />;
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
      const response = await userSettingsApi.updateTeachingPreferences(userId, form);
      const updated = response.data;
      setForm(updated);
      setBaseline(updated);
      setSectionData('teachingPreferences', updated);
      setToast('Teaching preferences saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(baseline);
    setToast('Teaching preferences reset.');
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Teaching Preferences</h3>
        <p>Manage instructional mode, office hours, and grading automation options.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-grid">
        <label>
          Preferred Teaching Mode
          <select
            value={form.preferredMode || 'Hybrid'}
            onChange={(event) => updateField('preferredMode', event.target.value)}
          >
            <option value="Offline">Offline</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </label>

        <label>
          Office Hours
          <input
            type="text"
            value={form.officeHours || ''}
            onChange={(event) => updateField('officeHours', event.target.value)}
            placeholder="e.g. 2PM - 4PM"
          />
        </label>

        <div className="user-settings-grid-span-2">
          <ToggleSwitch
            label="Auto Publish Grades"
            description="Automatically publish grades once approved."
            checked={Boolean(form.autoPublishGrades)}
            onChange={(value) => updateField('autoPublishGrades', value)}
          />
        </div>
      </div>

      <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

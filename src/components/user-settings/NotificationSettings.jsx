import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionActions, SectionError, SectionLoader, ToggleSwitch, isDirty } from './SettingsCommon';

function labelFor(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

export default function NotificationSettings({ role, userId }) {
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
        const data = await userSettingsApi.getNotifications(role, userId);
        if (!mounted) {
          return;
        }

        setForm(data);
        setBaseline(data);
        setSectionData('notifications', data);
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
      markSectionDirty('notifications', false);
    };
  }, [markSectionDirty, role, setSectionData, userId]);

  const dirty = useMemo(() => isDirty(form, baseline), [baseline, form]);

  useEffect(() => {
    markSectionDirty('notifications', dirty);
  }, [dirty, markSectionDirty]);

  if (loading) {
    return <SectionLoader label="Loading notification preferences..." />;
  }

  if (!form) {
    return <SectionError message={error || 'Unable to load notification settings.'} />;
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
      const response = await userSettingsApi.updateNotifications(role, userId, form);
      const updated = response.data;
      setForm(updated);
      setBaseline(updated);
      setSectionData('notifications', updated);
      setToast('Notification preferences saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(baseline);
    setToast('Notification preferences reset.');
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Notification Preferences</h3>
        <p>Control alerts for academic updates, reminders, and communication.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-toggle-list">
        {Object.entries(form).map(([key, value]) => (
          <ToggleSwitch
            key={key}
            label={labelFor(key)}
            checked={Boolean(value)}
            onChange={(checked) => updateField(key, checked)}
          />
        ))}
      </div>

      <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

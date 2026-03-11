import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionActions, SectionError, SectionLoader, ToggleSwitch, isDirty } from './SettingsCommon';

export default function AccessibilitySettings({ role, userId }) {
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
        const data = await userSettingsApi.getAccessibility(role, userId);
        if (!mounted) {
          return;
        }

        setForm(data);
        setBaseline(data);
        setSectionData('accessibility', data);
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
      markSectionDirty('accessibility', false);
    };
  }, [markSectionDirty, role, setSectionData, userId]);

  const dirty = useMemo(() => isDirty(form, baseline), [baseline, form]);

  useEffect(() => {
    markSectionDirty('accessibility', dirty);
  }, [dirty, markSectionDirty]);

  if (loading) {
    return <SectionLoader label="Loading accessibility settings..." />;
  }

  if (!form) {
    return <SectionError message={error || 'Unable to load accessibility settings.'} />;
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
      const response = await userSettingsApi.updateAccessibility(role, userId, form);
      const updated = response.data;
      setForm(updated);
      setBaseline(updated);
      setSectionData('accessibility', updated);
      setToast('Accessibility settings updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(baseline);
    setToast('Accessibility settings reset.');
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Accessibility</h3>
        <p>Enable options that improve readability and interaction comfort.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-toggle-list">
        <ToggleSwitch
          label="High Contrast"
          description="Increase contrast between text and background."
          checked={Boolean(form.highContrast)}
          onChange={(value) => updateField('highContrast', value)}
        />
        <ToggleSwitch
          label="Reduce Motion"
          description="Minimize transitions and animated effects."
          checked={Boolean(form.reduceMotion)}
          onChange={(value) => updateField('reduceMotion', value)}
        />
        <ToggleSwitch
          label="Text To Speech Optimizations"
          description="Improve compatibility with screen reader tools."
          checked={Boolean(form.textToSpeech)}
          onChange={(value) => updateField('textToSpeech', value)}
        />
        <ToggleSwitch
          label="Large Click Targets"
          description="Increase button and tap area sizes."
          checked={Boolean(form.largeClickTargets)}
          onChange={(value) => updateField('largeClickTargets', value)}
        />
      </div>

      <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

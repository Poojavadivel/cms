import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionActions, SectionError, SectionLoader, ToggleSwitch, isDirty } from './SettingsCommon';

export default function PrivacySettings({ role, userId }) {
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
        const data = await userSettingsApi.getPrivacy(role, userId);
        if (!mounted) {
          return;
        }

        setForm(data);
        setBaseline(data);
        setSectionData('privacy', data);
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
      markSectionDirty('privacy', false);
    };
  }, [markSectionDirty, role, setSectionData, userId]);

  const dirty = useMemo(() => isDirty(form, baseline), [baseline, form]);

  useEffect(() => {
    markSectionDirty('privacy', dirty);
  }, [dirty, markSectionDirty]);

  if (loading) {
    return <SectionLoader label="Loading privacy settings..." />;
  }

  if (!form) {
    return <SectionError message={error || 'Unable to load privacy settings.'} />;
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
      const response = await userSettingsApi.updatePrivacy(role, userId, form);
      const updated = response.data;
      setForm(updated);
      setBaseline(updated);
      setSectionData('privacy', updated);
      setToast('Privacy settings updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(baseline);
    setToast('Privacy settings reset.');
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Privacy</h3>
        <p>Choose what profile information is visible to other portal users.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-toggle-list">
        <ToggleSwitch
          label="Profile Visibility"
          description="Allow others to view your public profile information."
          checked={Boolean(form.profileVisible)}
          onChange={(value) => updateField('profileVisible', value)}
        />
        <ToggleSwitch
          label="Searchable in Directory"
          description="Permit your profile to appear in people search."
          checked={Boolean(form.searchable)}
          onChange={(value) => updateField('searchable', value)}
        />
        <ToggleSwitch
          label="Allow Direct Messages"
          description="Allow direct communication from faculty and peers."
          checked={Boolean(form.allowDirectMessages)}
          onChange={(value) => updateField('allowDirectMessages', value)}
        />
      </div>

      <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionActions, SectionError, SectionLoader, isDirty } from './SettingsCommon';

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ProfileSettings({ role, userId }) {
  const { setSectionData, markSectionDirty } = useSettingsContext();
  const [profile, setProfile] = useState(null);
  const [baselineProfile, setBaselineProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [validation, setValidation] = useState({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await userSettingsApi.getProfile(role, userId);
        if (!mounted) {
          return;
        }

        setProfile(data);
        setBaselineProfile(data);
        setSectionData('profile', data);
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
      markSectionDirty('profile', false);
    };
  }, [markSectionDirty, role, setSectionData, userId]);

  const dirty = useMemo(() => isDirty(profile, baselineProfile), [profile, baselineProfile]);

  useEffect(() => {
    markSectionDirty('profile', dirty);
  }, [dirty, markSectionDirty]);

  if (loading) {
    return <SectionLoader label="Loading profile settings..." />;
  }

  if (!profile) {
    return <SectionError message={error || 'Failed to load profile.'} />;
  }

  function updateField(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!profile.name?.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!profile.email?.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isEmail(profile.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (profile.phone && !/^\d{10}$/.test(profile.phone)) {
      nextErrors.phone = 'Phone should contain 10 digits.';
    }

    setValidation(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await userSettingsApi.updateProfile(role, userId, profile);
      const updated = response.data;

      setProfile(updated);
      setBaselineProfile(updated);
      setSectionData('profile', updated);
      setToast('Profile updated successfully.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setProfile(baselineProfile);
    setValidation({});
    setToast('Profile reset to last saved values.');
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Profile</h3>
        <p>Manage your identity and contact information.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-grid">
        <label>
          Full Name
          <input type="text" value={profile.name || ''} onChange={(event) => updateField('name', event.target.value)} />
          {validation.name ? <small className="user-settings-field-error">{validation.name}</small> : null}
        </label>

        <label>
          Email Address
          <input
            type="email"
            value={profile.email || ''}
            onChange={(event) => updateField('email', event.target.value)}
          />
          {validation.email ? <small className="user-settings-field-error">{validation.email}</small> : null}
        </label>

        <label>
          Phone
          <input
            type="text"
            value={profile.phone || ''}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="10 digit mobile number"
          />
          {validation.phone ? <small className="user-settings-field-error">{validation.phone}</small> : null}
        </label>

        {role === 'faculty' ? (
          <label>
            Department
            <input
              type="text"
              value={profile.department || ''}
              onChange={(event) => updateField('department', event.target.value)}
            />
          </label>
        ) : (
          <label>
            Address
            <input
              type="text"
              value={profile.address || ''}
              onChange={(event) => updateField('address', event.target.value)}
            />
          </label>
        )}

        <label className="user-settings-grid-span-2">
          Bio
          <textarea rows="3" value={profile.bio || ''} onChange={(event) => updateField('bio', event.target.value)} />
        </label>
      </div>

      <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

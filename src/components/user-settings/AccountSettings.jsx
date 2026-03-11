import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionActions, SectionError, SectionLoader } from './SettingsCommon';

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AccountSettings({ role, userId }) {
  const { setSectionData, markSectionDirty } = useSettingsContext();
  const [email, setEmail] = useState('');
  const [baselineEmail, setBaselineEmail] = useState('');
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [validation, setValidation] = useState({});

  const passwordDirty = Object.values(passwordForm).some((value) => Boolean(value));
  const dirty = useMemo(() => email !== baselineEmail || passwordDirty, [baselineEmail, email, passwordDirty]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const profile = await userSettingsApi.getProfile(role, userId);
        if (!mounted) {
          return;
        }

        setEmail(profile.email || '');
        setBaselineEmail(profile.email || '');
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
      markSectionDirty('account', false);
    };
  }, [markSectionDirty, role, userId]);

  useEffect(() => {
    markSectionDirty('account', dirty);
  }, [dirty, markSectionDirty]);

  if (loading) {
    return <SectionLoader label="Loading account settings..." />;
  }

  function validate() {
    const next = {};

    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!isEmail(email.trim())) {
      next.email = 'Please provide a valid email.';
    }

    if (passwordDirty) {
      if (!passwordForm.oldPassword) {
        next.oldPassword = 'Current password is required.';
      }

      if (!passwordForm.newPassword) {
        next.newPassword = 'New password is required.';
      } else if (passwordForm.newPassword.length < 8) {
        next.newPassword = 'New password must be at least 8 characters.';
      }

      if (passwordForm.confirmPassword !== passwordForm.newPassword) {
        next.confirmPassword = 'Password confirmation does not match.';
      }
    }

    setValidation(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const messages = [];

      if (email !== baselineEmail) {
        await userSettingsApi.updateEmail(role, userId, email);
        setBaselineEmail(email);
        setSectionData('account', { email });
        messages.push('Email updated');
      }

      if (passwordDirty) {
        await userSettingsApi.changePassword(userId, passwordForm.oldPassword, passwordForm.newPassword);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        messages.push('Password changed');
      }

      if (!messages.length) {
        messages.push('No changes to save');
      }

      setToast(`${messages.join(' and ')}.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setEmail(baselineEmail);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setValidation({});
    setToast('Account form reset.');
  }

  function updatePasswordField(field, value) {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Account Settings</h3>
        <p>Update account email and change your password securely.</p>
      </header>

      <SectionError message={error} />

      <div className="user-settings-grid">
        <label>
          Account Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          {validation.email ? <small className="user-settings-field-error">{validation.email}</small> : null}
        </label>

        <label>
          Current Password
          <input
            type="password"
            value={passwordForm.oldPassword}
            onChange={(event) => updatePasswordField('oldPassword', event.target.value)}
            placeholder="Enter current password"
          />
          {validation.oldPassword ? <small className="user-settings-field-error">{validation.oldPassword}</small> : null}
        </label>

        <label>
          New Password
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) => updatePasswordField('newPassword', event.target.value)}
            placeholder="Minimum 8 characters"
          />
          {validation.newPassword ? <small className="user-settings-field-error">{validation.newPassword}</small> : null}
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
            placeholder="Re-enter new password"
          />
          {validation.confirmPassword ? (
            <small className="user-settings-field-error">{validation.confirmPassword}</small>
          ) : null}
        </label>
      </div>

      <SectionActions onSave={handleSave} onReset={handleReset} saving={saving} disableSave={!dirty} />
      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

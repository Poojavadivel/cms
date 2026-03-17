import { useEffect, useMemo, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { saveCurrentUserProfile } from '../../utils/currentUserProfile';
import { SaveToast, SectionError, SectionLoader, isDirty } from './SettingsCommon';

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ProfileSettings({ role, userId }) {
  const { setSectionData, markSectionDirty } = useSettingsContext();
  const [profile, setProfile] = useState(null);
  const [baselineProfile, setBaselineProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [toast, setToast] = useState('');
  const [profileValidation, setProfileValidation] = useState({});
  const [passwordValidation, setPasswordValidation] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setProfileError('');

      try {
        const data = await userSettingsApi.getProfile(role, userId);
        if (!mounted) {
          return;
        }

        setProfile(data);
        setBaselineProfile(data);
        setSectionData('profile', data);
        saveCurrentUserProfile(role, userId, data);
      } catch (loadError) {
        if (mounted) {
          setProfileError(loadError.message);
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
    return <SectionError message={profileError || 'Failed to load profile.'} />;
  }

  function updateField(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Basic client-side validation to avoid reading and persisting
    // very large or invalid files into local storage.
    const maxSizeBytes = 2 * 1024 * 1024; // 2 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      setProfileError('Please upload a JPEG, PNG, or GIF image.');
      event.target.value = '';
      return;
    }

    if (file.size > maxSizeBytes) {
      setProfileError('Profile photos must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    setProfileError('');

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = String(reader.result || '');

      setProfile((current) => {
        if (!current) {
          return current;
        }

        const updatedProfile = {
          ...current,
          profilePhoto: imageData,
          avatar: imageData,
        };

        saveCurrentUserProfile(role, userId, updatedProfile);
        return updatedProfile;
      });
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoRemove() {
    const nextProfile = {
      ...profile,
      profilePhoto: '',
      avatar: '',
    };

    setProfile((current) => ({
      ...current,
      profilePhoto: '',
      avatar: '',
    }));
    saveCurrentUserProfile(role, userId, nextProfile);
    setToast('Profile photo removed. Click Update Profile to save changes.');
  }

  function validateProfileForm() {
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

    setProfileValidation(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validatePasswordForm() {
    const nextErrors = {};

    if (!passwordForm.currentPassword.trim()) {
      nextErrors.currentPassword = 'Current password is required.';
    }

    if (!passwordForm.newPassword.trim()) {
      nextErrors.newPassword = 'New password is required.';
    } else if (passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = 'New password must contain at least 8 characters.';
    }

    if (!passwordForm.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirm password is required.';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setPasswordValidation(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleProfileSave() {
    if (!validateProfileForm()) {
      return;
    }

    setProfileSaving(true);
    setProfileError('');

    try {
      const response = await userSettingsApi.updateProfile(role, userId, profile);
      const updated = response.data;

      setProfile(updated);
      setBaselineProfile(updated);
      setSectionData('profile', updated);
      saveCurrentUserProfile(role, userId, updated);
      setToast('Profile updated successfully.');
    } catch (saveError) {
      setProfileError(saveError.message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave() {
    if (!validatePasswordForm()) {
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');

    try {
      const response = await userSettingsApi.changePassword(
        userId,
        passwordForm.currentPassword,
        passwordForm.newPassword,
        role
      );

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordValidation({});
      setToast(response.message || 'Password updated successfully.');
    } catch (saveError) {
      setPasswordError(saveError.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  const photoPreview = profile.profilePhoto || profile.avatar || '';

  return (
    <section className="user-settings-section">
      <header>
        <h3>Profile</h3>
        <p>Update your account information.</p>
      </header>

      <article className="user-settings-panel">
        <h4>Profile Information</h4>
        <SectionError message={profileError} />

        <div className="user-settings-grid">
          <label>
            Full Name
            <input type="text" value={profile.name || ''} onChange={(event) => updateField('name', event.target.value)} />
            {profileValidation.name ? <small className="user-settings-field-error">{profileValidation.name}</small> : null}
          </label>

          <label>
            Email
            <input type="email" value={profile.email || ''} onChange={(event) => updateField('email', event.target.value)} />
            {profileValidation.email ? <small className="user-settings-field-error">{profileValidation.email}</small> : null}
          </label>

          <label>
            Phone
            <input type="text" value={profile.phone || ''} onChange={(event) => updateField('phone', event.target.value)} />
            {profileValidation.phone ? <small className="user-settings-field-error">{profileValidation.phone}</small> : null}
          </label>

          <label>
            Department
            <input
              type="text"
              value={profile.department || ''}
              onChange={(event) => updateField('department', event.target.value)}
            />
          </label>

          <label className="user-settings-grid-span-2">
            Address
            <textarea
              rows="3"
              value={profile.address || ''}
              onChange={(event) => updateField('address', event.target.value)}
            />
          </label>

          <label>
            Role
            <input type="text" value={role.charAt(0).toUpperCase() + role.slice(1)} readOnly disabled />
          </label>

          <div className="user-settings-photo-field">
            <span className="user-settings-photo-label">Profile Photo</span>
            <div className="user-settings-photo-row">
              <div className="user-settings-photo-preview">
                {photoPreview ? <img src={photoPreview} alt={profile.name || 'Profile'} /> : <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>}
              </div>
              <label className="user-settings-photo-upload">
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
                <span>Choose Photo</span>
              </label>
              {photoPreview ? (
                <button
                  type="button"
                  className="user-settings-btn user-settings-btn-danger"
                  onClick={handlePhotoRemove}
                >
                  Delete Photo
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="user-settings-actions user-settings-actions-start">
          <button
            type="button"
            className="user-settings-btn user-settings-btn-primary"
            onClick={handleProfileSave}
            disabled={profileSaving || !dirty}
          >
            {profileSaving ? 'Updating...' : 'Update Profile'}
          </button>
        </div>

        {toast ? <div className="user-settings-success">{toast}</div> : null}
      </article>

      <article className="user-settings-panel">
        <h4>Update Password</h4>
        <SectionError message={passwordError} />

        <div className="user-settings-grid">
          <label className="user-settings-grid-span-2">
            Current Password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
            />
            {passwordValidation.currentPassword ? (
              <small className="user-settings-field-error">{passwordValidation.currentPassword}</small>
            ) : null}
          </label>

          <label>
            New Password
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
            />
            {passwordValidation.newPassword ? (
              <small className="user-settings-field-error">{passwordValidation.newPassword}</small>
            ) : null}
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            />
            {passwordValidation.confirmPassword ? (
              <small className="user-settings-field-error">{passwordValidation.confirmPassword}</small>
            ) : null}
          </label>
        </div>

        <div className="user-settings-actions user-settings-actions-start">
          <button
            type="button"
            className="user-settings-btn user-settings-btn-primary"
            onClick={handlePasswordSave}
            disabled={passwordSaving}
          >
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </article>

      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}

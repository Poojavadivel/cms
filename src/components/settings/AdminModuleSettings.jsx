import { useEffect, useMemo, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import { userSettingsApi } from '../../api/userSettingsApi';
import { saveCurrentUserProfile } from '../../utils/currentUserProfile';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^\d{10}$/.test(value);
}

function defaultAdminProfile(userId) {
  return {
    name: 'Admin User',
    email: 'admin@mitconnect.edu',
    phone: '',
    department: 'Campus Administration',
    address: '',
    adminId: userId,
    profilePhoto: '',
    avatar: '',
  };
}

function defaultSystemInfo() {
  return {
    collegeName: 'MIT Connect',
    collegeLogo: '',
    collegeLogoFileName: '',
    address: '',
    contactEmail: '',
    phoneNumber: '',
  };
}

function defaultAcademicInfo() {
  return {
    departments: '',
    courses: '',
    semesters: 2,
  };
}

export default function AdminModuleSettings({ role, userId }) {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileBaseline, setProfileBaseline] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileValidation, setProfileValidation] = useState({});

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({});

  const [systemInfo, setSystemInfo] = useState(null);
  const [systemBaseline, setSystemBaseline] = useState(null);
  const [systemSaving, setSystemSaving] = useState(false);

  const [academicInfo, setAcademicInfo] = useState(null);
  const [academicBaseline, setAcademicBaseline] = useState(null);
  const [academicSaving, setAcademicSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setLoading(true);
      setProfileError('');

      try {
        const [profileResult, generalResult, academicResult] = await Promise.allSettled([
          userSettingsApi.getProfile(role, userId),
          settingsApi.getAdminSystemSettings(),
          settingsApi.getAdminAcademicSettings(),
        ]);

        if (!mounted) {
          return;
        }

        const profileData = profileResult.status === 'fulfilled'
          ? profileResult.value
          : defaultAdminProfile(userId);
        const generalData = generalResult.status === 'fulfilled'
          ? generalResult.value
          : defaultSystemInfo();
        const academicData = academicResult.status === 'fulfilled'
          ? academicResult.value
          : defaultAcademicInfo();

        const normalizedSystem = {
          collegeName: generalData.collegeName || generalData.portalName || '',
          collegeLogo: generalData.collegeLogo || '',
          collegeLogoFileName: generalData.collegeLogoFileName || generalData.logoFileName || '',
          address: generalData.address || '',
          contactEmail: generalData.contactEmail || '',
          phoneNumber: generalData.phoneNumber || '',
        };

        const normalizeAsText = (value) => {
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          return String(value || '');
        };

        const normalizedAcademic = {
          departments: normalizeAsText(academicData.departments),
          courses: normalizeAsText(academicData.courses),
          semesters: Number(academicData.semesters) || 1,
        };

        setProfile(profileData);
        setProfileBaseline(profileData);
        setSystemInfo(normalizedSystem);
        setSystemBaseline(normalizedSystem);
        setAcademicInfo(normalizedAcademic);
        setAcademicBaseline(normalizedAcademic);
        saveCurrentUserProfile(role, userId, profileData);

        const failedLoads = [profileResult, generalResult, academicResult].filter((result) => result.status === 'rejected');
        if (failedLoads.length > 0) {
          setToast({ type: 'error', message: 'Some admin settings could not be loaded from server. Showing fallback data.' });
        }
      } catch (error) {
        if (mounted) {
          setProfileError(error.message || 'Failed to load admin settings.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAll();

    return () => {
      mounted = false;
    };
  }, [role, userId]);

  const profileDirty = useMemo(
    () => JSON.stringify(profile || {}) !== JSON.stringify(profileBaseline || {}),
    [profile, profileBaseline]
  );
  const systemDirty = useMemo(
    () => JSON.stringify(systemInfo || {}) !== JSON.stringify(systemBaseline || {}),
    [systemInfo, systemBaseline]
  );
  const academicDirty = useMemo(
    () => JSON.stringify(academicInfo || {}) !== JSON.stringify(academicBaseline || {}),
    [academicInfo, academicBaseline]
  );

  if (loading) {
    return <div className="settings-skeleton">Loading admin module settings...</div>;
  }

  function updateProfileField(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateSystemField(key, value) {
    setSystemInfo((current) => ({ ...current, [key]: value }));
  }

  function updateAcademicField(key, value) {
    setAcademicInfo((current) => ({ ...current, [key]: value }));
  }

  function validateProfile() {
    const next = {};

    if (!String(profile.name || '').trim()) {
      next.name = 'Full Name is required.';
    }

    if (!String(profile.email || '').trim()) {
      next.email = 'Email is required.';
    } else if (!isEmail(String(profile.email || '').trim())) {
      next.email = 'Enter a valid email.';
    }

    if (!String(profile.phone || '').trim()) {
      next.phone = 'Phone Number is required.';
    } else if (!isPhone(String(profile.phone || '').trim())) {
      next.phone = 'Phone Number should be 10 digits.';
    }

    setProfileValidation(next);
    return Object.keys(next).length === 0;
  }

  function validatePassword() {
    const next = {};

    if (!passwordForm.currentPassword.trim()) {
      next.currentPassword = 'Current password is required.';
    }

    if (!passwordForm.newPassword.trim()) {
      next.newPassword = 'New password is required.';
    } else if (passwordForm.newPassword.length < 8) {
      next.newPassword = 'New password must be at least 8 characters.';
    }

    if (!passwordForm.confirmPassword.trim()) {
      next.confirmPassword = 'Confirm password is required.';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }

    setPasswordValidation(next);
    return Object.keys(next).length === 0;
  }

  function validateSystem() {
    if (!String(systemInfo.collegeName || '').trim()) {
      setToast({ type: 'error', message: 'College Name is required.' });
      return false;
    }

    if (!String(systemInfo.contactEmail || '').trim() || !isEmail(systemInfo.contactEmail.trim())) {
      setToast({ type: 'error', message: 'Enter a valid Contact Email.' });
      return false;
    }

    if (!String(systemInfo.phoneNumber || '').trim() || !isPhone(systemInfo.phoneNumber.trim())) {
      setToast({ type: 'error', message: 'Phone Number should be 10 digits.' });
      return false;
    }

    if (!String(systemInfo.address || '').trim()) {
      setToast({ type: 'error', message: 'Address is required.' });
      return false;
    }

    return true;
  }

  function validateAcademic() {
    if (!String(academicInfo.departments || '').trim()) {
      setToast({ type: 'error', message: 'Departments field is required.' });
      return false;
    }

    if (!String(academicInfo.courses || '').trim()) {
      setToast({ type: 'error', message: 'Courses / Programs field is required.' });
      return false;
    }

    if (!Number(academicInfo.semesters) || Number(academicInfo.semesters) < 1) {
      setToast({ type: 'error', message: 'Semesters should be at least 1.' });
      return false;
    }

    return true;
  }

  function handleProfilePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = String(reader.result || '');
      const nextProfile = {
        ...profile,
        profilePhoto: imageData,
        avatar: imageData,
      };
      setProfile(nextProfile);
      saveCurrentUserProfile(role, userId, nextProfile);
    };
    reader.readAsDataURL(file);
  }

  function handleProfilePhotoDelete() {
    const nextProfile = {
      ...profile,
      profilePhoto: '',
      avatar: '',
    };

    setProfile(nextProfile);
    saveCurrentUserProfile(role, userId, nextProfile);
  }

  async function saveAdminProfile() {
    if (!validateProfile()) {
      return;
    }

    setProfileSaving(true);
    setProfileError('');

    try {
      const response = await userSettingsApi.updateProfile(role, userId, profile);
      const updated = response.data;
      setProfile(updated);
      setProfileBaseline(updated);
      saveCurrentUserProfile(role, userId, updated);
      setToast({ type: 'success', message: 'Admin profile updated successfully.' });
    } catch (error) {
      setProfileError(error.message || 'Failed to update admin profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword() {
    if (!validatePassword()) {
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
      setToast({ type: 'success', message: response.message || 'Password updated successfully.' });
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function saveSystemInformation() {
    if (!validateSystem()) {
      return;
    }

    setSystemSaving(true);
    try {
      const payload = {
        collegeName: systemInfo.collegeName,
        portalName: systemInfo.collegeName,
        collegeLogo: systemInfo.collegeLogo,
        collegeLogoFileName: systemInfo.collegeLogoFileName,
        logoFileName: systemInfo.collegeLogoFileName || 'college-logo.png',
        address: systemInfo.address,
        contactEmail: systemInfo.contactEmail,
        phoneNumber: systemInfo.phoneNumber,
      };
      const updated = await settingsApi.updateAdminSystemSettings(payload);
      const next = {
        collegeName: updated.collegeName || updated.portalName || '',
        collegeLogo: updated.collegeLogo || '',
        collegeLogoFileName: updated.collegeLogoFileName || updated.logoFileName || '',
        address: updated.address || '',
        contactEmail: updated.contactEmail || '',
        phoneNumber: updated.phoneNumber || '',
      };

      setSystemInfo(next);
      setSystemBaseline(next);
      setToast({ type: 'success', message: 'System information updated successfully.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to update system information.' });
    } finally {
      setSystemSaving(false);
    }
  }

  function handleSystemLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const logoData = String(reader.result || '');
      setSystemInfo((current) => ({
        ...current,
        collegeLogo: logoData,
        collegeLogoFileName: file.name,
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleSystemLogoDelete() {
    setSystemInfo((current) => ({
      ...current,
      collegeLogo: '',
      collegeLogoFileName: '',
    }));
  }

  async function saveAcademicSettings() {
    if (!validateAcademic()) {
      return;
    }

    setAcademicSaving(true);
    try {
      const payload = {
        departments: academicInfo.departments,
        courses: academicInfo.courses,
        semesters: Number(academicInfo.semesters) || 1,
      };
      const updated = await settingsApi.updateAdminAcademicSettings(payload);
      const next = {
        departments: Array.isArray(updated.departments) ? updated.departments.join(', ') : String(updated.departments || ''),
        courses: Array.isArray(updated.courses) ? updated.courses.join(', ') : String(updated.courses || ''),
        semesters: Number(updated.semesters) || 1,
      };

      setAcademicInfo(next);
      setAcademicBaseline(next);
      setToast({ type: 'success', message: 'Academic settings updated successfully.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to update academic settings.' });
    } finally {
      setAcademicSaving(false);
    }
  }

  function resetAcademicSettings() {
    setAcademicInfo(academicBaseline);
    setToast({ type: 'success', message: 'Academic settings reset.' });
  }

  const profilePhoto = profile.profilePhoto || profile.avatar || '';

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <h3>Admin Profile</h3>
        <p>Manage the admin personal account details and password.</p>

        {profileError ? <div className="user-settings-error">{profileError}</div> : null}

        <div className="settings-form-grid">
          <label className="settings-form-span-2">
            Profile Photo
            <div className="user-settings-photo-row">
              <div className="user-settings-photo-preview">
                {profilePhoto ? <img src={profilePhoto} alt={profile.name || 'Admin'} /> : <span>{(profile.name || 'A').charAt(0).toUpperCase()}</span>}
              </div>
              <label className="user-settings-photo-upload">
                <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} />
                <span>Choose Photo</span>
              </label>
              {profilePhoto ? (
                <button type="button" className="user-settings-btn user-settings-btn-danger" onClick={handleProfilePhotoDelete}>
                  Delete Photo
                </button>
              ) : null}
            </div>
          </label>

          <label>
            Full Name
            <input type="text" value={profile.name || ''} onChange={(event) => updateProfileField('name', event.target.value)} />
            {profileValidation.name ? <small className="user-settings-field-error">{profileValidation.name}</small> : null}
          </label>

          <label>
            Admin ID
            <input type="text" value={userId} readOnly disabled />
          </label>

          <label>
            Email
            <input type="email" value={profile.email || ''} onChange={(event) => updateProfileField('email', event.target.value)} />
            {profileValidation.email ? <small className="user-settings-field-error">{profileValidation.email}</small> : null}
          </label>

          <label>
            Phone Number
            <input type="text" value={profile.phone || ''} onChange={(event) => updateProfileField('phone', event.target.value)} />
            {profileValidation.phone ? <small className="user-settings-field-error">{profileValidation.phone}</small> : null}
          </label>
        </div>

        <SettingsActionBar
          onSave={saveAdminProfile}
          onReset={() => setProfile(profileBaseline)}
          saving={profileSaving}
          disableSave={!profileDirty}
        />

        <div className="settings-form-grid" style={{ marginTop: 12 }}>
          <label>
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

          <label className="settings-form-span-2">
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

        {passwordError ? <div className="user-settings-error">{passwordError}</div> : null}

        <div className="settings-actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="settings-btn settings-btn-primary"
            onClick={changePassword}
            disabled={passwordSaving}
          >
            {passwordSaving ? 'Updating Password...' : 'Change Password'}
          </button>
        </div>
      </article>

      <article className="settings-card">
        <h3>System Information</h3>
        <p>Manage core college details used in reports, dashboards, and documents.</p>

        <div className="settings-form-grid">
          <label>
            College Name
            <input
              type="text"
              value={systemInfo.collegeName}
              onChange={(event) => updateSystemField('collegeName', event.target.value)}
            />
          </label>

          <label className="settings-form-span-2">
            College Logo
            <div className="user-settings-photo-row">
              <div className="user-settings-photo-preview">
                {systemInfo.collegeLogo ? <img src={systemInfo.collegeLogo} alt="College Logo" /> : <span>C</span>}
              </div>
              <label className="user-settings-photo-upload">
                <input type="file" accept="image/*" onChange={handleSystemLogoUpload} />
                <span>{systemInfo.collegeLogoFileName ? 'Change Logo' : 'Upload Logo'}</span>
              </label>
              {systemInfo.collegeLogo ? (
                <button type="button" className="user-settings-btn user-settings-btn-danger" onClick={handleSystemLogoDelete}>
                  Delete Logo
                </button>
              ) : null}
            </div>
            {systemInfo.collegeLogoFileName ? <small>Current: {systemInfo.collegeLogoFileName}</small> : null}
          </label>

          <label className="settings-form-span-2">
            Address
            <textarea rows="3" value={systemInfo.address} onChange={(event) => updateSystemField('address', event.target.value)} />
          </label>

          <label>
            Contact Email
            <input
              type="email"
              value={systemInfo.contactEmail}
              onChange={(event) => updateSystemField('contactEmail', event.target.value)}
            />
          </label>

          <label>
            Phone Number
            <input
              type="text"
              value={systemInfo.phoneNumber}
              onChange={(event) => updateSystemField('phoneNumber', event.target.value)}
            />
          </label>
        </div>

        <SettingsActionBar
          onSave={saveSystemInformation}
          onReset={() => setSystemInfo(systemBaseline)}
          saving={systemSaving}
          disableSave={!systemDirty}
        />
      </article>

      <article className="settings-card">
        <h3>Academic Settings</h3>
        <p>Define the academic structure for departments, courses/programs, and semesters.</p>

        <div className="settings-form-grid">
          <label className="settings-form-span-2">
            Departments
            <textarea
              rows="2"
              value={academicInfo.departments}
              onChange={(event) => updateAcademicField('departments', event.target.value)}
              placeholder="Example: Computer Science, Mechanical, Civil"
            />
          </label>

          <label className="settings-form-span-2">
            Courses / Programs
            <textarea
              rows="2"
              value={academicInfo.courses}
              onChange={(event) => updateAcademicField('courses', event.target.value)}
              placeholder="Example: B.Tech CSE, MBA, B.Sc Mathematics"
            />
          </label>

          <label>
            Semesters
            <input
              type="number"
              min="1"
              max="12"
              value={academicInfo.semesters}
              onChange={(event) => updateAcademicField('semesters', Number(event.target.value) || 1)}
            />
          </label>
        </div>

        <SettingsActionBar
          onSave={saveAcademicSettings}
          onReset={resetAcademicSettings}
          saving={academicSaving}
          disableSave={!academicDirty}
        />
      </article>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

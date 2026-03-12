import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsApi } from '../../api/settingsApi';
import FacultyCourseNotifications from './FacultyCourseNotifications';
import FacultyReminderSettings from './FacultyReminderSettings';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import '../../faculty-finance-settings.css';

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  phone: '',
  department: '',
  profilePhotoName: '',
};

const DEFAULT_SECURITY = {
  newPassword: '',
};

const DEFAULT_COURSE_NOTIFICATIONS = {
  assignmentSubmission: true,
  studentDoubtRequests: true,
};

const DEFAULT_REMINDER_SETTINGS = {
  assignmentReminder: true,
};

export default function FacultySettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [profileBaseline, setProfileBaseline] = useState(DEFAULT_PROFILE);
  const [security, setSecurity] = useState(DEFAULT_SECURITY);
  const [courseNotifications, setCourseNotifications] = useState(DEFAULT_COURSE_NOTIFICATIONS);
  const [courseNotificationsBaseline, setCourseNotificationsBaseline] = useState(DEFAULT_COURSE_NOTIFICATIONS);
  const [reminderSettings, setReminderSettings] = useState(DEFAULT_REMINDER_SETTINGS);
  const [reminderSettingsBaseline, setReminderSettingsBaseline] = useState(DEFAULT_REMINDER_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [savingSection, setSavingSection] = useState('');

  useEffect(() => {
    document.title = 'MIT Connect - Faculty Settings';

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [profileData, courseNotificationData, reminderData] = await Promise.all([
          settingsApi.getFacultyProfile(),
          settingsApi.getFacultyCourseNotifications(),
          settingsApi.getFacultyReminderSettings(),
        ]);

        const nextProfile = { ...DEFAULT_PROFILE, ...profileData };
        const nextCourseNotifications = { ...DEFAULT_COURSE_NOTIFICATIONS, ...courseNotificationData };
        const nextReminderSettings = { ...DEFAULT_REMINDER_SETTINGS, ...reminderData };

        setProfile(nextProfile);
        setProfileBaseline(nextProfile);
        setSecurity(DEFAULT_SECURITY);
        setCourseNotifications(nextCourseNotifications);
        setCourseNotificationsBaseline(nextCourseNotifications);
        setReminderSettings(nextReminderSettings);
        setReminderSettingsBaseline(nextReminderSettings);
      } catch (requestError) {
        setError(requestError?.message || 'Unable to load faculty settings.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function showToast(type, message) {
    setToast({ type, message });
  }

  async function saveProfile() {
    setSavingSection('profile');
    try {
      const updated = await settingsApi.updateFacultyProfile({
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        department: profile.department.trim(),
        profilePhotoName: profile.profilePhotoName,
      });
      const next = { ...DEFAULT_PROFILE, ...updated };
      setProfile(next);
      setProfileBaseline(next);
      showToast('success', 'Faculty profile saved successfully.');
    } catch (saveError) {
      showToast('error', saveError?.message || 'Failed to save faculty profile.');
    } finally {
      setSavingSection('');
    }
  }

  function cancelProfile() {
    setProfile(profileBaseline);
  }

  function resetSecurity() {
    setSecurity(DEFAULT_SECURITY);
  }

  async function updatePassword() {
    if (!security.newPassword || security.newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters.');
      return;
    }

    setSavingSection('security');
    try {
      await settingsApi.changePassword({
        role: 'faculty',
        newPassword: security.newPassword,
      });
      setSecurity(DEFAULT_SECURITY);
      showToast('success', 'Password updated successfully.');
    } catch (saveError) {
      showToast('error', saveError?.message || 'Failed to update password.');
    } finally {
      setSavingSection('');
    }
  }

  async function saveCourseNotifications() {
    setSavingSection('courseNotifications');
    try {
      const updated = await settingsApi.updateFacultyCourseNotifications(courseNotifications);
      const next = { ...DEFAULT_COURSE_NOTIFICATIONS, ...updated };
      setCourseNotifications(next);
      setCourseNotificationsBaseline(next);
      showToast('success', 'Course notification settings saved.');
    } catch (saveError) {
      showToast('error', saveError?.message || 'Failed to save course notifications.');
    } finally {
      setSavingSection('');
    }
  }

  function resetCourseNotifications() {
    setCourseNotifications(courseNotificationsBaseline);
  }

  async function saveReminderSettings() {
    setSavingSection('reminderSettings');
    try {
      const updated = await settingsApi.updateFacultyReminderSettings(reminderSettings);
      const next = { ...DEFAULT_REMINDER_SETTINGS, ...updated };
      setReminderSettings(next);
      setReminderSettingsBaseline(next);
      showToast('success', 'Assignment reminder settings saved.');
    } catch (saveError) {
      showToast('error', saveError?.message || 'Failed to save assignment reminder settings.');
    } finally {
      setSavingSection('');
    }
  }

  function resetReminderSettings() {
    setReminderSettings(reminderSettingsBaseline);
  }

  return (
    <div className="role-settings-page">
      <div className="role-settings-shell">
        <header className="role-settings-hero">
          <div>
            <p className="role-settings-kicker">Faculty Workspace</p>
            <h1>Faculty Settings</h1>
            <p>Manage profile, password, and faculty-specific teaching alerts in one place.</p>
          </div>
          <button
            type="button"
            className="role-settings-btn role-settings-btn-subtle"
            onClick={() => navigate('/dashboard?role=faculty')}
          >
            Back to Dashboard
          </button>
        </header>

        {error ? <div className="role-settings-alert role-settings-alert-error">{error}</div> : null}

        {loading ? (
          <div className="role-settings-loading">Loading faculty settings...</div>
        ) : (
          <div className="role-settings-card-list">
            <ProfileSettings
              description="Update basic profile details used across classes and communication."
              profile={profile}
              extraFieldKey="department"
              extraFieldLabel="Department"
              saveLabel="Save Profile"
              cancelLabel="Cancel"
              saving={savingSection === 'profile'}
              onProfileChange={(field, value) => setProfile((current) => ({ ...current, [field]: value }))}
              onPhotoChange={(file) => setProfile((current) => ({ ...current, profilePhotoName: file ? file.name : '' }))}
              onSave={saveProfile}
              onCancel={cancelProfile}
            />

            <SecuritySettings
              description="Update your account password."
              values={security}
              updateLabel="Update Password"
              resetLabel="Reset"
              saving={savingSection === 'security'}
              onValueChange={(key, value) => setSecurity((current) => ({ ...current, [key]: value }))}
              onUpdatePassword={updatePassword}
              onReset={resetSecurity}
            />

            <FacultyCourseNotifications
              description="Choose which academic alerts you want while handling course activities."
              values={courseNotifications}
              saveLabel="Save Settings"
              resetLabel="Reset"
              saving={savingSection === 'courseNotifications'}
              onToggle={(key, value) => setCourseNotifications((current) => ({ ...current, [key]: value }))}
              onSave={saveCourseNotifications}
              onReset={resetCourseNotifications}
            />

            <FacultyReminderSettings
              description="Control reminder alerts for assignment deadlines."
              values={reminderSettings}
              saveLabel="Save Settings"
              resetLabel="Reset"
              saving={savingSection === 'reminderSettings'}
              onToggle={(key, value) => setReminderSettings((current) => ({ ...current, [key]: value }))}
              onSave={saveReminderSettings}
              onReset={resetReminderSettings}
            />
          </div>
        )}
      </div>

      {toast ? (
        <div className={`role-settings-toast role-settings-toast-${toast.type}`}>{toast.message}</div>
      ) : null}
    </div>
  );
}

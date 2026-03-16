import { SettingsProvider } from '../../context/SettingsContext';
import AccessibilitySettings from './AccessibilitySettings';
import AccountManagement from './AccountManagement';
import AccountSettings from './AccountSettings';
import AppearanceSettings from './AppearanceSettings';
import LanguageSettings from './LanguageSettings';
import NotificationSettings from './NotificationSettings';
import PrivacySettings from './PrivacySettings';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import TeachingPreferences from './TeachingPreferences';

function SettingsContent({ role, userId }) {
  function renderSection() {
    switch (role) {
      case 'faculty':
        return <ProfileSettings role={role} userId={userId} />;
      case 'student':
        return <ProfileSettings role={role} userId={userId} />;
      default:
        return <ProfileSettings role={role} userId={userId} />;
    }
  }

  return (
    <div className="user-settings-content-wrapper">
      {renderSection()}
    </div>
  );
}

export default function UserSettingsPage({ role, userId }) {
  return (
    <SettingsProvider>
      <SettingsContent role={role} userId={userId} />
    </SettingsProvider>
  );
}

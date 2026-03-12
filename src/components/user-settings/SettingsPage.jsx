import { SettingsProvider } from '../../context/SettingsContext';
import ProfileSettings from './ProfileSettings';

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

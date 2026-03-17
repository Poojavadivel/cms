import { SettingsProvider } from '../../context/SettingsContext';
import { cmsRoles } from '../../data/roleConfig';
import AdminModuleSettings from './AdminModuleSettings';
import FinanceModuleSettings from './FinanceModuleSettings';
import ProfileSettings from '../user-settings/ProfileSettings';

export default function SettingsLayout({ role, userId }) {
  const roleLabel = cmsRoles[role]?.label || role;

  return (
    <div className="settings-content-wrapper">
      <div className="settings-content-head">
        <div>
          <p className="settings-breadcrumb">
            {roleLabel} Access / Settings / Overview
          </p>
          <h1>System Settings</h1>
        </div>
        <div className="settings-role-pill">{role.toUpperCase()} MODE</div>
      </div>

      <SettingsProvider>
        <div className="settings-card-grid">
          {role === 'admin' ? <AdminModuleSettings role={role} userId={userId} /> : null}

          {role === 'finance' ? (
            <>
              <ProfileSettings role={role} userId={userId} />
              <FinanceModuleSettings userId={userId} />
            </>
          ) : null}
        </div>
      </SettingsProvider>
    </div>
  );
}

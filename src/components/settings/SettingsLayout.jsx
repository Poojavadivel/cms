import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleGuard from '../RoleGuard';
import { cmsRoles } from '../../data/roleConfig';
import { findSettingsSelection, getDefaultSettingsItemId, getSettingsSectionsByRole } from '../../data/settingsConfig';
import AcademicSettings from './AcademicSettings';
import DataManagement from './DataManagement';
import DepartmentSettings from './DepartmentSettings';
import FinanceSettings from './FinanceSettings';
import GeneralSettings from './GeneralSettings';
import IntegrationSettings from './IntegrationSettings';
import MonitoringDashboard from './MonitoringDashboard';
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';
import SettingsHeader from './SettingsHeader';
import SettingsSidebar from './SettingsSidebar';
import UserManagement from './UserManagement';

function matchesSearch(section, query) {
  if (!query) {
    return true;
  }

  const text = `${section.label} ${section.children.map((child) => child.label).join(' ')}`.toLowerCase();
  return text.includes(query.toLowerCase());
}

export default function SettingsLayout({ role, userId }) {
  const navigate = useNavigate();
  const roleLabel = cmsRoles[role]?.label || role;
  const sections = useMemo(() => getSettingsSectionsByRole(role), [role]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemId, setActiveItemId] = useState(() => getDefaultSettingsItemId(sections));

  useEffect(() => {
    const currentSelection = findSettingsSelection(sections, activeItemId);
    if (!currentSelection) {
      setActiveItemId(getDefaultSettingsItemId(sections));
    }
  }, [activeItemId, sections]);

  const visibleSections = useMemo(
    () => sections.filter((section) => matchesSearch(section, searchTerm)),
    [searchTerm, sections]
  );

  const selection = findSettingsSelection(sections, activeItemId) || {
    section: sections[0],
    child: sections[0]?.children[0],
  };

  function renderSection() {
    switch (selection?.section?.id) {
      case 'general':
        return (
          <RoleGuard roles={['admin']}>
            <GeneralSettings />
          </RoleGuard>
        );
      case 'users':
        return (
          <RoleGuard roles={['admin']}>
            <UserManagement />
          </RoleGuard>
        );
      case 'departments':
        return (
          <RoleGuard roles={['admin']}>
            <DepartmentSettings />
          </RoleGuard>
        );
      case 'academic':
        return (
          <RoleGuard roles={['admin']}>
            <AcademicSettings />
          </RoleGuard>
        );
      case 'finance':
        return (
          <RoleGuard roles={['admin', 'finance']}>
            <FinanceSettings activeItemId={selection?.child?.id} />
          </RoleGuard>
        );
      case 'notifications':
        return (
          <RoleGuard roles={['admin']}>
            <NotificationSettings />
          </RoleGuard>
        );
      case 'security':
        return (
          <RoleGuard roles={['admin']}>
            <SecuritySettings />
          </RoleGuard>
        );
      case 'integrations':
        return (
          <RoleGuard roles={['admin']}>
            <IntegrationSettings />
          </RoleGuard>
        );
      case 'data-management':
        return (
          <RoleGuard roles={['admin']}>
            <DataManagement />
          </RoleGuard>
        );
      case 'monitoring':
        return (
          <RoleGuard roles={['admin']}>
            <MonitoringDashboard />
          </RoleGuard>
        );
      default:
        return <div className="settings-empty-panel">No settings section selected.</div>;
    }
  }

  return (
    <div className="settings-page">
      <SettingsHeader
        role={role}
        userId={userId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBackToDashboard={() => navigate(`/dashboard?role=${encodeURIComponent(role)}`)}
      />

      <div className="settings-shell">
        <SettingsSidebar
          sections={visibleSections}
          activeItemId={activeItemId}
          onSelectItem={setActiveItemId}
          role={role}
          onBackToDashboard={() => navigate(`/dashboard?role=${encodeURIComponent(role)}`)}
        />

        <main className="settings-content">
          <div className="settings-content-head">
            <div>
              <p className="settings-breadcrumb">
                {roleLabel} Access / {selection?.section?.label || 'Settings'} / {selection?.child?.label || 'Overview'}
              </p>
              <h1>System Settings</h1>
            </div>
            <div className="settings-role-pill">{role.toUpperCase()} MODE</div>
          </div>

          {renderSection()}
        </main>
      </div>
    </div>
  );
}

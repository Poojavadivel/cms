import { useState } from 'react';

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.26L19.02 9 12 12.74 4.98 9 12 5.26zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 21.5 21.5 20l-6-6zM10 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
    </svg>
  );
}

export default function SettingsHeader({ role, userId, searchTerm, onSearchChange, onBackToDashboard }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="settings-header">
      <div className="settings-brand">
        <div className="settings-brand-mark">
          <GraduationIcon />
        </div>
        <div>
          <div className="settings-brand-title">MIT Connect</div>
          <div className="settings-brand-subtitle">System Settings</div>
        </div>
      </div>

      <div className="settings-search-wrap">
        <SearchIcon />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search settings, policies, templates..."
          aria-label="Search settings"
        />
      </div>

      <div className="settings-header-actions">
        <button type="button" className="settings-icon-btn" aria-label="Notifications">
          <BellIcon />
          <span className="settings-dot" />
        </button>

        <div className="settings-profile-menu">
          <button
            type="button"
            className="settings-profile-btn"
            onClick={() => setProfileOpen((current) => !current)}
            aria-expanded={profileOpen}
          >
            <span>{role.toUpperCase()}</span>
            <strong>{userId}</strong>
          </button>

          {profileOpen ? (
            <div className="settings-profile-dropdown">
              <button type="button" onClick={onBackToDashboard}>
                Back to Dashboard
              </button>
              <button type="button" onClick={() => setProfileOpen(false)}>
                Close Menu
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

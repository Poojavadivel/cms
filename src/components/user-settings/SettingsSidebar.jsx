import { useSettingsContext } from '../../context/SettingsContext';

export default function SettingsSidebar({ role, menuItems, activeItemId, onSelectItem }) {
  const { dirtySections } = useSettingsContext();

  return (
    <aside className="user-settings-sidebar">
      <div className="user-settings-sidebar-header">
        <h2>Settings</h2>
        <p>{role.toUpperCase()} access</p>
      </div>

      <nav className="user-settings-sidebar-nav" aria-label="Settings sections">
        {menuItems.map((item) => {
          const isDirty = Boolean(dirtySections[item.id]);
          const isActive = activeItemId === item.id;
          const isDashboard = item.id === 'dashboard';

          return (
            <button
              key={item.id}
              type="button"
              className={`user-settings-nav-item${isActive ? ' active' : ''}${
                isDashboard ? ' user-settings-nav-item-dashboard' : ''
              }`}
              onClick={() => onSelectItem(item.id)}
            >
              <span>{item.label}</span>
              {isDirty ? <span className="user-settings-dirty-dot" aria-label="Unsaved changes" /> : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

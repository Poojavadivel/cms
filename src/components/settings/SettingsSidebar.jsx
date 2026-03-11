import { useEffect, useState } from 'react';

function ChevronIcon({ expanded }) {
  return <span className={`settings-chevron${expanded ? ' expanded' : ''}`}>{'>'}</span>;
}

export default function SettingsSidebar({ sections, activeItemId, onSelectItem, role, onBackToDashboard }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState(() =>
    Object.fromEntries(sections.map((section) => [section.id, true]))
  );

  useEffect(() => {
    setExpandedSections((current) => {
      const nextState = { ...current };
      sections.forEach((section) => {
        if (typeof nextState[section.id] === 'undefined') {
          nextState[section.id] = true;
        }
      });
      return nextState;
    });
  }, [sections]);

  function toggleSection(sectionId) {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  return (
    <aside className={`settings-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="settings-sidebar-top">
        <button type="button" className="settings-collapse-btn" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      <div className="settings-sidebar-scroll">
        {sections.map((section) => {
          const expanded = expandedSections[section.id];

          return (
            <section key={section.id} className="settings-nav-section">
              <button
                type="button"
                className="settings-nav-heading"
                onClick={() => {
                  if (collapsed) {
                    onSelectItem(section.children[0]?.id || '');
                    return;
                  }

                  toggleSection(section.id);
                }}
                title={section.label}
              >
                <span className="settings-nav-mark">{section.label.slice(0, 1)}</span>
                {!collapsed ? <span className="settings-nav-heading-text">{section.label}</span> : null}
                {!collapsed ? <ChevronIcon expanded={expanded} /> : null}
              </button>

              {expanded && !collapsed ? (
                <ul className="settings-nav-list">
                  {section.children.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`settings-nav-item${item.id === activeItemId ? ' active' : ''}`}
                        onClick={() => onSelectItem(item.id)}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}

        {!sections.length && !collapsed ? <p className="settings-empty-nav">No matching settings found.</p> : null}
      </div>

      <div className="settings-sidebar-footer">
        {!collapsed ? <span>Role Access: {role.toUpperCase()}</span> : null}
        <button type="button" onClick={onBackToDashboard}>
          {collapsed ? 'Back' : 'Back to Dashboard'}
        </button>
      </div>
    </aside>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { destroyUserSession } from '../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../data/roleConfig';

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.26L19.02 9 12 12.74 4.98 9 12 5.26zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  );
}

const itemRoutes = {
  Dashboard: '/dashboard',
  Students: '/students',
  Exams: '/exams',
  Timetable: '/timetable',
  Attendance: '/attendance',
  Placement: '/placement',
  Facility: '/facility',
  Settings: '/settings',
};

export default function RolePortalLayout({ role, title, subtitle, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);
  const data = cmsRoles[role] || cmsRoles.student;
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student;

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [location.pathname, location.search]);

  function handleNavigate(item) {
    const route = itemRoutes[item];
    setSidebarOpen(false);

    if (!route) {
      return;
    }

    navigate(`${route}?role=${encodeURIComponent(role)}`);
  }

  function handleLogout(event) {
    event.preventDefault();
    destroyUserSession();
    navigate('/', { replace: true });
  }

  return (
    <>
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="dashboard-wrapper role-layout">
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">
              <GraduationIcon />
            </div>
            <div className="logo-text-wrap">
              <div className="logo-title">MIT Connect</div>
              <div className="logo-sub">MIT Connect - {data.label} Portal</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <div className="nav-section-label">{group.title}</div>
                <ul>
                  {group.items.map((item) => {
                    const route = itemRoutes[item];
                    const active = route
                      ? location.pathname === route || location.pathname.startsWith(route + '/')
                      : false;

                    return (
                      <li key={item}>
                        <a
                          href="#"
                          className={active ? 'active' : ''}
                          onClick={(event) => {
                            event.preventDefault();
                            handleNavigate(item);
                          }}
                        >
                          {item}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <a href="#" onClick={handleLogout}>
              <LogoutIcon />
              Logout
            </a>
          </div>
        </aside>

        <main className="main-content role-portal-main">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle menu">
                <MenuIcon />
              </button>
              <div className="topbar-left">
                <h2>{title}</h2>
                <p>{subtitle}</p>
              </div>
            </div>
            <div className="topbar-right">
              <span className="badge badge-info">{data.label}</span>
            </div>
          </div>

          <div ref={contentRef} className="role-portal-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
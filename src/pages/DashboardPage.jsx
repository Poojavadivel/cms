import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { destroyUserSession, getUserSession } from '../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../data/roleConfig';
import NotificationBell from '../components/NotificationBell';
import NotificationDropdown from '../components/NotificationDropdown';
import TimetablePage from './TimetablePage';
import AttendancePage from './AttendancePage';
import ExamsPage from './ExamsPage';
import PlacementPage from './PlacementPage';
import FacilityPage from './FacilityPage';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const pageMap = {
    '/timetable': TimetablePage,
    '/attendance': AttendancePage,
    '/exams': ExamsPage,
    '/placement': PlacementPage,
    '/facility': FacilityPage,
  };
  const pageTitles = {
    '/timetable': 'Timetable',
    '/attendance': 'Attendance',
    '/exams': 'Exams',
    '/placement': 'Placement',
    '/facility': 'Facility',
  };
  const pageSubtitles = {
    '/timetable': 'View and manage weekly class schedules across subjects and sections.',
    '/attendance': 'Track and record student attendance for all mapped subjects.',
    '/exams': 'Manage exam schedules, seat plans, and result submissions.',
    '/placement': 'Monitor campus recruitment drives and student placement status.',
    '/facility': 'Oversee campus infrastructure, labs, and facility bookings.',
  };
  const ActivePage = activePage ? pageMap[activePage] : null;

  const session = getUserSession();
  const sessionRole = session?.role || null;
  const sessionUserId = session?.userId || null;
  const role = sessionRole || 'student';
  const data = cmsRoles[role];
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student;
  const userId = sessionUserId || 'N/A';

  const academicRoutes = {
    Exams: '/exams',
    Timetable: '/timetable',
    Attendance: '/attendance',
    Placement: '/placement',
    Facility: '/facility',
  };

  useEffect(() => {
    if (!sessionRole || !sessionUserId) {
      navigate('/', { replace: true });
      return undefined;
    }

    document.title = `MIT Connect - ${data.label} Dashboard`;

    const expectedSearch = `?role=${encodeURIComponent(sessionRole)}`;
    if (location.search !== expectedSearch) {
      navigate(`/dashboard${expectedSearch}`, { replace: true });
    }

    function enforceSessionOnPageRestore() {
      if (!getUserSession()) {
        navigate('/', { replace: true });
      }
    }

    window.addEventListener('pageshow', enforceSessionOnPageRestore);
    return () => window.removeEventListener('pageshow', enforceSessionOnPageRestore);
  }, [data.label, location.search, navigate, sessionRole, sessionUserId]);

  function handleLogout() {
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
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} id="sidebar">
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
            {menuGroups.map((group, groupIndex) => (
              <div key={group.title}>
                <div className="nav-section-label">{group.title}</div>
                <ul>
                  {group.items.map((item, itemIndex) => (
                    <li key={item}>
                      <a
                        href="#"
                        className={
                          (activePage === null && groupIndex === 0 && itemIndex === 0) ||
                          (activePage !== null && academicRoutes[item] === activePage)
                            ? 'active' : ''
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          if (item.toLowerCase() === 'settings') {
                            setSidebarOpen(false);
                            navigate(`/settings?role=${encodeURIComponent(role)}`);
                          } else if (item.toLowerCase() === 'notifications') {
                            setSidebarOpen(false);
                            navigate(`/notifications?role=${encodeURIComponent(role)}`);
                          } else if (item.toLowerCase() === 'students') {
                            setSidebarOpen(false);
                            navigate(`/students?role=${encodeURIComponent(role)}`);
                          } else if (academicRoutes[item]) {
                            setActivePage(academicRoutes[item]);
                            setSidebarOpen(false);
                          } else {
                            setActivePage(null);
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handleLogout();
              }}
            >
              <LogoutIcon />
              Logout
            </a>
          </div>
        </aside>

        <main className="main-content">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle menu">
                <MenuIcon />
              </button>
              <div className="topbar-left">
                <h2>{activePage ? pageTitles[activePage] : `${data.label} Dashboard`}</h2>
                <p>{activePage ? pageSubtitles[activePage] : data.subtitle}</p>
              </div>
            </div>
            <div className="topbar-right">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                <NotificationBell
                  role={role}
                  onBellClick={() => setIsNotificationOpen(!isNotificationOpen)}
                />
                <NotificationDropdown
                  role={role}
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>
              <span className="badge badge-info">{data.label}</span>
            </div>
          </div>

          {ActivePage && <ActivePage noLayout />}
          {!ActivePage && (<>
          <div className="profile-header">
            <div className="profile-left">
              <div className="profile-avatar-wrap">
                <div className="avatar-initials">{data.label.slice(0, 2).toUpperCase()}</div>
                <span className="avatar-status" />
              </div>
              <div className="profile-info">
                <div className="student-name">{data.name}</div>
                <div className="profile-meta">
                  <span className="meta-item">ID: {userId}</span>
                  <span className="meta-item">Team: {data.team}</span>
                  <span className="meta-item">Focus: {data.focus}</span>
                </div>
              </div>
            </div>
            <div className="profile-right">
              <button type="button" className="btn-primary-sm">
                {data.primaryAction}
              </button>
              <button type="button" className="btn-secondary-sm">
                {data.secondaryAction}
              </button>
            </div>
          </div>

          <div className="section-header">
            <span className="section-title">Quick Overview</span>
          </div>

          <div className="stats-grid">
            {data.stats.map((entry, index) => {
              const tone = ['blue', 'green', 'purple', 'orange'][index % 4];
              return (
                <div key={entry.label} className={`stat-card stat-card-${tone}`}>
                  <div className="stat-body">
                    <div className="stat-value">{entry.value}</div>
                    <div className="stat-label">{entry.label}</div>
                    <div className="stat-sub">{entry.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="content-card">
            <div className="section-header" style={{ marginBottom: 14 }}>
              <span className="section-title">Section Access</span>
            </div>
            <div className="role-access-grid">
              {menuGroups.map((group) => (
                <div key={group.title} className="role-access-card">
                  <h4>{group.title}</h4>
                  <div className="role-chip-wrap">
                    {group.items.map((item) => (
                      <span key={item} className="badge badge-gray">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bottom-grid">
            <div className="content-card">
              <div className="section-header" style={{ marginBottom: 14 }}>
                <span className="section-title">Today Tasks</span>
              </div>
              <div className="notice-list">
                {data.tasks.map((task) => (
                  <div key={task.title} className="notice-item">
                    <div className="notice-dot dot-blue" />
                    <div className="notice-text">
                      <div className="notice-title">{task.title}</div>
                      <div className="notice-desc">{task.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="content-card">
              <div className="section-header" style={{ marginBottom: 14 }}>
                <span className="section-title">Alerts</span>
              </div>
              <div className="notice-list">
                {data.alerts.map((alert, index) => (
                  <div key={alert.title} className="notice-item">
                    <div className={`notice-dot ${index % 2 === 0 ? 'dot-orange' : 'dot-red'}`} />
                    <div className="notice-text">
                      <div className="notice-title">{alert.title}</div>
                      <div className="notice-desc">{alert.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>)}
        </main>
      </div>
    </>
  );
}

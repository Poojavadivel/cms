import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../../provider';
import './DoctorRoot.css';
import {
  MdDashboard,
  MdCalendarToday,
  MdPeople,
  MdAssignment,
  MdSettings,
  MdMenu,
  MdMenuOpen,
  MdLogout,
  MdPerson,
} from 'react-icons/md';

const DoctorRoot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navItems = useMemo(() => [
    { icon: <MdDashboard />, label: 'Dashboard', path: '/doctor/dashboard' },
    { icon: <MdCalendarToday />, label: 'Appointments', path: '/doctor/appointments' },
    { icon: <MdPeople />, label: 'Patients', path: '/doctor/patients' },
    { icon: <MdAssignment />, label: 'My Schedule', path: '/doctor/schedule' },
    { icon: <MdSettings />, label: 'Settings', path: '/doctor/settings' },
  ], []);

  useEffect(() => {
    const currentPath = location.pathname;
    const index = navItems.findIndex(item => item.path === currentPath);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [location.pathname, navItems]);

  const handleNavigation = (index, path) => {
    setSelectedIndex(index);
    navigate(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="doctor-root">
      <div className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="sidebar-header">
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <MdMenuOpen size={24} /> : <MdMenu size={24} />}
          </button>
          {!isCollapsed && (
            <span className="sidebar-title">Karur Gastro Foundation</span>
          )}
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`nav-item ${selectedIndex === index ? 'active' : ''}`}
              onClick={() => handleNavigation(index, item.path)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          {isCollapsed ? (
            <div className="profile-collapsed">
              <div className="profile-avatar" title="User Profile">
                <MdPerson size={20} />
              </div>
              <button
                className="logout-btn-collapsed"
                onClick={handleLogout}
                title="Logout"
              >
                <MdLogout size={20} />
              </button>
            </div>
          ) : (
            <div className="profile-expanded">
              <div className="profile-avatar">
                <MdPerson size={20} />
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.fullName || 'Doctor'}</div>
                <div className="profile-email">{user?.email || 'doctor@hms.com'}</div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <MdLogout size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>

      <div className="chatbot-launcher" title="Ask Movi">
        <img src="/assets/chatbotimg.png" alt="Chatbot" />
        <span className="chatbot-label">Ask Movi</span>
      </div>
    </div>
  );
};

export default DoctorRoot;

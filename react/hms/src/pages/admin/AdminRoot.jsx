import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../../provider';
import './AdminRoot.css';
import {
  MdDashboard,
  MdCalendarToday,
  MdPeople,
  MdGroup,
  MdReceipt,
  MdBiotech,
  MdLocalPharmacy,
  MdSettings,
  MdMenu,
  MdMenuOpen,
  MdLogout,
  MdAdminPanelSettings,
} from 'react-icons/md';

const AdminRoot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navItems = useMemo(() => [
    { icon: <MdDashboard />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <MdCalendarToday />, label: 'Appointments', path: '/admin/appointments' },
    { icon: <MdPeople />, label: 'Patients', path: '/admin/patients' },
    { icon: <MdGroup />, label: 'Staff', path: '/admin/staff' },
    { icon: <MdReceipt />, label: 'Invoice', path: '/admin/invoice' },
    { icon: <MdBiotech />, label: 'Pathology', path: '/admin/pathology' },
    { icon: <MdLocalPharmacy />, label: 'Pharmacy', path: '/admin/pharmacy' },
    { icon: <MdSettings />, label: 'Settings', path: '/admin/settings' },
  ], []);

  // Update selected index based on current route
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
    <div className="admin-root">
      <div className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        {/* Header with toggle */}
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

        {/* Navigation items */}
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

        {/* User profile */}
        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          {isCollapsed ? (
            <div className="profile-collapsed">
              <div className="profile-avatar" title="User Profile">
                <MdAdminPanelSettings size={24} />
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
                <MdAdminPanelSettings size={24} />
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.fullName || 'Admin'}</div>
                <div className="profile-email">{user?.email || 'admin@hms.com'}</div>
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

      {/* Main content */}
      <div className="main-content">
        <Outlet />
      </div>

      {/* Chatbot launcher - placeholder */}
      <div className="chatbot-launcher" title="Ask Movi">
        <img src="/assets/chatbotimg.png" alt="Chatbot" />
        <span className="chatbot-label">Ask Movi</span>
      </div>
    </div>
  );
};

export default AdminRoot;

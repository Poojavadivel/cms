import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../../provider';
import LogoutConfirmModal from '../../components/common/LogoutConfirmModal';
import './PathologistRoot.css';
import {
  MdDashboard,
  MdBiotech,
  MdPeople,
  MdSettings,
  MdMenu,
  MdMenuOpen,
  MdLogout,
  MdPerson,
} from 'react-icons/md';
import MoviLogo from '../../components/common/Logo';

const PathologistRoot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = useMemo(() => [
    { icon: <MdDashboard />, label: 'Dashboard', path: '/pathologist/dashboard' },
    { icon: <MdBiotech />, label: 'Test Reports', path: '/pathologist/test-reports' },
    { icon: <MdPeople />, label: 'Patients', path: '/pathologist/patients' },
    { icon: <MdSettings />, label: 'Settings', path: '/pathologist/settings' },
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
    setShowLogoutModal(false);
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="pathologist-root">
      <div className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo-section">
              <MoviLogo size={32} />
              <span className="sidebar-title">MOVI HOSPITAL</span>
            </div>
          )}
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <MdMenuOpen size={24} /> : <MdMenu size={24} />}
          </button>
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
                onClick={() => setShowLogoutModal(true)}
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
                <div className="profile-name">{user?.fullName || 'Pathologist'}</div>
                <div className="profile-email">{user?.email || 'pathologist@hms.com'}</div>
              </div>
              <button
                className="logout-btn"
                onClick={() => setShowLogoutModal(true)}
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

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        userName={user?.fullName || user?.firstName}
      />
    </div>
  );
};

export default PathologistRoot;

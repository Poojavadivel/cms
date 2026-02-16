/**
 * DoctorSettings.jsx
 * Doctor settings page matching Flutter's DoctorSettingsScreen
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdBadge,
  MdNotifications,
  MdToggleOn,
  MdToggleOff,
  MdLogout,
  MdLock,
  MdSave,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import { useApp } from '../../../provider';
import authService from '../../../services/authService';
import './Settings.css';

const DoctorSettings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useApp();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('Available');

  // Password change state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const toggleVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(passwords.currentPassword, passwords.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change error details:', error);
      const errorMsg = error.message || 'Failed to change password';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      await signOut();
      navigate('/login');
    }
  };

  return (
    <div className="doctor-settings">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <h1>Settings</h1>
          <button className="logout-btn" onClick={handleLogout}>
            <MdLogout />
            <span>Logout</span>
          </button>
        </div>

        {/* Profile Section */}
        <div className="settings-section">
          <div className="section-title">
            <MdPerson />
            <h2>Profile Information</h2>
          </div>
          <div className="profile-content">
            <div className="profile-avatar-large">
              <MdPerson />
            </div>
            <div className="profile-info-grid">
              <InfoItem
                icon={<MdPerson />}
                label="Full Name"
                value={user?.fullName || 'Doctor Name'}
              />
              <InfoItem
                icon={<MdEmail />}
                label="Email"
                value={user?.email || 'doctor@hms.com'}
              />
              <InfoItem
                icon={<MdPhone />}
                label="Phone"
                value={user?.phone || user?.contactNumber || 'N/A'}
              />
              <InfoItem
                icon={<MdBadge />}
                label="Role"
                value={user?.role || 'Doctor'}
              />
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="settings-columns">
          {/* Availability Section */}
          <div className="settings-section">
            <div className="section-title">
              <MdToggleOn />
              <h2>Availability Status</h2>
            </div>
            <div className="status-options">
              {['Available', 'Busy', 'On Leave', 'Off Duty'].map(status => (
                <button
                  key={status}
                  className={`status-btn ${currentStatus === status ? 'active' : ''}`}
                  onClick={() => setCurrentStatus(status)}
                >
                  <span className={`status-dot ${status.toLowerCase().replace(' ', '-')}`}></span>
                  {status}
                </button>
              ))}
            </div>
            <div className="status-description">
              Current status: <strong>{currentStatus}</strong>
            </div>
          </div>

          {/* Security Section (Password Change) */}
          <div className="settings-section security-section">
            <div className="section-title">
              <MdLock />
              <h2>Security</h2>
            </div>
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="input-group password-group">
                <label>Current Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Enter current password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => toggleVisibility('current')}
                  >
                    {showPasswords.current ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
              <div className="input-group password-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    placeholder="Enter new password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => toggleVisibility('new')}
                  >
                    {showPasswords.new ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
              <div className="input-group password-group">
                <label>Confirm New Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => toggleVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              {message.text && (
                <div className={`form-message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <button type="submit" className="save-password-btn" disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating...' : (
                  <>
                    <MdSave />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Notifications Section */}
          <div className="settings-section">
            <div className="section-title">
              <MdNotifications />
              <h2>Notification Preferences</h2>
            </div>
            <div className="notification-options">
              <div className="notification-item">
                <div className="notification-info">
                  <h4>Email Notifications</h4>
                  <p>Receive appointment updates via email</p>
                </div>
                <button
                  className={`toggle-btn ${emailNotifications ? 'active' : ''}`}
                  onClick={() => setEmailNotifications(!emailNotifications)}
                >
                  {emailNotifications ? <MdToggleOn /> : <MdToggleOff />}
                </button>
              </div>
              <div className="notification-item">
                <div className="notification-info">
                  <h4>Push Notifications</h4>
                  <p>Receive real-time alerts in the app</p>
                </div>
                <button
                  className={`toggle-btn ${pushNotifications ? 'active' : ''}`}
                  onClick={() => setPushNotifications(!pushNotifications)}
                >
                  {pushNotifications ? <MdToggleOn /> : <MdToggleOff />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component
const InfoItem = ({ icon, label, value }) => (
  <div className="info-item">
    <div className="info-icon">{icon}</div>
    <div className="info-content">
      <div className="info-label">{label}</div>
      <div className="info-value">{value}</div>
    </div>
  </div>
);

export default DoctorSettings;

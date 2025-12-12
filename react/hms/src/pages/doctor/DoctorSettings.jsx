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
} from 'react-icons/md';
import { useApp } from '../../provider';
import './DoctorSettings.css';

const DoctorSettings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useApp();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('Available');

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

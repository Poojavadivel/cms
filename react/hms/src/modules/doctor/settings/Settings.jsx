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
  MdEdit,
  MdClose,
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

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || 'Doctor Name',
    email: user?.email || 'doctor@hms.com',
    phone: user?.phone || user?.contactNumber || 'N/A',
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Phone validation
    // Basic check: must not be empty or "N/A" if it's required (as per Bug 22)
    const phoneVal = profileForm.phone?.trim();
    if (!phoneVal || phoneVal === 'N/A') {
      alert('Phone number is required. Please add your phone number.');
      return;
    }

    // Optional: a simple regex just to ensure it looks like a phone number (digits, spaces, +, -, etc.)
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(phoneVal)) {
      alert('Please enter a valid phone number.');
      return;
    }

    try {
      // Mock API Payload Construction (excluding read-only fields like Role)
      const payload = {
        fullName: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone
      };

      console.log('Mock API PUT Request: Saving profile updates', payload);
      // await api.put('/users/profile', payload);

      alert('Profile updated successfully! (Mock)');
      setIsEditingProfile(false);
      // Context/User update logic would go here
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile.');
    }
  };

  const handleCancelEdit = () => {
    // Revert form state
    setProfileForm({
      fullName: user?.fullName || 'Doctor Name',
      email: user?.email || 'doctor@hms.com',
      phone: user?.phone || user?.contactNumber || 'N/A',
    });
    setIsEditingProfile(false);
  };

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
          <div className="section-title flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <MdPerson />
              <h2>Profile Information</h2>
            </div>
            {!isEditingProfile ? (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors"
                onClick={() => setIsEditingProfile(true)}
              >
                <MdEdit size={16} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors"
                  onClick={handleCancelEdit}
                >
                  <MdClose size={16} /> Cancel
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  onClick={handleSaveProfile}
                >
                  <MdSave size={16} /> Save
                </button>
              </div>
            )}
          </div>
          <div className="profile-content flex flex-col w-full">
            <div className="flex items-center gap-6 mb-6">
              <div className="profile-avatar-large shrink-0">
                <MdPerson />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{user?.fullName || 'Doctor Name'}</h3>
                <p className="text-sm font-medium text-slate-500">{user?.role || 'Doctor'}</p>
              </div>
            </div>

            <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden px-4">
              <SettingRow label="Full Name" icon={<MdPerson />}>
                {isEditingProfile ? (
                  <input
                    type="text"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                ) : (
                  <div className="text-sm font-medium text-slate-900">{profileForm.fullName}</div>
                )}
              </SettingRow>
              <SettingRow label="Email Address" icon={<MdEmail />}>
                {isEditingProfile ? (
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                ) : (
                  <div className="text-sm font-medium text-slate-900">{profileForm.email}</div>
                )}
              </SettingRow>
              <SettingRow label="Phone Number" icon={<MdPhone />}>
                {isEditingProfile ? (
                  <input
                    type="text"
                    name="phone"
                    value={profileForm.phone === 'N/A' ? '' : profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                ) : (
                  (!profileForm.phone || profileForm.phone === 'N/A' || profileForm.phone.trim() === '') ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-primary-600 hover:text-primary-700 hover:underline text-sm font-medium transition-colors"
                    >
                      + Add Phone Number
                    </button>
                  ) : (
                    <div className="text-sm font-medium text-slate-900">{profileForm.phone}</div>
                  )
                )}
              </SettingRow>
              <SettingRow label="Account Role" icon={<MdBadge />}>
                <div className="text-sm font-medium text-slate-500">{user?.role || 'Doctor'} <span className="text-xs italic ml-1">(Read Only)</span></div>
              </SettingRow>
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
            <form onSubmit={handlePasswordChange} className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden px-4 flex flex-col">
              <SettingRow label="Current Password">
                <div className="relative flex items-center w-full">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Enter current password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-slate-400 hover:text-primary-500 transition-colors p-1 flex items-center justify-center"
                    onClick={() => toggleVisibility('current')}
                  >
                    {showPasswords.current ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </SettingRow>

              <SettingRow label="New Password">
                <div className="relative flex items-center w-full">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    placeholder="Enter new password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-slate-400 hover:text-primary-500 transition-colors p-1 flex items-center justify-center"
                    onClick={() => toggleVisibility('new')}
                  >
                    {showPasswords.new ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </SettingRow>

              <SettingRow label="Confirm Password">
                <div className="relative flex items-center w-full">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-slate-400 hover:text-primary-500 transition-colors p-1 flex items-center justify-center"
                    onClick={() => toggleVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </SettingRow>

              <div className="py-4 border-t border-slate-100 flex flex-col gap-3">
                {message.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium text-center ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {message.text}
                  </div>
                )}
                <button type="submit" className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Updating...' : (
                    <>
                      <MdSave size={18} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
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

// Shared Layout Component for perfect alignment across Settings module
const SettingRow = ({ label, icon, children }) => (
  <div className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] items-center gap-4 py-4 border-b border-slate-100 last:border-0 w-full">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
      {icon && <span className="text-lg text-slate-400">{icon}</span>}
      {label}
    </div>
    <div className="w-full flex items-center">
      {children}
    </div>
  </div>
);

export default DoctorSettings;

import React, { useState } from 'react';
import {
  MdBusiness,
  MdNotifications,
  MdSecurity,
  MdPalette,
  MdLanguage,
  MdBackup,
  MdEmail,
  MdPayment,
  MdSave,
  MdCheck,
} from 'react-icons/md';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    hospitalName: 'Karur Gastro Foundation',
    email: 'info@karurgastro.com',
    phone: '+91 98765 43210',
    address: '123 Medical Street, Karur, Tamil Nadu 639001',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    billingAlerts: true,
    systemUpdates: false,
    marketingEmails: false,
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    loginAttempts: '5',
  });

  // Appearance Settings State
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    compactMode: false,
    sidebarCollapsed: false,
  });

  // Backup Settings State
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: '30',
  });

  const tabs = [
    { id: 'general', label: 'General', icon: <MdBusiness /> },
    { id: 'notifications', label: 'Notifications', icon: <MdNotifications /> },
    { id: 'security', label: 'Security', icon: <MdSecurity /> },
    { id: 'appearance', label: 'Appearance', icon: <MdPalette /> },
    { id: 'backup', label: 'Backup', icon: <MdBackup /> },
  ];

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Hospital Information</h3>
      <div className="settings-grid">
        <div className="form-group">
          <label>Hospital Name</label>
          <input
            type="text"
            value={generalSettings.hospitalName}
            onChange={(e) => setGeneralSettings({ ...generalSettings, hospitalName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={generalSettings.email}
            onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={generalSettings.phone}
            onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
          />
        </div>
        <div className="form-group full-width">
          <label>Address</label>
          <textarea
            rows="3"
            value={generalSettings.address}
            onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
          />
        </div>
      </div>

      <h3 className="section-title">Regional Settings</h3>
      <div className="settings-grid">
        <div className="form-group">
          <label>Timezone</label>
          <select
            value={generalSettings.timezone}
            onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="America/New_York">America/New York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Date Format</label>
          <select
            value={generalSettings.dateFormat}
            onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div className="form-group">
          <label>Currency</label>
          <select
            value={generalSettings.currency}
            onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Notification Preferences</h3>
      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-icon">
              <MdEmail />
            </div>
            <div>
              <h4>Email Notifications</h4>
              <p>Receive notifications via email</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificationSettings.emailNotifications}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                emailNotifications: e.target.checked
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-icon">
              <MdNotifications />
            </div>
            <div>
              <h4>SMS Notifications</h4>
              <p>Receive notifications via SMS</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificationSettings.smsNotifications}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                smsNotifications: e.target.checked
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-icon">
              <MdNotifications />
            </div>
            <div>
              <h4>Appointment Reminders</h4>
              <p>Get reminders for upcoming appointments</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificationSettings.appointmentReminders}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                appointmentReminders: e.target.checked
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-icon">
              <MdPayment />
            </div>
            <div>
              <h4>Billing Alerts</h4>
              <p>Notifications about payments and invoices</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificationSettings.billingAlerts}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                billingAlerts: e.target.checked
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Security & Privacy</h3>
      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-icon">
              <MdSecurity />
            </div>
            <div>
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security to your account</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={securitySettings.twoFactorAuth}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                twoFactorAuth: e.target.checked
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <h3 className="section-title">Session Management</h3>
      <div className="settings-grid">
        <div className="form-group">
          <label>Session Timeout (minutes)</label>
          <input
            type="number"
            value={securitySettings.sessionTimeout}
            onChange={(e) => setSecuritySettings({
              ...securitySettings,
              sessionTimeout: e.target.value
            })}
          />
        </div>
        <div className="form-group">
          <label>Password Expiry (days)</label>
          <input
            type="number"
            value={securitySettings.passwordExpiry}
            onChange={(e) => setSecuritySettings({
              ...securitySettings,
              passwordExpiry: e.target.value
            })}
          />
        </div>
        <div className="form-group">
          <label>Max Login Attempts</label>
          <input
            type="number"
            value={securitySettings.loginAttempts}
            onChange={(e) => setSecuritySettings({
              ...securitySettings,
              loginAttempts: e.target.value
            })}
          />
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Display Preferences</h3>
      <div className="settings-grid">
        <div className="form-group">
          <label>Theme</label>
          <select
            value={appearanceSettings.theme}
            onChange={(e) => setAppearanceSettings({
              ...appearanceSettings,
              theme: e.target.value
            })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>
      </div>

      <h3 className="section-title">Layout Options</h3>
      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-icon">
              <MdPalette />
            </div>
            <div>
              <h4>Compact Mode</h4>
              <p>Reduce spacing for more content</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={appearanceSettings.compactMode}
              onChange={(e) => setAppearanceSettings({
                ...appearanceSettings,
                compactMode: e.target.checked
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-icon">
              <MdLanguage />
            </div>
            <div>
              <h4>Sidebar Collapsed by Default</h4>
              <p>Start with a collapsed sidebar</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={appearanceSettings.sidebarCollapsed}
              onChange={(e) => setAppearanceSettings({
                ...appearanceSettings,
                sidebarCollapsed: e.target.checked
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">Automatic Backup</h3>
      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-icon">
              <MdBackup />
            </div>
            <div>
              <h4>Enable Automatic Backup</h4>
              <p>Automatically backup data at scheduled intervals</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={backupSettings.autoBackup}
              onChange={(e) => setBackupSettings({
                ...backupSettings,
                autoBackup: e.target.checked
              })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {backupSettings.autoBackup && (
        <>
          <h3 className="section-title">Backup Schedule</h3>
          <div className="settings-grid">
            <div className="form-group">
              <label>Backup Frequency</label>
              <select
                value={backupSettings.backupFrequency}
                onChange={(e) => setBackupSettings({
                  ...backupSettings,
                  backupFrequency: e.target.value
                })}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label>Backup Time</label>
              <input
                type="time"
                value={backupSettings.backupTime}
                onChange={(e) => setBackupSettings({
                  ...backupSettings,
                  backupTime: e.target.value
                })}
              />
            </div>
            <div className="form-group">
              <label>Retention Period (days)</label>
              <input
                type="number"
                value={backupSettings.retentionDays}
                onChange={(e) => setBackupSettings({
                  ...backupSettings,
                  retentionDays: e.target.value
                })}
              />
            </div>
          </div>

          <div className="backup-actions">
            <button className="btn-secondary">
              <MdBackup />
              Backup Now
            </button>
            <button className="btn-secondary">
              <MdBackup />
              Restore from Backup
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <button 
          className={`save-btn ${saveSuccess ? 'success' : ''}`}
          onClick={handleSave}
          disabled={loading}
        >
          {saveSuccess ? (
            <>
              <MdCheck /> Saved
            </>
          ) : loading ? (
            'Saving...'
          ) : (
            <>
              <MdSave /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-panel">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'backup' && renderBackupSettings()}
        </div>
      </div>
    </div>
  );
};

export default Settings;

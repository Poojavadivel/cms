/**
 * Settings.jsx
 * Pathologist settings page - placeholder for future implementation
 */

import React from 'react';
import { MdSettings } from 'react-icons/md';
import './Settings.css';

const Settings = () => {
  return (
    <div className="pathologist-settings-page">
      <div className="coming-soon-container">
        <div className="coming-soon-icon">
          <MdSettings size={64} />
        </div>
        <h1>Settings</h1>
        <p>Coming Soon</p>
      </div>
    </div>
  );
};

export default Settings;

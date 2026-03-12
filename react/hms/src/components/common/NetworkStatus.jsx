/**
 * NetworkStatus.jsx
 * Network status banner (equivalent to Flutter's NoInternetPage)
 */

import React, { useState, useEffect } from 'react';
import './NetworkStatus.css';

const NetworkStatus = ({ isOnline }) => {
  const [show, setShow] = useState(!isOnline);
  const [shouldRender, setShouldRender] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      // Show immediately when offline
      setShouldRender(true);
      setShow(true);
    } else {
      // Delay hiding to show "connected" message
      setShow(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!shouldRender) return null;

  return (
    <div className={`network-status ${!isOnline ? 'offline' : 'online'} ${show ? 'show' : ''}`}>
      <div className="network-status-content">
        {!isOnline ? (
          <>
            <span className="network-icon">⚠️</span>
            <span className="network-message">No Internet Connection</span>
            <span className="network-description">Please check your network settings</span>
          </>
        ) : (
          <>
            <span className="network-icon">✅</span>
            <span className="network-message">Back Online</span>
            <span className="network-description">Connection restored</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;

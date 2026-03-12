/**
 * LoadingFallback.jsx
 * Loading component for lazy-loaded routes
 */

import React from 'react';
import './LoadingFallback.css';

const LoadingFallback = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-fallback">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingFallback;

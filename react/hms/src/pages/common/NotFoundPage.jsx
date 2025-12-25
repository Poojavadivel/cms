import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Animated 404 Number */}
        <div className="error-code">
          <span className="digit">4</span>
          <span className="digit animated">0</span>
          <span className="digit">4</span>
        </div>

        {/* Medical-themed illustration */}
        <div className="illustration">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stethoscope illustration */}
            <circle cx="100" cy="100" r="80" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="5 5" />
            <path d="M70 60C70 60 80 50 100 50C120 50 130 60 130 60" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
            <line x1="70" y1="60" x2="70" y2="120" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
            <line x1="130" y1="60" x2="130" y2="120" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="70" cy="130" r="15" fill="#3B82F6"/>
            <circle cx="130" cy="130" r="15" fill="#3B82F6"/>
            <circle cx="70" cy="130" r="10" fill="white" opacity="0.5"/>
            <circle cx="130" cy="130" r="10" fill="white" opacity="0.5"/>
            
            {/* Medical cross */}
            <g transform="translate(95, 95)">
              <rect x="-3" y="-15" width="6" height="30" rx="2" fill="#EF4444"/>
              <rect x="-15" y="-3" width="30" height="6" rx="2" fill="#EF4444"/>
            </g>
            
            {/* Floating particles */}
            <circle cx="40" cy="40" r="3" fill="#3B82F6" className="particle particle-1"/>
            <circle cx="160" cy="50" r="2" fill="#10B981" className="particle particle-2"/>
            <circle cx="50" cy="150" r="4" fill="#F59E0B" className="particle particle-3"/>
            <circle cx="150" cy="140" r="3" fill="#8B5CF6" className="particle particle-4"/>
          </svg>
        </div>

        {/* Error message */}
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-description">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>

        {/* Action buttons */}
        <div className="action-buttons">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Go Back
          </button>
          <button onClick={() => navigate('/')} className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Go Home
          </button>
        </div>

        {/* Help text */}
        <div className="help-text">
          <p>Need help? <a href="/admin/dashboard">Return to Dashboard</a></p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="bg-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;

/**
 * LoginPage.jsx
 * EXACT replica of Flutter's LoginPage.dart
 * Enterprise Healthcare Management System Login
 * 
 * Handles login and redirects users back to where they were trying to go
 * Implements "Remember Me" functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../provider';
import { authService, logger } from '../../services';
import './LoginPage.css';

const PREFS_REMEMBER_ME_KEY = 'remember_me';
const PREFS_EMAIL_KEY = 'saved_email';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useApp();
  const canvasRef = useRef(null);

  // Get the path user was trying to access (for redirect after login)
  const from = location.state?.from?.pathname;

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  // Initialize
  useEffect(() => {
    logger.info('LOGIN_PAGE', 'Login page mounted');
    refreshCaptcha();
    loadUserPreferences();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 800);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      logger.info('LOGIN_PAGE', 'Login page unmounted');
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Redraw CAPTCHA when text changes
  useEffect(() => {
    if (captchaText) {
      drawCaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaText]);

  const loadUserPreferences = () => {
    const savedRememberMe = localStorage.getItem(PREFS_REMEMBER_ME_KEY) === 'true';
    if (savedRememberMe) {
      const savedEmail = localStorage.getItem(PREFS_EMAIL_KEY) || '';
      setRememberMe(savedRememberMe);
      setEmail(savedEmail);
    }
  };

  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
  };

  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Create seeded random for consistency with same text
    let seed = captchaText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Clean subtle background - matching Flutter #F8F9FA
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, width, height);

    // Minimal noise pattern - 8 subtle dots (matching Flutter)
    ctx.fillStyle = 'rgba(209, 213, 219, 0.3)';
    for (let i = 0; i < 8; i++) {
      const x = seededRandom() * width;
      const y = seededRandom() * height;
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Single subtle diagonal line (matching Flutter)
    ctx.strokeStyle = 'rgba(209, 213, 219, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.3);
    ctx.lineTo(width, height * 0.7);
    ctx.stroke();

    // Calculate text positioning for proper centering
    ctx.font = 'bold 20px "Roboto Mono", monospace';
    ctx.textBaseline = 'middle';
    
    // Calculate total width with spacing
    let totalWidth = 0;
    const charWidths = [];
    for (let i = 0; i < captchaText.length; i++) {
      const w = ctx.measureText(captchaText[i]).width;
      charWidths.push(w);
      totalWidth += w;
    }
    totalWidth += (captchaText.length - 1) * 2; // Add spacing between chars

    // Start x position to center the text
    let x = (width - totalWidth) / 2;

    // Draw each character with minimal rotation
    for (let i = 0; i < captchaText.length; i++) {
      const char = captchaText[i];
      const charWidth = charWidths[i];
      const y = height / 2 + (seededRandom() - 0.5) * 4;
      const rotation = (seededRandom() - 0.5) * 0.15; // Minimal rotation

      ctx.save();
      ctx.translate(x + charWidth / 2, y);
      ctx.rotate(rotation);
      
      ctx.fillStyle = '#1F2937'; // grey-800 matching Flutter
      ctx.font = 'bold 20px "Roboto Mono", monospace';
      ctx.fillText(char, -charWidth / 2, 0);
      
      ctx.restore();

      x += charWidth + 2; // Move to next character position with spacing
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    logger.userAction('Login form submitted', { email: email.trim() });

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      logger.warn('LOGIN_PAGE', 'Login attempt with empty email');
      return;
    }
    if (!password) {
      setError('Password is required');
      logger.warn('LOGIN_PAGE', 'Login attempt with empty password');
      return;
    }
    if (!captchaInput) {
      setError('CAPTCHA is required');
      logger.warn('LOGIN_PAGE', 'Login attempt with empty CAPTCHA');
      return;
    }

    if (captchaInput.toUpperCase() !== captchaText.toUpperCase()) {
      setError('Invalid captcha. Please try again.');
      logger.warn('LOGIN_PAGE', 'Invalid CAPTCHA entered');
      refreshCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const authResult = await authService.signIn(email.trim(), password);

      // Save remember me preference
      localStorage.setItem(PREFS_REMEMBER_ME_KEY, rememberMe.toString());
      if (rememberMe) {
        localStorage.setItem(PREFS_EMAIL_KEY, email.trim());
        logger.info('LOGIN_PAGE', 'Remember me enabled');
      } else {
        localStorage.removeItem(PREFS_EMAIL_KEY);
      }

      // Set user in context
      setUser(authResult.user, authResult.token);
      
      console.log('✅ [Login] User authenticated:', authResult.user.fullName);
      logger.success('LOGIN_PAGE', `User authenticated: ${authResult.user.fullName}`);

      // If user was redirected from a protected route, send them back
      if (from) {
        console.log('↩️ [Login] Redirecting back to:', from);
        logger.navigate('/login', from, authResult.user);
        navigate(from, { replace: true });
        return;
      }

      // Otherwise, navigate based on role
      const userRole = authResult.user.role.toLowerCase();
      console.log('👤 [Login] User role:', userRole);
      
      let targetPath = '/doctor'; // Default fallback
      
      if (userRole === 'admin' || userRole === 'superadmin') {
        console.log('➡️ [Login] Navigating to Admin dashboard');
        targetPath = '/admin';
      } else if (userRole === 'doctor') {
        console.log('➡️ [Login] Navigating to Doctor dashboard');
        targetPath = '/doctor';
      } else if (userRole === 'pharmacist') {
        console.log('➡️ [Login] Navigating to Pharmacist dashboard');
        targetPath = '/pharmacist';
      } else if (userRole === 'pathologist') {
        console.log('➡️ [Login] Navigating to Pathologist dashboard');
        targetPath = '/pathologist';
      } else {
        console.warn('⚠️ [Login] Unknown role, falling back to Doctor');
        logger.warn('LOGIN_PAGE', `Unknown role: ${userRole}, using fallback`);
      }
      
      logger.navigate('/login', targetPath, authResult.user);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      logger.error('LOGIN_PAGE', `Login failed: ${err.message}`);
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-safe-area">
        <div className="login-page-center">
          <div className="login-page-container">
            <div className="login-page-card">
              {isMobile ? (
                <MobileLayout
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  captchaInput={captchaInput}
                  setCaptchaInput={setCaptchaInput}
                  obscurePassword={obscurePassword}
                  setObscurePassword={setObscurePassword}
                  rememberMe={rememberMe}
                  setRememberMe={setRememberMe}
                  isLoading={isLoading}
                  error={error}
                  handleLogin={handleLogin}
                  canvasRef={canvasRef}
                  refreshCaptcha={refreshCaptcha}
                />
              ) : (
                <DesktopLayout
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  captchaInput={captchaInput}
                  setCaptchaInput={setCaptchaInput}
                  obscurePassword={obscurePassword}
                  setObscurePassword={setObscurePassword}
                  rememberMe={rememberMe}
                  setRememberMe={setRememberMe}
                  isLoading={isLoading}
                  error={error}
                  handleLogin={handleLogin}
                  canvasRef={canvasRef}
                  refreshCaptcha={refreshCaptcha}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Desktop Layout Component
const DesktopLayout = (props) => {
  return (
    <div className="desktop-layout">
      {/* Left Hero Section */}
      <div className="hero-section">
        <div className="hero-gradient">
          <div className="shimmer-overlay"></div>
          <div className="hero-content">
            {/* Top Section */}
            <div className="hero-top">
              <div className="brand-header">
                <div className="brand-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="brand-text">
                  <div className="brand-title">KARUR GASTRO</div>
                  <div className="brand-subtitle">Healthcare Management</div>
                </div>
              </div>

              <h1 className="hero-heading">
                Enterprise Healthcare<br />Management System
              </h1>

              <p className="hero-description">
                Secure, HIPAA-compliant platform with role-based access control, 
                comprehensive audit trails, and real-time analytics for modern healthcare operations.
              </p>
            </div>

            {/* Middle Section - Features */}
            <div className="hero-middle">
              <div className="features-label">KEY FEATURES</div>
              <div className="features-chips">
                <FeatureChip icon="lock" text="Secure Access" />
                <FeatureChip icon="shield" text="HIPAA Compliant" />
                <FeatureChip icon="analytics" text="Real-time Analytics" />
                <FeatureChip icon="backup" text="Auto Backup" />
              </div>
            </div>

            {/* Bottom Section */}
            <div className="hero-bottom">
              <div className="trust-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Trusted by 150+ Healthcare Institutions</span>
              </div>
              <div className="support-text">
                24/7 Support • ISO 27001 Certified • 99.9% Uptime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="form-section">
        <div className="form-scroll">
          <LoginForm {...props} compact={false} />
        </div>
      </div>
    </div>
  );
};

// Mobile Layout Component
const MobileLayout = (props) => {
  return (
    <div className="mobile-layout">
      {/* Compact Hero */}
      <div className="mobile-hero">
        <div className="mobile-brand-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
        </div>
        <div className="mobile-brand-title">KARUR GASTRO</div>
        <div className="mobile-brand-subtitle">Healthcare Management System</div>
      </div>

      {/* Form */}
      <div className="mobile-form-scroll">
        <LoginForm {...props} compact={true} />
      </div>
    </div>
  );
};

// Login Form Component
const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  captchaInput,
  setCaptchaInput,
  obscurePassword,
  setObscurePassword,
  rememberMe,
  setRememberMe,
  isLoading,
  error,
  handleLogin,
  canvasRef,
  refreshCaptcha,
  compact
}) => {
  return (
    <form className="login-form" onSubmit={handleLogin}>
      {/* Desktop Brand Header */}
      {!compact && (
        <div className="form-brand-header">
          <div className="form-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </div>
          <div className="form-brand-text">
            <div className="form-brand-title">KARUR GASTRO</div>
            <div className="form-brand-subtitle">Healthcare Management</div>
          </div>
        </div>
      )}

      {/* Welcome Text */}
      <h2 className={`form-title ${compact ? 'compact' : ''}`}>Welcome Back</h2>
      <p className="form-subtitle">Sign in to access your healthcare dashboard</p>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="form-field">
        <label className="field-label">Email Address or Mobile</label>
        <div className="input-wrapper">
          <svg className="input-icon" width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your email or mobile number"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="form-field">
        <label className="field-label">Password</label>
        <div className="input-wrapper">
          <svg className="input-icon" width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <input
            type={obscurePassword ? 'password' : 'text'}
            className="form-input"
            placeholder="Enter your secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setObscurePassword(!obscurePassword)}
            title={obscurePassword ? 'Show password' : 'Hide password'}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              {obscurePassword ? (
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              ) : (
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* CAPTCHA Field */}
      <div className="form-field">
        <label className="field-label">Security Verification</label>
        <div className="captcha-row">
          <div className="captcha-input-wrapper">
            <svg className="input-icon" width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <input
              type="text"
              className="form-input captcha-input"
              placeholder="Enter code"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
              maxLength={5}
              disabled={isLoading}
            />
          </div>
          <div className="captcha-display">
            <canvas ref={canvasRef} width={160} height={44} />
            <button
              type="button"
              className="captcha-refresh"
              onClick={refreshCaptcha}
              title="Refresh CAPTCHA"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Remember Me + Forgot Password */}
      <div className="form-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <span>Remember me for 30 days</span>
        </label>
        <button type="button" className="forgot-link" onClick={() => {}}>
          Forgot Password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="submit-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          <>
            <span>Sign In to Dashboard</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </>
        )}
      </button>

      {/* Footer (Desktop only) */}
      {!compact && (
        <>
          <div className="form-divider"></div>
          <div className="form-footer">
            <div className="security-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              <span>Enterprise-grade Security</span>
            </div>
            <div className="copyright">
              v1.0.0 • © 2024 Karur Gastro Foundation
            </div>
          </div>
        </>
      )}
    </form>
  );
};

// Feature Chip Component
const FeatureChip = ({ icon, text }) => {
  const iconMap = {
    lock: <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>,
    shield: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>,
    analytics: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>,
    backup: <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
  };

  return (
    <div className="feature-chip">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        {iconMap[icon]}
      </svg>
      <span>{text}</span>
    </div>
  );
};

export default LoginPage;

/**
 * SplashScreen.jsx
 * Initial loading screen that checks authentication status
 * 
 * This is the React equivalent of Flutter's SplashPage
 * Handles page refresh by validating token with backend
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../provider';
import authService from './authService';
import './SplashScreen.css';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const checkRun = React.useRef(false); // Ref to prevent double-execution

  /**
   * Check authentication status and navigate accordingly
   */
  const checkAuthStatus = useCallback(async () => {
    // Prevent multiple runs
    if (checkRun.current) return;
    checkRun.current = true;

    try {
      console.log('🔍 [SPLASH] Starting authentication check...');

      // Show splash screen for at least 2 seconds for better UX
      const minSplashTime = new Promise(resolve => setTimeout(resolve, 2000));

      // Check if we have a stored token
      const storedToken = localStorage.getItem('auth_token');
      console.log(`🔑 [SPLASH] Stored token: ${storedToken ? 'EXISTS' : 'NONE'}`);

      // Wait for minimum splash time BEFORE doing heavy logic if possible, 
      // or at least wait for it before navigating
      let authResult = null;

      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
        console.log('🔄 [SPLASH] Validating token with backend...');
        try {
          authResult = await authService.getUserData();
        } catch (err) {
          console.error('❌ [SPLASH] Validation threw error:', err);
          authResult = null;
        }
      }

      await minSplashTime; // Ensure minimum display time

      if (authResult && authResult.user) {
        console.log('✅ [SPLASH] Token valid, user authenticated:', authResult.user.fullName);

        // Update app context with validated user data
        setUser(authResult.user, authResult.token);

        // Navigate based on role
        const userRole = authResult.user.role;
        console.log(`👤 [SPLASH] User role: ${userRole}`);

        if (userRole === 'admin' || userRole === 'superadmin') {
          console.log('➡️ [SPLASH] Navigating to Admin dashboard');
          navigate('/admin', { replace: true });
        } else if (userRole === 'doctor') {
          console.log('➡️ [SPLASH] Navigating to Doctor dashboard');
          navigate('/doctor', { replace: true });
        } else if (userRole === 'pharmacist') {
          console.log('➡️ [SPLASH] Navigating to Pharmacist dashboard');
          navigate('/pharmacist', { replace: true });
        } else if (userRole === 'pathologist') {
          console.log('➡️ [SPLASH] Navigating to Pathologist dashboard');
          navigate('/pathologist', { replace: true });
        } else {
          console.warn('⚠️ [SPLASH] Unknown role, redirecting to login');
          navigate('/login', { replace: true });
        }
      } else {
        console.log('⚠️ [SPLASH] No valid session or token expired, redirecting to login');
        // Clear any stale data to be safe
        localStorage.removeItem('auth_token');
        localStorage.removeItem('authUser');
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('❌ [SPLASH] Auth check failed:', error);
      // Fallback safety - clear everything
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authUser');
      navigate('/login', { replace: true });
    }
  }, [navigate, setUser]);

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run ONCE on mount

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <h1 className="splash-title">MOVI HOSPITAL</h1>
          <p className="splash-subtitle">Hospital Management System</p>
        </div>

        <div className="splash-loader">
          <div className="spinner"></div>
          <p className="splash-loading-text">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

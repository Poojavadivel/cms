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

  /**
   * Check authentication status and navigate accordingly
   * Equivalent to Flutter's _checkAuthStatus method
   * 
   * This validates the token with backend on every app load/refresh
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('🔍 [SPLASH] Starting authentication check...');
      
      // Show splash screen for at least 2 seconds for better UX
      const minSplashTime = new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if we have a stored token
      const storedToken = localStorage.getItem('authToken');
      console.log(`🔑 [SPLASH] Stored token: ${storedToken ? 'EXISTS' : 'NONE'}`);
      
      // If we have a token, validate it with backend
      // This is crucial for handling page refresh - we don't trust localStorage alone
      let authResult = null;
      
      if (storedToken) {
        console.log('🔄 [SPLASH] Validating token with backend...');
        authResult = await authService.getUserData();
      }
      
      // Wait for minimum splash time
      await minSplashTime;

      if (authResult) {
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
        // Clear any stale data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('❌ [SPLASH] Auth check failed:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      navigate('/login', { replace: true });
    }
  }, [navigate, setUser]);

  useEffect(() => {
    // Start authentication check on mount
    console.log('🚀 [SPLASH] Starting authentication check...');
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <h1 className="splash-title">Karur Gastro Foundation</h1>
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

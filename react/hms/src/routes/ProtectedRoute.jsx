/**
 * ProtectedRoute.jsx
 * Route wrapper that requires authentication
 * 
 * Handles page refresh by checking authentication state
 * Similar to Flutter's route guards
 * 
 * Usage:
 * <ProtectedRoute>
 *   <YourComponent />
 * </ProtectedRoute>
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../provider';
import LoadingFallback from '../components/common/LoadingFallback';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isLoading, isCheckingAuth } = useApp();
  const location = useLocation();

  // Show loading while checking authentication on app mount
  // This happens when page is refreshed
  if (isCheckingAuth || isLoading) {
    console.log('⏳ [ProtectedRoute] Checking authentication...');
    return <LoadingFallback message="Verifying authentication..." />;
  }

  // Redirect to login if not authenticated
  // Save the attempted location to redirect back after login
  if (!isLoggedIn) {
    console.log('🚫 [ProtectedRoute] Not authenticated, redirecting to login');
    console.log('📍 [ProtectedRoute] Attempted path:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ [ProtectedRoute] Authenticated, rendering protected content');
  // User is authenticated, render children
  return children;
};

export default ProtectedRoute;

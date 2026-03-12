/**
 * RoleBasedRoute.jsx
 * Route wrapper that requires specific user roles
 * 
 * Handles page refresh by checking authentication and role
 * Similar to Flutter's role-based navigation guards
 * 
 * Usage:
 * <RoleBasedRoute allowedRoles={['admin', 'doctor']}>
 *   <YourComponent />
 * </RoleBasedRoute>
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../provider';
import LoadingFallback from '../components/common/LoadingFallback';

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { isLoggedIn, userRole, isLoading, isCheckingAuth } = useApp();
  const location = useLocation();

  // Show loading while checking authentication on app mount or during loading
  // This happens when page is refreshed
  if (isCheckingAuth || isLoading) {
    console.log('⏳ [RoleBasedRoute] Checking authentication...');
    return <LoadingFallback message="Verifying authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    console.log('🚫 [RoleBasedRoute] Not authenticated, redirecting to login');
    console.log('📍 [RoleBasedRoute] Attempted path:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.warn(
      `🚫 [RoleBasedRoute] Access denied. User role "${userRole}" not in allowed roles: ${allowedRoles.join(', ')}`
    );
    return <Navigate to="/unauthorized" replace />;
  }

  console.log(`✅ [RoleBasedRoute] Role "${userRole}" authorized for ${location.pathname}`);
  // User is authenticated and has correct role
  return children;
};

export default RoleBasedRoute;

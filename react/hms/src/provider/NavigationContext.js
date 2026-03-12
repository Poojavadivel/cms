/**
 * NavigationContext.js
 * Manages navigation state, breadcrumbs, and active module
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logger from '../services/loggerService';

const NavigationContext = createContext(undefined);

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [activeModule, setActiveModuleState] = useState(() => {
    return localStorage.getItem('selectedModule') || 'dashboard';
  });
  const [navigationHistory, setNavigationHistory] = useState([]);

  /**
   * Set the active module/section
   */
  const setActiveModule = useCallback((module) => {
    setActiveModuleState(module);
    localStorage.setItem('selectedModule', module);
  }, []);

  /**
   * Navigate to a path and update breadcrumbs
   */
  const navigateTo = useCallback((path, options = {}) => {
    const from = location.pathname;
    logger.navigate(from, path);
    navigate(path, options);
    
    // Add to history
    setNavigationHistory((prev) => [...prev, { path, timestamp: new Date() }].slice(-50));
  }, [navigate, location.pathname]);

  /**
   * Go back in history
   */
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Update breadcrumbs
   */
  const updateBreadcrumbs = useCallback((crumbs) => {
    setBreadcrumbs(crumbs);
  }, []);

  /**
   * Add a breadcrumb
   */
  const addBreadcrumb = useCallback((crumb) => {
    setBreadcrumbs((prev) => [...prev, crumb]);
  }, []);

  /**
   * Clear breadcrumbs
   */
  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  /**
   * Get current path segments
   */
  const getPathSegments = useCallback(() => {
    return location.pathname.split('/').filter(Boolean);
  }, [location]);

  /**
   * Check if currently on a specific path
   */
  const isCurrentPath = useCallback((path) => {
    return location.pathname === path;
  }, [location]);

  /**
   * Check if path starts with prefix
   */
  const isPathStartsWith = useCallback((prefix) => {
    return location.pathname.startsWith(prefix);
  }, [location]);

  const value = {
    // State
    breadcrumbs,
    activeModule,
    navigationHistory,
    currentPath: location.pathname,
    
    // Actions
    setActiveModule,
    navigateTo,
    goBack,
    updateBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs,
    
    // Utilities
    getPathSegments,
    isCurrentPath,
    isPathStartsWith,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export default NavigationContext;

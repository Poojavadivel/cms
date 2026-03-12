/**
 * ThemeContext.js
 * Manages theme state (light/dark mode) and UI preferences
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#6366f1'); // Default indigo
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load theme preferences from localStorage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      const storedColor = localStorage.getItem('primaryColor');
      const storedSidebarState = localStorage.getItem('sidebarCollapsed');
      
      if (storedTheme) {
        setIsDarkMode(storedTheme === 'dark');
      }
      
      if (storedColor) {
        setPrimaryColor(storedColor);
      }
      
      if (storedSidebarState) {
        setSidebarCollapsed(storedSidebarState === 'true');
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    }
  }, []);

  // Apply theme class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const changePrimaryColor = (color) => {
    setPrimaryColor(color);
    localStorage.setItem('primaryColor', color);
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  const value = {
    isDarkMode,
    primaryColor,
    sidebarCollapsed,
    toggleTheme,
    changePrimaryColor,
    toggleSidebar,
    setSidebarCollapsed,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

/**
 * ThemeContext.js
 * Theme management - Port from web ThemeContext.js
 * Provides color constants matching the web app's design system
 */

import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(undefined);

// Colors from the web app's CSS design system
export const AppColors = {
    // Primary palette
    primary: '#0F172A',
    primaryLight: '#1E293B',
    primaryDark: '#020617',
    accent: '#3B82F6',
    accentLight: '#60A5FA',
    accentDark: '#2563EB',

    // Background
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    card: '#FFFFFF',

    // Text
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnAccent: '#FFFFFF',

    // Status colors
    success: '#22C55E',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // Border & Divider
    border: '#E2E8F0',
    divider: '#F1F5F9',

    // Sidebar / Nav
    sidebarBg: '#0F172A',
    sidebarText: '#94A3B8',
    sidebarActiveText: '#FFFFFF',
    sidebarActiveBg: 'rgba(59, 130, 246, 0.15)',
    sidebarHover: 'rgba(255, 255, 255, 0.05)',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const colors = AppColors;

    const toggleTheme = () => setIsDark(!isDark);

    return (
        <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;

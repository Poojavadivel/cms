/**
 * Provider Index
 * Central export file for all providers and hooks
 */

// Main combined provider
export { AppProviders } from './AppProviders';

// Individual providers
export { AppProvider, useApp, withAuth, withRole } from './AppContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { NotificationProvider, useNotification } from './NotificationContext';
export { LoadingProvider, useLoading } from './LoadingContext';
export { NavigationProvider, useNavigation } from './NavigationContext';

// Re-export contexts for direct access if needed
export { default as AppContext } from './AppContext';
export { default as ThemeContext } from './ThemeContext';
export { default as NotificationContext } from './NotificationContext';
export { default as LoadingContext } from './LoadingContext';
export { default as NavigationContext } from './NavigationContext';

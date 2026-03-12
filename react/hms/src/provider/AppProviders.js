/**
 * AppProviders.js
 * Combines all context providers into a single component
 * This makes it easy to wrap the entire app with all necessary contexts
 */

import React from 'react';
import { AppProvider } from './AppContext';
import { ThemeProvider } from './ThemeContext';
import { NotificationProvider } from './NotificationContext';
import { LoadingProvider } from './LoadingContext';
import { NavigationProvider } from './NavigationContext';

/**
 * AppProviders Component
 * Wraps children with all application contexts in the correct order
 * 
 * Order matters:
 * 1. AppProvider - Authentication state (most critical)
 * 2. ThemeProvider - Theme/UI preferences
 * 3. LoadingProvider - Loading states
 * 4. NotificationProvider - Notifications/toasts
 * 5. NavigationProvider - Navigation state (needs router context)
 * 
 * Note: BrowserRouter is in App.js, not here
 */
export const AppProviders = ({ children }) => {
  return (
    <AppProvider>
      <ThemeProvider>
        <LoadingProvider>
          <NotificationProvider>
            <NavigationProvider>
              {children}
            </NavigationProvider>
          </NotificationProvider>
        </LoadingProvider>
      </ThemeProvider>
    </AppProvider>
  );
};

export default AppProviders;

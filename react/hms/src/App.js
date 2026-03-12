/**
 * App.js
 * Main application component with routing and providers
 * 
 * This is the React equivalent of Flutter's MyApp and ConnectivityWrapper
 * Handles page refresh by checking authentication state
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './provider';
import AppRoutes from './routes/AppRoutes';
import NetworkStatus from './components/common/NetworkStatus';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [key, setKey] = useState(0); // Key to force remount on reconnection

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      console.log('✅ [App] Network connection restored');
      setIsOnline(true);
      // Force remount by changing key (similar to Flutter's UniqueKey())
      setKey(prevKey => prevKey + 1);
    };

    const handleOffline = () => {
      console.warn('⚠️ [App] Network connection lost');
      setIsOnline(false);
    };

    // Handle page visibility changes (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ [App] Page became visible, checking network...');
        setIsOnline(navigator.onLine);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter key={key}>
        <AppProviders>
          {/* Show network status banner if offline */}
          <NetworkStatus isOnline={isOnline} />
          
          {/* Main application routes */}
          <AppRoutes />
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

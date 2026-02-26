/**
 * AppProviders.js
 * Wraps all context providers - Port from web AppProviders.js
 */

import React from 'react';
import { AppProvider } from './AppContext';
import { ThemeProvider } from './ThemeContext';
import { NotificationProvider } from './NotificationContext';
import { LoadingProvider } from './LoadingContext';

export const AppProviders = ({ children }) => {
    return (
        <AppProvider>
            <ThemeProvider>
                <NotificationProvider>
                    <LoadingProvider>
                        {children}
                    </LoadingProvider>
                </NotificationProvider>
            </ThemeProvider>
        </AppProvider>
    );
};

export default AppProviders;

/**
 * LoadingContext.js
 * Global loading state management
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext(undefined);

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const showLoading = useCallback((message = 'Loading...') => {
        setIsLoading(true);
        setLoadingMessage(message);
    }, []);

    const hideLoading = useCallback(() => {
        setIsLoading(false);
        setLoadingMessage('');
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

export default LoadingContext;

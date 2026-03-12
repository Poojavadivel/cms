/**
 * LoadingContext.js
 * Manages global loading states for async operations
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext(undefined);

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);

  /**
   * Set loading state for a specific key
   * Useful for tracking multiple async operations
   */
  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  /**
   * Check if a specific key is loading
   */
  const isLoading = useCallback((key) => {
    return loadingStates[key] === true;
  }, [loadingStates]);

  /**
   * Check if any operation is loading
   */
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some((state) => state === true) || globalLoading;
  }, [loadingStates, globalLoading]);

  /**
   * Clear all loading states
   */
  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    setGlobalLoading(false);
  }, []);

  /**
   * Execute async function with automatic loading state management
   * @param {string} key - Loading state key
   * @param {Function} asyncFn - Async function to execute
   * @returns {Promise} - Result of async function
   */
  const executeWithLoading = useCallback(async (key, asyncFn) => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  const value = {
    loadingStates,
    globalLoading,
    setLoading,
    setGlobalLoading,
    isLoading,
    isAnyLoading,
    clearAllLoading,
    executeWithLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
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

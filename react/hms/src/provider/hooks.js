/**
 * Custom Hooks
 * Reusable hooks that combine multiple contexts or provide utility functions
 */

import { useApp } from './AppContext';
import { useNotification } from './NotificationContext';
import { useLoading } from './LoadingContext';
import { useNavigation } from './NavigationContext';
import { useCallback } from 'react';

/**
 * Combined hook for common operations
 */
export const useAppState = () => {
  const app = useApp();
  const notification = useNotification();
  const loading = useLoading();
  const navigation = useNavigation();

  return {
    ...app,
    ...notification,
    ...loading,
    ...navigation,
  };
};

/**
 * Hook for API calls with automatic loading and error handling
 */
export const useApiCall = () => {
  const { executeWithLoading } = useLoading();
  const { error: showError, success: showSuccess } = useNotification();
  const { token } = useApp();

  const callApi = useCallback(async (
    apiFunction,
    {
      loadingKey = 'api',
      successMessage = null,
      errorMessage = 'An error occurred',
      showSuccessNotification = false,
    } = {}
  ) => {
    try {
      const result = await executeWithLoading(loadingKey, () => apiFunction(token));
      
      if (showSuccessNotification && successMessage) {
        showSuccess(successMessage);
      }
      
      return { success: true, data: result };
    } catch (error) {
      const message = error.response?.data?.message || error.message || errorMessage;
      showError(message);
      return { success: false, error: message };
    }
  }, [executeWithLoading, showError, showSuccess, token]);

  return { callApi };
};

/**
 * Hook for protected routes
 */
export const useProtectedRoute = (allowedRoles = []) => {
  const { isLoggedIn, userRole } = useApp();
  const { navigateTo } = useNavigation();

  const checkAccess = useCallback(() => {
    if (!isLoggedIn) {
      navigateTo('/login');
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      navigateTo('/unauthorized');
      return false;
    }

    return true;
  }, [isLoggedIn, userRole, allowedRoles, navigateTo]);

  return { checkAccess, isAuthorized: checkAccess() };
};

/**
 * Hook for form submission with loading and notifications
 */
export const useFormSubmit = () => {
  const { setLoading } = useLoading();
  const { success: showSuccess, error: showError } = useNotification();

  const submitForm = useCallback(async (
    submitFunction,
    {
      loadingKey = 'form',
      successMessage = 'Form submitted successfully',
      errorMessage = 'Failed to submit form',
      onSuccess = null,
      onError = null,
    } = {}
  ) => {
    setLoading(loadingKey, true);
    
    try {
      const result = await submitFunction();
      showSuccess(successMessage);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return { success: true, data: result };
    } catch (error) {
      const message = error.response?.data?.message || error.message || errorMessage;
      showError(message);
      
      if (onError) {
        onError(error);
      }
      
      return { success: false, error: message };
    } finally {
      setLoading(loadingKey, false);
    }
  }, [setLoading, showSuccess, showError]);

  return { submitForm };
};

/**
 * Hook for pagination state
 */
export const usePagination = (initialPage = 1, initialPageSize = 10) => {
  const [page, setPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [total, setTotal] = React.useState(0);

  const totalPages = Math.ceil(total / pageSize);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(initialPage);
  }, [initialPage]);

  return {
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
    goToPage,
    reset,
  };
};

/**
 * Hook for search/filter state
 */
export const useSearch = (initialQuery = '') => {
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [filters, setFilters] = React.useState({});

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const clearAll = useCallback(() => {
    setSearchQuery('');
    setFilters({});
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    updateFilter,
    removeFilter,
    clearFilters,
    clearAll,
  };
};

// Add React import at the top if using useState in hooks
import React from 'react';

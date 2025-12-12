/**
 * AppContext.js
 * Central state management using React Context API
 * 
 * This is the React equivalent of Flutter's AppProvider (ChangeNotifier)
 * It manages authentication state and the current logged-in user profile
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Admin } from '../models/Admin';
import { Doctor } from '../models/Doctor';
import { Pharmacist } from '../models/Pharmacist';
import { Pathologist } from '../models/Pathologist';

// Create the context
const AppContext = createContext(undefined);

/**
 * AppProvider Component
 * Wraps the application and provides state to all children
 */
export const AppProvider = ({ children }) => {
  // State for current user (can be Admin, Doctor, Pharmacist, Pathologist, or null)
  const [user, setUserState] = useState(null);
  
  // State for authentication token
  const [token, setTokenState] = useState(null);

  // State for loading
  const [isLoading, setIsLoading] = useState(false);

  // Track if we're checking authentication on mount
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Initialize state from localStorage on mount
  useEffect(() => {
    const loadStoredAuth = () => {
      setIsCheckingAuth(true);
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        
        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setTokenState(storedToken);
          
          // Reconstruct user object based on role
          let reconstructedUser = null;
          if (userData.role === 'admin' || userData.role === 'superadmin') {
            reconstructedUser = Admin.fromJSON(userData);
          } else if (userData.role === 'doctor') {
            reconstructedUser = Doctor.fromJSON(userData);
          } else if (userData.role === 'pharmacist') {
            reconstructedUser = Pharmacist.fromJSON(userData);
          } else if (userData.role === 'pathologist') {
            reconstructedUser = Pathologist.fromJSON(userData);
          }
          
          if (reconstructedUser) {
            setUserState(reconstructedUser);
            console.log('✅ [AppContext] Restored user from localStorage:', userData.fullName);
          }
        } else {
          console.log('⚠️ [AppContext] No stored authentication found');
        }
      } catch (error) {
        console.error('❌ [AppContext] Error loading stored authentication:', error);
        // Clear corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    loadStoredAuth();
  }, []);

  /**
   * Sets the user and token after successful login
   * Equivalent to Flutter's setUser() method
   */
  const setUser = useCallback((newUser, newToken) => {
    setUserState(newUser);
    setTokenState(newToken);
    
    // Persist to localStorage
    if (newUser && newToken) {
      try {
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('authUser', JSON.stringify(newUser.toJSON()));
      } catch (error) {
        console.error('Error saving authentication:', error);
      }
    }
  }, []);

  /**
   * Clears user session data
   * Equivalent to Flutter's signOut() method
   */
  const signOut = useCallback(() => {
    setUserState(null);
    setTokenState(null);
    
    // Clear from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('selectedModule'); // Clear any cached module selection
  }, []);

  /**
   * Updates user data without changing token
   * Useful for profile updates
   */
  const updateUser = useCallback((updatedUser) => {
    setUserState(updatedUser);
    
    // Update localStorage
    if (updatedUser) {
      try {
        localStorage.setItem('authUser', JSON.stringify(updatedUser.toJSON()));
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    }
  }, []);

  // Computed properties (equivalent to Flutter getters)
  const isLoggedIn = user !== null && token !== null;
  const isAdmin = user instanceof Admin;
  const isDoctor = user instanceof Doctor;
  const isPharmacist = user instanceof Pharmacist;
  const isPathologist = user instanceof Pathologist;

  // Get user role string
  const userRole = user ? user.role : null;

  // Get user ID
  const userId = user ? user.id : null;

  // Get user name
  const userName = user ? user.fullName : null;

  // Context value
  const value = {
    // State
    user,
    token,
    isLoading,
    isCheckingAuth,
    
    // Actions
    setUser,
    signOut,
    updateUser,
    setIsLoading,
    
    // Computed properties
    isLoggedIn,
    isAdmin,
    isDoctor,
    isPharmacist,
    isPathologist,
    userRole,
    userId,
    userName,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Custom hook to use the AppContext
 * Usage: const { user, isLoggedIn, signOut } = useApp();
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

/**
 * HOC to wrap components that require authentication
 */
export const withAuth = (Component) => {
  return (props) => {
    const { isLoggedIn } = useApp();
    
    if (!isLoggedIn) {
      // Redirect to login or show unauthorized message
      return <div>Unauthorized. Please log in.</div>;
    }
    
    return <Component {...props} />;
  };
};

/**
 * HOC to check for specific role
 */
export const withRole = (Component, allowedRoles = []) => {
  return (props) => {
    const { isLoggedIn, userRole } = useApp();
    
    if (!isLoggedIn) {
      return <div>Unauthorized. Please log in.</div>;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <div>Access Denied. Insufficient permissions.</div>;
    }
    
    return <Component {...props} />;
  };
};

export default AppContext;

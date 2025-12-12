/**
 * NotificationContext.js
 * Manages notification/toast messages and alerts
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(undefined);

let notificationId = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * Add a notification
   * @param {string} message - The notification message
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in ms (0 = permanent)
   */
  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++notificationId;
    const notification = {
      id,
      message,
      type,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, duration) => 
    addNotification(message, 'success', duration), [addNotification]);
  
  const error = useCallback((message, duration) => 
    addNotification(message, 'error', duration), [addNotification]);
  
  const warning = useCallback((message, duration) => 
    addNotification(message, 'warning', duration), [addNotification]);
  
  const info = useCallback((message, duration) => 
    addNotification(message, 'info', duration), [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;

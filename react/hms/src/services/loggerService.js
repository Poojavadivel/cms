/**
 * loggerService.js
 * 
 * Comprehensive logging system for Frontend React Application
 * Logs all API calls, user actions, navigation events, errors, and auth state changes
 * 
 * Features:
 * - Console logging with timestamps and emojis
 * - localStorage persistence for session logs
 * - Export logs functionality
 * - Log levels: INFO, WARN, ERROR, SUCCESS, API
 */

class LoggerService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Maximum logs to keep in memory
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    
    // Load existing logs from localStorage
    this.loadLogsFromStorage();
    
    // Log session start
    this.info('SYSTEM', 'Logger initialized', { sessionId: this.sessionId });
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current timestamp in readable format
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log entry
   */
  formatLogEntry(level, category, message, data = null) {
    return {
      timestamp: this.getTimestamp(),
      level,
      category,
      message,
      data,
      sessionId: this.sessionId,
    };
  }

  /**
   * Add log entry to memory and localStorage
   */
  addLog(entry) {
    this.logs.push(entry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Save to localStorage
    this.saveLogsToStorage();
  }

  /**
   * Save logs to localStorage
   */
  saveLogsToStorage() {
    try {
      const logsToSave = this.logs.slice(-200); // Save last 200 logs
      localStorage.setItem('app_logs', JSON.stringify(logsToSave));
      localStorage.setItem('app_logs_session', this.sessionId);
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadLogsFromStorage() {
    try {
      const savedLogs = localStorage.getItem('app_logs');
      const savedSession = localStorage.getItem('app_logs_session');
      
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        
        // If it's a new session, prefix old logs
        if (savedSession !== this.sessionId) {
          this.logs = parsedLogs.map(log => ({
            ...log,
            isPreviousSession: true,
          }));
        } else {
          this.logs = parsedLogs;
        }
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
    }
  }

  /**
   * General log method
   */
  log(level, category, message, data = null, emoji = '📝') {
    const entry = this.formatLogEntry(level, category, message, data);
    this.addLog(entry);
    
    // Console output with color and emoji
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${emoji} [${timestamp}] [${level}] [${category}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage, data || '');
        break;
      case 'WARN':
        console.warn(logMessage, data || '');
        break;
      case 'SUCCESS':
        console.log(`%c${logMessage}`, 'color: #10b981; font-weight: bold', data || '');
        break;
      case 'API':
        console.log(`%c${logMessage}`, 'color: #3b82f6; font-weight: bold', data || '');
        break;
      default:
        console.log(logMessage, data || '');
    }
  }

  // Convenience methods
  info(category, message, data = null) {
    this.log('INFO', category, message, data, 'ℹ️');
  }

  success(category, message, data = null) {
    this.log('SUCCESS', category, message, data, '✅');
  }

  error(category, message, data = null) {
    this.log('ERROR', category, message, data, '❌');
  }

  warn(category, message, data = null) {
    this.log('WARN', category, message, data, '⚠️');
  }

  /**
   * API Call Logging
   */
  apiRequest(method, url, data = null) {
    this.log('API', 'REQUEST', `${method} ${url}`, data, '🔵');
  }

  apiResponse(method, url, status, data = null) {
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    this.log('API', 'RESPONSE', `${method} ${url} - ${status}`, data, emoji);
  }

  apiError(method, url, error) {
    this.log('ERROR', 'API', `${method} ${url} - ${error.message}`, {
      error: error.message,
      stack: error.stack,
    }, '❌');
  }

  /**
   * Auth Logging
   */
  authLogin(email, role) {
    this.success('AUTH', `User logged in: ${email} (${role})`);
  }

  authLogout(email) {
    this.info('AUTH', `User logged out: ${email}`);
  }

  authTokenValidated(email, role) {
    this.success('AUTH', `Token validated: ${email} (${role})`);
  }

  authTokenExpired() {
    this.warn('AUTH', 'Token expired, redirecting to login');
  }

  authError(message) {
    this.error('AUTH', message);
  }

  /**
   * Navigation Logging
   */
  navigate(from, to, user = null) {
    this.info('NAVIGATION', `${from} → ${to}`, { user });
  }

  /**
   * User Action Logging
   */
  userAction(action, details = null) {
    this.info('USER_ACTION', action, details);
  }

  /**
   * Component Lifecycle Logging (for debugging)
   */
  componentMount(componentName) {
    this.log('DEBUG', 'COMPONENT', `${componentName} mounted`, null, '🔧');
  }

  componentUnmount(componentName) {
    this.log('DEBUG', 'COMPONENT', `${componentName} unmounted`, null, '🔧');
  }

  /**
   * Get all logs
   */
  getAllLogs() {
    return this.logs;
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get API logs only
   */
  getAPILogs() {
    return this.logs.filter(log => log.level === 'API');
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
    this.info('SYSTEM', 'Logs cleared');
  }

  /**
   * Export logs as JSON
   */
  exportLogsJSON() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${this.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.success('SYSTEM', 'Logs exported as JSON');
  }

  /**
   * Export logs as CSV
   */
  exportLogsCSV() {
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Data'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.category,
      log.message,
      log.data ? JSON.stringify(log.data) : '',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${this.sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.success('SYSTEM', 'Logs exported as CSV');
  }

  /**
   * Print logs to console (for debugging)
   */
  printLogs(filter = null) {
    const logsToPrint = filter
      ? this.logs.filter(log => 
          log.level === filter || log.category === filter
        )
      : this.logs;
    
    console.table(logsToPrint);
  }

  /**
   * Get session statistics
   */
  getStats() {
    const stats = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime.getTime(),
      totalLogs: this.logs.length,
      byLevel: {},
      byCategory: {},
    };
    
    // Count by level
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Print stats to console
   */
  printStats() {
    const stats = this.getStats();
    console.log('📊 Session Statistics:', stats);
  }
}

// Create singleton instance
const logger = new LoggerService();

// Expose logger globally for debugging (window.appLogger in browser console)
if (typeof window !== 'undefined') {
  window.appLogger = logger;
}

export default logger;

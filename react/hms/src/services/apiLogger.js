/**
 * apiLogger.js
 * Comprehensive API call logger for frontend
 * Logs EVERY API action with request/response details
 */

class APILogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs
    this.enabled = true;
    this.logToConsole = true;
    this.logToStorage = true;
    this.storageKey = 'hms_api_logs';
    
    // Load existing logs from localStorage
    this.loadLogs();
  }

  /**
   * Log API request
   */
  logRequest(method, url, options = {}) {
    if (!this.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'REQUEST',
      method: method.toUpperCase(),
      url,
      headers: options.headers || {},
      body: options.body ? this.parseBody(options.body) : null,
      params: options.params || null,
      user: this.getCurrentUser(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
    };

    this.addLog(logEntry);

    if (this.logToConsole) {
      console.group(`🔵 API REQUEST: ${method.toUpperCase()} ${url}`);
      console.log('📅 Timestamp:', logEntry.timestamp);
      console.log('🆔 Log ID:', logEntry.id);
      console.log('👤 User:', logEntry.user);
      console.log('📝 Headers:', logEntry.headers);
      if (logEntry.body) console.log('📦 Body:', logEntry.body);
      if (logEntry.params) console.log('🔍 Params:', logEntry.params);
      console.groupEnd();
    }

    return logEntry.id;
  }

  /**
   * Log API response
   */
  logResponse(requestId, status, data, duration) {
    if (!this.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      requestId,
      timestamp: new Date().toISOString(),
      type: 'RESPONSE',
      status,
      statusText: this.getStatusText(status),
      data: this.sanitizeData(data),
      duration: `${duration}ms`,
      success: status >= 200 && status < 300,
      user: this.getCurrentUser(),
      sessionId: this.getSessionId(),
    };

    this.addLog(logEntry);

    if (this.logToConsole) {
      const emoji = logEntry.success ? '✅' : '❌';
      console.group(`${emoji} API RESPONSE: ${status} (${duration}ms)`);
      console.log('📅 Timestamp:', logEntry.timestamp);
      console.log('🆔 Log ID:', logEntry.id);
      console.log('🔗 Request ID:', requestId);
      console.log('👤 User:', logEntry.user);
      console.log('📊 Status:', `${status} ${logEntry.statusText}`);
      console.log('⏱️ Duration:', duration + 'ms');
      console.log('📦 Data:', logEntry.data);
      console.groupEnd();
    }

    return logEntry.id;
  }

  /**
   * Log API error
   */
  logError(requestId, error, duration) {
    if (!this.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      requestId,
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        status: error.status || null,
        data: error.data || null,
      },
      duration: duration ? `${duration}ms` : 'N/A',
      user: this.getCurrentUser(),
      sessionId: this.getSessionId(),
    };

    this.addLog(logEntry);

    if (this.logToConsole) {
      console.group(`❌ API ERROR: ${error.message}`);
      console.log('📅 Timestamp:', logEntry.timestamp);
      console.log('🆔 Log ID:', logEntry.id);
      console.log('🔗 Request ID:', requestId);
      console.log('👤 User:', logEntry.user);
      console.log('⚠️ Error Name:', error.name);
      console.log('💬 Error Message:', error.message);
      if (error.status) console.log('📊 Status:', error.status);
      if (error.data) console.log('📦 Error Data:', error.data);
      console.log('⏱️ Duration:', logEntry.duration);
      console.log('📚 Stack Trace:', error.stack);
      console.groupEnd();
    }

    // Also log to console.error for visibility
    console.error('API Error:', error);

    return logEntry.id;
  }

  /**
   * Log navigation action
   */
  logNavigation(from, to, action = 'NAVIGATE') {
    if (!this.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'NAVIGATION',
      action,
      from,
      to,
      user: this.getCurrentUser(),
      sessionId: this.getSessionId(),
    };

    this.addLog(logEntry);

    if (this.logToConsole) {
      console.log(`🧭 NAVIGATION: ${from} → ${to} (${action})`);
    }

    return logEntry.id;
  }

  /**
   * Log authentication action
   */
  logAuth(action, data = {}) {
    if (!this.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'AUTH',
      action, // LOGIN, LOGOUT, REFRESH_TOKEN, etc.
      data: this.sanitizeData(data),
      user: action === 'LOGOUT' ? data.user : this.getCurrentUser(),
      sessionId: this.getSessionId(),
    };

    this.addLog(logEntry);

    if (this.logToConsole) {
      console.log(`🔐 AUTH: ${action}`, data);
    }

    return logEntry.id;
  }

  /**
   * Log user action
   */
  logUserAction(action, details = {}) {
    if (!this.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'USER_ACTION',
      action,
      details,
      user: this.getCurrentUser(),
      sessionId: this.getSessionId(),
      page: window.location.pathname,
    };

    this.addLog(logEntry);

    if (this.logToConsole) {
      console.log(`👆 USER ACTION: ${action}`, details);
    }

    return logEntry.id;
  }

  /**
   * Log performance metric
   */
  logPerformance(metric, value, context = {}) {
    if (!this.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      type: 'PERFORMANCE',
      metric,
      value,
      unit: 'ms',
      context,
      user: this.getCurrentUser(),
      sessionId: this.getSessionId(),
    };

    this.addLog(logEntry);

    if (this.logToConsole) {
      console.log(`⚡ PERFORMANCE: ${metric} = ${value}ms`, context);
    }

    return logEntry.id;
  }

  /**
   * Add log entry
   */
  addLog(logEntry) {
    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to localStorage if enabled
    if (this.logToStorage) {
      this.saveLogs();
    }
  }

  /**
   * Get all logs
   */
  getLogs(filter = {}) {
    let filteredLogs = [...this.logs];

    if (filter.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filter.type);
    }

    if (filter.user) {
      filteredLogs = filteredLogs.filter(log => log.user === filter.user);
    }

    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(filter.startDate));
    }

    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(filter.endDate));
    }

    if (filter.method) {
      filteredLogs = filteredLogs.filter(log => log.method === filter.method);
    }

    if (filter.status) {
      filteredLogs = filteredLogs.filter(log => log.status === filter.status);
    }

    if (filter.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === filter.success);
    }

    return filteredLogs;
  }

  /**
   * Get logs by type
   */
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type);
  }

  /**
   * Get API requests
   */
  getRequests() {
    return this.getLogsByType('REQUEST');
  }

  /**
   * Get API responses
   */
  getResponses() {
    return this.getLogsByType('RESPONSE');
  }

  /**
   * Get API errors
   */
  getErrors() {
    return this.getLogsByType('ERROR');
  }

  /**
   * Get failed requests
   */
  getFailedRequests() {
    return this.logs.filter(log => log.type === 'RESPONSE' && !log.success);
  }

  /**
   * Get successful requests
   */
  getSuccessfulRequests() {
    return this.logs.filter(log => log.type === 'RESPONSE' && log.success);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const requests = this.getRequests();
    const responses = this.getResponses();
    const errors = this.getErrors();
    const successful = this.getSuccessfulRequests();
    const failed = this.getFailedRequests();

    const durations = responses
      .map(r => parseInt(r.duration))
      .filter(d => !isNaN(d));

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;

    return {
      totalRequests: requests.length,
      totalResponses: responses.length,
      totalErrors: errors.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: requests.length > 0 ? (successful.length / requests.length * 100).toFixed(2) + '%' : '0%',
      averageDuration: avgDuration.toFixed(2) + 'ms',
      maxDuration: maxDuration + 'ms',
      minDuration: minDuration + 'ms',
      totalLogs: this.logs.length,
      logsByType: {
        REQUEST: this.getLogsByType('REQUEST').length,
        RESPONSE: this.getLogsByType('RESPONSE').length,
        ERROR: this.getLogsByType('ERROR').length,
        NAVIGATION: this.getLogsByType('NAVIGATION').length,
        AUTH: this.getLogsByType('AUTH').length,
        USER_ACTION: this.getLogsByType('USER_ACTION').length,
        PERFORMANCE: this.getLogsByType('PERFORMANCE').length,
      },
    };
  }

  /**
   * Export logs
   */
  exportLogs(format = 'json') {
    const data = {
      exportDate: new Date().toISOString(),
      totalLogs: this.logs.length,
      statistics: this.getStatistics(),
      logs: this.logs,
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'csv') {
      return this.convertToCSV(data.logs);
    }

    return data;
  }

  /**
   * Download logs as file
   */
  downloadLogs(format = 'json') {
    const data = this.exportLogs(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hms-api-logs-${new Date().toISOString()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Convert logs to CSV
   */
  convertToCSV(logs) {
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map(log => {
      return Object.values(log).map(value => {
        if (typeof value === 'object') {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        return String(value).replace(/"/g, '""');
      }).join(',');
    });

    return [headers, ...rows].join('\n');
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ All logs cleared');
  }

  /**
   * Save logs to localStorage
   */
  saveLogs() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
      this.logs = [];
    }
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`📝 API Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable/disable console logging
   */
  setConsoleLogging(enabled) {
    this.logToConsole = enabled;
  }

  /**
   * Enable/disable storage logging
   */
  setStorageLogging(enabled) {
    this.logToStorage = enabled;
  }

  /**
   * Helper: Generate unique log ID
   */
  generateLogId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Get current user
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.email || user.username || user.id || 'Unknown';
      }
    } catch (error) {
      // Ignore
    }
    return 'Anonymous';
  }

  /**
   * Helper: Get session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateLogId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Helper: Parse request body
   */
  parseBody(body) {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch (error) {
        return body;
      }
    }
    return body;
  }

  /**
   * Helper: Sanitize sensitive data
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Helper: Get HTTP status text
   */
  getStatusText(status) {
    const statusTexts = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return statusTexts[status] || 'Unknown';
  }

  /**
   * Print statistics to console
   */
  printStatistics() {
    const stats = this.getStatistics();
    console.group('📊 API Logger Statistics');
    console.log('Total Requests:', stats.totalRequests);
    console.log('Total Responses:', stats.totalResponses);
    console.log('Total Errors:', stats.totalErrors);
    console.log('Successful Requests:', stats.successfulRequests);
    console.log('Failed Requests:', stats.failedRequests);
    console.log('Success Rate:', stats.successRate);
    console.log('Average Duration:', stats.averageDuration);
    console.log('Max Duration:', stats.maxDuration);
    console.log('Min Duration:', stats.minDuration);
    console.log('Total Logs:', stats.totalLogs);
    console.log('Logs by Type:', stats.logsByType);
    console.groupEnd();
  }
}

// Create singleton instance
const apiLogger = new APILogger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.apiLogger = apiLogger;
}

export default apiLogger;

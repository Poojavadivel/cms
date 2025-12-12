/**
 * apiLogger.js
 * Centralized API logging utility for frontend
 * 
 * This logs all API calls, responses, and errors similar to Flutter's logging
 * Can be configured to log to console, file, or external service
 */

class ApiLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    this.enabled = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENABLE_API_LOGS === 'true';
  }

  /**
   * Format timestamp
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * Create log entry
   */
  createLogEntry(type, data) {
    const entry = {
      timestamp: this.getTimestamp(),
      type,
      ...data
    };

    // Add to memory (circular buffer)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    return entry;
  }

  /**
   * Log API request
   */
  logRequest(method, url, data, headers) {
    if (!this.enabled) return;

    const entry = this.createLogEntry('REQUEST', {
      method,
      url,
      data: data ? JSON.stringify(data) : null,
      headers: this.sanitizeHeaders(headers)
    });

    console.log(
      `%c🚀 [API REQUEST] ${method} ${url}`,
      'color: #3b82f6; font-weight: bold',
      entry
    );
  }

  /**
   * Log API response
   */
  logResponse(method, url, status, data, duration) {
    if (!this.enabled) return;

    const entry = this.createLogEntry('RESPONSE', {
      method,
      url,
      status,
      data: data ? JSON.stringify(data) : null,
      duration: `${duration}ms`
    });

    const color = status >= 200 && status < 300 ? '#10b981' : '#ef4444';
    console.log(
      `%c✅ [API RESPONSE] ${method} ${url} - ${status} (${duration}ms)`,
      `color: ${color}; font-weight: bold`,
      entry
    );
  }

  /**
   * Log API error
   */
  logError(method, url, error, duration) {
    if (!this.enabled) return;

    const entry = this.createLogEntry('ERROR', {
      method,
      url,
      error: error.message || error,
      stack: error.stack,
      duration: duration ? `${duration}ms` : 'N/A'
    });

    console.error(
      `%c❌ [API ERROR] ${method} ${url}`,
      'color: #ef4444; font-weight: bold',
      entry
    );
  }

  /**
   * Log authentication events
   */
  logAuth(event, details) {
    if (!this.enabled) return;

    const entry = this.createLogEntry('AUTH', {
      event,
      details
    });

    console.log(
      `%c🔐 [AUTH] ${event}`,
      'color: #8b5cf6; font-weight: bold',
      entry
    );
  }

  /**
   * Log navigation events
   */
  logNavigation(from, to, user) {
    if (!this.enabled) return;

    const entry = this.createLogEntry('NAVIGATION', {
      from,
      to,
      user: user ? user.fullName : 'Guest'
    });

    console.log(
      `%c🧭 [NAVIGATION] ${from} → ${to}`,
      'color: #f59e0b; font-weight: bold',
      entry
    );
  }

  /**
   * Sanitize headers to remove sensitive data
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer [REDACTED]';
    }
    if (sanitized.authorization) {
      sanitized.authorization = 'Bearer [REDACTED]';
    }
    return sanitized;
  }

  /**
   * Get all logs
   */
  getAllLogs() {
    return this.logs;
  }

  /**
   * Filter logs by type
   */
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type);
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    console.log('%c🗑️ [LOGGER] Logs cleared', 'color: #6b7280; font-weight: bold');
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(
      `%c⚙️ [LOGGER] Logging ${enabled ? 'enabled' : 'disabled'}`,
      'color: #6b7280; font-weight: bold'
    );
  }
}

// Create singleton instance
const apiLogger = new ApiLogger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.apiLogger = apiLogger;
}

export default apiLogger;

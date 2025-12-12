/**
 * fileLogger.js
 * Professional file-based logging system with Winston
 * Logs EVERY action to app.log files with daily rotation
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logs directory structure
const logsDir = 'logs';

// Daily rotate file transport for all logs
const dailyRotateFileTransport = new DailyRotateFile({
  filename: `${logsDir}/app-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    json()
  )
});

// Daily rotate file transport for errors only
const errorRotateFileTransport = new DailyRotateFile({
  level: 'error',
  filename: `${logsDir}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    json()
  )
});

// Daily rotate file transport for API calls
const apiRotateFileTransport = new DailyRotateFile({
  filename: `${logsDir}/api-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    json()
  )
});

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    customFormat
  )
});

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    json()
  ),
  defaultMeta: { service: 'hms-frontend' },
  transports: [
    dailyRotateFileTransport,
    errorRotateFileTransport,
    consoleTransport
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: `${logsDir}/exceptions-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: `${logsDir}/rejections-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    })
  ]
});

// API logger instance
const apiLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    json()
  ),
  defaultMeta: { service: 'hms-api' },
  transports: [
    apiRotateFileTransport,
    consoleTransport
  ]
});

/**
 * Enhanced logging class with file support
 */
class FileLogger {
  constructor() {
    this.winston = logger;
    this.apiWinston = apiLogger;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Log session start
    this.logSessionStart();
  }

  /**
   * Log session start
   */
  logSessionStart() {
    logger.info('🚀 Session Started', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
      language: typeof navigator !== 'undefined' ? navigator.language : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });
  }

  /**
   * Log API request
   */
  logApiRequest(method, url, options = {}) {
    const logData = {
      type: 'API_REQUEST',
      sessionId: this.sessionId,
      method: method.toUpperCase(),
      url,
      headers: this.sanitizeHeaders(options.headers),
      body: options.body ? this.sanitizeBody(options.body) : null,
      params: options.params || null,
      user: this.getCurrentUser(),
      timestamp: new Date().toISOString(),
    };

    apiLogger.info(`📤 API Request: ${method.toUpperCase()} ${url}`, logData);
    logger.info(`API Request: ${method.toUpperCase()} ${url}`, logData);

    return logData;
  }

  /**
   * Log API response
   */
  logApiResponse(method, url, status, data, duration) {
    const success = status >= 200 && status < 300;
    const logData = {
      type: 'API_RESPONSE',
      sessionId: this.sessionId,
      method: method.toUpperCase(),
      url,
      status,
      statusText: this.getStatusText(status),
      duration: `${duration}ms`,
      success,
      dataSize: JSON.stringify(data).length,
      user: this.getCurrentUser(),
      timestamp: new Date().toISOString(),
    };

    const emoji = success ? '✅' : '❌';
    const logLevel = success ? 'info' : 'warn';
    
    apiLogger[logLevel](`${emoji} API Response: ${status} (${duration}ms)`, logData);
    logger[logLevel](`API Response: ${method.toUpperCase()} ${url} - ${status}`, logData);

    return logData;
  }

  /**
   * Log API error
   */
  logApiError(method, url, error, duration = null) {
    const logData = {
      type: 'API_ERROR',
      sessionId: this.sessionId,
      method: method.toUpperCase(),
      url,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        status: error.status || null,
        code: error.code || null,
      },
      duration: duration ? `${duration}ms` : 'N/A',
      user: this.getCurrentUser(),
      timestamp: new Date().toISOString(),
    };

    apiLogger.error(`❌ API Error: ${error.message}`, logData);
    logger.error(`API Error: ${method.toUpperCase()} ${url}`, logData);

    return logData;
  }

  /**
   * Log authentication action
   */
  logAuth(action, data = {}) {
    const logData = {
      type: 'AUTH',
      sessionId: this.sessionId,
      action,
      user: data.email || data.username || this.getCurrentUser(),
      success: data.success !== undefined ? data.success : true,
      timestamp: new Date().toISOString(),
      ...this.sanitizeData(data)
    };

    logger.info(`🔐 Auth: ${action}`, logData);

    return logData;
  }

  /**
   * Log navigation
   */
  logNavigation(from, to, action = 'NAVIGATE') {
    const logData = {
      type: 'NAVIGATION',
      sessionId: this.sessionId,
      action,
      from,
      to,
      user: this.getCurrentUser(),
      timestamp: new Date().toISOString(),
    };

    logger.info(`🧭 Navigation: ${from} → ${to}`, logData);

    return logData;
  }

  /**
   * Log user action
   */
  logUserAction(action, details = {}) {
    const logData = {
      type: 'USER_ACTION',
      sessionId: this.sessionId,
      action,
      details,
      user: this.getCurrentUser(),
      page: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      timestamp: new Date().toISOString(),
    };

    logger.info(`👆 User Action: ${action}`, logData);

    return logData;
  }

  /**
   * Log error
   */
  logError(error, context = {}) {
    const logData = {
      type: 'ERROR',
      sessionId: this.sessionId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      user: this.getCurrentUser(),
      page: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      timestamp: new Date().toISOString(),
    };

    logger.error(`❌ Error: ${error.message}`, logData);

    return logData;
  }

  /**
   * Log warning
   */
  logWarning(message, data = {}) {
    const logData = {
      type: 'WARNING',
      sessionId: this.sessionId,
      message,
      data,
      user: this.getCurrentUser(),
      timestamp: new Date().toISOString(),
    };

    logger.warn(`⚠️ Warning: ${message}`, logData);

    return logData;
  }

  /**
   * Log info
   */
  logInfo(message, data = {}) {
    const logData = {
      type: 'INFO',
      sessionId: this.sessionId,
      message,
      data,
      user: this.getCurrentUser(),
      timestamp: new Date().toISOString(),
    };

    logger.info(`ℹ️ Info: ${message}`, logData);

    return logData;
  }

  /**
   * Log debug
   */
  logDebug(message, data = {}) {
    const logData = {
      type: 'DEBUG',
      sessionId: this.sessionId,
      message,
      data,
      user: this.getCurrentUser(),
      timestamp: new Date().toISOString(),
    };

    logger.debug(`🔍 Debug: ${message}`, logData);

    return logData;
  }

  /**
   * Log performance metric
   */
  logPerformance(metric, value, context = {}) {
    const logData = {
      type: 'PERFORMANCE',
      sessionId: this.sessionId,
      metric,
      value,
      unit: 'ms',
      context,
      user: this.getCurrentUser(),
      timestamp: new Date().toISOString(),
    };

    logger.info(`⚡ Performance: ${metric} = ${value}ms`, logData);

    return logData;
  }

  /**
   * Helper: Generate session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Get current user
   */
  getCurrentUser() {
    try {
      if (typeof localStorage === 'undefined') return 'N/A';
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
   * Helper: Sanitize headers
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'x-auth-token', 'cookie'];
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }

  /**
   * Helper: Sanitize body
   */
  sanitizeBody(body) {
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return body;
      }
    }
    return this.sanitizeData(body);
  }

  /**
   * Helper: Sanitize sensitive data
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
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
   * Get Winston logger instance
   */
  getWinston() {
    return this.winston;
  }

  /**
   * Get API Winston logger instance
   */
  getApiWinston() {
    return this.apiWinston;
  }
}

// Create singleton instance
const fileLogger = new FileLogger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.fileLogger = fileLogger;
}

export default fileLogger;
export { logger, apiLogger };

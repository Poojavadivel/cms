// Server/utils/apiLogger.js
// Comprehensive API logging utility for tracking costs and performance

const { APILog } = require('../Models');

class APILogger {
  constructor() {
    this.requestId = null;
    this.startTime = null;
    this.requestData = {};
  }

  /**
   * Start logging an API request
   */
  startRequest(options = {}) {
    this.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = new Date();
    
    this.requestData = {
      requestId: this.requestId,
      timestamp: this.startTime,
      apiProvider: options.apiProvider || 'openai-compatible',
      apiUrl: options.apiUrl || process.env.OPENAI_API_URL,
      model: options.model || process.env.AI_MODEL,
      userId: options.userId || null,
      userRole: options.userRole || null,
      userName: options.userName || null,
      endpoint: options.endpoint || 'unknown', // 'chatbot' or 'scanner'
      requestType: options.requestType || 'unknown',
      requestMessages: options.messages || [],
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1500,
      sessionId: options.sessionId || null,
      conversationId: options.conversationId || null,
      metadata: options.metadata || {}
    };

    console.log(`[API Logger] Started request: ${this.requestId}`);
    return this.requestId;
  }

  /**
   * Log successful API response
   */
  async logSuccess(response, options = {}) {
    const endTime = new Date();
    const responseTimeMs = endTime - this.startTime;

    const logData = {
      ...this.requestData,
      endTime,
      responseTimeMs,
      status: 'success',
      statusCode: 200,
      
      // Extract from API response
      responseContent: options.responseContent || response?.choices?.[0]?.message?.reasoning_content || response?.choices?.[0]?.message?.content || '',
      requestTokens: response?.usage?.prompt_tokens || 0,
      responseTokens: response?.usage?.completion_tokens || 0,
      totalTokens: response?.usage?.total_tokens || 0,
      
      // Cost calculation (update with your actual pricing)
      costPerToken: options.costPerToken || 0.00002, // Example: $0.00002 per token
      estimatedCost: (response?.usage?.total_tokens || 0) * (options.costPerToken || 0.00002)
    };

    try {
      const apiLog = new APILog(logData);
      await apiLog.save();
      
      console.log(`[API Logger] ✅ Success logged: ${this.requestId}`);
      console.log(`   Tokens: ${logData.totalTokens} | Time: ${responseTimeMs}ms | Cost: $${logData.estimatedCost.toFixed(6)}`);
      
      return apiLog;
    } catch (error) {
      console.error(`[API Logger] ❌ Failed to save log:`, error.message);
      return null;
    }
  }

  /**
   * Log failed API request
   */
  async logError(error, options = {}) {
    const endTime = new Date();
    const responseTimeMs = endTime - this.startTime;

    const logData = {
      ...this.requestData,
      endTime,
      responseTimeMs,
      status: 'error',
      statusCode: options.statusCode || 500,
      errorMessage: error.message || 'Unknown error',
      errorStack: error.stack || null,
      retryCount: options.retryCount || 0
    };

    try {
      const apiLog = new APILog(logData);
      await apiLog.save();
      
      console.log(`[API Logger] ❌ Error logged: ${this.requestId}`);
      console.log(`   Error: ${logData.errorMessage}`);
      
      return apiLog;
    } catch (saveError) {
      console.error(`[API Logger] ❌ Failed to save error log:`, saveError.message);
      return null;
    }
  }

  /**
   * Log retry attempt
   */
  async logRetry(retryCount, reason) {
    const endTime = new Date();
    const responseTimeMs = endTime - this.startTime;

    const logData = {
      ...this.requestData,
      endTime,
      responseTimeMs,
      status: 'retry',
      statusCode: 0,
      retryCount,
      errorMessage: `Retry attempt ${retryCount}: ${reason}`
    };

    try {
      const apiLog = new APILog(logData);
      await apiLog.save();
      
      console.log(`[API Logger] 🔄 Retry logged: ${this.requestId} (attempt ${retryCount})`);
      
      return apiLog;
    } catch (error) {
      console.error(`[API Logger] ❌ Failed to save retry log:`, error.message);
      return null;
    }
  }

  /**
   * Log circuit breaker trip
   */
  async logCircuitBreaker(reason) {
    const endTime = new Date();
    const responseTimeMs = endTime - this.startTime;

    const logData = {
      ...this.requestData,
      endTime,
      responseTimeMs,
      status: 'circuit_breaker',
      statusCode: 503,
      errorMessage: `Circuit breaker tripped: ${reason}`
    };

    try {
      const apiLog = new APILog(logData);
      await apiLog.save();
      
      console.log(`[API Logger] ⚡ Circuit breaker logged: ${this.requestId}`);
      
      return apiLog;
    } catch (error) {
      console.error(`[API Logger] ❌ Failed to save circuit breaker log:`, error.message);
      return null;
    }
  }
}

/**
 * Helper function to create a new logger instance
 */
function createLogger() {
  return new APILogger();
}

/**
 * Analytics functions
 */
const analytics = {
  /**
   * Get total usage for a user in a date range
   */
  async getUserUsage(userId, startDate, endDate) {
    try {
      const result = await APILog.getTotalUsageByUser(userId, startDate, endDate);
      return result[0] || {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        avgResponseTime: 0
      };
    } catch (error) {
      console.error('[API Analytics] Error getting user usage:', error.message);
      return null;
    }
  },

  /**
   * Get usage by model
   */
  async getModelUsage(startDate, endDate) {
    try {
      return await APILog.getUsageByModel(startDate, endDate);
    } catch (error) {
      console.error('[API Analytics] Error getting model usage:', error.message);
      return [];
    }
  },

  /**
   * Get daily usage for last N days
   */
  async getDailyUsage(days = 30) {
    try {
      return await APILog.getDailyUsage(days);
    } catch (error) {
      console.error('[API Analytics] Error getting daily usage:', error.message);
      return [];
    }
  },

  /**
   * Get error statistics
   */
  async getErrorStats(startDate, endDate) {
    try {
      return await APILog.getErrorStats(startDate, endDate);
    } catch (error) {
      console.error('[API Analytics] Error getting error stats:', error.message);
      return [];
    }
  },

  /**
   * Get usage summary for today
   */
  async getTodayUsage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const logs = await APILog.find({
        timestamp: { $gte: today, $lt: tomorrow },
        status: 'success'
      });

      const summary = {
        totalRequests: logs.length,
        totalTokens: logs.reduce((sum, log) => sum + log.totalTokens, 0),
        totalCost: logs.reduce((sum, log) => sum + log.estimatedCost, 0),
        avgResponseTime: logs.length > 0 ? logs.reduce((sum, log) => sum + log.responseTimeMs, 0) / logs.length : 0,
        byEndpoint: {},
        byModel: {}
      };

      // Group by endpoint
      logs.forEach(log => {
        if (!summary.byEndpoint[log.endpoint]) {
          summary.byEndpoint[log.endpoint] = { requests: 0, tokens: 0, cost: 0 };
        }
        summary.byEndpoint[log.endpoint].requests++;
        summary.byEndpoint[log.endpoint].tokens += log.totalTokens;
        summary.byEndpoint[log.endpoint].cost += log.estimatedCost;
      });

      // Group by model
      logs.forEach(log => {
        if (!summary.byModel[log.model]) {
          summary.byModel[log.model] = { requests: 0, tokens: 0, cost: 0 };
        }
        summary.byModel[log.model].requests++;
        summary.byModel[log.model].tokens += log.totalTokens;
        summary.byModel[log.model].cost += log.estimatedCost;
      });

      return summary;
    } catch (error) {
      console.error('[API Analytics] Error getting today usage:', error.message);
      return null;
    }
  }
};

module.exports = {
  createLogger,
  APILogger,
  analytics
};

/**
 * bot/index.js
 * Centralized exports for the bot module
 * Allows importing multiple functions from a single entry point
 */

// Configuration
const config = require('./config');

// System Prompts
const { getSystemPrompt, ENTERPRISE_SYSTEM_PROMPTS } = require('./systemPrompts');

// Circuit Breaker & Metrics
const {
  circuitBreaker,
  metrics,
  circuitIsOpen,
  recordFailure,
  recordSuccess,
  resetCircuit,
  recordLatency,
  resetMetrics,
  getHealthStatus
} = require('./circuitBreaker');

// AI Service
const { callGeminiChatWithRetries } = require('./aiService');

// Intent Extraction
const { extractIntent } = require('./intentExtractor');

// Context Building
const { buildEnhancedContext } = require('./contextBuilder');

// Entity Search
const { searchEntities, buildEntityContexts } = require('./entitySearch');

// Response Generation
const {
  generateGreetingResponse,
  generateNoDataResponse,
  generateAIResponse
} = require('./responseGenerator');

// Session Management
const {
  findOrCreateSessionForUser,
  appendMessagesToSession,
  saveAndReturnChat
} = require('./sessionManager');

// Chat Controller
const { handleChatRequest } = require('./chatController');

// Utilities
const {
  makeCid,
  sleep,
  safeParseJsonLike,
  buildPatientContext,
  buildStaffContext
} = require('./utils');

// Routes (default export)
const routes = require('./routes');

// Centralized exports
module.exports = {
  // Default router
  router: routes,
  
  // Configuration
  config,
  
  // System Prompts
  getSystemPrompt,
  ENTERPRISE_SYSTEM_PROMPTS,
  
  // Circuit Breaker
  circuitBreaker,
  metrics,
  circuitIsOpen,
  recordFailure,
  recordSuccess,
  resetCircuit,
  recordLatency,
  resetMetrics,
  getHealthStatus,
  
  // AI Service
  callGeminiChatWithRetries,
  
  // Intent & Context
  extractIntent,
  buildEnhancedContext,
  
  // Entity Search
  searchEntities,
  buildEntityContexts,
  
  // Response Generation
  generateGreetingResponse,
  generateNoDataResponse,
  generateAIResponse,
  
  // Session Management
  findOrCreateSessionForUser,
  appendMessagesToSession,
  saveAndReturnChat,
  
  // Controllers
  handleChatRequest,
  
  // Utilities
  makeCid,
  sleep,
  safeParseJsonLike,
  buildPatientContext,
  buildStaffContext
};

/**
 * Usage Examples:
 * 
 * // Import everything
 * const bot = require('./bot');
 * bot.router // Express router
 * bot.extractIntent(message, user, chatId)
 * 
 * // Import specific functions
 * const { extractIntent, buildEnhancedContext } = require('./bot');
 * 
 * // Import from specific module (more efficient)
 * const { extractIntent } = require('./bot/intentExtractor');
 */

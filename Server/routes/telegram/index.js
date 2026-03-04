/**
 * telegram/index.js
 * Centralized exports for telegram module
 */

// Main router
const routes = require('./routes');

// Bot instance
const bot = require('./botInstance');

// Configuration
const config = require('./config');

// Services
const geminiService = require('./geminiService');
const appointmentService = require('./appointmentService');

// State management
const stateManager = require('./stateManager');

// Handlers
const commandHandlers = require('./commandHandlers');
const messageHandler = require('./messageHandler');
const callbackHandler = require('./callbackHandler');

// Bot initializer
const { initializeBot } = require('./botInitializer');

// Centralized exports
module.exports = {
  // Default router
  router: routes,
  
  // Bot instance
  bot,
  
  // Configuration
  config,
  
  // Services
  geminiService,
  appointmentService,
  
  // State management
  stateManager,
  
  // Handlers
  commandHandlers,
  messageHandler,
  callbackHandler,
  
  // Initializer
  initializeBot
};

/**
 * Usage Examples:
 * 
 * // Import router (recommended)
 * const telegramRouter = require('./telegram/routes');
 * app.use('/api/telegram', telegramRouter);
 * 
 * // Import everything
 * const telegram = require('./telegram');
 * telegram.router // Express router
 * telegram.bot // Bot instance
 * 
 * // Import specific services
 * const { appointmentService, geminiService } = require('./telegram');
 */

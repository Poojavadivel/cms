/**
 * telegram/stateManager.js
 * Conversation state management
 */

const config = require('./config');

// In-memory conversation state management
const conversationState = new Map();

/**
 * Get or create conversation state
 * @param {string} chatId - Telegram chat ID
 * @returns {Object} Conversation state
 */
function getState(chatId) {
  if (!conversationState.has(chatId)) {
    conversationState.set(chatId, {
      step: 'idle',
      data: {},
      lastActivity: Date.now()
    });
  }
  return conversationState.get(chatId);
}

/**
 * Reset conversation state
 * @param {string} chatId - Telegram chat ID
 */
function resetState(chatId) {
  conversationState.set(chatId, {
    step: 'idle',
    data: {},
    lastActivity: Date.now()
  });
}

/**
 * Update state step
 * @param {string} chatId - Telegram chat ID
 * @param {string} step - New step
 */
function updateStep(chatId, step) {
  const state = getState(chatId);
  state.step = step;
  state.lastActivity = Date.now();
}

/**
 * Update state data
 * @param {string} chatId - Telegram chat ID
 * @param {Object} data - Data to merge
 */
function updateData(chatId, data) {
  const state = getState(chatId);
  Object.assign(state.data, data);
  state.lastActivity = Date.now();
}

/**
 * Clean up old conversation states
 */
function cleanupStaleStates() {
  const now = Date.now();
  const timeout = config.CONVERSATION_TIMEOUT;

  for (const [chatId, state] of conversationState.entries()) {
    if (now - state.lastActivity > timeout) {
      conversationState.delete(chatId);
      console.log(`🧹 Cleaned up stale conversation state for chat ${chatId}`);
    }
  }
}

/**
 * Start cleanup interval
 */
function startCleanupInterval() {
  setInterval(cleanupStaleStates, config.CLEANUP_INTERVAL);
  console.log('✅ Conversation cleanup interval started');
}

/**
 * Get conversation state size
 * @returns {number} Number of active conversations
 */
function getStateSize() {
  return conversationState.size;
}

module.exports = {
  getState,
  resetState,
  updateStep,
  updateData,
  cleanupStaleStates,
  startCleanupInterval,
  getStateSize
};

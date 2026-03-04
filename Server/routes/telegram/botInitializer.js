/**
 * telegram/botInitializer.js
 * Initialize bot with all command and message handlers
 */

const bot = require('./botInstance');
const {
  handleStart,
  handleHelp,
  handleBook,
  handleMyAppointments,
  handleRecords,
  handleCancel
} = require('./commandHandlers');
const { handleMessage } = require('./messageHandler');
const { handleCallbackQuery } = require('./callbackHandler');
const { startCleanupInterval } = require('./stateManager');

/**
 * Initialize all bot handlers
 */
function initializeBot() {
  console.log('🤖 Initializing Telegram Bot handlers...');

  // Command handlers
  bot.onText(/\/start/, handleStart);
  bot.onText(/\/help/, handleHelp);
  bot.onText(/\/book/, handleBook);
  bot.onText(/\/myappointments/, handleMyAppointments);
  bot.onText(/\/records/, handleRecords);
  bot.onText(/\/cancel/, handleCancel);

  // Text message handler
  bot.on('message', (msg) => {
    // Ignore command messages (handled by onText)
    if (msg.text && !msg.text.startsWith('/')) {
      handleMessage(msg);
    }
  });

  // Callback query handler
  bot.on('callback_query', handleCallbackQuery);

  // Start cleanup interval for stale conversations
  startCleanupInterval();

  console.log('✅ Telegram Bot handlers initialized successfully');
}

module.exports = {
  initializeBot
};

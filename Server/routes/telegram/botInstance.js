/**
 * telegram/botInstance.js
 * Telegram Bot instance initialization
 */

const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

let bot;

try {
  bot = new TelegramBot(config.TELEGRAM_API, {
    polling: {
      interval: config.POLLING_INTERVAL,
      autoStart: true,
      params: {
        timeout: config.POLLING_TIMEOUT
      }
    }
  });
  console.log('✅ Telegram Bot initialized successfully');
} catch (error) {
  console.error('⚠️ Telegram Bot failed to initialize:', error.message);
  // Create a dummy bot object to prevent crashes
  bot = {
    onText: () => {},
    on: () => {},
    sendMessage: () => Promise.resolve(),
    answerCallbackQuery: () => Promise.resolve(),
    editMessageReplyMarkup: () => Promise.resolve(),
    isPolling: () => false,
    stopPolling: () => Promise.resolve()
  };
}

// Error handling
bot.on('polling_error', (error) => {
  // Ignore common network errors that auto-recover
  if (error.code === 'EFATAL' || error.code === 'ECONNRESET') {
    console.warn('⚠️ Telegram polling connection error (will auto-recover):', error.message);
    return;
  }
  console.error('❌ Telegram Bot Polling Error:', error);
});

bot.on('error', (error) => {
  console.error('❌ Telegram Bot Error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Stopping Telegram bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping Telegram bot...');
  bot.stopPolling();
  process.exit(0);
});

module.exports = bot;

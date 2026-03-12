/**
 * telegram/config.js
 * Configuration for Telegram bot
 */

const config = {
  // Telegram Bot API
  TELEGRAM_API: process.env.Telegram_API || '',
  
  // Gemini AI API
  GEMINI_API_KEY: process.env.Gemi_Api_Key || '',
  GEMINI_MODEL: 'gemini-2.5-flash',
  
  // Polling configuration
  POLLING_INTERVAL: 1000,
  POLLING_TIMEOUT: 10,
  
  // Conversation timeout (30 minutes)
  CONVERSATION_TIMEOUT: 30 * 60 * 1000,
  
  // Cleanup interval (30 minutes)
  CLEANUP_INTERVAL: 30 * 60 * 1000,
  
  // Appointment duration (30 minutes)
  DEFAULT_APPOINTMENT_DURATION: 30 * 60 * 1000,
  
  // Validation
  validate() {
    if (!this.TELEGRAM_API) {
      console.warn('[telegram/config] WARNING: TELEGRAM_API not set in environment');
      return false;
    }
    if (!this.GEMINI_API_KEY) {
      console.warn('[telegram/config] WARNING: GEMINI_API_KEY not set in environment');
      return false;
    }
    return true;
  }
};

// Validate on load
config.validate();

module.exports = config;

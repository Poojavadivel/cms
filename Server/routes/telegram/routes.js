/**
 * telegram/routes.js
 * Express routes for Telegram bot webhook and health check
 */

const express = require('express');
const router = express.Router();
const bot = require('./botInstance');
const { initializeBot } = require('./botInitializer');
const { getStateSize } = require('./stateManager');

// Initialize bot handlers
initializeBot();

/**
 * POST /webhook
 * Webhook endpoint for Telegram bot (optional, for webhook mode instead of polling)
 */
router.post('/webhook', async (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'running',
    bot: bot.isPolling() ? 'polling' : 'stopped',
    conversations: getStateSize(),
    timestamp: new Date()
  });
});

module.exports = router;

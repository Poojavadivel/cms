/**
 * routes/bot.js
 * Simple gateway route for the Doctor Chatbot (no internal JWT).
 *
 * Environment:
 *   PY_BOT_URL    (e.g. http://glowhair-py-bot:8000/chat)
 *   BOT_TIMEOUT_MS (default 15000)
 *
 * Usage:
 *   app.use('/api/bot', require('./routes/bot'));
 */

const express = require('express');
const axios = require('axios');
const auth = require('../Middleware/Auth');

const router = express.Router();

const PY_BOT_URL = process.env.PY_BOT_URL || 'http://127.0.0.1:8000/chat';
const BOT_TIMEOUT_MS = Number(process.env.BOT_TIMEOUT_MS || 15000);
const MAX_RETRIES = 1; // one retry on transient network error

const http = axios.create({
  timeout: BOT_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

function makeCid() {
  return 'cid_' + Math.random().toString(36).slice(2, 8) + '_' + Date.now().toString(36);
}

// POST /api/bot/chat
// Body: { message: string, context?: object }
router.post('/chat', auth, async (req, res) => {
  const cid = makeCid();
  const t0 = Date.now();
  console.log(`--- BOT CHAT REQUEST START [${cid}] ---`);
  console.log(`[${new Date().toISOString()}] [${cid}] /api/bot/chat called by user ${req.user?.id}`);

  try {
    const { message, context } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      console.warn(`[${cid}] Invalid request: missing/empty "message"`);
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty "message".',
        errorCode: 2000,
      });
    }

    const payload = {
      message: message.trim(),
      user: {
        id: req.user?.id,
        role: req.user?.role,
        email: req.user?.email,
      },
      context: context || null,
      now: new Date().toISOString(),
    };

    console.log(`[${cid}] Forwarding to Python bot @ ${PY_BOT_URL} (timeout=${BOT_TIMEOUT_MS}ms)`);

    // Call Python with simple retry on network errors
    let pyResp;
    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        pyResp = await http.post(PY_BOT_URL, payload);
        break;
      } catch (err) {
        attempt += 1;
        const isTimeout = err.code === 'ECONNABORTED';
        const status = err.response?.status;
        console.error(
          `[${cid}] Python call failed (attempt ${attempt}) - ${isTimeout ? 'TIMEOUT' : 'ERROR'} - status=${status || 'n/a'}`
        );
        if (err.response?.data) console.error(`[${cid}] Python error body:`, err.response.data);

        if (attempt > MAX_RETRIES) {
          const httpCode = isTimeout ? 504 : 502;
          const code = isTimeout ? 2002 : 2001;
          return res.status(httpCode).json({
            success: false,
            message: isTimeout ? 'Chatbot timed out. Please try again later.' : 'Chatbot service unavailable.',
            errorCode: code,
          });
        }
        // small backoff
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }

    const data = pyResp?.data;
    let reply = null;
    const meta = {};

    if (data && typeof data === 'object') {
      reply = typeof data.reply === 'string' ? data.reply : null;
      if (data.intent) meta.intent = data.intent;
      if (data.entity) meta.entity = data.entity;
      if (data.meta && typeof data.meta === 'object') Object.assign(meta, data.meta);
    } else if (typeof data === 'string') {
      reply = data;
    }

    if (!reply) {
      console.warn(`[${cid}] Python returned invalid/no reply`);
      return res.status(502).json({
        success: false,
        message: 'Invalid chatbot response.',
        errorCode: 2003,
      });
    }

    // Optional: persist transcript here (user message + bot reply) for audit/analytics
    // e.g., await Transcript.create({ userId: req.user.id, cid, message: payload.message, reply, meta });

    const latency = Date.now() - t0;
    console.log(`[${cid}] Bot replied in ${latency}ms`);
    console.log(`--- BOT CHAT REQUEST END [${cid}] ---`);

    return res.status(200).json({
      success: true,
      reply,
      meta: {
        latencyMs: latency,
        ...meta,
      },
    });
  } catch (err) {
    console.error(`[${cid}] FATAL error in /api/bot/chat:`, err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      errorCode: 5000,
    });
  }
});

module.exports = router;

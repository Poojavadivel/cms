/**
 * bot/routes.js
 * API routes for chatbot endpoints
 */

const express = require('express');
const mongoose = require('mongoose');
const auth = require('../../Middleware/Auth');
const { Bot } = require('../../Models');
const { circuitBreaker, metrics } = require('./circuitBreaker');
const { handleChatRequest } = require('./chatController');
const { makeCid } = require('./utils');

const router = express.Router();

/**
 * GET /api/bot/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/health`);
  return res.json({ success: true, message: 'bot route healthy', cid });
});

/**
 * GET /api/bot/metrics
 * Get chatbot metrics and circuit breaker status
 */
router.get('/metrics', (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/metrics`);
  return res.json({ success: true, metrics, circuit: circuitBreaker });
});

/**
 * POST /api/bot/chat
 * Main chat endpoint
 * Body: { message: string, chatId?: string, title?: string, metadata?: { userRole: string } }
 */
router.post('/chat', auth, handleChatRequest);

/**
 * GET /api/bot/chats
 * List all chat sessions for authenticated user
 */
router.get('/chats', auth, async (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] GET /api/bot/chats by user=${req.user?.id}`);
  
  try {
    const userId = req.user.id;
    const botDoc = await Bot.findOne({ userId, archived: { $ne: true } }).lean();
    
    if (!botDoc || !Array.isArray(botDoc.sessions)) {
      return res.json({ success: true, chats: [] });
    }

    const list = (botDoc.sessions || [])
      .filter(s => !s.metadata?.archived)
      .map((s) => {
        const lastMsg = s.messages && s.messages.length ? s.messages[s.messages.length - 1].text : "";
        const title = s.metadata && s.metadata.title ? s.metadata.title : 
          (s.messages && s.messages.length ? s.messages[0].text.slice(0, 80) : "Chat");
        
        return {
          id: s.sessionId,
          title,
          snippet: lastMsg ? lastMsg.slice(0, 200) : "",
          updatedAt: s.updatedAt || s.createdAt || botDoc.updatedAt || botDoc.createdAt,
          model: s.model || botDoc.model || null,
        };
      });

    return res.json({ success: true, chats: list });
  } catch (err) {
    console.error(`[${cid}] Error listing chats:`, err);
    return res.status(500).json({ success: false, message: 'Failed to list chats', error: err.message });
  }
});

/**
 * GET /api/bot/chats/:id
 * Get specific chat session details
 */
router.get('/chats/:id', auth, async (req, res) => {
  const cid = makeCid();
  const sessionId = req.params.id;
  console.log(`[${cid}] GET /api/bot/chats/${sessionId} by user=${req.user?.id}`);

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Chat ID required' });
  }

  try {
    const userId = req.user.id;
    const botDoc = await Bot.findOne({ userId, 'sessions.sessionId': sessionId }).lean();
    
    if (!botDoc) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const session = (botDoc.sessions || []).find(s => s.sessionId === sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    return res.json({ 
      success: true, 
      chatId: session.sessionId, 
      messages: session.messages || [], 
      meta: { model: session.model || botDoc.model } 
    });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: 'Invalid chat ID format' });
    }
    console.error(`[${cid}] Error fetching chat:`, err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

/**
 * DELETE /api/bot/chats/:id
 * Archive a chat session (soft delete)
 */
router.delete('/chats/:id', auth, async (req, res) => {
  const cid = makeCid();
  const sessionId = req.params.id;
  console.log(`[${cid}] DELETE /api/bot/chats/${sessionId} by user=${req.user?.id}`);

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'chat id required' });
  }

  try {
    const userId = req.user.id;
    const botDoc = await Bot.findOne({ userId, 'sessions.sessionId': sessionId });
    
    if (!botDoc) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const session = botDoc.sessions.find(s => s.sessionId === sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    session.metadata = session.metadata || {};
    session.metadata.archived = true;
    botDoc.updatedAt = new Date();
    await botDoc.save();

    return res.json({ success: true, chatId: sessionId });
  } catch (err) {
    console.error(`[${cid}] Error archiving chat:`, err);
    return res.status(500).json({ success: false, message: 'Failed to delete chat', error: err.message });
  }
});

/**
 * POST /api/bot/feedback
 * Record user feedback for bot responses
 * Body: { messageId: string, type: 'helpful'|'not_helpful', conversationId: string }
 */
router.post('/feedback', auth, async (req, res) => {
  const cid = makeCid();
  console.log(`[${cid}] POST /api/bot/feedback by user=${req.user?.id}`);
  
  try {
    const { messageId, type, conversationId } = req.body || {};
    const user = req.user;
    
    if (!messageId || !type || !conversationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'messageId, type, and conversationId are required' 
      });
    }
    
    if (!['helpful', 'not_helpful'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: "type must be 'helpful' or 'not_helpful'" 
      });
    }
    
    const botDoc = await Bot.findOne({ 
      userId: user.id, 
      'sessions.sessionId': conversationId 
    });
    
    if (!botDoc) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    const session = botDoc.sessions.find(s => s.sessionId === conversationId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    session.metadata = session.metadata || {};
    session.metadata.feedback = session.metadata.feedback || [];
    
    const existingFeedbackIndex = session.metadata.feedback.findIndex(
      f => f.messageId === messageId
    );
    
    const feedbackEntry = {
      messageId,
      type,
      timestamp: new Date(),
      userId: user.id
    };
    
    if (existingFeedbackIndex >= 0) {
      session.metadata.feedback[existingFeedbackIndex] = feedbackEntry;
    } else {
      session.metadata.feedback.push(feedbackEntry);
    }
    
    botDoc.updatedAt = new Date();
    await botDoc.save();
    
    console.log(`[${cid}] Feedback recorded: ${type} for message ${messageId}`);
    
    return res.json({ 
      success: true, 
      message: 'Feedback recorded successfully',
      feedback: { messageId, type }
    });
    
  } catch (err) {
    console.error(`[${cid}] Error recording feedback:`, err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to record feedback', 
      error: err.message 
    });
  }
});

module.exports = router;

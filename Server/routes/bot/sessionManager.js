/**
 * bot/sessionManager.js
 * Bot session and chat history management
 */

const { v4: uuidv4 } = require('uuid');
const { Bot } = require('../../Models');
const config = require('./config');

/**
 * Find or create a bot session for user
 * @param {string} userId - User ID
 * @param {string} sessionId - Optional session ID
 * @returns {Promise<object>} Object with botDoc and session
 */
async function findOrCreateSessionForUser(userId, sessionId = null) {
  let botDoc = await Bot.findOne({ userId });
  if (!botDoc) {
    botDoc = new Bot({ userId, sessions: [], archived: false, metadata: {} });
  }

  // If sessionId supplied, try to find the session
  if (sessionId) {
    const s = (botDoc.sessions || []).find(sess => sess.sessionId === sessionId);
    if (s) return { botDoc, session: s };
  }

  // Create new session
  const newSession = {
    sessionId: sessionId || uuidv4(),
    model: config.MODEL_NAME,
    messages: [],
    metadata: {},
    createdAt: new Date(),
  };

  botDoc.sessions = botDoc.sessions || [];
  botDoc.sessions.push(newSession);
  await botDoc.save();
  
  const added = botDoc.sessions.find(s => s.sessionId === newSession.sessionId);
  return { botDoc, session: added };
}

/**
 * Append messages to session and save
 * @param {object} botDoc - Bot document
 * @param {string} sessionId - Session ID
 * @param {Array} newMessages - Array of new messages
 * @returns {Promise<object>} Updated bot document
 */
async function appendMessagesToSession(botDoc, sessionId, newMessages = []) {
  const session = (botDoc.sessions || []).find(s => s.sessionId === sessionId);
  
  if (!session) {
    const sess = {
      sessionId,
      model: config.MODEL_NAME,
      messages: newMessages,
      metadata: {},
      createdAt: new Date(),
    };
    botDoc.sessions = botDoc.sessions || [];
    botDoc.sessions.push(sess);
  } else {
    session.messages = session.messages || [];
    session.messages.push(...newMessages);
  }
  
  botDoc.updatedAt = new Date();
  await botDoc.save();
  return botDoc;
}

/**
 * Save chat and return response
 * @param {string} cid - Conversation ID
 * @param {number} tStart - Start timestamp
 * @param {string} sessionId - Session ID
 * @param {object} user - User object
 * @param {string} userMessage - User message
 * @param {string} botReply - Bot reply
 * @param {object} res - Express response object
 * @returns {Promise<object>} Response JSON
 */
async function saveAndReturnChat(cid, tStart, sessionId, user, userMessage, botReply, res) {
  try {
    const { botDoc, session } = await findOrCreateSessionForUser(user.id, sessionId);
    const sessId = session.sessionId;

    const now = new Date().toISOString();
    await appendMessagesToSession(botDoc, sessId, [
      { sender: "user", text: userMessage, ts: now },
      { sender: "bot", text: botReply, ts: now, meta: { model: config.MODEL_NAME } },
    ]);

    const latency = Date.now() - tStart;
    console.log(`--- BOT CHAT END [${cid}] latency=${latency}ms session=${sessId} ---`);
    
    return res.json({ 
      success: true, 
      reply: botReply, 
      chatId: sessId, 
      meta: { latencyMs: latency } 
    });
  } catch (saveErr) {
    console.error(`[${cid}] Failed to save bot session:`, saveErr);
    const latency = Date.now() - tStart;
    
    return res.status(500).json({
      success: false,
      reply: botReply,
      message: "Failed to persist chat history",
      error: saveErr.message,
      meta: { latencyMs: latency },
    });
  }
}

module.exports = {
  findOrCreateSessionForUser,
  appendMessagesToSession,
  saveAndReturnChat
};

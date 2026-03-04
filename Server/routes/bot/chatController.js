/**
 * bot/chatController.js
 * Main chat controller for handling chat requests
 */

const { makeCid } = require('./utils');
const { extractIntent } = require('./intentExtractor');
const { buildEnhancedContext } = require('./contextBuilder');
const { searchEntities, buildEntityContexts } = require('./entitySearch');
const { saveAndReturnChat, findOrCreateSessionForUser } = require('./sessionManager');
const { generateGreetingResponse, generateNoDataResponse, generateAIResponse } = require('./responseGenerator');

/**
 * Handle chat request
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function handleChatRequest(req, res) {
  const cid = makeCid();
  console.log(`--- BOT CHAT START [${cid}] ---`);
  console.log(`[${cid}] body=`, req.body);

  const tStart = Date.now();
  
  try {
    const { message, chatId, title, metadata } = req.body || {};
    const user = req.user;
    
    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Extract user role
    const userRole = (metadata && metadata.userRole) || user.role || 'default';
    console.log(`[${cid}] User role: ${userRole}`);

    // Create empty chat session with title
    if (!message && title) {
      try {
        const { botDoc, session } = await findOrCreateSessionForUser(user.id, null);
        botDoc.sessions[botDoc.sessions.length - 1].metadata = botDoc.sessions[botDoc.sessions.length - 1].metadata || {};
        botDoc.sessions[botDoc.sessions.length - 1].metadata.title = String(title);
        botDoc.sessions[botDoc.sessions.length - 1].metadata.userRole = userRole;
        await botDoc.save();
        
        return res.json({ 
          success: true, 
          chat: { sessionId: botDoc.sessions[botDoc.sessions.length - 1].sessionId, title }, 
          message: "New chat created successfully." 
        });
      } catch (err) {
        console.error(`[${cid}] Failed to create empty chat doc:`, err);
        return res.status(500).json({ success: false, message: "Failed to create new chat session." });
      }
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const trimmed = message.trim();
    
    // Check for greeting
    const greetingReply = generateGreetingResponse(trimmed);
    if (greetingReply) {
      return saveAndReturnChat(cid, tStart, chatId, user, trimmed, greetingReply, res);
    }

    // Extract intent and entity
    console.log(`[${cid}] Extracting intent...`);
    const extraction = await extractIntent(trimmed, user, chatId);
    console.log(`[${cid}] Extracted intent: ${extraction.intent}, entity: ${extraction.entity}`);

    // Build enhanced context
    console.log(`[${cid}] Building enhanced context...`);
    const enhancedContext = await buildEnhancedContext(extraction.entity, userRole, extraction.intent, user.id);
    console.log(`[${cid}] Enhanced context summary:`, enhancedContext.summary);

    // Search for patient and staff entities
    console.log(`[${cid}] Searching entities...`);
    const { patientDoc, staffDoc } = await searchEntities(extraction.entity);
    const { safePatient, safeStaff } = buildEntityContexts(patientDoc, staffDoc);

    // Check if we have any data
    const isDataMissing = !patientDoc && !staffDoc && 
      (!enhancedContext.data || Object.keys(enhancedContext.data).length === 0);

    let finalReply = "";

    if (isDataMissing) {
      finalReply = generateNoDataResponse(extraction);
    } else {
      // Combine all context
      const fullContext = {
        patient: safePatient,
        staff: safeStaff,
        enhanced: enhancedContext.data,
        contextSummary: enhancedContext.summary
      };

      console.log(`[${cid}] Generating AI response...`);
      finalReply = await generateAIResponse(trimmed, fullContext, userRole, user, chatId, extraction);
    }

    return saveAndReturnChat(cid, tStart, chatId, user, trimmed, finalReply, res);

  } catch (outerErr) {
    console.error(`[${cid}] Unexpected error:`, outerErr);
    const latency = Date.now() - tStart;
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: outerErr.message, 
      meta: { latencyMs: latency } 
    });
  }
}

module.exports = {
  handleChatRequest
};

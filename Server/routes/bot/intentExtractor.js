/**
 * bot/intentExtractor.js
 * Intent and entity extraction from user queries
 */

const { callGeminiChatWithRetries } = require('./aiService');
const { safeParseJsonLike } = require('./utils');
const config = require('./config');

/**
 * Extract intent and entities from user message
 * @param {string} message - User message
 * @param {object} user - User object with id and role
 * @param {string} chatId - Chat session ID
 * @returns {Promise<object>} Extraction result with intent, entity, and date
 */
async function extractIntent(message, user, chatId) {
  const extractorPromptSystem = `You are an extractor. Read the user's query and respond ONLY with a compact JSON object with keys:
- intent: one-word intent like "appointments_today", "appointments", "patient_info", "patient_history", "lab_reports", "pending_labs", "prescriptions", "diagnosis", "vitals", "allergies", "medicines", "staff_info", "billing", "admissions", "analytics", "unknown"
- entity: the main entity name or id if present (e.g., "Sanjit" or "patient_id_123"), or null
- date: optional date string if the user mentioned one (e.g., "2025-09-01" or "today" or "tomorrow")
Return strictly valid JSON.`;

  const extractorMessages = [
    { role: "system", content: extractorPromptSystem },
    { role: "user", content: `Query: ${message}` },
  ];

  let extractionText;
  try {
    extractionText = await callGeminiChatWithRetries(
      extractorMessages, 
      config.DEFAULT_TEMPERATURE, 
      400,
      {
        userId: user.id,
        userRole: user.role,
        userName: user.firstName || user.email,
        endpoint: 'chatbot',
        requestType: 'intent_extraction',
        sessionId: chatId,
        metadata: { userMessage: message }
      }
    );
  } catch (err) {
    console.error(`[intentExtractor] Extraction call failed:`, err && err.message ? err.message : err);
    extractionText = null;
  }

  let extraction = safeParseJsonLike(extractionText);
  
  if (!extraction) {
    // Fallback: rule-based intent detection
    extraction = fallbackIntentExtraction(message);
  } else {
    extraction.intent = extraction.intent || "unknown";
    extraction.entity = extraction.entity || null;
    extraction.date = extraction.date || null;
  }

  return extraction;
}

/**
 * Fallback rule-based intent extraction when AI extraction fails
 * @param {string} message - User message
 * @returns {object} Extraction result
 */
function fallbackIntentExtraction(message) {
  const lowerMsg = message.toLowerCase().trim();
  const fallback = { intent: "unknown", entity: null, date: null };
  
  // Enhanced intent detection
  if (lowerMsg.includes("appointment") && (lowerMsg.includes("today") || lowerMsg.includes("how many"))) 
    fallback.intent = "appointments_today";
  else if (lowerMsg.includes("appointment")) 
    fallback.intent = "appointments";
  
  if (lowerMsg.includes("patient") || lowerMsg.includes("show me the details") || lowerMsg.includes("details of") || lowerMsg.includes("tell me about")) 
    fallback.intent = "patient_info";
  
  if (lowerMsg.includes("lab") || lowerMsg.includes("test") || lowerMsg.includes("report")) 
    fallback.intent = "lab_reports";
  if (lowerMsg.includes("pending") && (lowerMsg.includes("lab") || lowerMsg.includes("report"))) 
    fallback.intent = "pending_labs";
  
  if (lowerMsg.includes("prescription") || lowerMsg.includes("medicine") || lowerMsg.includes("drug")) 
    fallback.intent = "prescriptions";
  if (lowerMsg.includes("diagnosis") || lowerMsg.includes("condition")) 
    fallback.intent = "diagnosis";
  if (lowerMsg.includes("vital") || lowerMsg.includes("bp") || lowerMsg.includes("blood pressure") || lowerMsg.includes("temperature")) 
    fallback.intent = "vitals";
  if (lowerMsg.includes("allerg")) 
    fallback.intent = "allergies";
  
  if (lowerMsg.includes("doctor") || lowerMsg.includes("staff") || lowerMsg.includes("nurse")) 
    fallback.intent = "staff_info";
  if (lowerMsg.includes("billing") || lowerMsg.includes("bill") || lowerMsg.includes("payment")) 
    fallback.intent = "billing";
  if (lowerMsg.includes("admission") || lowerMsg.includes("admitted")) 
    fallback.intent = "admissions";
  if (lowerMsg.includes("revenue") || lowerMsg.includes("occupancy") || lowerMsg.includes("analytics")) 
    fallback.intent = "analytics";
  
  // Date extraction
  if (lowerMsg.includes("today")) fallback.date = "today";
  if (lowerMsg.includes("tomorrow")) fallback.date = "tomorrow";
  if (lowerMsg.includes("yesterday")) fallback.date = "yesterday";
  
  // Entity extraction - extract patient name from common patterns
  const patterns = [
    /tell me about ([a-z\s]+)/i,
    /details of ([a-z\s]+)/i,
    /patient ([a-z\s]+)/i,
    /for ([a-z\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      fallback.entity = match[1].trim();
      break;
    }
  }
  
  if (!fallback.entity) {
    const words = message.split(/\s+/).filter(Boolean);
    if (words.length <= 4 && !lowerMsg.includes("how many") && !lowerMsg.includes("today")) {
      fallback.entity = message;
    }
  }
  
  return fallback;
}

module.exports = {
  extractIntent
};

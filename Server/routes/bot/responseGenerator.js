/**
 * bot/responseGenerator.js
 * Generate AI responses based on context and user query
 */

const { callGeminiChatWithRetries } = require('./aiService');
const { getSystemPrompt } = require('./systemPrompts');
const config = require('./config');

/**
 * Generate greeting response
 * @param {string} message - User message
 * @returns {string|null} Greeting response or null if not a greeting
 */
function generateGreetingResponse(message) {
  const lower = message.toLowerCase();
  const isGreeting = lower.match(/\b(hi|hello|hey|greetings|thanks|thank you)\b/);
  
  if (!isGreeting) return null;
  
  const greetingResponses = [
    "Hello! How can I assist you today?",
    "Hi there! What can I help you with?",
    "Hey! I'm here to help. What do you need?",
    "Hello! How may I help you today?",
    "Hi! What brings you here today?",
  ];
  
  const thankYouResponses = [
    "You're welcome! Let me know if you need anything else.",
    "Happy to help! Feel free to ask if you have more questions.",
    "My pleasure! Anything else I can assist with?",
  ];
  
  if (lower.includes('thank')) {
    return thankYouResponses[Math.floor(Math.random() * thankYouResponses.length)];
  } else {
    return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
  }
}

/**
 * Generate "no data found" response
 * @param {object} extraction - Extraction object with intent and entity
 * @returns {string} No data response
 */
function generateNoDataResponse(extraction) {
  const entityName = extraction.entity || 'the requested entity';
  const queryType = extraction.intent === 'patient_info' ? 'patient' : 
                   extraction.intent === 'staff_info' ? 'staff member' :
                   extraction.intent === 'medicines' ? 'medicine' :
                   extraction.intent === 'lab_reports' ? 'lab report' : 'record';
  
  return `**Summary:** No ${queryType} found for "${entityName}"

**Key Points:**
• Record not found
• Database search complete
• No matching entries

**Recommendations:**
• Verify spelling/name
• Check patient ID
• Try alternative identifiers
• Contact registration desk

**Alerts:**
• None`;
}

/**
 * Generate AI response with context
 * @param {string} userMessage - User message
 * @param {object} fullContext - Full context object with patient, staff, and enhanced data
 * @param {string} userRole - User role
 * @param {object} user - User object
 * @param {string} chatId - Chat session ID
 * @param {object} extraction - Extraction object with intent
 * @returns {Promise<string>} AI-generated response
 */
async function generateAIResponse(userMessage, fullContext, userRole, user, chatId, extraction) {
  // Check if this is an appointment query with appointment data
  const isAppointmentQuery = extraction.intent === 'appointments' || extraction.intent === 'appointments_today';
  const hasAppointmentData = fullContext.enhanced && fullContext.enhanced.todayAppointments &&
                             fullContext.enhanced.todayAppointments.length > 0;

  // If appointment query with data, return structured data for React component
  if (isAppointmentQuery && hasAppointmentData) {
    const appointments = fullContext.enhanced.todayAppointments;

    // Return a special JSON format that frontend will detect and render as table
    return JSON.stringify({
      type: 'appointments_table',
      data: {
        appointments: appointments,
        date: new Date().toISOString()
      }
    });
  }

  // For other queries, use the AI response
  const systemPrompt = getSystemPrompt(userRole);

  const summarizerUser = `User Query: ${userMessage}

Available Context:
${JSON.stringify(fullContext, null, 2)}

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THIS EXACT FORMAT:

**Summary:** [1 line summary]

**Key Points:**
• [2-3 words max]
• [2-3 words max]
• [2-3 words max]

**Recommendations:**
• [Action item]
• [Action item]

**Alerts:**
• [Critical items OR "None"]

RULES:
- Use ONLY provided context
- ALWAYS use bullet points (•)
- Maximum 2-3 words per bullet in Key Points
- NO paragraphs or long text
- If data incomplete, list what's available
- Follow the 4-section structure EXACTLY
- DO NOT explain your reasoning or thought process
- Output ONLY the formatted answer, nothing else`;

  try {
    const reply = await callGeminiChatWithRetries(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: summarizerUser },
      ],
      config.DEFAULT_TEMPERATURE,
      config.DEFAULT_MAX_COMPLETION_TOKENS,
      {
        userId: user.id,
        userRole: userRole,
        userName: user.firstName || user.email,
        endpoint: 'chatbot',
        requestType: 'query_with_data',
        sessionId: chatId,
        metadata: { userMessage: userMessage, intent: extraction.intent }
      }
    );

    return String(reply).trim();
  } catch (summErr) {
    console.error(`[responseGenerator] Summarizer call failed:`, summErr);
    return "⚠️ A system error occurred while preparing the response. Please try again later.";
  }
}

module.exports = {
  generateGreetingResponse,
  generateNoDataResponse,
  generateAIResponse
};

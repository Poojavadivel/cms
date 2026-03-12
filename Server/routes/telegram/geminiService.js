/**
 * telegram/geminiService.js
 * Gemini AI service for natural language processing
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

/**
 * Parse date/time using Gemini AI
 * @param {string} userMessage - User's message containing date/time
 * @returns {Promise<Object>} Parsed date/time object
 */
async function parseDateTimeWithGemini(userMessage) {
  try {
    const prompt = `
You are a date/time parser. Extract the appointment date and time from the user's message.
Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current time: ${new Date().toLocaleTimeString('en-US')}

User message: "${userMessage}"

Extract and return ONLY a JSON object with this exact format (no extra text):
{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "success": true
}

If the date/time cannot be parsed, return:
{
  "success": false,
  "error": "Could not understand the date/time"
}

Examples:
- "tomorrow at 3pm" → {"date": "2025-10-26", "time": "15:00", "success": true}
- "next Monday 10:30 AM" → {"date": "2025-10-28", "time": "10:30", "success": true}
- "25th December 2pm" → {"date": "2025-12-25", "time": "14:00", "success": true}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Gemini returned non-JSON response:', text);
      return { success: false, error: 'Could not parse date/time' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate parsed result
    if (parsed.success && parsed.date && parsed.time) {
      const dateTime = new Date(`${parsed.date}T${parsed.time}:00`);
      
      // Check if date is in the past
      if (dateTime < new Date()) {
        return { success: false, error: 'Cannot book appointments in the past' };
      }

      return {
        success: true,
        date: parsed.date,
        time: parsed.time,
        dateTime: dateTime
      };
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing date/time with Gemini:', error);
    return { success: false, error: 'Failed to parse date/time' };
  }
}

module.exports = {
  parseDateTimeWithGemini,
  model
};

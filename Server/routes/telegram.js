// Server/routes/telegram.js
// Enterprise-grade Telegram Bot with Gemini AI for Appointment Booking

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Appointment = require('../Models/Appointment');
const User = require('../Models/User');
const Patient = require('../Models/Patient');

const router = express.Router();

// Initialize Telegram Bot with improved polling configuration
const bot = new TelegramBot(process.env.Telegram_API, {
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.Gemi_Api_Key);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// In-memory conversation state management
const conversationState = new Map();

// Helper: Get or create conversation state
function getState(chatId) {
  if (!conversationState.has(chatId)) {
    conversationState.set(chatId, {
      step: 'idle',
      data: {},
      lastActivity: Date.now()
    });
  }
  return conversationState.get(chatId);
}

// Helper: Reset conversation state
function resetState(chatId) {
  conversationState.set(chatId, {
    step: 'idle',
    data: {},
    lastActivity: Date.now()
  });
}

// Helper: Parse date/time using Gemini AI
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
      return { success: false, error: 'Could not parse date/time from response' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.success) {
      // Validate date is not in the past
      const appointmentDate = new Date(`${parsed.date}T${parsed.time}`);
      if (appointmentDate < new Date()) {
        return { success: false, error: 'Date/time cannot be in the past' };
      }
    }

    return parsed;
  } catch (error) {
    console.error('Gemini parsing error:', error);
    return { success: false, error: 'Failed to parse date/time' };
  }
}

// Helper: Get default doctor
async function getDefaultDoctor() {
  try {
    const doctor = await User.findOne({ role: 'doctor' }).sort({ createdAt: 1 });
    if (!doctor) {
      throw new Error('No doctor available');
    }
    return doctor;
  } catch (error) {
    console.error('Error fetching doctor:', error);
    throw error;
  }
}

// Helper: Check for duplicate appointments
async function checkDuplicateAppointment(telegramUserId, startAt) {
  try {
    const existingAppointment = await Appointment.findOne({
      telegramUserId,
      startAt,
      status: { $in: ['Scheduled', 'Rescheduled'] }
    });
    return existingAppointment !== null;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return false;
  }
}

// Helper: Create or get patient for Telegram user
async function getOrCreatePatient(telegramUserId, telegramUsername, telegramFirstName) {
  try {
    // Try to find existing patient by telegram ID
    let patient = await Patient.findOne({ telegramUserId });

    if (!patient) {
      // Create new patient
      patient = new Patient({
        firstName: telegramFirstName || telegramUsername || 'Telegram',
        lastName: 'User',
        phone: `telegram_${telegramUserId}`,
        email: `telegram_${telegramUserId}@telegram.user`,
        gender: 'Other', // Default, can be updated later
        address: {
          line1: 'Telegram User',
          city: '',
          state: '',
          pincode: '',
          country: ''
        },
        telegramUserId,
        telegramUsername,
        metadata: {
          source: 'telegram',
          createdViaBot: true
        }
      });
      await patient.save();
      console.log(`✅ Created new patient for Telegram user ${telegramUserId}`);
    }

    return patient;
  } catch (error) {
    console.error('Error getting/creating patient:', error);
    throw error;
  }
}

// Helper: Create appointment
async function createAppointment(chatId, telegramUserId, patientData) {
  try {
    const doctor = await getDefaultDoctor();
    
    // Create or update patient with full details
    let patient = await Patient.findOne({ telegramUserId: telegramUserId.toString() });
    
    if (!patient) {
      // Create new patient with full details
      const nameParts = patientData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';
      
      patient = new Patient({
        firstName,
        lastName,
        age: patientData.age,
        gender: patientData.gender,
        phone: patientData.phone,
        email: patientData.email,
        bloodGroup: patientData.bloodGroup || 'Unknown',
        address: {
          line1: 'Telegram User',
          city: '',
          state: '',
          pincode: '',
          country: ''
        },
        telegramUserId: telegramUserId.toString(),
        telegramUsername: conversationState.get(chatId)?.username,
        metadata: {
          source: 'telegram',
          createdViaBot: true
        }
      });
      await patient.save();
      console.log(`✅ Created new patient: ${patientData.fullName}`);
    } else {
      // Update existing patient with new details
      const nameParts = patientData.fullName.trim().split(' ');
      patient.firstName = nameParts[0];
      patient.lastName = nameParts.slice(1).join(' ') || 'User';
      patient.age = patientData.age;
      patient.gender = patientData.gender;
      patient.phone = patientData.phone;
      patient.email = patientData.email;
      patient.bloodGroup = patientData.bloodGroup || patient.bloodGroup || 'Unknown';
      await patient.save();
      console.log(`✅ Updated patient: ${patientData.fullName}`);
    }

    // Check for duplicates
    const isDuplicate = await checkDuplicateAppointment(
      telegramUserId.toString(), 
      patientData.dateTime
    );
    if (isDuplicate) {
      return { success: false, error: 'You already have an appointment at this time' };
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentType: 'Consultation',
      startAt: patientData.dateTime,
      endAt: new Date(patientData.dateTime.getTime() + 30 * 60000), // 30 minutes duration
      location: 'Karur Gastro Foundation',
      status: 'Scheduled',
      notes: `Reason: ${patientData.reason}\nBooked via Telegram Bot`,
      telegramUserId: telegramUserId.toString(),
      telegramChatId: chatId.toString(),
      bookingSource: 'telegram'
    });

    await appointment.save();

    return {
      success: true,
      appointmentCode: appointment.appointmentCode,
      doctorName: doctor.name || 'Doctor',
      patientName: patientData.fullName,
      dateTime: patientData.dateTime
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: false, error: error.message };
  }
}

// Bot command handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  resetState(chatId);

  await bot.sendMessage(chatId,
    `👋 Welcome to Karur Gastro Foundation Appointment Bot!\n\n` +
    `I can help you book appointments with our doctors.\n\n` +
    `Commands:\n` +
    `/book - Book a new appointment\n` +
    `/help - Get help\n` +
    `/cancel - Cancel current booking`
  );
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId,
    `📚 *How to use this bot:*\n\n` +
    `1️⃣ Send /book to start booking an appointment\n` +
    `2️⃣ I'll collect your details:\n` +
    `   • Full Name\n` +
    `   • Age\n` +
    `   • Gender\n` +
    `   • Phone Number\n` +
    `   • Email (optional)\n` +
    `   • Blood Group\n` +
    `   • Reason for visit\n` +
    `   • Preferred date & time\n` +
    `3️⃣ Review and confirm your details\n` +
    `4️⃣ Get your appointment code\n\n` +
    `💡 *Tips:*\n` +
    `• Use natural language for dates like:\n` +
    `  "tomorrow at 3pm"\n` +
    `  "next Monday 10:30 AM"\n` +
    `  "December 25th at 2pm"\n\n` +
    `Use /cancel anytime to cancel the current booking.`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/cancel/, async (msg) => {
  const chatId = msg.chat.id;
  resetState(chatId);

  await bot.sendMessage(chatId, '❌ Booking cancelled. Use /book to start again.');
});

bot.onText(/\/book/, async (msg) => {
  const chatId = msg.chat.id;
  const state = getState(chatId);

  // Store user info
  state.username = msg.from.username;
  state.firstName = msg.from.first_name;
  state.step = 'waiting_full_name';
  state.lastActivity = Date.now();

  await bot.sendMessage(chatId,
    `👋 Welcome to Karur Gastro Foundation!\n\n` +
    `Let's book your appointment. I'll need a few details from you.\n\n` +
    `First, please provide your *full name*:`,
    { parse_mode: 'Markdown' }
  );
});

// Handle all other messages
bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text?.startsWith('/')) return;

  const chatId = msg.chat.id;
  const state = getState(chatId);
  const userMessage = msg.text;

  // Store user info if not already stored
  if (!state.username) {
    state.username = msg.from.username;
    state.firstName = msg.from.first_name;
  }

  try {
    switch (state.step) {
      case 'idle':
        // User sent a message without starting booking
        await bot.sendMessage(chatId,
          `👋 Hi! I can help you book appointments.\n\n` +
          `Use /book to start booking or /help for more information.`
        );
        break;

      case 'waiting_full_name':
        state.data.fullName = userMessage.trim();
        state.step = 'waiting_age';
        state.lastActivity = Date.now();
        
        await bot.sendMessage(chatId, `Thanks, ${state.data.fullName}!\n\nNow, please provide your *age*:`, { parse_mode: 'Markdown' });
        break;

      case 'waiting_age':
        const age = parseInt(userMessage.trim());
        if (isNaN(age) || age < 1 || age > 120) {
          await bot.sendMessage(chatId, `❌ Please enter a valid age (1-120):`);
          break;
        }
        state.data.age = age;
        state.step = 'waiting_gender';
        state.lastActivity = Date.now();
        
        await bot.sendMessage(chatId, 
          `Great! Now, please select your *gender*:`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '👨 Male', callback_data: 'gender_male' }],
                [{ text: '👩 Female', callback_data: 'gender_female' }],
                [{ text: '⚧ Other', callback_data: 'gender_other' }]
              ]
            }
          }
        );
        break;

      case 'waiting_phone':
        const phone = userMessage.trim();
        if (phone.length < 10 || !/^\+?[\d\s-()]+$/.test(phone)) {
          await bot.sendMessage(chatId, `❌ Please enter a valid phone number (at least 10 digits):`);
          break;
        }
        state.data.phone = phone;
        state.step = 'waiting_email';
        state.lastActivity = Date.now();
        
        await bot.sendMessage(chatId, 
          `Perfect! Now, please provide your *email address*:\n\n` +
          `(Or type "skip" if you don't have one)`,
          { parse_mode: 'Markdown' }
        );
        break;

      case 'waiting_email':
        if (userMessage.toLowerCase() === 'skip') {
          state.data.email = `telegram_${msg.from.id}@telegram.user`;
        } else {
          const email = userMessage.trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            await bot.sendMessage(chatId, `❌ Please enter a valid email address (or type "skip"):`);
            break;
          }
          state.data.email = email;
        }
        state.step = 'waiting_blood_group';
        state.lastActivity = Date.now();
        
        await bot.sendMessage(chatId, 
          `Excellent! What is your *blood group*?`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'A+', callback_data: 'blood_A+' },
                  { text: 'A-', callback_data: 'blood_A-' },
                  { text: 'B+', callback_data: 'blood_B+' }
                ],
                [
                  { text: 'B-', callback_data: 'blood_B-' },
                  { text: 'O+', callback_data: 'blood_O+' },
                  { text: 'O-', callback_data: 'blood_O-' }
                ],
                [
                  { text: 'AB+', callback_data: 'blood_AB+' },
                  { text: 'AB-', callback_data: 'blood_AB-' }
                ],
                [{ text: "Don't Know", callback_data: 'blood_unknown' }]
              ]
            }
          }
        );
        break;

      case 'waiting_reason':
        state.data.reason = userMessage.trim();
        state.step = 'waiting_datetime';
        state.lastActivity = Date.now();
        
        await bot.sendMessage(chatId,
          `📅 Thank you! When would you like to schedule your appointment?\n\n` +
          `Please provide the date and time in natural language.\n\n` +
          `*Examples:*\n` +
          `• "tomorrow at 3pm"\n` +
          `• "next Monday 10:30 AM"\n` +
          `• "December 25th at 2pm"`,
          { parse_mode: 'Markdown' }
        );
        break;

      case 'waiting_datetime':
        // Parse date/time using Gemini AI
        await bot.sendMessage(chatId, '🤔 Understanding your request...');

        const parsed = await parseDateTimeWithGemini(userMessage);

        if (!parsed.success) {
          await bot.sendMessage(chatId,
            `❌ Sorry, I couldn't understand that date/time.\n\n` +
            `${parsed.error || 'Please try again with a clearer format.'}\n\n` +
            `Examples:\n` +
            `• "tomorrow at 3pm"\n` +
            `• "next Monday 10:30 AM"\n` +
            `• "December 25th at 2pm"\n\n` +
            `Or use /cancel to cancel.`
          );
          break;
        }

        // Store parsed date/time
        const dateTime = new Date(`${parsed.date}T${parsed.time}`);
        state.data.dateTime = dateTime;
        state.data.dateStr = dateTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        state.data.timeStr = dateTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        state.step = 'waiting_confirmation';

        // Get doctor info
        const doctor = await getDefaultDoctor();

        await bot.sendMessage(chatId,
          `✅ *Perfect! Please review your appointment details:*\n\n` +
          `👤 *Name:* ${state.data.fullName}\n` +
          `🎂 *Age:* ${state.data.age}\n` +
          `⚧ *Gender:* ${state.data.gender}\n` +
          `📱 *Phone:* ${state.data.phone}\n` +
          `📧 *Email:* ${state.data.email}\n` +
          `🩸 *Blood Group:* ${state.data.bloodGroup || 'N/A'}\n` +
          `📝 *Reason:* ${state.data.reason}\n\n` +
          `📅 *Date:* ${state.data.dateStr}\n` +
          `🕐 *Time:* ${state.data.timeStr}\n` +
          `👨‍⚕️ *Doctor:* Dr. ${doctor.name || 'Available Doctor'}\n` +
          `📍 *Location:* Karur Gastro Foundation\n\n` +
          `Is everything correct?`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Confirm & Book', callback_data: 'confirm_appointment' }],
                [{ text: '❌ Cancel', callback_data: 'cancel_appointment' }]
              ]
            }
          }
        );
        break;

      case 'waiting_confirmation':
        const lowerMsg = userMessage.toLowerCase();

        if (lowerMsg.includes('confirm') || lowerMsg.includes('yes') || lowerMsg === 'y') {
          // Create appointment
          await bot.sendMessage(chatId, '⏳ Creating your appointment...');

          const result = await createAppointment(
            chatId,
            msg.from.id,
            state.data
          );

          if (result.success) {
            await bot.sendMessage(chatId,
              `✅ *Appointment Booked Successfully!*\n\n` +
              `🎫 *Appointment Code:* ${result.appointmentCode}\n` +
              `👤 *Patient:* ${result.patientName}\n` +
              `📅 *Date:* ${state.data.dateStr}\n` +
              `🕐 *Time:* ${state.data.timeStr}\n` +
              `👨‍⚕️ *Doctor:* Dr. ${result.doctorName}\n` +
              `📍 *Location:* Karur Gastro Foundation\n\n` +
              `Please save your appointment code for reference.\n` +
              `We'll see you at your appointment!\n\n` +
              `Use /book to schedule another appointment.`,
              { parse_mode: 'Markdown' }
            );
            resetState(chatId);
          } else {
            await bot.sendMessage(chatId,
              `❌ Sorry, there was an error creating your appointment:\n\n` +
              `${result.error}\n\n` +
              `Please try again with /book`
            );
            resetState(chatId);
          }
        } else if (lowerMsg.includes('cancel') || lowerMsg.includes('no') || lowerMsg === 'n') {
          await bot.sendMessage(chatId,
            `❌ Appointment booking cancelled.\n\n` +
            `Use /book to start again.`
          );
          resetState(chatId);
        } else {
          await bot.sendMessage(chatId,
            `Please use the buttons above or reply with "confirm" or "cancel".`
          );
        }
        break;

      default:
        await bot.sendMessage(chatId,
          `I'm not sure what to do. Use /help for assistance.`
        );
        resetState(chatId);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(chatId,
      `❌ An error occurred. Please try again later.\n\n` +
      `Use /start to restart or /help for assistance.`
    );
    resetState(chatId);
  }
});

// Handle callback queries (inline keyboard buttons)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const state = getState(chatId);

  try {
    // Gender selection
    if (data.startsWith('gender_')) {
      const gender = data.replace('gender_', '');
      state.data.gender = gender.charAt(0).toUpperCase() + gender.slice(1);
      state.step = 'waiting_phone';
      state.lastActivity = Date.now();
      
      await bot.answerCallbackQuery(query.id);
      await bot.editMessageText(
        `✅ Gender: ${state.data.gender}`,
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
      await bot.sendMessage(chatId, `Great! Now, please provide your *phone number*:`, { parse_mode: 'Markdown' });
    }
    
    // Blood group selection
    else if (data.startsWith('blood_')) {
      const bloodGroup = data.replace('blood_', '');
      state.data.bloodGroup = bloodGroup === 'unknown' ? 'Unknown' : bloodGroup;
      state.step = 'waiting_reason';
      state.lastActivity = Date.now();
      
      await bot.answerCallbackQuery(query.id);
      await bot.editMessageText(
        `✅ Blood Group: ${state.data.bloodGroup}`,
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
      await bot.sendMessage(chatId, 
        `Perfect! What is the *reason for your visit*?\n\n` +
        `(e.g., "Regular checkup", "Stomach pain", "Follow-up consultation", etc.)`,
        { parse_mode: 'Markdown' }
      );
    }
    
    // Appointment confirmation
    else if (data === 'confirm_appointment') {
      await bot.answerCallbackQuery(query.id, { text: 'Booking your appointment...' });
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
      
      await bot.sendMessage(chatId, '⏳ Creating your appointment...');

      const result = await createAppointment(
        chatId,
        query.from.id,
        state.data
      );

      if (result.success) {
        await bot.sendMessage(chatId,
          `✅ *Appointment Booked Successfully!*\n\n` +
          `🎫 *Appointment Code:* ${result.appointmentCode}\n` +
          `👤 *Patient:* ${result.patientName}\n` +
          `📅 *Date:* ${state.data.dateStr}\n` +
          `🕐 *Time:* ${state.data.timeStr}\n` +
          `👨‍⚕️ *Doctor:* Dr. ${result.doctorName}\n` +
          `📍 *Location:* Karur Gastro Foundation\n\n` +
          `💡 Please save your appointment code for reference.\n` +
          `We'll see you at your appointment!\n\n` +
          `Use /book to schedule another appointment.`,
          { parse_mode: 'Markdown' }
        );
        resetState(chatId);
      } else {
        await bot.sendMessage(chatId,
          `❌ Sorry, there was an error creating your appointment:\n\n` +
          `${result.error}\n\n` +
          `Please try again with /book`
        );
        resetState(chatId);
      }
    }
    
    // Appointment cancellation
    else if (data === 'cancel_appointment') {
      await bot.answerCallbackQuery(query.id, { text: 'Booking cancelled' });
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
      await bot.sendMessage(chatId,
        `❌ Appointment booking cancelled.\n\n` +
        `Use /book to start again.`
      );
      resetState(chatId);
    }
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.answerCallbackQuery(query.id, { text: 'An error occurred' });
  }
});

// Clean up old conversation states (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 minutes

  for (const [chatId, state] of conversationState.entries()) {
    if (now - state.lastActivity > timeout) {
      conversationState.delete(chatId);
      console.log(`🧹 Cleaned up stale conversation state for chat ${chatId}`);
    }
  }
}, 30 * 60 * 1000);

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

console.log('✅ Telegram Bot initialized successfully');

// Express route for webhook (optional, if switching to webhook mode)
router.post('/webhook', async (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'running',
    bot: bot.isPolling() ? 'polling' : 'stopped',
    conversations: conversationState.size
  });
});

module.exports = router;

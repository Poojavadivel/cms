// Server/Bot/telegram_bot_enhanced.js
// Enterprise-Grade Telegram Bot for Karur HMS with Complete Patient Data Collection
// Features: Complete appointment booking workflow, Gemini AI assistance, Smart validation

const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ==================== CONFIGURATION ====================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.Telegram_API;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karur_hms';
const GEMINI_API_KEY = process.env.Gemi_Api_Key || process.env.GEMINI_API_KEY;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not configured');
  process.exit(1);
}

// Initialize bot with proper error handling
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { 
  polling: {
    interval: 1000,
    autoStart: true,
    params: { timeout: 10 }
  }
});

// Initialize Gemini AI
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }) : null;

// ==================== DATABASE CONNECTION ====================

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Telegram Bot connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import models
const { Patient, Appointment, User } = require('../Models');

// ==================== STATE MANAGEMENT ====================

const conversations = new Map();

const STATES = {
  IDLE: 'idle',
  BOOKING_FIRST_NAME: 'booking_first_name',
  BOOKING_LAST_NAME: 'booking_last_name',
  BOOKING_AGE: 'booking_age',
  BOOKING_GENDER: 'booking_gender',
  BOOKING_PHONE: 'booking_phone',
  BOOKING_EMAIL: 'booking_email',
  BOOKING_ADDRESS: 'booking_address',
  BOOKING_CITY: 'booking_city',
  BOOKING_PINCODE: 'booking_pincode',
  BOOKING_BLOOD_GROUP: 'booking_blood_group',
  BOOKING_EMERGENCY_NAME: 'booking_emergency_name',
  BOOKING_EMERGENCY_PHONE: 'booking_emergency_phone',
  BOOKING_ALLERGIES: 'booking_allergies',
  BOOKING_MEDICAL_HISTORY: 'booking_medical_history',
  BOOKING_DATE: 'booking_date',
  BOOKING_TIME: 'booking_time',
  BOOKING_REASON: 'booking_reason',
  BOOKING_DOCTOR: 'booking_doctor',
  BOOKING_CONFIRM: 'booking_confirm',
};

function getConversation(chatId) {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, {
      state: STATES.IDLE,
      data: {},
      messageCount: 0,
      lastActivity: Date.now(),
    });
  }
  return conversations.get(chatId);
}

function updateConversation(chatId, updates) {
  const conv = getConversation(chatId);
  Object.assign(conv, updates, { lastActivity: Date.now() });
  conversations.set(chatId, conv);
}

function resetConversation(chatId) {
  conversations.set(chatId, {
    state: STATES.IDLE,
    data: {},
    messageCount: 0,
    lastActivity: Date.now(),
  });
}

// ==================== VALIDATION HELPERS ====================

function validatePhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.length >= 10 && /^[\d+]+$/.test(cleaned);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateAge(age) {
  const num = parseInt(age);
  return !isNaN(num) && num > 0 && num <= 120;
}

function validatePincode(pincode) {
  return /^\d{6}$/.test(pincode);
}

// ==================== AI HELPERS ====================

async function parseDateTimeWithGemini(userMessage) {
  if (!model) {
    console.warn('Gemini AI not configured');
    return { success: false, error: 'AI parsing not available' };
  }

  try {
    const now = new Date();
    const prompt = `
You are a date/time parser for medical appointments. Extract date and time from the user's message.
Current date/time: ${now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

User message: "${userMessage}"

Return ONLY valid JSON:
{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "success": true
}

If parsing fails:
{
  "success": false,
  "error": "Could not understand date/time"
}

Examples:
- "tomorrow 3pm" → {"date": "${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}", "time": "15:00", "success": true}
- "next monday 10:30am" → calculate correct Monday date
- "dec 25 2pm" → {"date": "2025-12-25", "time": "14:00", "success": true}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'Could not parse date/time' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.success) {
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

async function getDoctorsList() {
  try {
    const doctors = await User.find({ role: 'doctor', deleted_at: null })
      .select('firstName lastName email specialization')
      .limit(10)
      .lean();
    
    return doctors.map(d => ({
      id: d._id,
      name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown',
      specialization: d.specialization || 'General',
    }));
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

// ==================== PATIENT & APPOINTMENT CREATION ====================

async function createPatientFromConversation(data) {
  try {
    const patient = await Patient.create({
      firstName: data.firstName,
      lastName: data.lastName || '',
      name: `${data.firstName} ${data.lastName || ''}`.trim(),
      age: parseInt(data.age),
      gender: data.gender,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      pincode: data.pincode || '',
      bloodGroup: data.bloodGroup || '',
      emergencyContactName: data.emergencyName || '',
      emergencyContactPhone: data.emergencyPhone || '',
      allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
      medicalHistory: data.medicalHistory ? data.medicalHistory.split(',').map(m => m.trim()) : [],
      doctorId: data.doctorId || '',
      metadata: {
        source: 'telegram_bot',
        telegramChatId: data.telegramChatId,
      },
    });

    console.log(`✅ Patient created: ${patient._id}`);
    return patient;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
}

async function createAppointment(patientId, data) {
  try {
    const appointment = await Appointment.create({
      patientId: patientId,
      doctorId: data.doctorId || null,
      date: data.date,
      time: data.time,
      reason: data.reason || 'Consultation',
      status: 'Scheduled',
      metadata: {
        source: 'telegram_bot',
        telegramChatId: data.telegramChatId,
      },
    });

    console.log(`✅ Appointment created: ${appointment._id}`);
    return appointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

// ==================== BOT COMMAND HANDLERS ====================

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetConversation(chatId);

  const welcomeMessage = `
🏥 *Welcome to Karur Gastro Foundation HMS*

I'm your AI-powered healthcare assistant. I can help you with:

📅 */book* - Book a new appointment (complete patient registration)
📋 */appointments* - View your appointments
👤 */profile* - Manage your profile
🆘 */help* - Get help
❌ */cancel* - Cancel current operation

*Enterprise Features:*
✓ Complete patient data collection
✓ Smart date/time parsing with AI
✓ Doctor assignment
✓ Appointment confirmation

*Contact Us:*
📞 +91-XXXXX-XXXXX
📧 info@karurgastro.com

Type */book* to get started!
`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/book/, (msg) => {
  const chatId = msg.chat.id;
  const conv = getConversation(chatId);

  if (conv.state !== STATES.IDLE) {
    bot.sendMessage(chatId, '⚠️ You have an ongoing booking. Use /cancel to start fresh.');
    return;
  }

  updateConversation(chatId, {
    state: STATES.BOOKING_FIRST_NAME,
    data: { telegramChatId: chatId },
  });

  const message = `
📅 *New Appointment Booking - Enterprise Edition*

Welcome! I'll collect complete patient information for your appointment.

*Progress: Step 1/17*

Please enter your *first name*:

_(Type your answer or /cancel to abort)_
`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  resetConversation(chatId);
  bot.sendMessage(chatId, '❌ Booking cancelled. Type /book to start a new appointment.');
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
🆘 *Help & Information*

*Available Commands:*
📅 /book - Book appointment (17-step process)
📋 /appointments - View your appointments  
👤 /profile - Manage profile
❌ /cancel - Cancel current operation
🔄 /start - Restart bot

*Patient Data Collected:*
• Personal: First name, last name, age, gender, DOB
• Contact: Phone, email, address, city, pincode
• Medical: Blood group, allergies, medical history
• Emergency: Emergency contact name & phone
• Appointment: Date, time, reason, doctor preference

*AI Features:*
• Smart date/time parsing (e.g., "tomorrow 3pm")
• Natural language understanding
• Automatic validation

Need assistance? Contact: +91-XXXXX-XXXXX
`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// ==================== MESSAGE HANDLER (STATE MACHINE) ====================

bot.on('message', async (msg) => {
  // Ignore commands
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  const conv = getConversation(chatId);

  if (!text) {
    bot.sendMessage(chatId, '❓ Please send a text message.');
    return;
  }

  try {
    switch (conv.state) {
      case STATES.BOOKING_FIRST_NAME:
        conv.data.firstName = text;
        updateConversation(chatId, { state: STATES.BOOKING_LAST_NAME });
        bot.sendMessage(chatId, `Great! Now enter your *last name* (or type "skip"):\n\n*Progress: 2/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_LAST_NAME:
        conv.data.lastName = text.toLowerCase() === 'skip' ? '' : text;
        updateConversation(chatId, { state: STATES.BOOKING_AGE });
        bot.sendMessage(chatId, `Perfect! What is your *age*?\n\n*Progress: 3/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_AGE:
        if (!validateAge(text)) {
          bot.sendMessage(chatId, '❌ Invalid age. Please enter a number between 1-120:');
          return;
        }
        conv.data.age = text;
        updateConversation(chatId, { state: STATES.BOOKING_GENDER });
        
        const genderKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '👨 Male', callback_data: 'gender_Male' },
                { text: '👩 Female', callback_data: 'gender_Female' },
                { text: '⚧ Other', callback_data: 'gender_Other' },
              ],
            ],
          },
        };
        bot.sendMessage(chatId, `What is your *gender*?\n\n*Progress: 4/17*`, { parse_mode: 'Markdown', ...genderKeyboard });
        break;

      case STATES.BOOKING_PHONE:
        if (!validatePhone(text)) {
          bot.sendMessage(chatId, '❌ Invalid phone number. Please enter a valid 10-digit phone number:');
          return;
        }
        conv.data.phone = text;
        updateConversation(chatId, { state: STATES.BOOKING_EMAIL });
        bot.sendMessage(chatId, `Enter your *email address* (or type "skip"):\n\n*Progress: 6/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_EMAIL:
        if (text.toLowerCase() !== 'skip' && !validateEmail(text)) {
          bot.sendMessage(chatId, '❌ Invalid email. Please enter a valid email or "skip":');
          return;
        }
        conv.data.email = text.toLowerCase() === 'skip' ? '' : text;
        updateConversation(chatId, { state: STATES.BOOKING_ADDRESS });
        bot.sendMessage(chatId, `Enter your *address* (or type "skip"):\n\n*Progress: 7/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_ADDRESS:
        conv.data.address = text.toLowerCase() === 'skip' ? '' : text;
        updateConversation(chatId, { state: STATES.BOOKING_CITY });
        bot.sendMessage(chatId, `Enter your *city* (or type "skip"):\n\n*Progress: 8/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_CITY:
        conv.data.city = text.toLowerCase() === 'skip' ? '' : text;
        updateConversation(chatId, { state: STATES.BOOKING_PINCODE });
        bot.sendMessage(chatId, `Enter your *pincode* (or type "skip"):\n\n*Progress: 9/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_PINCODE:
        if (text.toLowerCase() !== 'skip' && !validatePincode(text)) {
          bot.sendMessage(chatId, '❌ Invalid pincode. Please enter a 6-digit pincode or "skip":');
          return;
        }
        conv.data.pincode = text.toLowerCase() === 'skip' ? '' : text;
        updateConversation(chatId, { state: STATES.BOOKING_BLOOD_GROUP });
        
        const bloodGroupKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'A+', callback_data: 'blood_A+' },
                { text: 'A-', callback_data: 'blood_A-' },
                { text: 'B+', callback_data: 'blood_B+' },
                { text: 'B-', callback_data: 'blood_B-' },
              ],
              [
                { text: 'O+', callback_data: 'blood_O+' },
                { text: 'O-', callback_data: 'blood_O-' },
                { text: 'AB+', callback_data: 'blood_AB+' },
                { text: 'AB-', callback_data: 'blood_AB-' },
              ],
              [
                { text: 'Unknown', callback_data: 'blood_Unknown' },
              ],
            ],
          },
        };
        bot.sendMessage(chatId, `Select your *blood group*:\n\n*Progress: 10/17*`, { parse_mode: 'Markdown', ...bloodGroupKeyboard });
        break;

      case STATES.BOOKING_EMERGENCY_NAME:
        conv.data.emergencyName = text;
        updateConversation(chatId, { state: STATES.BOOKING_EMERGENCY_PHONE });
        bot.sendMessage(chatId, `Enter *emergency contact phone number*:\n\n*Progress: 12/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_EMERGENCY_PHONE:
        if (!validatePhone(text)) {
          bot.sendMessage(chatId, '❌ Invalid phone number. Please enter a valid 10-digit phone number:');
          return;
        }
        conv.data.emergencyPhone = text;
        updateConversation(chatId, { state: STATES.BOOKING_ALLERGIES });
        bot.sendMessage(chatId, `List any *allergies* (comma-separated, or type "none"):\n\n*Progress: 13/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_ALLERGIES:
        conv.data.allergies = text.toLowerCase() === 'none' ? '' : text;
        updateConversation(chatId, { state: STATES.BOOKING_MEDICAL_HISTORY });
        bot.sendMessage(chatId, `Any significant *medical history*? (comma-separated, or type "none"):\n\n*Progress: 14/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_MEDICAL_HISTORY:
        conv.data.medicalHistory = text.toLowerCase() === 'none' ? '' : text;
        updateConversation(chatId, { state: STATES.BOOKING_DATE });
        bot.sendMessage(chatId, `📅 When would you like your appointment?\n\nExamples:\n• "tomorrow 3pm"\n• "next Monday 10:30am"\n• "25th December 2pm"\n\n*Progress: 15/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_DATE:
        // Try to parse with Gemini AI
        const parsed = await parseDateTimeWithGemini(text);
        if (!parsed.success) {
          bot.sendMessage(chatId, `❌ ${parsed.error}. Please try again with a clearer date/time format.`);
          return;
        }
        conv.data.date = parsed.date;
        conv.data.time = parsed.time;
        updateConversation(chatId, { state: STATES.BOOKING_REASON });
        bot.sendMessage(chatId, `✓ Appointment scheduled for *${parsed.date} at ${parsed.time}*\n\nWhat is the *reason* for your visit?\n\n*Progress: 16/17*`, { parse_mode: 'Markdown' });
        break;

      case STATES.BOOKING_REASON:
        conv.data.reason = text;
        updateConversation(chatId, { state: STATES.BOOKING_DOCTOR });
        
        // Fetch available doctors
        const doctors = await getDoctorsList();
        if (doctors.length === 0) {
          conv.data.doctorId = null;
          updateConversation(chatId, { state: STATES.BOOKING_CONFIRM });
          await showConfirmation(chatId, conv.data);
          return;
        }

        const doctorButtons = doctors.slice(0, 5).map(d => ([
          { text: `${d.name} (${d.specialization})`, callback_data: `doctor_${d.id}` },
        ]));
        doctorButtons.push([{ text: 'Any Available Doctor', callback_data: 'doctor_any' }]);

        bot.sendMessage(chatId, `Select a *doctor* (or choose any):\n\n*Progress: 17/17*`, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: doctorButtons },
        });
        break;

      default:
        if (conv.state === STATES.IDLE) {
          bot.sendMessage(chatId, '👋 Hi! Type /book to book an appointment or /help for assistance.');
        }
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again or use /cancel to restart.');
  }
});

// ==================== CALLBACK QUERY HANDLER ====================

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const conv = getConversation(chatId);

  try {
    // Gender selection
    if (data.startsWith('gender_')) {
      const gender = data.replace('gender_', '');
      conv.data.gender = gender;
      updateConversation(chatId, { state: STATES.BOOKING_PHONE });
      bot.editMessageText(`✓ Gender: *${gender}*`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
      });
      bot.sendMessage(chatId, `Enter your *phone number* (10 digits):\n\n*Progress: 5/17*`, { parse_mode: 'Markdown' });
    }

    // Blood group selection
    if (data.startsWith('blood_')) {
      const bloodGroup = data.replace('blood_', '');
      conv.data.bloodGroup = bloodGroup;
      updateConversation(chatId, { state: STATES.BOOKING_EMERGENCY_NAME });
      bot.editMessageText(`✓ Blood Group: *${bloodGroup}*`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
      });
      bot.sendMessage(chatId, `Enter *emergency contact name*:\n\n*Progress: 11/17*`, { parse_mode: 'Markdown' });
    }

    // Doctor selection
    if (data.startsWith('doctor_')) {
      const doctorId = data.replace('doctor_', '');
      conv.data.doctorId = doctorId === 'any' ? null : doctorId;
      updateConversation(chatId, { state: STATES.BOOKING_CONFIRM });
      
      const doctorText = doctorId === 'any' ? 'Any Available Doctor' : `Doctor ID: ${doctorId}`;
      bot.editMessageText(`✓ Doctor: *${doctorText}*`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
      });
      
      await showConfirmation(chatId, conv.data);
    }

    // Confirmation
    if (data === 'confirm_yes') {
      bot.editMessageText('⏳ Processing your booking...', {
        chat_id: chatId,
        message_id: query.message.message_id,
      });

      try {
        // Create patient
        const patient = await createPatientFromConversation(conv.data);
        
        // Create appointment
        const appointment = await createAppointment(patient._id, conv.data);

        const successMessage = `
✅ *Booking Successful!*

*Patient Details:*
Name: ${patient.name}
Age: ${patient.age}
Phone: ${patient.phone}

*Appointment Details:*
Date: ${appointment.date}
Time: ${appointment.time}
Reason: ${appointment.reason}
Status: ${appointment.status}

*Appointment ID:* \`${appointment._id}\`

You will receive a confirmation via phone/email shortly.

Thank you for choosing Karur Gastro Foundation!

Type /start to return to menu.
`;
        
        bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
        resetConversation(chatId);
      } catch (error) {
        console.error('Booking error:', error);
        bot.sendMessage(chatId, '❌ Failed to create booking. Please contact support or try again later.');
      }
    }

    if (data === 'confirm_no') {
      resetConversation(chatId);
      bot.editMessageText('❌ Booking cancelled. Type /book to start over.', {
        chat_id: chatId,
        message_id: query.message.message_id,
      });
    }

    bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Callback query error:', error);
    bot.answerCallbackQuery(query.id, { text: 'Error occurred' });
  }
});

async function showConfirmation(chatId, data) {
  const confirmMessage = `
📋 *Please Confirm Your Booking*

*Personal Information:*
👤 Name: ${data.firstName} ${data.lastName || ''}
🎂 Age: ${data.age}
⚧ Gender: ${data.gender}
📞 Phone: ${data.phone}
${data.email ? `📧 Email: ${data.email}` : ''}

*Address:*
${data.address || 'Not provided'}
${data.city || ''} ${data.pincode || ''}

*Medical Information:*
🩸 Blood Group: ${data.bloodGroup}
${data.allergies ? `⚠️ Allergies: ${data.allergies}` : ''}
${data.medicalHistory ? `📋 Medical History: ${data.medicalHistory}` : ''}

*Emergency Contact:*
${data.emergencyName} - ${data.emergencyPhone}

*Appointment Details:*
📅 Date: ${data.date}
🕐 Time: ${data.time}
📝 Reason: ${data.reason}

Is this information correct?
`;

  const confirmKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Confirm & Book', callback_data: 'confirm_yes' },
          { text: '❌ Cancel', callback_data: 'confirm_no' },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown', ...confirmKeyboard });
}

// ==================== ERROR HANDLING ====================

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// ==================== STARTUP ====================

console.log('🤖 Enhanced Telegram Bot started successfully');
console.log(`📱 Bot token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
console.log(`🧠 Gemini AI: ${model ? 'Enabled' : 'Disabled'}`);
console.log('✅ Waiting for messages...');

// Cleanup inactive conversations (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 minutes
  
  for (const [chatId, conv] of conversations.entries()) {
    if (now - conv.lastActivity > timeout && conv.state !== STATES.IDLE) {
      console.log(`🧹 Cleaning up inactive conversation: ${chatId}`);
      resetConversation(chatId);
    }
  }
}, 30 * 60 * 1000);

module.exports = bot;

// Server/Bot/telegram_bot.js
// Enterprise-Grade Telegram Bot for Karur HMS
// Features: Complete appointment booking with patient details, Gemini AI assistance

const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.Telegram_API || 'YOUR_BOT_TOKEN_HERE';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karur_hms';
const GEMINI_API_KEY = process.env.Gemi_Api_Key || process.env.GEMINI_API_KEY;

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

// In-memory conversation state (use Redis in production)
const conversations = new Map();

// Appointment booking states with complete patient data collection
const STATES = {
  IDLE: 'idle',
  BOOKING_FIRST_NAME: 'booking_first_name',
  BOOKING_LAST_NAME: 'booking_last_name',
  BOOKING_AGE: 'booking_age',
  BOOKING_GENDER: 'booking_gender',
  BOOKING_PHONE: 'booking_phone',
  BOOKING_EMAIL: 'booking_email',
  BOOKING_ADDRESS: 'booking_address',
  BOOKING_BLOOD_GROUP: 'booking_blood_group',
  BOOKING_ALLERGIES: 'booking_allergies',
  BOOKING_MEDICAL_HISTORY: 'booking_medical_history',
  BOOKING_EMERGENCY_CONTACT: 'booking_emergency_contact',
  BOOKING_EMERGENCY_PHONE: 'booking_emergency_phone',
  BOOKING_DATE: 'booking_date',
  BOOKING_TIME: 'booking_time',
  BOOKING_REASON: 'booking_reason',
  BOOKING_DOCTOR: 'booking_doctor',
  BOOKING_CONFIRM: 'booking_confirm',
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Telegram Bot connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Import models
const Patient = require('../Models').Patient;
const Appointment = require('../Models').Appointment;
const User = require('../Models').User;

// Helper functions
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

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padLeft(2, '0')}-${String(d.getDate()).padLeft(2, '0')}`;
}

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetConversation(chatId);

  const welcomeMessage = `
🏥 *Welcome to Karur Gastro Foundation HMS*

I'm your virtual healthcare assistant. Here's what I can help you with:

📅 */book* - Book a new appointment
📋 */myappointments* - View your appointments
👤 */profile* - View/Update your profile
🆘 */help* - Get help and information
❌ */cancel* - Cancel current operation

To get started, use any of the commands above!

*Need help?* Contact us at:
📞 +91-XXXXX-XXXXX
📧 info@karurgastro.com
`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/book/, (msg) => {
  const chatId = msg.chat.id;
  const conv = getConversation(chatId);

  if (conv.state !== STATES.IDLE) {
    bot.sendMessage(chatId, '⚠️ You already have an ongoing booking. Use /cancel to start fresh.');
    return;
  }

  updateConversation(chatId, {
    state: STATES.BOOKING_NAME,
    data: {},
  });

  const message = `
📅 *New Appointment Booking*

Let's collect some information to book your appointment.

*Step 1/9:* What is your *full name*?

_(Type your answer or /cancel to abort)_
`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  resetConversation(chatId);
  bot.sendMessage(chatId, '❌ Current operation cancelled. Type /book to start a new appointment.');
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
🆘 *Help & Information*

*Available Commands:*
📅 /book - Book a new appointment
📋 /myappointments - View your appointments  
👤 /profile - View/Update profile
❌ /cancel - Cancel current operation
🏠 /start - Return to main menu

*Appointment Booking Process:*
When you use /book, I'll ask you for:
1️⃣ Full Name
2️⃣ Age
3️⃣ Gender
4️⃣ Phone Number
5️⃣ Email (optional)
6️⃣ Preferred Date
7️⃣ Preferred Time
8️⃣ Reason for visit
9️⃣ Doctor selection

*Tips:*
• Make sure to enter valid phone numbers (10 digits)
• Dates should be in future (today or later)
• Times are in 24-hour format (e.g., 14:30)
• You can /cancel at any time

*Contact Us:*
📞 Phone: +91-XXXXX-XXXXX
📧 Email: info@karurgastro.com
🌐 Website: www.karurgastro.com
`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Main message handler for conversation flow
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  // Ignore commands (already handled)
  if (text?.startsWith('/')) return;

  const conv = getConversation(chatId);
  conv.messageCount++;

  try {
    switch (conv.state) {
      case STATES.BOOKING_NAME:
        await handleBookingName(chatId, text);
        break;
      case STATES.BOOKING_AGE:
        await handleBookingAge(chatId, text);
        break;
      case STATES.BOOKING_GENDER:
        await handleBookingGender(chatId, text);
        break;
      case STATES.BOOKING_PHONE:
        await handleBookingPhone(chatId, text);
        break;
      case STATES.BOOKING_EMAIL:
        await handleBookingEmail(chatId, text);
        break;
      case STATES.BOOKING_DATE:
        await handleBookingDate(chatId, text);
        break;
      case STATES.BOOKING_TIME:
        await handleBookingTime(chatId, text);
        break;
      case STATES.BOOKING_REASON:
        await handleBookingReason(chatId, text);
        break;
      case STATES.BOOKING_DOCTOR:
        await handleBookingDoctor(chatId, text);
        break;
      case STATES.BOOKING_CONFIRM:
        await handleBookingConfirm(chatId, text);
        break;
      default:
        // Idle state - provide guidance
        if (conv.messageCount % 3 === 0) {
          bot.sendMessage(chatId, '💡 Tip: Use /book to schedule an appointment or /help for assistance.');
        }
    }
  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again or use /cancel to restart.');
  }
});

// Booking flow handlers
async function handleBookingName(chatId, text) {
  if (!text || text.length < 2) {
    bot.sendMessage(chatId, '⚠️ Please enter a valid name (at least 2 characters).');
    return;
  }

  const conv = getConversation(chatId);
  conv.data.name = text;
  updateConversation(chatId, {
    state: STATES.BOOKING_AGE,
    data: conv.data,
  });

  bot.sendMessage(chatId, `✅ Name: *${text}*\n\n*Step 2/9:* What is your *age*?`, { parse_mode: 'Markdown' });
}

async function handleBookingAge(chatId, text) {
  const age = parseInt(text);

  if (isNaN(age) || age < 1 || age > 120) {
    bot.sendMessage(chatId, '⚠️ Please enter a valid age between 1 and 120.');
    return;
  }

  const conv = getConversation(chatId);
  conv.data.age = age;
  updateConversation(chatId, {
    state: STATES.BOOKING_GENDER,
    data: conv.data,
  });

  bot.sendMessage(chatId, `✅ Age: *${age}*\n\n*Step 3/9:* What is your *gender*?`, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [['Male', 'Female', 'Other']],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
}

async function handleBookingGender(chatId, text) {
  const validGenders = ['male', 'female', 'other'];
  const gender = text.toLowerCase();

  if (!validGenders.includes(gender)) {
    bot.sendMessage(chatId, '⚠️ Please select Male, Female, or Other.');
    return;
  }

  const conv = getConversation(chatId);
  conv.data.gender = text;
  updateConversation(chatId, {
    state: STATES.BOOKING_PHONE,
    data: conv.data,
  });

  bot.sendMessage(chatId, `✅ Gender: *${text}*\n\n*Step 4/9:* What is your *phone number*?\n\n_(10-digit mobile number)_`, {
    parse_mode: 'Markdown',
    reply_markup: { remove_keyboard: true },
  });
}

async function handleBookingPhone(chatId, text) {
  const phone = text.replace(/[^\d]/g, '');

  if (phone.length < 10) {
    bot.sendMessage(chatId, '⚠️ Please enter a valid 10-digit phone number.');
    return;
  }

  const conv = getConversation(chatId);
  conv.data.phone = phone;
  updateConversation(chatId, {
    state: STATES.BOOKING_EMAIL,
    data: conv.data,
  });

  bot.sendMessage(chatId, `✅ Phone: *${phone}*\n\n*Step 5/9:* What is your *email address*?\n\n_(Type "skip" if you don't have one)_`, {
    parse_mode: 'Markdown',
  });
}

async function handleBookingEmail(chatId, text) {
  const conv = getConversation(chatId);

  if (text.toLowerCase() === 'skip') {
    conv.data.email = '';
  } else {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(text)) {
      bot.sendMessage(chatId, '⚠️ Please enter a valid email or type "skip".');
      return;
    }
    conv.data.email = text;
  }

  updateConversation(chatId, {
    state: STATES.BOOKING_DATE,
    data: conv.data,
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  bot.sendMessage(chatId, `✅ Email: *${conv.data.email || 'Skipped'}*\n\n*Step 6/9:* What *date* would you like to book?\n\n_(Format: YYYY-MM-DD, e.g., ${formatDate(tomorrow)})_`, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [[formatDate(today), formatDate(tomorrow)]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
}

async function handleBookingDate(chatId, text) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(text)) {
    bot.sendMessage(chatId, '⚠️ Please enter date in format YYYY-MM-DD (e.g., 2025-02-01).');
    return;
  }

  const selectedDate = new Date(text);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    bot.sendMessage(chatId, '⚠️ Please select today or a future date.');
    return;
  }

  const conv = getConversation(chatId);
  conv.data.date = text;
  updateConversation(chatId, {
    state: STATES.BOOKING_TIME,
    data: conv.data,
  });

  bot.sendMessage(chatId, `✅ Date: *${text}*\n\n*Step 7/9:* What *time* would you prefer?\n\n_(Format: HH:MM, e.g., 14:30)_`, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [['09:00', '10:00', '11:00'], ['14:00', '15:00', '16:00']],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
}

async function handleBookingTime(chatId, text) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (!timeRegex.test(text)) {
    bot.sendMessage(chatId, '⚠️ Please enter time in format HH:MM (e.g., 14:30).');
    return;
  }

  const conv = getConversation(chatId);
  conv.data.time = text;
  updateConversation(chatId, {
    state: STATES.BOOKING_REASON,
    data: conv.data,
  });

  bot.sendMessage(chatId, `✅ Time: *${text}*\n\n*Step 8/9:* What is the *reason* for your visit?\n\n_(Describe your symptoms or health concern)_`, {
    parse_mode: 'Markdown',
    reply_markup: { remove_keyboard: true },
  });
}

async function handleBookingReason(chatId, text) {
  if (!text || text.length < 5) {
    bot.sendMessage(chatId, '⚠️ Please provide a brief reason (at least 5 characters).');
    return;
  }

  const conv = getConversation(chatId);
  conv.data.reason = text;
  updateConversation(chatId, {
    state: STATES.BOOKING_DOCTOR,
    data: conv.data,
  });

  // Fetch available doctors
  try {
    const doctors = await User.find({ role: 'doctor' }).limit(10).lean();

    if (doctors.length === 0) {
      bot.sendMessage(chatId, '⚠️ No doctors available. Please contact administration.');
      resetConversation(chatId);
      return;
    }

    conv.data.availableDoctors = doctors;
    updateConversation(chatId, { data: conv.data });

    let message = `✅ Reason: *${text}*\n\n*Step 9/9:* Select a *doctor*:\n\n`;

    doctors.forEach((doc, idx) => {
      const name = doc.firstName ? `${doc.firstName} ${doc.lastName || ''}`.trim() : 'Doctor';
      const specialty = doc.metadata?.specialization || 'General';
      message += `${idx + 1}. Dr. ${name} - ${specialty}\n`;
    });

    message += '\n_Reply with the number (1, 2, 3...) or type "any" for any available doctor_';

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    bot.sendMessage(chatId, '❌ Error loading doctors. Please try again.');
  }
}

async function handleBookingDoctor(chatId, text) {
  const conv = getConversation(chatId);
  const doctors = conv.data.availableDoctors || [];

  let selectedDoctor = null;

  if (text.toLowerCase() === 'any') {
    selectedDoctor = doctors[0]; // Assign first available
  } else {
    const selection = parseInt(text);
    if (isNaN(selection) || selection < 1 || selection > doctors.length) {
      bot.sendMessage(chatId, `⚠️ Please enter a number between 1 and ${doctors.length}, or type "any".`);
      return;
    }
    selectedDoctor = doctors[selection - 1];
  }

  conv.data.doctor = selectedDoctor;
  updateConversation(chatId, {
    state: STATES.BOOKING_CONFIRM,
    data: conv.data,
  });

  const doctorName = selectedDoctor.firstName ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName || ''}`.trim() : 'Doctor';

  const confirmationMessage = `
📋 *Appointment Summary*

👤 *Name:* ${conv.data.name}
🎂 *Age:* ${conv.data.age}
⚧ *Gender:* ${conv.data.gender}
📞 *Phone:* ${conv.data.phone}
📧 *Email:* ${conv.data.email || 'Not provided'}
📅 *Date:* ${conv.data.date}
🕐 *Time:* ${conv.data.time}
📝 *Reason:* ${conv.data.reason}
👨‍⚕️ *Doctor:* ${doctorName}

*Is this information correct?*
Reply "yes" to confirm or "no" to cancel.
`;

  bot.sendMessage(chatId, confirmationMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [['Yes', 'No']],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
}

async function handleBookingConfirm(chatId, text) {
  const conv = getConversation(chatId);

  if (text.toLowerCase() !== 'yes') {
    bot.sendMessage(chatId, '❌ Appointment booking cancelled. Use /book to start again.', {
      reply_markup: { remove_keyboard: true },
    });
    resetConversation(chatId);
    return;
  }

  try {
    // Create or find patient
    let patient = await Patient.findOne({
      phone: conv.data.phone,
    });

    if (!patient) {
      // Create new patient
      patient = new Patient({
        firstName: conv.data.name.split(' ')[0],
        lastName: conv.data.name.split(' ').slice(1).join(' '),
        age: conv.data.age,
        gender: conv.data.gender,
        phone: conv.data.phone,
        email: conv.data.email,
        metadata: {
          source: 'telegram_bot',
          telegramChatId: chatId,
        },
      });
      await patient.save();
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      patientName: conv.data.name,
      patientAge: conv.data.age,
      patientCode: patient.patientCode || `PAT-${patient._id.toString().slice(-6)}`,
      gender: conv.data.gender,
      doctorId: conv.data.doctor._id,
      date: conv.data.date,
      time: conv.data.time,
      reason: conv.data.reason,
      status: 'Scheduled',
      metadata: {
        bookedVia: 'telegram_bot',
        telegramChatId: chatId,
      },
    });
    await appointment.save();

    const doctorName = conv.data.doctor.firstName ? `Dr. ${conv.data.doctor.firstName} ${conv.data.doctor.lastName || ''}`.trim() : 'Doctor';

    const successMessage = `
✅ *Appointment Booked Successfully!*

🎫 *Appointment ID:* ${appointment._id}
👤 *Patient Code:* ${appointment.patientCode}
📅 *Date & Time:* ${conv.data.date} at ${conv.data.time}
👨‍⚕️ *Doctor:* ${doctorName}

*Important Notes:*
• Please arrive 15 minutes early
• Bring any relevant medical records
• Carry a valid ID proof

*Need to modify?*
Use /myappointments to view or contact us:
📞 +91-XXXXX-XXXXX

Thank you for choosing Karur Gastro Foundation! 🏥
`;

    bot.sendMessage(chatId, successMessage, {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true },
    });

    resetConversation(chatId);
  } catch (error) {
    console.error('Error creating appointment:', error);
    bot.sendMessage(chatId, '❌ Failed to create appointment. Please contact administration or try again later.', {
      reply_markup: { remove_keyboard: true },
    });
    resetConversation(chatId);
  }
}

// Clean up old conversations (run every hour)
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 60 * 60 * 1000; // 1 hour

  for (const [chatId, conv] of conversations.entries()) {
    if (now - conv.lastActivity > TIMEOUT) {
      conversations.delete(chatId);
      console.log(`Cleaned up conversation for chat ${chatId}`);
    }
  }
}, 60 * 60 * 1000);

console.log('🤖 Telegram bot is running...');

module.exports = bot;

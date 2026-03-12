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
  PATIENT_TYPE: 'patient_type',
  EXISTING_PATIENT_SEARCH: 'existing_patient_search',
  EXISTING_PATIENT_MENU: 'existing_patient_menu',
  BOOKING_NAME: 'booking_name',
  BOOKING_AGE: 'booking_age',
  BOOKING_GENDER: 'booking_gender',
  BOOKING_PHONE: 'booking_phone',
  BOOKING_EMAIL: 'booking_email',
  REGISTRATION_COMPLETE: 'registration_complete',
  BOOKING_DOCTOR: 'booking_doctor',
  BOOKING_DATE: 'booking_date',
  BOOKING_TIME: 'booking_time',
  BOOKING_REASON: 'booking_reason',
  BOOKING_CONFIRM: 'booking_confirm',
  DOWNLOAD_REPORT: 'download_report',
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
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Get available time slots for a doctor on a specific date (30-minute slots)
async function getAvailableTimeSlots(doctorId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all appointments for this doctor on this date
    const existingAppointments = await Appointment.find({
      doctorId: doctorId,
      startAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'No-Show'] }
    }).lean();

    // Define working hours (9 AM to 6 PM)
    const workingHours = {
      start: 9,
      end: 18
    };

    // Generate all possible 30-minute slots
    const allSlots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute of [0, 30]) {
        if (hour === workingHours.end - 1 && minute === 30) break; // Don't add 5:30 PM slot
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        allSlots.push(timeStr);
      }
    }

    // Filter out booked slots
    const bookedSlots = existingAppointments.map(apt => {
      const startTime = new Date(apt.startAt);
      const hour = String(startTime.getHours()).padStart(2, '0');
      const minute = String(startTime.getMinutes()).padStart(2, '0');
      return `${hour}:${minute}`;
    });

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
}

// Format time slots into groups for better display
function formatTimeSlotsForDisplay(slots) {
  if (slots.length === 0) return 'No slots available';
  
  const morning = slots.filter(s => parseInt(s.split(':')[0]) < 12);
  const afternoon = slots.filter(s => parseInt(s.split(':')[0]) >= 12 && parseInt(s.split(':')[0]) < 17);
  const evening = slots.filter(s => parseInt(s.split(':')[0]) >= 17);
  
  let message = '';
  if (morning.length > 0) {
    message += `🌅 *Morning:* ${morning.join(', ')}\n`;
  }
  if (afternoon.length > 0) {
    message += `☀️ *Afternoon:* ${afternoon.join(', ')}\n`;
  }
  if (evening.length > 0) {
    message += `🌆 *Evening:* ${evening.join(', ')}\n`;
  }
  
  return message;
}

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetConversation(chatId);

  const welcomeMessage = `
🏥 *Welcome to Movi Innovations HMS*

I'm your virtual healthcare assistant. 

*Are you a new patient or an existing patient?*

Please select an option below:
`;

  updateConversation(chatId, {
    state: STATES.PATIENT_TYPE,
    data: {},
  });

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [['🆕 New Patient', '👤 Existing Patient']],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
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

*Step 1/8:* What is your *full name*?

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
6️⃣ Reason for visit
7️⃣ Doctor selection
8️⃣ Appointment date & time

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
      case STATES.PATIENT_TYPE:
        await handlePatientType(chatId, text);
        break;
      case STATES.EXISTING_PATIENT_SEARCH:
        await handleExistingPatientSearch(chatId, text);
        break;
      case STATES.EXISTING_PATIENT_MENU:
        await handleExistingPatientMenu(chatId, text);
        break;
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
      case STATES.REGISTRATION_COMPLETE:
        await handleRegistrationComplete(chatId, text);
        break;
      case STATES.BOOKING_DOCTOR:
        await handleBookingDoctor(chatId, text);
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
      case STATES.BOOKING_CONFIRM:
        await handleBookingConfirm(chatId, text);
        break;
      case STATES.DOWNLOAD_REPORT:
        await handleDownloadReport(chatId, text);
        break;
      default:
        // Idle state - provide guidance
        if (conv.messageCount % 3 === 0) {
          bot.sendMessage(chatId, '💡 Tip: Use /start to begin or /help for assistance.');
        }
    }
  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again or use /cancel to restart.');
  }
});

// Booking flow handlers
async function handlePatientType(chatId, text) {
  const conv = getConversation(chatId);
  
  if (text.includes('New Patient') || text.toLowerCase().includes('new')) {
    // New patient flow - collect full details
    conv.data.patientType = 'new';
    updateConversation(chatId, {
      state: STATES.BOOKING_NAME,
      data: conv.data,
    });

    const message = `
📅 *New Patient Registration*

Let's collect your information to book your appointment.

*Step 1/8:* What is your *full name*?

_(Type your answer or /cancel to abort)_
`;

    bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  } else if (text.includes('Existing Patient') || text.toLowerCase().includes('existing')) {
    // Existing patient flow - search by phone or patient code
    conv.data.patientType = 'existing';
    updateConversation(chatId, {
      state: STATES.EXISTING_PATIENT_SEARCH,
      data: conv.data,
    });

    const message = `
👤 *Existing Patient*

Please provide your *phone number* or *patient code* to retrieve your information:

_(Type your phone number or patient code)_
`;

    bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  } else {
    bot.sendMessage(chatId, '⚠️ Please select either "New Patient" or "Existing Patient".');
  }
}

async function handleExistingPatientSearch(chatId, text) {
  const conv = getConversation(chatId);
  
  try {
    // Search by phone number or patient code
    let patient = await Patient.findOne({
      $or: [
        { phone: text.replace(/[^\d]/g, '') },
        { patientCode: text.trim() }
      ]
    }).lean();

    if (!patient) {
      bot.sendMessage(chatId, '❌ No patient found with that information. Please try again or use /cancel to start over as a new patient.');
      return;
    }

    // Patient found - store in conversation and show menu
    conv.data.existingPatient = patient;
    conv.data.patientId = patient._id;
    conv.data.name = `${patient.firstName} ${patient.lastName || ''}`.trim();
    conv.data.age = patient.age;
    conv.data.gender = patient.gender;
    conv.data.phone = patient.phone;
    conv.data.email = patient.email;

    updateConversation(chatId, {
      state: STATES.EXISTING_PATIENT_MENU,
      data: conv.data,
    });

    const message = `
✅ *Patient Verified!*

👤 *Name:* ${conv.data.name}
🎂 *Age:* ${patient.age}
📞 *Phone:* ${patient.phone}
🆔 *Patient Code:* ${patient.patientCode || 'N/A'}

*What would you like to do?*
`;

    bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          ['📅 Schedule Appointment'],
          ['📄 Download Reports']
        ],
        one_time_keyboard: true,
        resize_keyboard: true,
      }
    });
  } catch (error) {
    console.error('Error searching patient:', error);
    bot.sendMessage(chatId, '❌ Error searching for patient. Please try again.');
  }
}

async function handleExistingPatientMenu(chatId, text) {
  const conv = getConversation(chatId);
  
  if (text.includes('Schedule Appointment') || text.toLowerCase().includes('schedule')) {
    // Go to doctor selection
    updateConversation(chatId, {
      state: STATES.BOOKING_DOCTOR,
      data: conv.data,
    });
    await showDoctorSelection(chatId);
  } else if (text.includes('Download Reports') || text.toLowerCase().includes('report')) {
    // Go to download reports
    updateConversation(chatId, {
      state: STATES.DOWNLOAD_REPORT,
      data: conv.data,
    });
    await showAvailableReports(chatId, conv.data.patientId);
  } else {
    bot.sendMessage(chatId, '⚠️ Please select either "Schedule Appointment" or "Download Reports".');
  }
}

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

  bot.sendMessage(chatId, `✅ Name: *${text}*\n\n*Step 2/8:* What is your *age*?`, { parse_mode: 'Markdown' });
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

  bot.sendMessage(chatId, `✅ Age: *${age}*\n\n*Step 3/8:* What is your *gender*?`, {
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

  bot.sendMessage(chatId, `✅ Gender: *${text}*\n\n*Step 4/8:* What is your *phone number*?\n\n_(10-digit mobile number)_`, {
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

  bot.sendMessage(chatId, `✅ Phone: *${phone}*\n\n*Step 5/8:* What is your *email address*?\n\n_(Type "skip" if you don't have one)_`, {
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

  // Create patient record first
  try {
    const patient = new Patient({
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

    conv.data.patientId = patient._id;
    conv.data.patientCode = patient.patientCode;

    updateConversation(chatId, {
      state: STATES.REGISTRATION_COMPLETE,
      data: conv.data,
    });

    const message = `
✅ *Registration Complete!*

👤 *Name:* ${conv.data.name}
🎂 *Age:* ${conv.data.age}
⚧ *Gender:* ${conv.data.gender}
📞 *Phone:* ${conv.data.phone}
📧 *Email:* ${conv.data.email || 'Not provided'}
🆔 *Patient Code:* ${patient.patientCode || 'Generated'}

*Would you like to schedule an appointment now?*
`;

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [['✅ Yes, Schedule Now', '❌ No, Later']],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    bot.sendMessage(chatId, '❌ Error creating patient record. Please try again or contact support.');
  }
}

async function handleRegistrationComplete(chatId, text) {
  const conv = getConversation(chatId);

  if (text.includes('Yes') || text.toLowerCase().includes('yes') || text.toLowerCase().includes('schedule')) {
    updateConversation(chatId, {
      state: STATES.BOOKING_DOCTOR,
      data: conv.data,
    });
    await showDoctorSelection(chatId);
  } else {
    const message = `
✅ *Registration Successful!*

Your patient code is: *${conv.data.patientCode}*

You can schedule an appointment anytime by:
1. Using /start command
2. Selecting "Existing Patient"
3. Entering your phone number or patient code

Thank you for registering with Movi Innovations HMS! 🏥
`;
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true },
    });
    resetConversation(chatId);
  }
}

async function handleBookingDate(chatId, text) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(text)) {
    bot.sendMessage(chatId, '⚠️ Please enter date in format YYYY-MM-DD (e.g., 2026-02-20).');
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

  // Get available time slots for selected doctor and date
  try {
    const availableSlots = await getAvailableTimeSlots(conv.data.doctor._id, text);

    if (availableSlots.length === 0) {
      bot.sendMessage(chatId, `⚠️ No available slots for ${text}. Please select another date or /cancel to start over.`);
      return;
    }

    conv.data.availableSlots = availableSlots;
    updateConversation(chatId, {
      state: STATES.BOOKING_TIME,
      data: conv.data,
    });

    const slotsDisplay = formatTimeSlotsForDisplay(availableSlots);
    const doctorName = conv.data.doctor.firstName ? `Dr. ${conv.data.doctor.firstName} ${conv.data.doctor.lastName || ''}`.trim() : 'Doctor';

    // Create keyboard with first 6 slots
    const keyboardSlots = availableSlots.slice(0, 6);
    const keyboard = [];
    for (let i = 0; i < keyboardSlots.length; i += 3) {
      keyboard.push(keyboardSlots.slice(i, i + 3));
    }

    bot.sendMessage(chatId, `✅ Date: *${text}*\n\n📅 Available time slots for *${doctorName}*:\n\n${slotsDisplay}\n_Each appointment is 30 minutes. Select your preferred time:_`, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: keyboard,
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    bot.sendMessage(chatId, '❌ Error checking availability. Please try again.');
  }
}

async function handleBookingTime(chatId, text) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (!timeRegex.test(text)) {
    bot.sendMessage(chatId, '⚠️ Please enter time in format HH:MM (e.g., 14:30).');
    return;
  }

  const conv = getConversation(chatId);
  
  // Validate that the selected time is in available slots
  if (!conv.data.availableSlots || !conv.data.availableSlots.includes(text)) {
    bot.sendMessage(chatId, '⚠️ This time slot is not available. Please select from the available slots shown above.');
    return;
  }

  conv.data.time = text;
  updateConversation(chatId, {
    state: STATES.BOOKING_CONFIRM,
    data: conv.data,
  });

  const doctorName = conv.data.doctor.firstName ? `Dr. ${conv.data.doctor.firstName} ${conv.data.doctor.lastName || ''}`.trim() : 'Doctor';

  const confirmationMessage = `
📋 *Appointment Summary*

👤 *Name:* ${conv.data.name}
🎂 *Age:* ${conv.data.age}
⚧ *Gender:* ${conv.data.gender}
📞 *Phone:* ${conv.data.phone}
📧 *Email:* ${conv.data.email || 'Not provided'}
📝 *Reason:* ${conv.data.reason}
👨‍⚕️ *Doctor:* ${doctorName}
📅 *Date:* ${conv.data.date}
🕐 *Time:* ${conv.data.time} (30 minutes)

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

async function handleBookingReason(chatId, text) {
  if (!text || text.length < 5) {
    bot.sendMessage(chatId, '⚠️ Please provide a brief reason (at least 5 characters).');
    return;
  }

  const conv = getConversation(chatId);
  conv.data.reason = text;
  updateConversation(chatId, {
    state: STATES.BOOKING_DATE,
    data: conv.data,
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const message = `✅ Reason: *${text}*\n\n*Select appointment date:*`;

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [[formatDate(today)], [formatDate(tomorrow)], [formatDate(dayAfter)]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
}

async function showDoctorSelection(chatId) {
  try {
    const doctors = await User.find({ role: 'doctor', is_active: true }).limit(20).lean();

    if (doctors.length === 0) {
      bot.sendMessage(chatId, '⚠️ No doctors available. Please contact administration.');
      resetConversation(chatId);
      return;
    }

    const conv = getConversation(chatId);
    conv.data.availableDoctors = doctors;
    updateConversation(chatId, { data: conv.data });

    let message = `👨‍⚕️ *Select your preferred doctor:*\n\n`;

    doctors.forEach((doc, idx) => {
      const name = doc.firstName ? `${doc.firstName} ${doc.lastName || ''}`.trim() : 'Doctor';
      const specialty = doc.metadata?.specialization || doc.metadata?.department || 'General Physician';
      message += `${idx + 1}. Dr. ${name} - ${specialty}\n`;
    });

    message += '\n_Reply with the number (1, 2, 3...)_';

    bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    bot.sendMessage(chatId, '❌ Error loading doctors. Please try again.');
  }
}

async function handleBookingDoctor(chatId, text) {
  const conv = getConversation(chatId);
  const doctors = conv.data.availableDoctors || [];

  const selection = parseInt(text);
  if (isNaN(selection) || selection < 1 || selection > doctors.length) {
    bot.sendMessage(chatId, `⚠️ Please enter a number between 1 and ${doctors.length}.`);
    return;
  }
  
  const selectedDoctor = doctors[selection - 1];
  conv.data.doctor = selectedDoctor;
  updateConversation(chatId, {
    state: STATES.BOOKING_REASON,
    data: conv.data,
  });

  const doctorName = selectedDoctor.firstName ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName || ''}`.trim() : 'Doctor';

  bot.sendMessage(chatId, `✅ Selected Doctor: *${doctorName}*\n\n*What is the reason for your visit?*\n\n_(Describe your symptoms or health concern)_`, {
    parse_mode: 'Markdown',
    reply_markup: { remove_keyboard: true }
  });
}

async function handleBookingConfirm(chatId, text) {
  const conv = getConversation(chatId);

  if (text.toLowerCase() !== 'yes') {
    bot.sendMessage(chatId, '❌ Appointment booking cancelled. Use /start to begin again.', {
      reply_markup: { remove_keyboard: true },
    });
    resetConversation(chatId);
    return;
  }

  try {
    // Use existing patient ID from registration or search
    const patientId = conv.data.patientId;
    
    if (!patientId) {
      bot.sendMessage(chatId, '❌ Patient information missing. Please start over with /start');
      resetConversation(chatId);
      return;
    }

    // Create appointment with proper startAt and endAt times
    const [hours, minutes] = conv.data.time.split(':').map(Number);
    const appointmentStart = new Date(conv.data.date);
    appointmentStart.setHours(hours, minutes, 0, 0);
    
    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 30); // 30-minute appointment

    const appointment = new Appointment({
      patientId: patientId,
      doctorId: conv.data.doctor._id,
      appointmentType: 'Consultation',
      startAt: appointmentStart,
      endAt: appointmentEnd,
      status: 'Scheduled',
      notes: conv.data.reason,
      bookingSource: 'telegram',
      telegramChatId: chatId,
      metadata: {
        bookedVia: 'telegram_bot',
        telegramChatId: chatId,
        patientName: conv.data.name,
        patientAge: conv.data.age,
        patientGender: conv.data.gender,
        reason: conv.data.reason,
      },
    });
    await appointment.save();

    const doctorName = conv.data.doctor.firstName ? `Dr. ${conv.data.doctor.firstName} ${conv.data.doctor.lastName || ''}`.trim() : 'Doctor';

    const successMessage = `
✅ *Appointment Booked Successfully!*

🎫 *Appointment Code:* ${appointment.appointmentCode || appointment._id}
👤 *Patient Code:* ${conv.data.patientCode || 'N/A'}
📅 *Date & Time:* ${conv.data.date} at ${conv.data.time}
⏱️ *Duration:* 30 minutes
👨‍⚕️ *Doctor:* ${doctorName}
📝 *Reason:* ${conv.data.reason}

*Important Notes:*
• Please arrive 15 minutes early
• Bring any relevant medical records
• Carry a valid ID proof
• Your appointment slot is reserved for 30 minutes

*Need help?*
📞 +91-XXXXX-XXXXX
📧 info@moviinnovations.com

Thank you for choosing Movi Innovations! 🏥
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

async function showAvailableReports(chatId, patientId) {
  try {
    const Report = require('../Models').Report || mongoose.model('Report');
    
    const reports = await Report.find({ patientId: patientId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (reports.length === 0) {
      bot.sendMessage(chatId, '📄 No reports found for your account.\n\nUse /start to return to menu.', {
        reply_markup: { remove_keyboard: true }
      });
      resetConversation(chatId);
      return;
    }

    let message = `📄 *Your Available Reports:*\n\n`;

    reports.forEach((report, idx) => {
      const date = new Date(report.createdAt).toLocaleDateString();
      const type = report.reportType || 'Medical Report';
      message += `${idx + 1}. ${type} - ${date}\n`;
    });

    message += '\n_Reply with the number to download (1, 2, 3...)_\n_Or type "cancel" to go back_';

    const conv = getConversation(chatId);
    conv.data.availableReports = reports;
    updateConversation(chatId, { data: conv.data });

    bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    bot.sendMessage(chatId, '❌ Error loading reports. Please try again later.');
    resetConversation(chatId);
  }
}

async function handleDownloadReport(chatId, text) {
  const conv = getConversation(chatId);
  
  if (text.toLowerCase() === 'cancel') {
    bot.sendMessage(chatId, '❌ Cancelled. Use /start to return to menu.');
    resetConversation(chatId);
    return;
  }

  const reports = conv.data.availableReports || [];
  const selection = parseInt(text);

  if (isNaN(selection) || selection < 1 || selection > reports.length) {
    bot.sendMessage(chatId, `⚠️ Please enter a number between 1 and ${reports.length}, or "cancel".`);
    return;
  }

  const selectedReport = reports[selection - 1];

  try {
    if (selectedReport.filePath) {
      // Send the report file
      await bot.sendDocument(chatId, selectedReport.filePath, {
        caption: `📄 ${selectedReport.reportType || 'Medical Report'}\nDate: ${new Date(selectedReport.createdAt).toLocaleDateString()}`,
      });
      
      bot.sendMessage(chatId, '✅ Report sent successfully!\n\nUse /start to return to menu.');
    } else {
      bot.sendMessage(chatId, '❌ Report file not available. Please contact administration.');
    }
    
    resetConversation(chatId);
  } catch (error) {
    console.error('Error sending report:', error);
    bot.sendMessage(chatId, '❌ Error sending report. Please contact administration.');
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

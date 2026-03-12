/**
 * telegram/commandHandlers.js
 * Handlers for Telegram bot commands
 */

const bot = require('./botInstance');
const { getState, resetState, updateStep } = require('./stateManager');
const { getUserAppointments } = require('./appointmentService');
const Patient = require('../../Models/Patient');
const PatientPDF = require('../../Models/PatientPDF');

/**
 * Handle /start command
 */
async function handleStart(msg) {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  await bot.sendMessage(chatId,
    `👋 *Welcome to Movi Innovations Hospital!*\n\n` +
    `I'm your friendly appointment booking assistant. Here's what I can help you with:\n\n` +
    `📅 *Book Appointments* - /book\n` +
    `📋 *View Your Appointments* - /myappointments\n` +
    `📄 *View Medical Records* - /records\n` +
    `❓ *Help* - /help\n\n` +
    `Let's get started! Use /book to schedule your appointment.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📅 Book Appointment', callback_data: 'start_booking' }],
          [{ text: '📋 My Appointments', callback_data: 'view_appointments' }]
        ]
      }
    }
  );
}

/**
 * Handle /help command
 */
async function handleHelp(msg) {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId,
    `*📖 Help & Commands*\n\n` +
    `*Available Commands:*\n` +
    `/start - Welcome message\n` +
    `/book - Book a new appointment\n` +
    `/myappointments - View your appointments\n` +
    `/records - View medical records\n` +
    `/cancel - Cancel current booking\n` +
    `/help - Show this help message\n\n` +
    `*How to Book:*\n` +
    `1. Use /book command\n` +
    `2. Choose new or existing patient\n` +
    `3. Provide your details\n` +
    `4. Enter appointment date/time (e.g., "tomorrow 3pm")\n` +
    `5. Confirm your booking\n\n` +
    `Need assistance? Just ask!`,
    { parse_mode: 'Markdown' }
  );
}

/**
 * Handle /book command
 */
async function handleBook(msg) {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  const state = getState(chatId);
  state.data.username = username;
  updateStep(chatId, 'waiting_patient_type');

  await bot.sendMessage(chatId,
    `📝 *Let's book your appointment!*\n\n` +
    `Are you a new or existing patient?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🆕 New Patient', callback_data: 'patient_new' }],
          [{ text: '👤 Existing Patient', callback_data: 'patient_existing' }]
        ]
      }
    }
  );
}

/**
 * Handle /myappointments command
 */
async function handleMyAppointments(msg) {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from.id;

  await bot.sendMessage(chatId, '🔍 Fetching your appointments...');

  const appointments = await getUserAppointments(telegramUserId.toString());

  if (appointments.length === 0) {
    await bot.sendMessage(chatId,
      `📋 *No appointments found*\n\n` +
      `You don't have any scheduled appointments.\n\n` +
      `Use /book to schedule one!`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  let message = `📋 *Your Appointments:*\n\n`;

  appointments.forEach((apt, index) => {
    const patientName = apt.patientId 
      ? `${apt.patientId.firstName} ${apt.patientId.lastName}` 
      : 'Unknown';
    const doctorName = apt.doctorId 
      ? `${apt.doctorId.firstName} ${apt.doctorId.lastName}` 
      : 'TBA';
    const date = new Date(apt.startAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    message += `*${index + 1}. Appointment ${apt.appointmentCode}*\n`;
    message += `👤 Patient: ${patientName}\n`;
    message += `👨‍⚕️ Doctor: Dr. ${doctorName}\n`;
    message += `📅 Date: ${date}\n`;
    message += `📍 Location: ${apt.location}\n`;
    message += `📊 Status: ${apt.status}\n\n`;
  });

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Handle /records command
 */
async function handleRecords(msg) {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from.id;

  await bot.sendMessage(chatId, '🔍 Searching for your medical records...');

  const patient = await Patient.findOne({ telegramUserId: telegramUserId.toString() });

  if (!patient) {
    await bot.sendMessage(chatId,
      `❌ *No patient record found*\n\n` +
      `You need to book an appointment first to create your patient record.\n\n` +
      `Use /book to get started!`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const pdfs = await PatientPDF.find({ patientId: patient._id })
    .sort({ uploadedAt: -1 })
    .limit(10)
    .lean();

  if (pdfs.length === 0) {
    await bot.sendMessage(chatId,
      `📄 *Patient Record Found*\n\n` +
      `👤 *Name:* ${patient.firstName} ${patient.lastName}\n` +
      `📱 *Phone:* ${patient.phone}\n` +
      `🩸 *Blood Group:* ${patient.bloodGroup}\n\n` +
      `No medical documents uploaded yet.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  let message = `📄 *Your Medical Records*\n\n`;
  message += `👤 ${patient.firstName} ${patient.lastName}\n\n`;

  pdfs.forEach((pdf, index) => {
    const uploadDate = new Date(pdf.uploadedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    message += `${index + 1}. ${pdf.title || pdf.fileName}\n`;
    message += `   📅 ${uploadDate}\n\n`;
  });

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Handle /cancel command
 */
async function handleCancel(msg) {
  const chatId = msg.chat.id;
  resetState(chatId);
  await bot.sendMessage(chatId,
    `❌ *Booking Cancelled*\n\n` +
    `Your current booking has been cancelled.\n\n` +
    `Use /book to start again.`,
    { parse_mode: 'Markdown' }
  );
}

module.exports = {
  handleStart,
  handleHelp,
  handleBook,
  handleMyAppointments,
  handleRecords,
  handleCancel
};

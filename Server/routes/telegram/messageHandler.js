/**
 * telegram/messageHandler.js
 * Handle conversational messages
 */

const bot = require('./botInstance');
const { getState, updateStep, updateData } = require('./stateManager');
const { parseDateTimeWithGemini } = require('./geminiService');
const { createAppointment } = require('./appointmentService');
const Patient = require('../../Models/Patient');

/**
 * Handle text messages based on conversation state
 */
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userMessage = msg.text;
  const telegramUserId = msg.from.id;

  const state = getState(chatId);

  switch (state.step) {
    case 'waiting_patient_id':
      await handlePatientIdInput(chatId, userMessage);
      break;

    case 'waiting_patient_name':
      await handlePatientNameInput(chatId, userMessage);
      break;

    case 'waiting_full_name':
      await handleFullNameInput(chatId, userMessage);
      break;

    case 'waiting_phone':
      await handlePhoneInput(chatId, userMessage);
      break;

    case 'waiting_reason':
      await handleReasonInput(chatId, userMessage);
      break;

    case 'waiting_datetime':
      await handleDateTimeInput(chatId, userMessage, telegramUserId);
      break;

    default:
      // No active conversation
      await bot.sendMessage(chatId,
        `I didn't understand that. Use /help to see available commands.`
      );
  }
}

async function handlePatientIdInput(chatId, patientIdentifier) {
  const state = getState(chatId);

  await bot.sendMessage(chatId, '🔍 Searching for your record...');

  let patient = await Patient.findOne({
    $or: [
      { phone: patientIdentifier },
      { _id: patientIdentifier.match(/^[0-9a-fA-F]{24}$/) ? patientIdentifier : null }
    ]
  });

  if (!patient) {
    await bot.sendMessage(chatId,
      `❌ Patient record not found.\n\n` +
      `Please check your phone number or patient ID and try again.\n\n` +
      `Or use /book to register as a new patient.`
    );
    return;
  }

  updateData(chatId, {
    patientId: patient._id,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email,
    bloodGroup: patient.bloodGroup,
    isExisting: true
  });
  
  updateStep(chatId, 'waiting_patient_name');

  await bot.sendMessage(chatId,
    `✅ *Patient Record Found!*\n\n` +
    `📱 *Phone:* ${state.data.phone}\n\n` +
    `Please confirm your *full name*:`,
    { parse_mode: 'Markdown' }
  );
}

async function handlePatientNameInput(chatId, fullName) {
  updateData(chatId, { fullName: fullName.trim() });
  updateStep(chatId, 'waiting_reason');

  const state = getState(chatId);

  await bot.sendMessage(chatId,
    `Thanks, ${state.data.fullName}!\n\n` +
    `What is the *reason for your visit*?\n\n` +
    `(e.g., "Regular checkup", "Stomach pain", "Follow-up consultation", etc.)`,
    { parse_mode: 'Markdown' }
  );
}

async function handleFullNameInput(chatId, fullName) {
  updateData(chatId, { fullName: fullName.trim(), isExisting: false });
  updateStep(chatId, 'waiting_phone');

  await bot.sendMessage(chatId, 
    `Thanks, ${fullName.trim()}!\n\nNow, please provide your *phone number*:`, 
    { parse_mode: 'Markdown' }
  );
}

async function handlePhoneInput(chatId, phone) {
  const phoneNumber = phone.trim();
  
  if (phoneNumber.length < 10 || !/^\+?[\d\s-()]+$/.test(phoneNumber)) {
    await bot.sendMessage(chatId, `❌ Please enter a valid phone number (at least 10 digits):`);
    return;
  }

  updateData(chatId, { phone: phoneNumber });
  updateStep(chatId, 'waiting_blood_group');

  await bot.sendMessage(chatId,
    `Perfect! What is your *blood group*?`,
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
}

async function handleReasonInput(chatId, reason) {
  updateData(chatId, { reason: reason.trim() });
  updateStep(chatId, 'waiting_datetime');

  await bot.sendMessage(chatId,
    `Great! Now, when would you like to schedule your appointment?\n\n` +
    `You can type naturally like:\n` +
    `• "tomorrow at 3pm"\n` +
    `• "next Monday 10:30 AM"\n` +
    `• "25th December 2pm"\n\n` +
    `What works best for you?`
  );
}

async function handleDateTimeInput(chatId, userMessage, telegramUserId) {
  await bot.sendMessage(chatId, '⏳ Processing your request...');

  const parsed = await parseDateTimeWithGemini(userMessage);

  if (!parsed.success) {
    await bot.sendMessage(chatId,
      `❌ ${parsed.error || 'Could not understand the date/time'}\n\n` +
      `Please try again with a clear date and time like:\n` +
      `• "tomorrow at 3pm"\n` +
      `• "next Monday 10:30 AM"`
    );
    return;
  }

  const state = getState(chatId);
  updateData(chatId, { dateTime: parsed.dateTime });
  updateStep(chatId, 'confirming');

  const dateStr = parsed.dateTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  await bot.sendMessage(chatId,
    `📋 *Please confirm your appointment details:*\n\n` +
    `👤 *Name:* ${state.data.fullName}\n` +
    `📱 *Phone:* ${state.data.phone}\n` +
    `🩸 *Blood Group:* ${state.data.bloodGroup || 'Unknown'}\n` +
    `📅 *Date & Time:* ${dateStr}\n` +
    `📝 *Reason:* ${state.data.reason}\n\n` +
    `Is this correct?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Confirm', callback_data: 'confirm_booking' },
            { text: '❌ Cancel', callback_data: 'cancel_booking' }
          ]
        ]
      }
    }
  );
}

module.exports = {
  handleMessage
};

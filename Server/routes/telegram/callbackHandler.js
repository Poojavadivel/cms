/**
 * telegram/callbackHandler.js
 * Handle callback queries from inline keyboards
 */

const bot = require('./botInstance');
const { getState, resetState, updateStep, updateData } = require('./stateManager');
const { createAppointment } = require('./appointmentService');

/**
 * Handle callback queries
 */
async function handleCallbackQuery(query) {
  try {
    const chatId = query.message.chat.id;
    const data = query.data;
    const telegramUserId = query.from.id;

    const state = getState(chatId);

    // Handle different callback types
    if (data === 'start_booking') {
      await handleStartBooking(chatId, query);
    } else if (data === 'patient_new') {
      await handleNewPatient(chatId, query);
    } else if (data === 'patient_existing') {
      await handleExistingPatient(chatId, query);
    } else if (data.startsWith('blood_')) {
      await handleBloodGroup(chatId, query, data);
    } else if (data === 'confirm_booking') {
      await handleConfirmBooking(chatId, query, telegramUserId);
    } else if (data === 'cancel_booking') {
      await handleCancelBooking(chatId, query);
    } else if (data === 'view_appointments') {
      await bot.answerCallbackQuery(query.id);
      // Trigger /myappointments command
      require('./commandHandlers').handleMyAppointments({ chat: { id: chatId }, from: { id: telegramUserId } });
    }

  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.answerCallbackQuery(query.id, { text: 'An error occurred' });
  }
}

async function handleStartBooking(chatId, query) {
  await bot.answerCallbackQuery(query.id);
  const state = getState(chatId);
  state.data.username = query.from.username || query.from.first_name;
  updateStep(chatId, 'waiting_patient_type');

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: chatId, message_id: query.message.message_id }
  );

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

async function handleNewPatient(chatId, query) {
  await bot.answerCallbackQuery(query.id);
  updateStep(chatId, 'waiting_full_name');

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: chatId, message_id: query.message.message_id }
  );

  await bot.sendMessage(chatId,
    `Great! Let's get you registered.\n\n` +
    `What is your *full name*?`,
    { parse_mode: 'Markdown' }
  );
}

async function handleExistingPatient(chatId, query) {
  await bot.answerCallbackQuery(query.id);
  updateStep(chatId, 'waiting_patient_id');

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: chatId, message_id: query.message.message_id }
  );

  await bot.sendMessage(chatId,
    `Please enter your *phone number* or *patient ID*:`,
    { parse_mode: 'Markdown' }
  );
}

async function handleBloodGroup(chatId, query, data) {
  const bloodGroup = data.replace('blood_', '').replace('unknown', 'Unknown');
  
  await bot.answerCallbackQuery(query.id, { text: `Blood group: ${bloodGroup}` });
  
  updateData(chatId, { bloodGroup });
  updateStep(chatId, 'waiting_reason');

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: chatId, message_id: query.message.message_id }
  );

  await bot.sendMessage(chatId,
    `Blood group recorded: *${bloodGroup}*\n\n` +
    `What is the *reason for your visit*?\n\n` +
    `(e.g., "Regular checkup", "Stomach pain", "Follow-up", etc.)`,
    { parse_mode: 'Markdown' }
  );
}

async function handleConfirmBooking(chatId, query, telegramUserId) {
  await bot.answerCallbackQuery(query.id, { text: 'Creating appointment...' });

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: chatId, message_id: query.message.message_id }
  );

  await bot.sendMessage(chatId, '⏳ Creating your appointment...');

  const state = getState(chatId);
  const result = await createAppointment(state.data, telegramUserId, chatId);

  if (result.success) {
    const dateStr = result.dateTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await bot.sendMessage(chatId,
      `✅ *Appointment Confirmed!*\n\n` +
      `🎫 *Appointment Code:* ${result.appointmentCode}\n` +
      `👤 *Patient:* ${result.patientName}\n` +
      `👨‍⚕️ *Doctor:* Dr. ${result.doctorName}\n` +
      `📅 *Date & Time:* ${dateStr}\n` +
      `📍 *Location:* Movi Innovations\n\n` +
      `We'll see you then! 🏥`,
      { parse_mode: 'Markdown' }
    );

    resetState(chatId);
  } else {
    await bot.sendMessage(chatId,
      `❌ *Booking Failed*\n\n` +
      `${result.error}\n\n` +
      `Please try again with /book`,
      { parse_mode: 'Markdown' }
    );
    resetState(chatId);
  }
}

async function handleCancelBooking(chatId, query) {
  await bot.answerCallbackQuery(query.id, { text: 'Booking cancelled' });

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: chatId, message_id: query.message.message_id }
  );

  await bot.sendMessage(chatId,
    `❌ Appointment booking cancelled.\n\n` +
    `Use /book to start again.`
  );

  resetState(chatId);
}

module.exports = {
  handleCallbackQuery
};

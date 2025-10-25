// Server/Models/Appointment.js
// Appointment model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  appointmentCode: { type: String, unique: true, index: true },
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  doctorId: { type: String, ref: 'User', required: true, index: true },
  appointmentType: { type: String, default: 'Consultation' },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date },
  location: { type: String, default: '' },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'], default: 'Scheduled', index: true },
  vitals: { type: Schema.Types.Mixed, default: {} },
  notes: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  // Telegram-specific fields
  telegramUserId: { type: String, index: true },
  telegramChatId: { type: String, index: true },
  bookingSource: { type: String, enum: ['web', 'telegram', 'admin'], default: 'web' }
}, Object.assign({}, commonOptions));

// Generate appointment code before saving
AppointmentSchema.pre('save', function(next) {
  if (!this.appointmentCode) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.appointmentCode = `APT-${timestamp}-${random}`;
  }
  next();
});

AppointmentSchema.index({ doctorId: 1, startAt: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);

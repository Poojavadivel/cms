// Server/Models/Appointment.js
// Appointment model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  doctorId: { type: String, ref: 'User', required: true, index: true },
  appointmentType: { type: String, default: 'Consultation' },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date },
  location: { type: String, default: '' },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'], default: 'Scheduled', index: true },
  vitals: { type: Schema.Types.Mixed, default: {} },
  notes: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));

AppointmentSchema.index({ doctorId: 1, startAt: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);

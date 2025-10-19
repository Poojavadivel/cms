// Server/Models/Staff.js
// Staff model (separate collection for staff members)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions, emailValidator, phoneValidator } = require('./common');

const Schema = mongoose.Schema;

const StaffSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },

  // Core identity
  name: { type: String, required: true, index: true },
  designation: { type: String, default: '' }, // e.g. "Cardiologist"
  department: { type: String, default: '' }, // e.g. "Cardiology"
  patientFacingId: { type: String, default: '' }, // e.g. DOC102

  // Contact
  contact: { type: String, default: '', validate: phoneValidator },
  email: { type: String, default: '', lowercase: true, validate: emailValidator },
  avatarUrl: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },

  // Employment / meta
  status: { type: String, enum: ['Available', 'Off Duty', 'On Leave', 'On Call'], default: 'Available' },
  shift: { type: String, default: '' },
  roles: [{ type: String }],
  qualifications: [{ type: String }],
  experienceYears: { type: Number, default: 0 },
  joinedAt: { type: Date, default: null },
  lastActiveAt: { type: Date, default: null },

  // Optional profile details
  location: { type: String, default: '' },
  dob: { type: Date, default: null },
  notes: { type: Schema.Types.Mixed, default: {} }, // flexible notes
  appointmentsCount: { type: Number, default: 0 },
  tags: [{ type: String }],

  // Any extra fields from clients should be stored here
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));

StaffSchema.index({ patientFacingId: 1 });
StaffSchema.index({ name: 'text', designation: 'text', department: 'text' });

module.exports = mongoose.model('Staff', StaffSchema);

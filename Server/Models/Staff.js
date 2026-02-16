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
  designation: { type: String, required: true, default: 'Staff' }, // REQUIRED: e.g. "Cardiologist"
  department: { type: String, required: true, default: 'General' }, // REQUIRED: e.g. "Cardiology"
  patientFacingId: { 
    type: String, 
    required: true,  // REQUIRED: Staff code must exist
    unique: true,    // UNIQUE: No duplicate staff codes
    sparse: true,    // Allow migration for existing empty values
    trim: true,
    uppercase: true  // Auto-convert to uppercase (DOC001)
  },

  // Contact - NOW REQUIRED
  contact: { 
    type: String, 
    required: true,  // REQUIRED: Contact number must exist
    trim: true,
    validate: phoneValidator 
  },
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

// Indexes
StaffSchema.index({ patientFacingId: 1 }, { unique: true, sparse: true }); // UNIQUE staff code
StaffSchema.index({ contact: 1 }); // Index on contact for quick lookups
StaffSchema.index({ name: 'text', designation: 'text', department: 'text' });

// Pre-save hook to clean phone numbers  
StaffSchema.pre('validate', function(next) {
  if (this.contact) {
    // Remove spaces, dashes, and parentheses from phone number before validation
    this.contact = this.contact.replace(/[\s\-()]/g, '');
  }
  if (this.emergencyContact) {
    this.emergencyContact = this.emergencyContact.replace(/[\s\-()]/g, '');
  }
  next();
});

// Pre-save hook (keeping for backward compatibility)
StaffSchema.pre('save', function(next) {
  if (this.contact) {
    // Remove spaces, dashes, and parentheses from phone number
    this.contact = this.contact.replace(/[\s\-()]/g, '');
  }
  if (this.emergencyContact) {
    this.emergencyContact = this.emergencyContact.replace(/[\s\-()]/g, '');
  }
  next();
});

module.exports = mongoose.model('Staff', StaffSchema);

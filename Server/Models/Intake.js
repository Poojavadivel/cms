// Server/Models/Intake.js
// Intake model (immutable snapshots + status)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions, emailValidator, phoneValidator } = require('./common');

const Schema = mongoose.Schema;

const IntakeSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', default: null, index: true },
  patientSnapshot: {
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },
    phone: { type: String, default: null, index: true, validate: phoneValidator },
    email: { type: String, default: null, validate: emailValidator }
  },
  doctorId: { type: String, ref: 'User', required: true, index: true },
  appointmentId: { type: String, default: null },
  triage: {
    chiefComplaint: { type: String, default: '' },
    vitals: {
      bp: { type: String, default: '' },
      temp: { type: Number, default: null },
      pulse: { type: Number, default: null },
      spo2: { type: Number, default: null },
      weightKg: { type: Number, default: null },
      heightCm: { type: Number, default: null },
      bmi: { type: Number, default: null }
    },
    priority: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], default: 'Normal' },
    triageCategory: { type: String, enum: ['Green', 'Yellow', 'Red'], default: 'Green' }
  },
  consent: {
    consentGiven: { type: Boolean, default: false },
    consentAt: { type: Date },
    consentBy: { type: String, enum: ['digital', 'paper', 'verbal'], default: 'digital' },
    consentFileId: { type: String, ref: 'File', default: null }
  },
  insurance: {
    hasInsurance: { type: Boolean, default: false },
    payer: { type: String, default: '' },
    policyNumber: { type: String, default: '' },
    coverageMeta: { type: Schema.Types.Mixed, default: {} }
  },
  attachments: [{ type: String, ref: 'File' }],
  notes: { type: String, default: '' },
  meta: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['New', 'Reviewed', 'Converted', 'Rejected'], default: 'New', index: true },
  createdBy: { type: String, ref: 'User', required: true, index: true },
  convertedAt: { type: Date, default: null },
  convertedBy: { type: String, ref: 'User', default: null }
}, Object.assign({}, commonOptions));

IntakeSchema.index({ 'patientSnapshot.phone': 1 });
IntakeSchema.index({ sourceRef: 1 }, { sparse: true });

module.exports = mongoose.model('Intake', IntakeSchema);

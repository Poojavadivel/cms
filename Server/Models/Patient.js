// Server/Models/Patient.js
// Patient model (canonical patient records)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions, emailValidator, phoneValidator } = require('./common');

const Schema = mongoose.Schema;

const PatientSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, default: '' },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], default: 'O+' },
  phone: { type: String, index: true, validate: phoneValidator },
  email: { type: String, default: null, index: true, validate: emailValidator },
  address: {
    line1: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  vitals: {
    heightCm: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    bmi: { type: Number, default: null },
    bp: { type: String, default: null },
    temp: { type: Number, default: null },
    pulse: { type: Number, default: null },
    spo2: { type: Number, default: null }
  },
  doctorId: { type: String, ref: 'User', default: null, index: true },
  allergies: [{ type: String }],
  prescriptions: [
    {
      prescriptionId: { type: String, default: () => uuidv4() },
      appointmentId: { type: String, default: null },
      doctorId: { type: String, ref: 'User' },
      medicines: [{
        medicineId: { type: String, ref: 'Medicine' },
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        quantity: Number
      }],
      notes: String,
      issuedAt: { type: Date, default: Date.now }
    }
  ],
  notes: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  deleted_at: { type: Date, default: null }
}, Object.assign({}, commonOptions));

PatientSchema.index({ phone: 1 });
PatientSchema.index({ lastName: 1, dateOfBirth: 1 });
PatientSchema.index({ phone: 1, dateOfBirth: 1 });

module.exports = mongoose.model('Patient', PatientSchema);

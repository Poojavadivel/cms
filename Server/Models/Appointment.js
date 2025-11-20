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
  
  // Enhanced Follow-up Management System (Medical Software Standard)
  followUp: {
    isFollowUp: { type: Boolean, default: false, index: true },
    isRequired: { type: Boolean, default: false }, // Doctor marked as requiring follow-up
    reason: { type: String, default: '' }, // Why follow-up is needed
    instructions: { type: String, default: '' }, // Patient instructions
    priority: { type: String, enum: ['Routine', 'Important', 'Urgent', 'Critical'], default: 'Routine' },
    recommendedDate: { type: Date, default: null }, // Suggested follow-up date
    scheduledDate: { type: Date, default: null }, // Actual scheduled date
    reminderSent: { type: Boolean, default: false },
    reminderDate: { type: Date, default: null },
    completedDate: { type: Date, default: null },
    
    // Medical tracking
    diagnosis: { type: String, default: '' }, // Diagnosis requiring follow-up
    treatmentPlan: { type: String, default: '' }, // Treatment being monitored
    
    // Tests and Procedures
    labTests: [{
      testName: String,
      ordered: { type: Boolean, default: false },
      orderedDate: Date,
      completed: { type: Boolean, default: false },
      completedDate: Date,
      results: String,
      resultStatus: { type: String, enum: ['Pending', 'Normal', 'Abnormal', 'Critical'], default: 'Pending' }
    }],
    
    imaging: [{
      imagingType: String, // X-Ray, CT, MRI, Ultrasound, etc.
      ordered: { type: Boolean, default: false },
      orderedDate: Date,
      completed: { type: Boolean, default: false },
      completedDate: Date,
      findings: String,
      findingsStatus: { type: String, enum: ['Pending', 'Normal', 'Abnormal', 'Critical'], default: 'Pending' }
    }],
    
    procedures: [{
      procedureName: String,
      scheduled: { type: Boolean, default: false },
      scheduledDate: Date,
      completed: { type: Boolean, default: false },
      completedDate: Date,
      notes: String
    }],
    
    // Medication management
    prescriptionReview: { type: Boolean, default: false }, // Review medications
    medicationCompliance: { type: String, enum: ['Good', 'Fair', 'Poor', 'Unknown'], default: 'Unknown' },
    
    // Appointment chain
    previousAppointmentId: { type: String, ref: 'Appointment', default: null },
    nextAppointmentId: { type: String, ref: 'Appointment', default: null },
    
    // Outcome tracking
    outcome: { type: String, enum: ['Improved', 'Stable', 'Worsened', 'Resolved', 'Pending'], default: 'Pending' },
    outcomeNotes: { type: String, default: '' }
  },
  
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

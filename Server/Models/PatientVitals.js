/**
 * PatientVitals.js
 * 
 * PURPOSE: Centralized vitals tracking with history
 * USED BY: 
 *   - Doctor module (recording vitals during appointments)
 *   - Appointment routes (vital signs during check-in)
 *   - Patient profile (vitals history timeline)
 * 
 * FLOW:
 *   1. Doctor/Nurse records vitals during appointment
 *   2. Each recording creates a new document (historical tracking)
 *   3. Patient profile displays latest + trend graph
 * 
 * RELATIONSHIPS:
 *   - patientId → Patient collection
 *   - appointmentId → Appointment collection
 *   - recordedBy → User collection (doctor/nurse)
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const PatientVitalsSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  
  // Relations
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  appointmentId: { type: String, ref: 'Appointment', default: null },
  recordedBy: { type: String, ref: 'User', required: true }, // doctor/nurse who recorded
  
  // Core Vitals
  bloodPressure: {
    systolic: { type: Number, min: 0, max: 300 }, // mmHg
    diastolic: { type: Number, min: 0, max: 200 }, // mmHg
    reading: { type: String } // "120/80" format for display
  },
  heartRate: { type: Number, min: 0, max: 300 }, // bpm
  temperature: { 
    value: { type: Number, min: 0, max: 50 }, // Celsius
    unit: { type: String, enum: ['C', 'F'], default: 'C' }
  },
  respiratoryRate: { type: Number, min: 0, max: 100 }, // breaths per minute
  oxygenSaturation: { type: Number, min: 0, max: 100 }, // SpO2 percentage
  
  // Physical Measurements
  weight: { 
    value: { type: Number, min: 0, max: 500 }, // kg
    unit: { type: String, enum: ['kg', 'lb'], default: 'kg' }
  },
  height: { 
    value: { type: Number, min: 0, max: 300 }, // cm
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  bmi: { type: Number, min: 0, max: 100 }, // auto-calculated
  
  // Additional Vitals
  bloodGlucose: { 
    value: { type: Number, min: 0, max: 1000 }, // mg/dL
    testType: { type: String, enum: ['Fasting', 'Random', 'Post-prandial', 'HbA1c'], default: 'Random' }
  },
  painScale: { type: Number, min: 0, max: 10 }, // 0-10 scale
  
  // Clinical Notes
  notes: { type: String, default: '' },
  abnormalFlags: [{
    vital: { type: String }, // e.g., "bloodPressure", "heartRate"
    severity: { type: String, enum: ['Normal', 'Mild', 'Moderate', 'Severe'], default: 'Normal' },
    note: { type: String }
  }],
  
  // Metadata
  recordedAt: { type: Date, default: Date.now, index: true },
  location: { type: String, default: 'Clinic' }, // Clinic, ER, Ward, etc.
  deviceInfo: { type: String } // device used to measure (optional)
  
}, Object.assign({}, commonOptions));

// Indexes for efficient queries
PatientVitalsSchema.index({ patientId: 1, recordedAt: -1 }); // Latest vitals first
PatientVitalsSchema.index({ appointmentId: 1 });
PatientVitalsSchema.index({ recordedBy: 1, recordedAt: -1 });

// Auto-calculate BMI before saving
PatientVitalsSchema.pre('save', function(next) {
  if (this.height && this.height.value && this.weight && this.weight.value) {
    const heightM = this.height.value / 100; // convert cm to meters
    this.bmi = parseFloat((this.weight.value / (heightM * heightM)).toFixed(2));
  }
  
  // Auto-format BP reading
  if (this.bloodPressure && this.bloodPressure.systolic && this.bloodPressure.diastolic) {
    this.bloodPressure.reading = `${this.bloodPressure.systolic}/${this.bloodPressure.diastolic}`;
  }
  
  next();
});

module.exports = mongoose.model('PatientVitals', PatientVitalsSchema);

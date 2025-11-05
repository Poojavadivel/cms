// Server/Models/LabReport.js
// Lab report model (linked to OCR uploads)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const LabReportSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },

  // Relations
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  appointmentId: { type: String, default: null },
  documentId: { type: String, ref: 'MedicalDocument', default: null, index: true }, // NEW: Link to MedicalDocument

  // Type + Results
  testType: { type: String, default: 'Auto-OCR' },
  testCategory: { type: String, default: 'General' }, // NEW: Category classification
  results: { type: Schema.Types.Mixed, default: {} },

  // IMPORTANT: now references PatientPDF instead of File (backward compatibility)
  fileRef: { type: String, ref: 'PatientPDF', default: null },

  uploadedBy: { type: String, ref: 'User', default: null },

  // OCR text snapshot for search/audit/debug
  rawText: { type: String, default: '' },
  enhancedText: { type: String, default: '' },

  // OCR + metadata (engine, confidence, etc.)
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));

// Useful indexes
LabReportSchema.index({ patientId: 1, testType: 1 });
LabReportSchema.index({ patientId: 1, testCategory: 1 });
LabReportSchema.index({ documentId: 1 });
LabReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LabReport', LabReportSchema);

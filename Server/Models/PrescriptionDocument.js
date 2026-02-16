// Server/Models/PrescriptionDocument.js
// Prescription document storage (scanned prescriptions)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const PrescriptionDocumentSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  pdfId: { type: String, ref: 'PatientPDF', required: true, index: true }, // Reference to binary storage
  
  // Extracted prescription data
  doctorName: { type: String, default: '' },
  hospitalName: { type: String, default: '' },
  prescriptionDate: { type: Date, default: null },
  medicines: [{
    name: { type: String, default: '' },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' }
  }],
  diagnosis: { type: String, default: '' },
  instructions: { type: String, default: '' },
  
  // OCR data
  ocrText: { type: String, default: '' },
  ocrEngine: { type: String, enum: ['vision', 'google-vision', 'tesseract', 'manual', 'gemini'], default: 'google-vision' },
  ocrConfidence: { type: Number, default: 0 },
  
  // Metadata
  extractedData: { type: Schema.Types.Mixed, default: {} },
  intent: { type: String, default: 'PRESCRIPTION' },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'completed' },
  uploadedBy: { type: String, ref: 'User', default: null },
  
  // Timestamps
  uploadDate: { type: Date, default: Date.now },
  
}, Object.assign({}, commonOptions));

PrescriptionDocumentSchema.index({ patientId: 1, uploadDate: -1 });
PrescriptionDocumentSchema.index({ pdfId: 1 });

module.exports = mongoose.model('PrescriptionDocument', PrescriptionDocumentSchema);

// Server/Models/LabReportDocument.js
// Lab report document storage (scanned lab results)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const LabReportDocumentSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  pdfId: { type: String, ref: 'PatientPDF', required: true, index: true }, // Reference to binary storage
  
  // Lab report metadata
  testType: { type: String, default: '' },
  testCategory: { type: String, default: 'General' },
  intent: { type: String, default: 'GENERAL' },
  labName: { type: String, default: '' },
  reportDate: { type: Date, default: null },
  
  // Test results
  results: [{
    testName: { type: String, default: '' },
    value: { type: String, default: '' },
    unit: { type: String, default: '' },
    referenceRange: { type: String, default: '' },
    flag: { type: String, enum: ['normal', 'high', 'low', 'Normal', 'High', 'Low', 'NORMAL', 'HIGH', 'LOW', ''], default: '' }
  }],
  
  // OCR data
  ocrText: { type: String, default: '' },
  ocrEngine: { type: String, enum: ['google-vision', 'vision', 'tesseract', 'manual', 'gemini'], default: 'google-vision' },
  ocrConfidence: { type: Number, default: 0 },
  
  // Metadata
  extractedData: { type: Schema.Types.Mixed, default: {} },
  extractionQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'unknown'], default: 'unknown' },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'completed' },
  uploadedBy: { type: String, ref: 'User', default: null },
  
  // Timestamps
  uploadDate: { type: Date, default: Date.now },
  
}, Object.assign({}, commonOptions));

LabReportDocumentSchema.index({ patientId: 1, uploadDate: -1 });
LabReportDocumentSchema.index({ pdfId: 1 });
LabReportDocumentSchema.index({ testType: 1 });

module.exports = mongoose.model('LabReportDocument', LabReportDocumentSchema);

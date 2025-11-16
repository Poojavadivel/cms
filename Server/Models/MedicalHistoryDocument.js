// Server/Models/MedicalHistoryDocument.js
// Medical history document storage (scanned medical history records)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const MedicalHistoryDocumentSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  pdfId: { type: String, ref: 'PatientPDF', required: true, index: true }, // Reference to binary storage
  
  // Extracted medical history data
  title: { type: String, default: 'Medical History Record' },
  category: { type: String, enum: ['General', 'Chronic', 'Acute', 'Surgical', 'Family', 'Other'], default: 'General' },
  medicalHistory: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  allergies: { type: String, default: '' },
  chronicConditions: [{ type: String }],
  surgicalHistory: [{ type: String }],
  familyHistory: { type: String, default: '' },
  medications: { type: String, default: '' },
  
  // Date fields
  recordDate: { type: Date, default: null }, // Date of the medical record/visit
  reportDate: { type: Date, default: null }, // Date when report was created
  
  // Provider information
  doctorName: { type: String, default: '' },
  hospitalName: { type: String, default: '' },
  specialty: { type: String, default: '' },
  
  // OCR data
  ocrText: { type: String, default: '' },
  ocrEngine: { type: String, enum: ['vision', 'google-vision', 'tesseract', 'manual', 'gemini'], default: 'google-vision' },
  ocrConfidence: { type: Number, default: 0 },
  
  // Metadata
  extractedData: { type: Schema.Types.Mixed, default: {} },
  intent: { type: String, default: 'MEDICAL_HISTORY' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'completed' },
  uploadedBy: { type: String, ref: 'User', default: null },
  
  // Timestamps
  uploadDate: { type: Date, default: Date.now },
  
}, Object.assign({}, commonOptions));

MedicalHistoryDocumentSchema.index({ patientId: 1, uploadDate: -1 });
MedicalHistoryDocumentSchema.index({ pdfId: 1 });
MedicalHistoryDocumentSchema.index({ category: 1 });

module.exports = mongoose.model('MedicalHistoryDocument', MedicalHistoryDocumentSchema);

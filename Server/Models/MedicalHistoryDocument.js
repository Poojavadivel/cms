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
  
  // New Landing AI extracted fields (as per prescription pattern)
  medicalType: { type: String, enum: ['appointment_summary', 'discharge_summary'], default: 'appointment_summary' },
  appointmentSummary: { type: String, default: '' },
  dischargeSummary: { type: String, default: '' },
  date: { type: String, default: '' }, // Date in original format (DD/MM/YYYY)
  time: { type: String, default: '' },
  hospitalName: { type: String, default: '' },
  hospitalLocation: { type: String, default: '' },
  doctorName: { type: String, default: '' },
  department: { type: String, default: '' },
  services: { type: String, default: '' }, // Changed from object to string (comma-separated)
  doctorNotes: { type: String, default: '' },
  observations: { type: String, default: '' },
  remarks: { type: String, default: '' },
  
  // Legacy fields (kept for backward compatibility)
  title: { type: String, default: 'Medical History Record' },
  category: { type: String, enum: ['General', 'Chronic', 'Acute', 'Surgical', 'Family', 'Other', 'Discharge'], default: 'General' },
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
  
  // Provider information (legacy - kept for compatibility)
  specialty: { type: String, default: '' },
  
  // OCR data
  ocrText: { type: String, default: '' },
  ocrEngine: { type: String, enum: ['vision', 'google-vision', 'tesseract', 'manual', 'gemini', 'landingai', 'landingai-ade'], default: 'google-vision' },
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

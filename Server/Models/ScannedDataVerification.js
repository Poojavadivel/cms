const mongoose = require('mongoose');

/**
 * ScannedDataVerification Model
 * Temporary storage for scanned medical data before verification and confirmation
 * This collection acts as a staging area for extracted data from LandingAI
 */

const ScannedDataVerificationSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  documentType: {
    type: String,
    enum: ['PRESCRIPTION', 'LAB_REPORT', 'MEDICAL_HISTORY', 'GENERAL'],
    required: true
  },
  pdfId: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: ''
  },
  extractedData: {
    type: Object,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'partially_verified'],
    default: 'pending'
  },
  dataRows: [{
    fieldName: { type: String, required: true },
    displayLabel: { type: String, required: true },
    originalValue: { type: mongoose.Schema.Types.Mixed },
    currentValue: { type: mongoose.Schema.Types.Mixed },
    dataType: { type: String, enum: ['string', 'number', 'date', 'array', 'object'], default: 'string' },
    isModified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    confidence: { type: Number, default: 0.95 },
    category: { 
      type: String, 
      enum: ['patient_details', 'medications', 'vitals', 'diagnosis', 'lab_results', 'other'],
      default: 'other'
    }
  }],
  metadata: {
    ocrEngine: { type: String, default: 'landingai-ade' },
    ocrConfidence: { type: Number, default: 0.95 },
    processingTimeMs: { type: Number },
    markdown: { type: String }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours if not verified
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

// Index for efficient querying
ScannedDataVerificationSchema.index({ patientId: 1, verificationStatus: 1 });
ScannedDataVerificationSchema.index({ sessionId: 1 });
ScannedDataVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ScannedDataVerification', ScannedDataVerificationSchema);

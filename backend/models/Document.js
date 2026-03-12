const mongoose = require('mongoose');

// Enum: DocumentCategory
const DOCUMENT_CATEGORY = ['certificates', 'marksheet', 'admission_forms', 'internship_letter'];

const documentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: DOCUMENT_CATEGORY,
    required: [true, 'Document category is required'],
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

documentSchema.index({ studentId: 1 });
documentSchema.index({ category: 1 });

module.exports = mongoose.model('Document', documentSchema);

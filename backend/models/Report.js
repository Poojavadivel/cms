const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['Attendance', 'Academic', 'Fee'],
    trim: true,
  },
  generatedBy: {
    type: String,
    required: [true, 'Generated-by is required'],
    trim: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  fileUrl: {
    type: String,
    default: '',
  },
});

reportSchema.index({ reportType: 1 });

module.exports = mongoose.model('Report', reportSchema);

const mongoose = require('mongoose');

// Enum: FeeStatus
const FEE_STATUS = ['paid', 'pending', 'overdue'];

const feeSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
  },
  feeType: {
    type: String,
    required: [true, 'Fee type is required'],
    trim: true,
  },
  receiptNumber: {
    type: String,
    default: '',
  },
  dueAmount: {
    type: Number,
    required: [true, 'Due amount is required'],
    min: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: FEE_STATUS,
    default: 'pending',
    required: true,
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
  },
}, { timestamps: true });

feeSchema.index({ studentId: 1 });
feeSchema.index({ status: 1 });

module.exports = mongoose.model('Fee', feeSchema);

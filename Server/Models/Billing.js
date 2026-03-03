/**
 * Billing Model
 * Enterprise-Grade Hospital Billing System
 * Comprehensive billing with insurance, taxes, discounts
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const billingItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Consultation', 'Procedures', 'Medication', 'Lab Tests', 'Room Charges', 'Custom']
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const insuranceDetailsSchema = new mongoose.Schema({
  provider: {
    type: String,
    trim: true
  },
  policyNumber: {
    type: String,
    trim: true
  },
  coverageAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  claimNumber: {
    type: String,
    trim: true
  },
  claimStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Processing', ''],
    default: 'Pending'
  }
}, { _id: false });

const billingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  billNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientId: {
    type: String,
    ref: 'Patient',
    required: true,
    index: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientContact: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  items: {
    type: [billingItemSchema],
    required: true,
    validate: [arrayMinLength, 'At least one item is required']
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', ''],
    default: ''
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 5,
    min: 0,
    max: 100
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Cancelled', 'Refunded'],
    default: 'Pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance', 'Mixed', ''],
    default: ''
  },
  insuranceDetails: {
    type: insuranceDetailsSchema,
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    ref: 'User'
  },
  updatedBy: {
    type: String,
    ref: 'User'
  },
  paymentHistory: [{
    date: Date,
    amount: Number,
    method: String,
    transactionId: String,
    notes: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now }
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Validator for minimum array length
function arrayMinLength(val) {
  return val.length > 0;
}

// Pre-save middleware to generate bill number and validate balance
billingSchema.pre('save', async function(next) {
  // Generate bill number if not set
  if (this.isNew && !this.billNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.billNumber = `BILL-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  
  // Ensure balance is never negative (cap at 0)
  if (this.balanceAmount < 0) {
    this.balanceAmount = 0;
  }
  
  // Ensure paid amount doesn't exceed total
  if (this.paidAmount > this.totalAmount) {
    this.paidAmount = this.totalAmount;
    this.balanceAmount = 0;
    this.status = 'Paid';
  }
  
  next();
});

// Instance method to add payment
billingSchema.methods.addPayment = function(amount, method, transactionId, notes, userId) {
  this.paymentHistory.push({
    date: new Date(),
    amount,
    method,
    transactionId,
    notes,
    createdBy: userId
  });

  this.paidAmount += amount;
  this.balanceAmount = this.totalAmount - this.paidAmount;

  if (this.balanceAmount <= 0) {
    this.status = 'Paid';
    this.balanceAmount = 0;
  } else if (this.paidAmount > 0) {
    this.status = 'Partially Paid';
  }

  this.updatedBy = userId;
  return this.save();
};

// Static method to get billing stats
billingSchema.statics.getStats = async function(startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBills: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' },
        totalPending: { $sum: '$balanceAmount' },
        paidBills: {
          $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] }
        },
        pendingBills: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        partialBills: {
          $sum: { $cond: [{ $eq: ['$status', 'Partially Paid'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Indexes for performance
billingSchema.index({ patientId: 1, date: -1 });
billingSchema.index({ status: 1, date: -1 });
billingSchema.index({ billNumber: 1 });
billingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Billing', billingSchema);

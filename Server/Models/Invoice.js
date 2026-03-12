const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const invoiceSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: String,
    ref: 'Patient',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number
  }],
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', ''],
    default: ''
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);

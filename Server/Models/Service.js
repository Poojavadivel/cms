/**
 * Service Model
 * Hospital Services/Items for Billing
 * Categories: Consultation, Procedures, Medications, Lab Tests, Room Charges
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const serviceSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Consultation', 'Procedures', 'Medication', 'Lab Tests', 'Room Charges', 'Custom'],
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  taxable: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for performance
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ name: 'text' });

// Pre-save to generate code if not provided
serviceSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    const count = await this.constructor.countDocuments({ category: this.category });
    const categoryPrefix = this.category.substring(0, 3).toUpperCase();
    this.code = `${categoryPrefix}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);

// Server/Models/Bed.js
// Bed model for Bed Allocation & Occupancy module

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const BED_STATUSES = ['AVAILABLE', 'OCCUPIED', 'CLEANING'];

const BedSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  label: { type: String, required: true, trim: true },
  ward: { type: String, ref: 'Ward', required: true, index: true },
  status: {
    type: String,
    enum: BED_STATUSES,
    default: 'AVAILABLE',
    required: true
  },
  patientId: { type: String, ref: 'Patient', default: null },
  patientName: { type: String, default: null },
  notes: { type: String, default: '' },
  dischargeReason: { type: String, default: '' },
  deleted_at: { type: Date, default: null }
}, Object.assign({}, commonOptions));

// Compound index for quick lookups
BedSchema.index({ ward: 1, status: 1 });

module.exports = mongoose.model('Bed', BedSchema);
module.exports.BED_STATUSES = BED_STATUSES;

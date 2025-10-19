// Server/Models/Medicine.js
// Medicine catalog model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const MedicineSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  name: { type: String, required: true, index: true },
  genericName: { type: String, default: '' },
  sku: { type: String, default: null, index: true },
  form: { type: String, default: 'Tablet' },
  strength: { type: String, default: '' },
  unit: { type: String, default: 'pcs' },
  manufacturer: { type: String, default: '' },
  brand: { type: String, default: '' },
  category: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['In Stock', 'Out of Stock', 'Discontinued'], default: 'In Stock' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  deleted_at: { type: Date, default: null }
}, Object.assign({}, commonOptions));

// text index for searching
MedicineSchema.index({ name: 'text', genericName: 'text', brand: 'text', sku: 'text' });
// ensure sku uniqueness when present
MedicineSchema.index({ sku: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Medicine', MedicineSchema);

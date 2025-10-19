// Server/Models/MedicineBatch.js
// Medicine batch tracking model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const MedicineBatchSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  medicineId: { type: String, ref: 'Medicine', required: true, index: true },
  batchNumber: { type: String, default: '' },
  expiryDate: { type: Date },
  quantity: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  location: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));

MedicineBatchSchema.index({ medicineId: 1, expiryDate: 1 });

module.exports = mongoose.model('MedicineBatch', MedicineBatchSchema);

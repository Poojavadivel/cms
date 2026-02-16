// Server/Models/PharmacyRecord.js
// Pharmacy transaction records

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const PharmacyItemSchema = new Schema({
  medicineId: { type: String, ref: 'Medicine' },
  batchId: { type: String, ref: 'MedicineBatch' },
  sku: { type: String, default: null },
  name: { type: String, default: null },
  dosage: { type: String, default: null },        // ✅ ADDED
  frequency: { type: String, default: null },     // ✅ ADDED
  duration: { type: String, default: null },      // ✅ ADDED
  notes: { type: String, default: null },         // ✅ ADDED
  quantity: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const PharmacyRecordSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  type: { type: String, enum: ['PurchaseReceive', 'Dispense', 'Return', 'Adjustment'], required: true, index: true },
  patientId: { type: String, ref: 'Patient', default: null, index: true },
  appointmentId: { type: String, default: null },
  createdBy: { type: String, ref: 'User' },
  items: { type: [PharmacyItemSchema], default: [] },
  total: { type: Number, default: 0 },
  paid: { type: Boolean, default: false },
  paymentMethod: { type: String, default: null },
  notes: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));

PharmacyRecordSchema.index({ createdAt: -1 });
PharmacyRecordSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('PharmacyRecord', PharmacyRecordSchema);

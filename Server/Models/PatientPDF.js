// Server/Models/PatientPDF.js
// Patient PDF storage model (stores PDF/image binary in MongoDB)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const PatientPDFSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  title: { type: String, default: '' },
  fileName: { type: String, required: true, index: true },
  mimeType: { type: String, default: 'application/pdf' },
  data: { type: Buffer, required: true }, // the file bytes
  size: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now }
}, Object.assign({}, commonOptions));

PatientPDFSchema.index({ patientId: 1, uploadedAt: -1 });

module.exports = mongoose.model('PatientPDF', PatientPDFSchema);

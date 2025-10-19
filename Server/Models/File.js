// Server/Models/File.js
// File storage references (S3 / GridFS pointers)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const FileSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  filename: { type: String, required: true, index: true },
  ownerId: { type: String, default: null, index: true }, // patientId/userId/staffId etc. (string UUID)
  mimeType: { type: String },
  size: { type: Number, default: 0 },
  storage: { type: String, default: 's3' },
  url: { type: String, default: null },
  key: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions, { _id: true }));

FileSchema.index({ ownerId: 1, filename: 1 });

module.exports = mongoose.model('File', FileSchema);

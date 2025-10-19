// Server/Models/AuditLog.js
// Audit log model (immutable append-only)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const AuditLogSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, ref: 'User', index: true },
  entity: { type: String, required: true, index: true }, // e.g., Patient, Staff
  entityId: { type: String, required: true, index: true },
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'LOGIN'], required: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  ip: { type: String },
  meta: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions, { strict: false }));

AuditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);

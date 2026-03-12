// Server/Models/AuthSession.js
// Authentication sessions (refresh tokens / devices)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const AuthSessionSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, ref: 'User', required: true, index: true },
  deviceId: { type: String, default: null, index: true },
  refreshTokenHash: { type: String, required: true },
  ip: String,
  userAgent: String,
  expiresAt: { type: Date, required: true, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions, { strict: false }));

// TTL index - sessions expire when expiresAt <= now
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthSession', AuthSessionSchema);

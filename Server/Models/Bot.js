// Server/Models/Bot.js
// Bot chat history and sessions model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const BotSessionSchema = new Schema({
  sessionId: { type: String, default: () => uuidv4() },
  model: { type: String, default: '' },
  messages: { type: [Schema.Types.Mixed], default: [] }, // {role, text, meta}
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const BotSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, ref: 'User', required: true, index: true },
  sessions: {
    type: [BotSessionSchema],
    default: [],
    validate: {
      validator: function (arr) {
        return !arr || arr.length <= 1000;
      },
      message: 'Bot sessions array exceeds allowed length (1000)'
    }
  },
  archived: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));

BotSchema.index({ userId: 1, archived: 1, updatedAt: -1 });
BotSchema.index({ 'sessions.sessionId': 1 });

module.exports = mongoose.model('Bot', BotSchema);

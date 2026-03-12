// Server/Models/Ward.js
// Ward model for Bed Allocation & Occupancy module

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const WardSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  floor: { type: String, default: '' },
  deleted_at: { type: Date, default: null }
}, Object.assign({}, commonOptions));

module.exports = mongoose.model('Ward', WardSchema);

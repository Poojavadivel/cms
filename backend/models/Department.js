const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  headOfDepartment: {
    type: String,
    default: '',
  },
}, { timestamps: true });

departmentSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);

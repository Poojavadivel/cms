const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Faculty name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: '',
  },
  departmentId: {
    type: String,
    required: [true, 'Department ID is required'],
  },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD', ''],
    default: '',
  },
}, { timestamps: true });

facultySchema.index({ email: 1 }, { unique: true });
facultySchema.index({ departmentId: 1 });

module.exports = mongoose.model('Faculty', facultySchema);

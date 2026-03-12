const mongoose = require('mongoose');

// Enum: StudentStatus
const STUDENT_STATUS = ['active', 'inactive', 'graduated'];

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
  },
  departmentId: {
    type: String,
    required: [true, 'Department ID is required'],
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1,
    max: 5,
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 10,
  },
  status: {
    type: String,
    enum: STUDENT_STATUS,
    default: 'active',
    required: true,
  },

  // ── Additional fields carried over from the existing app ──
  name:           { type: String, default: '' },
  email:          { type: String, default: '' },
  phone:          { type: String, default: '' },
  gender:         { type: String, default: '' },
  dob:            { type: Date },
  address:        { type: String, default: '' },
  avatar:         { type: String, default: '' },
  section:        { type: String, default: '' },
  cgpa:           { type: Number, default: 0 },
  attendancePct:  { type: Number, default: 0 },
  feeStatus:      { type: String, default: 'pending' },
  guardian:        { type: String, default: '' },
  guardianPhone:  { type: String, default: '' },
  enrollDate:     { type: Date },
}, { timestamps: true });

studentSchema.index({ rollNumber: 1 }, { unique: true });
studentSchema.index({ departmentId: 1 });
studentSchema.index({ status: 1 });

module.exports = mongoose.model('Student', studentSchema);

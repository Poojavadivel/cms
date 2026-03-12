const mongoose = require('mongoose');

// Enum: AttendanceStatus
const ATTENDANCE_STATUS = ['present', 'absent', 'leave'];

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  status: {
    type: String,
    enum: ATTENDANCE_STATUS,
    default: 'present',
    required: true,
  },
  subject: {
    type: String,
    default: '',
  },
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

const mongoose = require('mongoose');

// Enum: SemesterGrade
const SEMESTER_GRADE = ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F'];

const academicResultSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 10,
  },
  subjectCode: {
    type: String,
    required: [true, 'Subject code is required'],
    uppercase: true,
    trim: true,
  },
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  credits: {
    type: Number,
    required: [true, 'Credits is required'],
    min: 0,
  },
  grade: {
    type: String,
    enum: SEMESTER_GRADE,
    required: [true, 'Grade is required'],
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail'],
    default: 'Pass',
  },
}, { timestamps: true });

academicResultSchema.index({ studentId: 1, semester: 1 });
academicResultSchema.index({ subjectCode: 1 });

module.exports = mongoose.model('AcademicResult', academicResultSchema);

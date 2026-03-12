const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas (CMS Database)'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Student Schema
const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  department: String,
  year: String,
  semester: Number,
  section: String,
  cgpa: Number,
  attendancePct: Number,
  feeStatus: String,
  status: { type: String, default: 'Active' },
  avatar: String,
  enrollDate: Date,
  dob: Date,
  gender: String,
  address: String,
  guardian: String,
  guardianPhone: String,
  subjects: [{
    code: String,
    name: String,
    internal: Number,
    external: Number,
    total: Number,
    grade: String
  }],
  fees: [{
    id: String,
    type: String,
    amount: Number,
    paid: Number,
    due: Number,
    date: String,
    status: String
  }],
  documents: [{
    id: String,
    name: String,
    type: String,
    uploadDate: Date,
    size: String
  }],
  attendanceMonthly: [{
    month: String,
    present: Number,
    total: Number
  }]
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

// API Routes
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  const student = new Student(req.body);
  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Root Route
app.get('/', (req, res) => {
  res.send('CMS Backend API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

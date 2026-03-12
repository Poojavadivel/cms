const mongoose = require('mongoose');
require('dotenv').config();

// Define Student Schema (duplicate for seed script)
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

const students = [
  {
    id: 'STU-2024-001',
    name: 'Aarav Kumar',
    email: 'aarav.kumar@mit.edu',
    phone: '+91 98765 43210',
    department: 'Computer Science',
    year: '3rd Year',
    semester: 6,
    section: 'A',
    cgpa: 8.7,
    attendancePct: 92,
    feeStatus: 'Paid',
    status: 'Active',
    enrollDate: '2022-08-01',
    dob: '2004-03-15',
    gender: 'Male',
    address: '12, MG Road, Bangalore, Karnataka',
    guardian: 'Rajesh Kumar',
    guardianPhone: '+91 98765 43200',
    avatar: 'https://ui-avatars.com/api/?name=Aarav+Kumar&background=2563eb&color=fff&size=128',
    subjects: [
      { code: 'CS301', name: 'Data Structures', internal: 42, external: 48, total: 90, grade: 'A+' },
      { code: 'CS302', name: 'Operating Systems', internal: 38, external: 44, total: 82, grade: 'A' },
      { code: 'CS303', name: 'Database Systems', internal: 40, external: 46, total: 86, grade: 'A' },
      { code: 'CS304', name: 'Computer Networks', internal: 35, external: 40, total: 75, grade: 'B+' },
      { code: 'MA301', name: 'Discrete Mathematics', internal: 44, external: 48, total: 92, grade: 'A+' },
    ],
    fees: [
      { id: 'FEE-001', type: 'Tuition Fee', amount: 75000, paid: 75000, due: 0, date: '2024-07-15', status: 'Paid' },
      { id: 'FEE-002', type: 'Hostel Fee', amount: 45000, paid: 45000, due: 0, date: '2024-07-20', status: 'Paid' },
      { id: 'FEE-003', type: 'Lab Fee', amount: 12000, paid: 12000, due: 0, date: '2024-08-01', status: 'Paid' },
      { id: 'FEE-004', type: 'Exam Fee', amount: 5000, paid: 5000, due: 0, date: '2025-01-10', status: 'Paid' },
    ],
    documents: [
      { id: 'DOC-001', name: '10th Marksheet', type: 'pdf', uploadDate: '2022-08-01', size: '1.2 MB' },
      { id: 'DOC-002', name: '12th Marksheet', type: 'pdf', uploadDate: '2022-08-01', size: '1.4 MB' },
      { id: 'DOC-003', name: 'Aadhar Card', type: 'pdf', uploadDate: '2022-08-02', size: '0.8 MB' },
      { id: 'DOC-004', name: 'Passport Photo', type: 'image', uploadDate: '2022-08-02', size: '0.3 MB' },
      { id: 'DOC-005', name: 'Transfer Certificate', type: 'pdf', uploadDate: '2022-08-05', size: '0.9 MB' },
    ],
    attendanceMonthly: [
      { month: 'Jul', present: 22, total: 24 },
      { month: 'Aug', present: 23, total: 26 },
      { month: 'Sep', present: 21, total: 24 },
      { month: 'Oct', present: 20, total: 22 },
      { month: 'Nov', present: 24, total: 26 },
      { month: 'Dec', present: 18, total: 20 },
    ],
  },
  {
    id: 'STU-2024-042',
    name: 'Priya Sharma',
    email: 'priya.sharma@mit.edu',
    phone: '+91 87654 32109',
    department: 'Computer Science',
    year: '3rd Year',
    semester: 6,
    section: 'A',
    cgpa: 9.1,
    attendancePct: 96,
    feeStatus: 'Paid',
    status: 'Active',
    enrollDate: '2022-08-01',
    dob: '2004-06-22',
    gender: 'Female',
    address: '45, Residency Road, Bangalore',
    guardian: 'Suresh Sharma',
    guardianPhone: '+91 87654 32100',
    avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=7c3aed&color=fff&size=128',
    subjects: [
      { code: 'CS301', name: 'Data Structures', internal: 46, external: 48, total: 94, grade: 'A+' },
      { code: 'CS302', name: 'Operating Systems', internal: 42, external: 46, total: 88, grade: 'A+' },
      { code: 'CS303', name: 'Database Systems', internal: 44, external: 48, total: 92, grade: 'A+' },
      { code: 'CS304', name: 'Computer Networks', internal: 40, external: 44, total: 84, grade: 'A' },
      { code: 'MA301', name: 'Discrete Mathematics', internal: 46, external: 50, total: 96, grade: 'A+' },
    ],
    fees: [
      { id: 'FEE-001', type: 'Tuition Fee', amount: 75000, paid: 75000, due: 0, date: '2024-07-15', status: 'Paid' },
      { id: 'FEE-002', type: 'Hostel Fee', amount: 45000, paid: 45000, due: 0, date: '2024-07-20', status: 'Paid' },
      { id: 'FEE-003', type: 'Lab Fee', amount: 12000, paid: 12000, due: 0, date: '2024-08-01', status: 'Paid' },
    ],
    documents: [
      { id: 'DOC-001', name: '10th Marksheet', type: 'pdf', uploadDate: '2022-08-01', size: '1.1 MB' },
      { id: 'DOC-002', name: '12th Marksheet', type: 'pdf', uploadDate: '2022-08-01', size: '1.3 MB' },
      { id: 'DOC-003', name: 'Aadhar Card', type: 'pdf', uploadDate: '2022-08-02', size: '0.7 MB' },
    ],
    attendanceMonthly: [
      { month: 'Jul', present: 24, total: 24 },
      { month: 'Aug', present: 25, total: 26 },
      { month: 'Sep', present: 23, total: 24 },
      { month: 'Oct', present: 22, total: 22 },
      { month: 'Nov', present: 25, total: 26 },
      { month: 'Dec', present: 20, total: 20 },
    ],
  }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for seeding...');
    
    await Student.deleteMany({});
    console.log('Cleared existing students.');
    
    await Student.insertMany(students);
    console.log('Seeded database with dummy student data.');
    
    mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('CRITICAL SEED ERROR:', err);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('Could not connect to MongoDB Atlas. Check your connection string and IP whitelist.');
    }
    process.exit(1);
  }
};

seedDB();

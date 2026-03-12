const mongoose = require('mongoose');
require('dotenv').config();

// ── Models ──
const Department     = require('./models/Department');
const Faculty        = require('./models/Faculty');
const Student        = require('./models/Student');
const Attendance     = require('./models/Attendance');
const AcademicResult = require('./models/AcademicResult');
const Fee            = require('./models/Fee');
const Document       = require('./models/Document');
const Report         = require('./models/Report');
const SystemSetting  = require('./models/SystemSetting');

// ═══════════════════════════════════════════════════════
//  SEED DATA
// ═══════════════════════════════════════════════════════

// 1. Departments
const departments = [
  { name: 'Computer Science',      code: 'CS',   headOfDepartment: 'Dr. Rajesh Kumar' },
  { name: 'Mechanical Engineering', code: 'ME',   headOfDepartment: 'Dr. Suresh Iyer' },
  { name: 'Electrical Engineering', code: 'EE',   headOfDepartment: 'Dr. Anita Desai' },
  { name: 'Civil Engineering',      code: 'CE',   headOfDepartment: 'Dr. Mohan Rao' },
  { name: 'Electronics & Comm.',    code: 'ECE',  headOfDepartment: 'Dr. Kavitha Nair' },
];

// 2. Faculty
const faculty = [
  { name: 'Dr. Rajesh Kumar',   email: 'rajesh.kumar@mit.edu',   phone: '+91 98765 00001', departmentId: 'CS',  designation: 'Professor' },
  { name: 'Dr. Priya Menon',    email: 'priya.menon@mit.edu',    phone: '+91 98765 00002', departmentId: 'CS',  designation: 'Associate Professor' },
  { name: 'Mr. Arun Patel',     email: 'arun.patel@mit.edu',     phone: '+91 98765 00003', departmentId: 'CS',  designation: 'Assistant Professor' },
  { name: 'Dr. Suresh Iyer',    email: 'suresh.iyer@mit.edu',    phone: '+91 98765 00004', departmentId: 'ME',  designation: 'Professor' },
  { name: 'Dr. Anita Desai',    email: 'anita.desai@mit.edu',    phone: '+91 98765 00005', departmentId: 'EE',  designation: 'Professor' },
  { name: 'Dr. Mohan Rao',      email: 'mohan.rao@mit.edu',      phone: '+91 98765 00006', departmentId: 'CE',  designation: 'Professor' },
  { name: 'Dr. Kavitha Nair',   email: 'kavitha.nair@mit.edu',   phone: '+91 98765 00007', departmentId: 'ECE', designation: 'Professor' },
  { name: 'Ms. Deepa Sharma',   email: 'deepa.sharma@mit.edu',   phone: '+91 98765 00008', departmentId: 'ME',  designation: 'Lecturer' },
];

// 3. Students
const students = [
  {
    rollNumber: 'STU-2024-001', name: 'Aarav Kumar',    email: 'aarav.kumar@mit.edu',    phone: '+91 98765 43210',
    departmentId: 'CS', year: 3, semester: 6, status: 'active', section: 'A', cgpa: 8.7, attendancePct: 92,
    feeStatus: 'paid', gender: 'Male', dob: '2004-03-15', address: '12, MG Road, Bangalore',
    guardian: 'Rajesh Kumar Sr.', guardianPhone: '+91 98765 43200', enrollDate: '2022-08-01',
    avatar: 'https://ui-avatars.com/api/?name=Aarav+Kumar&background=2563eb&color=fff&size=128',
  },
  {
    rollNumber: 'STU-2024-042', name: 'Priya Sharma',   email: 'priya.sharma@mit.edu',   phone: '+91 87654 32109',
    departmentId: 'CS', year: 3, semester: 6, status: 'active', section: 'A', cgpa: 9.1, attendancePct: 96,
    feeStatus: 'paid', gender: 'Female', dob: '2004-06-22', address: '45, Residency Road, Bangalore',
    guardian: 'Suresh Sharma', guardianPhone: '+91 87654 32100', enrollDate: '2022-08-01',
    avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=7c3aed&color=fff&size=128',
  },
  {
    rollNumber: 'STU-2024-015', name: 'Rohan Mehta',    email: 'rohan.mehta@mit.edu',    phone: '+91 76543 21098',
    departmentId: 'ME', year: 2, semester: 4, status: 'active', section: 'B', cgpa: 7.8, attendancePct: 85,
    feeStatus: 'pending', gender: 'Male', dob: '2005-01-10', address: '78, Brigade Road, Bangalore',
    guardian: 'Vikram Mehta', guardianPhone: '+91 76543 21000', enrollDate: '2023-08-01',
    avatar: 'https://ui-avatars.com/api/?name=Rohan+Mehta&background=059669&color=fff&size=128',
  },
  {
    rollNumber: 'STU-2024-023', name: 'Ananya Reddy',   email: 'ananya.reddy@mit.edu',   phone: '+91 65432 10987',
    departmentId: 'EE', year: 4, semester: 8, status: 'active', section: 'A', cgpa: 8.4, attendancePct: 90,
    feeStatus: 'paid', gender: 'Female', dob: '2003-09-05', address: '22, Koramangala, Bangalore',
    guardian: 'Srinivas Reddy', guardianPhone: '+91 65432 10900', enrollDate: '2021-08-01',
    avatar: 'https://ui-avatars.com/api/?name=Ananya+Reddy&background=dc2626&color=fff&size=128',
  },
  {
    rollNumber: 'STU-2024-007', name: 'Karthik Nair',   email: 'karthik.nair@mit.edu',   phone: '+91 54321 09876',
    departmentId: 'ECE', year: 1, semester: 2, status: 'active', section: 'C', cgpa: 7.2, attendancePct: 78,
    feeStatus: 'overdue', gender: 'Male', dob: '2006-11-30', address: '5, Indiranagar, Bangalore',
    guardian: 'Sunil Nair', guardianPhone: '+91 54321 09800', enrollDate: '2024-08-01',
    avatar: 'https://ui-avatars.com/api/?name=Karthik+Nair&background=f59e0b&color=fff&size=128',
  },
  {
    rollNumber: 'STU-2023-050', name: 'Divya Krishnan',  email: 'divya.k@mit.edu',        phone: '+91 43210 98765',
    departmentId: 'CE', year: 4, semester: 8, status: 'graduated', section: 'A', cgpa: 9.4, attendancePct: 98,
    feeStatus: 'paid', gender: 'Female', dob: '2002-04-18', address: '99, HSR Layout, Bangalore',
    guardian: 'Lakshmi Krishnan', guardianPhone: '+91 43210 98700', enrollDate: '2020-08-01',
    avatar: 'https://ui-avatars.com/api/?name=Divya+Krishnan&background=8b5cf6&color=fff&size=128',
  },
];

// 4. Attendance (sample records for first two students)
const attendance = [
  { studentId: 'STU-2024-001', date: '2026-03-10', status: 'present', subject: 'CS301' },
  { studentId: 'STU-2024-001', date: '2026-03-11', status: 'present', subject: 'CS302' },
  { studentId: 'STU-2024-001', date: '2026-03-12', status: 'absent',  subject: 'CS303' },
  { studentId: 'STU-2024-042', date: '2026-03-10', status: 'present', subject: 'CS301' },
  { studentId: 'STU-2024-042', date: '2026-03-11', status: 'present', subject: 'CS302' },
  { studentId: 'STU-2024-042', date: '2026-03-12', status: 'present', subject: 'CS303' },
  { studentId: 'STU-2024-015', date: '2026-03-10', status: 'present', subject: 'ME201' },
  { studentId: 'STU-2024-015', date: '2026-03-11', status: 'leave',   subject: 'ME202' },
  { studentId: 'STU-2024-023', date: '2026-03-10', status: 'present', subject: 'EE401' },
  { studentId: 'STU-2024-007', date: '2026-03-10', status: 'absent',  subject: 'ECE101' },
];

// 5. Academic Results
const academicResults = [
  // Aarav – Sem 6
  { studentId: 'STU-2024-001', semester: 6, subjectCode: 'CS301', subjectName: 'Data Structures',       credits: 4, grade: 'A+', status: 'Pass' },
  { studentId: 'STU-2024-001', semester: 6, subjectCode: 'CS302', subjectName: 'Operating Systems',     credits: 4, grade: 'A',  status: 'Pass' },
  { studentId: 'STU-2024-001', semester: 6, subjectCode: 'CS303', subjectName: 'Database Systems',      credits: 4, grade: 'A',  status: 'Pass' },
  { studentId: 'STU-2024-001', semester: 6, subjectCode: 'CS304', subjectName: 'Computer Networks',     credits: 3, grade: 'B+', status: 'Pass' },
  { studentId: 'STU-2024-001', semester: 6, subjectCode: 'MA301', subjectName: 'Discrete Mathematics',  credits: 3, grade: 'A+', status: 'Pass' },
  // Priya – Sem 6
  { studentId: 'STU-2024-042', semester: 6, subjectCode: 'CS301', subjectName: 'Data Structures',       credits: 4, grade: 'O',  status: 'Pass' },
  { studentId: 'STU-2024-042', semester: 6, subjectCode: 'CS302', subjectName: 'Operating Systems',     credits: 4, grade: 'A+', status: 'Pass' },
  { studentId: 'STU-2024-042', semester: 6, subjectCode: 'CS303', subjectName: 'Database Systems',      credits: 4, grade: 'A+', status: 'Pass' },
  { studentId: 'STU-2024-042', semester: 6, subjectCode: 'CS304', subjectName: 'Computer Networks',     credits: 3, grade: 'A',  status: 'Pass' },
  // Rohan – Sem 4
  { studentId: 'STU-2024-015', semester: 4, subjectCode: 'ME201', subjectName: 'Thermodynamics',        credits: 4, grade: 'B+', status: 'Pass' },
  { studentId: 'STU-2024-015', semester: 4, subjectCode: 'ME202', subjectName: 'Fluid Mechanics',       credits: 4, grade: 'B',  status: 'Pass' },
  { studentId: 'STU-2024-015', semester: 4, subjectCode: 'ME203', subjectName: 'Manufacturing Proc.',   credits: 3, grade: 'A',  status: 'Pass' },
  // Karthik – Sem 2
  { studentId: 'STU-2024-007', semester: 2, subjectCode: 'ECE101', subjectName: 'Circuit Theory',       credits: 4, grade: 'C',  status: 'Pass' },
  { studentId: 'STU-2024-007', semester: 2, subjectCode: 'ECE102', subjectName: 'Signals & Systems',    credits: 4, grade: 'D',  status: 'Pass' },
];

// 6. Fees
const fees = [
  { studentId: 'STU-2024-001', feeType: 'Tuition',  receiptNumber: 'RCP-2026-001', dueAmount: 75000, paidAmount: 75000, status: 'paid',    date: '2025-07-15' },
  { studentId: 'STU-2024-001', feeType: 'Hostel',   receiptNumber: 'RCP-2026-002', dueAmount: 45000, paidAmount: 45000, status: 'paid',    date: '2025-07-20' },
  { studentId: 'STU-2024-001', feeType: 'Lab',      receiptNumber: 'RCP-2026-003', dueAmount: 12000, paidAmount: 12000, status: 'paid',    date: '2025-08-01' },
  { studentId: 'STU-2024-042', feeType: 'Tuition',  receiptNumber: 'RCP-2026-004', dueAmount: 75000, paidAmount: 75000, status: 'paid',    date: '2025-07-15' },
  { studentId: 'STU-2024-042', feeType: 'Hostel',   receiptNumber: 'RCP-2026-005', dueAmount: 45000, paidAmount: 45000, status: 'paid',    date: '2025-07-22' },
  { studentId: 'STU-2024-015', feeType: 'Tuition',  receiptNumber: '',              dueAmount: 75000, paidAmount: 40000, status: 'pending', date: '2025-07-15' },
  { studentId: 'STU-2024-015', feeType: 'Lab',      receiptNumber: '',              dueAmount: 12000, paidAmount: 0,     status: 'pending', date: '2025-08-01' },
  { studentId: 'STU-2024-007', feeType: 'Tuition',  receiptNumber: '',              dueAmount: 75000, paidAmount: 0,     status: 'overdue', date: '2025-07-15' },
  { studentId: 'STU-2024-023', feeType: 'Tuition',  receiptNumber: 'RCP-2026-009', dueAmount: 75000, paidAmount: 75000, status: 'paid',    date: '2025-07-10' },
  { studentId: 'STU-2023-050', feeType: 'Tuition',  receiptNumber: 'RCP-2025-050', dueAmount: 75000, paidAmount: 75000, status: 'paid',    date: '2024-07-12' },
];

// 7. Documents
const documents = [
  { studentId: 'STU-2024-001', fileName: '10th_Marksheet_Aarav.pdf',    category: 'marksheet',        fileUrl: '/uploads/docs/stu001_10th.pdf' },
  { studentId: 'STU-2024-001', fileName: '12th_Marksheet_Aarav.pdf',    category: 'marksheet',        fileUrl: '/uploads/docs/stu001_12th.pdf' },
  { studentId: 'STU-2024-001', fileName: 'Admission_Form_Aarav.pdf',    category: 'admission_forms',  fileUrl: '/uploads/docs/stu001_admission.pdf' },
  { studentId: 'STU-2024-042', fileName: '10th_Marksheet_Priya.pdf',    category: 'marksheet',        fileUrl: '/uploads/docs/stu042_10th.pdf' },
  { studentId: 'STU-2024-042', fileName: '12th_Marksheet_Priya.pdf',    category: 'marksheet',        fileUrl: '/uploads/docs/stu042_12th.pdf' },
  { studentId: 'STU-2024-015', fileName: 'Internship_Letter_Rohan.pdf', category: 'internship_letter', fileUrl: '/uploads/docs/stu015_intern.pdf' },
  { studentId: 'STU-2024-023', fileName: 'Certificate_Ananya.pdf',      category: 'certificates',     fileUrl: '/uploads/docs/stu023_cert.pdf' },
  { studentId: 'STU-2023-050', fileName: 'Degree_Certificate_Divya.pdf', category: 'certificates',    fileUrl: '/uploads/docs/stu050_degree.pdf' },
];

// 8. Reports
const reports = [
  { reportType: 'Attendance', generatedBy: 'Admin',             generatedAt: '2026-03-01', fileUrl: '/reports/attendance_march.pdf' },
  { reportType: 'Academic',   generatedBy: 'Dr. Rajesh Kumar',  generatedAt: '2026-02-28', fileUrl: '/reports/academic_sem6.pdf' },
  { reportType: 'Fee',        generatedBy: 'Admin',             generatedAt: '2026-03-05', fileUrl: '/reports/fee_q1_2026.pdf' },
];

// 9. System Settings
const systemSettings = [
  { key: 'institution_name',       value: 'MIT Connect',                    description: 'Name of the institution' },
  { key: 'academic_year',          value: '2025-2026',                      description: 'Current academic year' },
  { key: 'semesters_per_year',     value: 2,                                description: 'Number of semesters per academic year' },
  { key: 'max_students_per_class', value: 60,                               description: 'Maximum students allowed per class section' },
  { key: 'attendance_threshold',   value: 75,                               description: 'Minimum attendance percentage required (%)' },
  { key: 'fee_due_reminder_days',  value: 15,                               description: 'Days before due date to send reminders' },
  { key: 'grading_system',         value: { type: 'CGPA', scale: 10 },      description: 'Grading system configuration' },
];

// ═══════════════════════════════════════════════════════
//  SEED RUNNER
// ═══════════════════════════════════════════════════════
async function seedDB() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas.\n');

    // Drop old collections to clear stale indexes, then recreate
    console.log('🗑  Dropping old collections (clearing stale indexes)...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collNames = collections.map(c => c.name);
    const toDrop = ['departments', 'faculties', 'students', 'attendances', 'academicresults', 'fees', 'documents', 'reports', 'systemsettings'];
    for (const name of toDrop) {
      if (collNames.includes(name)) {
        await db.dropCollection(name);
        console.log(`   Dropped: ${name}`);
      }
    }
    console.log('   All collections cleared.\n');

    // Seed in dependency order
    console.log('📦 Seeding departments...');
    await Department.insertMany(departments);
    console.log(`   ✅ ${departments.length} departments inserted.`);

    console.log('📦 Seeding faculty...');
    await Faculty.insertMany(faculty);
    console.log(`   ✅ ${faculty.length} faculty members inserted.`);

    console.log('📦 Seeding students...');
    await Student.insertMany(students);
    console.log(`   ✅ ${students.length} students inserted.`);

    console.log('📦 Seeding attendance...');
    await Attendance.insertMany(attendance);
    console.log(`   ✅ ${attendance.length} attendance records inserted.`);

    console.log('📦 Seeding academic results...');
    await AcademicResult.insertMany(academicResults);
    console.log(`   ✅ ${academicResults.length} academic results inserted.`);

    console.log('📦 Seeding fees...');
    await Fee.insertMany(fees);
    console.log(`   ✅ ${fees.length} fee records inserted.`);

    console.log('📦 Seeding documents...');
    await Document.insertMany(documents);
    console.log(`   ✅ ${documents.length} documents inserted.`);

    console.log('📦 Seeding reports...');
    await Report.insertMany(reports);
    console.log(`   ✅ ${reports.length} reports inserted.`);

    console.log('📦 Seeding system settings...');
    await SystemSetting.insertMany(systemSettings);
    console.log(`   ✅ ${systemSettings.length} settings inserted.`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('────────────────────────────────');
    console.log('   Collections populated:');
    console.log('   • departments         →', departments.length);
    console.log('   • faculty             →', faculty.length);
    console.log('   • students            →', students.length);
    console.log('   • attendance          →', attendance.length);
    console.log('   • academic_results    →', academicResults.length);
    console.log('   • fees                →', fees.length);
    console.log('   • documents           →', documents.length);
    console.log('   • reports             →', reports.length);
    console.log('   • system_settings     →', systemSettings.length);
    console.log('────────────────────────────────');

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  } catch (err) {
    console.error('\n❌ SEED ERROR:', err.message);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('   Could not connect to MongoDB Atlas.');
      console.error('   → Check your connection string in .env');
      console.error('   → Check your IP whitelist in Atlas');
    }
    process.exit(1);
  }
}

seedDB();

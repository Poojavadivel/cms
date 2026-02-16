// reset_database_keep_users.js
// ⚠️ DANGER: This script will DELETE ALL DATA from the database
// Only keeps specified users with their credentials

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const {
  User,
  Staff,
  AuthSession,
  Patient,
  Intake,
  Appointment,
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  LabReport,
  File,
  AuditLog,
  Bot,
  PatientPDF,
  PrescriptionDocument,
  LabReportDocument,
  MedicalHistoryDocument,
  Payroll
} = require('./Models');

// Users to keep
const KEEP_USERS = [
  {
    email: 'banu@karurgastro.com',
    password: 'Banu@123',
    role: 'admin',
    firstName: 'Banu',
    lastName: 'Admin'
  },
  {
    email: 'dr.sanjit@karurgastro.com',
    password: 'Doctor@123',
    role: 'doctor',
    firstName: 'Sanjit',
    lastName: 'Doctor'
  },
  {
    email: 'dr.sriram@karurgastro.com',
    password: 'Doctor@123',
    role: 'doctor',
    firstName: 'Sriram',
    lastName: 'Doctor'
  },
  {
    email: 'pharmacist@hms.com',
    password: '12332112',
    role: 'pharmacist',
    firstName: 'Pharmacist',
    lastName: 'User'
  },
  {
    email: 'pathologist@hms.com',
    password: '12332112',
    role: 'pathologist',
    firstName: 'Pathologist',
    lastName: 'User'
  }
];

// Connect to MongoDB
async function connectDB() {
  try {
    const MONGO_URI = process.env.MANGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/hms_karur';
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Main reset function
async function resetDatabase() {
  console.log('\n🚨 ================================');
  console.log('🚨 DATABASE RESET SCRIPT');
  console.log('🚨 ================================\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA except specified users!\n');

  // Wait 5 seconds before proceeding
  console.log('⏳ Starting in 5 seconds... Press Ctrl+C to cancel\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    console.log('\n📊 Starting database cleanup...\n');

    // 1. Delete all collections EXCEPT User
    console.log('🗑️  Deleting Patients...');
    const patientsDeleted = await Patient.deleteMany({});
    console.log(`   ✓ Deleted ${patientsDeleted.deletedCount} patients`);

    console.log('🗑️  Deleting Appointments...');
    const appointmentsDeleted = await Appointment.deleteMany({});
    console.log(`   ✓ Deleted ${appointmentsDeleted.deletedCount} appointments`);

    console.log('🗑️  Deleting Intake records...');
    const intakesDeleted = await Intake.deleteMany({});
    console.log(`   ✓ Deleted ${intakesDeleted.deletedCount} intakes`);

    console.log('🗑️  Deleting Staff...');
    const staffDeleted = await Staff.deleteMany({});
    console.log(`   ✓ Deleted ${staffDeleted.deletedCount} staff members`);

    console.log('🗑️  Deleting Medicines...');
    const medicinesDeleted = await Medicine.deleteMany({});
    console.log(`   ✓ Deleted ${medicinesDeleted.deletedCount} medicines`);

    console.log('🗑️  Deleting Medicine Batches...');
    const batchesDeleted = await MedicineBatch.deleteMany({});
    console.log(`   ✓ Deleted ${batchesDeleted.deletedCount} medicine batches`);

    console.log('🗑️  Deleting Pharmacy Records...');
    const pharmacyDeleted = await PharmacyRecord.deleteMany({});
    console.log(`   ✓ Deleted ${pharmacyDeleted.deletedCount} pharmacy records`);

    console.log('🗑️  Deleting Lab Reports...');
    const labReportsDeleted = await LabReport.deleteMany({});
    console.log(`   ✓ Deleted ${labReportsDeleted.deletedCount} lab reports`);

    console.log('🗑️  Deleting Lab Report Documents...');
    const labReportDocsDeleted = await LabReportDocument.deleteMany({});
    console.log(`   ✓ Deleted ${labReportDocsDeleted.deletedCount} lab report documents`);

    console.log('🗑️  Deleting Prescription Documents...');
    const prescriptionDocsDeleted = await PrescriptionDocument.deleteMany({});
    console.log(`   ✓ Deleted ${prescriptionDocsDeleted.deletedCount} prescription documents`);

    console.log('🗑️  Deleting Medical History Documents...');
    const medicalHistoryDeleted = await MedicalHistoryDocument.deleteMany({});
    console.log(`   ✓ Deleted ${medicalHistoryDeleted.deletedCount} medical history documents`);

    console.log('🗑️  Deleting Patient PDFs...');
    const pdfDeleted = await PatientPDF.deleteMany({});
    console.log(`   ✓ Deleted ${pdfDeleted.deletedCount} patient PDFs`);

    console.log('🗑️  Deleting Files...');
    const filesDeleted = await File.deleteMany({});
    console.log(`   ✓ Deleted ${filesDeleted.deletedCount} files`);

    console.log('🗑️  Deleting Auth Sessions...');
    const sessionsDeleted = await AuthSession.deleteMany({});
    console.log(`   ✓ Deleted ${sessionsDeleted.deletedCount} auth sessions`);

    console.log('🗑️  Deleting Audit Logs...');
    const auditLogsDeleted = await AuditLog.deleteMany({});
    console.log(`   ✓ Deleted ${auditLogsDeleted.deletedCount} audit logs`);

    console.log('🗑️  Deleting Bot conversations...');
    const botsDeleted = await Bot.deleteMany({});
    console.log(`   ✓ Deleted ${botsDeleted.deletedCount} bot conversations`);

    console.log('🗑️  Deleting Payroll records...');
    const payrollDeleted = await Payroll.deleteMany({});
    console.log(`   ✓ Deleted ${payrollDeleted.deletedCount} payroll records`);

    // 2. Delete ALL users first
    console.log('\n🗑️  Deleting ALL existing users...');
    const usersDeleted = await User.deleteMany({});
    console.log(`   ✓ Deleted ${usersDeleted.deletedCount} users`);

    // 3. Create fresh users with specified credentials
    console.log('\n👥 Creating fresh users...\n');
    
    for (const userData of KEEP_USERS) {
      try {
        const user = new User({
          email: userData.email,
          password: userData.password, // Will be hashed by pre-save hook
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          is_active: true
        });
        
        await user.save();
        console.log(`   ✓ Created ${userData.role}: ${userData.email}`);
      } catch (error) {
        console.error(`   ❌ Failed to create ${userData.email}:`, error.message);
      }
    }

    // Summary
    console.log('\n✅ ================================');
    console.log('✅ DATABASE RESET COMPLETE');
    console.log('✅ ================================\n');
    console.log('📊 Summary:');
    console.log(`   - Patients: ${patientsDeleted.deletedCount} deleted`);
    console.log(`   - Appointments: ${appointmentsDeleted.deletedCount} deleted`);
    console.log(`   - Intakes: ${intakesDeleted.deletedCount} deleted`);
    console.log(`   - Staff: ${staffDeleted.deletedCount} deleted`);
    console.log(`   - Medicines: ${medicinesDeleted.deletedCount} deleted`);
    console.log(`   - Medicine Batches: ${batchesDeleted.deletedCount} deleted`);
    console.log(`   - Pharmacy Records: ${pharmacyDeleted.deletedCount} deleted`);
    console.log(`   - Lab Reports: ${labReportsDeleted.deletedCount} deleted`);
    console.log(`   - Lab Report Documents: ${labReportDocsDeleted.deletedCount} deleted`);
    console.log(`   - Prescription Documents: ${prescriptionDocsDeleted.deletedCount} deleted`);
    console.log(`   - Medical History Documents: ${medicalHistoryDeleted.deletedCount} deleted`);
    console.log(`   - Patient PDFs: ${pdfDeleted.deletedCount} deleted`);
    console.log(`   - Files: ${filesDeleted.deletedCount} deleted`);
    console.log(`   - Auth Sessions: ${sessionsDeleted.deletedCount} deleted`);
    console.log(`   - Audit Logs: ${auditLogsDeleted.deletedCount} deleted`);
    console.log(`   - Bot Conversations: ${botsDeleted.deletedCount} deleted`);
    console.log(`   - Payroll Records: ${payrollDeleted.deletedCount} deleted`);
    console.log(`   - Users: ${usersDeleted.deletedCount} deleted, ${KEEP_USERS.length} created`);
    
    console.log('\n👥 Active Users:');
    KEEP_USERS.forEach(user => {
      console.log(`   - ${user.role.toUpperCase()}: ${user.email}`);
    });
    
    console.log('\n🔐 Credentials:');
    console.log('   Admin:       banu@karurgastro.com / Banu@123');
    console.log('   Doctor 1:    dr.sanjit@karurgastro.com / Doctor@123');
    console.log('   Doctor 2:    dr.sriram@karurgastro.com / Doctor@123');
    console.log('   Pharmacist:  pharmacist@hms.com / 12332112');
    console.log('   Pathologist: pathologist@hms.com / 12332112');
    console.log('\n✅ Database is now clean and ready to use!\n');

  } catch (error) {
    console.error('\n❌ Error during database reset:', error);
    throw error;
  }
}

// Run the script
async function main() {
  try {
    await connectDB();
    await resetDatabase();
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Execute
main();

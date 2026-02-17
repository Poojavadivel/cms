// Server/reset_database_keep_core_users.js
// Reset database but keep only the 5 core users (Admin, 2 Doctors, Pharmacist, Pathologist)

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karur_hms';

// Import models
const {
  Patient,
  Appointment,
  User,
  Staff,
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  LabReport,
  Invoice,
  Payroll,
  PatientVitals,
  Intake,
  LabReportDocument,
  MedicalHistoryDocument,
  PrescriptionDocument,
  PatientPDF,
  File,
  Bot,
  AuditLog,
  AuthSession
} = require('./Models');

async function resetDatabase() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  DATABASE CLEANUP - Keep Core Users Only                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get core users before deletion
    console.log('👥 Identifying core users...');
    const coreUsers = await User.find({
      email: {
        $in: [
          'banu@karurgastro.com',
          'dr.sanjit@karurgastro.com',
          'dr.sriram@karurgastro.com',
          'pharmacist@hms.com',
          'pathologist@hms.com'
        ]
      }
    });

    console.log(`✅ Found ${coreUsers.length} core users to keep:`);
    coreUsers.forEach(user => {
      console.log(`   • ${user.firstName} ${user.lastName} - ${user.email} (${user.role})`);
    });
    console.log('');

    // Delete all collections except core users
    console.log('🗑️  Deleting data...\n');

    // 1. Delete Patients
    const patientCount = await Patient.countDocuments();
    if (patientCount > 0) {
      await Patient.deleteMany({});
      console.log(`   ✅ Deleted ${patientCount} patients`);
    } else {
      console.log('   ⚪ No patients to delete');
    }

    // 2. Delete Appointments
    const appointmentCount = await Appointment.countDocuments();
    if (appointmentCount > 0) {
      await Appointment.deleteMany({});
      console.log(`   ✅ Deleted ${appointmentCount} appointments`);
    } else {
      console.log('   ⚪ No appointments to delete');
    }

    // 3. Delete Staff
    const staffCount = await Staff.countDocuments();
    if (staffCount > 0) {
      await Staff.deleteMany({});
      console.log(`   ✅ Deleted ${staffCount} staff members`);
    } else {
      console.log('   ⚪ No staff to delete');
    }

    // 4. Delete Medicines
    const medicineCount = await Medicine.countDocuments();
    if (medicineCount > 0) {
      await Medicine.deleteMany({});
      console.log(`   ✅ Deleted ${medicineCount} medicines`);
    } else {
      console.log('   ⚪ No medicines to delete');
    }

    // 5. Delete Medicine Batches
    const batchCount = await MedicineBatch.countDocuments();
    if (batchCount > 0) {
      await MedicineBatch.deleteMany({});
      console.log(`   ✅ Deleted ${batchCount} medicine batches`);
    } else {
      console.log('   ⚪ No medicine batches to delete');
    }

    // 6. Delete Pharmacy Records
    const pharmacyCount = await PharmacyRecord.countDocuments();
    if (pharmacyCount > 0) {
      await PharmacyRecord.deleteMany({});
      console.log(`   ✅ Deleted ${pharmacyCount} pharmacy records`);
    } else {
      console.log('   ⚪ No pharmacy records to delete');
    }

    // 7. Delete Lab Reports
    const labReportCount = await LabReport.countDocuments();
    if (labReportCount > 0) {
      await LabReport.deleteMany({});
      console.log(`   ✅ Deleted ${labReportCount} lab reports`);
    } else {
      console.log('   ⚪ No lab reports to delete');
    }

    // 8. Delete Invoices
    const invoiceCount = await Invoice.countDocuments();
    if (invoiceCount > 0) {
      await Invoice.deleteMany({});
      console.log(`   ✅ Deleted ${invoiceCount} invoices`);
    } else {
      console.log('   ⚪ No invoices to delete');
    }

    // 9. Delete Payroll
    const payrollCount = await Payroll.countDocuments();
    if (payrollCount > 0) {
      await Payroll.deleteMany({});
      console.log(`   ✅ Deleted ${payrollCount} payroll records`);
    } else {
      console.log('   ⚪ No payroll records to delete');
    }

    // 10. Delete Patient Vitals
    const vitalsCount = await PatientVitals.countDocuments();
    if (vitalsCount > 0) {
      await PatientVitals.deleteMany({});
      console.log(`   ✅ Deleted ${vitalsCount} patient vitals`);
    } else {
      console.log('   ⚪ No patient vitals to delete');
    }

    // 11. Delete Intakes
    const intakeCount = await Intake.countDocuments();
    if (intakeCount > 0) {
      await Intake.deleteMany({});
      console.log(`   ✅ Deleted ${intakeCount} intake forms`);
    } else {
      console.log('   ⚪ No intake forms to delete');
    }

    // 12. Delete Documents
    const labDocCount = await LabReportDocument.countDocuments();
    if (labDocCount > 0) {
      await LabReportDocument.deleteMany({});
      console.log(`   ✅ Deleted ${labDocCount} lab report documents`);
    } else {
      console.log('   ⚪ No lab report documents to delete');
    }

    const medHistoryCount = await MedicalHistoryDocument.countDocuments();
    if (medHistoryCount > 0) {
      await MedicalHistoryDocument.deleteMany({});
      console.log(`   ✅ Deleted ${medHistoryCount} medical history documents`);
    } else {
      console.log('   ⚪ No medical history documents to delete');
    }

    const prescriptionDocCount = await PrescriptionDocument.countDocuments();
    if (prescriptionDocCount > 0) {
      await PrescriptionDocument.deleteMany({});
      console.log(`   ✅ Deleted ${prescriptionDocCount} prescription documents`);
    } else {
      console.log('   ⚪ No prescription documents to delete');
    }

    const patientPDFCount = await PatientPDF.countDocuments();
    if (patientPDFCount > 0) {
      await PatientPDF.deleteMany({});
      console.log(`   ✅ Deleted ${patientPDFCount} patient PDFs`);
    } else {
      console.log('   ⚪ No patient PDFs to delete');
    }

    // 13. Delete Files
    const fileCount = await File.countDocuments();
    if (fileCount > 0) {
      await File.deleteMany({});
      console.log(`   ✅ Deleted ${fileCount} files`);
    } else {
      console.log('   ⚪ No files to delete');
    }

    // 14. Delete Bot Data
    const botCount = await Bot.countDocuments();
    if (botCount > 0) {
      await Bot.deleteMany({});
      console.log(`   ✅ Deleted ${botCount} bot records`);
    } else {
      console.log('   ⚪ No bot records to delete');
    }

    // 15. Delete Audit Logs
    const auditCount = await AuditLog.countDocuments();
    if (auditCount > 0) {
      await AuditLog.deleteMany({});
      console.log(`   ✅ Deleted ${auditCount} audit logs`);
    } else {
      console.log('   ⚪ No audit logs to delete');
    }

    // 16. Delete Auth Sessions
    const sessionCount = await AuthSession.countDocuments();
    if (sessionCount > 0) {
      await AuthSession.deleteMany({});
      console.log(`   ✅ Deleted ${sessionCount} auth sessions`);
    } else {
      console.log('   ⚪ No auth sessions to delete');
    }

    // 17. Delete non-core users
    const coreUserIds = coreUsers.map(u => u._id);
    const deletedUsers = await User.deleteMany({
      _id: { $nin: coreUserIds }
    });
    
    if (deletedUsers.deletedCount > 0) {
      console.log(`   ✅ Deleted ${deletedUsers.deletedCount} non-core users`);
    } else {
      console.log('   ⚪ No non-core users to delete');
    }

    console.log('\n' + '═'.repeat(67) + '\n');

    // Verify core users still exist
    const remainingUsers = await User.countDocuments();
    console.log('✅ Database cleanup complete!\n');
    console.log('📊 Final Status:');
    console.log(`   • Users remaining: ${remainingUsers}`);
    console.log(`   • Patients: 0`);
    console.log(`   • Appointments: 0`);
    console.log(`   • Staff: 0`);
    console.log(`   • Medicines: 0`);
    console.log(`   • All other data: 0\n`);

    console.log('👥 Core Users Preserved:');
    const finalUsers = await User.find({}).select('firstName lastName email role');
    finalUsers.forEach(user => {
      console.log(`   • ${user.firstName} ${user.lastName} - ${user.email} (${user.role})`);
    });

    console.log('\n✨ Database is now clean with only core users!\n');
    console.log('💡 You can now:');
    console.log('   • Test Telegram bot with fresh data');
    console.log('   • Add test patients via the system');
    console.log('   • Run: node Server/Bot/telegram_bot.js\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();

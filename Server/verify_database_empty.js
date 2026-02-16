// verify_database_empty.js
// Verify all collections are empty except Users

const mongoose = require('mongoose');
require('dotenv').config();
const {
  User, Patient, Appointment, Staff, Intake, Medicine, MedicineBatch,
  PharmacyRecord, LabReport, LabReportDocument, PrescriptionDocument,
  MedicalHistoryDocument, PatientPDF, File, AuthSession, AuditLog, Bot, Payroll
} = require('./Models');

async function verifyEmpty() {
  try {
    await mongoose.connect(process.env.MANGODB_URL || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const collections = [
      { name: 'Users', model: User },
      { name: 'Patients', model: Patient },
      { name: 'Appointments', model: Appointment },
      { name: 'Staff', model: Staff },
      { name: 'Intake', model: Intake },
      { name: 'Medicines', model: Medicine },
      { name: 'Medicine Batches', model: MedicineBatch },
      { name: 'Pharmacy Records', model: PharmacyRecord },
      { name: 'Lab Reports', model: LabReport },
      { name: 'Lab Report Docs', model: LabReportDocument },
      { name: 'Prescription Docs', model: PrescriptionDocument },
      { name: 'Medical History Docs', model: MedicalHistoryDocument },
      { name: 'Patient PDFs', model: PatientPDF },
      { name: 'Files', model: File },
      { name: 'Auth Sessions', model: AuthSession },
      { name: 'Audit Logs', model: AuditLog },
      { name: 'Bot Conversations', model: Bot },
      { name: 'Payroll', model: Payroll }
    ];

    console.log('📊 Collection Status:\n');
    console.log('Collection            | Count | Status');
    console.log('----------------------|-------|--------');

    for (const collection of collections) {
      const count = await collection.model.countDocuments({});
      const status = count === 0 ? '✓ Empty' : (collection.name === 'Users' ? '✓ OK' : '⚠️ Has Data');
      const countStr = count.toString().padStart(5);
      console.log(`${collection.name.padEnd(21)} | ${countStr} | ${status}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Verification complete');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyEmpty();

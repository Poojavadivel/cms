// Check pharmacy and pathology collections
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MANGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/hms';

async function checkCollections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check Intakes collection
    console.log('📋 CHECKING INTAKES COLLECTION');
    console.log('=' .repeat(60));
    const intakes = await db.collection('intakes').find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log(`Found ${intakes.length} recent intakes:\n`);
    
    intakes.forEach((intake, idx) => {
      console.log(`${idx + 1}. Intake ID: ${intake._id}`);
      console.log(`   Patient: ${intake.patientSnapshot?.firstName} ${intake.patientSnapshot?.lastName}`);
      console.log(`   Created: ${intake.createdAt}`);
      console.log(`   Has pharmacy items: ${intake.meta?.pharmacyItems ? 'YES (' + intake.meta.pharmacyItems.length + ' items)' : 'NO'}`);
      console.log(`   Pharmacy ID set: ${intake.meta?.pharmacyId ? 'YES' : 'NO'}`);
      
      if (intake.meta?.pharmacyItems) {
        console.log(`   Pharmacy Items:`);
        intake.meta.pharmacyItems.forEach((item, i) => {
          console.log(`     ${i + 1}. ${item.name} - Qty: ${item.quantity}, Price: ${item.unitPrice}`);
        });
      }
      
      console.log(`   Has pathology items: ${intake.meta?.pathologyItems ? 'YES (' + intake.meta.pathologyItems.length + ' items)' : 'NO'}`);
      if (intake.meta?.pathologyItems) {
        console.log(`   Pathology Items:`);
        intake.meta.pathologyItems.forEach((item, i) => {
          console.log(`     ${i + 1}. ${item.testName}`);
        });
      }
      console.log('');
    });

    // Check PharmacyRecords collection
    console.log('\n💊 CHECKING PHARMACY RECORDS COLLECTION');
    console.log('=' .repeat(60));
    const pharmacyRecords = await db.collection('pharmacyrecords').find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log(`Found ${pharmacyRecords.length} recent pharmacy records:\n`);
    
    pharmacyRecords.forEach((record, idx) => {
      console.log(`${idx + 1}. Pharmacy Record ID: ${record._id}`);
      console.log(`   Type: ${record.type}`);
      console.log(`   Patient ID: ${record.patientId}`);
      console.log(`   Created: ${record.createdAt}`);
      console.log(`   Items: ${record.items?.length || 0}`);
      console.log(`   Total: ₹${record.total || 0}`);
      console.log('');
    });

    // Check LabReports collection
    console.log('\n🧪 CHECKING LAB REPORTS COLLECTION');
    console.log('=' .repeat(60));
    const labReports = await db.collection('labreports').find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log(`Found ${labReports.length} recent lab reports:\n`);
    
    labReports.forEach((report, idx) => {
      console.log(`${idx + 1}. Lab Report ID: ${report._id}`);
      console.log(`   Test: ${report.testName}`);
      console.log(`   Patient ID: ${report.patientId}`);
      console.log(`   Status: ${report.status}`);
      console.log(`   Created: ${report.createdAt}`);
      console.log('');
    });

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('=' .repeat(60));
    const totalIntakes = await db.collection('intakes').countDocuments({});
    const intakesWithPharmacy = await db.collection('intakes').countDocuments({ 'meta.pharmacyItems': { $exists: true, $ne: [] } });
    const intakesWithPharmacyId = await db.collection('intakes').countDocuments({ 'meta.pharmacyId': { $exists: true } });
    const pendingPrescriptions = await db.collection('intakes').countDocuments({ 
      'meta.pharmacyItems': { $exists: true, $ne: [] },
      'meta.pharmacyId': { $exists: false }
    });
    const intakesWithPathology = await db.collection('intakes').countDocuments({ 'meta.pathologyItems': { $exists: true, $ne: [] } });
    
    const totalPharmacyRecords = await db.collection('pharmacyrecords').countDocuments({});
    const totalLabReports = await db.collection('labreports').countDocuments({});

    console.log(`Total Intakes: ${totalIntakes}`);
    console.log(`Intakes with Pharmacy Items: ${intakesWithPharmacy}`);
    console.log(`Intakes with Pharmacy ID (already dispensed): ${intakesWithPharmacyId}`);
    console.log(`Pending Prescriptions (not yet dispensed): ${pendingPrescriptions}`);
    console.log(`Intakes with Pathology Items: ${intakesWithPathology}`);
    console.log(`Total Pharmacy Records: ${totalPharmacyRecords}`);
    console.log(`Total Lab Reports: ${totalLabReports}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCollections();

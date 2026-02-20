// Check pending pathology tests specifically
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MANGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/hms';

async function checkPendingPathology() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check for pending pathology orders
    console.log('🧪 CHECKING PENDING PATHOLOGY ORDERS');
    console.log('=' .repeat(60));

    // Query that matches backend logic
    const pendingPathologyIntakes = await db.collection('intakes').find({
      $or: [
        { 'meta.labReportIds': { $exists: false } },
        { 'meta.pathologyItems': { $elemMatch: { status: { $ne: 'Completed' } } } }
      ],
      'meta.pathologyItems': { $exists: true, $ne: [] }
    }).sort({ createdAt: -1 }).limit(10).toArray();

    console.log(`Found ${pendingPathologyIntakes.length} pending pathology orders:\n`);

    pendingPathologyIntakes.forEach((intake, idx) => {
      console.log(`${idx + 1}. Intake ID: ${intake._id}`);
      console.log(`   Patient: ${intake.patientSnapshot?.firstName} ${intake.patientSnapshot?.lastName}`);
      console.log(`   Created: ${intake.createdAt}`);
      console.log(`   Pathology Items (${intake.meta?.pathologyItems?.length}):`);
      
      intake.meta?.pathologyItems?.forEach((item, i) => {
        console.log(`     ${i + 1}. ${item.testName} - Status: ${item.status || 'Requested'}, Priority: ${item.priority || 'Normal'}`);
      });
      
      console.log(`   Has labReportIds: ${intake.meta?.labReportIds ? 'YES (' + intake.meta.labReportIds.length + ')' : 'NO'}`);
      console.log('');
    });

    // Summary
    console.log('\n📊 DETAILED SUMMARY');
    console.log('=' .repeat(60));
    
    const totalIntakes = await db.collection('intakes').countDocuments({});
    const intakesWithPathologyItems = await db.collection('intakes').countDocuments({ 
      'meta.pathologyItems': { $exists: true, $ne: [] } 
    });
    
    const intakesWithLabReportIds = await db.collection('intakes').countDocuments({ 
      'meta.labReportIds': { $exists: true, $ne: [] } 
    });
    
    // Exactly matching backend query
    const pendingPathologyCount = await db.collection('intakes').countDocuments({
      $or: [
        { 'meta.labReportIds': { $exists: false } },
        { 'meta.pathologyItems': { $elemMatch: { status: { $ne: 'Completed' } } } }
      ],
      'meta.pathologyItems': { $exists: true, $ne: [] }
    });

    console.log(`Total Intakes: ${totalIntakes}`);
    console.log(`Intakes with Pathology Items: ${intakesWithPathologyItems}`);
    console.log(`Intakes with Lab Report IDs: ${intakesWithLabReportIds}`);
    console.log(`Pending Pathology Orders (Backend Query): ${pendingPathologyCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPendingPathology();

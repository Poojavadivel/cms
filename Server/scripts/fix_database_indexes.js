// fix_database_indexes.js
// Run this script to create necessary database indexes for performance optimization
// Usage: node scripts/fix_database_indexes.js

require('dotenv').config();
const mongoose = require('mongoose');

async function createIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karur_hms');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log('\n📊 Creating indexes...\n');

    // Patients indexes
    console.log('Creating patients indexes...');
    await db.collection('patients').createIndex({ patientCode: 1 }, { unique: true });
    await db.collection('patients').createIndex({ doctorId: 1 });
    await db.collection('patients').createIndex({ phone: 1 });
    await db.collection('patients').createIndex({ email: 1 });
    console.log('✅ Patients indexes created');

    // Appointments indexes
    console.log('Creating appointments indexes...');
    await db.collection('appointments').createIndex({ doctorId: 1, startAt: -1 });
    await db.collection('appointments').createIndex({ patientId: 1 });
    await db.collection('appointments').createIndex({ status: 1 });
    await db.collection('appointments').createIndex({ startAt: 1 });
    console.log('✅ Appointments indexes created');

    // Users indexes
    console.log('Creating users indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    console.log('✅ Users indexes created');

    // Medicines indexes
    console.log('Creating medicines indexes...');
    await db.collection('medicines').createIndex({ name: 1 });
    await db.collection('medicines').createIndex({ sku: 1 });
    await db.collection('medicines').createIndex({ category: 1 });
    await db.collection('medicines').createIndex({ status: 1 });
    console.log('✅ Medicines indexes created');

    // Medicine Batches indexes
    console.log('Creating medicine batches indexes...');
    await db.collection('medicinebatches').createIndex({ medicineId: 1 });
    await db.collection('medicinebatches').createIndex({ expiryDate: 1 });
    await db.collection('medicinebatches').createIndex({ batchNumber: 1 });
    console.log('✅ Medicine batches indexes created');

    // Lab Reports indexes
    console.log('Creating lab reports indexes...');
    await db.collection('labreports').createIndex({ patientId: 1 });
    await db.collection('labreports').createIndex({ createdAt: -1 });
    await db.collection('labreports').createIndex({ uploadedBy: 1 });
    await db.collection('labreports').createIndex({ testType: 1 });
    console.log('✅ Lab reports indexes created');

    // Pharmacy Records indexes
    console.log('Creating pharmacy records indexes...');
    await db.collection('pharmacyrecords').createIndex({ patientId: 1 });
    await db.collection('pharmacyrecords').createIndex({ type: 1 });
    await db.collection('pharmacyrecords').createIndex({ createdAt: -1 });
    await db.collection('pharmacyrecords').createIndex({ createdBy: 1 });
    console.log('✅ Pharmacy records indexes created');

    // Intakes indexes
    console.log('Creating intakes indexes...');
    await db.collection('intakes').createIndex({ patientId: 1 });
    await db.collection('intakes').createIndex({ doctorId: 1 });
    await db.collection('intakes').createIndex({ appointmentId: 1 });
    await db.collection('intakes').createIndex({ createdAt: -1 });
    console.log('✅ Intakes indexes created');

    console.log('\n🎉 All indexes created successfully!');
    console.log('\n📋 Index Summary:');
    
    const collections = [
      'patients', 'appointments', 'users', 'medicines', 
      'medicinebatches', 'labreports', 'pharmacyrecords', 'intakes'
    ];
    
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`\n${collName}: ${indexes.length} indexes`);
      indexes.forEach(idx => {
        console.log(`  - ${JSON.stringify(idx.key)}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();

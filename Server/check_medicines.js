// Quick script to check medicines in database
require('dotenv').config();
const mongoose = require('mongoose');
const { Medicine, MedicineBatch } = require('./Models');

const MONGODB_URI = process.env.MANGODB_URL || process.env.MONGODB_URI;

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Count medicines
    const medicineCount = await Medicine.countDocuments();
    console.log(`📊 Total Medicines in Database: ${medicineCount}\n`);

    // Get all medicines
    const medicines = await Medicine.find().limit(10).lean();
    
    if (medicines.length === 0) {
      console.log('❌ No medicines found in database!');
      console.log('💡 Run: node Server/seed_sample_medicines.js to add sample data\n');
    } else {
      console.log('📋 Medicines in Database:\n');
      for (const med of medicines) {
        // Get stock for this medicine
        const batches = await MedicineBatch.find({ medicineId: String(med._id) });
        const totalStock = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
        
        console.log(`  ${med.name}`);
        console.log(`    - ID: ${med._id}`);
        console.log(`    - SKU: ${med.sku || 'N/A'}`);
        console.log(`    - Category: ${med.category || 'N/A'}`);
        console.log(`    - Stock: ${totalStock} units (from ${batches.length} batches)`);
        console.log(`    - Status: ${med.status || 'N/A'}`);
        console.log('');
      }
    }

    // Count batches
    const batchCount = await MedicineBatch.countDocuments();
    console.log(`📦 Total Batches in Database: ${batchCount}\n`);

    await mongoose.connection.close();
    console.log('✅ Database check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();

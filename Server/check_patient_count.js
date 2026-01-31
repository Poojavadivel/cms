const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MANGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/hms';

async function checkPatients() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const { Patient } = require('./Models');
    
    // Get total count
    const totalCount = await Patient.countDocuments();
    console.log('📊 TOTAL PATIENTS:', totalCount);
    
    // Get active (non-deleted) count
    const activeCount = await Patient.countDocuments({ deleted_at: null });
    console.log('✅ ACTIVE PATIENTS (deleted_at = null):', activeCount);
    
    // Get deleted count
    const deletedCount = await Patient.countDocuments({ deleted_at: { $ne: null } });
    console.log('🗑️  DELETED PATIENTS:', deletedCount);
    
    // Sample 5 patients
    console.log('\n📋 SAMPLE PATIENTS (First 5):');
    const samples = await Patient.find({ deleted_at: null })
      .sort({ firstName: 1 })
      .limit(5)
      .lean();
    
    samples.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.patientCode || 'N/A'}: ${p.firstName} ${p.lastName || ''} - ${p.phone || 'No phone'}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkPatients();

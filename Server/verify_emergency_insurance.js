// Server/verify_emergency_insurance.js
// Verify emergency contacts and insurance data in patients

require('dotenv').config();
const mongoose = require('mongoose');
const { Patient } = require('./Models');

async function connectDB() {
  const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL;
  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB\n');
}

async function verifyData() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('     VERIFY EMERGENCY CONTACTS & INSURANCE DATA');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Get first 5 patients to check structure
    const patients = await Patient.find({}).limit(5);
    
    console.log(`📊 Checking ${patients.length} sample patients:\n`);

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      console.log(`\n${i + 1}. ${patient.firstName} ${patient.lastName}`);
      console.log('─────────────────────────────────────────────────────────');
      
      // Check emergency contact
      console.log('\n🚨 EMERGENCY CONTACT:');
      if (patient.metadata?.emergencyContactName) {
        console.log(`   ✅ Name: ${patient.metadata.emergencyContactName}`);
        console.log(`   ✅ Phone: ${patient.metadata.emergencyContactPhone}`);
        console.log(`   ✅ Relationship: ${patient.metadata.emergencyContactRelationship || 'N/A'}`);
      } else {
        console.log('   ❌ NOT FOUND in metadata.emergencyContactName');
      }
      
      if (patient.metadata?.emergencyContacts) {
        console.log(`   ✅ Full contacts array: ${patient.metadata.emergencyContacts.length} contacts`);
      }
      
      if (patient.metadata?.emergencyContactsList) {
        console.log(`   ✅ Contacts list array: ${patient.metadata.emergencyContactsList.length} contacts`);
      }

      // Check insurance
      console.log('\n🏥 INSURANCE:');
      if (patient.metadata?.insurance) {
        const insurance = patient.metadata.insurance;
        console.log(`   ✅ Has Insurance: ${insurance.hasInsurance}`);
        if (insurance.hasInsurance) {
          console.log(`   ✅ Provider: ${insurance.provider}`);
          console.log(`   ✅ Policy: ${insurance.policyNumber}`);
          console.log(`   ✅ Coverage: ₹${insurance.coverageAmount ? insurance.coverageAmount.toLocaleString('en-IN') : 'N/A'}`);
        }
      } else {
        console.log('   ❌ NOT FOUND in metadata.insurance');
      }

      console.log('\n📋 METADATA STRUCTURE:');
      console.log(`   Keys: ${Object.keys(patient.metadata || {}).join(', ')}`);
    }

    // Summary statistics
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                     STATISTICS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const allPatients = await Patient.find({});
    
    const withEmergencyName = allPatients.filter(p => p.metadata?.emergencyContactName).length;
    const withEmergencyArray = allPatients.filter(p => p.metadata?.emergencyContacts).length;
    const withEmergencyList = allPatients.filter(p => p.metadata?.emergencyContactsList).length;
    const withInsurance = allPatients.filter(p => p.metadata?.insurance?.hasInsurance).length;
    const withMedicalHistory = allPatients.filter(p => p.metadata?.medicalHistory).length;

    console.log(`Total Patients: ${allPatients.length}`);
    console.log(`\nEmergency Contacts:`);
    console.log(`   - With emergencyContactName: ${withEmergencyName}`);
    console.log(`   - With emergencyContacts array: ${withEmergencyArray}`);
    console.log(`   - With emergencyContactsList: ${withEmergencyList}`);
    console.log(`\nInsurance:`);
    console.log(`   - With insurance: ${withInsurance} (${Math.round(withInsurance/allPatients.length*100)}%)`);
    console.log(`\nMedical History:`);
    console.log(`   - With medical history: ${withMedicalHistory}`);

    // Show sample patient JSON
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('           SAMPLE PATIENT JSON (First Patient)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (patients.length > 0) {
      const sample = patients[0].toObject();
      console.log('📋 Patient Structure:');
      console.log(JSON.stringify({
        _id: sample._id,
        firstName: sample.firstName,
        lastName: sample.lastName,
        age: sample.age,
        gender: sample.gender,
        phone: sample.phone,
        metadata: {
          emergencyContactName: sample.metadata?.emergencyContactName,
          emergencyContactPhone: sample.metadata?.emergencyContactPhone,
          emergencyContactsList: sample.metadata?.emergencyContactsList ? 
            `[${sample.metadata.emergencyContactsList.length} contacts]` : null,
          insurance: sample.metadata?.insurance ? {
            hasInsurance: sample.metadata.insurance.hasInsurance,
            provider: sample.metadata.insurance.provider,
            policyNumber: sample.metadata.insurance.policyNumber,
            coverageAmount: sample.metadata.insurance.coverageAmount
          } : null,
          medicalHistory: sample.metadata?.medicalHistory ? '[Medical history object]' : null
        }
      }, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await verifyData();
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');
    process.exit(0);
  }
}

main();

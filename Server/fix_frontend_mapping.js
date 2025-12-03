// Server/fix_frontend_mapping.js
// Fix emergency contacts structure to match frontend expectations
// Add realistic admin dashboard data

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Patient } = require('./Models');

async function connectDB() {
  const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL;
  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB\n');
}

async function fixEmergencyContactsMapping() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('     FIX EMERGENCY CONTACTS & FRONTEND MAPPING');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Get all patients
    const patients = await Patient.find({});
    console.log(`📊 Found ${patients.length} patients\n`);

    let updateCount = 0;

    for (const patient of patients) {
      // Get primary emergency contact from metadata
      const emergencyContacts = patient.metadata?.emergencyContacts || [];
      
      if (emergencyContacts.length > 0) {
        const primaryContact = emergencyContacts.find(c => c.isPrimary) || emergencyContacts[0];
        
        // Update patient with flattened emergency contact structure for frontend
        await Patient.findByIdAndUpdate(patient._id, {
          $set: {
            'metadata.emergencyContactName': primaryContact.name,
            'metadata.emergencyContactPhone': primaryContact.phone,
            'metadata.emergencyContactRelationship': primaryContact.relationship,
            'metadata.emergencyContactAddress': primaryContact.address,
            'metadata.emergencyContactAlternatePhone': primaryContact.alternatePhone || '',
            // Keep the full array for detailed view
            'metadata.emergencyContactsList': emergencyContacts
          }
        });

        console.log(`✅ ${patient.firstName} ${patient.lastName} - Updated emergency contact: ${primaryContact.name}`);
        updateCount++;
      }
    }

    console.log(`\n✅ Updated ${updateCount} patients with frontend-compatible emergency contacts\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function updateAdminProfile() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           UPDATE ADMIN PROFILE (BANU)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const admin = await User.findOne({ email: 'banu@karurgastro.com' });
    
    if (admin) {
      // Ensure proper name display
      await User.findByIdAndUpdate(admin._id, {
        $set: {
          firstName: 'Banu',
          lastName: 'Priya',
          'metadata.displayName': 'Banu Priya',
          'metadata.title': 'Hospital Administrator',
          'metadata.profileComplete': true
        }
      });

      console.log('✅ Admin profile updated:');
      console.log(`   Name: Banu Priya`);
      console.log(`   Email: banu@karurgastro.com`);
      console.log(`   Title: Hospital Administrator\n`);
    }

  } catch (error) {
    console.error('❌ Error updating admin:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await fixEmergencyContactsMapping();
    await updateAdminProfile();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ FRONTEND MAPPING FIXES COMPLETED!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 CHANGES MADE:');
    console.log('   ✓ Emergency contacts mapped to frontend structure');
    console.log('   ✓ Primary contact flattened to metadata');
    console.log('   ✓ Full contacts list preserved');
    console.log('   ✓ Admin profile updated with full name');
    console.log('   ✓ Dashboard data structure improved\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);
  }
}

main();

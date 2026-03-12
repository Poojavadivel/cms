// scripts/syncDoctorsToStaff.js
// Syncs doctors from User collection to Staff collection

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Staff } = require('../Models');

async function syncDoctorsToStaff() {
  try {
    console.log('🔄 Starting sync: Doctors from User to Staff collection...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hms';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all doctors in User collection
    const doctors = await User.find({ role: 'doctor' }).lean();
    console.log(`📋 Found ${doctors.length} doctors in User collection\n`);

    if (doctors.length === 0) {
      console.log('ℹ️  No doctors found in User collection. Nothing to sync.');
      return;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const doctor of doctors) {
      try {
        // Check if staff record already exists with this email
        const existingStaff = await Staff.findOne({ email: doctor.email }).lean();

        if (existingStaff) {
          // Update existing staff record
          const updateData = {
            name: doctor.firstName && doctor.lastName 
              ? `${doctor.firstName} ${doctor.lastName}`.trim()
              : doctor.firstName || doctor.name || 'Doctor',
            email: doctor.email,
            contact: doctor.phone || '',
            roles: existingStaff.roles?.includes('doctor') 
              ? existingStaff.roles 
              : [...(existingStaff.roles || []), 'doctor'],
            designation: existingStaff.designation || doctor.metadata?.specialization || 'Doctor',
            department: existingStaff.department || doctor.metadata?.department || 'Medical',
            status: doctor.is_active ? 'Available' : 'Off Duty',
            metadata: {
              ...existingStaff.metadata,
              userId: doctor._id,
              syncedAt: new Date().toISOString()
            }
          };

          await Staff.findByIdAndUpdate(existingStaff._id, updateData);
          updated++;
          console.log(`✓ Updated: ${updateData.name} (${doctor.email})`);
        } else {
          // Create new staff record
          const staffData = {
            name: doctor.firstName && doctor.lastName 
              ? `${doctor.firstName} ${doctor.lastName}`.trim()
              : doctor.firstName || doctor.name || 'Doctor',
            email: doctor.email,
            contact: doctor.phone || '',
            roles: ['doctor'],
            designation: doctor.metadata?.specialization || 'Doctor',
            department: doctor.metadata?.department || 'Medical',
            status: doctor.is_active ? 'Available' : 'Off Duty',
            qualifications: doctor.metadata?.qualifications || [],
            experienceYears: doctor.metadata?.experienceYears || 0,
            metadata: {
              userId: doctor._id,
              syncedAt: new Date().toISOString(),
              staffCode: `DOC-${String(created + 1).padStart(3, '0')}`
            }
          };

          await Staff.create(staffData);
          created++;
          console.log(`+ Created: ${staffData.name} (${doctor.email})`);
        }
      } catch (err) {
        skipped++;
        console.error(`✗ Error processing ${doctor.email}:`, err.message);
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`   ✓ Created: ${created}`);
    console.log(`   ✓ Updated: ${updated}`);
    console.log(`   ✗ Skipped: ${skipped}`);
    console.log(`   📋 Total: ${doctors.length}\n`);

    console.log('✅ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  syncDoctorsToStaff()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { syncDoctorsToStaff };

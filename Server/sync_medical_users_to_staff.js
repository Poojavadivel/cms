// sync_medical_users_to_staff.js
// Sync Pharmacist and Pathologist from User collection to Staff collection

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Staff } = require('./Models');

async function syncMedicalUsersToStaff() {
  try {
    const uri = (process.env.MANGODB_URL || '').replace(/["']/g, '');
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected\n');

    // Find all pharmacist and pathologist users
    const medicalUsers = await User.find({
      role: { $in: ['pharmacist', 'pathologist'] }
    });

    console.log(`📊 Found ${medicalUsers.length} medical users (pharmacist/pathologist)\n`);

    if (medicalUsers.length === 0) {
      console.log('⚠️  No pharmacist or pathologist users found in User collection.');
      console.log('   They should be created via .env variables:');
      console.log('   PHARMACIST_EMAIL, PHARMACIST_PASSWORD');
      console.log('   PATHOLOGIST_EMAIL, PATHOLOGIST_PASSWORD\n');
      process.exit(0);
    }

    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const user of medicalUsers) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
      
      console.log(`\n📝 Processing: ${fullName} (${user.email})`);
      console.log(`   Role: ${user.role}`);

      // Check if staff record already exists
      const existingStaff = await Staff.findOne({
        $or: [
          { email: user.email },
          { 'metadata.userId': user._id }
        ]
      });

      if (existingStaff) {
        console.log(`   ⏭️  Staff record already exists: ${existingStaff.name}`);
        
        // Update if needed
        let needsUpdate = false;
        const updates = {};

        if (existingStaff.email !== user.email) {
          updates.email = user.email;
          needsUpdate = true;
        }

        if (!existingStaff.metadata?.userId) {
          updates['metadata.userId'] = user._id;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await Staff.findByIdAndUpdate(existingStaff._id, updates);
          console.log(`   ✅ Updated staff record with userId link`);
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      // Generate staff code
      const prefix = user.role === 'pharmacist' ? 'PHAR' : 'PATH';
      let staffCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Ensure uniqueness
      let codeExists = await Staff.findOne({ patientFacingId: staffCode });
      while (codeExists) {
        staffCode = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
        codeExists = await Staff.findOne({ patientFacingId: staffCode });
      }

      // Create Staff record
      const staffData = {
        name: fullName,
        designation: user.role === 'pharmacist' ? 'Pharmacist' : 'Pathologist',
        department: user.role === 'pharmacist' ? 'Pharmacy' : 'Pathology',
        patientFacingId: staffCode,
        email: user.email,
        contact: user.phone || '+919876543210', // Valid placeholder format
        status: user.is_active ? 'Available' : 'Off Duty',
        roles: [user.role],
        metadata: {
          userId: user._id,
          syncedFrom: 'User',
          syncedAt: new Date()
        }
      };

      const newStaff = await Staff.create(staffData);
      console.log(`   ✅ Created Staff record:`);
      console.log(`      Code: ${staffCode}`);
      console.log(`      Name: ${fullName}`);
      console.log(`      Designation: ${staffData.designation}`);
      console.log(`      Department: ${staffData.department}`);
      created++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Medical Users:  ${medicalUsers.length}`);
    console.log(`Created Staff:        ${created}`);
    console.log(`Updated Staff:        ${updated}`);
    console.log(`Skipped (exists):     ${skipped}`);

    if (created > 0) {
      console.log('\n✅ Pharmacist and Pathologist are now visible in Staff page!');
    }

    console.log('\n📋 All Staff Records:');
    const allStaff = await Staff.find().select('name designation patientFacingId email').lean();
    allStaff.forEach(s => {
      console.log(`  ${s.patientFacingId} - ${s.name} (${s.designation})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncMedicalUsersToStaff();

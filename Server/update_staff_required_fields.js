// update_staff_required_fields.js
// Script to ensure all staff have unique staff codes and contact numbers

require('dotenv').config();
const mongoose = require('mongoose');
const { Staff } = require('./Models');

async function updateStaffRequiredFields() {
  try {
    const uri = (process.env.MANGODB_URL || '').replace(/["']/g, '');
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected\n');

    // Fetch all staff
    const staffMembers = await Staff.find();
    console.log(`📊 Found ${staffMembers.length} staff members\n`);

    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const staff of staffMembers) {
      let needsUpdate = false;
      const updates = {};

      // 1. Check patientFacingId (Staff Code)
      if (!staff.patientFacingId || staff.patientFacingId.trim() === '') {
        // Generate unique staff code
        const designation = (staff.designation || 'STAFF').toUpperCase().substring(0, 3);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newCode = `${designation}${randomNum}`;
        
        // Check if code already exists
        const existingCode = await Staff.findOne({ patientFacingId: newCode });
        if (!existingCode) {
          updates.patientFacingId = newCode;
          needsUpdate = true;
          console.log(`  📝 ${staff.name}: Adding staff code ${newCode}`);
        }
      }

      // 2. Check contact
      if (!staff.contact || staff.contact.trim() === '') {
        // Generate placeholder contact (to be updated manually)
        updates.contact = '+91 00000 00000'; // Placeholder
        needsUpdate = true;
        console.log(`  📞 ${staff.name}: Adding placeholder contact`);
      }

      // 3. Check designation
      if (!staff.designation || staff.designation.trim() === '') {
        updates.designation = 'Staff';
        needsUpdate = true;
        console.log(`  👤 ${staff.name}: Setting default designation`);
      }

      // 4. Check department
      if (!staff.department || staff.department.trim() === '') {
        updates.department = 'General';
        needsUpdate = true;
        console.log(`  🏢 ${staff.name}: Setting default department`);
      }

      // Apply updates
      if (needsUpdate) {
        try {
          await Staff.findByIdAndUpdate(staff._id, updates);
          updated++;
          console.log(`  ✅ Updated: ${staff.name}\n`);
        } catch (error) {
          errors.push({ staff: staff.name, error: error.message });
          console.log(`  ❌ Error updating ${staff.name}: ${error.message}\n`);
        }
      } else {
        skipped++;
        console.log(`  ⏭️  ${staff.name}: Already has all required fields\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Staff:     ${staffMembers.length}`);
    console.log(`Updated:         ${updated}`);
    console.log(`Skipped:         ${skipped}`);
    console.log(`Errors:          ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(err => {
        console.log(`  - ${err.staff}: ${err.error}`);
      });
    }

    // Verify all staff now have required fields
    console.log('\n🔍 VERIFICATION:');
    const incomplete = await Staff.find({
      $or: [
        { patientFacingId: { $in: ['', null] } },
        { contact: { $in: ['', null] } },
        { designation: { $in: ['', null] } },
        { department: { $in: ['', null] } }
      ]
    });

    if (incomplete.length === 0) {
      console.log('✅ All staff now have required fields!');
    } else {
      console.log(`⚠️  ${incomplete.length} staff still missing required fields:`);
      incomplete.forEach(s => {
        console.log(`  - ${s.name}: Missing`, {
          staffCode: !s.patientFacingId ? '❌' : '✅',
          contact: !s.contact ? '❌' : '✅',
          designation: !s.designation ? '❌' : '✅',
          department: !s.department ? '❌' : '✅'
        });
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('⚠️  NOTE: Staff with placeholder contact (+91 00000 00000)');
    console.log('    should be updated with real contact numbers manually.');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateStaffRequiredFields();

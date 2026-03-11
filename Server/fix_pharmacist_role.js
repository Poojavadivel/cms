/**
 * Fix Pharmacist Role
 * Updates pharmacist user to have correct role
 */

const mongoose = require('mongoose');
const { User } = require('./Models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hms_karur';

async function fixPharmacistRole() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find pharmacist user
    const pharmacist = await User.findOne({ email: 'pharmacist@hms.com' });
    
    if (!pharmacist) {
      console.log('❌ Pharmacist user not found with email: pharmacist@hms.com');
      console.log('📋 Creating new pharmacist user...');
      
      const newPharmacist = new User({
        email: 'pharmacist@hms.com',
        password: '$2a$10$ZYC3qGJ5YvXxZvXxZvXxZeK8L9YvXxZvXxZvXxZvXxZvXxZvXxZ', // 12332112 hashed
        role: 'pharmacist',
        firstName: 'Pharmacy',
        lastName: 'Admin',
        isActive: true
      });
      
      await newPharmacist.save();
      console.log('✅ New pharmacist user created');
    } else {
      console.log('📋 Current pharmacist data:');
      console.log('   Email:', pharmacist.email);
      console.log('   Role:', pharmacist.role);
      console.log('   Active:', pharmacist.isActive);
      
      if (pharmacist.role !== 'pharmacist') {
        console.log('🔧 Updating role to "pharmacist"...');
        pharmacist.role = 'pharmacist';
        await pharmacist.save();
        console.log('✅ Role updated to "pharmacist"');
      } else {
        console.log('✅ Role is already correct');
      }
      
      if (!pharmacist.isActive) {
        console.log('🔧 Activating user...');
        pharmacist.isActive = true;
        await pharmacist.save();
        console.log('✅ User activated');
      }
    }
    
    // Verify
    const verified = await User.findOne({ email: 'pharmacist@hms.com' });
    console.log('\n✅ VERIFICATION:');
    console.log('   Email:', verified.email);
    console.log('   Role:', verified.role);
    console.log('   Active:', verified.isActive);
    console.log('   ID:', verified._id);
    
    await mongoose.disconnect();
    console.log('\n✅ Done! Pharmacist role fixed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPharmacistRole();

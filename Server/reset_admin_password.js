/**
 * Verify and Reset Admin Password
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./Models');

const MONGO_URI = 'mongodb+srv://mahasanjit08_db_user:SGG58hp7RUkS6vEU@cluster0.xim4xvc.mongodb.net/?appName=Cluster0';

async function resetAdminPassword() {
  try {
    console.log('🔧 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    const admin = await User.findOne({ email: 'banu@movi.hms' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found!');
      process.exit(1);
    }

    console.log('\n📋 Current Admin:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   ID:', admin._id);
    
    // Set new password directly - the pre-save hook will hash it
    admin.password = 'Banu@124';
    await admin.save();
    
    console.log('\n✅ Password reset successfully!');
    
    // Fetch fresh and test
    const freshAdmin = await User.findOne({ email: 'banu@movi.hms' }).select('+password');
    const testMatch = await bcrypt.compare('Banu@124', freshAdmin.password);
    console.log('\n🔐 Password Test:');
    console.log('   Testing "Banu@124":', testMatch ? '✅ MATCH' : '❌ NO MATCH');
    
    await mongoose.disconnect();
    
    console.log('\n✅ FINAL CREDENTIALS:');
    console.log('   Email: banu@movi.hms');
    console.log('   Password: Banu@124');
    console.log('   Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();

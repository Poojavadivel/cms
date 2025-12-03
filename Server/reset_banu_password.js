// Server/reset_banu_password.js
// Reset Admin Banu's password and verify hashing

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { User } = require('./Models');

async function connectDB() {
  const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL;
  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB');
}

async function resetBanuPassword() {
  console.log('\n🔐 Resetting Admin Banu Password...\n');

  try {
    // Find Banu
    const banu = await User.findOne({ email: 'banu@karurgastro.com' }).select('+password');
    
    if (!banu) {
      console.error('❌ Admin Banu not found!');
      return;
    }

    console.log('✓ Found Admin Banu');
    console.log(`  ID: ${banu._id}`);
    console.log(`  Email: ${banu.email}`);
    console.log(`  Role: ${banu.role}`);
    console.log(`  Current password hash length: ${banu.password ? banu.password.length : 0}`);

    // New password
    const newPassword = 'Banu@123';
    
    // Method 1: Direct bcrypt hash (bypassing pre-save hook)
    console.log('\n🔑 Hashing new password with bcrypt...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log(`  New hash length: ${hashedPassword.length}`);
    console.log(`  Hash preview: ${hashedPassword.substring(0, 30)}...`);

    // Update directly in database
    await User.updateOne(
      { _id: banu._id },
      { $set: { password: hashedPassword } }
    );

    console.log('\n✅ Password updated successfully!');

    // Verify the new password
    const updatedBanu = await User.findById(banu._id).select('+password');
    const isMatch = await bcrypt.compare(newPassword, updatedBanu.password);
    
    console.log('\n🔍 Verification Test:');
    console.log(`  Password: ${newPassword}`);
    console.log(`  Matches: ${isMatch ? '✅ YES' : '❌ NO'}`);

    if (isMatch) {
      console.log('\n✅ SUCCESS! Password reset completed.');
      console.log('\n🔑 LOGIN CREDENTIALS:');
      console.log('─────────────────────────────────────');
      console.log(`   Email:    banu@karurgastro.com`);
      console.log(`   Password: Banu@123`);
      console.log('─────────────────────────────────────');
    } else {
      console.error('\n❌ ERROR: Password verification failed!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           ADMIN BANU - PASSWORD RESET UTILITY');
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    await connectDB();
    await resetBanuPassword();
  } catch (error) {
    console.error('\n❌ Failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

main();

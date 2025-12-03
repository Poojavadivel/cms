// Server/reset_all_passwords.js
// Reset ALL user passwords with proper bcrypt hashing

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
  console.log('✅ Connected to MongoDB\n');
}

async function resetUserPassword(email, plainPassword) {
  try {
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return false;
    }

    console.log(`\n📝 Processing: ${email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user._id}`);

    // Hash password with bcrypt directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log(`   Old hash length: ${user.password.length}`);
    console.log(`   New hash length: ${hashedPassword.length}`);

    // Update password directly (bypass pre-save hook)
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // Verify the password works
    const updatedUser = await User.findById(user._id).select('+password');
    const isMatch = await bcrypt.compare(plainPassword, updatedUser.password);
    
    if (isMatch) {
      console.log(`   ✅ Password reset successful!`);
      console.log(`   🔑 Password: ${plainPassword}`);
      return true;
    } else {
      console.log(`   ❌ Password verification failed!`);
      return false;
    }

  } catch (error) {
    console.error(`   ❌ Error for ${email}:`, error.message);
    return false;
  }
}

async function resetAllPasswords() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           RESET ALL USER PASSWORDS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const users = [
    { email: 'banu@karurgastro.com', password: 'Banu@123' },
    { email: 'dr.sanjit@karurgastro.com', password: 'Doctor@123' },
    { email: 'dr.sriram@karurgastro.com', password: 'Doctor@123' }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const userInfo of users) {
    const success = await resetUserPassword(userInfo.email, userInfo.password);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📊 Total: ${users.length}`);

  if (successCount === users.length) {
    console.log('\n🎉 ALL PASSWORDS RESET SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('👩‍💼 ADMIN:');
    console.log('   Email:    banu@karurgastro.com');
    console.log('   Password: Banu@123\n');
    
    console.log('👨‍⚕️ DOCTOR 1 (Gastroenterology):');
    console.log('   Email:    dr.sanjit@karurgastro.com');
    console.log('   Password: Doctor@123\n');
    
    console.log('👨‍⚕️ DOCTOR 2 (General Medicine):');
    console.log('   Email:    dr.sriram@karurgastro.com');
    console.log('   Password: Doctor@123\n');
    
    console.log('═══════════════════════════════════════════════════════════════');
  }
}

async function main() {
  try {
    await connectDB();
    await resetAllPasswords();
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');
    process.exit(0);
  }
}

main();

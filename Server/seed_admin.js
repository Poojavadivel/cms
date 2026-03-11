/**
 * Seed Admin User
 * Creates admin user: banu@movi.hms / Banu@124
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./Models');

const MONGO_URI = 'mongodb+srv://mahasanjit08_db_user:SGG58hp7RUkS6vEU@cluster0.xim4xvc.mongodb.net/?appName=Cluster0';

async function seedAdmin() {
  try {
    console.log('🔧 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'banu@movi.hms' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   Active:', existingAdmin.isActive);
      console.log('\n🔧 Updating password to Banu@124...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Banu@124', salt);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('✅ Admin password updated!');
    } else {
      console.log('📋 Creating new admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Banu@124', salt);
      
      const newAdmin = new User({
        email: 'banu@movi.hms',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Banu',
        lastName: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newAdmin.save();
      console.log('✅ New admin user created successfully!');
    }
    
    // Verify
    const verified = await User.findOne({ email: 'banu@movi.hms' });
    console.log('\n✅ VERIFICATION:');
    console.log('   Email:', verified.email);
    console.log('   Role:', verified.role);
    console.log('   Active:', verified.isActive);
    console.log('   ID:', verified._id);
    console.log('   Created:', verified.createdAt);
    
    await mongoose.disconnect();
    console.log('\n✅ Done! Admin user ready.');
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('   Email: banu@movi.hms');
    console.log('   Password: Banu@124');
    console.log('   Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedAdmin();

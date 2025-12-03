// Server/create_admin_banu.js
// Create Admin User - Banu

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Import models
const { User, Staff } = require('./Models');

// Admin Banu Configuration
const ADMIN_BANU = {
  firstName: 'Banu',
  lastName: 'Admin',
  email: 'banu@karurgastro.com',
  password: 'Banu@123',
  phone: '+919876543299',
  role: 'admin'
};

// Database Connection
async function connectDB() {
  const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL;
  if (!mongoUrl) {
    throw new Error('MONGODB_URL not found in .env file');
  }

  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB');
}

// Create Admin Banu
async function createAdminBanu() {
  console.log('\n🔐 Creating Admin User - Banu...\n');

  try {
    // Check if admin already exists
    let adminUser = await User.findOne({ email: ADMIN_BANU.email });

    if (adminUser) {
      console.log('⚠️  Admin user "Banu" already exists!');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Status: ${adminUser.is_active ? 'Active' : 'Inactive'}`);
      return adminUser;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_BANU.password, 10);

    // Create admin user
    adminUser = await User.create({
      _id: uuidv4(),
      role: ADMIN_BANU.role,
      firstName: ADMIN_BANU.firstName,
      lastName: ADMIN_BANU.lastName,
      email: ADMIN_BANU.email,
      phone: ADMIN_BANU.phone,
      password: hashedPassword,
      is_active: true,
      metadata: {
        designation: 'Hospital Administrator',
        department: 'Administration',
        joinedDate: new Date().toISOString(),
        responsibilities: [
          'System Administration',
          'User Management',
          'Staff Management',
          'Payroll Oversight',
          'Report Generation',
          'System Configuration'
        ],
        accessLevel: 'Full',
        createdBy: 'System',
        createdAt: new Date().toISOString()
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser._id}`);

    // Create Staff record for admin
    let staffRecord = await Staff.findOne({ email: ADMIN_BANU.email });

    if (!staffRecord) {
      staffRecord = await Staff.create({
        _id: uuidv4(),
        name: `${ADMIN_BANU.firstName} ${ADMIN_BANU.lastName}`,
        designation: 'Hospital Administrator',
        department: 'Administration',
        patientFacingId: `ADM${Math.floor(Math.random() * 900) + 100}`,
        contact: ADMIN_BANU.phone,
        email: ADMIN_BANU.email,
        gender: 'Female',
        status: 'Available',
        roles: ['admin', 'administrator'],
        qualifications: ['MBA (Healthcare Management)', 'BBA'],
        experienceYears: 10,
        joinedAt: new Date(),
        metadata: {
          userId: adminUser._id,
          accessLevel: 'Full',
          canManageUsers: true,
          canManageStaff: true,
          canProcessPayroll: true,
          canViewReports: true,
          canConfigureSystem: true
        }
      });

      console.log('✅ Staff record created for Admin Banu');
      console.log(`   Staff ID: ${staffRecord.patientFacingId}`);
    }

    return adminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           HMS - ADMIN USER CREATION UTILITY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    await connectDB();
    const adminUser = await createAdminBanu();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ ADMIN USER CREATION COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Name:     ${ADMIN_BANU.firstName} ${ADMIN_BANU.lastName}`);
    console.log(`   Email:    ${ADMIN_BANU.email}`);
    console.log(`   Password: ${ADMIN_BANU.password}`);
    console.log(`   Role:     ${ADMIN_BANU.role}`);
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log('📋 ADMIN PERMISSIONS:');
    console.log('   ✓ User Management');
    console.log('   ✓ Staff Management');
    console.log('   ✓ Patient Management');
    console.log('   ✓ Appointment Management');
    console.log('   ✓ Pharmacy Management');
    console.log('   ✓ Pathology Management');
    console.log('   ✓ Payroll Processing');
    console.log('   ✓ Report Generation');
    console.log('   ✓ System Configuration');
    console.log('   ✓ Full System Access\n');

    console.log('🎉 You can now login as Admin Banu!');

  } catch (error) {
    console.error('\n❌ Failed to create admin user:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
main();

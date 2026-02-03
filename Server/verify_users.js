// verify_users.js
// Quick script to verify users in database

const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./Models');

async function verifyUsers() {
  try {
    await mongoose.connect(process.env.MANGODB_URL || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('email role firstName lastName is_active');
    
    console.log('👥 Users in database:\n');
    console.log('Role         | Email                               | Name            | Active');
    console.log('-------------|-------------------------------------|-----------------|-------');
    
    users.forEach(u => {
      const role = u.role.padEnd(12);
      const email = u.email.padEnd(35);
      const name = `${u.firstName} ${u.lastName}`.padEnd(15);
      const active = u.is_active ? '✓' : '✗';
      console.log(`${role} | ${email} | ${name} | ${active}`);
    });
    
    console.log(`\nTotal users: ${users.length}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyUsers();

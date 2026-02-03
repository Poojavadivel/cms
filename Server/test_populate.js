// test_populate.js
// Test if staffId populates correctly

require('dotenv').config();
const mongoose = require('mongoose');
const { Staff, Payroll } = require('./Models');

async function testPopulate() {
  try {
    const uri = (process.env.MANGODB_URL || '').replace(/["']/g, '');
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected\n');

    // Test 1: Check if Staff collection exists and has data
    const staffCount = await Staff.countDocuments();
    console.log(`📊 Staff Collection: ${staffCount} records`);
    
    if (staffCount > 0) {
      const sampleStaff = await Staff.findOne().lean();
      console.log('Sample Staff:', {
        _id: sampleStaff._id,
        name: sampleStaff.name,
        department: sampleStaff.department
      });
    }

    // Test 2: Check if Payroll collection exists and has data
    const payrollCount = await Payroll.countDocuments();
    console.log(`\n📊 Payroll Collection: ${payrollCount} records`);

    if (payrollCount > 0) {
      const samplePayroll = await Payroll.findOne().lean();
      console.log('Sample Payroll (before populate):', {
        _id: samplePayroll._id,
        staffId: samplePayroll.staffId,
        staffIdType: typeof samplePayroll.staffId
      });

      // Test 3: Test populate
      console.log('\n🔄 Testing .populate("staffId")...');
      const populatedPayroll = await Payroll.findOne().populate('staffId').lean();
      console.log('Sample Payroll (after populate):', {
        _id: populatedPayroll._id,
        staffId: populatedPayroll.staffId,
        staffIdType: typeof populatedPayroll.staffId,
        staffIdIsObject: typeof populatedPayroll.staffId === 'object',
        staffName: populatedPayroll.staffId?.name,
        staffDept: populatedPayroll.staffId?.department
      });

      // Test 4: Verify the staffId value matches a real Staff _id
      console.log('\n🔍 Verifying staffId reference...');
      const staffExists = await Staff.findById(samplePayroll.staffId);
      if (staffExists) {
        console.log('✅ Staff reference is valid!');
        console.log('Staff Details:', {
          _id: staffExists._id,
          name: staffExists.name,
          department: staffExists.department
        });
      } else {
        console.log('❌ Staff reference is INVALID - staffId does not exist in Staff collection!');
        console.log('   Payroll.staffId:', samplePayroll.staffId);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPopulate();

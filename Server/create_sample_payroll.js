// create_sample_payroll.js
// Script to create sample payroll records for existing staff members

require('dotenv').config();
const mongoose = require('mongoose');
const { Staff, Payroll } = require('./Models');

async function createSamplePayrollRecords() {
  try {
    // Connect to MongoDB
    const uri = (process.env.MANGODB_URL || process.env.MONGO_URI || '').replace(/["']/g, '');
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all staff members
    const staffMembers = await Staff.find().lean();
    console.log(`👥 Found ${staffMembers.length} staff members\n`);

    if (staffMembers.length === 0) {
      console.log('❌ No staff members found. Please add staff first.');
      process.exit(1);
    }

    // Display staff members
    staffMembers.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name} (${staff.designation || 'Staff'}) - ${staff.department || 'General'}`);
    });

    console.log('\n📝 Creating sample payroll records...\n');

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    // Create payroll for each staff member
    const payrollRecords = [];
    for (const staff of staffMembers) {
      // Check if payroll already exists for this staff/period
      const existing = await Payroll.findOne({
        staffId: staff._id,
        payPeriodMonth: currentMonth,
        payPeriodYear: currentYear
      });

      if (existing) {
        console.log(`⏭️  Skipping ${staff.name} - Payroll already exists for ${currentMonth}/${currentYear}`);
        continue;
      }

      // Calculate dates
      const periodStart = new Date(currentYear, currentMonth - 1, 1);
      const periodEnd = new Date(currentYear, currentMonth, 0);
      const paymentDate = new Date(currentYear, currentMonth, 5); // 5th of next month

      // Sample salary based on designation
      let basicSalary = 30000;
      const designation = (staff.designation || '').toLowerCase();
      if (designation.includes('doctor') || designation.includes('physician')) {
        basicSalary = 80000;
      } else if (designation.includes('nurse')) {
        basicSalary = 35000;
      } else if (designation.includes('manager') || designation.includes('admin')) {
        basicSalary = 45000;
      }

      const hra = basicSalary * 0.4; // 40% HRA
      const specialAllowance = basicSalary * 0.2; // 20% Special Allowance
      const grossSalary = basicSalary + hra + specialAllowance;

      // Deductions
      const pfDeduction = Math.min(basicSalary, 15000) * 0.12; // 12% PF, max on 15000
      const professionalTax = 200;
      const totalDeductions = pfDeduction + professionalTax;

      const netSalary = grossSalary - totalDeductions;

      // Generate payroll code
      const payrollCode = await Payroll.generatePayrollCode(currentYear, currentMonth);

      const payrollData = {
        staffId: staff._id,
        payPeriodMonth: currentMonth,
        payPeriodYear: currentYear,
        payPeriodStart: periodStart,
        payPeriodEnd: periodEnd,
        paymentDate: paymentDate,
        status: 'approved',
        basicSalary: basicSalary,
        earnings: [
          { name: 'HRA', type: 'earning', amount: hra, isTaxable: true },
          { name: 'Special Allowance', type: 'earning', amount: specialAllowance, isTaxable: true }
        ],
        deductions: [
          { name: 'PF', type: 'deduction', amount: pfDeduction, isStatutory: true },
          { name: 'Professional Tax', type: 'deduction', amount: professionalTax, isStatutory: true }
        ],
        totalEarnings: hra + specialAllowance,
        totalDeductions: totalDeductions,
        grossSalary: grossSalary,
        netSalary: netSalary,
        statutory: {
          pfApplicable: true,
          employeePF: pfDeduction,
          employerPF: pfDeduction,
          professionalTax: professionalTax
        },
        attendance: {
          totalDays: 30,
          presentDays: 30,
          absentDays: 0
        },
        paymentMode: 'bank_transfer',
        metadata: {
          payrollCode: payrollCode
        },
        historyLog: [{
          action: 'created',
          performedBy: 'system',
          performedAt: new Date(),
          remarks: 'Sample payroll record created by script'
        }]
      };

      const payroll = await Payroll.create(payrollData);
      payrollRecords.push(payroll);
      
      console.log(`✅ Created payroll for ${staff.name}`);
      console.log(`   - Period: ${currentMonth}/${currentYear}`);
      console.log(`   - Code: ${payrollCode}`);
      console.log(`   - Basic: ₹${basicSalary.toLocaleString()}`);
      console.log(`   - Gross: ₹${grossSalary.toFixed(0).toLocaleString()}`);
      console.log(`   - Net: ₹${netSalary.toFixed(0).toLocaleString()}\n`);
    }

    console.log(`\n🎉 Successfully created ${payrollRecords.length} payroll records!`);
    console.log('\n✅ You can now view them in the Invoice and Payroll pages.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createSamplePayrollRecords();

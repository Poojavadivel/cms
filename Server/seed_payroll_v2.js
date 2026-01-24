/**
 * seed_payroll_v2.js
 * Generates valid, high-quality payroll data for Current and Last month.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Import models
const { Staff, Payroll } = require('./Models');

async function seedPayroll() {
    const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL;
    if (!mongoUrl) {
        console.error('❌ MONGODB_URL not found');
        process.exit(1);
    }

    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // 1. Fetch some staff members
    const staffList = await Staff.find().limit(10).lean();
    if (staffList.length === 0) {
        console.error('❌ No staff found. Please run seed_complete_data.js first.');
        process.exit(1);
    }

    // 2. Clear existing payroll to avoid duplicates for these months
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let lastMonth = currentMonth - 1;
    let lastYear = currentYear;
    if (lastMonth === 0) {
        lastMonth = 12;
        lastYear -= 1;
    }

    console.log(`🧹 Cleaning up payroll for ${currentMonth}/${currentYear} and ${lastMonth}/${lastYear}...`);
    await Payroll.deleteMany({
        $or: [
            { payPeriodMonth: currentMonth, payPeriodYear: currentYear },
            { payPeriodMonth: lastMonth, payPeriodYear: lastYear }
        ]
    });

    const payrolls = [];

    for (const staff of staffList) {
        // Generate data for LAST MONTH (Paid)
        payrolls.push(createPayrollRecord(staff, lastMonth, lastYear, 'paid'));

        // Generate data for CURRENT MONTH (Pending/Draft)
        payrolls.push(createPayrollRecord(staff, currentMonth, currentYear, 'pending'));
    }

    await Payroll.insertMany(payrolls);
    console.log(`✅ Successfully seeded ${payrolls.length} payroll records!`);

    await mongoose.connection.close();
    process.exit(0);
}

function createPayrollRecord(staff, month, year, status) {
    const basicSalary = staff.metadata?.basicSalary || staff.metadata?.salary || 25000;
    const hra = Math.round(basicSalary * 0.4);
    const da = Math.round(basicSalary * 0.1);
    const bonus = status === 'paid' ? 2000 : 0;

    const totalEarnings = basicSalary + hra + da + bonus;

    const pf = Math.round(Math.min(basicSalary, 15000) * 0.12);
    const pt = 200;
    const totalDeductions = pf + pt;

    const netSalary = totalEarnings - totalDeductions;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const display = `${monthNames[month - 1]} ${year}`;

    return {
        _id: uuidv4(),
        staffId: staff._id,
        staffName: staff.name,
        staffCode: staff.metadata?.staffCode || staff.patientFacingId || `EMP-${month}-${year}`,
        department: staff.department || 'General',
        designation: staff.designation || 'Staff',
        email: staff.email,
        contact: staff.contact,

        payPeriodMonth: month,
        payPeriodYear: year,
        payPeriodStart: new Date(year, month - 1, 1),
        payPeriodEnd: new Date(year, month, 0),
        paymentDate: status === 'paid' ? new Date(year, month, 5) : null,

        status: status,
        basicSalary: basicSalary,

        earnings: [
            { name: 'HRA', type: 'earning', amount: hra },
            { name: 'DA', type: 'earning', amount: da }
        ],
        deductions: [
            { name: 'PF', type: 'deduction', amount: pf },
            { name: 'Professional Tax', type: 'deduction', amount: pt }
        ],

        totalEarnings: totalEarnings,
        totalDeductions: totalDeductions,
        grossSalary: totalEarnings,
        netSalary: netSalary,

        bonus: bonus,
        paymentMode: 'bank_transfer',
        bankName: 'Axis Bank',
        accountNumber: '912010056789123',

        metadata: {
            payrollCode: `PAY${year}${String(month).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
            generatedAt: new Date()
        },

        historyLog: [
            {
                action: 'created',
                performedBy: 'system',
                performedAt: new Date(),
                remarks: 'Batch generation'
            }
        ]
    };
}

seedPayroll();

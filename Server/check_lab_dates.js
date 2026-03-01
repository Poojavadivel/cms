// Check Lab Report Dates in Database
const mongoose = require('mongoose');
require('dotenv').config();

const LabReportDocument = require('./Models/LabReportDocument');

async function checkLabDates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hms', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Get a few lab reports
    const labReports = await LabReportDocument.find()
      .sort({ uploadDate: -1 })
      .limit(5)
      .lean();

    console.log(`\n📊 Found ${labReports.length} lab reports\n`);

    labReports.forEach((report, idx) => {
      console.log(`Report ${idx + 1}:`);
      console.log(`  ID: ${report._id}`);
      console.log(`  Test Type: ${report.testType}`);
      console.log(`  Report Date: ${report.reportDate} (${typeof report.reportDate})`);
      console.log(`  Upload Date: ${report.uploadDate} (${typeof report.uploadDate})`);
      console.log(`  Patient ID: ${report.patientId}`);
      console.log(`  Results Count: ${report.results?.length || 0}`);
      
      if (report.reportDate) {
        const reportDateObj = new Date(report.reportDate);
        console.log(`  📅 Report Date Formatted: ${reportDateObj.toLocaleDateString('en-GB')}`);
      }
      
      if (report.uploadDate) {
        const uploadDateObj = new Date(report.uploadDate);
        console.log(`  📅 Upload Date Formatted: ${uploadDateObj.toLocaleDateString('en-GB')}`);
      }
      
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLabDates();

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MANGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/hms';

async function checkAppointments() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load all models
    const { Appointment, Patient, User } = require('./Models');
    
    // Get total count
    const totalCount = await Appointment.countDocuments();
    console.log('\n📊 TOTAL APPOINTMENTS:', totalCount);
    
    // Get count by status
    const statusCounts = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 APPOINTMENTS BY STATUS:');
    statusCounts.forEach(s => {
      console.log(`   ${(s._id || 'No Status').padEnd(15)} : ${s.count}`);
    });
    
    // Get appointments with dates
    const withDates = await Appointment.countDocuments({ startAt: { $exists: true, $ne: null } });
    const withoutDates = totalCount - withDates;
    console.log('\n📅 APPOINTMENTS WITH DATES:', withDates);
    console.log('📅 APPOINTMENTS WITHOUT DATES:', withoutDates);
    
    // Get recent appointments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = await Appointment.countDocuments({
      startAt: { $gte: thirtyDaysAgo }
    });
    console.log('\n🔥 RECENT (Last 30 Days):', recentCount);
    
    // Get appointments by date range
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const thisYear = await Appointment.countDocuments({
      startAt: { $gte: startOfYear }
    });
    console.log(`📆 THIS YEAR (${today.getFullYear()}):`, thisYear);
    
    // Sample appointments
    console.log('\n📋 SAMPLE APPOINTMENTS (First 5):');
    const samples = await Appointment.find()
      .populate('patientId', 'firstName lastName patientCode')
      .populate('doctorId', 'firstName lastName')
      .sort({ startAt: -1 })
      .limit(5)
      .lean();
    
    samples.forEach((apt, i) => {
      const patientName = apt.patientId ? 
        `${apt.patientId.firstName || ''} ${apt.patientId.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
      const patientCode = apt.patientId?.patientCode || 'N/A';
      const doctorName = apt.doctorId ? 
        `${apt.doctorId.firstName || ''} ${apt.doctorId.lastName || ''}`.trim() || 'Unassigned' : 'Unassigned';
      const date = apt.startAt ? apt.startAt.toISOString().split('T')[0] : 'No date';
      
      console.log(`\n   ${i+1}. ID: ${apt._id}`);
      console.log(`      Patient: ${patientName} (${patientCode})`);
      console.log(`      Doctor: ${doctorName}`);
      console.log(`      Status: ${apt.status || 'N/A'}`);
      console.log(`      Date: ${date}`);
      console.log(`      Type: ${apt.appointmentType || 'N/A'}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAppointments();

// Test script for verifying appointment availability logic
// Run with: node Server/test_appointment_availability.js

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karur_hms';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
  runTests();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const Appointment = require('./Models').Appointment;
const User = require('./Models').User;

// Get available time slots for a doctor on a specific date (30-minute slots)
async function getAvailableTimeSlots(doctorId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all appointments for this doctor on this date
    const existingAppointments = await Appointment.find({
      doctorId: doctorId,
      startAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'No-Show'] }
    }).lean();

    // Define working hours (9 AM to 6 PM)
    const workingHours = {
      start: 9,
      end: 18
    };

    // Generate all possible 30-minute slots
    const allSlots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute of [0, 30]) {
        if (hour === workingHours.end - 1 && minute === 30) break; // Don't add 5:30 PM slot
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        allSlots.push(timeStr);
      }
    }

    // Filter out booked slots
    const bookedSlots = existingAppointments.map(apt => {
      const startTime = new Date(apt.startAt);
      const hour = String(startTime.getHours()).padStart(2, '0');
      const minute = String(startTime.getMinutes()).padStart(2, '0');
      return `${hour}:${minute}`;
    });

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    
    return { availableSlots, bookedSlots, allSlots };
  } catch (error) {
    console.error('Error getting available slots:', error);
    return { availableSlots: [], bookedSlots: [], allSlots: [] };
  }
}

async function runTests() {
  try {
    console.log('\n📊 Testing Appointment Availability System\n');
    console.log('=' .repeat(60));

    // Test 1: Get first doctor
    console.log('\n1️⃣ Finding doctors...');
    const doctors = await User.find({ role: 'doctor', is_active: true }).limit(5).lean();
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found in the system');
      console.log('💡 Create a doctor first using the admin panel or seed script');
      process.exit(0);
    }

    console.log(`✅ Found ${doctors.length} active doctor(s):`);
    doctors.forEach((doc, idx) => {
      const name = `${doc.firstName} ${doc.lastName || ''}`.trim();
      const specialty = doc.metadata?.specialization || doc.metadata?.department || 'General';
      console.log(`   ${idx + 1}. Dr. ${name} - ${specialty} (ID: ${doc._id})`);
    });

    // Test 2: Check today's availability
    const testDoctor = doctors[0];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`\n2️⃣ Checking availability for Dr. ${testDoctor.firstName} ${testDoctor.lastName || ''} on ${todayStr}...`);
    
    const { availableSlots, bookedSlots, allSlots } = await getAvailableTimeSlots(testDoctor._id, todayStr);

    console.log(`\n📅 Availability Report:`);
    console.log(`   Total slots: ${allSlots.length}`);
    console.log(`   Booked slots: ${bookedSlots.length}`);
    console.log(`   Available slots: ${availableSlots.length}`);

    if (bookedSlots.length > 0) {
      console.log(`\n🔴 Booked time slots:`);
      console.log(`   ${bookedSlots.join(', ')}`);
    } else {
      console.log(`\n✅ No appointments booked for today`);
    }

    if (availableSlots.length > 0) {
      console.log(`\n🟢 Available time slots:`);
      const morning = availableSlots.filter(s => parseInt(s.split(':')[0]) < 12);
      const afternoon = availableSlots.filter(s => parseInt(s.split(':')[0]) >= 12 && parseInt(s.split(':')[0]) < 17);
      const evening = availableSlots.filter(s => parseInt(s.split(':')[0]) >= 17);
      
      if (morning.length > 0) {
        console.log(`   🌅 Morning: ${morning.join(', ')}`);
      }
      if (afternoon.length > 0) {
        console.log(`   ☀️  Afternoon: ${afternoon.join(', ')}`);
      }
      if (evening.length > 0) {
        console.log(`   🌆 Evening: ${evening.join(', ')}`);
      }
    } else {
      console.log(`\n⚠️  No available slots (fully booked)`);
    }

    // Test 3: Check tomorrow's availability
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`\n3️⃣ Checking availability for tomorrow (${tomorrowStr})...`);
    const tomorrowSlots = await getAvailableTimeSlots(testDoctor._id, tomorrowStr);

    console.log(`   Total slots: ${tomorrowSlots.allSlots.length}`);
    console.log(`   Booked slots: ${tomorrowSlots.bookedSlots.length}`);
    console.log(`   Available slots: ${tomorrowSlots.availableSlots.length}`);

    // Test 4: Check all appointments for this doctor
    console.log(`\n4️⃣ Recent appointments for Dr. ${testDoctor.firstName}...`);
    const recentAppointments = await Appointment.find({
      doctorId: testDoctor._id,
      startAt: { $gte: new Date() }
    })
    .sort({ startAt: 1 })
    .limit(5)
    .lean();

    if (recentAppointments.length > 0) {
      console.log(`   Found ${recentAppointments.length} upcoming appointment(s):`);
      recentAppointments.forEach((apt, idx) => {
        const date = new Date(apt.startAt);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        console.log(`   ${idx + 1}. ${dateStr} at ${timeStr} - Status: ${apt.status} (${apt.appointmentCode || apt._id})`);
      });
    } else {
      console.log(`   No upcoming appointments found`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the Telegram bot: node Server/Bot/telegram_bot.js');
    console.log('   2. Test booking an appointment via Telegram');
    console.log('   3. Run this script again to see the booked slots\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

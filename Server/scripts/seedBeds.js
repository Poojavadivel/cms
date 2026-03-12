// Server/scripts/seedBeds.js
// Seed script: Creates 4 Wards with 10 Beds each (40 beds total)
// Run: node scripts/seedBeds.js

require('dotenv').config();
const mongoose = require('mongoose');
const { connectMongo } = require('../Config/Dbconfig');
const Ward = require('../Models/Ward');
const Bed = require('../Models/Bed');
const Patient = require('../Models/Patient');

const WARDS = [
  { name: 'ICU', description: 'Intensive Care Unit', floor: '3rd Floor' },
  { name: 'General Ward', description: 'General Patient Ward', floor: '1st Floor' },
  { name: 'Pediatrics', description: 'Children\'s Ward', floor: '2nd Floor' },
  { name: 'Maternity', description: 'Maternity & Neonatal Ward', floor: '2nd Floor' },
];

const STATUSES = ['AVAILABLE', 'OCCUPIED', 'CLEANING'];

function randomStatus() {
  // Weighted: ~40% AVAILABLE, ~40% OCCUPIED, ~20% CLEANING
  const r = Math.random();
  if (r < 0.4) return 'AVAILABLE';
  if (r < 0.8) return 'OCCUPIED';
  return 'CLEANING';
}

async function seed() {
  try {
    await connectMongo();
    console.log('🔗 Connected to MongoDB');

    // Fetch real patients from the database
    const patients = await Patient.find({ deleted_at: null }).select('firstName lastName').lean();
    console.log(`👥 Found ${patients.length} patients in database`);

    function randomPatient() {
      if (patients.length === 0) return { patientId: null, patientName: 'Unassigned' };
      const p = patients[Math.floor(Math.random() * patients.length)];
      return {
        patientId: p._id,
        patientName: `${p.firstName} ${p.lastName || ''}`.trim(),
      };
    }

    // Clear existing data
    await Ward.deleteMany({});
    await Bed.deleteMany({});
    console.log('🗑️  Cleared existing Ward and Bed data');

    for (const wardData of WARDS) {
      const ward = await Ward.create(wardData);
      console.log(`🏥 Created ward: ${ward.name}`);

      const beds = [];
      for (let i = 1; i <= 10; i++) {
        const status = randomStatus();
        const patient = status === 'OCCUPIED' ? randomPatient() : { patientId: null, patientName: null };
        beds.push({
          label: `${ward.name.replace(/\s+/g, '-').substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
          ward: ward._id,
          status,
          patientId: patient.patientId,
          patientName: patient.patientName,
        });
      }
      await Bed.insertMany(beds);
      console.log(`   🛏️  Created ${beds.length} beds for ${ward.name}`);
    }

    const totalBeds = await Bed.countDocuments();
    const available = await Bed.countDocuments({ status: 'AVAILABLE' });
    const occupied = await Bed.countDocuments({ status: 'OCCUPIED' });
    const cleaning = await Bed.countDocuments({ status: 'CLEANING' });

    console.log('\n✅ Seeding complete!');
    console.log(`   Total beds: ${totalBeds}`);
    console.log(`   Available: ${available} | Occupied: ${occupied} | Cleaning: ${cleaning}`);
    console.log(`   Occupancy rate: ${((occupied / totalBeds) * 100).toFixed(1)}%`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();

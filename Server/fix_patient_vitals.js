// Server/fix_patient_vitals.js
// Fix invalid vital signs in patient data

require('dotenv').config();
const mongoose = require('mongoose');
const { Patient } = require('./Models');

async function connectDB() {
  const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL;
  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB\n');
}

async function fixPatientVitals() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           FIX PATIENT VITAL SIGNS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const patients = await Patient.find({});
    console.log(`📊 Found ${patients.length} patients\n`);

    let fixedCount = 0;

    for (const patient of patients) {
      let needsUpdate = false;
      const updates = {};

      // Check and fix temperature (should be 97-99, not 970+)
      if (patient.vitals?.temp) {
        const temp = parseFloat(patient.vitals.temp);
        if (temp > 200) {
          // Likely multiplied by 10 by mistake
          updates['vitals.temp'] = (temp / 10).toFixed(1);
          needsUpdate = true;
          console.log(`🌡️  Fixed temp for ${patient.firstName}: ${temp} → ${updates['vitals.temp']}`);
        } else if (temp < 80 || temp > 110) {
          // Invalid temperature, set to normal
          updates['vitals.temp'] = '98.6';
          needsUpdate = true;
          console.log(`🌡️  Fixed temp for ${patient.firstName}: ${temp} → 98.6`);
        }
      }

      // Check and fix SpO2 (should be 90-100, not 900+)
      if (patient.vitals?.spo2) {
        const spo2 = parseFloat(patient.vitals.spo2);
        if (spo2 > 100) {
          // Likely wrong value
          updates['vitals.spo2'] = Math.min(98, Math.floor(spo2 / 10));
          needsUpdate = true;
          console.log(`🫁 Fixed SpO2 for ${patient.firstName}: ${spo2} → ${updates['vitals.spo2']}`);
        } else if (spo2 < 70) {
          updates['vitals.spo2'] = 98;
          needsUpdate = true;
          console.log(`🫁 Fixed SpO2 for ${patient.firstName}: ${spo2} → 98`);
        }
      }

      // Check and fix pulse (should be 60-120)
      if (patient.vitals?.pulse) {
        const pulse = parseFloat(patient.vitals.pulse);
        if (pulse > 200 || pulse < 30) {
          updates['vitals.pulse'] = 75;
          needsUpdate = true;
          console.log(`💓 Fixed pulse for ${patient.firstName}: ${pulse} → 75`);
        }
      }

      // Check and fix blood pressure
      if (patient.vitals?.bp) {
        const bp = patient.vitals.bp.toString();
        if (!bp.includes('/') || bp === '0/0') {
          updates['vitals.bp'] = '120/80';
          needsUpdate = true;
          console.log(`🩺 Fixed BP for ${patient.firstName}: ${bp} → 120/80`);
        }
      }

      if (needsUpdate) {
        await Patient.findByIdAndUpdate(patient._id, { $set: updates });
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} patients with invalid vitals\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await fixPatientVitals();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ VITAL SIGNS FIXED!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);
  }
}

main();

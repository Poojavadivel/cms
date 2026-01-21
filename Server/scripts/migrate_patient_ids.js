const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Patient } = require('../Models');
const { getNextSequence, formatCode } = require('../utils/sequence');

async function migrate() {
    try {
        console.log('🚀 Starting Patient ID Migration...');

        const mongoUri = process.env.MONGODB_URL;
        if (!mongoUri) {
            console.error('❌ MONGODB_URL not found in .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB Atlas');

        const patients = await Patient.find({ deleted_at: null });
        console.log(`📊 Found ${patients.length} patients in "${mongoose.connection.name}" database.`);

        let updatedCount = 0;
        for (const patient of patients) {
            const currentCode = patient.patientCode || (patient.metadata && patient.metadata.patientCode);

            // Check if it's already a clean numeric code (PAT-XXXXX)
            const isClean = currentCode && /^PAT-\d{5}$/.test(currentCode);

            if (!isClean) {
                const seq = await getNextSequence('patientCode');
                const newCode = formatCode('PAT', seq, 5);

                await Patient.updateOne(
                    { _id: patient._id },
                    { $set: { patientCode: newCode, 'metadata.patientCode': newCode } }
                );

                console.log(`✅ Updated ${patient.firstName} ${patient.lastName}: ${currentCode || 'NO_ID'} -> ${newCode}`);
                updatedCount++;
            } else {
                console.log(`⏭️ Skipping ${patient.firstName} ${patient.lastName} (already valid: ${currentCode})`);
            }
        }

        console.log(`\n🎉 Migration complete! Updated ${updatedCount} patients.`);
        process.exit(0);
    } catch (err) {
        console.error('💥 Migration failed:', err);
        process.exit(1);
    }
}

migrate();

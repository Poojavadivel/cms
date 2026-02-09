const mongoose = require('mongoose');
const { Intake, PharmacyRecord } = require('./server/Models');
require('dotenv').config({ path: './server/.env' });

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const completedIntakes = await Intake.find({ 'meta.pharmacyId': { $exists: true } }).lean();
        console.log(`Found ${completedIntakes.length} intakes with pharmacyId`);

        for (const intake of completedIntakes) {
            console.log(`\nIntake ID: ${intake._id}`);
            console.log(`Patient: ${intake.patientSnapshot?.firstName} ${intake.patientSnapshot?.lastName}`);
            console.log(`PharmacyId: ${intake.meta.pharmacyId}`);

            const record = await PharmacyRecord.findById(intake.meta.pharmacyId).lean();
            if (record) {
                console.log(`Record found: Total ₹${record.total}, Items: ${record.items?.length || 0}`);
            } else {
                console.log(`Record NOT FOUND for ID ${intake.meta.pharmacyId}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();

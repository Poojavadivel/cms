const mongoose = require('mongoose');
require('dotenv').config({ path: './react/hms/.env.production' }); // or wherever env is

// Define schemas quickly
const MedicineSchema = new mongoose.Schema({ _id: String, name: String }, { strict: false });
const BatchSchema = new mongoose.Schema({ _id: String, medicineId: String, quantity: Number }, { strict: false });

const Medicine = mongoose.model('Medicine', MedicineSchema);
const Batch = mongoose.model('MedicineBatch', BatchSchema);

async function run() {
    try {
        // Try connecting to local mongo if env is missing or generic
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hms';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);

        console.log('--- MEDICINES ---');
        const meds = await Medicine.find({}).limit(5);
        meds.forEach(m => console.log(`ID: ${m._id}, Name: ${m.name}`));

        console.log('\n--- BATCHES ---');
        const batches = await Batch.find({}).limit(5);
        batches.forEach(b => console.log(`BatchID: ${b._id}, MedID: ${b.medicineId}, Qty: ${b.quantity}`));

        if (meds.length > 0 && batches.length > 0) {
            console.log('\n--- MATCH CHECK ---');
            const medId = meds[0]._id;
            const matchingBatches = await Batch.find({ medicineId: medId });
            console.log(`Found ${matchingBatches.length} batches for Medicine ${medId}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

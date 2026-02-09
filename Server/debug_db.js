const mongoose = require('mongoose');

// Real URI from .env
const uri = "mongodb+srv://mahasanjit08_db_user:YXW5b2D1QzXIL6ba@cluster0.hjacbky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Define schemas quickly
const MedicineSchema = new mongoose.Schema({ _id: String, name: String }, { strict: false });
const BatchSchema = new mongoose.Schema({ _id: String, medicineId: String, quantity: Number }, { strict: false });

const Medicine = mongoose.model('Medicine', MedicineSchema);
const Batch = mongoose.model('MedicineBatch', BatchSchema);

async function run() {
    try {
        console.log('Connecting to Cloud DB...');
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected!');

        console.log('\n--- MEDICINES (Top 5) ---');
        const meds = await Medicine.find({}).limit(5);
        meds.forEach(m => console.log(`ID: ${m._id} | Name: ${m.name}`));

        console.log('\n--- BATCHES (Top 5) ---');
        const batches = await Batch.find({}).limit(5);
        batches.forEach(b => console.log(`BatchID: ${b._id} | MedID: ${b.medicineId} | Qty: ${b.quantity}`));

        if (meds.length > 0) {
            // Pick one medicine and check batches
            const med = meds[0]; // e.g. Zincofer
            console.log(`\nChecking matches for Medicine: ${med.name} (ID: ${med._id})`);
            // Check for matches using string ID
            const matchingBatches = await Batch.find({ medicineId: med._id });
            console.log(`Found ${matchingBatches.length} batches.`);
            if (matchingBatches.length > 0) {
                matchingBatches.forEach(b => console.log(` - Batch ${b._id}: Qty ${b.quantity}`));
            } else {
                console.log('No batches found. Checking if any batch has this ID as part of string...');
                // Debug if case mismatch or trimming needed?
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

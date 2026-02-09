// Check medicine stock details
require('dotenv').config();
const mongoose = require('mongoose');

async function checkMedicineStock() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hms';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);

        // Get all medicines
        const Medicine = mongoose.model('Medicine', new mongoose.Schema({}, { strict: false, collection: 'medicines' }));
        const MedicineBatch = mongoose.model('MedicineBatch', new mongoose.Schema({}, { strict: false, collection: 'medicinebatches' }));

        const medicines = await Medicine.find().lean();
        console.log(`\n📊 Found ${medicines.length} medicines\n`);

        for (const med of medicines) {
            console.log(`\n📦 Medicine: ${med.name}`);
            console.log(`   ID: ${med._id}`);
            console.log(`   Status: ${med.status || 'N/A'}`);

            // Get batches for this medicine
            const batches = await MedicineBatch.find({ medicineId: String(med._id) }).lean();
            console.log(`   Batches: ${batches.length}`);

            if (batches.length > 0) {
                let totalStock = 0;
                batches.forEach((batch, idx) => {
                    console.log(`     Batch ${idx + 1}: ${batch.batchNumber} - Qty: ${batch.quantity}`);
                    totalStock += batch.quantity || 0;
                });
                console.log(`   ✅ Total Stock: ${totalStock}`);
            } else {
                console.log(`   ⚠️ No batches found - Stock will show as 0`);
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

checkMedicineStock();

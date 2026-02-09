// Test the pharmacy API endpoint directly
require('dotenv').config();
const mongoose = require('mongoose');

async function testPharmacyAPI() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hms';
        await mongoose.connect(uri);

        const Medicine = mongoose.model('Medicine', new mongoose.Schema({}, { strict: false, collection: 'medicines' }));
        const MedicineBatch = mongoose.model('MedicineBatch', new mongoose.Schema({}, { strict: false, collection: 'medicinebatches' }));

        // Simulate what the API does
        const medicines = await Medicine.find().limit(10).lean();
        const medIds = medicines.map(m => String(m._id));

        console.log(`\n📊 Testing API logic for ${medicines.length} medicines\n`);

        // Aggregate batches
        const agg = await MedicineBatch.aggregate([
            { $match: { medicineId: { $in: medIds } } },
            {
                $group: {
                    _id: '$medicineId',
                    qty: { $sum: '$quantity' },
                    avgSalePrice: { $avg: '$salePrice' }
                }
            },
        ]);

        const qtyMap = {};
        const priceMap = {};
        agg.forEach((a) => {
            qtyMap[String(a._id)] = a.qty;
            priceMap[String(a._id)] = a.avgSalePrice || 0;
        });

        // Build response like API does
        const result = medicines.map((m) => ({
            _id: m._id,
            name: m.name,
            status: m.status,
            availableQty: qtyMap[String(m._id)] ?? 0,
            salePrice: priceMap[String(m._id)] ?? 0
        }));

        console.log('API Response would be:');
        result.forEach(m => {
            console.log(`  ${m.name}: availableQty=${m.availableQty}, salePrice=${m.salePrice}, status=${m.status}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

testPharmacyAPI();

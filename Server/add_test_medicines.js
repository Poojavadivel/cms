// Add test medicines to database
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

async function addTestMedicines() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hms';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);

        // Define Medicine schema matching your model
        const medicineSchema = new mongoose.Schema({
            _id: { type: String, default: () => uuidv4() },
            name: { type: String, required: true },
            genericName: String,
            sku: String,
            form: { type: String, default: 'Tablet' },
            strength: String,
            unit: { type: String, default: 'pcs' },
            manufacturer: String,
            brand: String,
            category: String,
            description: String,
            reorderLevel: { type: Number, default: 20 },
            status: { type: String, default: 'In Stock' },
            metadata: { type: Object, default: {} },
            deleted_at: Date,
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        }, { collection: 'medicines' });

        const Medicine = mongoose.model('Medicine', medicineSchema);

        // Define MedicineBatch schema
        const batchSchema = new mongoose.Schema({
            _id: { type: String, default: () => uuidv4() },
            medicineId: { type: String, required: true },
            batchNumber: String,
            quantity: { type: Number, default: 0 },
            salePrice: { type: Number, default: 0 },
            purchasePrice: { type: Number, default: 0 },
            supplier: String,
            location: String,
            expiryDate: Date,
            metadata: { type: Object, default: {} },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        }, { collection: 'medicinebatches' });

        const MedicineBatch = mongoose.model('MedicineBatch', batchSchema);

        console.log('\n📦 Creating test medicines...\n');

        // Medicine 1: Paracetamol
        const med1 = await Medicine.create({
            name: 'Paracetamol',
            genericName: 'Acetaminophen',
            sku: 'MED-001',
            form: 'Tablet',
            strength: '500mg',
            unit: 'pcs',
            manufacturer: 'Generic Pharma',
            brand: 'Paracet',
            category: 'Analgesic',
            description: 'Pain reliever and fever reducer',
            reorderLevel: 50,
            status: 'In Stock'
        });

        await MedicineBatch.create({
            medicineId: med1._id,
            batchNumber: 'BATCH-001',
            quantity: 100,
            salePrice: 5,
            purchasePrice: 3,
            supplier: 'Generic Pharma Ltd',
            location: 'Shelf A1'
        });

        console.log(`✅ Created: ${med1.name} (${med1._id}) - Stock: 100`);

        // Medicine 2: Amoxicillin
        const med2 = await Medicine.create({
            name: 'Amoxicillin',
            genericName: 'Amoxicillin',
            sku: 'MED-002',
            form: 'Capsule',
            strength: '250mg',
            unit: 'pcs',
            manufacturer: 'Antibiotic Corp',
            brand: 'Amox',
            category: 'Antibiotic',
            description: 'Broad-spectrum antibiotic',
            reorderLevel: 30,
            status: 'In Stock'
        });

        await MedicineBatch.create({
            medicineId: med2._id,
            batchNumber: 'BATCH-002',
            quantity: 75,
            salePrice: 15,
            purchasePrice: 10,
            supplier: 'Antibiotic Corp Ltd',
            location: 'Shelf B2'
        });

        console.log(`✅ Created: ${med2.name} (${med2._id}) - Stock: 75`);

        // Verify
        const count = await Medicine.countDocuments();
        console.log(`\n📊 Total medicines in DB: ${count}`);

        await mongoose.disconnect();
        console.log('\n✅ Done! Medicines added successfully.');
    } catch (error) {
        console.error('💥 Error:', error.message);
        console.error(error);
    }
}

addTestMedicines();

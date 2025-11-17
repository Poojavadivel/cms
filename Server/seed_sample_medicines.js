// Quick script to seed sample medicines for testing
// Run: node Server/seed_sample_medicines.js

require('dotenv').config();
const mongoose = require('mongoose');
const { Medicine, MedicineBatch } = require('./Models');

const MONGODB_URI = process.env.MANGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/hms';

const sampleMedicines = [
  {
    name: 'Paracetamol 500mg',
    sku: 'MED-001',
    category: 'Analgesic',
    form: 'Tablet',
    strength: '500mg',
    manufacturer: 'ABC Pharma',
    status: 'In Stock',
    reorderLevel: 20,
    initialStock: 500
  },
  {
    name: 'Amoxicillin 250mg',
    sku: 'MED-002',
    category: 'Antibiotic',
    form: 'Capsule',
    strength: '250mg',
    manufacturer: 'XYZ Labs',
    status: 'In Stock',
    reorderLevel: 20,
    initialStock: 15
  },
  {
    name: 'Insulin 100IU',
    sku: 'MED-003',
    category: 'Diabetes',
    form: 'Injection',
    strength: '100IU',
    manufacturer: 'MediCare',
    status: 'Out of Stock',
    reorderLevel: 10,
    initialStock: 0
  },
  {
    name: 'Aspirin 75mg',
    sku: 'MED-004',
    category: 'Antiplatelet',
    form: 'Tablet',
    strength: '75mg',
    manufacturer: 'HealthPharma',
    status: 'In Stock',
    reorderLevel: 30,
    initialStock: 200
  },
  {
    name: 'Omeprazole 20mg',
    sku: 'MED-005',
    category: 'Proton Pump Inhibitor',
    form: 'Capsule',
    strength: '20mg',
    manufacturer: 'ABC Pharma',
    status: 'In Stock',
    reorderLevel: 25,
    initialStock: 150
  }
];

async function seedMedicines() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📦 Seeding sample medicines...\n');

    for (const medData of sampleMedicines) {
      // Check if medicine already exists
      const existing = await Medicine.findOne({ sku: medData.sku });
      
      if (existing) {
        console.log(`⏭️  Skipping ${medData.name} - already exists`);
        continue;
      }

      // Create medicine
      const medicine = await Medicine.create({
        name: medData.name,
        sku: medData.sku,
        category: medData.category,
        form: medData.form,
        strength: medData.strength,
        manufacturer: medData.manufacturer,
        status: medData.status,
        reorderLevel: medData.reorderLevel,
        unit: 'pcs',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      console.log(`✅ Created medicine: ${medicine.name} (${medicine._id})`);

      // Create initial batch if stock > 0
      if (medData.initialStock > 0) {
        const batch = await MedicineBatch.create({
          medicineId: String(medicine._id),
          batchNumber: 'BATCH-SEED-001',
          quantity: medData.initialStock,
          salePrice: 10.0,
          purchasePrice: 5.0,
          supplier: 'Sample Supplier',
          location: 'Main Store',
          expiryDate: new Date('2026-12-31'),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        console.log(`   📦 Created batch with ${batch.quantity} units`);
      }
    }

    console.log('\n🎉 Sample medicines seeded successfully!');
    console.log('\n📊 Summary:');
    const totalMedicines = await Medicine.countDocuments();
    const totalBatches = await MedicineBatch.countDocuments();
    console.log(`   Total Medicines: ${totalMedicines}`);
    console.log(`   Total Batches: ${totalBatches}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding medicines:', error);
    process.exit(1);
  }
}

seedMedicines();

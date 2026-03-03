/**
 * Seed Services Script
 * Run this to populate the database with initial hospital services
 * Usage: node seed_services.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./Models/Service');

const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL;

if (!mongoUrl) {
  console.error('❌ MONGODB_URL or MANGODB_URL not found in .env');
  process.exit(1);
}

// Comprehensive hospital services
const initialServices = [
  // ========== CONSULTATIONS ==========
  { name: 'General Physician Consultation', category: 'Consultation', price: 500, description: 'Basic consultation with general physician', taxable: true },
  { name: 'Specialist Doctor Consultation', category: 'Consultation', price: 1000, description: 'Consultation with specialist', taxable: true },
  { name: 'Senior Consultant Consultation', category: 'Consultation', price: 1500, description: 'Senior consultant with 15+ years experience', taxable: true },
  { name: 'Emergency Consultation', category: 'Consultation', price: 2000, description: 'Emergency doctor consultation 24/7', taxable: true },
  { name: 'Follow-up Consultation', category: 'Consultation', price: 300, description: 'Follow-up visit within 15 days', taxable: true },
  { name: 'Pediatric Consultation', category: 'Consultation', price: 800, description: 'Child specialist consultation', taxable: true },
  { name: 'Gynecology Consultation', category: 'Consultation', price: 900, description: 'Women health specialist', taxable: true },
  { name: 'Dental Consultation', category: 'Consultation', price: 600, description: 'Dentist consultation', taxable: true },
  { name: 'Orthopedic Consultation', category: 'Consultation', price: 1000, description: 'Bone and joint specialist', taxable: true },
  { name: 'Dermatology Consultation', category: 'Consultation', price: 800, description: 'Skin specialist consultation', taxable: true },

  // ========== PROCEDURES ==========
  { name: 'ECG (Electrocardiogram)', category: 'Procedures', price: 300, description: 'Heart electrical activity test', taxable: false },
  { name: 'X-Ray - Chest PA View', category: 'Procedures', price: 800, description: 'Chest X-ray scan', taxable: false },
  { name: 'Ultrasound - Abdomen', category: 'Procedures', price: 1500, description: 'Abdominal ultrasound scan', taxable: false },
  { name: 'CT Scan - Head', category: 'Procedures', price: 5000, description: 'Brain CT scan', taxable: false },
  { name: 'MRI Scan - Brain', category: 'Procedures', price: 8000, description: 'Brain MRI imaging', taxable: false },
  { name: 'Echocardiography (2D Echo)', category: 'Procedures', price: 2500, description: 'Heart ultrasound', taxable: false },
  { name: 'Nebulization', category: 'Procedures', price: 150, description: 'Breathing treatment', taxable: true },
  { name: 'IV Cannulation', category: 'Procedures', price: 200, description: 'Intravenous line insertion', taxable: true },
  { name: 'Wound Dressing - Simple', category: 'Procedures', price: 200, description: 'Basic wound care', taxable: true },
  { name: 'Blood Transfusion - Per Unit', category: 'Procedures', price: 1500, description: 'Blood unit transfusion', taxable: true },

  // ========== MEDICATIONS ==========
  { name: 'Paracetamol 500mg - Strip (10 tablets)', category: 'Medication', price: 20, description: 'Pain & fever relief', taxable: false },
  { name: 'Ibuprofen 400mg - Strip (10 tablets)', category: 'Medication', price: 30, description: 'Anti-inflammatory', taxable: false },
  { name: 'Amoxicillin 500mg - Strip (10 capsules)', category: 'Medication', price: 80, description: 'Antibiotic', taxable: false },
  { name: 'Azithromycin 500mg - Strip (5 tablets)', category: 'Medication', price: 120, description: 'Antibiotic', taxable: false },
  { name: 'Omeprazole 20mg - Strip (10 capsules)', category: 'Medication', price: 60, description: 'Acid reducer', taxable: false },
  { name: 'Cetirizine 10mg - Strip (10 tablets)', category: 'Medication', price: 30, description: 'Antihistamine', taxable: false },
  { name: 'Cough Syrup - 100ml', category: 'Medication', price: 90, description: 'Cough suppressant', taxable: false },
  { name: 'Multivitamin - Strip (10 tablets)', category: 'Medication', price: 150, description: 'Daily vitamins', taxable: false },
  { name: 'IV Fluids - Normal Saline 500ml', category: 'Medication', price: 150, description: 'IV fluid bottle', taxable: false },
  { name: 'Insulin - Actrapid 10ml Vial', category: 'Medication', price: 500, description: 'Short-acting insulin', taxable: false },

  // ========== LAB TESTS ==========
  { name: 'Complete Blood Count (CBC)', category: 'Lab Tests', price: 400, description: 'Full blood analysis', taxable: false },
  { name: 'Blood Sugar - Fasting (FBS)', category: 'Lab Tests', price: 100, description: 'Fasting glucose test', taxable: false },
  { name: 'Blood Sugar - Random (RBS)', category: 'Lab Tests', price: 100, description: 'Random glucose test', taxable: false },
  { name: 'HbA1c (Glycated Hemoglobin)', category: 'Lab Tests', price: 600, description: '3-month diabetes control', taxable: false },
  { name: 'Lipid Profile', category: 'Lab Tests', price: 600, description: 'Cholesterol & triglycerides', taxable: false },
  { name: 'Liver Function Test (LFT)', category: 'Lab Tests', price: 800, description: 'Liver enzymes panel', taxable: false },
  { name: 'Kidney Function Test (KFT)', category: 'Lab Tests', price: 800, description: 'Kidney function panel', taxable: false },
  { name: 'Thyroid Profile - T3, T4, TSH', category: 'Lab Tests', price: 600, description: 'Thyroid function test', taxable: false },
  { name: 'Urine Analysis (Routine)', category: 'Lab Tests', price: 200, description: 'Complete urine test', taxable: false },
  { name: 'COVID-19 RT-PCR', category: 'Lab Tests', price: 1500, description: 'COVID molecular test', taxable: false },

  // ========== ROOM CHARGES ==========
  { name: 'General Ward - Per Day', category: 'Room Charges', price: 1000, description: 'Shared room accommodation', taxable: false },
  { name: 'Semi-Private Room - Per Day', category: 'Room Charges', price: 2000, description: '2-bed room', taxable: false },
  { name: 'Private Room (Deluxe) - Per Day', category: 'Room Charges', price: 3500, description: 'Single room with AC', taxable: false },
  { name: 'ICU (General) - Per Day', category: 'Room Charges', price: 5000, description: 'Intensive care unit', taxable: false },
  { name: 'ICU (Ventilator) - Per Day', category: 'Room Charges', price: 8000, description: 'ICU with ventilator', taxable: false },
  { name: 'Emergency Observation Bed - Per Day', category: 'Room Charges', price: 1500, description: 'Emergency monitoring', taxable: false },
  { name: 'Operation Theater - Minor', category: 'Room Charges', price: 10000, description: 'Minor surgery OT charges', taxable: false },
  { name: 'Operation Theater - Major', category: 'Room Charges', price: 25000, description: 'Major surgery OT charges', taxable: false },
];

async function seedServices() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if services already exist
    const existingCount = await Service.countDocuments();
    console.log(`📊 Current services in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Services already exist!');
      const answer = await new Promise((resolve) => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question('Do you want to delete existing services and re-seed? (yes/no): ', (ans) => {
          readline.close();
          resolve(ans.toLowerCase() === 'yes');
        });
      });

      if (answer) {
        console.log('🗑️  Deleting existing services...');
        await Service.deleteMany({});
        console.log('✅ Existing services deleted');
      } else {
        console.log('❌ Seeding cancelled');
        process.exit(0);
      }
    }

    console.log(`🌱 Seeding ${initialServices.length} services...`);
    const services = await Service.insertMany(initialServices);

    console.log('✅ Services seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`  Total services: ${services.length}`);
    
    const categories = {};
    services.forEach(s => {
      categories[s.category] = (categories[s.category] || 0) + 1;
    });
    
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} services`);
    });

    console.log('\n🎉 Database is ready for billing!');

  } catch (error) {
    console.error('❌ Error seeding services:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

seedServices();

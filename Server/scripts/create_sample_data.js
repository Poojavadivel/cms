// create_sample_data.js
// Creates sample data for testing pharmacy and pathology modules
// Usage: node scripts/create_sample_data.js

require('dotenv').config();
const mongoose = require('mongoose');
const {
  Medicine,
  MedicineBatch,
  Patient,
  User,
  Intake,
  LabReport,
  Appointment
} = require('../Models');

async function createSampleData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karur_hms');
    console.log('✅ Connected to MongoDB');

    // Find or create a doctor
    let doctor = await User.findOne({ role: 'doctor' });
    if (!doctor) {
      console.log('⚠️ No doctor found. Please create a doctor user first.');
      process.exit(1);
    }
    console.log(`✅ Using doctor: ${doctor.email} (${doctor._id})`);

    // Find or create a patient
    let patient = await Patient.findOne({ doctorId: doctor._id });
    if (!patient) {
      console.log('📝 Creating sample patient...');
      
      // Get next patient code
      const lastPatient = await Patient.findOne().sort({ createdAt: -1 });
      let patientNumber = 1;
      if (lastPatient && lastPatient.patientCode) {
        const match = lastPatient.patientCode.match(/PAT-(\d+)/);
        if (match) {
          patientNumber = parseInt(match[1]) + 1;
        }
      }
      const patientCode = `PAT-${String(patientNumber).padStart(3, '0')}`;
      
      patient = await Patient.create({
        patientCode,
        firstName: 'Sample',
        lastName: 'Patient',
        name: 'Sample Patient',
        age: 35,
        gender: 'Male',
        phone: '+91 9876543210',
        email: 'sample.patient@example.com',
        bloodGroup: 'A+',
        address: '123 Sample Street, Chennai',
        doctorId: doctor._id,
        medicalHistory: ['Hypertension'],
        allergies: ['Penicillin'],
        dateOfBirth: new Date('1989-05-15'),
        metadata: {}
      });
      console.log(`✅ Sample patient created: ${patient.patientCode} (${patient._id})`);
    } else {
      console.log(`✅ Using existing patient: ${patient.patientCode} (${patient._id})`);
    }

    // Create sample appointment
    console.log('\n📅 Creating sample appointment...');
    const existingAppointment = await Appointment.findOne({ 
      patientId: patient._id,
      doctorId: doctor._id 
    });
    
    let appointment;
    if (!existingAppointment) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentType: 'Consultation',
        startAt: tomorrow,
        endAt: new Date(tomorrow.getTime() + 30 * 60000),
        location: 'Consultation Room 1',
        status: 'Scheduled',
        notes: 'Regular checkup with lab tests',
        metadata: {
          mode: 'In-Person',
          priority: 'Normal'
        }
      });
      console.log(`✅ Sample appointment created: ${appointment._id}`);
    } else {
      appointment = existingAppointment;
      console.log(`✅ Using existing appointment: ${appointment._id}`);
    }

    // Create sample medicines
    console.log('\n💊 Creating sample medicines...');
    const medicineData = [
      { name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Analgesic', form: 'Tablet', strength: '500mg', price: 5 },
      { name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'Antibiotic', form: 'Capsule', strength: '250mg', price: 15 },
      { name: 'Omeprazole', genericName: 'Omeprazole', category: 'Antacid', form: 'Capsule', strength: '20mg', price: 8 },
      { name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'Anti-inflammatory', form: 'Tablet', strength: '400mg', price: 6 },
      { name: 'Cetirizine', genericName: 'Cetirizine', category: 'Antihistamine', form: 'Tablet', strength: '10mg', price: 4 }
    ];

    const createdMedicines = [];
    for (const medData of medicineData) {
      let medicine = await Medicine.findOne({ name: medData.name });
      if (!medicine) {
        medicine = await Medicine.create({
          ...medData,
          sku: `MED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          unit: 'pcs',
          manufacturer: 'Sample Pharma Ltd',
          brand: medData.name,
          status: 'In Stock',
          reorderLevel: 10,
          metadata: { taxPercent: 5 }
        });
        console.log(`  ✅ Created medicine: ${medicine.name}`);
      } else {
        console.log(`  ℹ️ Medicine already exists: ${medicine.name}`);
      }
      createdMedicines.push(medicine);
    }

    // Create sample medicine batches
    console.log('\n📦 Creating medicine batches...');
    for (const medicine of createdMedicines) {
      const existingBatch = await MedicineBatch.findOne({ medicineId: String(medicine._id) });
      if (!existingBatch) {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);
        
        await MedicineBatch.create({
          medicineId: String(medicine._id),
          batchNumber: `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          expiryDate,
          quantity: 100,
          purchasePrice: medicine.price * 0.7,
          salePrice: medicine.price,
          supplier: 'Sample Supplier Ltd',
          location: 'Shelf A',
          metadata: {}
        });
        console.log(`  ✅ Created batch for: ${medicine.name} (qty: 100)`);
      } else {
        console.log(`  ℹ️ Batch already exists for: ${medicine.name}`);
      }
    }

    // Create sample intake with pharmacy prescription
    console.log('\n📋 Creating sample intake with prescription...');
    const existingIntake = await Intake.findOne({ 
      patientId: patient._id,
      'meta.pharmacyItems': { $exists: true }
    });
    
    if (!existingIntake) {
      const intake = await Intake.create({
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        notes: 'Patient complaint: Fever and headache for 2 days. Prescribed medications.',
        patientSnapshot: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          bloodGroup: patient.bloodGroup
        },
        meta: {
          pharmacyItems: [
            {
              Medicine: 'Paracetamol',
              Dosage: '500mg',
              Frequency: 'TID (3 times daily)',
              Duration: '5 days',
              Notes: 'Take after meals'
            },
            {
              Medicine: 'Cetirizine',
              Dosage: '10mg',
              Frequency: 'OD (Once daily)',
              Duration: '3 days',
              Notes: 'Take before bed'
            }
          ],
          pathologyItems: [
            {
              Test: 'Complete Blood Count',
              Priority: 'Normal',
              Notes: 'Routine checkup'
            }
          ]
        },
        attachments: [
          { type: 'pharmacy', data: {} },
          { type: 'pathology', data: {} }
        ]
      });
      console.log(`✅ Sample intake created with pharmacy prescription: ${intake._id}`);
    } else {
      console.log(`ℹ️ Intake with prescription already exists`);
    }

    // Create sample lab report
    console.log('\n🔬 Creating sample lab report...');
    const existingReport = await LabReport.findOne({ patientId: patient._id });
    if (!existingReport) {
      const labReport = await LabReport.create({
        patientId: patient._id,
        appointmentId: appointment._id,
        testType: 'Complete Blood Count',
        results: {
          'Hemoglobin': '14.5 g/dL',
          'WBC Count': '7500 /μL',
          'RBC Count': '4.8 million/μL',
          'Platelet Count': '250000 /μL',
          'Hematocrit': '42%'
        },
        uploadedBy: doctor._id,
        rawText: 'Complete Blood Count test results',
        enhancedText: 'All values within normal range',
        metadata: {
          category: 'Hematology',
          priority: 'Normal',
          notes: 'Routine health checkup'
        }
      });
      console.log(`✅ Sample lab report created: ${labReport._id}`);
    } else {
      console.log(`ℹ️ Lab report already exists`);
    }

    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📊 Summary:');
    console.log(`  - Doctor: ${doctor.email}`);
    console.log(`  - Patient: ${patient.patientCode} - ${patient.name}`);
    console.log(`  - Medicines: ${createdMedicines.length} items`);
    console.log(`  - Batches: ${createdMedicines.length} batches created`);
    console.log(`  - Appointment: Created/Exists`);
    console.log(`  - Intake with Prescription: Created/Exists`);
    console.log(`  - Lab Report: Created/Exists`);
    console.log('\n✅ You can now test pharmacy and pathology modules!');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    process.exit(1);
  }
}

createSampleData();

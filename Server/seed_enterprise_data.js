/**
 * Enterprise Grade Data Seeding Script
 * 
 * This script:
 * 1. Keeps only specified user credentials
 * 2. Resets all collections
 * 3. Seeds 50 patients with complete data
 * 4. Seeds 50 appointments
 * 5. Seeds 50 staff members
 * 6. Seeds 50 medicines with batches
 * 7. Creates 5 prescriptions per patient
 * 8. Creates 5 medical history entries per patient
 * 9. Creates 5 lab results per patient
 * 10. Creates billing records for each patient
 * 
 * Usage: node seed_enterprise_data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load Models
const { User, Patient, Appointment, Intake, Medicine, MedicineBatch, Staff, LabReport } = require('./Models');

// Get additional models separately
const PharmacyRecord = require('./Models/PharmacyRecord');
const Invoice = require('./Models/Invoice');

// MongoDB URI
const MONGO_URI = process.env.MANGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/hms';

// Credentials to keep
const USERS_TO_KEEP = [
  {
    email: 'banu@karurgastro.com',
    password: 'Banu@123',
    role: 'admin',
    name: 'Dr. Banu'
  },
  {
    email: 'dr.sanjit@karurgastro.com',
    password: 'Doctor@123',
    role: 'doctor',
    name: 'Dr. Sanjit'
  },
  {
    email: 'dr.sriram@karurgastro.com',
    password: 'Doctor@123',
    role: 'doctor',
    name: 'Dr. Sriram'
  },
  {
    email: 'pharmacist@hms.com',
    password: '12332112',
    role: 'pharmacist',
    name: 'Pharmacist'
  },
  {
    email: 'pathologist@hms.com',
    password: '12332112',
    role: 'pathologist',
    name: 'Pathologist'
  }
];

// Sample data arrays
const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Karthik', 'Divya',
  'Arun', 'Meera', 'Suresh', 'Lakshmi', 'Ramesh', 'Kavitha', 'Prakash', 'Deepa',
  'Ganesh', 'Mythili', 'Kumar', 'Radha', 'Vijay', 'Saranya', 'Bala', 'Revathi',
  'Mohan', 'Nithya', 'Senthil', 'Vasantha', 'Ravi', 'Sangeetha', 'Krishna', 'Janaki',
  'Mani', 'Shanthi', 'Selva', 'Geetha', 'Raja', 'Padma', 'Kannan', 'Sujatha',
  'Muthu', 'Valli', 'Arjun', 'Lalitha', 'Dinesh', 'Chitra', 'Saravanan', 'Usha',
  'Ramki', 'Pushpa'
];

const LAST_NAMES = [
  'Kumar', 'Devi', 'Raj', 'Lakshmi', 'Krishnan', 'Subramanian', 'Iyer', 'Menon',
  'Reddy', 'Naidu', 'Pillai', 'Nair', 'Sharma', 'Patel', 'Mudaliar', 'Chettiar',
  'Rao', 'Murthy', 'Sundaram', 'Raman', 'Venkat', 'Srinivasan', 'Balaji', 'Swamy'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CITIES = [
  'Karur', 'Tiruchirappalli', 'Namakkal', 'Salem', 'Erode', 'Coimbatore',
  'Madurai', 'Chennai', 'Thanjavur', 'Dindigul'
];

const STREETS = [
  'Gandhi Road', 'Anna Salai', 'Main Street', 'Station Road', 'Temple Street',
  'Market Road', 'NH Road', 'Church Street', 'Park Avenue', 'Lake View Road'
];

// Sample lab technician names
const LAB_TECHNICIANS = [
  'Ramesh Kumar (MLT)',
  'Priya Sharma (Lab Tech)',
  'Suresh Patel (MLT)',
  'Kavitha Devi (Lab Tech)',
  'Rajesh Kumar (Senior MLT)',
  'Meena Lakshmi (Lab Tech)',
  'Vijay Kumar (MLT)',
  'Sangeetha R (Lab Tech)'
];

const MEDICAL_CONDITIONS = [
  'Diabetes Type 2', 'Hypertension', 'Asthma', 'Gastritis', 'Arthritis',
  'Thyroid Disorder', 'Migraine', 'GERD', 'Cholesterol', 'Anxiety'
];

const APPOINTMENT_REASONS = [
  'General Checkup', 'Follow-up Visit', 'Fever', 'Stomach Pain', 'Headache',
  'Chest Pain', 'Back Pain', 'Skin Rash', 'Cough and Cold', 'Diabetes Review'
];

const LAB_TESTS = [
  'Complete Blood Count', 'Lipid Profile', 'Liver Function Test', 'Kidney Function Test',
  'Thyroid Profile', 'Blood Sugar Fasting', 'HbA1c', 'Urine Analysis', 'X-Ray Chest', 'ECG'
];

const MEDICINES = [
  { name: 'Metformin 500mg', category: 'Diabetes', price: 5 },
  { name: 'Amlodipine 5mg', category: 'Hypertension', price: 3 },
  { name: 'Atorvastatin 10mg', category: 'Cholesterol', price: 8 },
  { name: 'Paracetamol 650mg', category: 'Analgesic', price: 2 },
  { name: 'Amoxicillin 500mg', category: 'Antibiotic', price: 10 },
  { name: 'Omeprazole 20mg', category: 'Gastric', price: 4 },
  { name: 'Levothyroxine 50mcg', category: 'Thyroid', price: 6 },
  { name: 'Aspirin 75mg', category: 'Cardiac', price: 2 },
  { name: 'Clopidogrel 75mg', category: 'Cardiac', price: 12 },
  { name: 'Cetirizine 10mg', category: 'Antihistamine', price: 3 }
];

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
}

// Helper Functions
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone() {
  return `+91${randomInt(6000000000, 9999999999)}`;
}

function generateEmail(firstName, lastName) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
}

// Reset Collections (keeping specified users)
async function resetCollections() {
  console.log('🗑️  Resetting collections...');
  
  const collections = mongoose.connection.collections;
  
  // Delete all except specified users
  if (collections.users) {
    const keepEmails = USERS_TO_KEEP.map(u => u.email);
    await collections.users.deleteMany({ email: { $nin: keepEmails } });
    console.log('   ✓ Users cleaned (kept specified credentials)');
  }
  
  // Delete other collections completely
  const collectionsToReset = [
    'patients', 'appointments', 'intakes', 'prescriptions', 'labreports',
    'invoices', 'medicines', 'medicinebatches', 'staff', 'payrolls'
  ];
  
  for (const collName of collectionsToReset) {
    if (collections[collName]) {
      await collections[collName].deleteMany({});
      console.log(`   ✓ ${collName} cleared`);
    }
  }
}

// Ensure User Credentials
async function ensureUsers() {
  console.log('👤 Ensuring user credentials...');
  
  for (const userData of USERS_TO_KEEP) {
    const existing = await User.findOne({ email: userData.email });
    
    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        _id: uuidv4(),
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        userProfile: {
          firstName: userData.name.split(' ')[0] || userData.name,
          lastName: userData.name.split(' ')[1] || '',
          name: userData.name
        }
      });
      console.log(`   ✓ Created user: ${userData.email}`);
    } else {
      console.log(`   ✓ User exists: ${userData.email}`);
    }
  }
}

// Seed Medicines
async function seedMedicines() {
  console.log('💊 Seeding medicines...');
  
  const createdMedicines = [];
  
  for (let i = 0; i < 50; i++) {
    const medicine = MEDICINES[i % MEDICINES.length];
    const medicineId = uuidv4();
    
    const medicineDoc = await Medicine.create({
      _id: medicineId,
      name: `${medicine.name} - Brand ${Math.floor(i / 10) + 1}`,
      genericName: medicine.name.split(' ')[0],
      category: medicine.category,
      manufacturer: `Pharma Co ${randomInt(1, 10)}`,
      description: `High quality ${medicine.category} medication`,
      price: medicine.price + randomInt(0, 5),
      reorderLevel: randomInt(10, 50),
      unit: 'Tablets'
    });
    
    // Create 2-3 batches per medicine
    for (let b = 0; b < randomInt(2, 3); b++) {
      await MedicineBatch.create({
        _id: uuidv4(),
        medicineId: medicineId,
        batchNumber: `BATCH${i}${b}${randomInt(1000, 9999)}`,
        quantity: randomInt(100, 1000),
        expiryDate: randomDate(new Date(2025, 0, 1), new Date(2027, 11, 31)),
        manufacturingDate: new Date(2024, randomInt(0, 11), randomInt(1, 28)),
        mrp: medicine.price + randomInt(1, 10),
        purchasePrice: medicine.price,
        supplierName: `Supplier ${randomInt(1, 5)}`
      });
    }
    
    createdMedicines.push(medicineDoc);
  }
  
  console.log(`   ✓ Created ${createdMedicines.length} medicines with batches`);
  return createdMedicines;
}

// Seed Staff
async function seedStaff() {
  console.log('👥 Seeding staff...');
  
  const designations = ['Nurse', 'Receptionist', 'Technician', 'Accountant', 'Assistant'];
  const departments = ['OPD', 'Emergency', 'Laboratory', 'Pharmacy', 'Administration'];
  
  for (let i = 0; i < 50; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    
    await Staff.create({
      _id: uuidv4(),
      name,
      patientFacingId: `STF${String(i + 1).padStart(3, '0')}`,
      designation: randomItem(designations),
      department: randomItem(departments),
      contact: generatePhone(),
      email: generateEmail(firstName, lastName),
      gender: randomInt(0, 1) === 0 ? 'Male' : 'Female',
      status: randomItem(['Available', 'Off Duty', 'On Leave', 'On Call']),
      joinedAt: randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31)),
      experienceYears: randomInt(1, 15),
      metadata: {
        salary: randomInt(15000, 50000),
        address: {
          street: randomItem(STREETS),
          city: randomItem(CITIES),
          state: 'Tamil Nadu',
          pincode: String(randomInt(600000, 699999))
        }
      }
    });
  }
  
  console.log('   ✓ Created 50 staff members');
}

// Seed Patients with Complete Data
async function seedPatientsWithData(medicines) {
  console.log('🏥 Seeding patients with complete data...');
  
  // Get doctors
  const doctors = await User.find({ role: 'doctor' });
  
  for (let i = 0; i < 50; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const patientId = uuidv4();
    const patientCode = `PAT${String(i + 1).padStart(3, '0')}`;
    
    // Create Patient
    const patient = await Patient.create({
      _id: patientId,
      patientCode: patientCode,
      firstName,
      lastName,
      dateOfBirth: randomDate(new Date(1950, 0, 1), new Date(2010, 11, 31)),
      age: randomInt(15, 75),
      gender: randomInt(0, 1) === 0 ? 'Male' : 'Female',
      bloodGroup: randomItem(BLOOD_GROUPS),
      phone: generatePhone(),
      email: generateEmail(firstName, lastName),
      address: {
        houseNo: String(randomInt(1, 500)),
        street: randomItem(STREETS),
        city: randomItem(CITIES),
        state: 'Tamil Nadu',
        pincode: String(randomInt(600000, 699999)),
        country: 'India'
      },
      vitals: {
        heightCm: randomInt(150, 185),
        weightKg: randomInt(45, 95),
        bmi: (randomInt(18, 30) + Math.random()).toFixed(1),
        bp: `${randomInt(110, 140)}/${randomInt(70, 90)}`,
        pulse: randomInt(60, 90),
        temp: (36 + Math.random() * 2).toFixed(1),
        spo2: randomInt(95, 100)
      },
      doctorId: randomItem(doctors)._id,
      allergies: randomInt(0, 1) === 0 ? ['Penicillin'] : [],
      notes: `Patient has history of ${randomItem(MEDICAL_CONDITIONS)}`,
      metadata: {
        patientCode: patientCode,
        medicalHistory: {
          currentConditions: [randomItem(MEDICAL_CONDITIONS), randomItem(MEDICAL_CONDITIONS)]
        },
        diagnosis: [randomItem(MEDICAL_CONDITIONS)],
        emergencyContactName: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
        emergencyContactPhone: generatePhone()
      }
    });
    
    console.log(`   Patient ${i + 1}/50: ${firstName} ${lastName} (${patientCode})`);
    
    // Create 5 Appointments for this patient
    for (let a = 0; a < 5; a++) {
      const appointmentDate = randomDate(new Date(2024, 0, 1), new Date());
      const appointmentId = uuidv4();
      
      await Appointment.create({
        _id: appointmentId,
        patientId: patientId,
        clientName: `${firstName} ${lastName}`,
        doctorId: randomItem(doctors)._id,
        date: appointmentDate.toISOString().split('T')[0],
        time: `${String(randomInt(9, 17)).padStart(2, '0')}:${randomInt(0, 1) === 0 ? '00' : '30'}`,
        startAt: appointmentDate,
        reason: randomItem(APPOINTMENT_REASONS),
        status: randomItem(['Scheduled', 'Confirmed', 'Completed']),
        appointmentType: 'Consultation',
        metadata: {
          patientCode: patientCode,
          gender: patient.gender
        }
      });
    }
    
    // Create 5 Prescriptions (Pharmacy Records)
    for (let p = 0; p < 5; p++) {
      const prescriptionDate = randomDate(new Date(2024, 0, 1), new Date());
      const selectedMedicines = [];
      let total = 0;
      
      for (let m = 0; m < randomInt(2, 4); m++) {
        const medicine = randomItem(medicines);
        const quantity = randomInt(10, 30);
        const unitPrice = Number(medicine.price) || 10;
        const lineTotal = quantity * unitPrice;
        total += lineTotal;
        
        selectedMedicines.push({
          medicineId: medicine._id,
          name: medicine.name,
          dosage: `${randomInt(1, 2)} tablet`,
          frequency: randomItem(['Once daily', 'Twice daily', 'Thrice daily']),
          duration: `${randomInt(5, 30)} days`,
          notes: 'After food',
          quantity: quantity,
          unitPrice: unitPrice,
          lineTotal: lineTotal
        });
      }
      
      await PharmacyRecord.create({
        _id: uuidv4(),
        type: 'Dispense',
        patientId: patientId,
        appointmentId: null,
        items: selectedMedicines,
        total: Math.round(total * 100) / 100,
        paid: randomInt(0, 1) === 0,
        paymentMethod: randomItem(['Cash', 'Card', 'UPI']),
        createdAt: prescriptionDate,
        metadata: {
          patientName: `${firstName} ${lastName}`,
          patientCode: patientCode,
          doctorId: randomItem(doctors)._id
        }
      });
    }
    
    // Create 5 Lab Results
    for (let l = 0; l < 5; l++) {
      const labDate = randomDate(new Date(2024, 0, 1), new Date());
      
      await LabReport.create({
        _id: uuidv4(),
        patientId: patientId,
        patientName: `${firstName} ${lastName}`,
        patientCode: patientCode,
        testName: randomItem(LAB_TESTS),
        testType: randomItem(['Blood Test', 'Urine Test', 'Imaging', 'ECG']),
        collectionDate: labDate,
        reportDate: new Date(labDate.getTime() + 24 * 60 * 60 * 1000),
        status: randomItem(['Completed', 'Pending']),
        doctorName: randomItem(doctors).userProfile?.name || 'Dr. Unknown',
        technician: randomItem(LAB_TECHNICIANS),
        remarks: 'Normal range',
        testResults: [
          { parameter: 'Hemoglobin', value: `${randomInt(12, 16)} g/dL`, normalRange: '12-16 g/dL', status: 'Normal' },
          { parameter: 'WBC Count', value: `${randomInt(4000, 11000)}/μL`, normalRange: '4000-11000/μL', status: 'Normal' }
        ]
      });
    }
    
    console.log(`   ✓ Patient ${i + 1}/50 created with 5 appointments, 5 prescriptions, 5 lab results`);
  }
  
  console.log('   ✓ Created 50 patients with:');
  console.log('     - 250 appointments (5 per patient)');
  console.log('     - 250 prescriptions (5 per patient)');
  console.log('     - 250 lab results (5 per patient)');
}

// Main Execution
async function main() {
  console.log('🚀 Starting Enterprise Data Seeding...\n');
  
  try {
    await connectDB();
    
    // Step 1: Reset collections
    await resetCollections();
    
    // Step 2: Ensure user credentials
    await ensureUsers();
    
    // Step 3: Seed medicines
    const medicines = await seedMedicines();
    
    // Step 4: Seed staff
    await seedStaff();
    
    // Step 5: Seed patients with all related data
    await seedPatientsWithData(medicines);
    
    console.log('\n✅ Enterprise data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 5 Users (kept existing credentials)');
    console.log('   - 50 Medicines with batches');
    console.log('   - 50 Staff members');
    console.log('   - 50 Patients with complete profiles');
    console.log('   - 250 Appointments');
    console.log('   - 250 Prescriptions');
    console.log('   - 250 Lab Results');
    console.log('\n🔐 Login Credentials:');
    USERS_TO_KEEP.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the script
main();

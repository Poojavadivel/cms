// Server/seed_complete_data.js
// Enterprise HMS Data Simulator - Generates realistic hospital data
// Creates: Patients, Staff, Doctors, Appointments, Prescriptions, Lab Reports, Payroll, etc.

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Import all models
const {
  User,
  Staff,
  Patient,
  Appointment,
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  LabReport,
  Intake,
  Payroll,
  PatientPDF,
  PrescriptionDocument,
  LabReportDocument,
  MedicalHistoryDocument
} = require('./Models');

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  NUM_PATIENTS: 20,
  NUM_STAFF: 10,
  NUM_APPOINTMENTS_PER_PATIENT: 3,
  NUM_PRESCRIPTIONS_PER_APPOINTMENT: 1,
  NUM_LAB_REPORTS_PER_PATIENT: 2,
  DOCTORS: [
    {
      firstName: 'Sanjit',
      lastName: 'Kumar',
      email: 'dr.sanjit@karurgastro.com',
      phone: '+919876543210',
      specialization: 'Gastroenterology',
      department: 'Gastroenterology',
      experience: 15,
      qualification: 'MBBS, MD (Gastro)',
      consultationFee: 800
    },
    {
      firstName: 'Sriram',
      lastName: 'Iyer',
      email: 'dr.sriram@karurgastro.com',
      phone: '+919876543211',
      specialization: 'General Medicine',
      department: 'Medicine',
      experience: 12,
      qualification: 'MBBS, MD',
      consultationFee: 600
    }
  ]
};

// ============================================================================
// SAMPLE DATA BANKS
// ============================================================================
const FIRST_NAMES = {
  Male: ['Arjun', 'Vikram', 'Rahul', 'Karthik', 'Suresh', 'Rajesh', 'Arun', 'Praveen', 'Murali', 'Sanjay'],
  Female: ['Priya', 'Lakshmi', 'Divya', 'Anita', 'Kavya', 'Deepa', 'Sowmya', 'Meera', 'Sangeetha', 'Radha']
};

const LAST_NAMES = ['Kumar', 'Reddy', 'Sharma', 'Iyer', 'Nair', 'Patel', 'Raj', 'Krishnan', 'Menon', 'Rao'];

const CITIES = ['Karur', 'Trichy', 'Coimbatore', 'Erode', 'Salem', 'Madurai', 'Chennai', 'Namakkal'];

const STREETS = ['Main Street', 'Gandhi Road', 'MG Road', 'Nehru Street', 'Anna Salai', 'Bazaar Street', 'Temple Road'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMPLAINTS = [
  'Abdominal pain',
  'Chronic constipation',
  'Acid reflux and heartburn',
  'Loss of appetite',
  'Nausea and vomiting',
  'Bloating and gas',
  'Diarrhea',
  'Stomach ulcer symptoms',
  'Difficulty swallowing',
  'Blood in stool',
  'Jaundice symptoms',
  'Liver pain',
  'Gastritis',
  'Irritable bowel syndrome',
  'Food poisoning symptoms'
];

const ALLERGIES = [
  'Penicillin',
  'Sulfa drugs',
  'Aspirin',
  'NSAIDs',
  'Lactose',
  'Gluten',
  'Shellfish',
  'Nuts',
  'None'
];

const MEDICINES_CATALOG = [
  { name: 'Omeprazole', genericName: 'Omeprazole', form: 'Capsule', strength: '20mg', category: 'Antacid' },
  { name: 'Ranitidine', genericName: 'Ranitidine', form: 'Tablet', strength: '150mg', category: 'H2 Blocker' },
  { name: 'Pantoprazole', genericName: 'Pantoprazole', form: 'Tablet', strength: '40mg', category: 'PPI' },
  { name: 'Metoclopramide', genericName: 'Metoclopramide', form: 'Tablet', strength: '10mg', category: 'Antiemetic' },
  { name: 'Domperidone', genericName: 'Domperidone', form: 'Tablet', strength: '10mg', category: 'Prokinetic' },
  { name: 'Loperamide', genericName: 'Loperamide', form: 'Capsule', strength: '2mg', category: 'Antidiarrheal' },
  { name: 'Bisacodyl', genericName: 'Bisacodyl', form: 'Tablet', strength: '5mg', category: 'Laxative' },
  { name: 'Mebeverine', genericName: 'Mebeverine', form: 'Tablet', strength: '135mg', category: 'Antispasmodic' },
  { name: 'Ciprofloxacin', genericName: 'Ciprofloxacin', form: 'Tablet', strength: '500mg', category: 'Antibiotic' },
  { name: 'Paracetamol', genericName: 'Acetaminophen', form: 'Tablet', strength: '500mg', category: 'Analgesic' },
  { name: 'Ibuprofen', genericName: 'Ibuprofen', form: 'Tablet', strength: '400mg', category: 'NSAID' },
  { name: 'Simethicone', genericName: 'Simethicone', form: 'Syrup', strength: '40mg/5ml', category: 'Anti-gas' },
  { name: 'Lactulose', genericName: 'Lactulose', form: 'Syrup', strength: '10g/15ml', category: 'Laxative' },
  { name: 'Ondansetron', genericName: 'Ondansetron', form: 'Tablet', strength: '4mg', category: 'Antiemetic' },
  { name: 'Probiotic', genericName: 'Lactobacillus', form: 'Capsule', strength: '1B CFU', category: 'Probiotic' }
];

const LAB_TESTS = [
  'Complete Blood Count (CBC)',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Lipid Profile',
  'Blood Glucose',
  'H. Pylori Test',
  'Stool Examination',
  'Ultrasound Abdomen',
  'Endoscopy',
  'Colonoscopy',
  'CT Scan Abdomen',
  'Thyroid Function Test'
];

const STAFF_DESIGNATIONS = [
  'Senior Nurse',
  'Staff Nurse',
  'Lab Technician',
  'Pharmacist',
  'Receptionist',
  'Medical Assistant',
  'Ward Boy',
  'Cleaner',
  'Admin Staff',
  'IT Support'
];

const DEPARTMENTS = ['Gastroenterology', 'Medicine', 'Pharmacy', 'Laboratory', 'Administration', 'Support'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone() {
  return `+91${randomInt(7000000000, 9999999999)}`;
}

function generateEmail(firstName, lastName) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
}

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateBMI(heightCm, weightKg) {
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(2);
}

function generateAppointmentCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `APT-${timestamp}-${random}`;
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

async function connectDB() {
  const mongoUrl = process.env.MONGODB_URL || process.env.MANGODB_URL;
  if (!mongoUrl) {
    throw new Error('MONGODB_URL not found in .env file');
  }

  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB');
}

// ============================================================================
// DATA GENERATION FUNCTIONS
// ============================================================================

async function createDoctors() {
  console.log('\n📋 Creating Doctors...');
  const doctors = [];

  for (const docData of CONFIG.DOCTORS) {
    // Check if doctor already exists
    let doctor = await User.findOne({ email: docData.email });

    if (!doctor) {
      const hashedPassword = await bcrypt.hash('Doctor@123', 10);
      
      doctor = await User.create({
        _id: uuidv4(),
        role: 'doctor',
        firstName: docData.firstName,
        lastName: docData.lastName,
        email: docData.email,
        phone: docData.phone,
        password: hashedPassword,
        is_active: true,
        metadata: {
          specialization: docData.specialization,
          department: docData.department,
          experience: docData.experience,
          qualification: docData.qualification,
          consultationFee: docData.consultationFee,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          timings: '09:00 AM - 05:00 PM'
        }
      });
      console.log(`   ✓ Created doctor: Dr. ${doctor.firstName} ${doctor.lastName}`);
    } else {
      console.log(`   ℹ Doctor already exists: Dr. ${doctor.firstName} ${doctor.lastName}`);
    }

    // Create/Update Staff record for doctor
    let staffRecord = await Staff.findOne({ email: docData.email });
    if (!staffRecord) {
      staffRecord = await Staff.create({
        _id: uuidv4(),
        name: `Dr. ${docData.firstName} ${docData.lastName}`,
        designation: docData.specialization,
        department: docData.department,
        patientFacingId: `DOC${randomInt(100, 999)}`,
        contact: docData.phone,
        email: docData.email,
        gender: 'Male',
        status: 'Available',
        roles: ['doctor'],
        qualifications: [docData.qualification],
        experienceYears: docData.experience,
        joinedAt: new Date(2020, 0, 1),
        metadata: {
          userId: doctor._id,
          consultationFee: docData.consultationFee
        }
      });
      console.log(`   ✓ Created staff record for Dr. ${doctor.firstName}`);
    }

    doctors.push(doctor);
  }

  return doctors;
}

async function createMedicines() {
  console.log('\n💊 Creating Medicine Catalog...');
  const medicines = [];

  for (const medData of MEDICINES_CATALOG) {
    let medicine = await Medicine.findOne({ name: medData.name, strength: medData.strength });
    
    if (!medicine) {
      medicine = await Medicine.create({
        _id: uuidv4(),
        name: medData.name,
        genericName: medData.genericName,
        sku: `MED${randomInt(1000, 9999)}`,
        form: medData.form,
        strength: medData.strength,
        unit: 'pcs',
        manufacturer: randomElement(['Sun Pharma', 'Cipla', 'Dr. Reddy\'s', 'Lupin', 'Alkem']),
        brand: medData.name,
        category: medData.category,
        status: 'In Stock',
        metadata: {
          reorderLevel: 50,
          maxStock: 1000,
          price: randomInt(10, 500)
        }
      });

      // Create medicine batch
      await MedicineBatch.create({
        _id: uuidv4(),
        medicineId: medicine._id,
        batchNumber: `BATCH-${Date.now()}-${randomInt(100, 999)}`,
        quantity: randomInt(500, 1000),
        unitPrice: medicine.metadata.price,
        mrp: medicine.metadata.price * 1.2,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2), // 2 years from now
        manufacturedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        supplier: randomElement(['ABC Distributors', 'XYZ Medical Supplies', 'PQR Pharma'])
      });

      medicines.push(medicine);
    } else {
      medicines.push(medicine);
    }
  }

  console.log(`   ✓ Created ${medicines.length} medicines`);
  return medicines;
}

async function createPatients(doctors) {
  console.log('\n👥 Creating Patients...');
  const patients = [];

  for (let i = 0; i < CONFIG.NUM_PATIENTS; i++) {
    const gender = randomElement(['Male', 'Female']);
    const firstName = randomElement(FIRST_NAMES[gender]);
    const lastName = randomElement(LAST_NAMES);
    const dateOfBirth = randomDate(new Date(1950, 0, 1), new Date(2010, 0, 1));
    const age = calculateAge(dateOfBirth);
    const heightCm = randomInt(150, 185);
    const weightKg = randomInt(45, 95);
    const assignedDoctor = randomElement(doctors);

    const patient = await Patient.create({
      _id: uuidv4(),
      firstName,
      lastName,
      dateOfBirth,
      age,
      gender,
      bloodGroup: randomElement(BLOOD_GROUPS),
      phone: generatePhone(),
      email: Math.random() > 0.3 ? generateEmail(firstName, lastName) : null,
      address: {
        houseNo: `${randomInt(1, 999)}`,
        street: randomElement(STREETS),
        city: randomElement(CITIES),
        state: 'Tamil Nadu',
        pincode: `${randomInt(600000, 699999)}`,
        country: 'India'
      },
      vitals: {
        heightCm,
        weightKg,
        bmi: calculateBMI(heightCm, weightKg),
        bp: `${randomInt(110, 140)}/${randomInt(70, 90)}`,
        temp: randomInt(97, 99) + Math.random().toFixed(1),
        pulse: randomInt(60, 100),
        spo2: randomInt(95, 100)
      },
      doctorId: assignedDoctor._id,
      allergies: Math.random() > 0.5 ? [randomElement(ALLERGIES)] : [],
      notes: `Regular patient. ${randomElement(['Cooperative', 'Anxious', 'Calm', 'Elderly care needed'])}.`,
      metadata: {
        registrationDate: randomDate(new Date(2023, 0, 1), new Date()),
        insuranceProvider: Math.random() > 0.5 ? randomElement(['Star Health', 'ICICI Lombard', 'HDFC Ergo']) : null,
        emergencyContact: generatePhone()
      }
    });

    patients.push(patient);
    console.log(`   ✓ Created patient ${i + 1}/${CONFIG.NUM_PATIENTS}: ${firstName} ${lastName}`);
  }

  return patients;
}

async function createAppointments(patients, doctors, medicines) {
  console.log('\n📅 Creating Appointments...');
  let appointmentCount = 0;

  for (const patient of patients) {
    const numAppointments = randomInt(1, CONFIG.NUM_APPOINTMENTS_PER_PATIENT);
    const assignedDoctor = doctors.find(d => d._id === patient.doctorId) || randomElement(doctors);

    for (let i = 0; i < numAppointments; i++) {
      const appointmentDate = randomDate(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 days future
      );

      const isPast = appointmentDate < new Date();
      const status = isPast 
        ? randomElement(['Completed', 'Completed', 'Completed', 'No-Show', 'Cancelled'])
        : randomElement(['Scheduled', 'Scheduled', 'Scheduled', 'Rescheduled']);

      const appointment = await Appointment.create({
        _id: uuidv4(),
        appointmentCode: generateAppointmentCode(),
        patientId: patient._id,
        doctorId: assignedDoctor._id,
        appointmentType: randomElement(['Consultation', 'Follow-up', 'Emergency', 'Checkup']),
        startAt: appointmentDate,
        endAt: new Date(appointmentDate.getTime() + 30 * 60 * 1000), // 30 minutes
        location: 'Consultation Room ' + randomInt(1, 5),
        status,
        vitals: {
          bp: `${randomInt(110, 140)}/${randomInt(70, 90)}`,
          temp: randomInt(97, 99) + Math.random().toFixed(1),
          pulse: randomInt(60, 100),
          spo2: randomInt(95, 100)
        },
        notes: randomElement(COMPLAINTS),
        metadata: {
          chiefComplaint: randomElement(COMPLAINTS),
          diagnosis: status === 'Completed' ? randomElement(['Gastritis', 'GERD', 'IBS', 'Gastroenteritis', 'Peptic Ulcer']) : null,
          treatmentPlan: status === 'Completed' ? 'Prescribed medication and diet plan' : null
        },
        followUp: {
          isFollowUp: i > 0,
          isRequired: Math.random() > 0.5,
          reason: Math.random() > 0.5 ? 'Monitor medication response' : '',
          priority: randomElement(['Routine', 'Important', 'Urgent']),
          recommendedDate: status === 'Completed' && Math.random() > 0.5 
            ? new Date(appointmentDate.getTime() + 14 * 24 * 60 * 60 * 1000)
            : null
        }
      });

      appointmentCount++;

      // Create prescription for completed appointments
      if (status === 'Completed' && Math.random() > 0.2) {
        await createPrescription(patient, appointment, assignedDoctor, medicines);
      }

      // Create intake form for some appointments
      if (i === 0 && Math.random() > 0.5) {
        await createIntakeForm(patient, appointment, assignedDoctor);
      }
    }
  }

  console.log(`   ✓ Created ${appointmentCount} appointments`);
}

async function createPrescription(patient, appointment, doctor, medicines) {
  const numMedicines = randomInt(2, 5);
  const selectedMedicines = [];

  for (let i = 0; i < numMedicines; i++) {
    const medicine = randomElement(medicines);
    selectedMedicines.push({
      medicineId: medicine._id,
      name: medicine.name,
      dosage: randomElement(['1-0-1', '1-1-1', '0-0-1', '1-0-0']),
      frequency: randomElement(['After food', 'Before food', 'With food']),
      duration: randomElement(['3 days', '5 days', '7 days', '10 days', '14 days']),
      quantity: randomInt(5, 30)
    });
  }

  // Add to patient's prescription array
  const prescriptionData = {
    prescriptionId: uuidv4(),
    appointmentId: appointment._id,
    doctorId: doctor._id,
    medicines: selectedMedicines,
    notes: randomElement([
      'Take medicines as prescribed. Follow up if symptoms persist.',
      'Complete the full course. Avoid spicy food.',
      'Take on time. Drink plenty of water.',
      'Follow dietary restrictions. Rest adequately.'
    ]),
    issuedAt: appointment.startAt
  };

  await Patient.findByIdAndUpdate(patient._id, {
    $push: { prescriptions: prescriptionData }
  });

  // Create pharmacy dispense record
  const pharmacyItems = selectedMedicines.map(med => ({
    medicineId: med.medicineId,
    sku: `MED${randomInt(1000, 9999)}`,
    name: med.name,
    dosage: med.dosage,
    frequency: med.frequency,
    duration: med.duration,
    quantity: med.quantity,
    unitPrice: randomInt(10, 100),
    taxPercent: 5,
    lineTotal: med.quantity * randomInt(10, 100)
  }));

  await PharmacyRecord.create({
    _id: uuidv4(),
    type: 'Dispense',
    patientId: patient._id,
    appointmentId: appointment._id,
    items: pharmacyItems,
    total: pharmacyItems.reduce((sum, item) => sum + item.lineTotal, 0),
    paid: Math.random() > 0.2,
    paymentMethod: randomElement(['Cash', 'Card', 'UPI', 'Insurance']),
    notes: 'Prescription dispensed',
    metadata: { dispensedBy: 'Pharmacist' }
  });

  // Create dummy PDF file for prescription
  const dummyPdfData = Buffer.from('Sample prescription PDF data');
  const patientPdf = await PatientPDF.create({
    _id: uuidv4(),
    patientId: patient._id,
    title: 'Prescription',
    fileName: `prescription_${Date.now()}.pdf`,
    mimeType: 'application/pdf',
    data: dummyPdfData,
    size: dummyPdfData.length,
    uploadedAt: appointment.startAt
  });

  // Create prescription document record
  await PrescriptionDocument.create({
    _id: uuidv4(),
    patientId: patient._id,
    pdfId: patientPdf._id,
    doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
    hospitalName: 'Karur Gastro Foundation',
    prescriptionDate: appointment.startAt,
    medicines: selectedMedicines.map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: prescriptionData.notes
    })),
    diagnosis: appointment.metadata?.diagnosis || 'See notes',
    instructions: prescriptionData.notes,
    ocrText: `Prescription for ${patient.firstName} ${patient.lastName}`,
    ocrEngine: 'manual',
    ocrConfidence: 100,
    status: 'completed',
    uploadedBy: doctor._id,
    uploadDate: appointment.startAt
  });
}

async function createIntakeForm(patient, appointment, doctor) {
  await Intake.create({
    _id: uuidv4(),
    patientId: patient._id,
    patientSnapshot: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email
    },
    doctorId: doctor._id,
    appointmentId: appointment._id,
    triage: {
      chiefComplaint: randomElement(COMPLAINTS),
      vitals: patient.vitals,
      priority: randomElement(['Normal', 'Urgent', 'Emergency']),
      triageCategory: randomElement(['Green', 'Yellow', 'Red'])
    },
    consent: {
      consentGiven: true,
      consentAt: new Date(),
      consentBy: 'digital'
    },
    notes: 'Initial assessment completed',
    status: 'Converted',
    createdBy: doctor._id,
    convertedAt: appointment.startAt
  });
}

async function createLabReports(patients) {
  console.log('\n🔬 Creating Lab Reports...');
  let reportCount = 0;

  for (const patient of patients) {
    const numReports = randomInt(1, CONFIG.NUM_LAB_REPORTS_PER_PATIENT);

    for (let i = 0; i < numReports; i++) {
      const testType = randomElement(LAB_TESTS);
      const reportDate = randomDate(
        new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        new Date()
      );

      const results = generateLabResults(testType);

      await LabReport.create({
        _id: uuidv4(),
        patientId: patient._id,
        testType,
        testCategory: randomElement(['Blood Test', 'Imaging', 'Endoscopy', 'Stool Test']),
        results,
        rawText: `Test: ${testType}\nResults: ${JSON.stringify(results, null, 2)}`,
        metadata: {
          reportDate,
          lab: 'Karur Gastro Lab',
          technician: randomElement(['John', 'Mary', 'Kumar', 'Lakshmi']),
          status: 'Completed'
        }
      });

      // Create dummy PDF file for lab report
      const dummyPdfData = Buffer.from(`Lab Report: ${testType}\nPatient: ${patient.firstName} ${patient.lastName}\nDate: ${reportDate.toISOString()}`);
      const labPdf = await PatientPDF.create({
        _id: uuidv4(),
        patientId: patient._id,
        title: `Lab Report - ${testType}`,
        fileName: `lab_report_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
        data: dummyPdfData,
        size: dummyPdfData.length,
        uploadedAt: reportDate
      });

      // Create lab report document
      const resultsArray = Object.entries(results).map(([key, value]) => ({
        testName: key,
        value: String(value),
        unit: '',
        referenceRange: '',
        flag: 'normal'
      }));

      await LabReportDocument.create({
        _id: uuidv4(),
        patientId: patient._id,
        pdfId: labPdf._id,
        testType,
        testCategory: randomElement(['Blood Test', 'Imaging', 'Endoscopy', 'Stool Test']),
        labName: 'Karur Gastro Lab',
        reportDate,
        results: resultsArray,
        ocrText: `Test: ${testType}\nResults: ${JSON.stringify(results, null, 2)}`,
        ocrEngine: 'manual',
        ocrConfidence: 95,
        extractedData: results,
        extractionQuality: 'good',
        status: 'completed',
        uploadDate: reportDate
      });

      reportCount++;
    }
  }

  console.log(`   ✓ Created ${reportCount} lab reports`);
}

function generateLabResults(testType) {
  const results = {};

  switch (testType) {
    case 'Complete Blood Count (CBC)':
      results.hemoglobin = randomInt(11, 16) + Math.random().toFixed(1);
      results.wbc = randomInt(4000, 11000);
      results.platelets = randomInt(150000, 400000);
      results.rbc = randomInt(4, 6) + Math.random().toFixed(2);
      break;
    case 'Liver Function Test (LFT)':
      results.bilirubin = randomInt(0, 1) + Math.random().toFixed(2);
      results.sgot = randomInt(10, 40);
      results.sgpt = randomInt(10, 40);
      results.alkalinePhosphatase = randomInt(40, 120);
      break;
    case 'Kidney Function Test (KFT)':
      results.creatinine = randomInt(0, 1) + Math.random().toFixed(2);
      results.urea = randomInt(15, 45);
      results.uricAcid = randomInt(3, 7);
      break;
    case 'Blood Glucose':
      results.fasting = randomInt(70, 110);
      results.postprandial = randomInt(100, 140);
      results.hba1c = randomInt(4, 6) + Math.random().toFixed(1);
      break;
    default:
      results.status = randomElement(['Normal', 'Abnormal', 'Borderline']);
      results.findings = `Test completed. ${results.status} results observed.`;
  }

  return results;
}

async function createStaff() {
  console.log('\n👷 Creating Staff Members...');
  const staff = [];

  for (let i = 0; i < CONFIG.NUM_STAFF; i++) {
    const gender = randomElement(['Male', 'Female']);
    const firstName = randomElement(FIRST_NAMES[gender]);
    const lastName = randomElement(LAST_NAMES);
    const designation = randomElement(STAFF_DESIGNATIONS);
    const department = randomElement(DEPARTMENTS);
    const joinDate = randomDate(new Date(2015, 0, 1), new Date(2023, 0, 1));

    const staffMember = await Staff.create({
      _id: uuidv4(),
      name: `${firstName} ${lastName}`,
      designation,
      department,
      patientFacingId: `EMP${randomInt(1000, 9999)}`,
      contact: generatePhone(),
      email: generateEmail(firstName, lastName),
      gender,
      status: randomElement(['Available', 'Available', 'Available', 'On Leave']),
      shift: randomElement(['Morning', 'Evening', 'Night', 'General']),
      roles: [designation.toLowerCase().replace(' ', '_')],
      qualifications: [randomElement(['BSc Nursing', 'Diploma', 'MSc', 'BTech', 'Certification'])],
      experienceYears: Math.floor((new Date() - joinDate) / (365 * 24 * 60 * 60 * 1000)),
      joinedAt: joinDate,
      metadata: {
        employeeCode: `EMP${randomInt(1000, 9999)}`,
        aadhar: `${randomInt(1000, 9999)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        pan: `${randomElement(['A', 'B', 'C'])}${randomElement(['A', 'B', 'C'])}${randomElement(['A', 'B', 'C'])}${randomElement(['P', 'C', 'H'])}${randomElement(['A', 'B', 'C'])}${randomInt(1000, 9999)}${randomElement(['A', 'B', 'C'])}`
      }
    });

    staff.push(staffMember);
    console.log(`   ✓ Created staff ${i + 1}/${CONFIG.NUM_STAFF}: ${staffMember.name}`);
  }

  return staff;
}

async function createPayroll(staff) {
  console.log('\n💰 Creating Payroll Records...');
  let payrollCount = 0;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Generate payroll for last 3 months
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    let month = currentMonth - monthOffset;
    let year = currentYear;

    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    for (const staffMember of staff) {
      const basicSalary = calculateBasicSalary(staffMember.designation);
      const hra = basicSalary * 0.4;
      const da = basicSalary * 0.15;
      const conveyance = 1600;
      const medical = 1250;

      const earnings = [
        { name: 'HRA', type: 'earning', amount: hra, isTaxable: true },
        { name: 'DA', type: 'earning', amount: da, isTaxable: true },
        { name: 'Conveyance', type: 'earning', amount: conveyance, isTaxable: false },
        { name: 'Medical Allowance', type: 'earning', amount: medical, isTaxable: false }
      ];

      const pfAmount = Math.min(basicSalary, 15000) * 0.12;
      const esiAmount = (basicSalary + hra + da) < 21000 ? (basicSalary + hra + da) * 0.0075 : 0;
      const pt = basicSalary > 15000 ? 200 : 0;

      const deductions = [
        { name: 'PF', type: 'deduction', amount: pfAmount, isStatutory: true, isTaxable: false },
        { name: 'Professional Tax', type: 'deduction', amount: pt, isStatutory: true, isTaxable: false }
      ];

      if (esiAmount > 0) {
        deductions.push({ name: 'ESI', type: 'deduction', amount: esiAmount, isStatutory: true, isTaxable: false });
      }

      const totalEarnings = basicSalary + earnings.reduce((sum, e) => sum + e.amount, 0);
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netSalary = totalEarnings - totalDeductions;

      const payrollStatus = monthOffset === 0 
        ? randomElement(['draft', 'pending', 'approved'])
        : 'paid';

      await Payroll.create({
        _id: uuidv4(),
        staffId: staffMember._id,
        staffName: staffMember.name,
        staffCode: staffMember.patientFacingId,
        department: staffMember.department,
        designation: staffMember.designation,
        email: staffMember.email,
        contact: staffMember.contact,
        payPeriodMonth: month,
        payPeriodYear: year,
        payPeriodStart: periodStart,
        payPeriodEnd: periodEnd,
        paymentDate: payrollStatus === 'paid' ? periodEnd : null,
        status: payrollStatus,
        basicSalary,
        earnings,
        deductions,
        totalEarnings,
        totalDeductions,
        grossSalary: totalEarnings,
        netSalary,
        ctc: (basicSalary * 12) + (hra * 12) + (da * 12) + (conveyance * 12) + (medical * 12),
        attendance: {
          totalDays: new Date(year, month, 0).getDate(),
          presentDays: randomInt(20, 26),
          absentDays: randomInt(0, 2),
          leaves: {
            casual: randomInt(0, 2),
            sick: randomInt(0, 1)
          }
        },
        statutory: {
          pfApplicable: true,
          esiApplicable: esiAmount > 0,
          ptApplicable: true,
          employeePF: pfAmount,
          employerPF: pfAmount,
          employeeESI: esiAmount,
          professionalTax: pt
        },
        paymentMode: 'bank_transfer',
        bankName: randomElement(['SBI', 'HDFC', 'ICICI', 'Axis Bank', 'Canara Bank']),
        accountNumber: `${randomInt(100000000000, 999999999999)}`,
        ifscCode: `${randomElement(['SBIN', 'HDFC', 'ICIC', 'UTIB'])}0${randomInt(100000, 999999)}`,
        metadata: {
          payrollCode: `PAY${year}${String(month).padStart(2, '0')}-${String(payrollCount + 1).padStart(4, '0')}`,
          generatedAt: new Date()
        }
      });

      payrollCount++;
    }
  }

  console.log(`   ✓ Created ${payrollCount} payroll records`);
}

function calculateBasicSalary(designation) {
  const salaryMap = {
    'Senior Nurse': 35000,
    'Staff Nurse': 25000,
    'Lab Technician': 22000,
    'Pharmacist': 28000,
    'Receptionist': 18000,
    'Medical Assistant': 20000,
    'Ward Boy': 15000,
    'Cleaner': 12000,
    'Admin Staff': 20000,
    'IT Support': 30000
  };

  return salaryMap[designation] || 20000;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function seedDatabase() {
  console.log('🚀 Starting Enterprise HMS Data Simulator...\n');
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    // Connect to database
    await connectDB();

    // Create data in order
    const doctors = await createDoctors();
    const medicines = await createMedicines();
    const patients = await createPatients(doctors);
    await createAppointments(patients, doctors, medicines);
    await createLabReports(patients);
    const staff = await createStaff();
    await createPayroll(staff);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ DATA SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   • Doctors: ${doctors.length}`);
    console.log(`   • Patients: ${patients.length}`);
    console.log(`   • Staff: ${staff.length}`);
    console.log(`   • Medicines: ${medicines.length}`);
    console.log(`   • Appointments: ~${patients.length * 2} (avg)`);
    console.log(`   • Lab Reports: ~${patients.length * CONFIG.NUM_LAB_REPORTS_PER_PATIENT}`);
    console.log(`   • Payroll Records: ${staff.length * 3} (3 months)`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Dr. Sanjit: dr.sanjit@karurgastro.com / Doctor@123');
    console.log('   Dr. Sriram: dr.sriram@karurgastro.com / Doctor@123');
    
    console.log('\n🎉 You can now use the application with sample data!');

  } catch (error) {
    console.error('\n❌ Error during data seeding:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();

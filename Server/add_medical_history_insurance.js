// Server/add_medical_history_insurance.js
// Add comprehensive medical history, emergency contacts, and insurance details to all patients

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const { Patient, MedicalHistoryDocument, PatientPDF } = require('./Models');

// ============================================================================
// SAMPLE DATA BANKS
// ============================================================================

const MEDICAL_CONDITIONS = [
  'Hypertension',
  'Type 2 Diabetes',
  'Asthma',
  'Gastritis',
  'GERD (Acid Reflux)',
  'IBS (Irritable Bowel Syndrome)',
  'Migraine',
  'Arthritis',
  'Thyroid Disorder',
  'None'
];

const SURGERIES = [
  'Appendectomy',
  'Cholecystectomy (Gallbladder removal)',
  'Hernia Repair',
  'Caesarean Section',
  'Tonsillectomy',
  'Knee Surgery',
  'Endoscopy',
  'None'
];

const FAMILY_HISTORY = [
  'Heart Disease',
  'Diabetes',
  'Hypertension',
  'Cancer',
  'Asthma',
  'Kidney Disease',
  'Liver Disease',
  'Mental Health Issues',
  'None'
];

const MEDICATIONS = [
  'Metformin (Diabetes)',
  'Amlodipine (BP)',
  'Levothyroxine (Thyroid)',
  'Omeprazole (Acidity)',
  'Aspirin (Blood thinner)',
  'Multivitamins',
  'None'
];

const LIFESTYLE_HABITS = {
  smoking: ['Never', 'Former Smoker', 'Occasional', 'Regular'],
  alcohol: ['Never', 'Occasional', 'Social Drinker', 'Regular'],
  exercise: ['Sedentary', 'Light Activity', 'Moderate Activity', 'Very Active'],
  diet: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Mixed']
};

const INSURANCE_PROVIDERS = [
  'Star Health Insurance',
  'ICICI Lombard',
  'HDFC Ergo',
  'Max Bupa',
  'Care Health Insurance',
  'Bajaj Allianz',
  'Religare Health',
  'Apollo Munich',
  'Aditya Birla Health',
  'None'
];

const INSURANCE_TYPES = [
  'Individual Health Insurance',
  'Family Floater',
  'Senior Citizen Plan',
  'Corporate Group Insurance',
  'Critical Illness Cover',
  'Government Scheme (Ayushman Bharat)',
  'None'
];

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Relative'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePhone() {
  return `+91${randomInt(7000000000, 9999999999)}`;
}

function generatePolicyNumber() {
  const prefix = randomElement(['POL', 'HLT', 'MED', 'INS']);
  const numbers = randomInt(100000, 999999);
  const suffix = randomElement(['A', 'B', 'C', 'D']);
  return `${prefix}${numbers}${suffix}`;
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
  console.log('✅ Connected to MongoDB\n');
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

async function addMedicalHistoryToPatient(patient) {
  try {
    // Generate comprehensive medical history
    const medicalHistory = {
      // Current Conditions
      currentConditions: randomElements(MEDICAL_CONDITIONS, randomInt(0, 3)),
      
      // Past Medical History
      pastConditions: randomElements(MEDICAL_CONDITIONS, randomInt(0, 2)),
      surgeries: randomElements(SURGERIES, randomInt(0, 2)),
      hospitalizationsCount: randomInt(0, 5),
      
      // Current Medications
      currentMedications: randomElements(MEDICATIONS, randomInt(0, 3)),
      
      // Family History
      familyHistory: randomElements(FAMILY_HISTORY, randomInt(1, 3)),
      
      // Lifestyle
      lifestyle: {
        smoking: randomElement(LIFESTYLE_HABITS.smoking),
        alcohol: randomElement(LIFESTYLE_HABITS.alcohol),
        exercise: randomElement(LIFESTYLE_HABITS.exercise),
        diet: randomElement(LIFESTYLE_HABITS.diet),
        sleepHours: randomInt(5, 9),
        stressLevel: randomElement(['Low', 'Moderate', 'High'])
      },
      
      // Immunizations
      immunizations: {
        covidVaccine: Math.random() > 0.2,
        covidDoses: randomInt(2, 4),
        fluVaccine: Math.random() > 0.5,
        lastTetanus: new Date(Date.now() - randomInt(1, 10) * 365 * 24 * 60 * 60 * 1000)
      },
      
      // Women's Health (if female)
      ...(patient.gender === 'Female' && {
        womensHealth: {
          pregnant: false,
          pregnancies: randomInt(0, 3),
          lastMenstrualPeriod: new Date(Date.now() - randomInt(7, 30) * 24 * 60 * 60 * 1000),
          menopause: patient.age > 50 ? Math.random() > 0.5 : false
        }
      }),
      
      // Last Check-ups
      lastCheckups: {
        generalCheckup: new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000),
        dentalCheckup: new Date(Date.now() - randomInt(90, 730) * 24 * 60 * 60 * 1000),
        eyeCheckup: new Date(Date.now() - randomInt(180, 730) * 24 * 60 * 60 * 1000)
      },
      
      // Additional Notes
      notes: randomElement([
        'Patient is generally healthy and active.',
        'Requires regular monitoring due to chronic condition.',
        'Family history of diabetes, needs preventive care.',
        'Active lifestyle, minimal health concerns.',
        'Needs periodic follow-ups for existing conditions.'
      ]),
      
      lastUpdated: new Date()
    };

    // Emergency Contacts (1-2 contacts)
    const numContacts = randomInt(1, 2);
    const emergencyContacts = [];
    
    for (let i = 0; i < numContacts; i++) {
      emergencyContacts.push({
        name: randomElement([
          'Rajesh Kumar', 'Priya Sharma', 'Anita Reddy', 'Suresh Iyer',
          'Lakshmi Menon', 'Vijay Krishnan', 'Deepa Nair', 'Arun Patel'
        ]),
        relationship: randomElement(RELATIONSHIPS),
        phone: generatePhone(),
        alternatePhone: Math.random() > 0.5 ? generatePhone() : null,
        address: `${randomInt(1, 999)} ${randomElement(['MG Road', 'Gandhi Street', 'Anna Nagar', 'Market Street'])}, ${randomElement(['Karur', 'Trichy', 'Coimbatore'])}`,
        isPrimary: i === 0
      });
    }

    // Insurance Details
    const hasInsurance = Math.random() > 0.3; // 70% have insurance
    let insurance = null;

    if (hasInsurance) {
      const provider = randomElement(INSURANCE_PROVIDERS.filter(p => p !== 'None'));
      const insuranceType = randomElement(INSURANCE_TYPES.filter(t => t !== 'None'));
      
      insurance = {
        hasInsurance: true,
        provider,
        policyNumber: generatePolicyNumber(),
        policyType: insuranceType,
        coverageAmount: randomElement([100000, 200000, 300000, 500000, 1000000, 1500000]),
        validFrom: new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + randomInt(180, 365) * 24 * 60 * 60 * 1000),
        premiumAmount: randomElement([5000, 8000, 12000, 15000, 20000, 25000]),
        premiumFrequency: randomElement(['Monthly', 'Quarterly', 'Annually']),
        dependents: patient.age < 50 ? randomInt(0, 3) : 0,
        coPaymentPercent: randomElement([0, 10, 20]),
        roomCategory: randomElement(['General Ward', 'Semi-Private', 'Private', 'Deluxe']),
        preExistingCovered: Math.random() > 0.3,
        maternity: patient.gender === 'Female' && patient.age < 45 ? Math.random() > 0.5 : false,
        claimHistory: {
          totalClaims: randomInt(0, 5),
          lastClaimDate: randomInt(0, 2) > 0 ? new Date(Date.now() - randomInt(90, 730) * 24 * 60 * 60 * 1000) : null,
          totalClaimAmount: randomInt(0, 100000)
        }
      };
    } else {
      insurance = {
        hasInsurance: false,
        provider: 'None',
        policyNumber: null,
        policyType: 'None'
      };
    }

    // Update patient with all new data
    await Patient.findByIdAndUpdate(patient._id, {
      $set: {
        'metadata.medicalHistory': medicalHistory,
        'metadata.emergencyContacts': emergencyContacts,
        'metadata.insurance': insurance,
        'metadata.lastMedicalHistoryUpdate': new Date()
      }
    });

    // Create Medical History Document with PDF
    const medicalHistoryText = `
MEDICAL HISTORY REPORT
Patient: ${patient.firstName} ${patient.lastName}
Date: ${new Date().toLocaleDateString('en-IN')}
Age: ${patient.age} years | Gender: ${patient.gender}
Blood Group: ${patient.bloodGroup}

CURRENT CONDITIONS:
${medicalHistory.currentConditions.join(', ') || 'None'}

PAST MEDICAL HISTORY:
Conditions: ${medicalHistory.pastConditions.join(', ') || 'None'}
Surgeries: ${medicalHistory.surgeries.join(', ') || 'None'}

CURRENT MEDICATIONS:
${medicalHistory.currentMedications.join(', ') || 'None'}

FAMILY HISTORY:
${medicalHistory.familyHistory.join(', ') || 'None'}

LIFESTYLE:
Smoking: ${medicalHistory.lifestyle.smoking}
Alcohol: ${medicalHistory.lifestyle.alcohol}
Exercise: ${medicalHistory.lifestyle.exercise}
Diet: ${medicalHistory.lifestyle.diet}

EMERGENCY CONTACTS:
${emergencyContacts.map((c, i) => `${i + 1}. ${c.name} (${c.relationship}) - ${c.phone}`).join('\n')}

INSURANCE:
Provider: ${insurance.provider}
Policy: ${insurance.policyNumber || 'N/A'}
Coverage: ₹${insurance.coverageAmount ? insurance.coverageAmount.toLocaleString('en-IN') : 'N/A'}
    `.trim();

    // Create PDF document
    const pdfData = Buffer.from(medicalHistoryText);
    const medicalHistoryPdf = await PatientPDF.create({
      _id: uuidv4(),
      patientId: patient._id,
      title: 'Medical History',
      fileName: `medical_history_${patient._id}_${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      data: pdfData,
      size: pdfData.length,
      uploadedAt: new Date()
    });

    // Create Medical History Document metadata
    await MedicalHistoryDocument.create({
      _id: uuidv4(),
      patientId: patient._id,
      pdfId: medicalHistoryPdf._id,
      title: 'Complete Medical History',
      category: 'General',
      medicalHistory: medicalHistoryText,
      diagnosis: medicalHistory.currentConditions.join(', ') || 'None',
      allergies: patient.allergies ? patient.allergies.join(', ') : 'None',
      chronicConditions: medicalHistory.currentConditions,
      surgicalHistory: medicalHistory.surgeries,
      familyHistory: medicalHistory.familyHistory.join(', '),
      medications: medicalHistory.currentMedications.join(', '),
      recordDate: new Date(),
      reportDate: new Date(),
      doctorName: 'Medical Records Department',
      hospitalName: 'Karur Gastro Foundation',
      ocrText: medicalHistoryText,
      ocrEngine: 'manual',
      ocrConfidence: 100,
      extractedData: {
        medicalHistory: medicalHistory,
        emergencyContacts: emergencyContacts,
        insurance: insurance
      },
      status: 'completed',
      uploadDate: new Date()
    });

    return true;

  } catch (error) {
    console.error(`   ❌ Error for patient ${patient._id}:`, error.message);
    return false;
  }
}

async function addMedicalHistoryToAllPatients() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('     ADD MEDICAL HISTORY, EMERGENCY CONTACTS & INSURANCE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Get all patients
    const patients = await Patient.find({});
    
    if (patients.length === 0) {
      console.log('❌ No patients found in database!');
      return;
    }

    console.log(`📊 Found ${patients.length} patients\n`);

    let successCount = 0;
    let failCount = 0;

    for (const patient of patients) {
      console.log(`\n📝 Processing: ${patient.firstName} ${patient.lastName}`);
      console.log(`   Age: ${patient.age} | Gender: ${patient.gender} | Blood: ${patient.bloodGroup}`);
      
      const success = await addMedicalHistoryToPatient(patient);
      
      if (success) {
        console.log('   ✅ Medical history, emergency contacts & insurance added!');
        successCount++;
      } else {
        console.log('   ❌ Failed to add data');
        failCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                       SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📊 Total Patients: ${patients.length}`);

    if (successCount === patients.length) {
      console.log('\n🎉 ALL PATIENTS UPDATED SUCCESSFULLY!\n');
      
      console.log('📋 DATA ADDED FOR EACH PATIENT:');
      console.log('   ✓ Comprehensive Medical History');
      console.log('   ✓ Current & Past Conditions');
      console.log('   ✓ Surgeries & Hospitalizations');
      console.log('   ✓ Current Medications');
      console.log('   ✓ Family History');
      console.log('   ✓ Lifestyle Information');
      console.log('   ✓ Immunization Records');
      console.log('   ✓ Last Check-up Dates');
      console.log('   ✓ 1-2 Emergency Contacts');
      console.log('   ✓ Complete Insurance Details');
      console.log('   ✓ Medical History PDF Document\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    await connectDB();
    await addMedicalHistoryToAllPatients();
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔌 Database connection closed\n');
    process.exit(0);
  }
}

main();

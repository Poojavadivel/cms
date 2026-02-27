/**
 * Test Medical History Document Extraction with LandingAI
 * Same pattern as prescription extraction
 * Run with: node test_medical_history_landingai.js <path_to_medical_document>
 */

const { LandingAIScanner } = require('./utils/landingai_scanner');
const path = require('path');

async function testMedicalHistoryExtraction(documentPath) {
  console.log('🧪 Testing Medical History Extraction with LandingAI...\n');
  console.log('=' .repeat(70));
  
  if (!documentPath) {
    console.error('❌ Error: Please provide a document path');
    console.log('Usage: node test_medical_history_landingai.js <path_to_document>');
    process.exit(1);
  }

  const scanner = new LandingAIScanner();
  
  console.log('📄 Document:', documentPath);
  console.log('🔑 API Key:', scanner.apiKey ? 'Configured ✓' : 'Missing ✗');
  console.log('🌐 Base URL:', scanner.baseURL);
  console.log('=' .repeat(70));
  console.log('');

  try {
    // Step 1: Scan document with MEDICAL_HISTORY type
    console.log('🔍 Step 1: Scanning document...');
    const result = await scanner.scanDocument(documentPath, 'MEDICAL_HISTORY');
    
    if (!result.success) {
      console.error('❌ Scan failed:', result.error);
      process.exit(1);
    }

    console.log('✅ Scan successful!\n');

    // Step 2: Display extracted data
    console.log('=' .repeat(70));
    console.log('📊 EXTRACTED DATA:');
    console.log('=' .repeat(70));

    const data = result.extractedData.extraction || result.extractedData;
    
    console.log('\n🏥 MEDICAL HISTORY FIELDS:\n');
    
    // Required fields
    console.log('📋 Medical Type:', data.medical_type || '❌ NOT FOUND');
    console.log('📅 Date:', data.date || '❌ NOT FOUND');
    console.log('🏥 Hospital Name:', data.hospital_name || '❌ NOT FOUND');
    console.log('👨‍⚕️ Doctor Name:', data.doctor_name || '❌ NOT FOUND');
    
    console.log('\n📝 SUMMARIES:\n');
    
    if (data.appointment_summary) {
      console.log('📌 Appointment Summary:');
      console.log('  ', data.appointment_summary.substring(0, 200));
      if (data.appointment_summary.length > 200) {
        console.log('   ... (truncated)');
      }
    } else {
      console.log('📌 Appointment Summary: ❌ NOT FOUND');
    }
    
    if (data.discharge_summary) {
      console.log('\n📌 Discharge Summary:');
      console.log('  ', data.discharge_summary.substring(0, 200));
      if (data.discharge_summary.length > 200) {
        console.log('   ... (truncated)');
      }
    } else {
      console.log('\n📌 Discharge Summary: ❌ NOT FOUND');
    }

    console.log('\n⏰ TIME & LOCATION:\n');
    console.log('🕐 Time:', data.time || 'Not specified');
    console.log('📍 Hospital Location:', data.hospital_location || 'Not specified');
    console.log('🏢 Department:', data.department || 'Not specified');

    console.log('\n🔧 SERVICES:\n');
    if (data.services) {
      console.log('  Consultation:', data.services.consultation ? '✓' : '✗');
      console.log('  Lab Tests:', data.services.lab_tests?.length || 0, 'test(s)');
      if (data.services.lab_tests?.length > 0) {
        data.services.lab_tests.forEach((test, i) => {
          console.log(`    ${i + 1}. ${test}`);
        });
      }
      console.log('  Procedures:', data.services.procedures?.length || 0, 'procedure(s)');
      if (data.services.procedures?.length > 0) {
        data.services.procedures.forEach((proc, i) => {
          console.log(`    ${i + 1}. ${proc}`);
        });
      }
      if (data.services.admission) {
        console.log('  Admission:', data.services.admission);
      }
      if (data.services.discharge) {
        console.log('  Discharge:', data.services.discharge);
      }
    } else {
      console.log('  No services data extracted');
    }

    console.log('\n📝 NOTES & OBSERVATIONS:\n');
    console.log('👨‍⚕️ Doctor Notes:', data.doctor_notes || 'None');
    console.log('🔬 Observations:', data.observations || 'None');
    console.log('💬 Remarks:', data.remarks || 'None');

    console.log('\n' + '=' .repeat(70));
    console.log('📈 METADATA:');
    console.log('=' .repeat(70));
    console.log('Engine:', result.engine);
    console.log('Model:', result.model);
    console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
    console.log('Document Type:', result.documentType);

    console.log('\n' + '=' .repeat(70));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('=' .repeat(70));
    console.log('\n💡 Next steps:');
    console.log('   1. Use POST /api/scanner-enterprise/scan-medical to scan documents');
    console.log('   2. Review extracted data in verification interface');
    console.log('   3. Confirm to save to database\n');

    // Display raw JSON for debugging
    console.log('\n📦 RAW EXTRACTED DATA (JSON):');
    console.log(JSON.stringify(data, null, 2));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n📋 Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
const documentPath = process.argv[2];
testMedicalHistoryExtraction(documentPath);

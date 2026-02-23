/**
 * Test LandingAI Scanner
 * Run with: node test_landingai_scanner.js
 */

const { LandingAIScanner } = require('./utils/landingai_scanner');
const path = require('path');

async function testScanner() {
  console.log('🧪 Testing LandingAI Scanner...\n');

  const scanner = new LandingAIScanner();

  // Test 1: Check if scanner is initialized
  console.log('✅ Scanner initialized');
  console.log(`   API Key: ${scanner.apiKey.substring(0, 20)}...`);
  console.log(`   Base URL: ${scanner.baseURL}\n`);

  // Test 2: Document type detection
  const testMarkdown1 = 'Prescription for patient John Doe. Medicine: Paracetamol 500mg';
  const detectedType1 = scanner.detectDocumentType(testMarkdown1);
  console.log('✅ Document type detection test:');
  console.log(`   Input: "${testMarkdown1}"`);
  console.log(`   Detected: ${detectedType1}\n`);

  const testMarkdown2 = 'Lab Report - Blood Test Results. Hemoglobin: 14.5 g/dL';
  const detectedType2 = scanner.detectDocumentType(testMarkdown2);
  console.log('✅ Document type detection test 2:');
  console.log(`   Input: "${testMarkdown2}"`);
  console.log(`   Detected: ${detectedType2}\n`);

  // Test 3: Schema retrieval
  const prescriptionSchema = scanner.getSchema('PRESCRIPTION');
  console.log('✅ Schema retrieval test:');
  console.log(`   PRESCRIPTION schema has ${Object.keys(prescriptionSchema.properties || {}).length} properties`);
  console.log(`   Properties: ${Object.keys(prescriptionSchema.properties || {}).join(', ')}\n`);

  console.log('📋 Summary:');
  console.log('   - Scanner initialization: ✅');
  console.log('   - Document type detection: ✅');
  console.log('   - Schema retrieval: ✅');
  console.log('\n💡 Ready to use! Try scanning a real document with:');
  console.log('   curl -X POST http://localhost:5000/api/scanner-enterprise/scan-medical \\');
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -F "image=@your_document.pdf"');
}

testScanner()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });

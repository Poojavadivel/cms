/**
 * Debug Lab Reports Loading Issue
 * Tests the full flow from frontend to backend
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_PATIENT_ID = 'YOUR_PATIENT_ID_HERE'; // Replace with actual patient ID
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token

async function debugLabReports() {
  console.log('========================================');
  console.log('LAB REPORTS LOADING DEBUG');
  console.log('========================================\n');

  // Test 1: Check backend endpoint directly
  console.log('Test 1: Checking backend endpoint...');
  console.log(`URL: ${API_BASE_URL}/scanner-enterprise/lab-reports/${TEST_PATIENT_ID}`);
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/scanner-enterprise/lab-reports/${TEST_PATIENT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'x-auth-token': AUTH_TOKEN
        }
      }
    );

    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    console.log('✅ Lab Reports Count:', response.data.labReports?.length || 0);
    
    if (response.data.labReports && response.data.labReports.length > 0) {
      console.log('\n--- Sample Lab Report ---');
      const sample = response.data.labReports[0];
      console.log('ID:', sample._id);
      console.log('Test Type:', sample.testType);
      console.log('Lab Name:', sample.labName);
      console.log('Report Date:', sample.reportDate);
      console.log('Results Count:', sample.results?.length || 0);
      console.log('Status:', sample.status);
    } else {
      console.log('⚠️ No lab reports found for this patient');
      console.log('\nPossible reasons:');
      console.log('1. No lab reports have been uploaded for this patient');
      console.log('2. Lab reports failed to save during upload');
      console.log('3. Patient ID is incorrect');
    }

  } catch (error) {
    console.error('❌ Backend request failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }

  console.log('\n========================================');

  // Test 2: Check pathology endpoint (alternative)
  console.log('\nTest 2: Checking pathology endpoint...');
  console.log(`URL: ${API_BASE_URL}/pathology/reports?patientId=${TEST_PATIENT_ID}`);
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/pathology/reports?patientId=${TEST_PATIENT_ID}&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'x-auth-token': AUTH_TOKEN
        }
      }
    );

    console.log('✅ Response Status:', response.status);
    console.log('✅ Pathology Reports Count:', response.data.reports?.length || 0);
    
    if (response.data.reports && response.data.reports.length > 0) {
      console.log('\n--- Sample Pathology Report ---');
      const sample = response.data.reports[0];
      console.log('ID:', sample._id);
      console.log('Type:', sample.testType || sample.type);
      console.log('Name:', sample.testName || sample.name);
    }

  } catch (error) {
    console.error('❌ Pathology request failed:');
    console.error('Error:', error.message);
  }

  console.log('\n========================================');

  // Test 3: Check patient's medicalReports array
  console.log('\nTest 3: Checking patient medicalReports array...');
  console.log(`URL: ${API_BASE_URL}/patients/${TEST_PATIENT_ID}`);
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/patients/${TEST_PATIENT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'x-auth-token': AUTH_TOKEN
        }
      }
    );

    console.log('✅ Patient found');
    const patient = response.data.patient || response.data;
    console.log('Medical Reports:', patient.medicalReports?.length || 0);
    
    if (patient.medicalReports && patient.medicalReports.length > 0) {
      const labReports = patient.medicalReports.filter(r => r.reportType === 'LAB_REPORT');
      console.log('Lab Reports in array:', labReports.length);
      
      if (labReports.length > 0) {
        console.log('\n--- Sample from medicalReports ---');
        console.log(JSON.stringify(labReports[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Patient fetch failed:');
    console.error('Error:', error.message);
  }

  console.log('\n========================================');
  console.log('DEBUG COMPLETE');
  console.log('========================================\n');

  console.log('NEXT STEPS:');
  console.log('1. If no lab reports found → Upload a test lab report');
  console.log('2. If backend error → Check server logs');
  console.log('3. If data exists but not showing → Check frontend console');
  console.log('4. Check browser Network tab for actual API calls');
  console.log('5. Check browser Console for frontend errors\n');
}

// Instructions
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Replace TEST_PATIENT_ID with actual patient ID');
console.log('2. Replace AUTH_TOKEN with your auth token from localStorage');
console.log('3. Run: node debug_lab_reports_loading.js\n');

// Uncomment to run (after setting variables)
// debugLabReports();

module.exports = { debugLabReports };

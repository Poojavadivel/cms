/**
 * Test LandingAI Parse with Base64 Format
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const API_KEY = 'pat_XlbvTpObJfmlCvLPHjbSWTh2vzCciqZT';
const BASE_URL = 'https://api.landing.ai/v1/agent/document';

async function testParse() {
  console.log('🧪 Testing LandingAI Parse with Base64 Format...\n');

  // Create a simple test image (1x1 pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const requestBody = {
    model: 'dpt-2',
    document: `data:image/png;base64,${testImageBase64}`
  };

  console.log('📤 Sending request with base64-encoded document...');
  console.log(`   Model: dpt-2`);
  console.log(`   Document: data:image/png;base64,... (${testImageBase64.length} chars)\n`);

  try {
    const response = await axios.post(
      `${BASE_URL}/parse`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(`✅ SUCCESS! Status: ${response.status}\n`);
    console.log('📋 Response:');
    console.log(`   Markdown length: ${response.data.markdown?.length || 0} characters`);
    
    if (response.data.markdown) {
      console.log(`   First 100 chars: ${response.data.markdown.substring(0, 100)}\n`);
    }
    
    console.log('🎉 LandingAI Parse API is working correctly!\n');
    return true;

  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.status || error.code}\n`);
    
    if (error.response) {
      console.log('Error Response:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || error.response.statusText}`);
      
      if (error.response.status === 422) {
        console.log('\n⚠️  422 Error means the request format is still wrong.');
        console.log('   Check the API documentation for correct format.');
      } else if (error.response.status === 401) {
        console.log('\n⚠️  401 Error means authentication failed.');
        console.log('   The API key might not have access to this endpoint.');
      }
    }
    
    console.log('');
    return false;
  }
}

(async () => {
  const success = await testParse();
  
  if (success) {
    console.log('✅ Ready to use! Restart your server and try uploading a document.');
  } else {
    console.log('❌ Still having issues. Check the error message above.');
  }
  
  process.exit(success ? 0 : 1);
})();

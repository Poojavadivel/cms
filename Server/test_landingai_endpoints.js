/**
 * Test different LandingAI API endpoints and auth formats
 */

const axios = require('axios');

const API_KEY = 'pat_XlbvTpObJfmlCvLPHjbSWTh2vzCciqZT';

// Test different base URLs
const TEST_URLS = [
  'https://api.landing.ai/v1/agent/document',
  'https://api.landing.ai/v1/document',
  'https://api.landing.ai/ade/v1/document',
  'https://app.landing.ai/api/v1/document',
];

async function testEndpoints() {
  console.log('🔍 Testing Different API Endpoints...\n');
  console.log(`🔑 Using key: ${API_KEY}\n`);

  const testData = {
    markdown: "# Test\nPatient: John Doe",
    schema: { type: 'object', properties: { name: { type: 'string' } } }
  };

  for (const baseUrl of TEST_URLS) {
    console.log(`\n📍 Testing: ${baseUrl}/extract`);
    
    // Try with Bearer token
    try {
      const response = await axios.post(
        `${baseUrl}/extract`,
        testData,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log(`   ✅ SUCCESS! Status: ${response.status}`);
      console.log(`   ✓ This is the correct endpoint!\n`);
      return baseUrl;
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ ${error.response.status}: ${error.response.statusText}`);
        if (error.response.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ Endpoint not found (DNS error)`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ❌ Timeout`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n❌ None of the endpoints worked.\n');
  return null;
}

// Check if key needs to be used differently
async function testKeyFormats() {
  console.log('\n🔐 Testing Different Key Formats...\n');

  const formats = [
    { name: 'Bearer Token', header: 'Authorization', value: `Bearer ${API_KEY}` },
    { name: 'Plain apikey', header: 'apikey', value: API_KEY },
    { name: 'X-API-Key', header: 'x-api-key', value: API_KEY },
    { name: 'API-Key', header: 'api-key', value: API_KEY },
    { name: 'landingai-key', header: 'landingai-key', value: API_KEY },
  ];

  const testData = {
    markdown: "# Test\nPatient: John Doe",
    schema: { type: 'object', properties: { name: { type: 'string' } } }
  };

  for (const format of formats) {
    console.log(`\n📋 Testing: ${format.name}`);
    try {
      const headers = {
        'Content-Type': 'application/json',
        [format.header]: format.value
      };

      const response = await axios.post(
        'https://api.landing.ai/v1/agent/document/extract',
        testData,
        { headers, timeout: 5000 }
      );

      console.log(`   ✅ SUCCESS with ${format.name}!`);
      console.log(`   Status: ${response.status}`);
      return format;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.status || error.code}`);
    }
  }

  return null;
}

(async () => {
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('   🧪 LandingAI API Configuration Test\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const correctEndpoint = await testEndpoints();
  
  if (!correctEndpoint) {
    await testKeyFormats();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Check these possibilities:\n');
    console.log('1. The API key might need to be activated in your LandingAI dashboard');
    console.log('2. You might need to accept terms of service on landing.ai');
    console.log('3. The key might be for a different product/service');
    console.log('4. Contact LandingAI support: support@landing.ai\n');
    console.log('═══════════════════════════════════════════════════════\n');
  }
})();

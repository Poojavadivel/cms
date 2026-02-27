/**
 * Test LandingAI API Key and Connection
 * Run with: node test_landingai_api.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// API Configuration
const API_KEY = process.env.LANDINGAI_API_KEY || 'pat_XlbvTpObJfmlCvLPHjbSWTh2vzCciqZT';
const BASE_URL = 'https://api.landing.ai/v1/agent/document';

console.log('🧪 Testing LandingAI API Connection...\n');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

// Test 1: Check API Key format
console.log('✅ Test 1: API Key Format');
if (API_KEY && API_KEY.length > 20) {
  console.log('   ✓ API key looks valid (length > 20 chars)\n');
} else {
  console.log('   ✗ API key seems too short or missing\n');
}

// Test 2: Try different authentication methods
async function testAuth() {
  console.log('🔐 Test 2: Testing Authentication Methods\n');

  // Create a simple test payload
  const testData = {
    markdown: "# Test Document\n\nPatient Name: John Doe\nAge: 45",
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      }
    }
  };

  // Method 1: Authorization: Bearer
  console.log('   Method 1: Authorization: Bearer <key>');
  try {
    const response = await axios.post(
      `${BASE_URL}/extract`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✓ SUCCESS with Bearer token');
    console.log(`   Response status: ${response.status}\n`);
    return true;
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.response?.status} - ${error.response?.statusText}`);
    if (error.response?.data) {
      console.log(`   Error details:`, error.response.data);
    }
    console.log('');
  }

  // Method 2: apikey header
  console.log('   Method 2: apikey: <key>');
  try {
    const response = await axios.post(
      `${BASE_URL}/extract`,
      testData,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✓ SUCCESS with apikey header');
    console.log(`   Response status: ${response.status}\n`);
    return true;
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.response?.status} - ${error.response?.statusText}`);
    if (error.response?.data) {
      console.log(`   Error details:`, error.response.data);
    }
    console.log('');
  }

  // Method 3: x-api-key header
  console.log('   Method 3: x-api-key: <key>');
  try {
    const response = await axios.post(
      `${BASE_URL}/extract`,
      testData,
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✓ SUCCESS with x-api-key header');
    console.log(`   Response status: ${response.status}\n`);
    return true;
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.response?.status} - ${error.response?.statusText}`);
    if (error.response?.data) {
      console.log(`   Error details:`, error.response.data);
    }
    console.log('');
  }

  return false;
}

// Test 3: Check if API endpoint is reachable
async function testEndpoint() {
  console.log('🌐 Test 3: Testing API Endpoint Reachability\n');
  
  try {
    const response = await axios.get(BASE_URL, { timeout: 5000 });
    console.log(`   ✓ Endpoint is reachable: ${response.status}\n`);
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log('   ✗ DNS resolution failed - check internet connection\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   ✗ Connection timeout - check network/firewall\n');
    } else {
      console.log(`   ⚠ Got response: ${error.response?.status || error.message}\n`);
    }
  }
}

// Run all tests
(async () => {
  try {
    await testEndpoint();
    const authSuccess = await testAuth();
    
    console.log('📋 Summary:');
    if (authSuccess) {
      console.log('   ✅ LandingAI API is working correctly!');
      console.log('   🎉 You can use the scanner now.\n');
    } else {
      console.log('   ❌ Authentication failed with all methods.');
      console.log('   📝 Possible solutions:');
      console.log('      1. Check if API key is correct');
      console.log('      2. Verify API key has not expired');
      console.log('      3. Contact LandingAI support for a new key');
      console.log('      4. Check LandingAI documentation for correct auth method\n');
      
      console.log('   🔗 Get help at: https://docs.landing.ai/ade/\n');
    }
  } catch (error) {
    console.error('💥 Test script error:', error.message);
  }
})();

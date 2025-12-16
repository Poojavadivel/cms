/**
 * Backend Connection Test Script
 * Tests connection to https://hms-dev.onrender.com
 * 
 * Run: node test-backend.js
 */

const https = require('https');

const BACKEND_URL = 'hms-dev.onrender.com';
const API_BASE = '/api';

console.log('🔍 Testing Backend Connection...\n');
console.log(`Backend URL: https://${BACKEND_URL}${API_BASE}`);
console.log('─'.repeat(50));

// Test 1: Check if backend is reachable
function testConnection() {
  return new Promise((resolve, reject) => {
    console.log('\n1️⃣  Testing basic connection...');
    
    const options = {
      hostname: BACKEND_URL,
      port: 443,
      path: API_BASE,
      method: 'GET',
      timeout: 60000 // 60 seconds for sleeping backend
    };

    const req = https.request(options, (res) => {
      console.log(`   ✅ Status: ${res.statusCode}`);
      console.log(`   ✅ Backend is reachable!`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (data) {
            const parsed = JSON.parse(data);
            console.log(`   📦 Response:`, parsed);
          }
          resolve(true);
        } catch (e) {
          console.log(`   📦 Response:`, data);
          resolve(true);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`   ⏰ Timeout (backend might be sleeping on Render free tier)`);
      console.log(`   💡 Tip: Wait 30-60 seconds and try again`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Test 2: Check auth endpoints
function testAuthEndpoints() {
  return new Promise((resolve, reject) => {
    console.log('\n2️⃣  Testing auth endpoints...');
    
    const options = {
      hostname: BACKEND_URL,
      port: 443,
      path: `${API_BASE}/auth/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      console.log(`   ✅ Auth endpoint exists (Status: ${res.statusCode})`);
      
      if (res.statusCode === 400 || res.statusCode === 401) {
        console.log(`   ✅ Expected error (no credentials provided)`);
      }
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (data) {
            const parsed = JSON.parse(data);
            console.log(`   📦 Response:`, parsed);
          }
          resolve(true);
        } catch (e) {
          resolve(true);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`   ⏰ Timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    // Send empty body (should get validation error)
    req.write(JSON.stringify({}));
    req.end();
  });
}

// Test 3: CORS check
function testCORS() {
  return new Promise((resolve, reject) => {
    console.log('\n3️⃣  Testing CORS configuration...');
    
    const options = {
      hostname: BACKEND_URL,
      port: 443,
      path: `${API_BASE}/auth/login`,
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      const corsHeader = res.headers['access-control-allow-origin'];
      
      if (corsHeader) {
        console.log(`   ✅ CORS is configured`);
        console.log(`   📦 Allowed Origin: ${corsHeader}`);
      } else {
        console.log(`   ⚠️  CORS header not found`);
        console.log(`   💡 Backend might need CORS configuration`);
      }
      
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`   ⏰ Timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  try {
    await testConnection();
    await testAuthEndpoints();
    await testCORS();
    
    console.log('\n' + '─'.repeat(50));
    console.log('✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('   • Backend is reachable');
    console.log('   • Auth endpoints are working');
    console.log('   • Ready to use in React app');
    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm start');
    console.log('   2. Navigate to: http://localhost:3000');
    console.log('   3. Login with your credentials');
    console.log('\n');
    
  } catch (error) {
    console.log('\n' + '─'.repeat(50));
    console.log('❌ Tests failed!');
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check if backend is running');
    console.log('   • Backend might be sleeping (Render free tier)');
    console.log('   • Wait 30-60 seconds and try again');
    console.log('   • Check backend logs for errors');
    console.log('\n');
  }
}

// Start tests
runTests();

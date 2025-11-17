// Test script for Admin Pharmacy Endpoints
// Run this after starting the server to verify endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Helper to make authenticated requests
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'x-auth-token': authToken },
      data,
    };
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// Test suite
const runTests = async () => {
  console.log('🧪 Starting Pharmacy Admin API Tests\n');

  // 1. Login as admin (adjust credentials as needed)
  console.log('1️⃣ Testing Admin Login...');
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
    });
    authToken = loginRes.data.token;
    console.log('✅ Login successful\n');
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    console.log('⚠️ Please update credentials in test script or .env file\n');
    return;
  }

  // 2. Create a test medicine
  console.log('2️⃣ Testing Medicine Creation...');
  const testMedicine = {
    name: 'Test Medicine ' + Date.now(),
    sku: 'TEST-' + Date.now(),
    category: 'Test Category',
    stock: 100,
    salePrice: 50.00,
    costPrice: 30.00,
  };
  const createRes = await apiCall('POST', '/pharmacy/medicines', testMedicine);
  console.log(createRes.success ? '✅ Medicine created' : '❌ Failed:', createRes.error);
  const medicineId = createRes.data?._id || createRes.data?.medicine?._id;
  console.log('Medicine ID:', medicineId, '\n');

  // 3. List medicines
  console.log('3️⃣ Testing Medicine List...');
  const listRes = await apiCall('GET', '/pharmacy/medicines?limit=10');
  console.log(listRes.success ? `✅ Listed ${listRes.data.length || listRes.data.medicines?.length || 0} medicines` : '❌ Failed:', listRes.error);
  console.log('');

  // 4. Update medicine
  if (medicineId) {
    console.log('4️⃣ Testing Medicine Update...');
    const updateRes = await apiCall('PUT', `/pharmacy/medicines/${medicineId}`, {
      stock: 150,
      name: 'Updated Test Medicine',
    });
    console.log(updateRes.success ? '✅ Medicine updated' : '❌ Failed:', updateRes.error);
    console.log('');
  }

  // 5. Get admin analytics
  console.log('5️⃣ Testing Admin Analytics...');
  const analyticsRes = await apiCall('GET', '/pharmacy/admin/analytics');
  console.log(analyticsRes.success ? '✅ Analytics fetched' : '❌ Failed:', analyticsRes.error);
  if (analyticsRes.success) {
    console.log('   Inventory:', analyticsRes.data.analytics?.inventory);
  }
  console.log('');

  // 6. Get low stock medicines
  console.log('6️⃣ Testing Low Stock Alert...');
  const lowStockRes = await apiCall('GET', '/pharmacy/admin/low-stock?threshold=50');
  console.log(lowStockRes.success ? `✅ Found ${lowStockRes.data.count || 0} low stock items` : '❌ Failed:', lowStockRes.error);
  console.log('');

  // 7. Get expiring batches
  console.log('7️⃣ Testing Expiring Batches...');
  const expiringRes = await apiCall('GET', '/pharmacy/admin/expiring-batches?days=30');
  console.log(expiringRes.success ? `✅ Found ${expiringRes.data.count || 0} expiring batches` : '❌ Failed:', expiringRes.error);
  console.log('');

  // 8. Inventory report
  console.log('8️⃣ Testing Inventory Report...');
  const reportRes = await apiCall('GET', '/pharmacy/admin/inventory-report');
  console.log(reportRes.success ? '✅ Report generated' : '❌ Failed:', reportRes.error);
  if (reportRes.success) {
    console.log('   Summary:', reportRes.data.summary);
  }
  console.log('');

  // 9. Bulk import test
  console.log('9️⃣ Testing Bulk Import...');
  const bulkData = {
    medicines: [
      {
        name: 'Bulk Medicine 1',
        sku: 'BULK-1-' + Date.now(),
        category: 'Test',
        stock: 50,
      },
      {
        name: 'Bulk Medicine 2',
        sku: 'BULK-2-' + Date.now(),
        category: 'Test',
        stock: 75,
      },
    ],
  };
  const bulkRes = await apiCall('POST', '/pharmacy/admin/bulk-import', bulkData);
  console.log(bulkRes.success ? '✅ Bulk import completed' : '❌ Failed:', bulkRes.error);
  if (bulkRes.success) {
    console.log(`   Success: ${bulkRes.data.results?.success.length || 0}, Failed: ${bulkRes.data.results?.failed.length || 0}`);
  }
  console.log('');

  // 10. Delete test medicine
  if (medicineId) {
    console.log('🔟 Testing Medicine Deletion...');
    const deleteRes = await apiCall('DELETE', `/pharmacy/medicines/${medicineId}`);
    console.log(deleteRes.success ? '✅ Medicine deleted' : '❌ Failed:', deleteRes.error);
    console.log('');
  }

  console.log('✅ All tests completed!\n');
};

// Run tests
runTests().catch(console.error);

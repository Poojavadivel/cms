/**
 * TEST_STAFF_API.js
 * Debug script to test staff API endpoints
 * 
 * Run in browser console after logging in:
 * 1. Copy this entire file
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Paste and press Enter
 */

(async function testStaffAPI() {
  console.log('🧪 TESTING STAFF API ENDPOINTS');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Get token
  const token = localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
  
  if (!token) {
    console.error('❌ No authentication token found!');
    console.log('Please login first, then run this test again.');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 20) + '...');
  console.log('');
  
  // Test configuration
  const baseURL = process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api';
  console.log('📍 Base URL:', baseURL);
  console.log('');
  
  // Test 1: Fetch all staff
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Fetch All Staff');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response1 = await fetch(`${baseURL}/staff`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    console.log('Status:', response1.status);
    
    if (response1.ok) {
      const data = await response1.json();
      console.log('✅ Success! Response:', data);
      
      // Check data structure
      if (Array.isArray(data)) {
        console.log(`📊 Got ${data.length} staff members (direct array)`);
      } else if (data.staff && Array.isArray(data.staff)) {
        console.log(`📊 Got ${data.staff.length} staff members (wrapped in 'staff' key)`);
      } else if (data.data && Array.isArray(data.data)) {
        console.log(`📊 Got ${data.data.length} staff members (wrapped in 'data' key)`);
      } else {
        console.warn('⚠️ Unexpected response structure:', Object.keys(data));
      }
      
      // Show first staff member structure
      const firstStaff = Array.isArray(data) ? data[0] : 
                        (data.staff?.[0] || data.data?.[0]);
      
      if (firstStaff) {
        console.log('👤 Sample staff member:');
        console.log('   ID:', firstStaff._id || firstStaff.id);
        console.log('   Name:', firstStaff.name);
        console.log('   Designation:', firstStaff.designation || firstStaff.role);
        console.log('   Department:', firstStaff.department);
        console.log('   Contact:', firstStaff.contact || firstStaff.phone);
        console.log('   Email:', firstStaff.email);
        console.log('   Full object:', firstStaff);
      }
    } else {
      const error = await response1.text();
      console.error('❌ Failed with status:', response1.status);
      console.error('Error:', error);
    }
  } catch (error) {
    console.error('❌ Error in Test 1:', error);
  }
  
  console.log('');
  
  // Test 2: Create staff (optional - uncomment if needed)
  /*
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Create Staff Member');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const testStaffData = {
    name: 'Test Staff Member',
    designation: 'Nurse',
    department: 'Emergency',
    contact: '9876543210',
    email: 'test.staff@hospital.com',
    gender: 'Female',
    status: 'Available'
  };
  
  try {
    const response2 = await fetch(`${baseURL}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(testStaffData)
    });
    
    console.log('Status:', response2.status);
    
    if (response2.ok) {
      const data = await response2.json();
      console.log('✅ Staff created successfully!');
      console.log('Created staff:', data);
    } else {
      const error = await response2.text();
      console.error('❌ Failed to create staff:', error);
    }
  } catch (error) {
    console.error('❌ Error in Test 2:', error);
  }
  
  console.log('');
  */
  
  // Test 3: Check staffService import
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Check React Service');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Try to import staffService dynamically
    const staffServiceModule = await import('./services/staffService.js');
    console.log('✅ staffService imported successfully');
    console.log('Available methods:', Object.keys(staffServiceModule.default || staffServiceModule));
    
    // Test fetchStaffs
    console.log('');
    console.log('Testing staffService.fetchStaffs()...');
    const staffService = staffServiceModule.default;
    const staffList = await staffService.fetchStaffs(true); // force refresh
    console.log('✅ fetchStaffs() returned:', staffList.length, 'staff members');
    
    if (staffList.length > 0) {
      console.log('👤 First staff from service:', staffList[0]);
    }
  } catch (error) {
    console.error('❌ Error testing staffService:', error.message);
    console.log('💡 This is expected if running outside React app context');
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ STAFF API TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
})();

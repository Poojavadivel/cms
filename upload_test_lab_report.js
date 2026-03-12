/**
 * Upload Test Lab Report
 * Use this to test lab report upload for patient: 16686d13-3bc9-4609-9dc5-6c9c533339c7
 */

// Instructions:
// 1. Get a sample lab report PDF
// 2. Replace AUTH_TOKEN with your actual token from localStorage
// 3. Run this in browser console OR use curl command below

const PATIENT_ID = '16686d13-3bc9-4609-9dc5-6c9c533339c7';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Get from: localStorage.getItem('auth_token')

// ============================================
// BROWSER CONSOLE METHOD
// ============================================
async function uploadTestLabReport(file) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('patientId', PATIENT_ID);
  formData.append('documentType', 'LAB_REPORT');

  console.log('📤 Uploading lab report...');
  
  try {
    const response = await fetch('/api/scanner-enterprise/scan-medical', {
      method: 'POST',
      headers: {
        'x-auth-token': AUTH_TOKEN
      },
      body: formData
    });

    const data = await response.json();
    console.log('✅ Upload response:', data);

    if (data.verificationId) {
      console.log('✅ Verification ID:', data.verificationId);
      console.log('📋 Extracted rows:', data.extractedData?.extraction?.labReport);
      
      // Auto-confirm (skip verification)
      console.log('🔄 Auto-confirming...');
      const confirmResponse = await fetch(`/api/scanner-enterprise/verification/${data.verificationId}/confirm`, {
        method: 'POST',
        headers: {
          'x-auth-token': AUTH_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      const confirmData = await confirmResponse.json();
      console.log('✅ Confirm response:', confirmData);
      
      if (confirmData.success) {
        console.log('🎉 SUCCESS! Lab report saved!');
        console.log('📊 Report ID:', confirmData.reportId);
        console.log('🔄 Refresh patient profile to see it!');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Usage in browser console:
// 1. Get file input: <input type="file" id="testFile" accept=".pdf,image/*" />
// 2. document.getElementById('testFile').addEventListener('change', (e) => {
//      uploadTestLabReport(e.target.files[0]);
//    });

// ============================================
// CURL COMMAND (Use in terminal)
// ============================================
console.log(`
CURL COMMAND:
-------------

# Step 1: Upload and scan
curl -X POST http://localhost:5000/api/scanner-enterprise/scan-medical \\
  -H "x-auth-token: ${AUTH_TOKEN}" \\
  -F "image=@/path/to/lab_report.pdf" \\
  -F "patientId=${PATIENT_ID}" \\
  -F "documentType=LAB_REPORT"

# Copy the verificationId from response

# Step 2: Confirm
curl -X POST http://localhost:5000/api/scanner-enterprise/verification/{VERIFICATION_ID}/confirm \\
  -H "x-auth-token: ${AUTH_TOKEN}" \\
  -H "Content-Type: application/json"

# Done! Now check patient profile
`);

// ============================================
// EXPECTED FLOW
// ============================================
console.log(`
EXPECTED FLOW:
--------------

1. Upload PDF → Scan-Medical API
   Expected: { success: true, verificationId: "...", extractedData: {...} }

2. Check conversion
   Should see: "Created 10+ rows for LAB_REPORT (including N test results)"

3. Confirm verification
   Expected: { success: true, reportId: "..." }

4. Refresh patient profile
   Lab reports should now appear!

CURRENT PATIENT: ${PATIENT_ID}
`);

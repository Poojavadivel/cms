# Lab Reports Loading Issue - Debugging Guide

## Issue
Lab reports are not loading in the patient profile popup, but prescriptions and medical history load correctly.

## Files Modified
✅ `react/hms/src/services/prescriptionService.js` - Added detailed console logging

## Debugging Steps

### 1. Check Browser Console
Open the patient profile and look for these logs:
```
[LAB_REPORTS] 🔍 Starting fetch for patient: <patient-id>
[LAB_REPORTS] 📡 Trying pathology endpoint: /pathology/reports?patientId=...
[LAB_REPORTS] ✅ Pathology response: 200 { ... }
[LAB_REPORTS] 📡 Trying scanner endpoint: /api/scanner-enterprise/lab-reports/...
[LAB_REPORTS] ✅ Scanner response: 200 { success: true, labReports: [...] }
```

### 2. Check Network Tab
- Open DevTools → Network tab
- Filter by "lab-reports"
- Look for API call to `/scanner-enterprise/lab-reports/<patientId>`
- Check:
  - ✅ Status: Should be 200
  - ✅ Response: Should have `{ success: true, labReports: [...] }`
  - ❌ If 401/403: Authentication issue
  - ❌ If 404: Route not found
  - ❌ If 500: Server error

### 3. Possible Issues & Solutions

#### A. No Lab Reports in Database
**Symptom:** API returns `{ success: true, labReports: [] }`

**Solution:** Upload a test lab report
```bash
# Use the scan-medical endpoint
POST /api/scanner-enterprise/scan-medical
Content-Type: multipart/form-data

Body:
  - image: <lab_report.pdf>
  - patientId: <patient_id>
  - documentType: "LAB_REPORT"

# Then confirm the verification
POST /api/scanner-enterprise/verification/{verificationId}/confirm
```

#### B. Authentication Issue
**Symptom:** API returns 401/403

**Check:**
1. Browser console for auth token
   ```javascript
   localStorage.getItem('auth_token')
   localStorage.getItem('x-auth-token')
   ```

2. Request headers include token
   ```
   Headers:
     x-auth-token: <your-token>
   ```

**Solution:** Re-login to get fresh token

#### C. Wrong API URL
**Symptom:** Request goes to wrong server

**Check:**
1. React app API URL
   ```javascript
   console.log(process.env.REACT_APP_API_URL)
   ```

2. Should be: `https://hms-dev.onrender.com/api` or `http://localhost:5000/api`

#### D. Backend Route Not Registered
**Symptom:** 404 Not Found

**Check:**
1. Server.js includes scanner-enterprise routes
   ```javascript
   app.use('/api/scanner-enterprise', scannerEnterpriseRoutes);
   ```

2. Route exists in scanner-enterprise.js
   ```javascript
   router.get('/lab-reports/:patientId', auth, async (req, res) => { ... })
   ```

**Solution:** Restart server

#### E. Data Structure Mismatch
**Symptom:** Data exists but doesn't display

**Check frontend expects:**
```javascript
response.data.labReports = [
  {
    _id: "...",
    testType: "BLOOD_COUNT",
    labName: "City Lab",
    reportDate: "2026-02-28",
    results: [
      { testName: "Hemoglobin", value: "14.5", unit: "g/dL", flag: "Normal" }
    ],
    status: "completed"
  }
]
```

**Check actual response:**
- Open Network tab
- Click on lab-reports request
- Check Response tab
- Compare structure

### 4. Quick Test Commands

#### Test Backend Directly
```bash
# Get lab reports for a patient
curl -X GET "http://localhost:5000/api/scanner-enterprise/lab-reports/<PATIENT_ID>" \
  -H "x-auth-token: <YOUR_TOKEN>"

# Expected response:
{
  "success": true,
  "labReports": [...]
}
```

#### Test from Browser Console
```javascript
// Check API call
fetch('/api/scanner-enterprise/lab-reports/<PATIENT_ID>', {
  headers: {
    'x-auth-token': localStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(data => console.log('Lab Reports:', data))
.catch(err => console.error('Error:', err));
```

### 5. Compare with Working Features

#### Prescriptions (Working)
- Endpoint: `/scanner-enterprise/prescriptions/<patientId>`
- Returns: `{ success: true, prescriptions: [...] }`

#### Medical History (Working)
- Endpoint: `/scanner-enterprise/medical-history/<patientId>`
- Returns: `{ success: true, medicalHistory: [...] }`

#### Lab Reports (Not Working)
- Endpoint: `/scanner-enterprise/lab-reports/<patientId>`
- Should return: `{ success: true, labReports: [...] }`

**If prescriptions work but lab reports don't:**
→ Backend endpoint is fine
→ Auth is fine
→ Issue is either: no data OR data structure mismatch

### 6. Expected Console Output (Success)

```
[LAB_REPORTS] 🔍 Starting fetch for patient: patient-123
[LAB_REPORTS] 📡 Trying pathology endpoint: /pathology/reports?patientId=patient-123&limit=100
[LAB_REPORTS] ⚠️ Pathology endpoint failed: Request failed with status code 404
[LAB_REPORTS] 📡 Trying scanner endpoint: /api/scanner-enterprise/lab-reports/patient-123
[LAB_REPORTS] ✅ Scanner response: 200 { success: true, labReports: [ {...}, {...} ] }
[LAB_REPORTS] ✅ Returning 2 scanned lab reports
[LAB RESULTS] Fetch completed in 245ms, found 2 results
```

### 7. Expected Console Output (No Data)

```
[LAB_REPORTS] 🔍 Starting fetch for patient: patient-123
[LAB_REPORTS] 📡 Trying pathology endpoint: /pathology/reports?patientId=patient-123&limit=100
[LAB_REPORTS] ⚠️ Pathology endpoint failed: Request failed with status code 404
[LAB_REPORTS] 📡 Trying scanner endpoint: /api/scanner-enterprise/lab-reports/patient-123
[LAB_REPORTS] ✅ Scanner response: 200 { success: true, labReports: [] }
[LAB_REPORTS] ⚠️ Scanner response has no reports
[LAB_REPORTS] ⚠️ No lab reports found from any endpoint
[LAB RESULTS] Fetch completed in 180ms, found 0 results
```

## Next Steps

1. **Check console logs** - Most important!
2. **Check network tab** - See actual API calls
3. **Upload test lab report** - If no data exists
4. **Compare with prescriptions** - They use same pattern
5. **Check backend logs** - Server console output

## Contact
If issue persists after these checks, provide:
- Browser console logs
- Network tab screenshot
- Backend server logs
- Patient ID being tested

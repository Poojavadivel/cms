# Quick Testing Guide - Medical Data Verification System

## Prerequisites
- MongoDB running
- Backend server running on port 5000
- React frontend running on port 3000
- LandingAI API key configured in environment

## Test Checklist

### ✅ Backend Tests

#### 1. Test Model Registration
```bash
# In Server directory
node
> const mongoose = require('mongoose');
> const { ScannedDataVerification } = require('./Models');
> console.log(ScannedDataVerification.modelName);
# Should output: ScannedDataVerification
```

#### 2. Test Scanner Route
```bash
# Check if route is registered
curl http://localhost:5000/api/scanner/health \
  -H "x-auth-token: YOUR_TOKEN"

# Expected: {"ok":true,"services":{"landingaiADE":"configured"},...}
```

#### 3. Test Verification Endpoints
```bash
# Test getting verification (should return 404 initially)
curl http://localhost:5000/api/scanner/verification/test123 \
  -H "x-auth-token: YOUR_TOKEN"
```

### ✅ Frontend Tests

#### 1. Check Component Import
Open browser console and navigate to Add Patient page.
Should load without errors.

#### 2. Test File Upload UI
1. Go to Add Patient → Step 2 (Medical & Vitals)
2. Find "Scan Medical Records" section
3. Upload a test medical document image
4. Watch for:
   - ✅ "Scanning document with AI..." message
   - ✅ File appears in "Uploaded Documents" list
   - ✅ Blue "Verify Data" button appears next to filename

#### 3. Test Verification Modal
1. Click the "Verify Data" button
2. Modal should open showing:
   - ✅ Header with document name and type
   - ✅ Info banner with confidence score
   - ✅ Data rows with category badges
   - ✅ Edit and Delete buttons on each row
   - ✅ Statistics panel at bottom
   - ✅ Footer buttons (Reject, Close, Confirm)

#### 4. Test Edit Functionality
1. Click edit icon on any row
2. Modify the value
3. Click "Save"
4. Verify:
   - ✅ Value updates
   - ✅ "Modified" badge appears
   - ✅ Stats panel updates

#### 5. Test Delete Functionality
1. Click delete icon on any row
2. Confirm deletion
3. Verify:
   - ✅ Row becomes grayed out
   - ✅ "DELETED" label appears
   - ✅ Stats panel updates

#### 6. Test Confirmation
1. Click "Confirm & Save" button
2. Confirm the action
3. Verify:
   - ✅ Success message appears
   - ✅ Modal closes
   - ✅ Console log shows confirmation result

### ✅ Database Tests

#### 1. Check ScannedDataVerification Collection
```javascript
// In MongoDB shell or Compass
use hms_database

// After uploading a document
db.scanneddataverifications.find().pretty()

// Should see:
{
  _id: ObjectId("..."),
  patientId: "...",
  sessionId: "verify-...",
  documentType: "PRESCRIPTION",
  verificationStatus: "pending",
  dataRows: [...],
  createdAt: ISODate("..."),
  expiresAt: ISODate("...") // 24 hours later
}
```

#### 2. Check Verification After Confirmation
```javascript
// After clicking "Confirm & Save"
db.scanneddataverifications.findOne({verificationStatus: "verified"})

// Should see verificationStatus changed to "verified"
```

#### 3. Check Final Collections
```javascript
// Check if data was saved to final collections
db.prescriptiondocuments.find().pretty()
// OR
db.labreportdocuments.find().pretty()
// OR
db.medicalhistorydocuments.find().pretty()

// Should see new document with verified data
```

#### 4. Check Patient Record
```javascript
// Check if patient's medicalReports array was updated
db.patients.findOne({_id: ObjectId("YOUR_PATIENT_ID")})

// Should see new entry in medicalReports array
```

### ✅ Error Handling Tests

#### Test 1: Invalid Verification ID
```bash
curl http://localhost:5000/api/scanner/verification/invalid_id \
  -H "x-auth-token: YOUR_TOKEN"

# Expected: 400 or 404 error with message
```

#### Test 2: Edit Invalid Row Index
```bash
curl -X PUT http://localhost:5000/api/scanner/verification/VALID_ID/row/999 \
  -H "x-auth-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentValue": "test"}'

# Expected: 400 error "Invalid row index"
```

#### Test 3: Confirm Already Verified
```bash
# Try to confirm a verification that's already verified
curl -X POST http://localhost:5000/api/scanner/verification/VERIFIED_ID/confirm \
  -H "x-auth-token: YOUR_TOKEN"

# Expected: 400 error "Already verified"
```

## Sample Test Document

Create a simple test prescription image with:
```
Dr. John Smith
City Hospital
Ph: +91 9999999999

Patient: John Doe
Age: 45
Date: 22/02/2024

Rx:
1. Metformin 500mg - Twice daily - 30 days
2. Aspirin 75mg - Once daily - 30 days

Diagnosis: Type 2 Diabetes Mellitus
```

## Expected Data Flow

### 1. Upload Stage
```
User uploads → 
LandingAI processes → 
Backend saves to ScannedDataVerification → 
Frontend shows "Verify Data" button
```

### 2. Verification Stage
```
User clicks "Verify Data" → 
Frontend fetches verification data → 
Modal displays rows → 
User edits/deletes as needed
```

### 3. Confirmation Stage
```
User clicks "Confirm & Save" → 
Backend validates data → 
Saves to PrescriptionDocument → 
Updates Patient.medicalReports → 
Marks verification as "verified"
```

## Common Issues & Solutions

### Issue: "Verification session not found"
**Cause**: Verification expired (24 hours)
**Solution**: Upload document again

### Issue: "Network Error" when opening modal
**Cause**: Backend not running or incorrect API URL
**Solution**: Check backend is running, verify API_BASE_URL in DataVerificationModal.jsx

### Issue: Modal not styling correctly
**Cause**: CSS file not imported
**Solution**: Ensure DataVerificationModal.css is in same directory and imported

### Issue: "Already verified" error
**Cause**: Trying to verify same session twice
**Solution**: Expected behavior - data already saved

### Issue: TTL index not expiring documents
**Cause**: MongoDB TTL background task hasn't run yet
**Solution**: Wait 60 seconds (MongoDB checks every minute) or manually delete test documents

## Performance Benchmarks

- Document upload: < 5 seconds
- Verification data fetch: < 500ms
- Row update: < 200ms
- Full confirmation: < 2 seconds

## Browser Compatibility

Tested on:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

## Mobile Testing

Test responsive design:
1. Open DevTools
2. Toggle device toolbar
3. Test on iPhone 12/13 Pro size
4. Verify modal is scrollable and buttons are accessible

## Accessibility Testing

- ✅ Keyboard navigation works
- ✅ Screen reader friendly (aria labels)
- ✅ Color contrast meets WCAG 2.1 AA standards
- ✅ Focus indicators visible

## Security Checklist

- ✅ All endpoints require authentication
- ✅ User ID tracked for uploads and verifications
- ✅ No sensitive data in client-side logs
- ✅ API tokens not exposed in code
- ✅ XSS prevention (React escapes by default)

## Final Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Error handling tested
- [ ] Database indexes created
- [ ] API documentation updated
- [ ] User training completed
- [ ] Backup procedures tested
- [ ] Monitoring alerts configured
- [ ] Performance benchmarks met

## Support Contacts

Backend Issues: Check `Server/routes/scanner-enterprise.js` logs
Frontend Issues: Check browser console
Database Issues: Check MongoDB logs
LandingAI Issues: Check API response in network tab

---

**Happy Testing! 🚀**

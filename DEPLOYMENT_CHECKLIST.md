# Deployment Checklist - Medical Data Verification System

## 🚀 Pre-Deployment Checklist

### Backend Setup

- [ ] **MongoDB Indexes Created**
  ```javascript
  // Run in MongoDB shell
  use hms_database
  
  // Check existing indexes
  db.scanneddataverifications.getIndexes()
  
  // Should show:
  // 1. _id index
  // 2. patientId_1_verificationStatus_1 compound index
  // 3. sessionId_1 unique index
  // 4. createdAt_1 with expireAfterSeconds: 86400
  ```

- [ ] **Model Registered in index.js**
  ```bash
  # Verify export exists
  grep "ScannedDataVerification" Server/Models/index.js
  ```

- [ ] **Environment Variables Set**
  ```bash
  # Check .env file
  LANDINGAI_API_KEY=pat_XlbvTpObJfmlCvLPHjbSWTh2vzCciqZT
  MONGODB_URI=mongodb://localhost:27017/hms_database
  PORT=5000
  ```

- [ ] **Scanner Route Imported in server.js**
  ```javascript
  // Verify in Server/server.js or app.js
  const scannerRoute = require('./routes/scanner-enterprise');
  app.use('/api/scanner', scannerRoute);
  ```

- [ ] **Backend Server Starts Without Errors**
  ```bash
  cd Server
  npm start
  # Should see:
  # [scanner-landingai] ✅ LandingAI ADE initialized
  # Server running on port 5000
  ```

### Frontend Setup

- [ ] **Component Files Exist**
  ```bash
  # Check files exist
  ls react/hms/src/components/modals/DataVerificationModal.jsx
  ls react/hms/src/components/modals/DataVerificationModal.css
  ```

- [ ] **Component Imported in addpatient.jsx**
  ```javascript
  // Verify import
  grep "DataVerificationModal" react/hms/src/components/patient/addpatient.jsx
  ```

- [ ] **API Base URL Configured**
  ```javascript
  // Check in DataVerificationModal.jsx
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  ```

- [ ] **Frontend Starts Without Errors**
  ```bash
  cd react/hms
  npm start
  # Should compile without errors
  ```

### Dependency Check

- [ ] **Backend Dependencies Installed**
  ```bash
  cd Server
  npm list | grep -E "mongoose|multer|axios|uuid"
  # All should be present
  ```

- [ ] **Frontend Dependencies Installed**
  ```bash
  cd react/hms
  npm list | grep -E "react|framer-motion|axios"
  # All should be present
  ```

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] **Test Model Creation**
  ```javascript
  // In Node REPL
  const { ScannedDataVerification } = require('./Server/Models');
  const doc = new ScannedDataVerification({
    patientId: 'test123',
    sessionId: 'verify-test-123',
    documentType: 'PRESCRIPTION',
    extractedData: {},
    dataRows: []
  });
  doc.validate(); // Should not throw error
  ```

- [ ] **Test convertExtractedDataToRows Function**
  ```javascript
  // Create test data and verify conversion works
  const testData = {
    patient_details: { firstName: "John", age: 45 }
  };
  const rows = convertExtractedDataToRows(testData, 'PRESCRIPTION');
  console.log(rows.length > 0); // Should be true
  ```

### Integration Tests

- [ ] **Upload Test Document**
  - Upload a sample prescription image
  - Verify no errors in console
  - Check "Verify Data" button appears

- [ ] **Open Verification Modal**
  - Click "Verify Data" button
  - Modal opens successfully
  - All sections visible (header, rows, footer)

- [ ] **Edit Row**
  - Click edit on any row
  - Modify value
  - Save successfully
  - "Modified" badge appears

- [ ] **Delete Row**
  - Click delete on any row
  - Row marked as deleted
  - Stats update correctly

- [ ] **Confirm Verification**
  - Click "Confirm & Save"
  - Success message appears
  - Check database for saved document

- [ ] **Reject Verification**
  - Upload new document
  - Click "Reject & Discard"
  - Verification marked as rejected

### Database Tests

- [ ] **Verify Data Structure**
  ```javascript
  // Check one document
  db.scanneddataverifications.findOne().pretty()
  
  // Verify required fields exist:
  // - patientId
  // - sessionId
  // - documentType
  // - dataRows (array)
  // - verificationStatus
  // - createdAt
  // - expiresAt
  ```

- [ ] **Test TTL Expiration**
  ```javascript
  // Create test document with past expiration
  db.scanneddataverifications.insertOne({
    patientId: "test",
    sessionId: "test-expired",
    documentType: "PRESCRIPTION",
    extractedData: {},
    verificationStatus: "pending",
    dataRows: [],
    createdAt: new Date(Date.now() - 25*60*60*1000), // 25 hours ago
    expiresAt: new Date(Date.now() - 1*60*60*1000)   // 1 hour ago
  });
  
  // Wait 60 seconds, then check if deleted
  // (MongoDB TTL runs every minute)
  setTimeout(() => {
    db.scanneddataverifications.find({sessionId: "test-expired"}).count()
    // Should return 0
  }, 65000);
  ```

- [ ] **Test Confirmation Saves to Final Collection**
  ```javascript
  // After confirming a PRESCRIPTION
  db.prescriptiondocuments.findOne({patientId: "TEST_PATIENT_ID"})
  // Should exist
  
  // Check patient record
  db.patients.findOne({_id: ObjectId("TEST_PATIENT_ID")}).medicalReports
  // Should have new entry
  ```

### API Tests

- [ ] **Test All Endpoints**
  ```bash
  # 1. Scan endpoint
  curl -X POST http://localhost:5000/api/scanner/scan-medical \
    -H "x-auth-token: TOKEN" \
    -F "image=@test_prescription.jpg" \
    -F "patientId=PATIENT_ID"
  
  # 2. Get verification
  curl http://localhost:5000/api/scanner/verification/VERIFICATION_ID \
    -H "x-auth-token: TOKEN"
  
  # 3. Update row
  curl -X PUT http://localhost:5000/api/scanner/verification/VERIFICATION_ID/row/0 \
    -H "x-auth-token: TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"currentValue": "Updated"}'
  
  # 4. Delete row
  curl -X DELETE http://localhost:5000/api/scanner/verification/VERIFICATION_ID/row/1 \
    -H "x-auth-token: TOKEN"
  
  # 5. Confirm
  curl -X POST http://localhost:5000/api/scanner/verification/VERIFICATION_ID/confirm \
    -H "x-auth-token: TOKEN"
  
  # 6. Reject
  curl -X POST http://localhost:5000/api/scanner/verification/VERIFICATION_ID/reject \
    -H "x-auth-token: TOKEN"
  ```

---

## 🔒 Security Checklist

- [ ] **Authentication Required**
  - All endpoints return 401 without token
  - Invalid tokens rejected

- [ ] **Authorization Working**
  - Users can only access their own verifications
  - Admin can access all verifications

- [ ] **Input Validation**
  - Invalid verificationId returns 400/404
  - Invalid row index returns 400
  - Malformed JSON rejected

- [ ] **XSS Prevention**
  - React escapes all output
  - No `dangerouslySetInnerHTML` used

- [ ] **CSRF Protection**
  - Auth token required in header
  - No cookies used for authentication

- [ ] **Rate Limiting** (Optional)
  - Consider adding rate limits to prevent abuse

---

## 📊 Performance Checklist

- [ ] **Response Times Acceptable**
  - Scan endpoint: < 5 seconds
  - Get verification: < 500ms
  - Update row: < 200ms
  - Confirm: < 2 seconds

- [ ] **Database Queries Optimized**
  ```javascript
  // Verify indexes are used
  db.scanneddataverifications.find({patientId: "..."}).explain()
  // Should show "IXSCAN" not "COLLSCAN"
  ```

- [ ] **File Upload Limits Set**
  ```javascript
  // In scanner-enterprise.js
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_UPLOAD: 10
  ```

- [ ] **Memory Leaks Checked**
  - No memory leaks in React components
  - Cleanup functions in useEffect
  - Event listeners removed

---

## 🌐 Browser Compatibility

- [ ] **Chrome** (Latest)
- [ ] **Firefox** (Latest)
- [ ] **Safari** (Latest)
- [ ] **Edge** (Latest)
- [ ] **Mobile Safari** (iOS 14+)
- [ ] **Mobile Chrome** (Android 10+)

---

## 📱 Responsive Design

- [ ] **Desktop** (1920x1080)
- [ ] **Laptop** (1366x768)
- [ ] **Tablet** (iPad Pro)
- [ ] **Mobile** (iPhone 12/13)
- [ ] **Small Mobile** (iPhone SE)

---

## ♿ Accessibility

- [ ] **Keyboard Navigation**
  - Tab through all interactive elements
  - Enter/Space activates buttons
  - Escape closes modal

- [ ] **Screen Reader**
  - All buttons have aria-labels
  - Form fields have labels
  - Error messages announced

- [ ] **Color Contrast**
  - Text readable on backgrounds
  - Meets WCAG 2.1 AA standards

- [ ] **Focus Indicators**
  - Visible focus outlines
  - Not removed with CSS

---

## 📝 Documentation

- [ ] **README Updated**
- [ ] **API Documentation Complete**
- [ ] **User Guide Written**
- [ ] **Code Comments Added**
- [ ] **Changelog Updated**

---

## 🚨 Error Handling

- [ ] **Frontend Errors**
  - Network errors shown to user
  - Loading states displayed
  - Graceful fallbacks

- [ ] **Backend Errors**
  - All errors logged
  - User-friendly error messages
  - Stack traces in dev mode only

- [ ] **Database Errors**
  - Connection failures handled
  - Timeout errors caught
  - Validation errors returned

---

## 📦 Deployment Steps

### 1. Backup Database
```bash
mongodump --db hms_database --out backup_$(date +%Y%m%d)
```

### 2. Deploy Backend
```bash
cd Server
npm install --production
pm2 restart hms-backend
pm2 logs --lines 100
```

### 3. Deploy Frontend
```bash
cd react/hms
npm install
npm run build
# Copy build/ to web server
```

### 4. Verify Deployment
```bash
# Check backend health
curl https://your-domain.com/api/scanner/health

# Check frontend loads
curl https://your-domain.com
```

### 5. Monitor Logs
```bash
# Backend logs
pm2 logs hms-backend

# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Nginx logs (if applicable)
tail -f /var/log/nginx/access.log
```

---

## 🔄 Rollback Plan

If deployment fails:

1. **Stop Services**
   ```bash
   pm2 stop hms-backend
   ```

2. **Restore Database**
   ```bash
   mongorestore --db hms_database backup_YYYYMMDD/hms_database
   ```

3. **Revert Code**
   ```bash
   git checkout previous-stable-tag
   npm install
   pm2 restart hms-backend
   ```

4. **Verify Rollback**
   - Test old functionality works
   - Check logs for errors

---

## ✅ Post-Deployment Verification

- [ ] Upload test document works
- [ ] Verification modal opens
- [ ] Data can be edited
- [ ] Confirmation saves correctly
- [ ] No errors in production logs
- [ ] Performance acceptable
- [ ] All users can access

---

## 📞 Emergency Contacts

**Backend Issues**: [Backend Team Contact]
**Frontend Issues**: [Frontend Team Contact]
**Database Issues**: [DBA Contact]
**DevOps Issues**: [DevOps Contact]

---

## 🎉 Launch Criteria

System is ready for production when:

- ✅ All checklist items completed
- ✅ All tests passing
- ✅ Performance benchmarks met
- ✅ Security audit passed
- ✅ User acceptance testing complete
- ✅ Rollback plan tested
- ✅ Team trained on new feature
- ✅ Documentation complete

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Approved By**: _____________

---

**Status**: Ready for Deployment ✅


# Document Upload & Verification System - Quick Reference

## 🎯 System Overview

### What It Does
1. **Upload**: User uploads medical document (PDF/Image)
2. **Extract**: AI (LandingAI) extracts structured data
3. **Stage**: Data stored temporarily for 24 hours
4. **Verify**: User reviews and edits extracted data
5. **Confirm**: Verified data saved to permanent storage

---

## 📊 Current Status

### ✅ What Works
- AI-powered data extraction (LandingAI)
- Two-stage verification (staging → permanent)
- User can edit/delete fields before saving
- Auto-expiration (24 hours)
- Category-based organization
- Confidence scoring

### ⚠️ What Needs Fixing
- ❌ **No transaction support** → Data can be inconsistent
- ❌ **No validation** → Invalid data can be saved
- ❌ **No duplicate detection** → Same doc uploaded twice
- ❌ **No auto-save** → Edits lost if connection fails

---

## 📁 Key Files

### Backend
```
Server/
├── routes/scanner-enterprise.js          ← Main API endpoints
├── Models/
│   ├── ScannedDataVerification.js       ← Temporary staging (24h)
│   ├── PrescriptionDocument.js          ← Permanent storage
│   ├── LabReportDocument.js             ← Permanent storage
│   └── MedicalHistoryDocument.js        ← Permanent storage
└── utils/landingai_scanner.js           ← AI integration
```

### Frontend
```
react/hms/src/
├── components/modals/
│   ├── DataVerificationModal.jsx        ← Verification UI
│   └── DataVerificationModal.css
└── services/scannerService.js           ← API calls
```

---

## 🔄 Data Flow

### 1. Upload Phase
```
User uploads file
    ↓
POST /api/scanner-enterprise/scan-medical
    ↓
LandingAI extracts data
    ↓
Save to ScannedDataVerification (pending)
    ↓
Return verificationId
```

### 2. Verification Phase
```
User clicks "Verify Data"
    ↓
GET /api/scanner-enterprise/verification/:id
    ↓
Modal shows extracted fields
    ↓
User edits/deletes rows
    ↓
PUT /verification/:id/row/:index
```

### 3. Confirmation Phase
```
User clicks "Confirm & Save"
    ↓
POST /api/scanner-enterprise/verification/:id/confirm
    ↓
Save to permanent collection:
  - PrescriptionDocument
  - LabReportDocument
  - MedicalHistoryDocument
    ↓
Update Patient.medicalReports[]
    ↓
Mark verification as 'verified'
```

---

## 🗄️ Database Schema

### ScannedDataVerification (Temporary)
```javascript
{
  patientId: String,
  sessionId: String (unique),
  documentType: 'PRESCRIPTION' | 'LAB_REPORT' | 'MEDICAL_HISTORY',
  pdfId: String,
  verificationStatus: 'pending' | 'verified' | 'rejected',
  
  dataRows: [
    {
      fieldName: String,
      displayLabel: String,
      originalValue: Mixed,
      currentValue: Mixed,
      dataType: 'string' | 'number' | 'date' | 'object',
      isModified: Boolean,
      isDeleted: Boolean,
      confidence: Number (0-1),
      category: 'patient_details' | 'medications' | 'vitals' | etc
    }
  ],
  
  createdAt: Date (expires after 24 hours),
  expiresAt: Date
}
```

### PrescriptionDocument (Permanent)
```javascript
{
  patientId: String,
  pdfId: String,
  doctorName: String,
  hospitalName: String,
  prescriptionDate: Date,
  medicines: [
    {
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }
  ],
  diagnosis: String,
  ocrText: String,
  ocrConfidence: Number,
  uploadDate: Date
}
```

---

## 🔌 API Endpoints

### Upload & Scan
```http
POST /api/scanner-enterprise/scan-medical
Content-Type: multipart/form-data

Body:
  - image: File (required)
  - patientId: String (optional)
  - documentType: String (optional)

Returns:
{
  success: true,
  verificationId: "65abc...",
  verificationRequired: true,
  extractedData: { ... }
}
```

### Get Verification
```http
GET /api/scanner-enterprise/verification/:verificationId

Returns:
{
  success: true,
  verification: {
    id: "65abc...",
    patientId: "PAT123",
    documentType: "PRESCRIPTION",
    dataRows: [ ... ],
    verificationStatus: "pending"
  }
}
```

### Update Row
```http
PUT /api/scanner-enterprise/verification/:verificationId/row/:rowIndex
Content-Type: application/json

Body:
{
  currentValue: "Corrected Value"
}
```

### Delete Row
```http
DELETE /api/scanner-enterprise/verification/:verificationId/row/:rowIndex
```

### Confirm
```http
POST /api/scanner-enterprise/verification/:verificationId/confirm

Returns:
{
  success: true,
  reportId: "65report...",
  documentType: "PRESCRIPTION"
}
```

### Reject
```http
POST /api/scanner-enterprise/verification/:verificationId/reject

Returns:
{
  success: true,
  message: "Verification rejected and data discarded"
}
```

---

## 🐛 Critical Issues

### Issue 1: No Transaction Support
**Problem**: Multiple database operations without rollback capability.

**Example**:
```javascript
await prescriptionDoc.save();  // ✅ Success
await patient.save();          // ❌ Fails - but prescription already saved!
```

**Fix**: Use MongoDB transactions (see DOCUMENT_VERIFICATION_IMPROVEMENTS.md)

### Issue 2: No Validation
**Problem**: Invalid data can be saved.

**Example**:
```javascript
{
  medicines: [],           // Empty! No medicines prescribed
  doctorName: "",         // Empty!
  prescriptionDate: null  // Null!
}
// Still saves to database!
```

**Fix**: Add validation layer before saving.

### Issue 3: No Duplicate Detection
**Problem**: Same document uploaded multiple times.

**Example**:
```javascript
Upload prescription.pdf → saves as report-1
Upload prescription.pdf again → saves as report-2
// Now duplicate data!
```

**Fix**: Hash-based duplicate detection.

---

## 💡 Improvement Priority

### Priority 1: Critical (Week 1)
1. ✅ Add transaction support
2. ✅ Add validation layer
3. ✅ Add duplicate detection

### Priority 2: Important (Week 2-4)
4. ⚡ Auto-save functionality
5. ⚡ Confidence-based UI
6. ⚡ Expiration warnings

### Priority 3: Enhancements (Month 2+)
7. 🚀 Batch processing
8. 🚀 Smart suggestions
9. 🚀 Audit trail

---

## 📝 Code Examples

### Current Confirmation Logic (Simplified)
```javascript
router.post('/verification/:verificationId/confirm', auth, async (req, res) => {
  try {
    // Get verification
    const verification = await ScannedDataVerification.findById(verificationId);
    
    // Filter verified rows
    const verifiedRows = verification.dataRows.filter(row => !row.isDeleted);
    
    // Build document based on type
    if (verification.documentType === 'PRESCRIPTION') {
      const medicines = verifiedRows
        .filter(r => r.category === 'medications')
        .map(r => r.currentValue);
      
      const prescriptionDoc = new PrescriptionDocument({
        patientId: verification.patientId,
        medicines: medicines,
        // ... other fields
      });
      
      await prescriptionDoc.save();
    }
    
    // Update patient
    patient.medicalReports.push({ reportId, ... });
    await patient.save();
    
    // Update verification
    verification.verificationStatus = 'verified';
    await verification.save();
    
    return res.json({ success: true });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Improved with Transactions
```javascript
router.post('/verification/:verificationId/confirm', auth, async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // All operations use { session }
    const verification = await ScannedDataVerification
      .findById(verificationId)
      .session(session);
    
    const prescriptionDoc = new PrescriptionDocument({ ... });
    await prescriptionDoc.save({ session });
    
    await patient.save({ session });
    await verification.save({ session });
    
    // Commit all or nothing
    await session.commitTransaction();
    return res.json({ success: true });
    
  } catch (error) {
    // Rollback on any error
    await session.abortTransaction();
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});
```

---

## 🧪 Testing Checklist

### Upload Testing
- [ ] Upload valid PDF
- [ ] Upload valid image (JPG/PNG)
- [ ] Upload invalid file type
- [ ] Upload same file twice (should warn)
- [ ] Check verificationId returned

### Verification Testing
- [ ] Open verification modal
- [ ] All extracted fields display
- [ ] Edit a field
- [ ] Delete a field
- [ ] Check confidence scores
- [ ] Check category badges

### Confirmation Testing
- [ ] Confirm with all fields
- [ ] Confirm with some fields deleted
- [ ] Confirm with edited fields
- [ ] Check permanent collection updated
- [ ] Check patient record updated
- [ ] Check verification marked 'verified'

### Error Testing
- [ ] Network failure during upload
- [ ] Network failure during edit
- [ ] Server error during confirmation
- [ ] Session expired (24 hours)
- [ ] Invalid data validation

---

## 🔧 Common Operations

### Check Pending Verifications
```javascript
// MongoDB query
db.scanneddataverifications.find({
  patientId: "PAT123",
  verificationStatus: "pending"
})
```

### Check Verification Expiration
```javascript
// MongoDB query
db.scanneddataverifications.find({
  expiresAt: { $lt: new Date() }
})
```

### Force Delete Verification
```javascript
// MongoDB query
db.scanneddataverifications.deleteOne({
  _id: ObjectId("65abc...")
})
```

### Check if Document Saved
```javascript
// Check prescription saved
db.prescriptiondocuments.findOne({ pdfId: "65pdf..." })

// Check patient updated
db.patients.findOne(
  { _id: "PAT123" },
  { medicalReports: 1 }
)
```

---

## 📚 Related Documentation

1. **DOCUMENT_UPLOAD_VERIFICATION_ANALYSIS.md** - Complete system analysis
2. **DOCUMENT_VERIFICATION_IMPROVEMENTS.md** - Step-by-step implementation guide
3. **MEDICAL_DATA_VERIFICATION_SYSTEM.md** - User guide and architecture

---

## 🆘 Troubleshooting

### Modal doesn't open
- Check verificationId is valid
- Check token in localStorage
- Check API endpoint returns 200

### Data not saving
- Check validation errors in server logs
- Check MongoDB connection
- Check patient exists

### Auto-expiration not working
- Check TTL index created: `db.scanneddataverifications.getIndexes()`
- Create index: `db.scanneddataverifications.createIndex({createdAt: 1}, {expireAfterSeconds: 86400})`

### Duplicate uploads
- Implement duplicate detection (see improvements doc)
- Check contentHash field in PatientPDF

---

## 📞 Support

For questions or issues:
1. Check server logs: `Server/logs/`
2. Check browser console for frontend errors
3. Review API responses in Network tab
4. Refer to detailed docs

---

**Quick Start**: Read DOCUMENT_UPLOAD_VERIFICATION_ANALYSIS.md for full details.

**Implementation**: Follow DOCUMENT_VERIFICATION_IMPROVEMENTS.md step-by-step.

**Version**: 1.0 | **Last Updated**: 2024-02-24

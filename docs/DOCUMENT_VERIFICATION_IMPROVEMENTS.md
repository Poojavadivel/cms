# Document Verification System - Implementation Guide for Improvements

## 🎯 Quick Implementation Checklist

### ✅ Critical Fixes (Implement First - Week 1)

- [ ] **Transaction Support** - Prevent data inconsistency
- [ ] **Validation Layer** - Ensure data quality
- [ ] **Duplicate Detection** - Prevent duplicate uploads

### ⚡ Important Improvements (Week 2-4)

- [ ] **Auto-Save** - Prevent data loss
- [ ] **Confidence-Based UI** - Better user experience
- [ ] **Expiration Warnings** - User notifications

### 🚀 Enhancements (Month 2+)

- [ ] **Batch Processing** - Productivity boost
- [ ] **Smart Suggestions** - AI assistance
- [ ] **Audit Trail** - Complete history

---

## 1. Transaction Support Implementation

### File: `Server/routes/scanner-enterprise.js`

Add transaction wrapper to the confirmation endpoint:

```javascript
// Add at the top of file
const mongoose = require('mongoose');

// Replace existing confirm endpoint (line ~686) with:
router.post('/verification/:verificationId/confirm', auth, async (req, res) => {
  const batchId = `confirm-${Date.now()}`;
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    session.startTransaction();
    
    const { verificationId } = req.params;
    
    // Fetch verification with session
    const verification = await ScannedDataVerification
      .findById(verificationId)
      .session(session);
    
    if (!verification) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Verification session not found' 
      });
    }
    
    if (verification.verificationStatus === 'verified') {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Already verified' 
      });
    }
    
    logh(batchId, `✅ Confirming verification: ${verification.sessionId}`);
    
    // Filter verified rows
    const verifiedRows = verification.dataRows.filter(row => !row.isDeleted);
    
    if (verifiedRows.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'No data to save. All rows are deleted.'
      });
    }
    
    let reportId = null;
    const patient = await Patient.findById(verification.patientId).session(session);
    
    if (!patient) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }
    
    // Save to appropriate collection based on document type
    if (verification.documentType === 'PRESCRIPTION') {
      const prescData = verification.extractedData;
      
      // Build medicines array from verified rows
      const medicines = verifiedRows
        .filter(r => r.category === 'medications')
        .map(r => {
          const med = r.currentValue;
          return {
            name: med.name || '',
            dosage: med.dose || '',
            frequency: med.frequency || '',
            duration: med.duration || '',
            instructions: med.instructions || ''
          };
        });
      
      const prescriptionDoc = new PrescriptionDocument({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        doctorName: verifiedRows.find(r => r.fieldName === 'doctor_name')?.currentValue || prescData.doctor_details?.name || '',
        hospitalName: verifiedRows.find(r => r.fieldName === 'hospital_name')?.currentValue || prescData.doctor_details?.hospital || '',
        prescriptionDate: prescData.prescription_date || new Date(),
        medicines: medicines,
        diagnosis: verifiedRows.find(r => r.fieldName === 'diagnosis')?.currentValue || prescData.diagnosis || '',
        instructions: prescData.notes || '',
        ocrText: verification.metadata.markdown || '',
        ocrEngine: 'landingai-ade',
        ocrConfidence: verification.metadata.ocrConfidence || 0.95,
        extractedData: verification.extractedData,
        status: 'completed',
        uploadedBy: verification.uploadedBy,
        uploadDate: new Date()
      });
      
      await prescriptionDoc.save({ session });
      reportId = prescriptionDoc._id.toString();
      logh(batchId, `💊 Created PrescriptionDocument: ${reportId}`);
      
    } else if (verification.documentType === 'LAB_REPORT') {
      const labData = verification.extractedData.labReport || {};
      
      const results = verifiedRows
        .filter(r => r.category === 'lab_results' && r.fieldName.startsWith('labResult_'))
        .map(r => {
          const result = r.currentValue;
          return {
            testName: result.testName || '',
            value: result.value?.toString() || '',
            unit: result.unit || '',
            referenceRange: result.normalRange || '',
            flag: result.flag || 'Normal'
          };
        });
      
      const labReportDoc = new LabReportDocument({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        testType: verifiedRows.find(r => r.fieldName === 'testType')?.currentValue || labData.testType || 'GENERAL',
        testCategory: labData.testCategory || 'General',
        intent: labData.testType || 'GENERAL',
        labName: verifiedRows.find(r => r.fieldName === 'labName')?.currentValue || labData.labName || '',
        reportDate: verifiedRows.find(r => r.fieldName === 'reportDate')?.currentValue || labData.reportDate || new Date(),
        results: results,
        ocrText: verification.metadata.markdown || '',
        ocrEngine: 'landingai-ade',
        ocrConfidence: verification.metadata.ocrConfidence || 0.95,
        extractedData: verification.extractedData,
        extractionQuality: 'excellent',
        status: 'completed',
        uploadedBy: verification.uploadedBy,
        uploadDate: new Date()
      });
      
      await labReportDoc.save({ session });
      reportId = labReportDoc._id.toString();
      logh(batchId, `🧪 Created LabReportDocument: ${reportId}`);
      
    } else if (verification.documentType === 'MEDICAL_HISTORY') {
      const historyData = verification.extractedData;
      
      const medications = verifiedRows
        .filter(r => r.category === 'medications')
        .map(r => r.currentValue)
        .join(', ');
      
      const medicalHistoryDoc = new MedicalHistoryDocument({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        title: 'Medical History Record',
        category: 'General',
        medicalHistory: verifiedRows.find(r => r.fieldName === 'medicalHistory')?.currentValue || historyData.medicalHistory || '',
        diagnosis: verifiedRows.find(r => r.fieldName === 'diagnosis')?.currentValue || historyData.diagnosis || '',
        allergies: verifiedRows.find(r => r.fieldName === 'allergies')?.currentValue || historyData.allergies || '',
        chronicConditions: historyData.chronicConditions || [],
        surgicalHistory: historyData.surgicalHistory || [],
        familyHistory: historyData.familyHistory || '',
        medications: medications,
        recordDate: historyData.recordDate || new Date(),
        reportDate: historyData.recordDate || new Date(),
        ocrText: verification.metadata.markdown || '',
        ocrEngine: 'landingai-ade',
        ocrConfidence: verification.metadata.ocrConfidence || 0.95,
        extractedData: verification.extractedData,
        status: 'completed',
        uploadedBy: verification.uploadedBy,
        uploadDate: new Date()
      });
      
      await medicalHistoryDoc.save({ session });
      reportId = medicalHistoryDoc._id.toString();
      logh(batchId, `📋 Created MedicalHistoryDocument: ${reportId}`);
    }
    
    // Update patient record
    const reportTypeMap = {
      'PRESCRIPTION': 'PRESCRIPTION',
      'LAB_REPORT': 'LAB_REPORT',
      'MEDICAL_HISTORY': 'DISCHARGE_SUMMARY',
      'GENERAL': 'GENERAL'
    };
    
    patient.medicalReports.push({
      reportId: reportId,
      reportType: reportTypeMap[verification.documentType] || 'GENERAL',
      imagePath: verification.pdfId,
      uploadDate: new Date(),
      uploadedBy: verification.uploadedBy,
      extractedData: verification.extractedData,
      ocrText: verification.metadata.markdown,
      intent: verification.documentType
    });
    
    await patient.save({ session });
    logh(batchId, `✅ Report attached to patient: ${verification.patientId}`);
    
    // Update verification status
    verification.verificationStatus = 'verified';
    verification.verifiedBy = req.user?._id || null;
    verification.verifiedAt = new Date();
    await verification.save({ session });
    
    // COMMIT TRANSACTION - All or nothing!
    await session.commitTransaction();
    logh(batchId, `✅ Verification complete - Transaction committed`);
    
    return res.json({
      success: true,
      message: 'Data verified and saved successfully',
      reportId: reportId,
      documentType: verification.documentType
    });
    
  } catch (error) {
    // ROLLBACK on any error
    await session.abortTransaction();
    logh(batchId, '❌ Confirmation failed, transaction rolled back:', error.message);
    console.error('[CONFIRM ERROR]', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Verification failed. Please try again.',
      error: error.message 
    });
    
  } finally {
    // Always end session
    session.endSession();
  }
});
```

---

## 2. Validation Layer Implementation

### Create new file: `Server/utils/validation.js`

```javascript
// Server/utils/validation.js
// Validation service for medical documents

class ValidationService {
  
  /**
   * Validate prescription data
   */
  validatePrescription(data) {
    const errors = [];
    
    // Required fields
    if (!data.patientId) {
      errors.push('Patient ID is required');
    }
    
    if (!data.pdfId) {
      errors.push('PDF document ID is required');
    }
    
    // Medicines validation
    if (!data.medicines || !Array.isArray(data.medicines)) {
      errors.push('Medicines array is required');
    } else if (data.medicines.length === 0) {
      errors.push('At least one medicine must be prescribed');
    } else {
      data.medicines.forEach((med, idx) => {
        if (!med.name || med.name.trim() === '') {
          errors.push(`Medicine ${idx + 1}: Name is required`);
        }
        if (!med.dosage || med.dosage.trim() === '') {
          errors.push(`Medicine ${idx + 1}: Dosage is required`);
        }
        if (!med.frequency || med.frequency.trim() === '') {
          errors.push(`Medicine ${idx + 1}: Frequency is required`);
        }
      });
    }
    
    // Date validation
    if (data.prescriptionDate) {
      const date = new Date(data.prescriptionDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid prescription date format');
      }
      // Check if date is not in future
      if (date > new Date()) {
        errors.push('Prescription date cannot be in the future');
      }
    }
    
    // Doctor name recommended
    if (!data.doctorName || data.doctorName.trim() === '') {
      errors.push('Doctor name is recommended');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
  
  /**
   * Validate lab report data
   */
  validateLabReport(data) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!data.patientId) {
      errors.push('Patient ID is required');
    }
    
    if (!data.pdfId) {
      errors.push('PDF document ID is required');
    }
    
    if (!data.testType || data.testType.trim() === '') {
      errors.push('Test type is required');
    }
    
    // Results validation
    if (!data.results || !Array.isArray(data.results)) {
      errors.push('Test results array is required');
    } else if (data.results.length === 0) {
      warnings.push('No test results found');
    } else {
      data.results.forEach((result, idx) => {
        if (!result.testName || result.testName.trim() === '') {
          errors.push(`Result ${idx + 1}: Test name is required`);
        }
        if (result.value === undefined || result.value === null || result.value === '') {
          errors.push(`Result ${idx + 1}: Value is required`);
        }
        // Validate flag if present
        if (result.flag && !['normal', 'high', 'low', 'Normal', 'High', 'Low', ''].includes(result.flag)) {
          warnings.push(`Result ${idx + 1}: Invalid flag value '${result.flag}'`);
        }
      });
    }
    
    // Date validation
    if (data.reportDate) {
      const date = new Date(data.reportDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid report date format');
      }
      if (date > new Date()) {
        errors.push('Report date cannot be in the future');
      }
    }
    
    // Lab name recommended
    if (!data.labName || data.labName.trim() === '') {
      warnings.push('Lab name is recommended');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate medical history data
   */
  validateMedicalHistory(data) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!data.patientId) {
      errors.push('Patient ID is required');
    }
    
    if (!data.pdfId) {
      errors.push('PDF document ID is required');
    }
    
    // At least one content field required
    const hasContent = 
      (data.medicalHistory && data.medicalHistory.trim() !== '') ||
      (data.diagnosis && data.diagnosis.trim() !== '') ||
      (data.allergies && data.allergies.trim() !== '') ||
      (data.chronicConditions && data.chronicConditions.length > 0) ||
      (data.surgicalHistory && data.surgicalHistory.length > 0);
    
    if (!hasContent) {
      errors.push('At least one medical history field must have content');
    }
    
    // Date validation
    if (data.recordDate) {
      const date = new Date(data.recordDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid record date format');
      }
    }
    
    // Category validation
    const validCategories = ['General', 'Chronic', 'Acute', 'Surgical', 'Family', 'Other'];
    if (data.category && !validCategories.includes(data.category)) {
      warnings.push(`Invalid category '${data.category}'. Using 'General'`);
      data.category = 'General';
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Sanitize and clean data
   */
  sanitizeData(data, type) {
    // Remove null/undefined values
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
      }
      // Trim strings
      if (typeof data[key] === 'string') {
        data[key] = data[key].trim();
      }
    });
    
    return data;
  }
}

module.exports = new ValidationService();
```

### Update `scanner-enterprise.js` to use validation:

```javascript
// At the top, add:
const validationService = require('../utils/validation');

// In the confirm endpoint, before saving:
if (verification.documentType === 'PRESCRIPTION') {
  const prescData = verification.extractedData;
  
  // ... build medicines array ...
  
  const prescriptionData = {
    patientId: verification.patientId,
    pdfId: verification.pdfId,
    // ... rest of fields ...
  };
  
  // VALIDATE before saving
  const validation = validationService.validatePrescription(prescriptionData);
  
  if (!validation.isValid) {
    await session.abortTransaction();
    return res.status(400).json({
      success: false,
      message: 'Prescription data validation failed',
      errors: validation.errors,
      warnings: validation.warnings
    });
  }
  
  // Log warnings if any
  if (validation.warnings.length > 0) {
    logh(batchId, `⚠️ Warnings: ${validation.warnings.join(', ')}`);
  }
  
  const prescriptionDoc = new PrescriptionDocument(prescriptionData);
  await prescriptionDoc.save({ session });
  // ...
}

// Similar validation for LAB_REPORT and MEDICAL_HISTORY
```

---

## 3. Duplicate Detection Implementation

### Update `PatientPDF` model to include hash:

```javascript
// Server/Models/PatientPDF.js (or wherever it's defined)
// Add this field to the schema:

const PatientPDFSchema = new Schema({
  // ... existing fields ...
  
  contentHash: {
    type: String,
    index: true,
    default: null
  }
});

// Add compound index for duplicate checking
PatientPDFSchema.index({ patientId: 1, contentHash: 1 });
```

### Add duplicate detection utility:

Create `Server/utils/duplicateDetection.js`:

```javascript
// Server/utils/duplicateDetection.js
const crypto = require('crypto');
const { PatientPDF } = require('../Models');

class DuplicateDetectionService {
  
  /**
   * Generate hash from file buffer
   */
  generateHash(buffer) {
    return crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');
  }
  
  /**
   * Check if document is duplicate for this patient
   */
  async checkDuplicate(patientId, fileBuffer) {
    const hash = this.generateHash(fileBuffer);
    
    const existing = await PatientPDF.findOne({
      patientId: patientId,
      contentHash: hash
    }).select('_id fileName uploadedAt');
    
    if (existing) {
      return {
        isDuplicate: true,
        existingPdfId: existing._id,
        fileName: existing.fileName,
        uploadedAt: existing.uploadedAt,
        hash: hash
      };
    }
    
    return {
      isDuplicate: false,
      hash: hash
    };
  }
  
  /**
   * Find similar documents (fuzzy matching based on size and date)
   */
  async findSimilar(patientId, fileSize, uploadDate) {
    const threshold = 0.1; // 10% size difference
    const minSize = fileSize * (1 - threshold);
    const maxSize = fileSize * (1 + threshold);
    
    // Find documents uploaded within 1 hour with similar size
    const oneHourAgo = new Date(uploadDate - 60 * 60 * 1000);
    const oneHourLater = new Date(uploadDate.getTime() + 60 * 60 * 1000);
    
    const similar = await PatientPDF.find({
      patientId: patientId,
      size: { $gte: minSize, $lte: maxSize },
      uploadedAt: { $gte: oneHourAgo, $lte: oneHourLater }
    }).limit(5);
    
    return similar;
  }
}

module.exports = new DuplicateDetectionService();
```

### Use in scanner endpoint:

```javascript
// In scanner-enterprise.js
const duplicateDetection = require('../utils/duplicateDetection');

// In the /scan-medical endpoint, after reading file:
const fileBuffer = await fs.readFile(req.file.path);

// Check for duplicates
const duplicateCheck = await duplicateDetection.checkDuplicate(patientId, fileBuffer);

if (duplicateCheck.isDuplicate) {
  await cleanupTempFile(req.file.path);
  
  return res.status(409).json({
    success: false,
    message: 'This document has already been uploaded for this patient',
    duplicate: {
      pdfId: duplicateCheck.existingPdfId,
      fileName: duplicateCheck.fileName,
      uploadedAt: duplicateCheck.uploadedAt
    },
    suggestion: 'If you want to re-upload, please delete the existing document first'
  });
}

// When saving PDF, include hash
const patientPDF = new PatientPDF({
  patientId: patientId,
  title: `${scanResult.documentType} Document (Pending Verification)`,
  fileName: req.file.originalname,
  mimeType: req.file.mimetype,
  data: fileBuffer,
  size: fileBuffer.length,
  contentHash: duplicateCheck.hash, // Add hash
  uploadedAt: new Date()
});
```

---

## 4. Auto-Save Implementation

### Frontend: Add auto-save to DataVerificationModal.jsx

```javascript
// In DataVerificationModal.jsx
import { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash'; // Make sure lodash is installed

const DataVerificationModal = ({ isOpen, onClose, verificationId, onConfirm }) => {
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [lastSaved, setLastSaved] = useState(null);
  
  // Auto-save function (debounced)
  const autoSaveRows = useCallback(
    debounce(async (verificationId, dataRows) => {
      if (!verificationId || !dataRows) return;
      
      setAutoSaveStatus('saving');
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
        
        await axios.put(
          `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}/bulk`,
          { dataRows },
          {
            headers: {
              'x-auth-token': token,
              'Content-Type': 'application/json'
            }
          }
        );
        
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('error');
      }
    }, 3000), // Save 3 seconds after last change
    []
  );
  
  // Trigger auto-save when data changes
  useEffect(() => {
    if (verificationData?.dataRows && verificationId) {
      autoSaveRows(verificationId, verificationData.dataRows);
    }
  }, [verificationData?.dataRows, verificationId, autoSaveRows]);
  
  // Save status indicator
  const renderSaveStatus = () => {
    if (autoSaveStatus === 'saving') {
      return (
        <div className="auto-save-status saving">
          <FiLoader className="spin" /> Saving...
        </div>
      );
    } else if (autoSaveStatus === 'saved') {
      return (
        <div className="auto-save-status saved">
          <MdCheckCircle /> Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}
        </div>
      );
    } else if (autoSaveStatus === 'error') {
      return (
        <div className="auto-save-status error">
          <MdWarning /> Save failed - changes not saved
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="verification-modal">
      {/* Add save status indicator to header */}
      <div className="modal-header">
        <h2>Verify Extracted Data</h2>
        {renderSaveStatus()}
        {/* ... rest of header */}
      </div>
      
      {/* ... rest of modal */}
    </div>
  );
};
```

### Backend: Add bulk update endpoint

```javascript
// In scanner-enterprise.js
router.put('/verification/:verificationId/bulk', auth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { dataRows } = req.body;
    
    if (!dataRows || !Array.isArray(dataRows)) {
      return res.status(400).json({
        success: false,
        message: 'dataRows array is required'
      });
    }
    
    const verification = await ScannedDataVerification.findById(verificationId);
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification session not found'
      });
    }
    
    // Update data rows
    verification.dataRows = dataRows;
    await verification.save();
    
    return res.json({
      success: true,
      message: 'Data auto-saved successfully',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('[BULK UPDATE ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Auto-save failed',
      error: error.message
    });
  }
});
```

### CSS for auto-save status:

```css
/* Add to DataVerificationModal.css */
.auto-save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.auto-save-status.saving {
  background-color: #FFF3E0;
  color: #F57C00;
}

.auto-save-status.saved {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.auto-save-status.error {
  background-color: #FFEBEE;
  color: #C62828;
}

.auto-save-status svg {
  width: 14px;
  height: 14px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}
```

---

## 5. Confidence-Based UI Enhancement

### Update DataVerificationModal.jsx:

```javascript
// Add confidence color helper
const getConfidenceColor = (confidence) => {
  if (confidence >= 0.95) return { bg: '#E8F5E9', color: '#2E7D32', label: 'High' };
  if (confidence >= 0.85) return { bg: '#FFF9C4', color: '#F57F17', label: 'Good' };
  if (confidence >= 0.70) return { bg: '#FFE0B2', color: '#E65100', label: 'Medium' };
  return { bg: '#FFCDD2', color: '#C62828', label: 'Low' };
};

// In the row rendering:
const VerificationRow = ({ row, index, onEdit, onDelete }) => {
  const confidenceStyle = getConfidenceColor(row.confidence || 0.95);
  
  return (
    <div className={`verification-row ${row.isDeleted ? 'deleted' : ''}`}>
      {/* Confidence badge */}
      <div 
        className="confidence-badge"
        style={{ 
          backgroundColor: confidenceStyle.bg,
          color: confidenceStyle.color
        }}
        title={`AI Confidence: ${(row.confidence * 100).toFixed(1)}%`}
      >
        {confidenceStyle.label}
      </div>
      
      {/* Category badge */}
      <div className="category-badge" style={{ backgroundColor: getCategoryColor(row.category) }}>
        {row.category.replace('_', ' ')}
      </div>
      
      {/* Field label */}
      <div className="field-label">{row.displayLabel}</div>
      
      {/* Current value */}
      <div className="field-value">
        {renderValue(row.currentValue, row.dataType)}
      </div>
      
      {/* Modified indicator */}
      {row.isModified && (
        <div className="modified-badge" title="This field has been edited">
          Modified
        </div>
      )}
      
      {/* Actions */}
      <div className="row-actions">
        <button onClick={() => onEdit(index, row)} title="Edit">
          <MdEdit />
        </button>
        <button onClick={() => onDelete(index)} title="Delete">
          <MdDelete />
        </button>
      </div>
    </div>
  );
};

// Add low-confidence warning
const LowConfidenceWarning = ({ rows }) => {
  const lowConfidenceRows = rows.filter(r => r.confidence < 0.85 && !r.isDeleted);
  
  if (lowConfidenceRows.length === 0) return null;
  
  return (
    <div className="low-confidence-warning">
      <MdWarning />
      <span>
        {lowConfidenceRows.length} field{lowConfidenceRows.length > 1 ? 's' : ''} 
        {' '}have low confidence. Please review carefully.
      </span>
    </div>
  );
};
```

### CSS for confidence indicators:

```css
.confidence-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.low-confidence-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #FFF3E0;
  border-left: 4px solid #FF9800;
  border-radius: 4px;
  margin-bottom: 16px;
  color: #E65100;
  font-size: 13px;
}

.low-confidence-warning svg {
  width: 20px;
  height: 20px;
  color: #FF9800;
}
```

---

## 6. Testing the Improvements

### Test Transaction Support:

```javascript
// Test script: test_transaction.js
const mongoose = require('mongoose');
const { ScannedDataVerification, PrescriptionDocument, Patient } = require('./Models');

async function testTransaction() {
  await mongoose.connect('mongodb://localhost:27017/hms');
  
  // Create test verification
  const verification = await ScannedDataVerification.create({
    patientId: 'TEST123',
    sessionId: 'test-session',
    documentType: 'PRESCRIPTION',
    pdfId: 'test-pdf',
    fileName: 'test.pdf',
    extractedData: {},
    dataRows: [
      {
        fieldName: 'test',
        displayLabel: 'Test',
        originalValue: 'value',
        currentValue: 'value',
        dataType: 'string',
        category: 'other'
      }
    ]
  });
  
  console.log('Created test verification:', verification._id);
  
  // Simulate transaction failure
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    // This should succeed
    const prescDoc = new PrescriptionDocument({
      patientId: 'TEST123',
      pdfId: 'test-pdf',
      medicines: [{ name: 'Test', dosage: '10mg' }]
    });
    await prescDoc.save({ session });
    console.log('✅ Saved prescription');
    
    // Force an error
    throw new Error('Simulated error');
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.log('❌ Transaction rolled back:', error.message);
  } finally {
    session.endSession();
  }
  
  // Check if prescription was saved (it shouldn't be!)
  const checkPresc = await PrescriptionDocument.findOne({ pdfId: 'test-pdf' });
  console.log('Prescription exists?', checkPresc ? 'YES (BAD!)' : 'NO (GOOD!)');
  
  // Cleanup
  await verification.deleteOne();
  await mongoose.disconnect();
}

testTransaction().catch(console.error);
```

---

## Summary

### Files to Create:
1. ✅ `Server/utils/validation.js` - Validation service
2. ✅ `Server/utils/duplicateDetection.js` - Duplicate detection

### Files to Modify:
1. ✅ `Server/routes/scanner-enterprise.js` - Add transactions, validation, duplicate check, auto-save endpoint
2. ✅ `Server/Models/PatientPDF.js` - Add contentHash field
3. ✅ `react/hms/src/components/modals/DataVerificationModal.jsx` - Add auto-save, confidence UI
4. ✅ `react/hms/src/components/modals/DataVerificationModal.css` - Add new styles

### Priority Order:
1. **Week 1**: Transactions + Validation
2. **Week 2**: Duplicate Detection
3. **Week 3**: Auto-Save
4. **Week 4**: Confidence UI + Testing

---

**Next Steps**: Start with transaction support, then add validation, then duplicate detection. Test thoroughly after each implementation.

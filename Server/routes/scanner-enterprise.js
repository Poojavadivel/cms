const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const auth = require('../Middleware/Auth');
const { Patient, PatientPDF, PrescriptionDocument, LabReportDocument, MedicalHistoryDocument, ScannedDataVerification } = require('../Models');
const { LandingAIScanner } = require('../utils/landingai_scanner');

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_UPLOAD: 10,
  TEMP_UPLOAD_DIR: path.join(__dirname, '../uploads/temp'),
  LANDINGAI_API_KEY: process.env.LANDINGAI_API_KEY || 'pat_XlbvTpObJfmlCvLPHjbSWTh2vzCciqZT'
};

// Initialize LandingAI Scanner
const landingAIScanner = new LandingAIScanner(CONFIG.LANDINGAI_API_KEY);
console.log('[scanner-landingai] ✅ LandingAI ADE initialized');

// ============================================================================
// MULTER CONFIGURATION
// ============================================================================
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(CONFIG.TEMP_UPLOAD_DIR, { recursive: true });
      cb(null, CONFIG.TEMP_UPLOAD_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE,
    files: CONFIG.MAX_FILES_PER_UPLOAD
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
    cb(null, true);
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const logh = (batchId, ...args) => console.log(`[scanner-landingai ${batchId}]`, ...args);

async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (e) {
    // Ignore errors
  }
}

// ============================================================================
// DATA ROW CONVERSION FOR VERIFICATION
// ============================================================================
function convertExtractedDataToRows(extractedData, documentType) {
  const rows = [];

  if (documentType === 'PRESCRIPTION') {
    const prescData = extractedData;
    
    // Patient details
    if (prescData.patient_details) {
      const pd = prescData.patient_details;
      if (pd.firstName) rows.push({ fieldName: 'patient_firstName', displayLabel: 'First Name', originalValue: pd.firstName, currentValue: pd.firstName, dataType: 'string', category: 'patient_details' });
      if (pd.lastName) rows.push({ fieldName: 'patient_lastName', displayLabel: 'Last Name', originalValue: pd.lastName, currentValue: pd.lastName, dataType: 'string', category: 'patient_details' });
      if (pd.age) rows.push({ fieldName: 'patient_age', displayLabel: 'Age', originalValue: pd.age, currentValue: pd.age, dataType: 'number', category: 'patient_details' });
      if (pd.gender) rows.push({ fieldName: 'patient_gender', displayLabel: 'Gender', originalValue: pd.gender, currentValue: pd.gender, dataType: 'string', category: 'patient_details' });
    }

    // Doctor details
    if (prescData.doctor_details) {
      const dd = prescData.doctor_details;
      if (dd.name) rows.push({ fieldName: 'doctor_name', displayLabel: 'Doctor Name', originalValue: dd.name, currentValue: dd.name, dataType: 'string', category: 'other' });
      if (dd.hospital) rows.push({ fieldName: 'hospital_name', displayLabel: 'Hospital Name', originalValue: dd.hospital, currentValue: dd.hospital, dataType: 'string', category: 'other' });
    }

    // Diagnosis
    if (prescData.diagnosis) {
      rows.push({ fieldName: 'diagnosis', displayLabel: 'Diagnosis', originalValue: prescData.diagnosis, currentValue: prescData.diagnosis, dataType: 'string', category: 'diagnosis' });
    }

    // Medications
    if (prescData.medications && Array.isArray(prescData.medications)) {
      prescData.medications.forEach((med, idx) => {
        rows.push({
          fieldName: `medication_${idx}`,
          displayLabel: `Medication ${idx + 1}`,
          originalValue: med,
          currentValue: med,
          dataType: 'object',
          category: 'medications'
        });
      });
    }

  } else if (documentType === 'LAB_REPORT') {
    const labData = extractedData.labReport || {};
    
    if (labData.testType) rows.push({ fieldName: 'testType', displayLabel: 'Test Type', originalValue: labData.testType, currentValue: labData.testType, dataType: 'string', category: 'lab_results' });
    if (labData.labName) rows.push({ fieldName: 'labName', displayLabel: 'Lab Name', originalValue: labData.labName, currentValue: labData.labName, dataType: 'string', category: 'other' });
    if (labData.reportDate) rows.push({ fieldName: 'reportDate', displayLabel: 'Report Date', originalValue: labData.reportDate, currentValue: labData.reportDate, dataType: 'date', category: 'other' });

    // Lab results
    if (labData.results && Array.isArray(labData.results)) {
      labData.results.forEach((result, idx) => {
        rows.push({
          fieldName: `labResult_${idx}`,
          displayLabel: `Test ${idx + 1}: ${result.testName || 'Result'}`,
          originalValue: result,
          currentValue: result,
          dataType: 'object',
          category: 'lab_results'
        });
      });
    }

  } else if (documentType === 'MEDICAL_HISTORY') {
    const historyData = extractedData;
    
    if (historyData.medicalHistory) rows.push({ fieldName: 'medicalHistory', displayLabel: 'Medical History', originalValue: historyData.medicalHistory, currentValue: historyData.medicalHistory, dataType: 'string', category: 'other' });
    if (historyData.diagnosis) rows.push({ fieldName: 'diagnosis', displayLabel: 'Diagnosis', originalValue: historyData.diagnosis, currentValue: historyData.diagnosis, dataType: 'string', category: 'diagnosis' });
    if (historyData.allergies) rows.push({ fieldName: 'allergies', displayLabel: 'Allergies', originalValue: historyData.allergies, currentValue: historyData.allergies, dataType: 'string', category: 'other' });
    
    if (historyData.currentMedications && Array.isArray(historyData.currentMedications)) {
      historyData.currentMedications.forEach((med, idx) => {
        rows.push({
          fieldName: `medication_${idx}`,
          displayLabel: `Medication ${idx + 1}`,
          originalValue: med,
          currentValue: med,
          dataType: 'string',
          category: 'medications'
        });
      });
    }
  }

  // Fallback for GENERAL or any other document type with extracted data
  if (rows.length === 0 && extractedData && typeof extractedData === 'object') {
    Object.keys(extractedData).forEach(key => {
      const value = extractedData[key];
      if (value !== null && value !== undefined && value !== '') {
        rows.push({
          fieldName: key,
          displayLabel: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          originalValue: value,
          currentValue: value,
          dataType: typeof value === 'object' ? 'object' : typeof value === 'number' ? 'number' : 'string',
          category: 'other'
        });
      }
    });
  }

  return rows;
}

// ============================================================================
// PATIENT MATCHING
// ============================================================================
async function matchOrCreatePatient(extractedData, batchId) {
  let patientInfo = extractedData.patient_details || {};
  
  let firstName = patientInfo.firstName || patientInfo.name?.split(' ')[0] || 'Unknown';
  let lastName = patientInfo.lastName || patientInfo.name?.split(' ').slice(1).join(' ') || '';
  let phone = patientInfo.phone || '';
  let dateOfBirth = patientInfo.dateOfBirth || null;
  let gender = patientInfo.gender || '';
  let email = patientInfo.email || '';

  // Normalize phone
  if (phone) {
    phone = phone.replace(/[^\d+]/g, '');
    if (phone.length === 10 && !phone.startsWith('+')) {
      phone = '+91' + phone;
    }
  }

  let patient = null;
  let matchedBy = null;

  // Try name match
  if (firstName && firstName !== 'Unknown') {
    const query = { firstName: new RegExp(`^${firstName}$`, 'i') };
    if (lastName) {
      query.lastName = new RegExp(`^${lastName}$`, 'i');
    }
    patient = await Patient.findOne(query);
    if (patient) {
      matchedBy = 'name';
      logh(batchId, `✅ Patient matched by name: ${patient._id}`);
    }
  }

  // Try phone match
  if (!patient && phone) {
    patient = await Patient.findOne({ phone });
    if (patient) {
      matchedBy = 'phone';
      logh(batchId, `✅ Patient matched by phone: ${patient._id}`);
    }
  }

  // Update existing patient
  if (patient) {
    let updated = false;
    if (!patient.lastName && lastName) {
      patient.lastName = lastName;
      updated = true;
    }
    if (!patient.dateOfBirth && dateOfBirth) {
      patient.dateOfBirth = dateOfBirth;
      updated = true;
    }
    if (!patient.gender && gender) {
      patient.gender = gender;
      updated = true;
    }
    if (!patient.email && email) {
      patient.email = email;
      updated = true;
    }

    if (updated) {
      await patient.save();
      logh(batchId, '✅ Patient updated with new information');
    }

    return { patient, action: 'matched', matchedBy };
  }

  // Create new patient
  try {
    const newPatient = await Patient.create({
      firstName: firstName || 'Unknown',
      lastName: lastName || '',
      phone,
      dateOfBirth,
      gender,
      email
    });

    logh(batchId, `✅ New patient created: ${newPatient._id}`);
    return { patient: newPatient, action: 'created', matchedBy: 'new' };
  } catch (error) {
    if (error.code === 11000) {
      if (phone) {
        patient = await Patient.findOne({ phone });
        if (patient) {
          return { patient, action: 'matched', matchedBy: 'phone-retry' };
        }
      }
      throw new Error('Patient creation failed due to duplicate');
    }
    throw error;
  }
}

// ============================================================================
// SCAN-MEDICAL ENDPOINT - Main scanning endpoint for forms
// ============================================================================
router.post('/scan-medical', auth, upload.single('image'), async (req, res) => {
  const batchId = `scan-${Date.now()}`;
  const t0 = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const patientId = req.body.patientId;
    const documentType = req.body.documentType;

    logh(batchId, `📸 Processing with LandingAI: ${req.file.originalname}`);
    if (patientId) {
      logh(batchId, `👤 Patient ID: ${patientId}`);
    }

    // Call LandingAI Scanner
    const scanResult = await landingAIScanner.scanDocument(req.file.path, documentType);

    if (!scanResult.success) {
      throw new Error(scanResult.error || 'LandingAI scanning failed');
    }

    logh(batchId, `✅ LandingAI extraction complete: ${scanResult.documentType}`);

    let savedImagePath = null;
    let verificationId = null;

    // Save to verification collection for review (not directly to final collections)
    if (patientId) {
      try {
        const fileBuffer = await fs.readFile(req.file.path);

        // Store PDF in MongoDB
        const patientPDF = new PatientPDF({
          patientId: patientId,
          title: `${scanResult.documentType} Document (Pending Verification)`,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          data: fileBuffer,
          size: fileBuffer.length,
          uploadedAt: new Date()
        });

        await patientPDF.save();
        const pdfIdString = patientPDF._id.toString();
        savedImagePath = pdfIdString;

        logh(batchId, `💾 Document saved: ${pdfIdString}`);

        // Create verification session ID
        const sessionId = `verify-${patientId}-${Date.now()}`;

        // Convert extracted data to verification rows
        const dataRows = convertExtractedDataToRows(scanResult.extractedData, scanResult.documentType);

        console.log('[SCANNER] Data rows generated:', dataRows.length);

        // Save to verification collection
        const verificationDoc = new ScannedDataVerification({
          patientId: patientId,
          sessionId: sessionId,
          documentType: scanResult.documentType,
          pdfId: pdfIdString,
          fileName: req.file.originalname,
          extractedData: scanResult.extractedData,
          verificationStatus: 'pending',
          dataRows: dataRows,
          metadata: {
            ocrEngine: 'landingai-ade',
            ocrConfidence: scanResult.confidence || 0.95,
            processingTimeMs: Date.now() - t0,
            markdown: scanResult.markdown || ''
          },
          uploadedBy: req.user?._id || null
        });

        console.log('[SCANNER] Saving verification document...');
        await verificationDoc.save();
        verificationId = verificationDoc._id.toString();

        logh(batchId, `✅ Created verification session: ${sessionId} (ID: ${verificationId})`);

      } catch (saveError) {
        logh(batchId, `⚠️ Save failed: ${saveError.message}`);
        console.error('[SCANNER] Save error details:', saveError);
      }
    }

    // Cleanup
    await cleanupTempFile(req.file.path);

    const totalTime = Date.now() - t0;
    logh(batchId, `✅ Complete (${totalTime}ms)`);

    return res.json({
      success: true,
      intent: scanResult.documentType,
      extractedData: scanResult.extractedData,
      verificationRequired: true,
      verificationId: verificationId,
      metadata: {
        ocrEngine: 'landingai-ade',
        ocrConfidence: scanResult.confidence || 0.95,
        processingTimeMs: totalTime,
        model: 'dpt-2'
      },
      savedToPatient: patientId ? {
        patientId: patientId,
        imagePath: savedImagePath,
        pdfId: savedImagePath,
        verificationId: verificationId,
        saved: savedImagePath !== null,
        requiresVerification: true
      } : null
    });

  } catch (error) {
    logh(batchId, '❌ Scan failed:', error.message);
    if (req.file?.path) {
      await cleanupTempFile(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// BULK UPLOAD WITH PATIENT MATCHING
// ============================================================================
router.post('/bulk-upload-with-matching', auth, upload.array('images', CONFIG.MAX_FILES_PER_UPLOAD), async (req, res) => {
  const batchId = `bulk-${Date.now()}`;
  const t0 = Date.now();
  let results = [];
  let failures = [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    logh(batchId, `📤 Bulk upload: ${req.files.length} files`);

    for (const file of req.files) {
      try {
        logh(batchId, `📄 Processing: ${file.originalname}`);

        const scanResult = await landingAIScanner.scanDocument(file.path);

        if (!scanResult.success) {
          throw new Error(scanResult.error || 'Scanning failed');
        }

        const { patient } = await matchOrCreatePatient(scanResult.extractedData, batchId);

        if (!patient) {
          throw new Error('Patient matching failed');
        }

        const fileBuffer = await fs.readFile(file.path);
        const patientPDF = new PatientPDF({
          patientId: patient._id,
          title: `${scanResult.documentType} Document`,
          fileName: file.originalname,
          mimeType: file.mimetype,
          data: fileBuffer,
          size: fileBuffer.length,
          uploadedAt: new Date()
        });

        await patientPDF.save();

        logh(batchId, `✅ Processed for patient: ${patient._id}`);

        results.push({
          file: file.originalname,
          success: true,
          patient: {
            id: patient._id,
            name: `${patient.firstName} ${patient.lastName || ''}`.trim()
          },
          report: {
            pdfId: patientPDF._id.toString(),
            intent: scanResult.documentType
          }
        });

      } catch (error) {
        logh(batchId, `❌ Failed: ${file.originalname}`, error.message);
        failures.push({
          file: file.originalname,
          error: error.message
        });
      } finally {
        await cleanupTempFile(file.path);
      }
    }

    const totalTime = Date.now() - t0;
    logh(batchId, `🏁 Complete: ${results.length} success, ${failures.length} failed (${totalTime}ms)`);

    return res.json({
      success: failures.length === 0,
      batchId,
      processed: results.length,
      failed: failures.length,
      totalTimeMs: totalTime,
      results,
      failures: failures.length > 0 ? failures : undefined
    });

  } catch (error) {
    logh(batchId, '💥 Fatal error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      batchId,
      results,
      failures
    });
  }
});

// ============================================================================
// GET PDF FROM DATABASE (PUBLIC)
// ============================================================================
router.get('/pdf-public/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params;
    const pdf = await PatientPDF.findById(pdfId);
    
    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    res.set({
      'Content-Type': pdf.mimeType,
      'Content-Disposition': `inline; filename="${pdf.fileName}"`,
      'Content-Length': pdf.size,
      'Cache-Control': 'public, max-age=3600'
    });

    return res.send(pdf.data);
  } catch (error) {
    console.error('[PDF-PUBLIC] Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
router.get('/health', auth, async (req, res) => {
  return res.json({
    ok: true,
    services: {
      landingaiADE: CONFIG.LANDINGAI_API_KEY ? 'configured' : 'not_configured'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// VERIFICATION ENDPOINTS
// ============================================================================

// Get verification data by ID
router.get('/verification/:verificationId', auth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    console.log('[VERIFICATION] Fetching verification:', verificationId);
    
    const verification = await ScannedDataVerification.findById(verificationId);
    
    console.log('[VERIFICATION] Found:', verification ? 'YES' : 'NO');

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification session not found' });
    }

    return res.json({
      success: true,
      verification: {
        id: verification._id,
        patientId: verification.patientId,
        sessionId: verification.sessionId,
        documentType: verification.documentType,
        fileName: verification.fileName,
        dataRows: verification.dataRows,
        verificationStatus: verification.verificationStatus,
        metadata: verification.metadata,
        createdAt: verification.createdAt,
        expiresAt: verification.expiresAt
      }
    });
  } catch (error) {
    console.error('[VERIFICATION] Get error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending verifications for a patient
router.get('/verification/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const verifications = await ScannedDataVerification.find({
      patientId: patientId,
      verificationStatus: 'pending'
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      verifications: verifications.map(v => ({
        id: v._id,
        sessionId: v.sessionId,
        documentType: v.documentType,
        fileName: v.fileName,
        rowCount: v.dataRows.length,
        createdAt: v.createdAt,
        expiresAt: v.expiresAt
      }))
    });
  } catch (error) {
    console.error('[VERIFICATION] List error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update a specific data row in verification
router.put('/verification/:verificationId/row/:rowIndex', auth, async (req, res) => {
  try {
    const { verificationId, rowIndex } = req.params;
    const { currentValue, isDeleted } = req.body;

    const verification = await ScannedDataVerification.findById(verificationId);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification session not found' });
    }

    const index = parseInt(rowIndex);
    if (index < 0 || index >= verification.dataRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid row index' });
    }

    // Update the row
    if (currentValue !== undefined) {
      verification.dataRows[index].currentValue = currentValue;
      verification.dataRows[index].isModified = 
        JSON.stringify(currentValue) !== JSON.stringify(verification.dataRows[index].originalValue);
    }

    if (isDeleted !== undefined) {
      verification.dataRows[index].isDeleted = isDeleted;
    }

    await verification.save();

    return res.json({
      success: true,
      message: 'Row updated successfully',
      row: verification.dataRows[index]
    });
  } catch (error) {
    console.error('[VERIFICATION] Update row error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a data row from verification
router.delete('/verification/:verificationId/row/:rowIndex', auth, async (req, res) => {
  try {
    const { verificationId, rowIndex } = req.params;

    const verification = await ScannedDataVerification.findById(verificationId);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification session not found' });
    }

    const index = parseInt(rowIndex);
    if (index < 0 || index >= verification.dataRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid row index' });
    }

    // Mark as deleted instead of removing
    verification.dataRows[index].isDeleted = true;

    await verification.save();

    return res.json({
      success: true,
      message: 'Row marked as deleted'
    });
  } catch (error) {
    console.error('[VERIFICATION] Delete row error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Confirm and save verification data to original collections
router.post('/verification/:verificationId/confirm', auth, async (req, res) => {
  const batchId = `confirm-${Date.now()}`;
  
  try {
    const { verificationId } = req.params;
    
    const verification = await ScannedDataVerification.findById(verificationId);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification session not found' });
    }

    if (verification.verificationStatus === 'verified') {
      return res.status(400).json({ success: false, message: 'Already verified' });
    }

    logh(batchId, `✅ Confirming verification: ${verification.sessionId}`);

    // Reconstruct the data from verified rows
    const verifiedRows = verification.dataRows.filter(row => !row.isDeleted);
    
    let reportId = null;
    const patient = await Patient.findById(verification.patientId);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
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

      await prescriptionDoc.save();
      reportId = prescriptionDoc._id.toString();
      logh(batchId, `💊 Created PrescriptionDocument: ${reportId}`);

    } else if (verification.documentType === 'LAB_REPORT') {
      const labData = verification.extractedData.labReport || {};
      
      // Build results array from verified rows
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

      await labReportDoc.save();
      reportId = labReportDoc._id.toString();
      logh(batchId, `🧪 Created LabReportDocument: ${reportId}`);

    } else if (verification.documentType === 'MEDICAL_HISTORY') {
      const historyData = verification.extractedData;
      
      // Build medications array from verified rows
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

      await medicalHistoryDoc.save();
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

    await patient.save();
    logh(batchId, `✅ Report attached to patient: ${verification.patientId}`);

    // Update verification status
    verification.verificationStatus = 'verified';
    verification.verifiedBy = req.user?._id || null;
    verification.verifiedAt = new Date();
    await verification.save();

    logh(batchId, `✅ Verification complete`);

    return res.json({
      success: true,
      message: 'Data verified and saved successfully',
      reportId: reportId,
      documentType: verification.documentType
    });

  } catch (error) {
    logh(batchId, '❌ Confirmation failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Reject/Cancel verification
router.post('/verification/:verificationId/reject', auth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    
    const verification = await ScannedDataVerification.findById(verificationId);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification session not found' });
    }

    verification.verificationStatus = 'rejected';
    verification.verifiedBy = req.user?._id || null;
    verification.verifiedAt = new Date();
    await verification.save();

    // Optionally delete the PDF
    if (verification.pdfId) {
      await PatientPDF.findByIdAndDelete(verification.pdfId);
    }

    return res.json({
      success: true,
      message: 'Verification rejected and data discarded'
    });

  } catch (error) {
    console.error('[VERIFICATION] Reject error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

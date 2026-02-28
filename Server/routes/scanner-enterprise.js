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

let landingAIScanner = null;
try {
  landingAIScanner = new LandingAIScanner(CONFIG.LANDINGAI_API_KEY);
  console.log('[scanner-landingai] ✅ LandingAI ADE initialized');
} catch (err) {
  console.log('[scanner-landingai] ⚠️ LandingAI ADE disabled (missing API key)');
}

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
  console.log('[CONVERT] Starting conversion for document type:', documentType);
  console.log('[CONVERT] Extracted data keys:', Object.keys(extractedData));
  const rows = [];

  if (documentType === 'PRESCRIPTION') {
    console.log('[CONVERT] Processing PRESCRIPTION document');

    // ✅ FIX: Read from extraction object (LandingAI returns nested structure)
    const prescData = extractedData.extraction || extractedData;
    console.log('[CONVERT] Prescription data keys:', Object.keys(prescData));
    console.log('[CONVERT] Full prescription data:', JSON.stringify(prescData, null, 2));

    // Simplified Prescription Schema Fields
    if (prescData.prescription_summary) {
      console.log('[CONVERT] ✅ Found prescription_summary:', prescData.prescription_summary.substring(0, 100) + '...');
      rows.push({
        fieldName: 'prescription_summary',
        displayLabel: 'Prescription Summary',
        originalValue: prescData.prescription_summary,
        currentValue: prescData.prescription_summary,
        dataType: 'string',
        category: 'diagnosis',  // ✅ Valid enum: diagnosis for prescription content
        confidence: 0.95
      });
    } else {
      console.log('[CONVERT] ❌ Missing prescription_summary');
    }

    if (prescData.date_time) {
      console.log('[CONVERT] ✅ Found date_time:', prescData.date_time);
      rows.push({
        fieldName: 'date_time',
        displayLabel: 'Date and Time',
        originalValue: prescData.date_time,
        currentValue: prescData.date_time,
        dataType: 'string',
        category: 'other',  // ✅ Valid enum: other for date/time metadata
        confidence: 0.95
      });
    } else {
      console.log('[CONVERT] ❌ Missing date_time');
    }

    if (prescData.hospital) {
      console.log('[CONVERT] ✅ Found hospital:', prescData.hospital);
      rows.push({
        fieldName: 'hospital',
        displayLabel: 'Hospital',
        originalValue: prescData.hospital,
        currentValue: prescData.hospital,
        dataType: 'string',
        category: 'other',  // ✅ Valid enum: other for hospital metadata
        confidence: 0.95
      });
    } else {
      console.log('[CONVERT] ❌ Missing hospital');
    }

    if (prescData.doctor) {
      console.log('[CONVERT] ✅ Found doctor:', prescData.doctor);
      rows.push({
        fieldName: 'doctor',
        displayLabel: 'Doctor',
        originalValue: prescData.doctor,
        currentValue: prescData.doctor,
        dataType: 'string',
        category: 'patient_details',  // ✅ Valid enum: patient_details for doctor info
        confidence: 0.95
      });
    } else {
      console.log('[CONVERT] ❌ Missing doctor');
    }

    if (prescData.medical_notes !== null && prescData.medical_notes !== undefined && prescData.medical_notes !== '') {
      console.log('[CONVERT] ✅ Found medical_notes:', prescData.medical_notes);
      rows.push({
        fieldName: 'medical_notes',
        displayLabel: 'Medical Notes',
        originalValue: prescData.medical_notes,
        currentValue: prescData.medical_notes,
        dataType: 'string',
        category: 'other',  // ✅ Valid enum: other for additional notes
        confidence: 0.90
      });
    } else {
      console.log('[CONVERT] ⚠️ Missing medical_notes (optional field, null or empty)');
    }

    console.log(`[CONVERT] ✅ Created ${rows.length} rows for PRESCRIPTION`);

  } else if (documentType === 'LAB_REPORT') {
    console.log('[CONVERT] Processing LAB_REPORT document');
    const labData = extractedData.labReport || {};

    if (labData.testType) rows.push({ fieldName: 'testType', displayLabel: 'Test Type', originalValue: labData.testType, currentValue: labData.testType, dataType: 'string', category: 'lab_results', confidence: 0.95 });
    if (labData.labName) rows.push({ fieldName: 'labName', displayLabel: 'Lab Name', originalValue: labData.labName, currentValue: labData.labName, dataType: 'string', category: 'other', confidence: 0.95 });
    if (labData.reportDate) rows.push({ fieldName: 'reportDate', displayLabel: 'Report Date', originalValue: labData.reportDate, currentValue: labData.reportDate, dataType: 'date', category: 'other', confidence: 0.95 });

    // Lab results
    if (labData.results && Array.isArray(labData.results)) {
      labData.results.forEach((result, idx) => {
        rows.push({
          fieldName: `labResult_${idx}`,
          displayLabel: `Test ${idx + 1}: ${result.testName || 'Result'}`,
          originalValue: result,
          currentValue: result,
          dataType: 'object',
          category: 'lab_results',
          confidence: 0.95
        });
      });
    }

    console.log(`[CONVERT] ✅ Created ${rows.length} rows for LAB_REPORT`);

  } else if (documentType === 'MEDICAL_HISTORY') {
    console.log('[CONVERT] Processing MEDICAL_HISTORY document');

    // ✅ FIX: Read from extraction object (LandingAI returns nested structure)
    const historyData = extractedData.extraction || extractedData;
    console.log('[CONVERT] Medical history data keys:', Object.keys(historyData));

    // Simplified Medical History Schema Fields
    if (historyData.medical_summary) {
      console.log('[CONVERT] ✅ Found medical_summary:', historyData.medical_summary.substring(0, 100) + '...');
      rows.push({
        fieldName: 'medical_summary',
        displayLabel: 'Medical Summary',
        originalValue: historyData.medical_summary,
        currentValue: historyData.medical_summary,
        dataType: 'string',
        category: 'diagnosis',  // ✅ Valid enum: diagnosis for medical summary
        confidence: 0.95
      });
    } else {
      console.log('[CONVERT] ❌ Missing medical_summary');
    }

    if (historyData.date_time) {
      console.log('[CONVERT] ✅ Found date_time:', historyData.date_time);
      rows.push({
        fieldName: 'date_time',
        displayLabel: 'Date and Time',
        originalValue: historyData.date_time,
        currentValue: historyData.date_time,
        dataType: 'string',
        category: 'other',  // ✅ Valid enum: other for date/time metadata
        confidence: 0.95
      });
    } else {
      console.log('[CONVERT] ❌ Missing date_time');
    }

    if (historyData.hospital) {
      console.log('[CONVERT] ✅ Found hospital:', historyData.hospital);
      rows.push({
        fieldName: 'hospital',
        displayLabel: 'Hospital',
        originalValue: historyData.hospital,
        currentValue: historyData.hospital,
        dataType: 'string',
        category: 'other',  // ✅ Valid enum: other for hospital metadata
        confidence: 0.95
      });
    } else {
      console.log('[CONVERT] ❌ Missing hospital');
    }

    if (historyData.doctor) {
      console.log('[CONVERT] ✅ Found doctor:', historyData.doctor);
      rows.push({
        fieldName: 'doctor',
        displayLabel: 'Doctor',
        originalValue: historyData.doctor,
        currentValue: historyData.doctor,
        dataType: 'string',
        category: 'patient_details',  // ✅ Valid enum: patient_details for doctor info
        confidence: 0.95
      });
    } else {
      console.log('[CONVERT] ❌ Missing doctor');
    }

    if (historyData.services && Array.isArray(historyData.services)) {
      console.log('[CONVERT] ✅ Found services:', historyData.services);
      rows.push({
        fieldName: 'services',
        displayLabel: 'Services',
        originalValue: historyData.services,
        currentValue: historyData.services,
        dataType: 'array',
        category: 'other',  // ✅ Valid enum: other for services metadata
        confidence: 0.90
      });
    } else {
      console.log('[CONVERT] ⚠️ Missing services (optional)');
    }

    if (historyData.medical_notes !== null && historyData.medical_notes !== undefined && historyData.medical_notes !== '') {
      console.log('[CONVERT] ✅ Found medical_notes:', historyData.medical_notes);
      rows.push({
        fieldName: 'medical_notes',
        displayLabel: 'Medical Notes',
        originalValue: historyData.medical_notes,
        currentValue: historyData.medical_notes,
        dataType: 'string',
        category: 'other',  // ✅ Valid enum: other for additional notes
        confidence: 0.90
      });
    } else {
      console.log('[CONVERT] ⚠️ Missing medical_notes (optional field, null or empty)');
    }

    console.log(`[CONVERT] ✅ Created ${rows.length} rows for MEDICAL_HISTORY`);
  }

  // ❌ REMOVED FALLBACK - Fail fast instead of hiding bugs
  if (rows.length === 0) {
    console.log('[CONVERT] ❌ ERROR: Schema extraction succeeded but conversion failed');
    console.log('[CONVERT] ❌ Document Type:', documentType);
    console.log('[CONVERT] ❌ Extracted Data:', JSON.stringify(extractedData, null, 2));
    throw new Error(`Conversion failed: No rows created for document type ${documentType}. Check if data structure matches expected schema.`);
  }

  console.log(`[CONVERT] 🏁 Final: Returning ${rows.length} rows total`);
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

  console.log('[SCAN] ========================================');
  console.log(`[SCAN] Starting scan batch: ${batchId}`);
  console.log('[SCAN] ========================================');

  try {
    if (!req.file) {
      console.log('[SCAN] ❌ ERROR: No file uploaded');
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const patientId = req.body.patientId;
    const documentType = req.body.documentType;

    console.log('[SCAN] 📄 File Info:');
    console.log(`[SCAN]   - Name: ${req.file.originalname}`);
    console.log(`[SCAN]   - Size: ${req.file.size} bytes`);
    console.log(`[SCAN]   - Type: ${req.file.mimetype}`);
    console.log(`[SCAN]   - Path: ${req.file.path}`);
    console.log(`[SCAN] 👤 Patient ID: ${patientId || 'NOT PROVIDED'}`);
    console.log(`[SCAN] 📋 Document Type: ${documentType || 'NOT PROVIDED (will auto-detect)'}`);

    logh(batchId, `📸 Processing with LandingAI: ${req.file.originalname}`);
    if (patientId) {
      logh(batchId, `👤 Patient ID: ${patientId}`);
    }
    if (documentType) {
      logh(batchId, `📋 Document Type: ${documentType}`);
    }

    // Call LandingAI Scanner
    console.log('[SCAN] 🤖 Calling LandingAI scanner...');
    const scanResult = await landingAIScanner.scanDocument(req.file.path, documentType);

    console.log('[SCAN] 📊 LandingAI Response:');
    console.log(`[SCAN]   - Success: ${scanResult.success}`);
    console.log(`[SCAN]   - Document Type: ${scanResult.documentType}`);
    console.log(`[SCAN]   - Confidence: ${scanResult.confidence}`);
    console.log(`[SCAN]   - Engine: ${scanResult.engine}`);

    if (!scanResult.success) {
      console.log('[SCAN] ❌ LandingAI failed:', scanResult.error);
      throw new Error(scanResult.error || 'LandingAI scanning failed');
    }

    console.log('[SCAN] ✅ LandingAI extraction successful');
    console.log('[SCAN] 📦 Extracted Data Keys:', Object.keys(scanResult.extractedData || {}));

    logh(batchId, `✅ LandingAI extraction complete: ${scanResult.documentType}`);

    let savedImagePath = null;
    let verificationId = null;

    // Save to verification collection for review (not directly to final collections)
    if (patientId) {
      console.log('[SCAN] 💾 Saving to database...');
      try {
        console.log('[SCAN] 📖 Reading file buffer...');
        const fileBuffer = await fs.readFile(req.file.path);
        console.log(`[SCAN] ✅ File buffer read: ${fileBuffer.length} bytes`);

        // Store PDF in MongoDB
        console.log('[SCAN] 📄 Creating PatientPDF document...');
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

        console.log(`[SCAN] ✅ PatientPDF saved: ${pdfIdString}`);
        logh(batchId, `💾 Document saved: ${pdfIdString}`);

        // Create verification session ID
        const sessionId = `verify-${patientId}-${Date.now()}`;
        console.log(`[SCAN] 🔑 Session ID: ${sessionId}`);

        // Convert extracted data to verification rows
        console.log('[SCAN] 🔄 Converting extracted data to rows...');
        const dataRows = convertExtractedDataToRows(scanResult.extractedData, scanResult.documentType);

        console.log(`[SCAN] ✅ Data rows generated: ${dataRows.length}`);
        console.log('[SCAN] 📋 Row details:', dataRows.map(r => ({ field: r.fieldName, label: r.displayLabel, hasValue: !!r.currentValue })));

        // Save to verification collection
        console.log('[SCAN] 💾 Creating verification document...');
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

        console.log('[SCAN] 💾 Saving verification document...');
        await verificationDoc.save();
        verificationId = verificationDoc._id.toString();

        console.log(`[SCAN] ✅ Verification document saved: ${verificationId}`);
        logh(batchId, `✅ Created verification session: ${sessionId} (ID: ${verificationId})`);

      } catch (saveError) {
        console.log('[SCAN] ❌ Save Error:', saveError.message);
        console.log('[SCAN] ❌ Stack:', saveError.stack);
        logh(batchId, `⚠️ Save failed: ${saveError.message}`);
        console.error('[SCANNER] Save error details:', saveError);
      }
    } else {
      console.log('[SCAN] ⚠️ No patientId provided, skipping database save');
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

  console.log('[CONFIRM] ========================================');
  console.log(`[CONFIRM] Starting confirmation batch: ${batchId}`);
  console.log('[CONFIRM] ========================================');

  try {
    const { verificationId } = req.params;

    console.log(`[CONFIRM] 🔍 Looking up verification ID: ${verificationId}`);
    const verification = await ScannedDataVerification.findById(verificationId);

    if (!verification) {
      console.log('[CONFIRM] ❌ Verification not found');
      return res.status(404).json({ success: false, message: 'Verification session not found' });
    }

    console.log(`[CONFIRM] ✅ Verification found`);
    console.log(`[CONFIRM]   - Session: ${verification.sessionId}`);
    console.log(`[CONFIRM]   - Document Type: ${verification.documentType}`);
    console.log(`[CONFIRM]   - Patient ID: ${verification.patientId}`);
    console.log(`[CONFIRM]   - Status: ${verification.verificationStatus}`);
    console.log(`[CONFIRM]   - Data Rows: ${verification.dataRows.length}`);

    if (verification.verificationStatus === 'verified') {
      console.log('[CONFIRM] ⚠️ Already verified');
      return res.status(400).json({ success: false, message: 'Already verified' });
    }

    logh(batchId, `✅ Confirming verification: ${verification.sessionId}`);

    // Reconstruct the data from verified rows
    const verifiedRows = verification.dataRows.filter(row => !row.isDeleted);
    console.log(`[CONFIRM] 📋 Verified rows (non-deleted): ${verifiedRows.length}`);

    let reportId = null;

    console.log(`[CONFIRM] 👤 Looking up patient: ${verification.patientId}`);
    const patient = await Patient.findById(verification.patientId);

    if (!patient) {
      console.log('[CONFIRM] ❌ Patient not found');
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    console.log(`[CONFIRM] ✅ Patient found: ${patient.firstName} ${patient.lastName}`);

    // Save to appropriate collection based on document type
    if (verification.documentType === 'PRESCRIPTION') {
      console.log('[CONFIRM] 💊 Processing PRESCRIPTION document');

      // ✅ FIX: Read from extraction object if it exists
      const rawData = verification.extractedData;
      const prescData = rawData.extraction || rawData;

      // Get values from verified rows (new simplified schema)
      const prescriptionSummary = verifiedRows.find(r => r.fieldName === 'prescription_summary')?.currentValue || prescData.prescription_summary || '';
      const dateTime = verifiedRows.find(r => r.fieldName === 'date_time')?.currentValue || prescData.date_time || '';
      const hospital = verifiedRows.find(r => r.fieldName === 'hospital')?.currentValue || prescData.hospital || '';
      const doctor = verifiedRows.find(r => r.fieldName === 'doctor')?.currentValue || prescData.doctor || '';
      const medicalNotes = verifiedRows.find(r => r.fieldName === 'medical_notes')?.currentValue || prescData.medical_notes || '';

      console.log('[CONFIRM] 📊 Extracted Values:');
      console.log(`[CONFIRM]   - Summary: ${prescriptionSummary ? (prescriptionSummary.substring(0, 50) + '...') : 'EMPTY'}`);
      console.log(`[CONFIRM]   - Date/Time: ${dateTime || 'EMPTY'}`);
      console.log(`[CONFIRM]   - Hospital: ${hospital || 'EMPTY'}`);
      console.log(`[CONFIRM]   - Doctor: ${doctor || 'EMPTY'}`);
      console.log(`[CONFIRM]   - Notes: ${medicalNotes || 'EMPTY'}`);

      // ✅ FIX: Parse date properly (handle DD/MM/YY format)
      let parsedDate = new Date();
      if (dateTime) {
        try {
          // Try to parse common formats: DD/MM/YY, DD/MM/YYYY, ISO, etc.
          const dateStr = dateTime.trim();

          // Handle DD/MM/YY or DD/MM/YYYY format
          if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
            const [day, month, year] = dateStr.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            parsedDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            console.log(`[CONFIRM] 📅 Parsed date: ${dateStr} → ${parsedDate.toISOString()}`);
          } else {
            parsedDate = new Date(dateStr);
            console.log(`[CONFIRM] 📅 Standard date parse: ${dateStr} → ${parsedDate.toISOString()}`);
          }

          // Check if date is valid
          if (isNaN(parsedDate.getTime())) {
            console.log(`[CONFIRM] ⚠️ Invalid date, using current date`);
            parsedDate = new Date();
          }
        } catch (err) {
          console.log(`[CONFIRM] ⚠️ Date parse error: ${err.message}, using current date`);
          parsedDate = new Date();
        }
      }

      console.log('[CONFIRM] 💾 Creating PrescriptionDocument...');
      const prescriptionDoc = new PrescriptionDocument({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        prescriptionSummary: prescriptionSummary, // NEW: Store prescription summary
        doctorName: doctor,
        hospitalName: hospital,
        prescriptionDate: parsedDate,
        medicalNotes: medicalNotes, // NEW: Store medical notes
        medicines: [], // No longer extracting individual medicines
        diagnosis: prescriptionSummary, // Legacy: Store summary as diagnosis
        instructions: medicalNotes, // Legacy: Store notes as instructions
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
      console.log(`[CONFIRM] ✅ PrescriptionDocument created: ${reportId}`);
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
      // ✅ FIX: Read from extraction object if it exists
      const rawData = verification.extractedData;
      const historyData = rawData.extraction || rawData;

      // Get values from verified rows (new simplified schema)
      const medicalSummary = verifiedRows.find(r => r.fieldName === 'medical_summary')?.currentValue || historyData.medical_summary || '';
      const dateTime = verifiedRows.find(r => r.fieldName === 'date_time')?.currentValue || historyData.date_time || '';
      const hospital = verifiedRows.find(r => r.fieldName === 'hospital')?.currentValue || historyData.hospital || '';
      const doctor = verifiedRows.find(r => r.fieldName === 'doctor')?.currentValue || historyData.doctor || '';
      const services = verifiedRows.find(r => r.fieldName === 'services')?.currentValue || historyData.services || [];
      const medicalNotes = verifiedRows.find(r => r.fieldName === 'medical_notes')?.currentValue || historyData.medical_notes || '';

      // ✅ FIX: Parse date properly (handle DD/MM/YY format)
      let parsedDate = new Date();
      if (dateTime) {
        try {
          const dateStr = dateTime.trim();

          // Handle DD/MM/YY or DD/MM/YYYY format
          if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
            const [day, month, year] = dateStr.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            parsedDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            console.log(`[CONFIRM] 📅 Parsed date: ${dateStr} → ${parsedDate.toISOString()}`);
          } else {
            parsedDate = new Date(dateStr);
            console.log(`[CONFIRM] 📅 Standard date parse: ${dateStr} → ${parsedDate.toISOString()}`);
          }

          if (isNaN(parsedDate.getTime())) {
            console.log(`[CONFIRM] ⚠️ Invalid date, using current date`);
            parsedDate = new Date();
          }
        } catch (err) {
          console.log(`[CONFIRM] ⚠️ Date parse error: ${err.message}, using current date`);
          parsedDate = new Date();
        }
      }

      const medicalHistoryDoc = new MedicalHistoryDocument({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        title: 'Medical History Record',
        category: 'General',
        medicalHistory: medicalSummary,
        diagnosis: medicalSummary, // Store summary as diagnosis too
        allergies: '',
        chronicConditions: Array.isArray(services) ? services : [],
        surgicalHistory: [],
        familyHistory: '',
        medications: '',
        recordDate: parsedDate,
        reportDate: parsedDate,
        doctorName: doctor,
        hospitalName: hospital,
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
      console.log('[CONFIRM] 📋 MedicalHistoryDocument saved:', {
        _id: reportId,
        patientId: verification.patientId,
        title: medicalHistoryDoc.title,
        medicalHistory: medicalHistoryDoc.medicalHistory?.substring(0, 100),
        recordDate: medicalHistoryDoc.recordDate,
        pdfId: medicalHistoryDoc.pdfId
      });
    }

    // Update patient record
    const reportTypeMap = {
      'PRESCRIPTION': 'PRESCRIPTION',
      'LAB_REPORT': 'LAB_REPORT',
      'MEDICAL_HISTORY': 'DISCHARGE_SUMMARY',
      'GENERAL': 'GENERAL'
    };

    console.log('[CONFIRM] 📝 Adding to patient.medicalReports[]:', {
      reportId: reportId,
      reportType: reportTypeMap[verification.documentType],
      pdfId: verification.pdfId,
      patientId: verification.patientId
    });

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
    console.log('[CONFIRM] ✅ Patient updated, medicalReports count:', patient.medicalReports.length);

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

// ✅ GET Prescriptions for a patient (scanned prescription documents)
router.get('/prescriptions/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log(`[PRESCRIPTIONS] 💊 Fetching prescriptions for patient: ${patientId}`);

    const prescriptions = await PrescriptionDocument.find({
      patientId: patientId
    })
      .sort({ prescriptionDate: -1, uploadDate: -1 })
      .lean();

    console.log(`[PRESCRIPTIONS] ✅ Found ${prescriptions.length} prescription records`);

    return res.json({
      success: true,
      prescriptions: prescriptions
    });

  } catch (error) {
    console.error('[PRESCRIPTIONS] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      prescriptions: []
    });
  }
});

// ✅ GET Lab Reports for a patient (scanned lab documents)
router.get('/lab-reports/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log(`[LAB_REPORTS] 🧪 Fetching lab reports for patient: ${patientId}`);

    const labReports = await LabReportDocument.find({
      patientId: patientId
    })
      .sort({ reportDate: -1, uploadDate: -1 })
      .lean();

    console.log(`[LAB_REPORTS] ✅ Found ${labReports.length} lab report records`);

    return res.json({
      success: true,
      labReports: labReports
    });

  } catch (error) {
    console.error('[LAB_REPORTS] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      labReports: []
    });
  }
});

// ✅ GET Medical History for a patient
router.get('/medical-history/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log(`[MEDICAL_HISTORY] 📋 Fetching medical history for patient: ${patientId}`);

    const medicalHistory = await MedicalHistoryDocument.find({
      patientId: patientId
    })
      .sort({ recordDate: -1, uploadDate: -1 })
      .lean();

    console.log(`[MEDICAL_HISTORY] ✅ Found ${medicalHistory.length} records`);

    // Log each record for debugging
    medicalHistory.forEach((record, idx) => {
      console.log(`[MEDICAL_HISTORY] Record ${idx + 1}:`, {
        _id: record._id,
        title: record.title,
        medicalHistory: record.medicalHistory?.substring(0, 50),
        recordDate: record.recordDate,
        category: record.category,
        pdfId: record.pdfId
      });
    });

    return res.json({
      success: true,
      medicalHistory: medicalHistory
    });

  } catch (error) {
    console.error('[MEDICAL_HISTORY] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      medicalHistory: []
    });
  }
});

module.exports = router;

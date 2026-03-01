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
    
    // ✅ FIX: Read from extraction object (LandingAI returns nested structure)
    const labData = extractedData.extraction?.labReport || extractedData.labReport || {};
    console.log('[CONVERT] Lab data keys:', Object.keys(labData));
    console.log('[CONVERT] Lab results count:', labData.results?.length || 0);

    if (labData.testType) {
      console.log('[CONVERT] ✅ Found testType:', labData.testType);
      rows.push({ fieldName: 'testType', displayLabel: 'Test Type', originalValue: labData.testType, currentValue: labData.testType, dataType: 'string', category: 'lab_results', confidence: 0.95 });
    } else {
      console.log('[CONVERT] ⚠️ Missing testType');
    }
    
    if (labData.testCategory) {
      console.log('[CONVERT] ✅ Found testCategory:', labData.testCategory);
      rows.push({ fieldName: 'testCategory', displayLabel: 'Test Category', originalValue: labData.testCategory, currentValue: labData.testCategory, dataType: 'string', category: 'lab_results', confidence: 0.95 });
    }
    
    if (labData.labName) {
      console.log('[CONVERT] ✅ Found labName:', labData.labName);
      rows.push({ fieldName: 'labName', displayLabel: 'Lab Name', originalValue: labData.labName, currentValue: labData.labName, dataType: 'string', category: 'other', confidence: 0.95 });
    } else {
      console.log('[CONVERT] ⚠️ Missing labName');
    }
    
    // Check for date fields with various names
    const dateValue = labData.reportDate || labData.testDate || labData.date || labData.sid_date || labData.sample_date;
    if (dateValue) {
      console.log('[CONVERT] ✅ Found date:', dateValue);
      rows.push({ fieldName: 'reportDate', displayLabel: 'Report Date', originalValue: dateValue, currentValue: dateValue, dataType: 'date', category: 'other', confidence: 0.95 });
    } else {
      console.log('[CONVERT] ⚠️ Missing reportDate (checked: reportDate, testDate, date, sid_date, sample_date)');
    }
    
    if (labData.doctorName) {
      console.log('[CONVERT] ✅ Found doctorName:', labData.doctorName);
      rows.push({ fieldName: 'doctorName', displayLabel: 'Doctor Name', originalValue: labData.doctorName, currentValue: labData.doctorName, dataType: 'string', category: 'patient_details', confidence: 0.95 });
    }

    // Lab results array
    if (labData.results && Array.isArray(labData.results)) {
      console.log(`[CONVERT] ✅ Processing ${labData.results.length} test results`);
      labData.results.forEach((result, idx) => {
        console.log(`[CONVERT]   Result ${idx + 1}: ${result.testName || 'Unknown'} = ${result.value || 'N/A'}`);
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
    } else {
      console.log('[CONVERT] ⚠️ No lab results array found or empty');
    }
    
    if (labData.interpretation) {
      console.log('[CONVERT] ✅ Found interpretation');
      rows.push({ fieldName: 'interpretation', displayLabel: 'Interpretation', originalValue: labData.interpretation, currentValue: labData.interpretation, dataType: 'string', category: 'diagnosis', confidence: 0.95 });
    }
    
    if (labData.notes) {
      console.log('[CONVERT] ✅ Found notes');
      rows.push({ fieldName: 'notes', displayLabel: 'Notes', originalValue: labData.notes, currentValue: labData.notes, dataType: 'string', category: 'other', confidence: 0.90 });
    }

    console.log(`[CONVERT] ✅ Created ${rows.length} rows for LAB_REPORT (including ${labData.results?.length || 0} test results)`);

  } else if (documentType === 'MEDICAL_HISTORY') {
    console.log('[CONVERT] Processing MEDICAL_HISTORY document');

    const ex = extractedData.extraction || extractedData;
    console.log('[CONVERT] Medical history data keys:', Object.keys(ex));

    if (!ex || Object.keys(ex).length === 0) {
      throw new Error('Missing extraction data for MEDICAL_HISTORY');
    }

    // Medical type
    if (ex.medical_type) {
      console.log('[CONVERT] ✅ Found medical_type:', ex.medical_type);
      rows.push({
        fieldName: 'medical_type',
        displayLabel: 'Medical Type',
        originalValue: ex.medical_type,
        currentValue: ex.medical_type,
        dataType: 'string',
        category: 'other',
        confidence: 0.95
      });
    }

    // Medical summary (pick whichever exists)
    const summary = ex.appointment_summary || ex.discharge_summary || ex.doctor_notes || ex.observations;
    if (summary) {
      console.log('[CONVERT] ✅ Found medical_summary:', summary.substring(0, 100) + '...');
      rows.push({
        fieldName: 'medical_summary',
        displayLabel: 'Medical Summary',
        originalValue: summary,
        currentValue: summary,
        dataType: 'string',
        category: 'diagnosis',
        confidence: 0.95
      });
    }

    // Date
    if (ex.date) {
      console.log('[CONVERT] ✅ Found date:', ex.date);
      rows.push({
        fieldName: 'date',
        displayLabel: 'Date',
        originalValue: ex.date,
        currentValue: ex.date,
        dataType: 'string',
        category: 'other',
        confidence: 0.95
      });
    }

    // Time (optional)
    if (ex.time) {
      console.log('[CONVERT] ✅ Found time:', ex.time);
      rows.push({
        fieldName: 'time',
        displayLabel: 'Time',
        originalValue: ex.time,
        currentValue: ex.time,
        dataType: 'string',
        category: 'other',
        confidence: 0.95
      });
    }

    // Hospital
    if (ex.hospital_name) {
      console.log('[CONVERT] ✅ Found hospital:', ex.hospital_name);
      rows.push({
        fieldName: 'hospital',
        displayLabel: 'Hospital',
        originalValue: ex.hospital_name,
        currentValue: ex.hospital_name,
        dataType: 'string',
        category: 'other',
        confidence: 0.95
      });
    }

    // Doctor
    if (ex.doctor_name) {
      console.log('[CONVERT] ✅ Found doctor:', ex.doctor_name);
      rows.push({
        fieldName: 'doctor',
        displayLabel: 'Doctor',
        originalValue: ex.doctor_name,
        currentValue: ex.doctor_name,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }

    // Optional fields
    const optionalFields = [
      ['department', 'Department'],
      ['services', 'Services'],
      ['doctor_notes', 'Doctor Notes'],
      ['observations', 'Observations'],
      ['remarks', 'Remarks']
    ];

    optionalFields.forEach(([key, label]) => {
      if (ex[key] !== null && ex[key] !== undefined && ex[key] !== '') {
        console.log(`[CONVERT] ✅ Found ${key}:`, typeof ex[key] === 'string' ? ex[key].substring(0, 50) : ex[key]);
        rows.push({
          fieldName: key,
          displayLabel: label,
          originalValue: ex[key],
          currentValue: ex[key],
          dataType: Array.isArray(ex[key]) ? 'array' : 'string',
          category: 'other',
          confidence: 0.90
        });
      }
    });

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
      console.log('[CONFIRM] 🧪 Processing LAB_REPORT document');
      
      // ✅ FIX: Read from extraction object if it exists (same pattern as PRESCRIPTION)
      const rawData = verification.extractedData;
      const labData = rawData.extraction?.labReport || rawData.labReport || {};
      
      console.log('[CONFIRM] Lab data keys:', Object.keys(labData));
      console.log('[CONFIRM] Lab results in extraction:', labData.results?.length || 0);

      // Build results array from verified rows
      const results = verifiedRows
        .filter(r => r.category === 'lab_results' && r.fieldName.startsWith('labResult_'))
        .map(r => {
          const result = r.currentValue;
          
          // Normalize flag value to match enum
          let normalizedFlag = result.flag || '';
          if (normalizedFlag) {
            normalizedFlag = normalizedFlag.toLowerCase().replace(/abnormal\s*/i, '').trim();
            if (!['normal', 'high', 'low', ''].includes(normalizedFlag)) {
              normalizedFlag = '';
            }
          }
          
          return {
            testName: result.testName || '',
            value: result.value?.toString() || '',
            unit: result.unit || '',
            referenceRange: result.normalRange || result.referenceRange || '',
            flag: normalizedFlag
          };
        });
      
      console.log(`[CONFIRM] 📊 Reconstructed ${results.length} lab results from verified rows`);

      // Parse report date properly
      let reportDate = new Date();
      const reportDateValue = verifiedRows.find(r => r.fieldName === 'reportDate')?.currentValue || labData.reportDate;
      if (reportDateValue) {
        try {
          const dateStr = reportDateValue.toString().trim();
          // Handle DD-MM-YYYY format
          if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
            const [day, month, year] = dateStr.split('-');
            reportDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            console.log(`[CONFIRM] 📅 Parsed report date: ${dateStr} → ${reportDate.toISOString()}`);
          } else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
            // Handle DD/MM/YY or DD/MM/YYYY format
            const [day, month, year] = dateStr.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            reportDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            console.log(`[CONFIRM] 📅 Parsed report date: ${dateStr} → ${reportDate.toISOString()}`);
          } else {
            reportDate = new Date(dateStr);
            console.log(`[CONFIRM] 📅 Standard date parse: ${dateStr} → ${reportDate.toISOString()}`);
          }
          
          if (isNaN(reportDate.getTime())) {
            console.log(`[CONFIRM] ⚠️ Invalid report date, using current date`);
            reportDate = new Date();
          }
        } catch (err) {
          console.log(`[CONFIRM] ⚠️ Report date parse error: ${err.message}, using current date`);
          reportDate = new Date();
        }
      }

      const labReportDoc = new LabReportDocument({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        testType: verifiedRows.find(r => r.fieldName === 'testType')?.currentValue || labData.testType || 'GENERAL',
        testCategory: verifiedRows.find(r => r.fieldName === 'testCategory')?.currentValue || labData.testCategory || 'General',
        intent: labData.testType || 'GENERAL',
        labName: verifiedRows.find(r => r.fieldName === 'labName')?.currentValue || labData.labName || '',
        reportDate: reportDate,
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
      console.log(`[CONFIRM] ✅ LabReportDocument created: ${reportId}`);
      console.log(`[CONFIRM]   - Test Type: ${labReportDoc.testType}`);
      console.log(`[CONFIRM]   - Lab Name: ${labReportDoc.labName}`);
      console.log(`[CONFIRM]   - Results Count: ${labReportDoc.results.length}`);
      logh(batchId, `🧪 Created LabReportDocument: ${reportId} with ${results.length} test results`);

    } else if (verification.documentType === 'MEDICAL_HISTORY') {
      console.log('[CONFIRM] 📋 Processing MEDICAL_HISTORY document');
      
      const ex = verification.extractedData.extraction || verification.extractedData;
      
      // Get values from verified rows (using correct field names)
      const medicalSummary = verifiedRows.find(r => r.fieldName === 'medical_summary')?.currentValue || 
                             ex.appointment_summary || ex.discharge_summary || ex.doctor_notes || ex.observations || '';
      const dateValue = verifiedRows.find(r => r.fieldName === 'date')?.currentValue || ex.date || '';
      const timeValue = verifiedRows.find(r => r.fieldName === 'time')?.currentValue || ex.time || '';
      const hospital = verifiedRows.find(r => r.fieldName === 'hospital')?.currentValue || ex.hospital_name || '';
      const doctor = verifiedRows.find(r => r.fieldName === 'doctor')?.currentValue || ex.doctor_name || '';
      const services = verifiedRows.find(r => r.fieldName === 'services')?.currentValue || ex.services || [];
      const doctorNotes = verifiedRows.find(r => r.fieldName === 'doctor_notes')?.currentValue || ex.doctor_notes || '';
      const observations = verifiedRows.find(r => r.fieldName === 'observations')?.currentValue || ex.observations || '';
      const remarks = verifiedRows.find(r => r.fieldName === 'remarks')?.currentValue || ex.remarks || '';
      const department = verifiedRows.find(r => r.fieldName === 'department')?.currentValue || ex.department || '';

      console.log('[CONFIRM] 📊 Extracted Values:');
      console.log(`[CONFIRM]   - Summary: ${medicalSummary ? (medicalSummary.substring(0, 50) + '...') : 'EMPTY'}`);
      console.log(`[CONFIRM]   - Date: ${dateValue || 'EMPTY'}`);
      console.log(`[CONFIRM]   - Time: ${timeValue || 'EMPTY'}`);
      console.log(`[CONFIRM]   - Hospital: ${hospital || 'EMPTY'}`);
      console.log(`[CONFIRM]   - Doctor: ${doctor || 'EMPTY'}`);

      // Parse date properly
      let parsedDate = new Date();
      if (dateValue) {
        try {
          const dateStr = dateValue.trim();

          // Handle DD/MM/YY or DD/MM/YYYY format
          if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
            const [day, month, year] = dateStr.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            parsedDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            console.log(`[CONFIRM] 📅 Parsed date: ${dateStr} → ${parsedDate.toISOString()}`);
          } else if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
            // Handle DD-MM-YYYY format
            const [day, month, year] = dateStr.split('-');
            parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
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

      // Combine all notes/observations
      const combinedNotes = [doctorNotes, observations, remarks].filter(n => n).join('\n\n');

      // Map department to valid category enum
      const validCategories = ['General', 'Chronic', 'Acute', 'Surgical', 'Family', 'Other', 'Discharge'];
      let category = 'General';
      if (department) {
        const deptLower = department.toLowerCase();
        if (deptLower.includes('surgery') || deptLower.includes('surgical')) {
          category = 'Surgical';
        } else if (deptLower.includes('chronic')) {
          category = 'Chronic';
        } else if (deptLower.includes('discharge')) {
          category = 'Discharge';
        } else if (deptLower.includes('family')) {
          category = 'Family';
        } else {
          category = 'Other';
        }
      }

      console.log('[CONFIRM] 💾 Creating MedicalHistoryDocument...');
      const medicalHistoryDoc = new MedicalHistoryDocument({
        patientId: verification.patientId,
        pdfId: verification.pdfId,
        title: ex.medical_type || 'Medical History Record',
        category: category,
        department: department,
        medicalHistory: medicalSummary,
        diagnosis: medicalSummary,
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
    
    // Log first report to debug date fields
    if (labReports.length > 0) {
      console.log('[LAB_REPORTS] Sample report dates:', {
        reportDate: labReports[0].reportDate,
        uploadDate: labReports[0].uploadDate,
        testType: labReports[0].testType
      });
    }

    return res.json({
      success: true,
      reports: labReports,
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

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const auth = require('../Middleware/Auth');
const { Patient, PatientPDF, PrescriptionDocument, LabReportDocument, MedicalHistoryDocument } = require('../Models');
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
    let reportId = null;

    // If patientId provided, save to database
    if (patientId) {
      try {
        const patient = await Patient.findById(patientId);

        if (patient) {
          const fileBuffer = await fs.readFile(req.file.path);

          // Store in MongoDB
          const patientPDF = new PatientPDF({
            patientId: patientId,
            title: `${scanResult.documentType} Document`,
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

          // Save to appropriate collection based on document type
          if (scanResult.documentType === 'PRESCRIPTION') {
            const prescData = scanResult.extractedData;
            const prescriptionDoc = new PrescriptionDocument({
              patientId: patientId,
              pdfId: pdfIdString,
              doctorName: prescData.doctor_details?.name || '',
              hospitalName: prescData.doctor_details?.hospital || '',
              prescriptionDate: prescData.prescription_date || new Date(),
              medicines: prescData.medications?.map(med => ({
                name: med.name || '',
                dosage: med.dose || '',
                frequency: med.frequency || '',
                duration: med.duration || '',
                instructions: med.instructions || ''
              })) || [],
              diagnosis: prescData.diagnosis || '',
              instructions: prescData.notes || '',
              ocrText: scanResult.markdown || '',
              ocrEngine: 'landingai-ade',
              ocrConfidence: scanResult.confidence || 0.95,
              extractedData: scanResult.extractedData,
              status: 'completed',
              uploadedBy: req.user?._id || null,
              uploadDate: new Date()
            });

            await prescriptionDoc.save();
            reportId = prescriptionDoc._id.toString();
            logh(batchId, `💊 Created PrescriptionDocument: ${reportId}`);

          } else if (scanResult.documentType === 'LAB_REPORT') {
            const labData = scanResult.extractedData.labReport || {};
            const labReportDoc = new LabReportDocument({
              patientId: patientId,
              pdfId: pdfIdString,
              testType: labData.testType || 'GENERAL',
              testCategory: labData.testCategory || 'General',
              intent: labData.testType || 'GENERAL',
              labName: labData.labName || '',
              reportDate: labData.reportDate || new Date(),
              results: labData.results?.map(r => ({
                testName: r.testName || '',
                value: r.value?.toString() || '',
                unit: r.unit || '',
                referenceRange: r.normalRange || '',
                flag: r.flag || 'Normal'
              })) || [],
              ocrText: scanResult.markdown || '',
              ocrEngine: 'landingai-ade',
              ocrConfidence: scanResult.confidence || 0.95,
              extractedData: scanResult.extractedData,
              extractionQuality: 'excellent',
              status: 'completed',
              uploadedBy: req.user?._id || null,
              uploadDate: new Date()
            });

            await labReportDoc.save();
            reportId = labReportDoc._id.toString();
            logh(batchId, `🧪 Created LabReportDocument: ${reportId}`);

          } else if (scanResult.documentType === 'MEDICAL_HISTORY') {
            const historyData = scanResult.extractedData;
            const medicalHistoryDoc = new MedicalHistoryDocument({
              patientId: patientId,
              pdfId: pdfIdString,
              title: 'Medical History Record',
              category: 'General',
              medicalHistory: historyData.medicalHistory || '',
              diagnosis: historyData.diagnosis || '',
              allergies: historyData.allergies || '',
              chronicConditions: historyData.chronicConditions || [],
              surgicalHistory: historyData.surgicalHistory || [],
              familyHistory: historyData.familyHistory || '',
              medications: historyData.currentMedications?.join(', ') || '',
              recordDate: historyData.recordDate || new Date(),
              reportDate: historyData.recordDate || new Date(),
              ocrText: scanResult.markdown || '',
              ocrEngine: 'landingai-ade',
              ocrConfidence: scanResult.confidence || 0.95,
              extractedData: scanResult.extractedData,
              status: 'completed',
              uploadedBy: req.user?._id || null,
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
            reportType: reportTypeMap[scanResult.documentType] || 'GENERAL',
            imagePath: pdfIdString,
            uploadDate: new Date(),
            uploadedBy: req.user?._id || null,
            extractedData: scanResult.extractedData,
            ocrText: scanResult.markdown,
            intent: scanResult.documentType
          });

          await patient.save();
          logh(batchId, `✅ Report attached to patient: ${patientId}`);
        }
      } catch (saveError) {
        logh(batchId, `⚠️ Save failed: ${saveError.message}`);
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
        reportId: reportId,
        saved: savedImagePath !== null
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

module.exports = router;

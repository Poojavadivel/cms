// routes/pathology.js
const express = require('express');
const router = express.Router();
const auth = require('../Middleware/Auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const {
  LabReport,
  Patient,
  Intake
} = require('../Models');

function requireAdminOrPathologist(req, res) {
  const role = req.user && req.user.role;
  if (!role || (role !== 'admin' && role !== 'pathologist' && role !== 'superadmin')) {
    console.log('⛔ [AUTH] Access denied. Required role admin/pathologist. User role:', role, 'userId:', req.user?.id);
    res.status(403).json({
      success: false,
      message: 'Forbidden: admin/pathologist role required',
      errorCode: 7002,
    });
    return false;
  }
  return true;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/lab-reports');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed'));
    }
  }
});

/**
 * ------------------
 * PENDING LAB TESTS (from intakes)
 * ------------------
 */

// GET pending lab tests from intakes
router.get('/pending-tests', auth, async (req, res) => {
  try {
    console.log('📥 [PENDING LAB TESTS] requestedBy:', req.user?.id);
    
    if (!Intake) {
      return res.status(500).json({ success: false, message: 'Intake model not available', errorCode: 7003 });
    }

    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = page * limit;

    // Find intakes that have pathology items and haven't been completed yet
    const intakes = await Intake.find({
      'meta.labReportIds': { $exists: false } // No lab reports created yet
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // Filter intakes that actually have pathology data
    const pendingTests = [];
    for (const intake of intakes) {
      const hasPathologyData = intake.meta?.pathology || 
                               (Array.isArray(intake.attachments) && 
                                intake.attachments.some(a => a.type === 'pathology'));
      
      if (hasPathologyData || intake.meta?.pathologyItems) {
        pendingTests.push({
          _id: intake._id,
          patientName: `${intake.patientSnapshot?.firstName || ''} ${intake.patientSnapshot?.lastName || ''}`.trim(),
          patientId: intake.patientId,
          patientPhone: intake.patientSnapshot?.phone,
          doctorId: intake.doctorId,
          appointmentId: intake.appointmentId,
          pathologyItems: intake.meta?.pathologyItems || intake.meta?.pathology || [],
          createdAt: intake.createdAt,
          notes: intake.notes
        });
      }
    }

    const total = pendingTests.length;

    console.log(`📦 [PENDING LAB TESTS] returning ${pendingTests.length} tests`);
    return res.status(200).json({ 
      success: true, 
      tests: pendingTests, 
      total, 
      page, 
      limit 
    });
  } catch (err) {
    console.error('❌ [PENDING LAB TESTS] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending lab tests', errorCode: 7004 });
  }
});

/**
 * ------------------
 * LAB REPORTS
 * ------------------
 */

// CREATE Lab Report with file upload
router.post('/reports', auth, upload.single('file'), async (req, res) => {
  try {
    if (!requireAdminOrPathologist(req, res)) return;
    
    console.log('📩 [LAB REPORT CREATE] payload:', req.body, 'file:', req.file, 'by user:', req.user?.id);
    
    if (!LabReport) {
      return res.status(500).json({ success: false, message: 'LabReport model not available', errorCode: 7005 });
    }

    const data = req.body || {};
    
    if (!data.patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required', errorCode: 7006 });
    }

    // Verify patient exists
    if (Patient) {
      const patient = await Patient.findById(data.patientId);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 7007 });
      }
    }

    const reportData = {
      patientId: data.patientId,
      appointmentId: data.appointmentId || null,
      testType: data.testType || data.testName || 'Lab Test',
      results: typeof data.results === 'string' ? JSON.parse(data.results) : (data.results || {}),
      fileRef: req.file ? req.file.filename : null,
      uploadedBy: req.user?.id || '',
      rawText: data.rawText || '',
      enhancedText: data.enhancedText || '',
      metadata: {
        category: data.category || '',
        priority: data.priority || 'Normal',
        notes: data.notes || '',
        originalFilename: req.file ? req.file.originalname : null,
        fileSize: req.file ? req.file.size : null,
        filePath: req.file ? req.file.path : null,
        ...(typeof data.metadata === 'string' ? JSON.parse(data.metadata) : (data.metadata || {}))
      }
    };

    const labReport = await LabReport.create(reportData);

    // If linked to an intake, update the intake
    if (data.intakeId && Intake) {
      const intake = await Intake.findById(data.intakeId);
      if (intake) {
        intake.meta = intake.meta || {};
        intake.meta.labReportIds = intake.meta.labReportIds || [];
        intake.meta.labReportIds.push(String(labReport._id));
        await intake.save();
        console.log('✅ [LAB REPORT CREATE] Updated intake with lab report ID');
      }
    }

    console.log('✅ [LAB REPORT CREATE] Created lab report:', labReport._id);
    return res.status(201).json({ success: true, report: labReport });
  } catch (err) {
    console.error('💥 [LAB REPORT CREATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create lab report', errorCode: 7008 });
  }
});

// LIST Lab Reports
router.get('/reports', auth, async (req, res) => {
  try {
    console.log('📥 [LAB REPORTS LIST] query:', req.query, 'requestedBy:', req.user?.id);
    
    if (!LabReport) {
      return res.status(500).json({ success: false, message: 'LabReport model not available', errorCode: 7005 });
    }

    const patientId = (req.query.patientId || '').toString().trim();
    const testType = (req.query.testType || '').toString().trim();
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (testType) filter.testType = new RegExp(testType, 'i');
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const skip = page * limit;
    const reports = await LabReport.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    
    const total = await LabReport.countDocuments(filter);

    // Populate patient name, patient code, and uploader name
    const User = require('../Models/User');
    for (const report of reports) {
      // Populate patient details
      if (report.patientId && Patient) {
        try {
          const patient = await Patient.findById(report.patientId).lean();
          if (patient) {
            const firstName = patient.firstName || '';
            const lastName = patient.lastName || '';
            const fullName = patient.name || `${firstName} ${lastName}`.trim();
            report.patientName = fullName || 'Unknown';
            
            // Extract patient code
            const patientCode = patient.patientCode || 
                               patient.metadata?.patientCode || 
                               patient.metadata?.patient_code || 
                               'PAT-00';
            report.patientCode = patientCode;
          } else {
            report.patientName = 'Unknown';
            report.patientCode = 'PAT-00';
          }
        } catch (e) {
          console.error('Failed to fetch patient for report:', report._id, e);
          report.patientName = 'Unknown';
          report.patientCode = 'PAT-00';
        }
      } else {
        report.patientName = 'Unknown';
        report.patientCode = 'PAT-00';
      }

      // Populate uploader name - try multiple sources
      let uploaderFound = false;
      
      // 1. Try to find from intake (if report has appointmentId or if we can find related intake)
      if (Intake && report.patientId) {
        try {
          // Find the most recent intake for this patient that might be related to this report
          const intake = await Intake.findOne({
            patientId: report.patientId,
            createdAt: { $lte: new Date(report.createdAt) }
          })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean();
          
          if (intake && intake.doctorId && User) {
            const doctor = await User.findById(intake.doctorId).lean();
            if (doctor) {
              report.uploaderName = doctor.profile?.name || 
                                   `${doctor.profile?.firstName || ''} ${doctor.profile?.lastName || ''}`.trim() || 
                                   doctor.username || 
                                   'Doctor';
              uploaderFound = true;
            }
          }
        } catch (e) {
          console.error('Failed to fetch intake/doctor for report:', report._id, e);
        }
      }

      // 2. If not found from intake, try uploadedBy field
      if (!uploaderFound && report.uploadedBy && User) {
        try {
          const user = await User.findById(report.uploadedBy).lean();
          if (user) {
            report.uploaderName = user.profile?.name || 
                                 `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 
                                 user.username || 
                                 'Admin';
            uploaderFound = true;
          }
        } catch (e) {
          console.error('Failed to fetch uploader for report:', report._id, e);
        }
      }

      // 3. Final fallback
      if (!uploaderFound) {
        report.uploaderName = 'Admin';
      }
    }

    console.log(`📦 [LAB REPORTS LIST] returning ${reports.length} reports (total ${total})`);
    return res.status(200).json({ 
      success: true, 
      reports, 
      total, 
      page, 
      limit 
    });
  } catch (err) {
    console.error('❌ [LAB REPORTS LIST] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch lab reports', errorCode: 7009 });
  }
});

// GET Lab Report by ID
router.get('/reports/:id', auth, async (req, res) => {
  try {
    console.log('🔎 [LAB REPORT GET] id:', req.params.id, 'requestedBy:', req.user?.id);
    
    if (!LabReport) {
      return res.status(500).json({ success: false, message: 'LabReport model not available', errorCode: 7005 });
    }

    const report = await LabReport.findById(req.params.id).lean();
    if (!report) {
      console.warn('⚠️ [LAB REPORT GET] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Lab report not found', errorCode: 7010 });
    }

    console.log('✅ [LAB REPORT GET] Found report:', report._id);
    return res.status(200).json({ success: true, report });
  } catch (err) {
    console.error('❌ [LAB REPORT GET] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch lab report', errorCode: 7011 });
  }
});

// UPDATE Lab Report
router.put('/reports/:id', auth, upload.single('file'), async (req, res) => {
  try {
    if (!requireAdminOrPathologist(req, res)) return;
    
    console.log('✏️ [LAB REPORT UPDATE] id:', req.params.id, 'payload:', req.body, 'by user:', req.user?.id);
    
    if (!LabReport) {
      return res.status(500).json({ success: false, message: 'LabReport model not available', errorCode: 7005 });
    }

    const data = req.body || {};
    const update = { updatedAt: Date.now() };

    if (data.testType) update.testType = data.testType;
    if (data.results) update.results = typeof data.results === 'string' ? JSON.parse(data.results) : data.results;
    if (data.rawText !== undefined) update.rawText = data.rawText;
    if (data.enhancedText !== undefined) update.enhancedText = data.enhancedText;
    if (req.file) {
      update.fileRef = req.file.filename;
      update['metadata.originalFilename'] = req.file.originalname;
      update['metadata.fileSize'] = req.file.size;
      update['metadata.filePath'] = req.file.path;
    }
    if (data.metadata) {
      const existingMeta = (await LabReport.findById(req.params.id).lean())?.metadata || {};
      update.metadata = {
        ...existingMeta,
        ...(typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata)
      };
    }

    const updated = await LabReport.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.warn('⚠️ [LAB REPORT UPDATE] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Lab report not found', errorCode: 7010 });
    }

    console.log('✅ [LAB REPORT UPDATE] Updated:', updated._id);
    return res.status(200).json({ success: true, report: updated });
  } catch (err) {
    console.error('❌ [LAB REPORT UPDATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update lab report', errorCode: 7012 });
  }
});

// DELETE Lab Report
router.delete('/reports/:id', auth, async (req, res) => {
  try {
    if (!requireAdminOrPathologist(req, res)) return;
    
    console.log('🗑️ [LAB REPORT DELETE] id:', req.params.id, 'requestedBy:', req.user?.id);
    
    if (!LabReport) {
      return res.status(500).json({ success: false, message: 'LabReport model not available', errorCode: 7005 });
    }

    const report = await LabReport.findById(req.params.id);
    if (!report) {
      console.warn('⚠️ [LAB REPORT DELETE] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Lab report not found', errorCode: 7010 });
    }

    // Delete associated file if exists
    if (report.fileRef) {
      const filePath = path.join(__dirname, '../uploads/lab-reports', report.fileRef);
      try {
        await fs.unlink(filePath);
        console.log('✅ [LAB REPORT DELETE] Deleted file:', filePath);
      } catch (err) {
        console.warn('⚠️ [LAB REPORT DELETE] Could not delete file:', err.message);
      }
    }

    await report.deleteOne();

    console.log('✅ [LAB REPORT DELETE] Deleted:', report._id);
    return res.status(200).json({ success: true, message: 'Lab report deleted successfully', deletedId: report._id });
  } catch (err) {
    console.error('❌ [LAB REPORT DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete lab report', errorCode: 7013 });
  }
});

// Download lab report file
router.get('/reports/:id/download', auth, async (req, res) => {
  try {
    console.log('⬇️ [LAB REPORT DOWNLOAD] id:', req.params.id, 'requestedBy:', req.user?.id);
    
    if (!LabReport) {
      return res.status(500).json({ success: false, message: 'LabReport model not available', errorCode: 7005 });
    }

    const report = await LabReport.findById(req.params.id).lean();
    if (!report) {
      console.warn('⚠️ [LAB REPORT DOWNLOAD] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Lab report not found', errorCode: 7010 });
    }

    if (!report.fileRef) {
      return res.status(404).json({ success: false, message: 'No file attached to this report', errorCode: 7014 });
    }

    const filePath = path.join(__dirname, '../uploads/lab-reports', report.fileRef);
    
    try {
      await fs.access(filePath);
      console.log('✅ [LAB REPORT DOWNLOAD] Sending file:', filePath);
      return res.download(filePath, report.metadata?.originalFilename || report.fileRef);
    } catch (err) {
      console.error('❌ [LAB REPORT DOWNLOAD] File not found:', filePath);
      return res.status(404).json({ success: false, message: 'File not found on server', errorCode: 7015 });
    }
  } catch (err) {
    console.error('❌ [LAB REPORT DOWNLOAD] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to download lab report', errorCode: 7016 });
  }
});

module.exports = router;

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
  Intake,
  PatientPDF
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

// Configure multer for memory storage (save to DB, not disk)
const storage = multer.memoryStorage();
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

    // Find intakes that have pathology items and haven't been fully completed yet
    const intakes = await Intake.find({
      $or: [
        { 'meta.labReportIds': { $exists: false } },
        {
          'meta.pathologyItems': {
            $elemMatch: { status: { $ne: 'Completed' } }
          }
        }
      ]
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
          pathologyItems: (intake.meta?.pathologyItems || intake.meta?.pathology || [])
            .filter(item => item.status !== 'Completed'),
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

// GET list of available tests (Master List)
router.get('/tests', auth, async (req, res) => {
  try {
    // In a real app, this would come from a LabTest model
    // For now, we return a standard set of tests
    const masterTests = [
      { _id: 't1', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 500 },
      { _id: 't2', name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 1200 },
      { _id: 't3', name: 'Kidney Function Test (KFT)', category: 'Biochemistry', price: 1500 },
      { _id: 't4', name: 'Blood Sugar (Fasting & PP)', category: 'Biochemistry', price: 300 },
      { _id: 't5', name: 'Lipid Profile', category: 'Biochemistry', price: 1000 },
      { _id: 't6', name: 'Thyroid Profile (T3, T4, TSH)', category: 'Hormones', price: 1800 },
      { _id: 't7', name: 'Urine Routine & Microscopy', category: 'Urine Analysis', price: 400 },
      { _id: 't8', name: 'Blood Grouping & Rh Typing', category: 'Hematology', price: 200 },
      { _id: 't9', name: 'HbA1c', category: 'Biochemistry', price: 800 },
      { _id: 't10', name: 'Vitamin D3 / B12', category: 'Vitamins', price: 2500 }
    ];

    return res.status(200).json({
      success: true,
      tests: masterTests,
      total: masterTests.length
    });
  } catch (err) {
    console.error('❌ [MASTER TESTS] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tests' });
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

    // Handle file upload to Database (PatientPDF)
    let fileId = null;
    if (req.file) {
      if (!PatientPDF) {
        return res.status(500).json({ success: false, message: 'PatientPDF model not available', errorCode: 7005 });
      }

      const pdfDoc = await PatientPDF.create({
        patientId: data.patientId,
        title: data.testName || 'Lab Report',
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        data: req.file.buffer,
        size: req.file.size
      });
      fileId = pdfDoc._id;
      console.log('📄 [LAB REPORT CREATE] Saved file to Database:', fileId);
    }

    const reportData = {
      patientId: data.patientId,
      patientName: data.patientName || '',
      appointmentId: data.appointmentId || null,
      testName: data.testName || 'Lab Test',
      testType: data.testType || 'General',
      testCategory: data.testCategory || data.category || 'General',
      status: data.status || 'Pending',
      priority: data.priority || 'Normal',
      collectionDate: data.collectionDate || null,
      reportDate: data.reportDate || Date.now(),
      doctorName: data.doctorName || '',
      technician: data.technician || '',
      remarks: data.remarks || data.notes || '',
      results: typeof data.results === 'string' ? JSON.parse(data.results) : (data.results || {}),
      fileRef: fileId,
      uploadedBy: req.user?.id || '',
      rawText: data.rawText || '',
      enhancedText: data.enhancedText || '',
      metadata: {
        originalFilename: req.file ? req.file.originalname : null,
        fileSize: req.file ? req.file.size : null,
        storageSource: fileId ? 'database' : 'none',
        ...(typeof data.metadata === 'string' ? JSON.parse(data.metadata) : (data.metadata || {}))
      }
    };

    const labReport = await LabReport.create(reportData);
    console.log('✅ [LAB REPORT CREATE] Created lab report:', labReport._id);

    // Link to Patient's medical history
    if (Patient && labReport.patientId) {
      try {
        await Patient.findByIdAndUpdate(labReport.patientId, {
          $push: {
            medicalReports: {
              reportId: labReport._id,
              reportType: 'LAB_REPORT',
              imagePath: fileId ? String(fileId) : 'LAB_REPORT_ENTRY',
              uploadDate: new Date(),
              uploadedBy: req.user?.id || '',
              extractedData: labReport.results || {},
              metadata: labReport.metadata || {}
            }
          }
        });
        console.log('✅ [LAB REPORT CREATE] Reflected in Patient medical history');
      } catch (pErr) {
        console.warn('⚠️ [LAB REPORT CREATE] Could not update patient history:', pErr.message);
      }
    }

    // If linked to an intake, update the intake
    if (data.intakeId && Intake) {
      const intake = await Intake.findById(data.intakeId);
      if (intake) {
        intake.meta = intake.meta || {};
        intake.meta.labReportIds = intake.meta.labReportIds || [];
        intake.meta.labReportIds.push(String(labReport._id));

        // Also update the status in pathologyItems if found
        if (Array.isArray(intake.meta.pathologyItems)) {
          const idx = intake.meta.pathologyItems.findIndex(t => t.testName === labReport.testName);
          if (idx !== -1) {
            intake.meta.pathologyItems[idx].status = 'Completed';
            intake.meta.pathologyItems[idx].reportId = labReport._id;
            intake.markModified('meta.pathologyItems');
          }
        }

        await intake.save();
        console.log('✅ [LAB REPORT CREATE] Updated intake with lab report ID');
      }
    }
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
      // Use existing patient details if already present (from seeded data)
      if (!report.patientName || !report.patientCode) {
        // Only fetch patient if details are missing
        if (report.patientId && Patient) {
          try {
            const patient = await Patient.findById(report.patientId).lean();
            if (patient) {
              const firstName = patient.firstName || '';
              const lastName = patient.lastName || '';
              const fullName = patient.name || `${firstName} ${lastName}`.trim();
              report.patientName = report.patientName || fullName || 'Unknown';

              // Extract patient code
              const patientCode = patient.patientCode ||
                patient.metadata?.patientCode ||
                patient.metadata?.patient_code ||
                'PAT-00';
              report.patientCode = report.patientCode || patientCode;
            } else {
              report.patientName = report.patientName || 'Unknown';
              report.patientCode = report.patientCode || 'PAT-00';
            }
          } catch (e) {
            console.error('Failed to fetch patient for report:', report._id, e);
            report.patientName = report.patientName || 'Unknown';
            report.patientCode = report.patientCode || 'PAT-00';
          }
        } else {
          report.patientName = report.patientName || 'Unknown';
          report.patientCode = report.patientCode || 'PAT-00';
        }
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

    // Populate patient details
    if (report.patientId && Patient) {
      try {
        const patient = await Patient.findById(report.patientId).lean();
        if (patient) {
          report.patientName = patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown';
          report.patientCode = patient.patientCode || 'PAT-00';
          report.patientAge = patient.age || (patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000) : 'N/A');
          report.patientGender = patient.gender || 'N/A';
        }
      } catch (e) {
        console.error('Failed to populate patient for report detail:', e);
      }
    }

    // Populate uploader/staff info
    const User = require('../Models/User');
    if (report.uploadedBy && User) {
      try {
        const user = await User.findById(report.uploadedBy).lean();
        if (user) {
          report.technician = user.profile?.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.username || 'Admin';
        }
      } catch (e) {
        console.error('Failed to populate uploader for report detail:', e);
      }
    }

    // Fallback for doctor name (from intake)
    if (Intake && report.patientId) {
      try {
        const intake = await Intake.findOne({ patientId: report.patientId }).sort({ createdAt: -1 }).lean();
        if (intake && intake.doctorId && User) {
          const doctor = await User.findById(intake.doctorId).lean();
          if (doctor) {
            report.doctorName = doctor.profile?.name || `${doctor.profile?.firstName || ''} ${doctor.profile?.lastName || ''}`.trim() || 'Doctor';
          }
        }
      } catch (e) {
        console.error('Failed to populate doctor for report detail:', e);
      }
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

    // Standard fields from Form
    if (data.patientId) update.patientId = data.patientId;
    if (data.patientName) update.patientName = data.patientName;
    if (data.testName) update.testName = data.testName;
    if (data.testType) update.testType = data.testType;
    if (data.testCategory !== undefined) update.testCategory = data.testCategory;
    if (data.collectionDate) update.collectionDate = data.collectionDate;
    if (data.reportDate) update.reportDate = data.reportDate;
    if (data.status) update.status = data.status;
    if (data.priority) update.priority = data.priority;
    if (data.doctorName) update.doctorName = data.doctorName;
    if (data.technician) update.technician = data.technician;
    if (data.notes !== undefined) update.remarks = data.notes; // Map notes to remarks in schema

    // Metadata and specialized fields
    try {
      if (data.results) update.results = typeof data.results === 'string' ? JSON.parse(data.results) : data.results;
      if (data.testResults) update.testResults = typeof data.testResults === 'string' ? JSON.parse(data.testResults) : data.testResults;
    } catch (e) {
      console.warn('⚠️ [LAB REPORT UPDATE] JSON parse failed for results:', e.message);
    }

    if (data.rawText !== undefined) update.rawText = data.rawText;
    if (data.enhancedText !== undefined) update.enhancedText = data.enhancedText;

    if (req.file) {
      if (!PatientPDF) {
        return res.status(500).json({ success: false, message: 'PatientPDF model not available', errorCode: 7005 });
      }

      // Create new PDF record in DB
      const pdfDoc = await PatientPDF.create({
        patientId: data.patientId || (await LabReport.findById(req.params.id))?.patientId,
        title: data.testName || 'Updated Lab Report',
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        data: req.file.buffer,
        size: req.file.size
      });

      update.fileRef = pdfDoc._id;
      update['metadata.originalFilename'] = req.file.originalname;
      update['metadata.fileSize'] = req.file.size;
      update['metadata.storageSource'] = 'database';
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

    // Delete associated file if exists (from DB or Disk)
    if (report.fileRef) {
      // 1. Try to delete from Database (PatientPDF)
      if (PatientPDF) {
        try {
          const deletedFile = await PatientPDF.findByIdAndDelete(report.fileRef);
          if (deletedFile) {
            console.log('✅ [LAB REPORT DELETE] Deleted file from Database:', report.fileRef);
          }
        } catch (dbErr) {
          console.warn('⚠️ [LAB REPORT DELETE] DB file delete error:', dbErr.message);
        }
      }

      // 2. Try to delete from Disk (Fallback for old reports)
      const filePath = path.join(__dirname, '../uploads/lab-reports', report.fileRef);
      try {
        await fs.unlink(filePath);
        console.log('✅ [LAB REPORT DELETE] Deleted file from Disk:', filePath);
      } catch (err) {
        // Normal if it's a DB file, so we don't spam errors
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

    // Possible file paths to check
    const searchPaths = [
      path.join(__dirname, '../uploads/lab-reports', report.fileRef),
      path.join(__dirname, '../uploads/medical-reports', report.fileRef),
      path.join(__dirname, '../uploads/medical-reports', report.patientId || 'unknown', report.fileRef)
    ];

    console.log('🔍 [LAB REPORT DOWNLOAD] Attempting to locate file:', report.fileRef);

    // STRATEGY 1: Check MongoDB (PatientPDF collection)
    if (PatientPDF) {
      try {
        const dbFile = await PatientPDF.findById(report.fileRef).lean();
        if (dbFile && dbFile.data) {
          console.log('✅ [LAB REPORT DOWNLOAD] Found in MongoDB:', dbFile.fileName);
          res.setHeader('Content-Type', dbFile.mimeType || 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${dbFile.fileName}"`);
          res.setHeader('Content-Length', dbFile.data.length);
          return res.send(dbFile.data);
        }
      } catch (err) {
        console.warn('⚠️ [STRATEGY 1] Database check failed:', err.message);
      }
    }

    // STRATEGY 2: Check Local Disk (Multiple predicted paths)
    for (const fPath of searchPaths) {
      try {
        await fs.access(fPath);
        console.log('✅ [LAB REPORT DOWNLOAD] Found on disk:', fPath);
        return res.download(fPath, report.metadata?.originalFilename || path.basename(fPath));
      } catch (e) {
        // Skip to next path
      }
    }

    // STRATEGY 3: Deep Recursive Search (for legacy or unusually placed files)
    try {
      console.log('📁 [STRATEGY 3] Starting deep search in uploads...');
      const medicalDir = path.join(__dirname, '../uploads/medical-reports');
      const allFiles = await fs.readdir(medicalDir, { recursive: true });
      const matchedFile = allFiles.find(f => f.includes(report.fileRef));

      if (matchedFile) {
        const fullPath = path.join(medicalDir, matchedFile);
        console.log('✅ [LAB REPORT DOWNLOAD] Deep search match:', fullPath);
        return res.download(fullPath, report.metadata?.originalFilename || path.basename(fullPath));
      }
    } catch (e) {
      console.warn('⚠️ [STRATEGY 3] Deep search error:', e.message);
    }

    console.error('❌ [LAB REPORT DOWNLOAD] File not found after all strategies:', report.fileRef);
    return res.status(404).json({ success: false, message: 'File not found on server', errorCode: 7015 });
  } catch (err) {
    console.error('❌ [LAB REPORT DOWNLOAD] Global error:', err);
    return res.status(500).json({ success: false, message: 'Internal download error', errorCode: 7016 });
  }
});

module.exports = router;

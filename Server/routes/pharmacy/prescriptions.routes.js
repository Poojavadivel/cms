// routes/pharmacy/prescriptions.routes.js
// Prescription management and PDF generation

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const auth = require('../../Middleware/Auth');
const {
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  Intake,
  Patient,
  User
} = require('../../Models');
const {
  requireAdminOrPharmacist,
  toNumberOrNull,
  maybeNull,
  ensureModel
} = require('./helpers');

/**
 * GET /api/pharmacy/pending-prescriptions
 * Get list of pending prescriptions from intakes
 */
router.get('/pending', auth, async (req, res) => {
  try {
    console.log('📋 [PENDING PRESCRIPTIONS] query:', req.query, 'requestedBy:', req.user?.id);

    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = page * limit;

    // Find intakes with pharmacy items that haven't been dispensed
    const intakes = await Intake.find({
      $or: [
        { 'meta.pharmacyItems': { $exists: true, $ne: [] } },
        { 'meta.pathology': { $exists: true, $ne: [] } }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Intake.countDocuments({
      $or: [
        { 'meta.pharmacyItems': { $exists: true, $ne: [] } },
        { 'meta.pathology': { $exists: true, $ne: [] } }
      ]
    });

    const prescriptions = [];

    // Process each intake
    for (const intake of intakes) {
      if (intake.meta?.pharmacyItems && Array.isArray(intake.meta.pharmacyItems)) {
        try {
          const pharmacyItems = intake.meta.pharmacyItems || [];
          const dispensed = !!intake.meta?.pharmacyId;

          // Get doctor info
          let doctorName = 'Unknown Doctor';
          if (intake.doctorId) {
            const doctor = await User.findById(intake.doctorId).select('firstName lastName').lean();
            if (doctor) {
              doctorName = `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim();
            }
          }

          // Calculate total
          let totalVal = 0;
          for (const item of pharmacyItems) {
            const qty = item.quantity || 0;
            const price = item.unitPrice || item.price || 0;
            totalVal += qty * price;
          }

          prescriptions.push({
            _id: intake._id,
            patientName: `${intake.patientSnapshot?.firstName || ''} ${intake.patientSnapshot?.lastName || ''}`.trim(),
            patientId: intake.patientId,
            patientPhone: intake.patientSnapshot?.phone,
            doctorId: typeof intake.doctorId === 'object' ? intake.doctorId._id : intake.doctorId,
            doctorName: doctorName,
            appointmentId: intake.appointmentId,
            pharmacyItems: pharmacyItems,
            createdAt: intake.createdAt,
            notes: intake.notes || '',
            pharmacyId: intake.meta?.pharmacyId || null,
            paid: false,
            total: totalVal,
            dispensed: dispensed
          });
        } catch (err) {
          console.warn('Error processing pending intake:', intake._id, err.message);
        }
      }
    }

    console.log(`📦 [PENDING PRESCRIPTIONS] returning ${prescriptions.length} prescriptions`);
    return res.status(200).json({
      success: true,
      prescriptions,
      total,
      page,
      limit
    });

  } catch (err) {
    console.error('❌ [PENDING PRESCRIPTIONS] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending prescriptions',
      errorCode: 6512,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/prescriptions
 * Alias for pending prescriptions
 */
router.get('/', auth, async (req, res) => {
  // Redirect to pending prescriptions
  req.url = '/pending';
  return router.handle(req, res);
});

/**
 * DELETE /api/pharmacy/prescriptions/:id
 * Remove prescription (pharmacyItems from intake)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const intakeId = req.params.id;
    console.log('🗑️ [DELETE PRESCRIPTION] intakeId:', intakeId, 'by user:', req.user?.id);

    if (!Intake) {
      return res.status(500).json({
        success: false,
        message: 'Intake model not available',
        errorCode: 7003
      });
    }

    const intake = await Intake.findById(intakeId);
    if (!intake) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
        errorCode: 6513
      });
    }

    // Clear dispensed link if exists
    if (intake.meta?.pharmacyId) {
      console.log('🗑️ [DELETE PRESCRIPTION] Clearing dispensed link for clean start');
      delete intake.meta.pharmacyId;
    }

    // Remove pharmacyItems from meta
    if (!intake.meta) intake.meta = {};
    intake.meta.pharmacyItems = [];
    intake.markModified('meta');
    await intake.save();

    console.log('✅ [DELETE PRESCRIPTION] Deleted prescription for intake:', intakeId);
    return res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });

  } catch (err) {
    console.error('❌ [DELETE PRESCRIPTION] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete prescription',
      errorCode: 6515,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * POST /api/pharmacy/prescriptions/create-from-intake
 * Auto-create prescription from intake and reduce stock
 */
router.post('/create-from-intake', auth, async (req, res) => {
  try {
    console.log('📝 [CREATE PRESCRIPTION] data:', req.body, 'by user:', req.user?.id);

    const data = req.body || {};
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No medicine items provided',
        errorCode: 6210
      });
    }

    const recordItems = [];
    const stockReductions = [];

    // Process each item and reduce stock
    for (const item of items) {
      const medicineId = item.medicineId;
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const price = parseFloat(item.price) || 0;
      const total = quantity * price;

      const itemStockReductions = [];

      // Reduce stock from batches (FEFO - First Expired First Out)
      if (medicineId) {
        const medicine = await Medicine.findById(medicineId);
        if (medicine) {
          const batches = await MedicineBatch.find({
            medicineId: String(medicineId),
            quantity: { $gt: 0 }
          }).sort({ expiryDate: 1 }); // FEFO

          let remainingQty = quantity;

          for (const batch of batches) {
            if (remainingQty <= 0) break;

            const deductQty = Math.min(batch.quantity, remainingQty);
            batch.quantity -= deductQty;
            remainingQty -= deductQty;

            await batch.save();
            
            itemStockReductions.push({
              batchId: batch._id,
              batchNumber: batch.batchNumber,
              deducted: deductQty,
              medicineId: medicineId
            });

            console.log(`✅ Reduced ${deductQty} from batch ${batch.batchNumber}`);
          }

          if (remainingQty > 0) {
            console.warn(`⚠️ Insufficient stock for ${medicine.name}. Short by ${remainingQty} units`);
          }
        }
      }

      stockReductions.push(...itemStockReductions);

      recordItems.push({
        medicineId: medicineId || null,
        name: item.Medicine || item.name || '',
        dosage: item.Dosage || item.dosage || '',
        frequency: item.Frequency || item.frequency || '',
        duration: item.Duration || item.duration || '',
        notes: item.Notes || item.notes || '',
        quantity: quantity,
        unitPrice: price,
        lineTotal: total,
        stockReductions: itemStockReductions
      });
    }

    const grandTotal = recordItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

    // Create pharmacy record
    const pharmacyRecord = await PharmacyRecord.create({
      type: 'Dispense',
      patientId: data.patientId || null,
      appointmentId: data.appointmentId || null,
      createdBy: req.user?.id || '',
      items: recordItems,
      total: grandTotal,
      paid: data.paid || false,
      paymentMethod: data.paymentMethod || 'Cash',
      notes: data.notes || null,
      metadata: {
        intakeId: data.intakeId || null,
        patientName: data.patientName || '',
        stockReduced: true,
        reductions: stockReductions,
        ...(data.metadata || {})
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Link back to intake if ID provided
    if (data.intakeId) {
      try {
        const intake = await Intake.findById(data.intakeId);
        if (intake) {
          intake.meta = intake.meta || {};
          intake.meta.pharmacyId = String(pharmacyRecord._id);
          intake.meta.pharmacyDispensedAt = new Date();
          intake.markModified('meta');
          await intake.save();
          console.log(`✅ Linked PharmacyRecord ${pharmacyRecord._id} to Intake ${data.intakeId}`);
        }
      } catch (linkErr) {
        console.warn('⚠️ Warning: Failed to link prescription to intake:', linkErr.message);
      }
    }

    console.log('✅ [CREATE PRESCRIPTION] Created record:', pharmacyRecord._id, 'Total: ₹', grandTotal);
    console.log('📦 [STOCK REDUCED]', stockReductions.length, 'batch(es) updated');

    return res.status(201).json({
      success: true,
      record: pharmacyRecord,
      stockReductions: stockReductions,
      total: grandTotal
    });

  } catch (err) {
    console.error('❌ [CREATE PRESCRIPTION] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      errorCode: 6514,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * POST /api/pharmacy/prescriptions/:intakeId/dispense
 * Mark prescription as dispensed and create pharmacy record
 */
router.post('/:intakeId/dispense', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    console.log('💊 [DISPENSE PRESCRIPTION] intakeId:', req.params.intakeId, 'by user:', req.user?.id);

    if (!Intake) {
      return res.status(500).json({
        success: false,
        message: 'Intake model not available',
        errorCode: 7002
      });
    }

    const intake = await Intake.findById(req.params.intakeId);
    if (!intake) {
      return res.status(404).json({
        success: false,
        message: 'Intake not found',
        errorCode: 6209
      });
    }

    // Check if already dispensed
    if (intake.meta?.pharmacyId) {
      console.log('⚠️ [DISPENSE PRESCRIPTION] Already dispensed:', intake.meta.pharmacyId);
      return res.status(400).json({
        success: false,
        message: 'Prescription already dispensed',
        errorCode: 6211,
        pharmacyId: intake.meta.pharmacyId
      });
    }

    // Create pharmacy record from request items
    const data = req.body || {};
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided',
        errorCode: 6210
      });
    }

    const recordItems = [];
    const allStockReductions = [];

    for (const item of items) {
      const medicineId = item.medicineId;
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const price = parseFloat(item.unitPrice || item.price || 0);
      const total = quantity * price;

      const stockReductions = [];

      // Reduce stock from batches
      if (medicineId) {
        const medicine = await Medicine.findById(medicineId);
        if (medicine) {
          const batches = await MedicineBatch.find({
            medicineId: String(medicineId),
            quantity: { $gt: 0 }
          }).sort({ expiryDate: 1 }); // FEFO

          let remainingQty = quantity;

          for (const batch of batches) {
            if (remainingQty <= 0) break;

            const deductQty = Math.min(batch.quantity, remainingQty);
            batch.quantity -= deductQty;
            remainingQty -= deductQty;

            await batch.save();
            stockReductions.push({
              batchId: batch._id,
              batchNumber: batch.batchNumber,
              deducted: deductQty
            });
          }

          if (remainingQty > 0) {
            console.warn(`⚠️ Insufficient stock for ${medicine.name}. Short by ${remainingQty} units`);
          }
        }
      }

      allStockReductions.push(...stockReductions);

      recordItems.push({
        medicineId: medicineId || null,
        name: item.name || item.Medicine || '',
        dosage: item.dosage || item.Dosage || '',
        frequency: item.frequency || item.Frequency || '',
        duration: item.duration || item.Duration || '',
        notes: item.notes || item.Notes || '',
        quantity: quantity,
        unitPrice: price,
        lineTotal: total
      });
    }

    const grandTotal = recordItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

    // Create pharmacy record
    const pharmacyRecord = await PharmacyRecord.create({
      type: 'Dispense',
      patientId: intake.patientId || null,
      appointmentId: intake.appointmentId || null,
      createdBy: req.user?.id || '',
      items: recordItems,
      total: grandTotal,
      paid: data.paid || false,
      paymentMethod: data.paymentMethod || 'Cash',
      notes: data.notes || null,
      metadata: {
        intakeId: req.params.intakeId,
        stockReduced: true,
        reductions: allStockReductions
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Mark intake as dispensed
    intake.meta = intake.meta || {};
    intake.meta.pharmacyId = String(pharmacyRecord._id);
    intake.meta.pharmacyDispensedAt = new Date();
    intake.markModified('meta');
    await intake.save();

    console.log('✅ [DISPENSE PRESCRIPTION] Success:', pharmacyRecord._id);

    return res.status(201).json({
      success: true,
      record: pharmacyRecord,
      stockReductions: allStockReductions,
      total: grandTotal
    });

  } catch (err) {
    console.error('❌ [DISPENSE PRESCRIPTION] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispense prescription',
      errorCode: 6516,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/prescriptions/:intakeId/pdf
 * Generate prescription PDF
 */
router.get('/:intakeId/pdf', auth, async (req, res) => {
  try {
    console.log('📄 [PRESCRIPTION PDF] intakeId:', req.params.intakeId);

    if (!Intake) {
      return res.status(500).json({
        success: false,
        message: 'Intake model not available',
        errorCode: 7001
      });
    }

    const intake = await Intake.findById(req.params.intakeId).lean();
    if (!intake) {
      console.log('⚠️ [PRESCRIPTION PDF] Intake not found:', req.params.intakeId);
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
        errorCode: 6515
      });
    }

    // Get pharmacy items
    let items = [];
    let total = 0;
    const pharmacyId = intake.meta?.pharmacyId;

    // If dispensed, get from pharmacy record
    if (pharmacyId) {
      const pharmacyRecord = await PharmacyRecord.findById(String(pharmacyId)).lean();
      if (pharmacyRecord) {
        items = pharmacyRecord.items || [];
        total = pharmacyRecord.total || 0;
      }
    }

    // If not dispensed, get from intake meta
    if (items.length === 0 && intake.meta?.pharmacyItems) {
      console.log('📋 [PRESCRIPTION PDF] Getting items from intake meta (not yet dispensed)');
      items = intake.meta.pharmacyItems;
      items.forEach(item => {
        const qty = item.quantity || 0;
        const price = item.unitPrice || item.price || 0;
        total += qty * price;
      });
    }

    if (items.length === 0) {
      console.log('⚠️ [PRESCRIPTION PDF] No pharmacy items found:', req.params.intakeId);
      return res.status(404).json({
        success: false,
        message: 'No medicines in prescription',
        errorCode: 6518
      });
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const patientName = `${intake.patientSnapshot?.firstName || ''} ${intake.patientSnapshot?.lastName || ''}`.trim() || 'Unknown Patient';
    const filename = `Prescription_${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2563eb')
      .text('PRESCRIPTION', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
      .text('Movi Innovations', { align: 'center' });
    doc.moveDown(1.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
    doc.moveDown(1);

    // Patient Information
    doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold')
      .text('Patient Information', 50, doc.y);
    doc.moveDown(0.5);

    const patientInfoY = doc.y;
    doc.fontSize(10).fillColor('#374151').font('Helvetica')
      .text(`Name: ${patientName}`, 50, patientInfoY)
      .text(`Phone: ${intake.patientSnapshot?.phone || 'N/A'}`, 50, patientInfoY + 15)
      .text(`Patient ID: ${intake.patientId || 'N/A'}`, 50, patientInfoY + 30);

    doc.text(`Date: ${new Date(intake.createdAt).toLocaleDateString()}`, 350, patientInfoY)
      .text(`Time: ${new Date(intake.createdAt).toLocaleTimeString()}`, 350, patientInfoY + 15);

    doc.moveDown(3);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
    doc.moveDown(1);

    // Prescribed Medicines
    doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold')
      .text('Prescribed Medicines', 50, doc.y);
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold');
    doc.rect(50, tableTop, 495, 25).fill('#2563eb');

    doc.fillColor('#ffffff')
      .text('#', 60, tableTop + 8, { width: 30 })
      .text('Medicine', 95, tableTop + 8, { width: 180 })
      .text('Dosage', 280, tableTop + 8, { width: 80 })
      .text('Frequency', 365, tableTop + 8, { width: 80 })
      .text('Qty', 450, tableTop + 8, { width: 40, align: 'center' });

    let yPosition = tableTop + 30;

    items.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(50, yPosition - 5, 495, 25).fill('#f9fafb');
      }

      doc.fontSize(9).fillColor('#374151').font('Helvetica')
        .text(`${index + 1}`, 60, yPosition, { width: 30 })
        .text(item.Medicine || item.name || 'N/A', 95, yPosition, { width: 180 })
        .text(item.Dosage || item.dosage || 'N/A', 280, yPosition, { width: 80 })
        .text(item.Frequency || item.frequency || 'N/A', 365, yPosition, { width: 80 })
        .text(String(item.quantity || 0), 450, yPosition, { width: 40, align: 'center' });

      yPosition += 25;

      // Add notes if present
      const notes = item.Notes || item.notes;
      if (notes) {
        doc.fontSize(8).fillColor('#6b7280').font('Helvetica-Oblique')
          .text(`Note: ${notes}`, 95, yPosition - 20, { width: 395 });
        yPosition += 5;
      }
    });

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
      .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 80, { align: 'center' })
      .text('This is a computer-generated prescription', { align: 'center' });

    doc.end();

    console.log('✅ [PRESCRIPTION PDF] PDF generated successfully');

  } catch (err) {
    console.error('❌ [PRESCRIPTION PDF] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate prescription PDF',
      errorCode: 6517,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;

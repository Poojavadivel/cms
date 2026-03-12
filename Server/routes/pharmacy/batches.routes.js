// routes/pharmacy/batches.routes.js
// Medicine batch/inventory management

const express = require('express');
const router = express.Router();
const auth = require('../../Middleware/Auth');
const {
  Medicine,
  MedicineBatch,
  PharmacyRecord
} = require('../../Models');
const {
  requireAdminOrPharmacist,
  toNumberOrNull,
  maybeNull,
  ensureModel
} = require('./helpers');

/**
 * POST /api/pharmacy/batches
 * Create a new medicine batch (purchase receive)
 */
router.post('/', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    
    console.log('📦 [BATCH CREATE] payload:', req.body, 'by user:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const data = req.body || {};
    if (!data.medicineId || toNumberOrNull(data.quantity) === null) {
      console.log('⚠️ [BATCH CREATE] Missing medicineId or quantity.');
      return res.status(400).json({
        success: false,
        message: 'medicineId and quantity are required',
        errorCode: 6101
      });
    }

    const med = await Medicine.findById(String(data.medicineId));
    if (!med) {
      console.log('⚠️ [BATCH CREATE] Medicine not found:', data.medicineId);
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
        errorCode: 6102
      });
    }

    const batch = await MedicineBatch.create({
      medicineId: String(med._id),
      batchNumber: maybeNull(data.batchNumber) || '',
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      quantity: toNumberOrNull(data.quantity) ?? 0,
      purchasePrice: toNumberOrNull(data.purchasePrice) ?? 0,
      salePrice: toNumberOrNull(data.salePrice) ?? 0,
      supplier: maybeNull(data.supplier) || '',
      location: maybeNull(data.location) || '',
      metadata: data.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log('✅ [BATCH CREATE] created batch:', batch._id, 'medicine:', med._id, 'qty:', batch.quantity);

    // Optionally create a PharmacyRecord for receiving purchase
    if (PharmacyRecord) {
      const record = await PharmacyRecord.create({
        type: 'PurchaseReceive',
        patientId: null,
        appointmentId: null,
        createdBy: req.user?.id || '',
        items: [
          {
            medicineId: med._id,
            batchId: batch._id,
            sku: med.sku,
            name: med.name,
            quantity: batch.quantity,
            unitPrice: batch.purchasePrice || 0,
            taxPercent: med.metadata?.taxPercent ?? 0,
            lineTotal: ((batch.purchasePrice || 0) * (batch.quantity || 0)),
            metadata: {},
          },
        ],
        total: ((batch.purchasePrice || 0) * (batch.quantity || 0)),
        paid: true,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
        metadata: data.meta || {},
        createdAt: Date.now(),
      });
      console.log('✅ [BATCH CREATE] recorded purchase as PharmacyRecord:', record._id);
      return res.status(201).json({
        success: true,
        batch,
        record
      });
    } else {
      return res.status(201).json({
        success: true,
        batch
      });
    }
  } catch (err) {
    console.error('💥 [BATCH CREATE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create batch',
      errorCode: 6505,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/batches
 * List medicine batches with optional filters
 */
router.get('/', auth, async (req, res) => {
  try {
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    
    console.log('📋 [BATCH LIST] query:', req.query, 'requestedBy:', req.user?.id);
    
    const medicineId = (req.query.medicineId || '').toString().trim();
    const expiryBefore = req.query.expiryBefore ? new Date(req.query.expiryBefore) : null;
    const expiryAfter = req.query.expiryAfter ? new Date(req.query.expiryAfter) : null;
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));

    const filter = {};
    if (medicineId) filter.medicineId = String(medicineId);
    if (expiryBefore || expiryAfter) {
      filter.expiryDate = {};
      if (expiryBefore) filter.expiryDate.$lte = expiryBefore;
      if (expiryAfter) filter.expiryDate.$gte = expiryAfter;
    }

    const skip = page * limit;
    const items = await MedicineBatch.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ expiryDate: 1 })
      .lean();
    const total = await MedicineBatch.countDocuments(filter);

    // Populate medicine names
    const medicineIds = [...new Set(items.map(b => b.medicineId).filter(Boolean))];
    const medicines = await Medicine.find({ _id: { $in: medicineIds } })
      .select('_id name')
      .lean();
    const medicineMap = Object.fromEntries(medicines.map(m => [String(m._id), m.name]));

    const enrichedBatches = items.map(batch => ({
      ...batch,
      medicineName: medicineMap[String(batch.medicineId)] || 'Unknown Medicine'
    }));

    console.log(`📦 [BATCH LIST] returning ${enrichedBatches.length} batches (total ${total})`);
    return res.status(200).json({
      success: true,
      batches: enrichedBatches,
      total,
      page,
      limit
    });
  } catch (err) {
    console.error('❌ [BATCH LIST] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch batches',
      errorCode: 6506,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * PUT /api/pharmacy/batches/:id
 * Update batch details (expiry, prices, quantity, etc.)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    
    console.log('✏️ [BATCH UPDATE] id:', req.params.id, 'payload:', req.body, 'by user:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const data = req.body || {};
    const update = { updatedAt: Date.now() };
    
    if (Object.prototype.hasOwnProperty.call(data, 'batchNumber')) {
      update.batchNumber = maybeNull(data.batchNumber);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'expiryDate')) {
      update.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }
    if (Object.prototype.hasOwnProperty.call(data, 'purchasePrice')) {
      update.purchasePrice = toNumberOrNull(data.purchasePrice);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'salePrice')) {
      update.salePrice = toNumberOrNull(data.salePrice);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'supplier')) {
      update.supplier = maybeNull(data.supplier);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'location')) {
      update.location = maybeNull(data.location);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'quantity')) {
      update.quantity = toNumberOrNull(data.quantity) ?? 0;
    }

    const updated = await MedicineBatch.findByIdAndUpdate(
      String(req.params.id),
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.warn('⚠️ [BATCH UPDATE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
        errorCode: 6103
      });
    }

    console.log('✅ [BATCH UPDATE] updated:', updated._id);
    return res.status(200).json({
      success: true,
      batch: updated
    });
  } catch (err) {
    console.error('❌ [BATCH UPDATE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update batch',
      errorCode: 6507,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * DELETE /api/pharmacy/batches/:id
 * Delete a medicine batch
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    
    console.log('🗑️ [BATCH DELETE] id:', req.params.id, 'requestedBy:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const deleted = await MedicineBatch.findByIdAndDelete(String(req.params.id));
    if (!deleted) {
      console.warn('⚠️ [BATCH DELETE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
        errorCode: 6103
      });
    }

    console.log('✅ [BATCH DELETE] deleted:', deleted._id);
    return res.status(200).json({
      success: true,
      message: 'Batch deleted',
      deletedId: deleted._id
    });
  } catch (err) {
    console.error('❌ [BATCH DELETE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete batch',
      errorCode: 6508,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;

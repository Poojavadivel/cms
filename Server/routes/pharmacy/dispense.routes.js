// routes/pharmacy/dispense.routes.js
// Medicine dispensing operations with MongoDB transactions

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../../Middleware/Auth');
const {
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  Patient
} = require('../../Models');
const {
  toNumberOrNull,
  maybeNull,
  ensureModel
} = require('./helpers');

/**
 * POST /api/pharmacy/records/dispense
 * Dispense medicines with automatic stock deduction (transactional)
 * Uses MongoDB transactions to ensure data consistency
 */
router.post('/dispense', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;

    console.log('💊 [DISPENSE] payload:', req.body, 'by user:', req.user?.id);
    
    const data = req.body || {};
    const items = Array.isArray(data.items) ? data.items : [];
    
    if (!items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'No items provided',
        errorCode: 6201
      });
    }

    // Validate patient if provided
    if (data.patientId) {
      const patientExists = await Patient.findById(String(data.patientId)).session(session);
      if (!patientExists) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
          errorCode: 6202
        });
      }
    }

    const recordItems = [];
    let grandTotal = 0;

    // Process each item
    for (const it of items) {
      const medId = String(it.medicineId || '');
      const reqQty = Math.max(0, Number(it.quantity || 0));
      
      if (!medId || reqQty <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Invalid item: medicineId & positive quantity required',
          errorCode: 6203
        });
      }

      if (it.batchId) {
        // Manual batch selection
        const batch = await MedicineBatch.findOne({
          _id: String(it.batchId),
          medicineId: medId
        }).session(session);
        
        if (!batch) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            success: false,
            message: `Batch not found for item`,
            errorCode: 6204
          });
        }
        
        if ((batch.quantity || 0) < reqQty) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Insufficient quantity in batch ${batch._id}`,
            errorCode: 6205
          });
        }

        // Deduct from batch
        batch.quantity = (batch.quantity || 0) - reqQty;
        batch.updatedAt = Date.now();
        await batch.save({ session });

        const med = await Medicine.findById(String(medId)).session(session);
        const unitPrice = toNumberOrNull(it.unitPrice) ?? (batch.salePrice ?? 0);
        const taxPercent = med?.metadata?.taxPercent ?? 0;
        const lineTotal = unitPrice * reqQty;

        recordItems.push({
          medicineId: medId,
          batchId: String(batch._id),
          sku: med?.sku ?? null,
          name: med?.name ?? null,
          quantity: reqQty,
          unitPrice,
          taxPercent,
          lineTotal,
          metadata: it.metadata || {},
        });
        grandTotal += lineTotal;
        
      } else {
        // Auto-pick batches using FEFO (First Expired, First Out)
        let remaining = reqQty;
        const candidateBatches = await MedicineBatch.find({
          medicineId: medId,
          quantity: { $gt: 0 }
        })
          .sort({ expiryDate: 1, createdAt: 1 })
          .session(session);

        if (!candidateBatches || candidateBatches.length === 0) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `No available batches for medicine ${medId}`,
            errorCode: 6206
          });
        }

        const med = await Medicine.findById(String(medId)).session(session);
        const unitPriceFallback = candidateBatches[0].salePrice ?? 0;
        const taxPercent = med?.metadata?.taxPercent ?? 0;

        // Process batches in FEFO order
        for (const batch of candidateBatches) {
          if (remaining <= 0) break;
          
          const useQty = Math.min(remaining, batch.quantity || 0);
          if (useQty <= 0) continue;
          
          batch.quantity = (batch.quantity || 0) - useQty;
          batch.updatedAt = Date.now();
          await batch.save({ session });

          const unitPrice = toNumberOrNull(it.unitPrice) ?? (batch.salePrice ?? unitPriceFallback);
          const lineTotal = unitPrice * useQty;
          
          recordItems.push({
            medicineId: medId,
            batchId: String(batch._id),
            sku: med?.sku ?? null,
            name: med?.name ?? null,
            quantity: useQty,
            unitPrice,
            taxPercent,
            lineTotal,
            metadata: it.metadata || {},
          });
          
          grandTotal += lineTotal;
          remaining -= useQty;
        }

        if (remaining > 0) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock to fulfill medicine ${medId}`,
            errorCode: 6207
          });
        }
      }
    }

    // Create pharmacy record
    const createdRecords = await PharmacyRecord.create([{
      type: 'Dispense',
      patientId: maybeNull(data.patientId) || null,
      appointmentId: maybeNull(data.appointmentId) || null,
      createdBy: req.user?.id || '',
      items: recordItems,
      total: grandTotal,
      paid: data.paid === true,
      paymentMethod: maybeNull(data.paymentMethod) || null,
      notes: maybeNull(data.notes) || null,
      metadata: data.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }], { session });

    await session.commitTransaction();
    session.endSession();

    console.log('✅ [DISPENSE] Dispense completed, record id:', createdRecords[0]._id);
    return res.status(201).json({
      success: true,
      record: createdRecords[0]
    });
    
  } catch (err) {
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (e) {
      // Ignore abort errors
    }
    
    console.error('💥 [DISPENSE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispense items',
      errorCode: 6509,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/records
 * List pharmacy records with filters
 */
router.get('/', auth, async (req, res) => {
  try {
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;
    
    console.log('📋 [RECORDS LIST] query:', req.query, 'requestedBy:', req.user?.id);
    
    const q = (req.query.q || '').toString().trim();
    const patientId = (req.query.patientId || '').toString().trim();
    const type = (req.query.type || '').toString().trim();
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    
    const filter = {};

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { 'items.name': regex },
        { notes: regex }
      ];
    }
    if (patientId) filter.patientId = String(patientId);
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const skip = page * limit;
    const items = await PharmacyRecord.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    const total = await PharmacyRecord.countDocuments(filter);

    console.log(`📦 [RECORDS LIST] returning ${items.length} records (total ${total})`);
    return res.status(200).json({
      success: true,
      records: items,
      total,
      page,
      limit
    });
    
  } catch (err) {
    console.error('❌ [RECORDS LIST] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch records',
      errorCode: 6510,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/records/:id
 * Get pharmacy record by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;
    
    console.log('🔎 [RECORD GET] id:', req.params.id, 'requestedBy:', req.user?.id);
    
    const record = await PharmacyRecord.findById(req.params.id).lean();
    
    if (!record) {
      console.warn('⚠️ [RECORD GET] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        errorCode: 6511
      });
    }

    console.log('✅ [RECORD GET] Found record:', record._id);
    return res.status(200).json({
      success: true,
      record
    });
    
  } catch (err) {
    console.error('❌ [RECORD GET] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch record',
      errorCode: 6511,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;

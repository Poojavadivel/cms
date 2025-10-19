// routes/pharmacy.js
const express = require('express');
const router = express.Router();
const auth = require('../Middleware/Auth');
const mongoose = require('mongoose');

// Use the models file you provided earlier (models_core.js)
const {
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  Patient,
  Appointment
} = require('../Models');

function requireAdminOrPharmacist(req, res) {
  const role = req.user && req.user.role;
  if (!role || (role !== 'admin' && role !== 'pharmacist' && role !== 'superadmin')) {
    console.log('⛔ [AUTH] Access denied. Required role admin/pharmacist. User role:', role, 'userId:', req.user?.id);
    res.status(403).json({
      success: false,
      message: 'Forbidden: admin/pharmacist role required',
      errorCode: 6002,
    });
    return false;
  }
  return true;
}

const toNumberOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const maybeNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
};

function ensureModel(model, name, res) {
  if (!model) {
    console.error(`❌ [MODEL MISSING] ${name} is undefined. Check exports in Models/models_core and require path.`);
    if (res) {
      res.status(500).json({ success: false, message: `Server misconfiguration: ${name} model not available`, errorCode: 7001 });
    }
    return false;
  }
  return true;
}

/**
 * ------------------
 * MEDICINES
 * ------------------
 */

// CREATE Medicine
router.post('/medicines', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    console.log('📩 [MEDICINE CREATE] Incoming payload:', req.body, 'by user:', req.user?.id);
    const data = req.body || {};
    if (!data.name) {
      console.log('⚠️ [MEDICINE CREATE] Missing name in payload.');
      return res.status(400).json({
        success: false,
        message: 'Missing required field: name',
        errorCode: 6001,
      });
    }

    // If SKU is provided, try to avoid duplicates. SKU is optional in your schema.
    if (data.sku) {
      const exists = await Medicine.findOne({ sku: data.sku }).lean();
      if (exists) {
        console.log('⚠️ [MEDICINE CREATE] Duplicate SKU attempt:', data.sku);
        return res.status(409).json({
          success: false,
          message: 'Medicine with this SKU already exists',
          errorCode: 6003,
        });
      }
    }

    const med = await Medicine.create({
      name: data.name,
      genericName: maybeNull(data.genericName),
      sku: maybeNull(data.sku),
      form: maybeNull(data.form) || 'Tablet',
      strength: maybeNull(data.strength) || '',
      unit: maybeNull(data.unit) || 'pcs',
      manufacturer: maybeNull(data.manufacturer) || '',
      brand: maybeNull(data.brand) || '',
      category: maybeNull(data.category) || '',
      description: maybeNull(data.description) || '',
      status: data.status || 'In Stock',
      metadata: data.metadata || {},
      deleted_at: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log('✅ [MEDICINE CREATE] Created medicine:', med._id, med.name);
    return res.status(201).json(med);
  } catch (err) {
    console.error('💥 [MEDICINE CREATE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create medicine',
      errorCode: 6500,
    });
  }
});

// LIST Medicines
router.get('/medicines', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    console.log('📥 [PHARMACY MEDICINES] query:', req.query, 'requestedBy:', req.user?.id);
    const q = (req.query.q || '').toString().trim();
    const category = (req.query.category || '').toString().trim();
    const lowStock = String(req.query.lowStock || '').trim() === '1';
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const wantMeta = String(req.query.meta || '').trim() === '1';

    const filter = {};
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { sku: re }, { brand: re }];
    }
    if (category) filter.category = category;

    const skip = page * limit;
    let items = await Medicine.find(filter).skip(skip).limit(limit).lean();
    const total = await Medicine.countDocuments(filter);

    // If MedicineBatch model missing, skip batch/stock enrichment but log it
    if (!MedicineBatch) {
      console.warn('⚠️ [PHARMACY MEDICINES] MedicineBatch model not available - skipping stock calculations.');
      if (wantMeta) {
        return res.status(200).json({ success: true, medicines: items, total, page, limit });
      }
      return res.status(200).json(items);
    }

    // get all medicineIds as strings
    const medIds = items.map((m) => String(m._id)).filter(Boolean);

    if (lowStock) {
      console.log('🔎 [PHARMACY MEDICINES] Low-stock filter active.');
      if (medIds.length === 0) {
        items = [];
      } else {
        // aggregate batch quantities grouped by medicineId (medicineId is a string)
        const agg = await MedicineBatch.aggregate([
          { $match: { medicineId: { $in: medIds } } },
          { $group: { _id: '$medicineId', qty: { $sum: '$quantity' } } },
        ]);

        const qtyMap = {};
        agg.forEach((a) => { qtyMap[String(a._id)] = a.qty; });

        items = items.filter((m) => {
          const stock = qtyMap[String(m._id)] ?? 0;
          const reorder = m.reorderLevel ?? 0;
          return stock <= reorder;
        });

        console.log(`🔔 [PHARMACY MEDICINES] lowStock filtered results: ${items.length}`);
      }
    } else {
      if (medIds.length > 0) {
        const agg = await MedicineBatch.aggregate([
          { $match: { medicineId: { $in: medIds } } },
          { $group: { _id: '$medicineId', qty: { $sum: '$quantity' } } },
        ]);
        const qtyMap = {};
        agg.forEach((a) => { qtyMap[String(a._id)] = a.qty; });
        items = items.map((m) => ({ ...m, availableQty: qtyMap[String(m._id)] ?? 0 }));
      }
      console.log(`📦 [PHARMACY MEDICINES] returning ${items.length} medicines (page ${page}, limit ${limit})`);
    }

    if (wantMeta) {
      return res.status(200).json({
        success: true,
        medicines: items,
        total,
        page,
        limit,
      });
    }

    return res.status(200).json(items);
  } catch (err) {
    console.error('❌ [PHARMACY MEDICINES] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medicines',
      errorCode: 6501,
    });
  }
});

// GET Medicine by ID
router.get('/medicines/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    console.log('🔎 [MEDICINE GET] id:', req.params.id, 'requestedBy:', req.user?.id);
    const wantMeta = String(req.query.meta || '').trim() === '1';
    const med = await Medicine.findById(req.params.id).lean();
    if (!med) {
      console.warn('⚠️ [MEDICINE GET] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Medicine not found', errorCode: 6007 });
    }

    if (!MedicineBatch) {
      med.batches = [];
      med.availableQty = 0;
    } else {
      const batches = await MedicineBatch.find({ medicineId: String(med._id) }).lean();
      med.batches = batches;
      med.availableQty = batches.reduce((s, b) => s + (b.quantity || 0), 0);
    }

    console.log('✅ [MEDICINE GET] Found medicine:', med._id, 'availableQty:', med.availableQty);
    if (wantMeta) return res.status(200).json({ success: true, medicine: med });
    return res.status(200).json(med);
  } catch (err) {
    console.error('❌ [MEDICINE GET] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch medicine', errorCode: 6502 });
  }
});

// UPDATE Medicine
router.put('/medicines/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    console.log('✏️ [MEDICINE UPDATE] id:', req.params.id, 'payload:', req.body, 'by user:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const data = req.body || {};
    const update = { updatedAt: Date.now() };

    if (Object.prototype.hasOwnProperty.call(data, 'name')) update.name = maybeNull(data.name);
    if (Object.prototype.hasOwnProperty.call(data, 'genericName')) update.genericName = maybeNull(data.genericName);
    if (Object.prototype.hasOwnProperty.call(data, 'brand')) update.brand = maybeNull(data.brand);
    if (Object.prototype.hasOwnProperty.call(data, 'description')) update.description = maybeNull(data.description);
    if (Object.prototype.hasOwnProperty.call(data, 'category')) update.category = maybeNull(data.category);
    if (Object.prototype.hasOwnProperty.call(data, 'unit')) update.unit = maybeNull(data.unit);
    if (Object.prototype.hasOwnProperty.call(data, 'status')) update.status = maybeNull(data.status);
    if (Object.prototype.hasOwnProperty.call(data, 'reorderLevel')) update.reorderLevel = toNumberOrNull(data.reorderLevel) ?? 0;

    const updated = await Medicine.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!updated) {
      console.warn('⚠️ [MEDICINE UPDATE] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Medicine not found', errorCode: 6007 });
    }

    console.log('✅ [MEDICINE UPDATE] updated:', updated._id);
    return res.status(200).json({ success: true, medicine: updated });
  } catch (err) {
    console.error('❌ [MEDICINE UPDATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update medicine', errorCode: 6503 });
  }
});

// DELETE Medicine
router.delete('/medicines/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;
    console.log('🗑️ [MEDICINE DELETE] id:', req.params.id, 'requestedBy:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const batchesCount = await MedicineBatch.countDocuments({ medicineId: String(req.params.id) });
    const recordsCount = await PharmacyRecord.countDocuments({ 'items.medicineId': String(req.params.id) });

    if (batchesCount > 0 || recordsCount > 0) {
      console.log('⚠️ [MEDICINE DELETE] Prevent delete: batchesCount=', batchesCount, 'recordsCount=', recordsCount);
      return res.status(400).json({
        success: false,
        message: 'Cannot delete medicine with existing batches or records. Archive it instead.',
        errorCode: 6004,
      });
    }

    const deleted = await Medicine.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.warn('⚠️ [MEDICINE DELETE] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Medicine not found', errorCode: 6007 });
    }

    console.log('✅ [MEDICINE DELETE] deleted:', deleted._id, deleted.name);
    return res.status(200).json({ success: true, message: 'Medicine deleted successfully', deletedId: deleted._id });
  } catch (err) {
    console.error('❌ [MEDICINE DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete medicine', errorCode: 6504 });
  }
});

/**
 * ------------------
 * BATCHES
 * ------------------
 */

// CREATE Batch
router.post('/batches', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    console.log('📩 [BATCH CREATE] payload:', req.body, 'by user:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const data = req.body || {};
    if (!data.medicineId || toNumberOrNull(data.quantity) === null) {
      console.log('⚠️ [BATCH CREATE] Missing medicineId or quantity.');
      return res.status(400).json({ success: false, message: 'medicineId and quantity are required', errorCode: 6101 });
    }

    const med = await Medicine.findById(String(data.medicineId));
    if (!med) {
      console.log('⚠️ [BATCH CREATE] Medicine not found:', data.medicineId);
      return res.status(404).json({ success: false, message: 'Medicine not found', errorCode: 6102 });
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
      return res.status(201).json({ success: true, batch, record });
    } else {
      return res.status(201).json({ success: true, batch });
    }
  } catch (err) {
    console.error('💥 [BATCH CREATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create batch', errorCode: 6505 });
  }
});

// LIST Batches
router.get('/batches', auth, async (req, res) => {
  try {
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    console.log('📥 [BATCH LIST] query:', req.query, 'requestedBy:', req.user?.id);
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
    const items = await MedicineBatch.find(filter).skip(skip).limit(limit).sort({ expiryDate: 1 }).lean();
    const total = await MedicineBatch.countDocuments(filter);

    console.log(`📦 [BATCH LIST] returning ${items.length} batches (total ${total})`);
    return res.status(200).json({ success: true, batches: items, total, page, limit });
  } catch (err) {
    console.error('❌ [BATCH LIST] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch batches', errorCode: 6506 });
  }
});

// UPDATE Batch
router.put('/batches/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    console.log('✏️ [BATCH UPDATE] id:', req.params.id, 'payload:', req.body, 'by user:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const data = req.body || {};
    const update = { updatedAt: Date.now() };
    if (Object.prototype.hasOwnProperty.call(data, 'batchNumber')) update.batchNumber = maybeNull(data.batchNumber);
    if (Object.prototype.hasOwnProperty.call(data, 'expiryDate')) update.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (Object.prototype.hasOwnProperty.call(data, 'purchasePrice')) update.purchasePrice = toNumberOrNull(data.purchasePrice);
    if (Object.prototype.hasOwnProperty.call(data, 'salePrice')) update.salePrice = toNumberOrNull(data.salePrice);
    if (Object.prototype.hasOwnProperty.call(data, 'supplier')) update.supplier = maybeNull(data.supplier);
    if (Object.prototype.hasOwnProperty.call(data, 'location')) update.location = maybeNull(data.location);
    if (Object.prototype.hasOwnProperty.call(data, 'quantity')) update.quantity = toNumberOrNull(data.quantity) ?? 0;

    const updated = await MedicineBatch.findByIdAndUpdate(String(req.params.id), update, { new: true, runValidators: true });
    if (!updated) {
      console.warn('⚠️ [BATCH UPDATE] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Batch not found', errorCode: 6103 });
    }

    console.log('✅ [BATCH UPDATE] updated:', updated._id);
    return res.status(200).json({ success: true, batch: updated });
  } catch (err) {
    console.error('❌ [BATCH UPDATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update batch', errorCode: 6507 });
  }
});

// DELETE Batch
router.delete('/batches/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    console.log('🗑️ [BATCH DELETE] id:', req.params.id, 'requestedBy:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const deleted = await MedicineBatch.findByIdAndDelete(String(req.params.id));
    if (!deleted) {
      console.warn('⚠️ [BATCH DELETE] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Batch not found', errorCode: 6103 });
    }

    console.log('✅ [BATCH DELETE] deleted:', deleted._id);
    return res.status(200).json({ success: true, message: 'Batch deleted', deletedId: deleted._id });
  } catch (err) {
    console.error('❌ [BATCH DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete batch', errorCode: 6508 });
  }
});

/**
 * ------------------
 * DISPENSE (transactional)
 * ------------------
 */
router.post('/records/dispense', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;

    console.log('📩 [DISPENSE] payload:', req.body, 'by user:', req.user?.id);
    const data = req.body || {};
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'No items provided', errorCode: 6201 });
    }

    if (data.patientId) {
      const patientExists = await Patient.findById(String(data.patientId)).session(session);
      if (!patientExists) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 6202 });
      }
    }

    const recordItems = [];
    let grandTotal = 0;

    for (const it of items) {
      const medId = String(it.medicineId || '');
      const reqQty = Math.max(0, Number(it.quantity || 0));
      if (!medId || reqQty <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Invalid item: medicineId & positive quantity required', errorCode: 6203 });
      }

      if (it.batchId) {
        const batch = await MedicineBatch.findOne({ _id: String(it.batchId), medicineId: medId }).session(session);
        if (!batch) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ success: false, message: `Batch not found for item`, errorCode: 6204 });
        }
        if ((batch.quantity || 0) < reqQty) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: `Insufficient quantity in batch ${batch._id}`, errorCode: 6205 });
        }

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
        // auto-pick batches (FEFO)
        let remaining = reqQty;
        const candidateBatches = await MedicineBatch.find({ medicineId: medId, quantity: { $gt: 0 } })
          .sort({ expiryDate: 1, createdAt: 1 })
          .session(session);

        if (!candidateBatches || candidateBatches.length === 0) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: `No available batches for medicine ${medId}`, errorCode: 6206 });
        }

        const med = await Medicine.findById(String(medId)).session(session);
        const unitPriceFallback = candidateBatches[0].salePrice ?? 0;
        const taxPercent = med?.metadata?.taxPercent ?? 0;

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
          return res.status(400).json({ success: false, message: `Insufficient stock to fulfill medicine ${medId}`, errorCode: 6207 });
        }
      }
    } // end for items

    // create pharmacy record
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
    return res.status(201).json({ success: true, record: createdRecords[0] });
  } catch (err) {
    try { await session.abortTransaction(); session.endSession(); } catch (e) { /* ignore */ }
    console.error('💥 [DISPENSE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispense items', errorCode: 6509 });
  }
});

/**
 * ------------------
 * PHARMACY RECORDS
 * ------------------
 */

// LIST Pharmacy Records
router.get('/records', auth, async (req, res) => {
  try {
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;
    console.log('📥 [RECORDS LIST] query:', req.query, 'requestedBy:', req.user?.id);
    const q = (req.query.q || '').toString().trim();
    const patientId = (req.query.patientId || '').toString().trim();
    const type = (req.query.type || '').toString().trim();
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const filter = {};

    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ 'items.name': re }, { notes: re }];
    }
    if (patientId) filter.patientId = String(patientId);
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const skip = page * limit;
    const items = await PharmacyRecord.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean();
    const total = await PharmacyRecord.countDocuments(filter);

    console.log(`📦 [RECORDS LIST] returning ${items.length} records (total ${total})`);
    return res.status(200).json({ success: true, records: items, total, page, limit });
  } catch (err) {
    console.error('❌ [RECORDS LIST] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch records', errorCode: 6510 });
  }
});

// GET Record by ID
router.get('/records/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;
    console.log('🔎 [RECORD GET] id:', req.params.id, 'requestedBy:', req.user?.id);
    const rec = await PharmacyRecord.findById(String(req.params.id)).lean();
    if (!rec) {
      console.warn('⚠️ [RECORD GET] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Record not found', errorCode: 6208 });
    }
    console.log('✅ [RECORD GET] found record:', rec._id);
    return res.status(200).json({ success: true, record: rec });
  } catch (err) {
    console.error('❌ [RECORD GET] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch record', errorCode: 6511 });
  }
});

module.exports = router;

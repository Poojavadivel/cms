// routes/pharmacy.js
const express = require('express');
const router = express.Router();
const auth = require('../Middleware/Auth');
const mongoose = require('mongoose');

// single models import - adjust path if your models file is elsewhere
const models = require('../Models/models');

// Defensive extraction with helpful console logs
const Medicine = models && models.Medicine;
const MedicineBatch = models && models.MedicineBatch;
const PharmacyRecord = models && models.PharmacyRecord;
const Patient = models && models.Patient;

function requireAdmin(req, res) {
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

// Utility: ensure a model exists and respond with helpful error if not.
function ensureModel(model, name, res) {
  if (!model) {
    console.error(`❌ [MODEL MISSING] ${name} is undefined. Check exports in Models/models.js and require path.`);
    if (res) {
      res.status(500).json({ success: false, message: `Server misconfiguration: ${name} model not available`, errorCode: 7001 });
    }
    return false;
  }
  return true;
}

// Utility: normalize array of ids into ObjectId list (handles strings and ObjectId)
function normalizeIdsToObjectIds(arr) {
  return arr
    .filter(Boolean)
    .map((id) => {
      try {
        // If it's already an ObjectId instance, return as-is
        if (id instanceof mongoose.Types.ObjectId) return id;
        // try converting string/hex to ObjectId
        return mongoose.Types.ObjectId(id);
      } catch (_) {
        // fallback: skip invalid ids
        return null;
      }
    })
    .filter(Boolean);
}

// ------------------ ROUTES ------------------

// CREATE Medicine
router.post('/medicines', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    console.log('📩 [MEDICINE CREATE] Incoming payload:', req.body, 'by user:', req.user?.id);
    const data = req.body || {};
    if (!data.sku || !data.name) {
      console.log('⚠️ [MEDICINE CREATE] Missing sku or name in payload.');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sku, name',
        errorCode: 6001,
      });
    }

    const exists = await Medicine.findOne({ sku: data.sku }).lean();
    if (exists) {
      console.log('⚠️ [MEDICINE CREATE] Duplicate SKU attempt:', data.sku);
      return res.status(409).json({
        success: false,
        message: 'Medicine with this SKU already exists',
        errorCode: 6003,
      });
    }

    const med = await Medicine.create({
      sku: data.sku,
      name: data.name,
      brand: maybeNull(data.brand),
      description: maybeNull(data.description),
      category: maybeNull(data.category),
      units: maybeNull(data.units) || 'tablet',
      taxPercent: toNumberOrNull(data.taxPercent) ?? 0,
      reorderLevel: toNumberOrNull(data.reorderLevel) ?? 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log('✅ [MEDICINE CREATE] Created medicine:', med._id, med.sku);
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
      console.log(`📦 [PHARMACY MEDICINES] returning ${items.length} medicines (page ${page}, limit ${limit})`);
      if (wantMeta) {
        return res.status(200).json({ success: true, medicines: items, total, page, limit });
      }
      return res.status(200).json(items);
    }

    // convert medIds robustly (handles both ObjectId and string)
    const medIds = items.map((m) => m._id).filter(Boolean);
    const medObjectIds = normalizeIdsToObjectIds(medIds);

    if (lowStock) {
      console.log('🔎 [PHARMACY MEDICINES] Low-stock filter active.');
      if (medObjectIds.length === 0) {
        // nothing to check
        items = [];
      } else {
        // prefer aggregate if available
        let agg = null;
        if (typeof MedicineBatch.aggregate === 'function') {
          agg = await MedicineBatch.aggregate([
            { $match: { medicineId: { $in: medObjectIds } } },
            { $group: { _id: '$medicineId', qty: { $sum: '$quantity' } } },
          ]);
        } else {
          // fallback to grouping with find()
          const batches = await MedicineBatch.find({ medicineId: { $in: medObjectIds } }).lean();
          const map = {};
          batches.forEach(b => { const mid = (b.medicineId || '').toString(); map[mid] = (map[mid] || 0) + (b.quantity || 0); });
          agg = Object.keys(map).map(k => ({ _id: mongoose.Types.ObjectId(k), qty: map[k] }));
        }

        const qtyMap = {};
        agg.forEach((a) => { qtyMap[a._id.toString()] = a.qty; });

        items = items.filter((m) => {
          const stock = qtyMap[(m._id || '').toString()] ?? 0;
          const reorder = m.reorderLevel ?? 0;
          return stock <= reorder;
        });

        console.log(`🔔 [PHARMACY MEDICINES] lowStock filtered results: ${items.length}`);
      }
    } else {
      // normal path: enrich items with availableQty if any batches
      if (medObjectIds.length > 0) {
        let agg = null;
        if (typeof MedicineBatch.aggregate === 'function') {
          agg = await MedicineBatch.aggregate([
            { $match: { medicineId: { $in: medObjectIds } } },
            { $group: { _id: '$medicineId', qty: { $sum: '$quantity' } } },
          ]);
        } else {
          const batches = await MedicineBatch.find({ medicineId: { $in: medObjectIds } }).lean();
          const map = {};
          batches.forEach(b => { const mid = (b.medicineId || '').toString(); map[mid] = (map[mid] || 0) + (b.quantity || 0); });
          agg = Object.keys(map).map(k => ({ _id: mongoose.Types.ObjectId(k), qty: map[k] }));
        }

        const qtyMap = {};
        agg.forEach((a) => { qtyMap[a._id.toString()] = a.qty; });
        items = items.map((m) => ({ ...m, availableQty: qtyMap[(m._id || '').toString()] ?? 0 }));
      }

      console.log(`📦 [PHARMACY MEDICINES] returning ${items.length} medicines (page ${page}, limit ${limit})`);
    }

    if (wantMeta) {
      console.log('📣 [PHARMACY MEDICINES] returning meta wrapper, total:', total);
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

    // If MedicineBatch model missing, just return medicine without batches
    if (!MedicineBatch) {
      med.batches = [];
      med.availableQty = 0;
    } else {
      const batches = await MedicineBatch.find({ medicineId: med._id }).lean();
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
    if (!requireAdmin(req, res)) return;

    const data = req.body || {};
    const update = { updatedAt: Date.now() };

    if (Object.prototype.hasOwnProperty.call(data, 'name')) update.name = maybeNull(data.name);
    if (Object.prototype.hasOwnProperty.call(data, 'brand')) update.brand = maybeNull(data.brand);
    if (Object.prototype.hasOwnProperty.call(data, 'description')) update.description = maybeNull(data.description);
    if (Object.prototype.hasOwnProperty.call(data, 'category')) update.category = maybeNull(data.category);
    if (Object.prototype.hasOwnProperty.call(data, 'units')) update.units = maybeNull(data.units);
    if (Object.prototype.hasOwnProperty.call(data, 'taxPercent')) update.taxPercent = toNumberOrNull(data.taxPercent) ?? 0;
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
    if (!requireAdmin(req, res)) return;

    const batchesCount = await MedicineBatch.countDocuments({ medicineId: req.params.id });
    const recordsCount = await PharmacyRecord.countDocuments({ 'items.medicineId': req.params.id });

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

    console.log('✅ [MEDICINE DELETE] deleted:', deleted._id, deleted.sku);
    return res.status(200).json({ success: true, message: 'Medicine deleted successfully', deletedId: deleted._id });
  } catch (err) {
    console.error('❌ [MEDICINE DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete medicine', errorCode: 6504 });
  }
});

// CREATE Batch
router.post('/batches', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    console.log('📩 [BATCH CREATE] payload:', req.body, 'by user:', req.user?.id);
    if (!requireAdmin(req, res)) return;

    const data = req.body || {};
    if (!data.medicineId || toNumberOrNull(data.quantity) === null) {
      console.log('⚠️ [BATCH CREATE] Missing medicineId or quantity.');
      return res.status(400).json({ success: false, message: 'medicineId and quantity are required', errorCode: 6101 });
    }

    const med = await Medicine.findById(data.medicineId);
    if (!med) {
      console.log('⚠️ [BATCH CREATE] Medicine not found:', data.medicineId);
      return res.status(404).json({ success: false, message: 'Medicine not found', errorCode: 6102 });
    }

    const batch = await MedicineBatch.create({
      medicineId: med._id,
      batchNumber: maybeNull(data.batchNumber) || undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      quantity: toNumberOrNull(data.quantity) ?? 0,
      purchasePrice: toNumberOrNull(data.purchasePrice),
      salePrice: toNumberOrNull(data.salePrice),
      supplier: maybeNull(data.supplier),
      location: maybeNull(data.location),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log('✅ [BATCH CREATE] created batch:', batch._id, 'medicine:', med._id, 'qty:', batch.quantity);

    // create a PharmacyRecord if PharmacyRecord model exists
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
            taxPercent: med.taxPercent || 0,
            lineTotal: ((batch.purchasePrice || 0) * (batch.quantity || 0)),
          },
        ],
        total: ((batch.purchasePrice || 0) * (batch.quantity || 0)),
        paid: true,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
        createdAt: Date.now(),
      });
      console.log('✅ [BATCH CREATE] recorded purchase as PharmacyRecord:', record._id);
      return res.status(201).json({ success: true, batch, record });
    } else {
      console.log('⚠️ [BATCH CREATE] PharmacyRecord model missing - batch created without record.');
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
    if (medicineId) {
      try {
        filter.medicineId = mongoose.Types.ObjectId(medicineId);
      } catch (_) {
        filter.medicineId = medicineId; // fallback if not convertible
      }
    }
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
    if (!requireAdmin(req, res)) return;

    const data = req.body || {};
    const update = { updatedAt: Date.now() };
    if (Object.prototype.hasOwnProperty.call(data, 'batchNumber')) update.batchNumber = maybeNull(data.batchNumber);
    if (Object.prototype.hasOwnProperty.call(data, 'expiryDate')) update.expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    if (Object.prototype.hasOwnProperty.call(data, 'purchasePrice')) update.purchasePrice = toNumberOrNull(data.purchasePrice);
    if (Object.prototype.hasOwnProperty.call(data, 'salePrice')) update.salePrice = toNumberOrNull(data.salePrice);
    if (Object.prototype.hasOwnProperty.call(data, 'supplier')) update.supplier = maybeNull(data.supplier);
    if (Object.prototype.hasOwnProperty.call(data, 'location')) update.location = maybeNull(data.location);
    if (Object.prototype.hasOwnProperty.call(data, 'quantity')) update.quantity = toNumberOrNull(data.quantity) ?? 0;

    const updated = await MedicineBatch.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
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
    if (!requireAdmin(req, res)) return;

    const deleted = await MedicineBatch.findByIdAndDelete(req.params.id);
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

// DISPENSE (records/transactional)
router.post('/records/dispense', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;
    if (!ensureModel(Patient, 'Patient', res) && req.body.patientId) return;

    console.log('📩 [DISPENSE] payload:', req.body, 'by user:', req.user?.id);
    const data = req.body || {};
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      console.log('⚠️ [DISPENSE] No items provided.');
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'No items provided', errorCode: 6201 });
    }

    if (data.patientId) {
      const patientExists = await Patient.findById(data.patientId).session(session);
      if (!patientExists) {
        console.log('⚠️ [DISPENSE] Patient not found:', data.patientId);
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 6202 });
      }
    }

    const recordItems = [];
    let grandTotal = 0;

    for (const it of items) {
      const medId = it.medicineId;
      const reqQty = Math.max(0, Number(it.quantity || 0));
      if (!medId || reqQty <= 0) {
        console.log('⚠️ [DISPENSE] Invalid item:', it);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Invalid item: medicineId & positive quantity required', errorCode: 6203 });
      }

      if (it.batchId) {
        console.log('🔁 [DISPENSE] Dispensing from specific batch:', it.batchId, 'medicine:', medId, 'qty:', reqQty);
        const batch = await MedicineBatch.findOne({ _id: it.batchId, medicineId: medId }).session(session);
        if (!batch) {
          console.log('⚠️ [DISPENSE] Batch not found for item:', it.batchId);
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ success: false, message: `Batch not found for item`, errorCode: 6204 });
        }
        if (batch.quantity < reqQty) {
          console.log('⚠️ [DISPENSE] Insufficient quantity in batch. available:', batch.quantity, 'requested:', reqQty);
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: `Insufficient quantity in batch ${batch._id}`, errorCode: 6205 });
        }

        batch.quantity = batch.quantity - reqQty;
        batch.updatedAt = Date.now();
        await batch.save({ session });

        const med = await Medicine.findById(medId).session(session);
        const unitPrice = toNumberOrNull(it.unitPrice) ?? (batch.salePrice ?? 0);
        const taxPercent = med?.taxPercent ?? 0;
        const lineTotal = (unitPrice * reqQty);

        recordItems.push({
          medicineId: medId,
          batchId: batch._id,
          sku: med?.sku ?? null,
          name: med?.name ?? null,
          quantity: reqQty,
          unitPrice,
          taxPercent,
          lineTotal,
        });
        grandTotal += lineTotal;
      } else {
        console.log('🔎 [DISPENSE] Auto-picking batches for medicine:', medId, 'qty:', reqQty);
        let remaining = reqQty;
        const candidateBatches = await MedicineBatch.find({ medicineId: medId, quantity: { $gt: 0 } })
          .sort({ expiryDate: 1, createdAt: 1 }).session(session);

        if (!candidateBatches || candidateBatches.length === 0) {
          console.log('⚠️ [DISPENSE] No available batches for medicine:', medId);
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: `No available batches for medicine ${medId}`, errorCode: 6206 });
        }

        const med = await Medicine.findById(medId).session(session);
        const unitPriceFallback = candidateBatches[0].salePrice ?? 0;
        const taxPercent = med?.taxPercent ?? 0;

        for (const batch of candidateBatches) {
          if (remaining <= 0) break;
          const useQty = Math.min(remaining, batch.quantity);
          batch.quantity = batch.quantity - useQty;
          batch.updatedAt = Date.now();
          await batch.save({ session });

          const unitPrice = toNumberOrNull(it.unitPrice) ?? (batch.salePrice ?? unitPriceFallback);
          const lineTotal = unitPrice * useQty;
          recordItems.push({
            medicineId: medId,
            batchId: batch._id,
            sku: med?.sku ?? null,
            name: med?.name ?? null,
            quantity: useQty,
            unitPrice,
            taxPercent,
            lineTotal,
          });
          grandTotal += lineTotal;
          remaining -= useQty;
        }

        if (remaining > 0) {
          console.log('⚠️ [DISPENSE] Could not fulfill quantity for medicine:', medId, 'remaining:', remaining);
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: `Insufficient stock to fulfill requested quantity for medicine ${medId}`, errorCode: 6207 });
        }
      }
    }

    console.log('🧾 [DISPENSE] Creating PharmacyRecord with items count:', recordItems.length, 'grandTotal:', grandTotal);
    const recordArr = await PharmacyRecord.create([{
      type: 'Dispense',
      patientId: maybeNull(data.patientId),
      appointmentId: maybeNull(data.appointmentId),
      createdBy: req.user?.id || '',
      items: recordItems,
      total: grandTotal,
      paid: data.paid === true,
      paymentMethod: maybeNull(data.paymentMethod),
      notes: maybeNull(data.notes),
      createdAt: Date.now(),
    }], { session });

    await session.commitTransaction();
    session.endSession();

    console.log('✅ [DISPENSE] Dispense completed, record id:', recordArr[0]._id);
    return res.status(201).json({ success: true, record: recordArr[0] });
  } catch (err) {
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (e) { /* ignore */ }
    console.error('💥 [DISPENSE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispense items', errorCode: 6509 });
  }
});

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
    if (patientId) filter.patientId = patientId;
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
    const rec = await PharmacyRecord.findById(req.params.id).lean();
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

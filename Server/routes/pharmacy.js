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
    
    // Create initial batch if stock is provided
    if (MedicineBatch && Object.prototype.hasOwnProperty.call(data, 'stock')) {
      const initialStock = toNumberOrNull(data.stock) ?? 0;
      if (initialStock > 0) {
        const batch = await MedicineBatch.create({
          medicineId: String(med._id),
          batchNumber: 'DEFAULT',
          quantity: initialStock,
          salePrice: toNumberOrNull(data.salePrice) ?? 0,
          purchasePrice: toNumberOrNull(data.costPrice) ?? 0,
          supplier: '',
          location: '',
          expiryDate: null,
          metadata: { autoCreated: true },
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        console.log('✅ [MEDICINE CREATE] Created initial batch:', batch._id, 'qty:', batch.quantity);
        return res.status(201).json({ ...med.toObject(), availableQty: initialStock });
      }
    }
    
    return res.status(201).json({ ...med.toObject(), availableQty: 0 });
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
          { $group: { 
              _id: '$medicineId', 
              qty: { $sum: '$quantity' },
              avgSalePrice: { $avg: '$salePrice' }
            } 
          },
        ]);
        const qtyMap = {};
        const priceMap = {};
        agg.forEach((a) => { 
          qtyMap[String(a._id)] = a.qty; 
          priceMap[String(a._id)] = a.avgSalePrice || 0;
        });
        items = items.map((m) => ({ 
          ...m, 
          availableQty: qtyMap[String(m._id)] ?? 0,
          salePrice: priceMap[String(m._id)] ?? 0
        }));
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

    // Handle stock update via batch if 'stock' field is provided
    if (Object.prototype.hasOwnProperty.call(data, 'stock') && MedicineBatch) {
      const newStock = toNumberOrNull(data.stock) ?? 0;
      console.log('📦 [MEDICINE UPDATE] Stock adjustment requested:', newStock);
      
      // Get current stock from batches
      const batches = await MedicineBatch.find({ medicineId: String(req.params.id) });
      const currentStock = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
      console.log('📦 [MEDICINE UPDATE] Current stock:', currentStock);
      
      if (newStock !== currentStock) {
        const diff = newStock - currentStock;
        console.log('📦 [MEDICINE UPDATE] Stock difference:', diff);
        
        // Find or create a default batch for this medicine
        let defaultBatch = await MedicineBatch.findOne({ 
          medicineId: String(req.params.id),
          batchNumber: 'DEFAULT'
        });
        
        if (!defaultBatch && batches.length > 0) {
          // Use the first existing batch
          defaultBatch = batches[0];
        }
        
        if (defaultBatch) {
          // Update existing batch
          defaultBatch.quantity = Math.max(0, (defaultBatch.quantity || 0) + diff);
          defaultBatch.updatedAt = Date.now();
          
          // Set sale price if provided
          if (Object.prototype.hasOwnProperty.call(data, 'salePrice')) {
            defaultBatch.salePrice = toNumberOrNull(data.salePrice) ?? 0;
          }
          
          await defaultBatch.save();
          console.log('✅ [MEDICINE UPDATE] Updated batch:', defaultBatch._id, 'new qty:', defaultBatch.quantity);
        } else {
          // Create new default batch
          const newBatch = await MedicineBatch.create({
            medicineId: String(req.params.id),
            batchNumber: 'DEFAULT',
            quantity: Math.max(0, newStock),
            salePrice: toNumberOrNull(data.salePrice) ?? 0,
            purchasePrice: toNumberOrNull(data.costPrice) ?? 0,
            supplier: '',
            location: '',
            expiryDate: null,
            metadata: { autoCreated: true },
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          console.log('✅ [MEDICINE UPDATE] Created new batch:', newBatch._id, 'qty:', newBatch.quantity);
        }
      }
      
      // Get updated stock
      const updatedBatches = await MedicineBatch.find({ medicineId: String(req.params.id) });
      const finalStock = updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
      console.log('✅ [MEDICINE UPDATE] Final stock:', finalStock);
      
      return res.status(200).json({ 
        success: true, 
        medicine: { ...updated.toObject(), availableQty: finalStock }
      });
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

    // Populate medicine names
    const medicineIds = [...new Set(items.map(b => b.medicineId).filter(Boolean))];
    const medicines = await Medicine.find({ _id: { $in: medicineIds } }).select('_id name').lean();
    const medicineMap = Object.fromEntries(medicines.map(m => [String(m._id), m.name]));
    
    const enrichedBatches = items.map(batch => ({
      ...batch,
      medicineName: medicineMap[String(batch.medicineId)] || 'Unknown Medicine'
    }));

    console.log(`📦 [BATCH LIST] returning ${enrichedBatches.length} batches (total ${total})`);
    return res.status(200).json({ success: true, batches: enrichedBatches, total, page, limit });
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

/**
 * ------------------
 * PENDING PRESCRIPTIONS (from intakes)
 * ------------------
 */

// GET pending prescriptions from intakes
router.get('/pending-prescriptions', auth, async (req, res) => {
  try {
    console.log('📥 [PENDING PRESCRIPTIONS] requestedBy:', req.user?.id);
    
    const { Intake } = require('../Models');
    if (!Intake) {
      return res.status(500).json({ success: false, message: 'Intake model not available', errorCode: 7002 });
    }

    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = page * limit;

    // Find intakes that have pharmacy items to dispense (pharmacyItems exists in meta)
    // AND either don't have pharmacyId OR show all for pharmacist review
    const intakes = await Intake.find({
      $or: [
        { 'meta.pharmacyItems': { $exists: true, $ne: [] } }, // Has pharmacy items in meta
        { 'meta.pharmacyId': { $exists: true } } // Or already has pharmacy record (for review)
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await Intake.countDocuments({
      $or: [
        { 'meta.pharmacyItems': { $exists: true, $ne: [] } },
        { 'meta.pharmacyId': { $exists: true } }
      ]
    });

    // Fetch the pharmacy records to get medicine details
    const prescriptions = [];
    for (const intake of intakes) {
      try {
        const pharmacyId = intake.meta?.pharmacyId;
        let pharmacyItems = [];
        let total = 0;
        let paid = false;
        let notes = intake.notes || '';

        // If already has pharmacy record (dispensed), get from there
        if (pharmacyId) {
          const pharmacyRecord = await PharmacyRecord.findById(String(pharmacyId)).lean();
          if (pharmacyRecord) {
            pharmacyItems = pharmacyRecord.items || [];
            total = pharmacyRecord.total || 0;
            paid = pharmacyRecord.paid || false;
            notes = intake.notes || pharmacyRecord.notes || '';
          }
        } 
        // Otherwise, get from intake meta (pending dispense)
        else if (intake.meta?.pharmacyItems) {
          pharmacyItems = intake.meta.pharmacyItems;
          // Calculate total from items
          pharmacyItems.forEach(item => {
            const qty = item.quantity || 0;
            const price = item.unitPrice || item.price || 0;
            total += qty * price;
          });
        }

        // Skip if no items found
        if (pharmacyItems.length === 0) continue;

        prescriptions.push({
          _id: intake._id,
          patientName: `${intake.patientSnapshot?.firstName || ''} ${intake.patientSnapshot?.lastName || ''}`.trim(),
          patientId: intake.patientId,
          patientPhone: intake.patientSnapshot?.phone,
          doctorId: intake.doctorId,
          appointmentId: intake.appointmentId,
          pharmacyItems: pharmacyItems,
          createdAt: intake.createdAt,
          notes: notes,
          pharmacyId: pharmacyId || null,
          paid: paid,
          total: total,
          dispensed: !!pharmacyId // Add flag to indicate if already dispensed
        });
      } catch (err) {
        console.warn('Error processing intake:', intake._id, err.message);
      }
    }

    console.log(`📦 [PENDING PRESCRIPTIONS] returning ${prescriptions.length} prescriptions`);
    // Debug: log dispensed status
    prescriptions.forEach(p => {
      console.log(`  - ${p.patientName}: dispensed=${p.dispensed}, pharmacyId=${p.pharmacyId}`);
    });
    return res.status(200).json({ 
      success: true, 
      prescriptions, 
      total, 
      page, 
      limit 
    });
  } catch (err) {
    console.error('❌ [PENDING PRESCRIPTIONS] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending prescriptions', errorCode: 6512 });
  }
});

// POST auto-create prescription from intake and reduce stock
router.post('/prescriptions/create-from-intake', auth, async (req, res) => {
  try {
    console.log('📝 [CREATE PRESCRIPTION] data:', req.body, 'by user:', req.user?.id);
    
    const data = req.body || {};
    const items = Array.isArray(data.items) ? data.items : [];
    
    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'No medicine items provided', errorCode: 6210 });
    }

    // Prepare record items and reduce stock
    const recordItems = [];
    const stockReductions = [];

    for (const item of items) {
      const medicineId = item.medicineId;
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const price = parseFloat(item.price) || 0;
      const total = quantity * price;
      
      console.log(`💊 Processing item: ${item.Medicine || item.name} | Qty: ${quantity} | Price: ₹${price} | Total: ₹${total}`);

      // Find medicine to verify stock
      if (medicineId) {
        const medicine = await Medicine.findById(medicineId);
        if (medicine) {
          // Get available batches
          const batches = await MedicineBatch.find({
            medicineId: String(medicineId),
            quantity: { $gt: 0 }
          }).sort({ expiryDate: 1 }); // FIFO - use oldest first

          let remainingQty = quantity;
          
          // Reduce stock from batches
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
            
            console.log(`✅ Reduced ${deductQty} from batch ${batch.batchNumber}`);
          }

          if (remainingQty > 0) {
            console.warn(`⚠️ Insufficient stock for ${medicine.name}. Short by ${remainingQty} units`);
          }
        }
      }

      recordItems.push({
        medicineId: medicineId || null,
        name: item.Medicine || item.name || '',
        dosage: item.Dosage || item.dosage || '',
        frequency: item.Frequency || item.frequency || '',
        notes: item.Notes || item.notes || '',
        quantity: quantity,
        unitPrice: price,
        lineTotal: total,
        stockReductions: stockReductions.filter(sr => sr.medicineId === medicineId)
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
    return res.status(500).json({ success: false, message: 'Failed to create prescription', errorCode: 6514 });
  }
});

// POST mark prescription as dispensed
router.post('/prescriptions/:intakeId/dispense', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    
    console.log('💊 [DISPENSE PRESCRIPTION] intakeId:', req.params.intakeId, 'by user:', req.user?.id);
    
    const { Intake } = require('../Models');
    if (!Intake) {
      return res.status(500).json({ success: false, message: 'Intake model not available', errorCode: 7002 });
    }

    const intake = await Intake.findById(req.params.intakeId);
    if (!intake) {
      return res.status(404).json({ success: false, message: 'Intake not found', errorCode: 6209 });
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

    // Create pharmacy record if items provided
    const data = req.body || {};
    const items = Array.isArray(data.items) ? data.items : [];
    
    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided', errorCode: 6210 });
    }

    const recordItems = items.map(item => ({
      medicineId: item.medicineId || null,
      batchId: item.batchId || null,
      sku: item.sku || null,
      name: item.name || item.Medicine || '',
      dosage: item.dosage || item.Dosage || '',
      frequency: item.frequency || item.Frequency || '',
      notes: item.notes || item.Notes || '',
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      taxPercent: Number(item.taxPercent || 0),
      lineTotal: Number(item.lineTotal || 0),
      metadata: item.metadata || {}
    }));

    const total = recordItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

    const pharmacyRecord = await PharmacyRecord.create({
      type: 'Dispense',
      patientId: intake.patientId || null,
      appointmentId: intake.appointmentId || null,
      createdBy: req.user?.id || '',
      items: recordItems,
      total,
      paid: data.paid === true,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || intake.notes || null,
      metadata: { intakeId: intake._id, ...(data.metadata || {}) },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Update intake to mark pharmacy as completed
    intake.meta = intake.meta || {};
    intake.meta.pharmacyId = String(pharmacyRecord._id);
    intake.meta.pharmacyDispensedAt = new Date();
    intake.meta.pharmacyDispensedBy = req.user?.id;
    await intake.save();

    console.log('✅ [DISPENSE PRESCRIPTION] Created pharmacy record:', pharmacyRecord._id);
    console.log('✅ [DISPENSE PRESCRIPTION] Updated intake meta.pharmacyId:', intake.meta.pharmacyId);
    console.log('✅ [DISPENSE PRESCRIPTION] Intake ID:', intake._id);
    return res.status(201).json({ success: true, record: pharmacyRecord });
  } catch (err) {
    console.error('💥 [DISPENSE PRESCRIPTION] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispense prescription', errorCode: 6513 });
  }
});

// GET prescription PDF
router.get('/prescriptions/:intakeId/pdf', auth, async (req, res) => {
  try {
    console.log('📄 [PRESCRIPTION PDF] intakeId:', req.params.intakeId, 'by user:', req.user?.id);

    const { Intake } = require('../Models');
    if (!Intake) {
      return res.status(500).json({ success: false, message: 'Intake model not available', errorCode: 7001 });
    }

    const intake = await Intake.findById(req.params.intakeId).lean();
    if (!intake) {
      console.log('⚠️ [PRESCRIPTION PDF] Intake not found:', req.params.intakeId);
      return res.status(404).json({ success: false, message: 'Prescription not found', errorCode: 6515 });
    }

    // Get pharmacy items from either pharmacyRecord or intake meta
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

    // If not dispensed yet or pharmacy record not found, try getting from intake meta
    if (items.length === 0 && intake.meta?.pharmacyItems) {
      console.log('📝 [PRESCRIPTION PDF] Getting items from intake meta (not yet dispensed)');
      items = intake.meta.pharmacyItems;
      // Calculate total from items
      items.forEach(item => {
        const qty = item.quantity || 0;
        const price = item.unitPrice || item.price || 0;
        total += qty * price;
      });
    }

    if (items.length === 0) {
      console.log('⚠️ [PRESCRIPTION PDF] No pharmacy items found:', req.params.intakeId);
      return res.status(404).json({ success: false, message: 'No medicines in prescription', errorCode: 6518 });
    }

    // Generate PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const patientName = `${intake.patientSnapshot?.firstName || ''} ${intake.patientSnapshot?.lastName || ''}`.trim() || 'Unknown Patient';
    const filename = `Prescription_${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2563eb')
       .text('PRESCRIPTION', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
       .text('Karur Gastro Hospital', { align: 'center' });
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

    doc.moveDown(2);

    // Clinical Notes
    if (intake.complaints && intake.complaints.length > 0) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
      doc.moveDown(1);

      doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold')
         .text('Clinical Notes', 50, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor('#374151').font('Helvetica')
         .text(intake.complaints.join(', '), 50, doc.y, { width: 495, align: 'justify' });
      doc.moveDown(1);
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
    doc.moveDown(1);

    doc.fontSize(8).fillColor('#6b7280').font('Helvetica')
       .text('This is a computer-generated prescription. Please follow the dosage and frequency as prescribed.', 
             { align: 'center' })
       .moveDown(0.3)
       .text('For any queries, please contact the hospital.', { align: 'center' });

    // Total
    if (total > 0) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor('#1f2937').font('Helvetica-Bold')
         .text(`Total Amount: ₹${total.toFixed(2)}`, { align: 'right' });
    }

    doc.end();
    console.log('✅ [PRESCRIPTION PDF] Generated successfully for intake:', req.params.intakeId);
  } catch (err) {
    console.error('❌ [PRESCRIPTION PDF] Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Failed to generate prescription PDF', errorCode: 6518 });
    }
  }
});

/**
 * ------------------
 * ADMIN INVENTORY ANALYTICS
 * ------------------
 */

// GET inventory analytics for admin dashboard
router.get('/admin/analytics', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;

    console.log('📊 [ADMIN ANALYTICS] requestedBy:', req.user?.id);

    // Total medicines count
    const totalMedicines = await Medicine.countDocuments({ deleted_at: null });

    // Get all medicine IDs
    const allMedicines = await Medicine.find({ deleted_at: null }).select('_id reorderLevel').lean();
    const medIds = allMedicines.map(m => String(m._id));

    // Calculate stock levels
    const batchAgg = await MedicineBatch.aggregate([
      { $match: { medicineId: { $in: medIds } } },
      { $group: { _id: '$medicineId', totalQty: { $sum: '$quantity' } } },
    ]);

    const stockMap = {};
    batchAgg.forEach(b => { stockMap[String(b._id)] = b.totalQty || 0; });

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    allMedicines.forEach(med => {
      const stock = stockMap[String(med._id)] || 0;
      const reorder = med.reorderLevel || 20;
      
      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= reorder) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    // Recent transactions (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = await PharmacyRecord.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Revenue (last 30 days)
    const revenueAgg = await PharmacyRecord.aggregate([
      { 
        $match: { 
          type: 'Dispense',
          paid: true,
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Expiring batches (next 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringBatches = await MedicineBatch.countDocuments({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      quantity: { $gt: 0 }
    });

    // Top medicines by quantity dispensed (last 30 days)
    const topMedicines = await PharmacyRecord.aggregate([
      { $match: { type: 'Dispense', createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: '$items.medicineId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' }
        } 
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    const analytics = {
      inventory: {
        totalMedicines,
        inStock: inStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
      transactions: {
        last30Days: recentTransactions,
        totalRevenue: totalRevenue.toFixed(2),
      },
      alerts: {
        expiringBatches,
        lowStockItems: lowStockCount,
      },
      topMedicines: topMedicines.map(m => ({
        id: m._id,
        name: m.name,
        quantityDispensed: m.totalQuantity,
        revenue: m.totalRevenue.toFixed(2),
      })),
    };

    console.log('✅ [ADMIN ANALYTICS] Analytics generated:', analytics);
    return res.status(200).json({ success: true, analytics });
  } catch (err) {
    console.error('❌ [ADMIN ANALYTICS] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics', errorCode: 6514 });
  }
});

// GET low stock medicines for admin alerts
router.get('/admin/low-stock', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    console.log('🔔 [ADMIN LOW-STOCK] requestedBy:', req.user?.id);

    const threshold = parseInt(req.query.threshold || '20', 10);
    const allMedicines = await Medicine.find({ deleted_at: null }).lean();
    const medIds = allMedicines.map(m => String(m._id));

    const batchAgg = await MedicineBatch.aggregate([
      { $match: { medicineId: { $in: medIds } } },
      { $group: { _id: '$medicineId', totalQty: { $sum: '$quantity' } } },
    ]);

    const stockMap = {};
    batchAgg.forEach(b => { stockMap[String(b._id)] = b.totalQty || 0; });

    const lowStockMedicines = allMedicines.filter(med => {
      const stock = stockMap[String(med._id)] || 0;
      const reorder = med.reorderLevel || threshold;
      return stock <= reorder && stock > 0;
    }).map(med => ({
      ...med,
      availableQty: stockMap[String(med._id)] || 0,
    }));

    console.log(`✅ [ADMIN LOW-STOCK] Found ${lowStockMedicines.length} low stock medicines`);
    return res.status(200).json({ success: true, lowStockMedicines, count: lowStockMedicines.length });
  } catch (err) {
    console.error('❌ [ADMIN LOW-STOCK] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch low stock medicines', errorCode: 6515 });
  }
});

// GET expiring batches for admin alerts
router.get('/admin/expiring-batches', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    console.log('⏰ [ADMIN EXPIRING] requestedBy:', req.user?.id);

    const daysAhead = parseInt(req.query.days || '30', 10);
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const expiringBatches = await MedicineBatch.find({
      expiryDate: { $lte: futureDate, $gte: new Date() },
      quantity: { $gt: 0 }
    }).sort({ expiryDate: 1 }).lean();

    // Enrich with medicine details
    const enrichedBatches = await Promise.all(
      expiringBatches.map(async (batch) => {
        const medicine = await Medicine.findById(batch.medicineId).lean();
        return {
          ...batch,
          medicineName: medicine?.name || 'Unknown',
          medicineCategory: medicine?.category || 'N/A',
        };
      })
    );

    console.log(`✅ [ADMIN EXPIRING] Found ${enrichedBatches.length} expiring batches`);
    return res.status(200).json({ 
      success: true, 
      expiringBatches: enrichedBatches, 
      count: enrichedBatches.length 
    });
  } catch (err) {
    console.error('❌ [ADMIN EXPIRING] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch expiring batches', errorCode: 6516 });
  }
});

// POST bulk import medicines (admin only)
router.post('/admin/bulk-import', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    console.log('📦 [ADMIN BULK-IMPORT] requestedBy:', req.user?.id);

    const { medicines } = req.body;
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'medicines array is required', 
        errorCode: 6301 
      });
    }

    const results = {
      success: [],
      failed: [],
      skipped: [],
    };

    for (const medData of medicines) {
      try {
        if (!medData.name) {
          results.failed.push({ data: medData, reason: 'Missing name' });
          continue;
        }

        // Check for duplicate SKU
        if (medData.sku) {
          const exists = await Medicine.findOne({ sku: medData.sku }).lean();
          if (exists) {
            results.skipped.push({ data: medData, reason: 'SKU already exists' });
            continue;
          }
        }

        const med = await Medicine.create({
          name: medData.name,
          genericName: maybeNull(medData.genericName),
          sku: maybeNull(medData.sku),
          form: maybeNull(medData.form) || 'Tablet',
          strength: maybeNull(medData.strength) || '',
          unit: maybeNull(medData.unit) || 'pcs',
          manufacturer: maybeNull(medData.manufacturer) || '',
          brand: maybeNull(medData.brand) || '',
          category: maybeNull(medData.category) || '',
          description: maybeNull(medData.description) || '',
          status: medData.status || 'In Stock',
          metadata: medData.metadata || {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Create initial batch if stock provided
        if (MedicineBatch && medData.stock > 0) {
          await MedicineBatch.create({
            medicineId: String(med._id),
            batchNumber: medData.batchNumber || 'DEFAULT',
            quantity: medData.stock,
            salePrice: toNumberOrNull(medData.salePrice) ?? 0,
            purchasePrice: toNumberOrNull(medData.costPrice) ?? 0,
            supplier: medData.supplier || '',
            expiryDate: medData.expiryDate ? new Date(medData.expiryDate) : null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }

        results.success.push({ id: med._id, name: med.name });
      } catch (err) {
        results.failed.push({ data: medData, reason: err.message });
      }
    }

    console.log(`✅ [ADMIN BULK-IMPORT] Completed: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`);
    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('❌ [ADMIN BULK-IMPORT] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to bulk import', errorCode: 6517 });
  }
});

// GET inventory report (admin only)
router.get('/admin/inventory-report', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    console.log('📊 [ADMIN INVENTORY-REPORT] requestedBy:', req.user?.id);

    const allMedicines = await Medicine.find({ deleted_at: null }).lean();
    const medIds = allMedicines.map(m => String(m._id));

    const batchAgg = await MedicineBatch.aggregate([
      { $match: { medicineId: { $in: medIds } } },
      { 
        $group: { 
          _id: '$medicineId', 
          totalQty: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
          batches: { $sum: 1 }
        } 
      },
    ]);

    const inventoryMap = {};
    batchAgg.forEach(b => { 
      inventoryMap[String(b._id)] = {
        quantity: b.totalQty || 0,
        value: b.totalValue || 0,
        batches: b.batches || 0,
      };
    });

    const report = allMedicines.map(med => ({
      id: med._id,
      name: med.name,
      sku: med.sku,
      category: med.category,
      manufacturer: med.manufacturer,
      stock: inventoryMap[String(med._id)]?.quantity || 0,
      value: inventoryMap[String(med._id)]?.value || 0,
      batches: inventoryMap[String(med._id)]?.batches || 0,
      reorderLevel: med.reorderLevel || 20,
      status: med.status,
    }));

    const totalValue = report.reduce((sum, item) => sum + item.value, 0);
    const totalItems = report.reduce((sum, item) => sum + item.stock, 0);

    console.log(`✅ [ADMIN INVENTORY-REPORT] Generated report: ${report.length} items, total value: ${totalValue}`);
    return res.status(200).json({ 
      success: true, 
      report,
      summary: {
        totalMedicines: report.length,
        totalItems,
        totalValue: totalValue.toFixed(2),
      }
    });
  } catch (err) {
    console.error('❌ [ADMIN INVENTORY-REPORT] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate inventory report', errorCode: 6518 });
  }
});

module.exports = router;

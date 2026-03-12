// routes/pharmacy/medicines.routes.js
// Medicine catalog management (CRUD operations)

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
  ensureModel,
  buildMedicineFilter,
  buildStockAggregation,
  filterLowStock,
  enrichMedicinesWithStock
} = require('./helpers');

/**
 * POST /api/pharmacy/medicines
 * Create a new medicine in the catalog
 */
router.post('/', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    console.log('📩 [MEDICINE CREATE] Incoming payload:', req.body, 'by user:', req.user?.id);
    const data = req.body || {};
    
    // Validate required fields
    if (!data.name) {
      console.log('⚠️ [MEDICINE CREATE] Missing name in payload.');
      return res.status(400).json({
        success: false,
        message: 'Missing required field: name',
        errorCode: 6001,
      });
    }

    // Check for duplicate SKU if provided
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

    // Create medicine document
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
      reorderLevel: toNumberOrNull(data.reorderLevel) ?? 0,
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
        return res.status(201).json({
          success: true,
          medicine: { ...med.toObject(), availableQty: initialStock }
        });
      }
    }

    return res.status(201).json({
      success: true,
      medicine: { ...med.toObject(), availableQty: 0 }
    });

  } catch (err) {
    console.error('💥 [MEDICINE CREATE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create medicine',
      errorCode: 6500,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/medicines
 * List medicines with optional filters and pagination
 */
router.get('/', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    console.log('📥 [PHARMACY MEDICINES] query:', req.query, 'requestedBy:', req.user?.id);
    
    // Parse query parameters
    const q = (req.query.q || '').toString().trim();
    const category = (req.query.category || '').toString().trim();
    const lowStock = String(req.query.lowStock || '').trim() === '1';
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const wantMeta = String(req.query.meta || '').trim() === '1';

    // Build filter
    const filter = buildMedicineFilter(q, category);
    filter.deleted_at = null; // Exclude soft-deleted items

    // Fetch medicines
    const skip = page * limit;
    let items = await Medicine.find(filter).skip(skip).limit(limit).lean();
    const total = await Medicine.countDocuments(filter);

    // If MedicineBatch model missing, return without stock enrichment
    if (!MedicineBatch) {
      console.warn('⚠️ [PHARMACY MEDICINES] MedicineBatch model not available - skipping stock calculations.');
      if (wantMeta) {
        return res.status(200).json({
          success: true,
          medicines: items,
          total,
          page,
          limit
        });
      }
      return res.status(200).json(items);
    }

    // Get medicine IDs for batch aggregation
    const medIds = items.map((m) => String(m._id)).filter(Boolean);

    if (lowStock) {
      // Filter by low stock
      console.log('🔎 [PHARMACY MEDICINES] Low-stock filter active.');
      if (medIds.length === 0) {
        items = [];
      } else {
        const agg = await MedicineBatch.aggregate(buildStockAggregation(medIds));
        const qtyMap = {};
        agg.forEach((a) => { qtyMap[String(a._id)] = a.qty; });
        items = filterLowStock(items, qtyMap);
        console.log(`🔔 [PHARMACY MEDICINES] lowStock filtered results: ${items.length}`);
      }
    } else {
      // Enrich with stock data
      if (medIds.length > 0) {
        const agg = await MedicineBatch.aggregate(buildStockAggregation(medIds));
        const qtyMap = {};
        const priceMap = {};
        agg.forEach((a) => {
          qtyMap[String(a._id)] = a.qty;
          priceMap[String(a._id)] = a.avgSalePrice || 0;
        });
        items = enrichMedicinesWithStock(items, qtyMap, priceMap);
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
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/medicines/:id
 * Get medicine details by ID with batch information
 */
router.get('/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    
    console.log('🔎 [MEDICINE GET] id:', req.params.id, 'requestedBy:', req.user?.id);
    const wantMeta = String(req.query.meta || '').trim() === '1';
    
    const med = await Medicine.findById(req.params.id).lean();
    if (!med || med.deleted_at) {
      console.warn('⚠️ [MEDICINE GET] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
        errorCode: 6007
      });
    }

    // Enrich with batch information
    if (!MedicineBatch) {
      med.batches = [];
      med.availableQty = 0;
    } else {
      const batches = await MedicineBatch.find({
        medicineId: String(med._id)
      }).lean();
      med.batches = batches;
      med.availableQty = batches.reduce((s, b) => s + (b.quantity || 0), 0);
    }

    console.log('✅ [MEDICINE GET] Found medicine:', med._id, 'availableQty:', med.availableQty);
    
    if (wantMeta) {
      return res.status(200).json({
        success: true,
        medicine: med
      });
    }
    return res.status(200).json(med);

  } catch (err) {
    console.error('❌ [MEDICINE GET] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine',
      errorCode: 6502,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * PUT /api/pharmacy/medicines/:id
 * Update medicine details and optionally adjust stock
 */
router.put('/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    
    console.log('✏️ [MEDICINE UPDATE] id:', req.params.id, 'payload:', req.body, 'by user:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    const data = req.body || {};
    const update = { updatedAt: Date.now() };

    // Build update object from provided fields
    if (Object.prototype.hasOwnProperty.call(data, 'name')) update.name = maybeNull(data.name);
    if (Object.prototype.hasOwnProperty.call(data, 'genericName')) update.genericName = maybeNull(data.genericName);
    if (Object.prototype.hasOwnProperty.call(data, 'brand')) update.brand = maybeNull(data.brand);
    if (Object.prototype.hasOwnProperty.call(data, 'description')) update.description = maybeNull(data.description);
    if (Object.prototype.hasOwnProperty.call(data, 'category')) update.category = maybeNull(data.category);
    if (Object.prototype.hasOwnProperty.call(data, 'unit')) update.unit = maybeNull(data.unit);
    if (Object.prototype.hasOwnProperty.call(data, 'status')) update.status = maybeNull(data.status);
    if (Object.prototype.hasOwnProperty.call(data, 'reorderLevel')) update.reorderLevel = toNumberOrNull(data.reorderLevel) ?? 0;
    if (Object.prototype.hasOwnProperty.call(data, 'form')) update.form = maybeNull(data.form);
    if (Object.prototype.hasOwnProperty.call(data, 'strength')) update.strength = maybeNull(data.strength);
    if (Object.prototype.hasOwnProperty.call(data, 'manufacturer')) update.manufacturer = maybeNull(data.manufacturer);

    const updated = await Medicine.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.warn('⚠️ [MEDICINE UPDATE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
        errorCode: 6007
      });
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
    return res.status(200).json({
      success: true,
      medicine: updated
    });

  } catch (err) {
    console.error('❌ [MEDICINE UPDATE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update medicine',
      errorCode: 6503,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * DELETE /api/pharmacy/medicines/:id
 * Delete medicine (prevents deletion if batches or records exist)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;
    
    console.log('🗑️ [MEDICINE DELETE] id:', req.params.id, 'requestedBy:', req.user?.id);
    if (!requireAdminOrPharmacist(req, res)) return;

    // Check for existing batches or records
    const batchesCount = await MedicineBatch.countDocuments({
      medicineId: String(req.params.id)
    });
    const recordsCount = await PharmacyRecord.countDocuments({
      'items.medicineId': String(req.params.id)
    });

    if (batchesCount > 0 || recordsCount > 0) {
      console.log('⚠️ [MEDICINE DELETE] Prevent delete: batchesCount=', batchesCount, 'recordsCount=', recordsCount);
      return res.status(400).json({
        success: false,
        message: 'Cannot delete medicine with existing batches or records. Archive it instead.',
        errorCode: 6004,
        data: {
          batchesCount,
          recordsCount
        }
      });
    }

    // Soft delete or hard delete
    const deleted = await Medicine.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );

    if (!deleted) {
      console.warn('⚠️ [MEDICINE DELETE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
        errorCode: 6007
      });
    }

    console.log('✅ [MEDICINE DELETE] deleted:', deleted._id, deleted.name);
    return res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully',
      deletedId: deleted._id
    });

  } catch (err) {
    console.error('❌ [MEDICINE DELETE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete medicine',
      errorCode: 6504,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;

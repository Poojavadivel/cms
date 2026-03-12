// routes/pharmacy/admin.routes.js
// Admin analytics, inventory reports, and bulk operations

const express = require('express');
const router = express.Router();
const auth = require('../../Middleware/Auth');
const {
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  Patient
} = require('../../Models');
const {
  requireAdminOrPharmacist,
  toNumberOrNull,
  maybeNull,
  ensureModel
} = require('./helpers');

/**
 * GET /api/pharmacy/admin/analytics
 * Comprehensive inventory analytics for admin dashboard
 */
router.get('/analytics', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;

    console.log('📊 [ADMIN ANALYTICS] requestedBy:', req.user?.id);

    // Total medicines count
    const totalMedicines = await Medicine.countDocuments({ deleted_at: null });

    // Get all medicines with reorder levels
    const allMedicines = await Medicine.find({ deleted_at: null })
      .select('_id reorderLevel')
      .lean();
    const medIds = allMedicines.map(m => String(m._id));

    // Calculate stock levels via aggregation
    const batchAgg = await MedicineBatch.aggregate([
      { $match: { medicineId: { $in: medIds } } },
      { $group: { _id: '$medicineId', totalQty: { $sum: '$quantity' } } },
    ]);

    const stockMap = {};
    batchAgg.forEach(b => {
      stockMap[String(b._id)] = b.totalQty || 0;
    });

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
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      },
      alerts: {
        expiringBatches,
        lowStockItems: lowStockCount,
      },
      topMedicines: topMedicines.map(m => ({
        id: m._id,
        name: m.name,
        quantityDispensed: m.totalQuantity,
        revenue: parseFloat(m.totalRevenue.toFixed(2))
      }))
    };

    console.log('✅ [ADMIN ANALYTICS] Generated successfully');
    return res.status(200).json({
      success: true,
      analytics,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ [ADMIN ANALYTICS] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      errorCode: 6519,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/admin/low-stock
 * Get medicines with low or out of stock
 */
router.get('/low-stock', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    console.log('📉 [ADMIN LOW-STOCK] requestedBy:', req.user?.id);

    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));

    const allMedicines = await Medicine.find({ deleted_at: null }).lean();
    const medIds = allMedicines.map(m => String(m._id));

    // Get stock levels
    const batchAgg = await MedicineBatch.aggregate([
      { $match: { medicineId: { $in: medIds } } },
      { $group: { _id: '$medicineId', totalQty: { $sum: '$quantity' } } },
    ]);

    const stockMap = {};
    batchAgg.forEach(b => {
      stockMap[String(b._id)] = b.totalQty || 0;
    });

    // Filter low stock items
    const lowStockItems = allMedicines
      .map(med => ({
        ...med,
        currentStock: stockMap[String(med._id)] || 0
      }))
      .filter(med => med.currentStock <= (med.reorderLevel || 20))
      .sort((a, b) => a.currentStock - b.currentStock);

    const total = lowStockItems.length;
    const skip = page * limit;
    const paginatedItems = lowStockItems.slice(skip, skip + limit);

    console.log(`📦 [ADMIN LOW-STOCK] Found ${total} low stock items`);
    return res.status(200).json({
      success: true,
      items: paginatedItems,
      total,
      page,
      limit
    });

  } catch (err) {
    console.error('❌ [ADMIN LOW-STOCK] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items',
      errorCode: 6520,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/admin/expiring-batches
 * Get batches expiring soon
 */
router.get('/expiring-batches', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    console.log('📅 [ADMIN EXPIRING-BATCHES] requestedBy:', req.user?.id);

    const days = parseInt(req.query.days || '30', 10);
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));

    const daysFromNow = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const filter = {
      expiryDate: { $lte: daysFromNow, $gte: new Date() },
      quantity: { $gt: 0 }
    };

    const skip = page * limit;
    const batches = await MedicineBatch.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ expiryDate: 1 })
      .lean();

    const total = await MedicineBatch.countDocuments(filter);

    // Populate medicine names
    const medIds = [...new Set(batches.map(b => b.medicineId))];
    const medicines = await Medicine.find({ _id: { $in: medIds } })
      .select('_id name')
      .lean();
    const medicineMap = Object.fromEntries(medicines.map(m => [String(m._id), m.name]));

    const enrichedBatches = batches.map(batch => ({
      ...batch,
      medicineName: medicineMap[String(batch.medicineId)] || 'Unknown',
      daysUntilExpiry: Math.ceil((new Date(batch.expiryDate) - new Date()) / (24 * 60 * 60 * 1000))
    }));

    console.log(`📦 [ADMIN EXPIRING-BATCHES] Found ${total} batches expiring in ${days} days`);
    return res.status(200).json({
      success: true,
      batches: enrichedBatches,
      total,
      page,
      limit,
      daysFilter: days
    });

  } catch (err) {
    console.error('❌ [ADMIN EXPIRING-BATCHES] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring batches',
      errorCode: 6521,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * POST /api/pharmacy/admin/bulk-import
 * Bulk import medicines (admin only)
 */
router.post('/bulk-import', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;

    console.log('📥 [ADMIN BULK-IMPORT] payload:', req.body, 'by user:', req.user?.id);

    const data = req.body || {};
    const medicines = Array.isArray(data.medicines) ? data.medicines : [];

    if (medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No medicines data provided',
        errorCode: 6516
      });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const medData of medicines) {
      try {
        if (!medData.name) {
          results.failed.push({ data: medData, reason: 'Missing name' });
          continue;
        }

        // Check for duplicates by SKU or name
        if (medData.sku) {
          const exists = await Medicine.findOne({ sku: medData.sku }).lean();
          if (exists) {
            results.skipped.push({ data: medData, reason: 'SKU already exists' });
            continue;
          }
        }

        // Create medicine
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
          reorderLevel: toNumberOrNull(medData.reorderLevel) ?? 20,
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
    return res.status(200).json({
      success: true,
      results
    });

  } catch (err) {
    console.error('❌ [ADMIN BULK-IMPORT] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk import',
      errorCode: 6517,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/admin/inventory-report
 * Generate comprehensive inventory report
 */
router.get('/inventory-report', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(Medicine, 'Medicine', res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    console.log('📊 [ADMIN INVENTORY-REPORT] requestedBy:', req.user?.id);

    const allMedicines = await Medicine.find({ deleted_at: null }).lean();
    const medIds = allMedicines.map(m => String(m._id));

    // Aggregate batch data
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
        totalValue: parseFloat(totalValue.toFixed(2)),
      },
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ [ADMIN INVENTORY-REPORT] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report',
      errorCode: 6518,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/pharmacy/admin/patients/:id
 * Get patient pharmacy history
 */
router.get('/patients/:id', auth, async (req, res) => {
  try {
    if (!ensureModel(Patient, 'Patient', res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;

    console.log('🔎 [PHARMACY PATIENT GET] id:', req.params.id, 'requestedBy:', req.user?.id);

    // Find patient by ID or code
    const patient = await Patient.findById(req.params.id).lean() ||
      await Patient.findOne({ patientCode: req.params.id }).lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        errorCode: 6210
      });
    }

    // Get pharmacy records for this patient
    const records = await PharmacyRecord.find({ patientId: String(patient._id) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log('✅ [PHARMACY PATIENT GET] Found patient:', patient._id, 'with', records.length, 'records');

    return res.status(200).json({
      success: true,
      patient: {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        patientCode: patient.patientCode,
        phone: patient.phone,
        gender: patient.gender,
        age: patient.age,
        vitals: patient.vitals
      },
      history: records
    });

  } catch (err) {
    console.error('❌ [PHARMACY PATIENT GET] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient data',
      errorCode: 6520,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;

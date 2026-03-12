/**
 * pharmacy/adminController.js
 * Controller for admin analytics and reports
 */

const { Medicine, MedicineBatch, PharmacyRecord } = require('../../Models');
const { requireAdminOrPharmacist } = require('./middleware');
const config = require('./config');

/**
 * GET /admin/analytics
 * Get pharmacy analytics
 */
async function getAnalytics(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const totalMedicines = await Medicine.countDocuments();
    const totalBatches = await MedicineBatch.countDocuments();
    const activeBatches = await MedicineBatch.countDocuments({ quantity: { $gt: 0 } });
    const totalRecords = await PharmacyRecord.countDocuments();

    const recentRecords = await PharmacyRecord.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('patientId', 'firstName lastName')
      .lean();

    return res.status(200).json({
      success: true,
      analytics: {
        totalMedicines,
        totalBatches,
        activeBatches,
        totalRecords
      },
      recentRecords
    });
  } catch (err) {
    console.error('❌ [ANALYTICS] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
}

/**
 * GET /admin/low-stock
 * Get low stock medicines
 */
async function getLowStock(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const threshold = config.LOW_STOCK_THRESHOLD;

    const lowStockBatches = await MedicineBatch.find({
      quantity: { $gt: 0, $lte: threshold }
    })
      .populate('medicineId', 'name genericName')
      .sort({ quantity: 1 })
      .lean();

    return res.status(200).json({ success: true, lowStockBatches, threshold });
  } catch (err) {
    console.error('❌ [LOW STOCK] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch low stock' });
  }
}

/**
 * GET /admin/expiring-batches
 * Get expiring batches
 */
async function getExpiringBatches(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + config.EXPIRY_WARNING_DAYS);

    const expiringBatches = await MedicineBatch.find({
      expiryDate: { $exists: true, $lte: warningDate },
      quantity: { $gt: 0 }
    })
      .populate('medicineId', 'name genericName')
      .sort({ expiryDate: 1 })
      .lean();

    return res.status(200).json({ success: true, expiringBatches, warningDays: config.EXPIRY_WARNING_DAYS });
  } catch (err) {
    console.error('❌ [EXPIRING BATCHES] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch expiring batches' });
  }
}

/**
 * POST /admin/bulk-import
 * Bulk import medicines
 */
async function bulkImport(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { medicines } = req.body;

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Medicines array is required', 
        errorCode: config.ERROR_CODES.VALIDATION_ERROR 
      });
    }

    const created = await Medicine.insertMany(medicines, { ordered: false });

    console.log(`✅ [BULK IMPORT] Imported ${created.length} medicines`);
    return res.status(201).json({ success: true, count: created.length, medicines: created });
  } catch (err) {
    console.error('❌ [BULK IMPORT] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to bulk import' });
  }
}

/**
 * GET /admin/inventory-report
 * Get inventory report
 */
async function getInventoryReport(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const medicines = await Medicine.find().lean();
    const batches = await MedicineBatch.find().populate('medicineId', 'name').lean();

    const inventory = medicines.map(med => {
      const medBatches = batches.filter(b => b.medicineId?._id?.toString() === med._id.toString());
      const totalStock = medBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const totalValue = medBatches.reduce((sum, b) => sum + ((b.quantity || 0) * (b.salePrice || b.unitPrice || 0)), 0);

      return {
        medicine: med.name,
        genericName: med.genericName,
        totalStock,
        totalValue,
        batches: medBatches.length
      };
    });

    return res.status(200).json({ success: true, inventory });
  } catch (err) {
    console.error('❌ [INVENTORY REPORT] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate inventory report' });
  }
}

module.exports = {
  getAnalytics,
  getLowStock,
  getExpiringBatches,
  bulkImport,
  getInventoryReport
};

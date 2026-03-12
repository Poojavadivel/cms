// routes/pharmacy/summary.routes.js
// Pharmacy summary and dashboard statistics

const express = require('express');
const router = express.Router();
const auth = require('../../Middleware/Auth');
const {
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  Intake
} = require('../../Models');
const {
  requireAdminOrPharmacist,
  calculateStockValue,
  calculateEarnings
} = require('./helpers');

/**
 * GET /api/pharmacy/summary
 * Get pharmacy overview summary with key metrics
 */
router.get('/', auth, async (req, res) => {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    console.log('📊 [PHARMACY SUMMARY] requestedBy:', req.user?.id);

    // 1. Calculate Total Stock Value
    const batches = await MedicineBatch.find({ quantity: { $gt: 0 } }).lean();
    const totalStockValue = calculateStockValue(batches);

    // 2. Calculate Total Earnings from dispense records
    const records = await PharmacyRecord.find({ type: 'Dispense' }).lean();
    const totalEarnings = calculateEarnings(records);

    // 3. Count pending prescriptions from intakes
    const pendingCount = await Intake.countDocuments({
      'meta.pharmacyItems': { $exists: true, $ne: [] },
      'meta.pharmacyId': { $exists: false }
    });

    // 4. Count completed dispense records
    const completedCount = await PharmacyRecord.countDocuments({ type: 'Dispense' });

    // 5. Count unique medicines in stock
    const medicineCount = await Medicine.countDocuments({ deleted_at: null });

    console.log('✅ [PHARMACY SUMMARY] Success - Stock Value:', totalStockValue, 'Earnings:', totalEarnings);

    return res.status(200).json({
      success: true,
      data: {
        totalStockValue,
        totalEarnings,
        pendingPrescriptions: pendingCount,
        completedDispenses: completedCount,
        activeBatches: batches.length,
        totalMedicines: medicineCount,
        totalRecords: records.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ [PHARMACY SUMMARY] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pharmacy summary',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;

/**
 * pharmacy/summaryController.js
 * Controller for pharmacy summary and statistics
 */

const { MedicineBatch, PharmacyRecord } = require('../../Models');
const { requireAdminOrPharmacist } = require('./middleware');
const { calculateStockValue, calculateEarnings } = require('./utils');

/**
 * GET /summary
 * Get pharmacy summary statistics
 */
async function getSummary(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { Intake } = require('../../Models');

    // 1. Total Stock Value
    const batches = await MedicineBatch.find({ quantity: { $gt: 0 } }).lean();
    const totalStockValue = calculateStockValue(batches);

    // 2. Total Earnings
    const records = await PharmacyRecord.find({ type: 'Dispense' }).lean();
    const totalEarnings = calculateEarnings(records);

    // 3. Counts from Intake
    const pendingCount = await Intake.countDocuments({
      'meta.pharmacyItems': { $exists: true, $ne: [] },
      'meta.pharmacyId': { $exists: false }
    });
    const completedCount = await PharmacyRecord.countDocuments({ type: 'Dispense' });

    return res.status(200).json({
      success: true,
      totalStockValue,
      totalEarnings,
      pendingCount,
      completedCount,
      batchCount: batches.length,
      recordCount: records.length
    });
  } catch (err) {
    console.error('❌ [PHARMACY SUMMARY] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
}

module.exports = {
  getSummary
};

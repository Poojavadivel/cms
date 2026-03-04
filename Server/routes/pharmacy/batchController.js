/**
 * pharmacy/batchController.js
 * Controller for medicine batch operations
 */

const { Medicine, MedicineBatch } = require('../../Models');
const { requireAdminOrPharmacist, ensureModel } = require('./middleware');
const { toNumberOrNull } = require('./utils');
const config = require('./config');

/**
 * POST /batches
 * Create a new medicine batch
 */
async function createBatch(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    const { medicineId, batchNumber, quantity, unitPrice, salePrice, expiryDate, supplier } = req.body;

    if (!medicineId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Medicine ID is required', 
        errorCode: config.ERROR_CODES.VALIDATION_ERROR 
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found', 
        errorCode: config.ERROR_CODES.NOT_FOUND 
      });
    }

    const batch = new MedicineBatch({
      medicineId,
      batchNumber: batchNumber || `BATCH-${Date.now()}`,
      quantity: toNumberOrNull(quantity) || 0,
      unitPrice: toNumberOrNull(unitPrice) || 0,
      salePrice: toNumberOrNull(salePrice) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      supplier: supplier || null
    });

    await batch.save();
    console.log('✅ [BATCH CREATE] Batch created:', batch._id);

    return res.status(201).json({ success: true, batch });
  } catch (err) {
    console.error('❌ [BATCH CREATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create batch' });
  }
}

/**
 * GET /batches
 * List all batches with optional medicine filter
 */
async function getBatches(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    const { medicineId } = req.query;
    let query = {};

    if (medicineId) {
      query.medicineId = medicineId;
    }

    const batches = await MedicineBatch.find(query)
      .populate('medicineId', 'name genericName')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, batches });
  } catch (err) {
    console.error('❌ [BATCH LIST] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch batches' });
  }
}

/**
 * PUT /batches/:id
 * Update batch
 */
async function updateBatch(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    const { id } = req.params;
    const { quantity, unitPrice, salePrice, expiryDate, supplier } = req.body;

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = toNumberOrNull(quantity);
    if (unitPrice !== undefined) updateData.unitPrice = toNumberOrNull(unitPrice);
    if (salePrice !== undefined) updateData.salePrice = toNumberOrNull(salePrice);
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (supplier !== undefined) updateData.supplier = supplier;

    const batch = await MedicineBatch.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found', 
        errorCode: config.ERROR_CODES.NOT_FOUND 
      });
    }

    console.log('✅ [BATCH UPDATE] Updated:', id);
    return res.status(200).json({ success: true, batch });
  } catch (err) {
    console.error('❌ [BATCH UPDATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update batch' });
  }
}

/**
 * DELETE /batches/:id
 * Delete batch
 */
async function deleteBatch(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(MedicineBatch, 'MedicineBatch', res)) return;

    const { id } = req.params;
    const batch = await MedicineBatch.findByIdAndDelete(id);

    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found', 
        errorCode: config.ERROR_CODES.NOT_FOUND 
      });
    }

    console.log('✅ [BATCH DELETE] Deleted:', id);
    return res.status(200).json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    console.error('❌ [BATCH DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete batch' });
  }
}

module.exports = {
  createBatch,
  getBatches,
  updateBatch,
  deleteBatch
};

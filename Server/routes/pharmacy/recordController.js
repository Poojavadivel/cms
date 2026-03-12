/**
 * pharmacy/recordController.js
 * Controller for pharmacy records (dispense, restock, etc.)
 */

const { PharmacyRecord, MedicineBatch } = require('../../Models');
const { requireAdminOrPharmacist, ensureModel } = require('./middleware');
const config = require('./config');

/**
 * POST /records/dispense
 * Create dispense record
 */
async function createDispenseRecord(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;

    const { patientId, items, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items are required', 
        errorCode: config.ERROR_CODES.VALIDATION_ERROR 
      });
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.unitPrice || item.price || 0);
      return sum + (qty * price);
    }, 0);

    const record = new PharmacyRecord({
      type: config.RECORD_TYPES.DISPENSE,
      patientId: patientId || null,
      items,
      total,
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || '',
      dispensedBy: req.user?.id
    });

    await record.save();

    // Update batch quantities
    for (const item of items) {
      if (item.batchId) {
        await MedicineBatch.findByIdAndUpdate(
          item.batchId,
          { $inc: { quantity: -(item.quantity || item.qty || 1) } }
        );
      }
    }

    console.log('✅ [DISPENSE] Record created:', record._id);
    return res.status(201).json({ success: true, record });
  } catch (err) {
    console.error('❌ [DISPENSE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create dispense record' });
  }
}

/**
 * GET /records
 * List all pharmacy records
 */
async function getRecords(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;

    const { type, patientId } = req.query;
    let query = {};

    if (type) query.type = type;
    if (patientId) query.patientId = patientId;

    const records = await PharmacyRecord.find(query)
      .populate('patientId', 'firstName lastName')
      .populate('dispensedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ success: true, records });
  } catch (err) {
    console.error('❌ [RECORDS LIST] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
}

/**
 * GET /records/:id
 * Get single record by ID
 */
async function getRecordById(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;
    if (!ensureModel(PharmacyRecord, 'PharmacyRecord', res)) return;

    const { id } = req.params;
    const record = await PharmacyRecord.findById(id)
      .populate('patientId', 'firstName lastName')
      .populate('dispensedBy', 'name email')
      .lean();

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Record not found', 
        errorCode: config.ERROR_CODES.NOT_FOUND 
      });
    }

    return res.status(200).json({ success: true, record });
  } catch (err) {
    console.error('❌ [RECORD GET] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch record' });
  }
}

module.exports = {
  createDispenseRecord,
  getRecords,
  getRecordById
};

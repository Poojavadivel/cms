// routes/pharmacy/helpers.js
// Shared helper functions for pharmacy module

/**
 * Middleware to check if user has admin or pharmacist role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} - True if authorized, false otherwise
 */
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

/**
 * Convert value to number or null
 * @param {*} v - Value to convert
 * @returns {number|null} - Number or null
 */
const toNumberOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Convert value to null if empty string
 * @param {*} v - Value to check
 * @returns {*|null} - Value or null
 */
const maybeNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
};

/**
 * Ensure model exists, return error if not
 * @param {Object} model - Mongoose model
 * @param {string} name - Model name for error message
 * @param {Object} res - Express response object
 * @returns {boolean} - True if model exists
 */
function ensureModel(model, name, res) {
  if (!model) {
    console.error(`❌ [MODEL MISSING] ${name} is undefined. Check exports in Models and require path.`);
    if (res) {
      res.status(500).json({
        success: false,
        message: `Server misconfiguration: ${name} model not available`,
        errorCode: 7001
      });
    }
    return false;
  }
  return true;
}

/**
 * Calculate total stock value from batches
 * @param {Array} batches - Array of medicine batches
 * @returns {number} - Total stock value
 */
function calculateStockValue(batches) {
  return batches.reduce((total, batch) => {
    const price = batch.salePrice || batch.unitPrice || 0;
    const qty = batch.quantity || 0;
    return total + (price * qty);
  }, 0);
}

/**
 * Calculate total earnings from pharmacy records
 * @param {Array} records - Array of pharmacy records
 * @returns {number} - Total earnings
 */
function calculateEarnings(records) {
  return records.reduce((sum, record) => {
    let recordTotal = record.total || 0;
    if (recordTotal === 0 && record.items && record.items.length > 0) {
      recordTotal = record.items.reduce((iSum, item) => {
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(item.unitPrice || item.price || 0);
        return iSum + (qty * price);
      }, 0);
    }
    return sum + recordTotal;
  }, 0);
}

/**
 * Build stock aggregation pipeline for medicines
 * @param {Array<string>} medicineIds - Array of medicine IDs
 * @returns {Array} - Aggregation pipeline
 */
function buildStockAggregation(medicineIds) {
  return [
    { $match: { medicineId: { $in: medicineIds } } },
    {
      $group: {
        _id: '$medicineId',
        qty: { $sum: '$quantity' },
        avgSalePrice: { $avg: '$salePrice' }
      }
    }
  ];
}

/**
 * Filter medicines by low stock threshold
 * @param {Array} medicines - Array of medicine documents
 * @param {Object} qtyMap - Map of medicine IDs to quantities
 * @returns {Array} - Filtered medicines
 */
function filterLowStock(medicines, qtyMap) {
  return medicines.filter((medicine) => {
    const stock = qtyMap[String(medicine._id)] ?? 0;
    const reorder = medicine.reorderLevel ?? 0;
    return stock <= reorder;
  });
}

/**
 * Enrich medicines with stock data
 * @param {Array} medicines - Array of medicine documents
 * @param {Object} qtyMap - Map of medicine IDs to quantities
 * @param {Object} priceMap - Map of medicine IDs to prices
 * @returns {Array} - Enriched medicines
 */
function enrichMedicinesWithStock(medicines, qtyMap, priceMap) {
  return medicines.map((medicine) => ({
    ...medicine,
    availableQty: qtyMap[String(medicine._id)] ?? 0,
    salePrice: priceMap[String(medicine._id)] ?? 0
  }));
}

/**
 * Build search filter for medicines
 * @param {string} searchQuery - Search query string
 * @param {string} category - Category filter
 * @returns {Object} - MongoDB filter object
 */
function buildMedicineFilter(searchQuery, category) {
  const filter = {};
  
  if (searchQuery) {
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: regex },
      { sku: regex },
      { brand: regex },
      { genericName: regex }
    ];
  }
  
  if (category) {
    filter.category = category;
  }
  
  return filter;
}

module.exports = {
  requireAdminOrPharmacist,
  toNumberOrNull,
  maybeNull,
  ensureModel,
  calculateStockValue,
  calculateEarnings,
  buildStockAggregation,
  filterLowStock,
  enrichMedicinesWithStock,
  buildMedicineFilter
};

/**
 * pharmacy/utils.js
 * Utility functions for pharmacy module
 */

/**
 * Convert value to number or null
 */
const toNumberOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Convert value to null if empty
 */
const maybeNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
};

/**
 * Calculate total stock value from batches
 */
function calculateStockValue(batches) {
  return batches.reduce((sum, batch) => {
    const price = batch.salePrice || batch.unitPrice || 0;
    return sum + (batch.quantity * price);
  }, 0);
}

/**
 * Calculate total earnings from records
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
 * Format medicine search query
 */
function buildMedicineSearchQuery(search) {
  const searchTerm = search.trim();
  return {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { genericName: { $regex: searchTerm, $options: 'i' } },
      { manufacturer: { $regex: searchTerm, $options: 'i' } }
    ]
  };
}

module.exports = {
  toNumberOrNull,
  maybeNull,
  calculateStockValue,
  calculateEarnings,
  buildMedicineSearchQuery
};

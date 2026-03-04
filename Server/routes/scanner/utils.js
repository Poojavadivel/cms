/**
 * scanner/utils.js
 * Utility functions for scanner module
 */

const fs = require('fs').promises;

/**
 * Logging helper with batch ID
 * @param {string} batchId - Batch identifier
 * @param  {...any} args - Arguments to log
 */
function logh(batchId, ...args) {
  console.log(`[scanner-landingai ${batchId}]`, ...args);
}

/**
 * Clean up temporary file
 * @param {string} filePath - Path to temporary file
 */
async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Generate unique batch ID
 * @returns {string} Batch ID
 */
function generateBatchId() {
  return `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Validate file type
 * @param {string} mimetype - File MIME type
 * @returns {boolean} True if valid
 */
function isValidFileType(mimetype) {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  return allowedTypes.includes(mimetype);
}

/**
 * Format file size to human readable
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
  logh,
  cleanupTempFile,
  generateBatchId,
  isValidFileType,
  formatFileSize
};

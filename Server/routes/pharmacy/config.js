/**
 * pharmacy/config.js
 * Configuration for pharmacy module
 */

const config = {
  // Roles with access
  AUTHORIZED_ROLES: ['admin', 'pharmacist', 'superadmin'],
  
  // Stock thresholds
  LOW_STOCK_THRESHOLD: 10,
  EXPIRY_WARNING_DAYS: 90,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  
  // Report types
  RECORD_TYPES: {
    DISPENSE: 'Dispense',
    RESTOCK: 'Restock',
    ADJUSTMENT: 'Adjustment'
  },
  
  // Error codes
  ERROR_CODES: {
    AUTH_FORBIDDEN: 6002,
    MODEL_MISSING: 7001,
    VALIDATION_ERROR: 6003,
    NOT_FOUND: 6004
  }
};

module.exports = config;

/**
 * pharmacy/index.js
 * Centralized exports for pharmacy module
 */

// Main router
const routes = require('./routes');

// Configuration
const config = require('./config');

// Middleware
const middleware = require('./middleware');

// Utilities
const utils = require('./utils');

// Controllers
const summaryController = require('./summaryController');
const medicineController = require('./medicineController');
const batchController = require('./batchController');
const recordController = require('./recordController');
const prescriptionController = require('./prescriptionController');
const adminController = require('./adminController');
const intakeDispenseController = require('./intakeDispenseController');
const patientController = require('./patientController');

// Centralized exports
module.exports = {
  // Default router
  router: routes,
  
  // Configuration
  config,
  
  // Middleware
  middleware,
  
  // Utilities
  utils,
  
  // Controllers
  summaryController,
  medicineController,
  batchController,
  recordController,
  prescriptionController,
  adminController,
  intakeDispenseController,
  patientController
};

/**
 * Usage Examples:
 * 
 * // Import router (recommended)
 * const pharmacyRouter = require('./pharmacy/routes');
 * app.use('/api/pharmacy', pharmacyRouter);
 * 
 * // Import everything
 * const pharmacy = require('./pharmacy');
 * pharmacy.router // Express router
 * 
 * // Import specific services
 * const { utils, config } = require('./pharmacy');
 */

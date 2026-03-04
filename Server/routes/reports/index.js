/**
 * reports/index.js
 * Centralized exports for reports module
 */

// Main router
const routes = require('./routes');

// Configuration
const config = require('./config');

// Services
const dataService = require('./dataService');

// Generators
const patientReportGenerator = require('./patientReportGenerator');

// Controllers
const patientReportController = require('./patientReportController');
const doctorReportController = require('./doctorReportController');

// Utilities
const utils = require('./utils');

// Centralized exports
module.exports = {
  // Default router
  router: routes,
  
  // Configuration
  config,
  
  // Services
  dataService,
  
  // Generators
  patientReportGenerator,
  
  // Controllers
  patientReportController,
  doctorReportController,
  
  // Utilities
  utils
};

/**
 * Usage Examples:
 * 
 * // Import router (recommended)
 * const reportsRouter = require('./reports/routes');
 * app.use('/api/reports', reportsRouter);
 * 
 * // Import everything
 * const reports = require('./reports');
 * reports.router // Express router
 * 
 * // Import specific services
 * const { dataService, utils } = require('./reports');
 */

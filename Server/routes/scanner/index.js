/**
 * scanner/index.js
 * Centralized exports for scanner module
 */

// Main router
const routes = require('./routes');

// Configuration
const config = require('./config');

// Services
const {
  processDocumentScan,
  isScannerReady,
  landingAIScanner
} = require('./scannerService');

// Data converters
const {
  convertExtractedDataToRows,
  convertPrescriptionData,
  convertLabReportData,
  convertMedicalHistoryData
} = require('./dataConverter');

// Patient matching
const { matchOrCreatePatient } = require('./patientMatcher');

// Upload middleware
const { upload } = require('./uploadMiddleware');

// Utilities
const {
  logh,
  cleanupTempFile,
  generateBatchId,
  isValidFileType,
  formatFileSize
} = require('./utils');

// Centralized exports
module.exports = {
  // Default router
  router: routes,
  
  // Configuration
  config,
  
  // Services
  processDocumentScan,
  isScannerReady,
  landingAIScanner,
  
  // Data conversion
  convertExtractedDataToRows,
  convertPrescriptionData,
  convertLabReportData,
  convertMedicalHistoryData,
  
  // Patient matching
  matchOrCreatePatient,
  
  // Middleware
  upload,
  
  // Utilities
  logh,
  cleanupTempFile,
  generateBatchId,
  isValidFileType,
  formatFileSize
};

/**
 * Usage Examples:
 * 
 * // Import router (recommended)
 * const scannerRouter = require('./scanner/routes');
 * app.use('/api/scanner-enterprise', scannerRouter);
 * 
 * // Import everything
 * const scanner = require('./scanner');
 * scanner.router // Express router
 * 
 * // Import specific functions
 * const { processDocumentScan, matchOrCreatePatient } = require('./scanner');
 */

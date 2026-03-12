/**
 * pdfGenerators/index.js
 * Main entry point - exports ProperPdfGenerator and utilities
 */

const ProperPdfGenerator = require('./ProperPdfGenerator');
const config = require('./config');
const { getStyles } = require('./styles');
const components = require('./components');

// Create singleton instance
const generator = new ProperPdfGenerator();

// Export instance and class
module.exports = generator;
module.exports.ProperPdfGenerator = ProperPdfGenerator;
module.exports.config = config;
module.exports.getStyles = getStyles;
module.exports.components = components;

/**
 * Usage Examples:
 * 
 * // Import generator instance (recommended)
 * const pdfGen = require('./utils/pdfGenerators');
 * const docDef = pdfGen.generatePatientReport(patient, doctor, appointments);
 * const pdf = pdfGen.createPdf(docDef);
 * 
 * // Import class to create new instance
 * const { ProperPdfGenerator } = require('./utils/pdfGenerators');
 * const generator = new ProperPdfGenerator();
 * 
 * // Import utilities
 * const { config, components } = require('./utils/pdfGenerators');
 */

/**
 * scanner/config.js
 * Configuration management for document scanner module
 */

const path = require('path');

const config = {
  // File upload limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_UPLOAD: 10,
  
  // Directory paths
  TEMP_UPLOAD_DIR: path.join(__dirname, '../../uploads/temp'),
  
  // API keys
  LANDINGAI_API_KEY: process.env.LANDINGAI_API_KEY || 'pat_XlbvTpObJfmlCvLPHjbSWTh2vzCciqZT',
  
  // Allowed file types
  ALLOWED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  
  // Document types
  DOCUMENT_TYPES: {
    PRESCRIPTION: 'PRESCRIPTION',
    LAB_REPORT: 'LAB_REPORT',
    MEDICAL_HISTORY: 'MEDICAL_HISTORY'
  },
  
  // Validation
  validate() {
    if (!this.LANDINGAI_API_KEY || this.LANDINGAI_API_KEY === 'pat_XlbvTpObJfmlCvLPHjbSWTh2vzCciqZT') {
      console.warn('[scanner/config] WARNING: Using default LandingAI API key');
    }
    return true;
  }
};

// Validate on load
config.validate();

module.exports = config;

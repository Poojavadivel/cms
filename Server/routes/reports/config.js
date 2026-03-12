/**
 * reports/config.js
 * Configuration for enterprise reports
 */

const config = {
  // Report settings
  MAX_APPOINTMENTS_IN_REPORT: 25,
  MAX_DETAILED_APPOINTMENTS: 3,
  MAX_PATIENTS_IN_DOCTOR_REPORT: 10,
  
  // Date formats
  DATE_FORMAT: 'en-IN',
  
  // Performance thresholds
  EXCELLENT_COMPLETION_RATE: 80,
  
  // Report types
  REPORT_TYPES: {
    PATIENT_MEDICAL: 'patient_medical',
    DOCTOR_PERFORMANCE: 'doctor_performance'
  }
};

module.exports = config;

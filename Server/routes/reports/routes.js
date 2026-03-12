/**
 * reports/routes.js
 * Express routes for enterprise PDF reports
 */

const express = require('express');
const router = express.Router();
const auth = require('../../Middleware/Auth');

// Controllers
const { generatePatientReport } = require('./patientReportController');
const { generateDoctorReport } = require('./doctorReportController');

/**
 * GET /patient/:patientId
 * Generate patient medical report PDF
 * 
 * @param {string} patientId - Patient ID
 * @returns {application/pdf} PDF document
 */
router.get('/patient/:patientId', auth, generatePatientReport);

/**
 * GET /doctor/:doctorId
 * Generate doctor performance report PDF
 * 
 * @param {string} doctorId - Doctor/User ID
 * @returns {application/pdf} PDF document
 */
router.get('/doctor/:doctorId', auth, generateDoctorReport);

module.exports = router;

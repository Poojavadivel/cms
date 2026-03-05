/**
 * scanner/routes.js
 * Main router for scanner module - Enterprise-grade document scanning system
 * 
 * Features:
 * - Document scanning with LandingAI OCR
 * - Bulk upload with patient matching
 * - Verification workflow
 * - Document retrieval (prescriptions, lab reports, medical history)
 */

const express = require('express');
const router = express.Router();

const auth = require('../../Middleware/Auth');
const { upload } = require('./uploadMiddleware');

// Controllers
const { handleScanMedical } = require('./scanController');
const { handleScanMedicalV2 } = require('./scanControllerV2');
const { handleBulkUploadWithMatching } = require('./bulkController');
const {
  getVerification,
  getPatientVerifications,
  updateVerificationRow,
  deleteVerificationRow,
  confirmVerification,
  rejectVerification
} = require('./verificationController');
const {
  getPatientPrescriptions,
  getPatientLabReports,
  getPatientMedicalHistory,
  getPublicPDF
} = require('./documentController');

// ============================================================================
// SCANNING ENDPOINTS
// ============================================================================

/**
 * POST /scan-medical
 * Main scanning endpoint for medical documents
 * Supports: Prescriptions, Lab Reports, Medical History
 * Body: multipart/form-data with 'image' field
 *   - patientId: string (optional)
 *   - documentType: string (optional, auto-detected if not provided)
 */
router.post('/scan-medical', auth, upload.single('image'), handleScanMedical);

/**
 * POST /scan-medical-v2
 * SECTION-LEVEL scanning endpoint (Professional-grade)
 * Detects and processes multiple sections within one document
 * Like Epic Systems and athenahealth
 * Body: multipart/form-data with 'image' field
 *   - patientId: string (optional)
 *   - documentType: string (optional)
 */
router.post('/scan-medical-v2', auth, upload.single('image'), handleScanMedicalV2);

/**
 * POST /bulk-upload-with-matching
 * Bulk upload multiple documents with automatic patient matching
 * Body: multipart/form-data with 'images' field (multiple files)
 */
router.post('/bulk-upload-with-matching', auth, upload.array('images', 10), handleBulkUploadWithMatching);

// ============================================================================
// VERIFICATION ENDPOINTS
// ============================================================================

/**
 * GET /verification/:verificationId
 * Get verification details for a scanned document
 */
router.get('/verification/:verificationId', auth, getVerification);

/**
 * GET /verification/patient/:patientId
 * Get all pending verifications for a patient
 */
router.get('/verification/patient/:patientId', auth, getPatientVerifications);

/**
 * PUT /verification/:verificationId/row/:rowIndex
 * Update a specific data row in verification
 * Body: { currentValue: any }
 */
router.put('/verification/:verificationId/row/:rowIndex', auth, updateVerificationRow);

/**
 * DELETE /verification/:verificationId/row/:rowIndex
 * Delete a specific data row from verification
 */
router.delete('/verification/:verificationId/row/:rowIndex', auth, deleteVerificationRow);

/**
 * POST /verification/:verificationId/confirm
 * Confirm verification and save data to final collection
 */
router.post('/verification/:verificationId/confirm', auth, confirmVerification);

/**
 * POST /verification/:verificationId/reject
 * Reject verification
 * Body: { reason: string }
 */
router.post('/verification/:verificationId/reject', auth, rejectVerification);

// ============================================================================
// DOCUMENT RETRIEVAL ENDPOINTS
// ============================================================================

/**
 * GET /prescriptions/:patientId
 * Get all prescriptions for a patient
 */
router.get('/prescriptions/:patientId', auth, getPatientPrescriptions);

/**
 * GET /lab-reports/:patientId
 * Get all lab reports for a patient
 */
router.get('/lab-reports/:patientId', auth, getPatientLabReports);

/**
 * GET /medical-history/:patientId
 * Get all medical history records for a patient
 */
router.get('/medical-history/:patientId', auth, getPatientMedicalHistory);

/**
 * GET /pdf-public/:pdfId
 * Get PDF document (public access for viewing)
 */
router.get('/pdf-public/:pdfId', getPublicPDF);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const { isScannerReady } = require('./scannerService');
  res.json({
    success: true,
    message: 'Scanner service is running',
    scannerReady: isScannerReady(),
    timestamp: new Date()
  });
});

module.exports = router;

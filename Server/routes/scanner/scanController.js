/**
 * scanner/scanController.js
 * Main scan endpoint controller
 */

const { processDocumentScan } = require('./scannerService');
const { generateBatchId } = require('./utils');
const { cleanupTempFile } = require('./utils');

/**
 * POST /scan-medical - Main scanning endpoint
 */
async function handleScanMedical(req, res) {
  const batchId = generateBatchId();
  const t0 = Date.now();

  console.log('[SCAN] ========================================');
  console.log(`[SCAN] Starting scan batch: ${batchId}`);
  console.log('[SCAN] ========================================');

  try {
    if (!req.file) {
      console.log('[SCAN] ❌ ERROR: No file uploaded');
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const patientId = req.body.patientId;
    const documentType = req.body.documentType;

    // Process document
    const result = await processDocumentScan(req.file, patientId, documentType, batchId, req.user);

    // Cleanup temp file
    await cleanupTempFile(req.file.path);

    const totalTime = Date.now() - t0;

    return res.json({
      success: true,
      intent: result.documentType,
      extractedData: result.extractedData,
      verificationRequired: true,
      verificationId: result.verificationId,
      metadata: {
        ocrEngine: 'landingai-ade',
        ocrConfidence: result.confidence || 0.95,
        processingTimeMs: totalTime,
        model: 'dpt-2'
      },
      savedToPatient: patientId ? {
        patientId: patientId,
        imagePath: result.savedImagePath,
        pdfId: result.savedImagePath,
        verificationId: result.verificationId,
        saved: result.savedImagePath !== null,
        requiresVerification: true
      } : null
    });

  } catch (error) {
    console.error(`[${batchId}] ❌ Scan failed:`, error.message);
    if (req.file?.path) {
      await cleanupTempFile(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  handleScanMedical
};

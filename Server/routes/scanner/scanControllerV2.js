/**
 * scanner/scanControllerV2.js
 * Section-level scan endpoint controller
 * Professional-grade multi-section document processing
 */

const { processDocumentScanV2 } = require('./scannerServiceV2');
const { generateBatchId } = require('./utils');
const { cleanupTempFile } = require('./utils');

/**
 * POST /scan-medical-v2 - Section-level scanning endpoint
 */
async function handleScanMedicalV2(req, res) {
  const batchId = generateBatchId();
  const t0 = Date.now();

  console.log('[SCAN-V2] ========================================');
  console.log(`[SCAN-V2] Starting SECTION-LEVEL scan: ${batchId}`);
  console.log('[SCAN-V2] ========================================');

  try {
    if (!req.file) {
      console.log('[SCAN-V2] ❌ ERROR: No file uploaded');
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const patientId = req.body.patientId;
    const documentType = req.body.documentType;

    // Process document with section-level extraction
    const result = await processDocumentScanV2(req.file, patientId, documentType, batchId, req.user);

    // Cleanup temp file
    await cleanupTempFile(req.file.path);

    const totalTime = Date.now() - t0;

    return res.json({
      success: true,
      processingVersion: 'v2-section-level',
      primaryDocumentType: result.documentType,
      documentTypes: result.documentTypes,
      sectionCount: result.sectionCount,
      sections: result.sections,
      extractedData: result.extractedData,
      verificationRequired: true,
      verificationId: result.verificationId,
      metadata: {
        ocrEngine: 'landingai-ade-v2',
        ocrConfidence: result.confidence || 0.95,
        processingTimeMs: totalTime,
        model: 'dpt-2',
        sectionBased: true
      },
      savedToPatient: patientId ? {
        patientId: patientId,
        imagePath: result.savedImagePath,
        pdfId: result.savedImagePath,
        verificationId: result.verificationId,
        saved: result.savedImagePath !== null,
        requiresVerification: true,
        sectionCount: result.sectionCount
      } : null
    });

  } catch (error) {
    console.error(`[${batchId}] ❌ Section-level scan failed:`, error.message);
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
  handleScanMedicalV2
};

/**
 * scanner/bulkController.js
 * Controller for bulk upload operations
 */

const fs = require('fs').promises;
const { PatientPDF } = require('../../Models');
const { landingAIScanner } = require('./scannerService');
const { matchOrCreatePatient } = require('./patientMatcher');
const { logh, cleanupTempFile, generateBatchId } = require('./utils');

/**
 * POST /bulk-upload-with-matching - Bulk upload with auto patient matching
 */
async function handleBulkUploadWithMatching(req, res) {
  const batchId = generateBatchId();
  const t0 = Date.now();
  let results = [];
  let failures = [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    logh(batchId, `📤 Bulk upload: ${req.files.length} files`);

    for (const file of req.files) {
      try {
        logh(batchId, `📄 Processing: ${file.originalname}`);

        // Scan document
        const scanResult = await landingAIScanner.scanDocument(file.path);

        if (!scanResult.success) {
          throw new Error(scanResult.error || 'Scanning failed');
        }

        // Match or create patient
        const { patient } = await matchOrCreatePatient(scanResult.extractedData, batchId);

        if (!patient) {
          throw new Error('Patient matching failed');
        }

        // Save PDF
        const fileBuffer = await fs.readFile(file.path);
        const patientPDF = new PatientPDF({
          patientId: patient._id,
          title: `${scanResult.documentType} Document`,
          fileName: file.originalname,
          mimeType: file.mimetype,
          data: fileBuffer,
          size: fileBuffer.length,
          uploadedAt: new Date()
        });

        await patientPDF.save();

        logh(batchId, `✅ Processed for patient: ${patient._id}`);

        results.push({
          file: file.originalname,
          success: true,
          patientId: patient._id.toString(),
          documentType: scanResult.documentType,
          pdfId: patientPDF._id.toString()
        });

        // Cleanup temp file
        await cleanupTempFile(file.path);

      } catch (fileError) {
        logh(batchId, `❌ Failed: ${file.originalname} - ${fileError.message}`);
        failures.push({
          file: file.originalname,
          success: false,
          error: fileError.message
        });
        await cleanupTempFile(file.path);
      }
    }

    const totalTime = Date.now() - t0;
    logh(batchId, `✅ Bulk upload complete (${totalTime}ms): ${results.length} succeeded, ${failures.length} failed`);

    return res.json({
      success: true,
      processed: results.length + failures.length,
      succeeded: results.length,
      failed: failures.length,
      results,
      failures,
      processingTimeMs: totalTime
    });

  } catch (error) {
    logh(batchId, `❌ Bulk upload failed: ${error.message}`);
    
    // Cleanup any remaining temp files
    if (req.files) {
      for (const file of req.files) {
        await cleanupTempFile(file.path);
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message,
      results,
      failures
    });
  }
}

module.exports = {
  handleBulkUploadWithMatching
};

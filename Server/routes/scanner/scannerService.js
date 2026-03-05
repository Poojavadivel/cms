/**
 * scanner/scannerService.js
 * Core scanner service for document processing with LandingAI
 */

const fs = require('fs').promises;
const { LandingAIScanner } = require('../../utils/landingai_scanner');
const { PatientPDF, ScannedDataVerification } = require('../../Models');
const { convertExtractedDataToRows } = require('./dataConverter');
const { logh } = require('./utils');
const config = require('./config');
const { detectSections, mergeSectionData } = require('./sectionDetector');

// Initialize LandingAI scanner
let landingAIScanner = null;
try {
  landingAIScanner = new LandingAIScanner(config.LANDINGAI_API_KEY);
  console.log('[scanner-landingai] ✅ LandingAI ADE initialized');
} catch (err) {
  console.log('[scanner-landingai] ⚠️ LandingAI ADE disabled (missing API key)');
}

/**
 * Process document scan with LandingAI
 * @param {Object} file - Uploaded file object
 * @param {string} patientId - Patient ID
 * @param {string} documentType - Document type (optional for auto-detect)
 * @param {string} batchId - Batch ID for logging
 * @param {Object} user - User object
 * @returns {Promise<Object>} Scan result with verification ID and extracted data
 */
async function processDocumentScan(file, patientId, documentType, batchId, user) {
  const t0 = Date.now();
  
  console.log(`[SCAN] 📸 File: ${file.originalname}`);
  console.log(`[SCAN]   - Size: ${file.size} bytes`);
  console.log(`[SCAN]   - Type: ${file.mimetype}`);
  console.log(`[SCAN]   - Path: ${file.path}`);
  console.log(`[SCAN] 👤 Patient ID: ${patientId || 'NOT PROVIDED'}`);
  console.log(`[SCAN] 📋 Document Type: ${documentType || 'NOT PROVIDED (will auto-detect)'}`);

  logh(batchId, `📸 Processing with LandingAI: ${file.originalname}`);
  if (patientId) {
    logh(batchId, `👤 Patient ID: ${patientId}`);
  }
  if (documentType) {
    logh(batchId, `📋 Document Type: ${documentType}`);
  }

  // Call LandingAI Scanner
  console.log('[SCAN] 🤖 Calling LandingAI scanner...');
  const scanResult = await landingAIScanner.scanDocument(file.path, documentType);

  console.log('[SCAN] 📊 LandingAI Response:');
  console.log(`[SCAN]   - Success: ${scanResult.success}`);
  console.log(`[SCAN]   - Document Type: ${scanResult.documentType}`);
  console.log(`[SCAN]   - Confidence: ${scanResult.confidence}`);
  console.log(`[SCAN]   - Engine: ${scanResult.engine}`);

  if (!scanResult.success) {
    console.log('[SCAN] ❌ LandingAI failed:', scanResult.error);
    throw new Error(scanResult.error || 'LandingAI scanning failed');
  }

  console.log('[SCAN] ✅ LandingAI extraction successful');
  console.log('[SCAN] 📦 Extracted Data Keys:', Object.keys(scanResult.extractedData || {}));

  logh(batchId, `✅ LandingAI extraction complete: ${scanResult.documentType}`);

  let savedImagePath = null;
  let verificationId = null;

  // Save to database if patient ID provided
  if (patientId) {
    console.log('[SCAN] 💾 Saving to database...');
    
    // Read file buffer
    console.log('[SCAN] 📖 Reading file buffer...');
    const fileBuffer = await fs.readFile(file.path);
    console.log(`[SCAN] ✅ File buffer read: ${fileBuffer.length} bytes`);

    // Store PDF in MongoDB
    console.log('[SCAN] 📄 Creating PatientPDF document...');
    const patientPDF = new PatientPDF({
      patientId: patientId,
      title: `${scanResult.documentType} Document (Pending Verification)`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      data: fileBuffer,
      size: fileBuffer.length,
      uploadedAt: new Date()
    });

    await patientPDF.save();
    const pdfIdString = patientPDF._id.toString();
    savedImagePath = pdfIdString;

    console.log(`[SCAN] ✅ PatientPDF saved: ${pdfIdString}`);
    logh(batchId, `💾 Document saved: ${pdfIdString}`);

    // Create verification session
    const sessionId = `verify-${patientId}-${Date.now()}`;
    console.log(`[SCAN] 🔑 Session ID: ${sessionId}`);

    // Convert extracted data to verification rows
    console.log('[SCAN] 🔄 Converting extracted data to rows...');
    const dataRows = convertExtractedDataToRows(scanResult.extractedData, scanResult.documentType);

    console.log(`[SCAN] ✅ Data rows generated: ${dataRows.length}`);
    console.log('[SCAN] 📋 Row details:', dataRows.map(r => ({ field: r.fieldName, label: r.displayLabel, hasValue: !!r.currentValue })));

    // Save to verification collection
    console.log('[SCAN] 💾 Creating verification document...');
    const verificationDoc = new ScannedDataVerification({
      patientId: patientId,
      sessionId: sessionId,
      documentType: scanResult.documentType,
      pdfId: pdfIdString,
      fileName: file.originalname,
      extractedData: scanResult.extractedData,
      verificationStatus: 'pending',
      dataRows: dataRows,
      metadata: {
        ocrEngine: 'landingai-ade',
        ocrConfidence: scanResult.confidence || 0.95,
        processingTimeMs: Date.now() - t0,
        markdown: scanResult.markdown || ''
      },
      uploadedBy: user?._id || null
    });

    console.log('[SCAN] 💾 Saving verification document...');
    await verificationDoc.save();
    verificationId = verificationDoc._id.toString();

    console.log(`[SCAN] ✅ Verification document saved: ${verificationId}`);
    logh(batchId, `✅ Created verification session: ${sessionId} (ID: ${verificationId})`);
  }

  const processingTime = Date.now() - t0;
  console.log(`[SCAN] ⏱️ Total processing time: ${processingTime}ms`);

  return {
    success: true,
    documentType: scanResult.documentType,
    extractedData: scanResult.extractedData,
    confidence: scanResult.confidence,
    verificationId,
    savedImagePath,
    processingTimeMs: processingTime,
    markdown: scanResult.markdown
  };
}

/**
 * Check if scanner is initialized
 * @returns {boolean} True if scanner is ready
 */
function isScannerReady() {
  return landingAIScanner !== null;
}

module.exports = {
  processDocumentScan,
  isScannerReady,
  landingAIScanner
};

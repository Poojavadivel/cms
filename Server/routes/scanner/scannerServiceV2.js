/**
 * scanner/scannerServiceV2.js
 * Enhanced scanner service with section-level document processing
 * Professional-grade like Epic Systems and athenahealth
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
  console.log('[scanner-landingai-v2] ✅ LandingAI ADE initialized with section-level processing');
} catch (err) {
  console.log('[scanner-landingai-v2] ⚠️ LandingAI ADE disabled (missing API key)');
}

/**
 * Process document scan with SECTION-LEVEL extraction
 * @param {Object} file - Uploaded file object
 * @param {string} patientId - Patient ID
 * @param {string} documentType - Document type (optional for auto-detect)
 * @param {string} batchId - Batch ID for logging
 * @param {Object} user - User object
 * @returns {Promise<Object>} Scan result with verification ID and extracted data
 */
async function processDocumentScanV2(file, patientId, documentType, batchId, user) {
  const t0 = Date.now();
  
  console.log(`[SCAN-V2] 📸 File: ${file.originalname}`);
  console.log(`[SCAN-V2]   - Size: ${file.size} bytes`);
  console.log(`[SCAN-V2]   - Type: ${file.mimetype}`);
  console.log(`[SCAN-V2] 👤 Patient ID: ${patientId || 'NOT PROVIDED'}`);
  console.log(`[SCAN-V2] 🚀 Using SECTION-LEVEL PROCESSING`);

  logh(batchId, `📸 Processing with Section-Level Extraction: ${file.originalname}`);
  if (patientId) {
    logh(batchId, `👤 Patient ID: ${patientId}`);
  }

  // ============================================================================
  // STEP 1: PARSE document to markdown
  // ============================================================================
  console.log('[SCAN-V2] 🤖 Step 1: Calling LandingAI PARSE...');
  logh(batchId, '🤖 Step 1: Parsing document to markdown');
  
  const parseResult = await landingAIScanner.parseDocument(file.path);
  const markdownText = parseResult.markdown;
  
  console.log(`[SCAN-V2] ✅ Parsed ${markdownText.length} characters of markdown`);
  logh(batchId, `✅ Parsed ${markdownText.length} characters`);

  // ============================================================================
  // STEP 2: DETECT SECTIONS
  // ============================================================================
  console.log('[SCAN-V2] 📄 Step 2: Detecting sections...');
  logh(batchId, '📄 Step 2: Detecting document sections');
  
  const sectionData = detectSections(markdownText, batchId);
  const { sections, documentTypes, primaryType, sectionCount } = sectionData;
  
  console.log(`[SCAN-V2] 📋 Detected ${sectionCount} sections:`);
  sections.forEach((section, idx) => {
    console.log(`[SCAN-V2]    ${idx + 1}. ${section.heading} → ${section.sectionType} (Schema: ${section.schemaType})`);
  });
  
  logh(batchId, `✅ Detected ${sectionCount} sections, Primary type: ${primaryType}`);

  // ============================================================================
  // STEP 3: EXTRACT each section with appropriate schema
  // ============================================================================
  console.log('[SCAN-V2] 🔍 Step 3: Extracting data per section...');
  logh(batchId, '🔍 Step 3: Extracting data per section');
  
  const sectionResults = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`[SCAN-V2] 🔍 Extracting section ${i + 1}/${sectionCount}: ${section.heading}`);
    logh(batchId, `  → ${section.heading} (${section.schemaType})`);
    
    try {
      // Get appropriate schema for this section
      const schema = landingAIScanner.getSchema(section.schemaType);
      
      // Extract data from section content
      const extractResult = await landingAIScanner.extractData(section.content, schema);
      
      sectionResults.push({
        ...section,
        extractedData: extractResult,
        success: true
      });
      
      console.log(`[SCAN-V2] ✅ Section extracted: ${section.heading}`);
    } catch (error) {
      console.log(`[SCAN-V2] ⚠️ Section extraction failed: ${section.heading} - ${error.message}`);
      sectionResults.push({
        ...section,
        extractedData: {},
        success: false,
        error: error.message
      });
    }
  }
  
  logh(batchId, `✅ Extracted ${sectionResults.filter(r => r.success).length}/${sectionCount} sections successfully`);

  // ============================================================================
  // STEP 4: MERGE section data
  // ============================================================================
  console.log('[SCAN-V2] 🔗 Step 4: Merging section data...');
  const mergedData = mergeSectionData(sectionResults);
  
  console.log('[SCAN-V2] 📊 Merged data summary:');
  console.log(`[SCAN-V2]   - Prescriptions: ${mergedData.prescriptions.length}`);
  console.log(`[SCAN-V2]   - Lab Reports: ${mergedData.labReports.length}`);
  console.log(`[SCAN-V2]   - Medical History: ${mergedData.medicalHistory.length}`);
  console.log(`[SCAN-V2]   - Billing: ${mergedData.billing.length}`);
  
  logh(batchId, `✅ Merged: ${mergedData.prescriptions.length} Rx, ${mergedData.labReports.length} Labs, ${mergedData.medicalHistory.length} History`);

  // ============================================================================
  // STEP 5: Save to database if patient ID provided
  // ============================================================================
  let savedImagePath = null;
  let verificationId = null;

  if (patientId) {
    console.log('[SCAN-V2] 💾 Step 5: Saving to database...');
    
    // Read file buffer
    const fileBuffer = await fs.readFile(file.path);
    console.log(`[SCAN-V2] ✅ File buffer read: ${fileBuffer.length} bytes`);

    // Store PDF in MongoDB
    const patientPDF = new PatientPDF({
      patientId: patientId,
      title: `Multi-Section Document (${sectionCount} sections)`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      data: fileBuffer,
      size: fileBuffer.length,
      uploadedAt: new Date()
    });

    await patientPDF.save();
    const pdfIdString = patientPDF._id.toString();
    savedImagePath = pdfIdString;

    console.log(`[SCAN-V2] ✅ PatientPDF saved: ${pdfIdString}`);
    logh(batchId, `💾 Document saved: ${pdfIdString}`);

    // Create verification session with SECTION DATA
    const sessionId = `verify-sections-${patientId}-${Date.now()}`;
    console.log(`[SCAN-V2] 🔑 Session ID: ${sessionId}`);

    // Convert ALL sections to verification rows
    const allDataRows = [];
    
    sectionResults.forEach((sectionResult, idx) => {
      if (sectionResult.success && sectionResult.extractedData) {
        console.log(`[SCAN-V2] 🔄 Converting section ${idx + 1}: ${sectionResult.heading}`);
        
        // Add section header row
        allDataRows.push({
          fieldName: `section_header_${idx}`,
          displayLabel: `━━━ SECTION ${idx + 1}: ${sectionResult.heading.toUpperCase()} ━━━`,
          originalValue: sectionResult.heading,
          currentValue: sectionResult.heading,
          dataType: 'section_header',
          category: 'section',
          confidence: 1.0,
          sectionIndex: idx,
          sectionType: sectionResult.sectionType,
          schemaType: sectionResult.schemaType,
          isEditable: false
        });
        
        // Convert section data to rows
        try {
          const sectionRows = convertExtractedDataToRows(
            sectionResult.extractedData, 
            sectionResult.schemaType
          );
          
          // Mark rows with section info
          sectionRows.forEach(row => {
            row.sectionIndex = idx;
            row.sectionHeading = sectionResult.heading;
            row.sectionType = sectionResult.sectionType;
          });
          
          allDataRows.push(...sectionRows);
          console.log(`[SCAN-V2] ✅ Added ${sectionRows.length} rows from section ${idx + 1}`);
        } catch (error) {
          console.log(`[SCAN-V2] ⚠️ Failed to convert section ${idx + 1}: ${error.message}`);
        }
      }
    });

    console.log(`[SCAN-V2] ✅ Total verification rows: ${allDataRows.length}`);
    
    // PROFESSIONAL IMPROVEMENT: Global deduplication of lab tests
    const deduplicatedRows = deduplicateLabTests(allDataRows);
    console.log(`[SCAN-V2] 🧹 After global deduplication: ${deduplicatedRows.length} rows (removed ${allDataRows.length - deduplicatedRows.length} duplicates)`);
    
    // PROFESSIONAL IMPROVEMENT: Determine accurate document type
    const accurateDocType = determineDocumentType(documentTypes, sectionCount);
    console.log(`[SCAN-V2] 📋 Document type: ${accurateDocType} (contains ${documentTypes.join(', ')})`);

    // Save to verification collection
    const verificationDoc = new ScannedDataVerification({
      patientId: patientId,
      sessionId: sessionId,
      documentType: accurateDocType,
      pdfId: pdfIdString,
      fileName: file.originalname,
      extractedData: mergedData, // Store merged section data
      verificationStatus: 'pending',
      dataRows: deduplicatedRows,
      metadata: {
        ocrEngine: 'landingai-ade-v2',
        ocrConfidence: 0.95,
        processingTimeMs: Date.now() - t0,
        markdown: markdownText.substring(0, 5000),
        sectionCount: sectionCount,
        sections: sections.map(s => ({
          heading: s.heading,
          sectionType: s.sectionType,
          schemaType: s.schemaType,
          startLine: s.startLine,
          endLine: s.endLine
        })),
        documentTypes: documentTypes
      },
      uploadedBy: user?._id || null
    });

    await verificationDoc.save();
    verificationId = verificationDoc._id.toString();

    console.log(`[SCAN-V2] ✅ Verification document saved: ${verificationId}`);
    logh(batchId, `✅ Created section-based verification: ${sessionId} (ID: ${verificationId})`);
  }

  const processingTime = Date.now() - t0;
  console.log(`[SCAN-V2] ⏱️ Total processing time: ${processingTime}ms`);
  logh(batchId, `⏱️ Completed in ${processingTime}ms`);

  // ============================================================================
  // CONFIDENCE-BASED AUTOMATION
  // ============================================================================
  
  // Calculate overall confidence score
  const sectionConfidences = sections.map(s => s.confidence || 0.8);
  const avgConfidence = sectionConfidences.reduce((a, b) => a + b, 0) / sectionConfidences.length;
  
  let verificationRequired = true;
  let autoSaveReason = null;
  
  if (avgConfidence >= 0.92) {
    // HIGH CONFIDENCE: Auto-save without verification
    verificationRequired = false;
    autoSaveReason = 'High confidence (≥92%)';
    console.log('[SCAN-V2] 🎯 HIGH CONFIDENCE: Auto-save enabled');
    logh(batchId, `🎯 Auto-save: Confidence ${(avgConfidence * 100).toFixed(1)}%`);
  } else if (avgConfidence >= 0.75) {
    // MEDIUM CONFIDENCE: Requires verification
    verificationRequired = true;
    console.log('[SCAN-V2] ⚠️ MEDIUM CONFIDENCE: Verification required');
    logh(batchId, `⚠️ Verification required: Confidence ${(avgConfidence * 100).toFixed(1)}%`);
  } else {
    // LOW CONFIDENCE: Flag for review
    verificationRequired = true;
    autoSaveReason = 'Low confidence (<75%) - needs careful review';
    console.log('[SCAN-V2] ❌ LOW CONFIDENCE: Manual review needed');
    logh(batchId, `❌ Low confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  }

  return {
    success: true,
    documentType: primaryType,
    documentTypes: documentTypes,
    sectionCount: sectionCount,
    sections: sections.map(s => ({
      heading: s.heading,
      sectionType: s.sectionType,
      schemaType: s.schemaType,
      confidence: s.confidence,
      detectionMethod: s.detectionMethod
    })),
    extractedData: mergedData,
    confidence: avgConfidence,
    sectionConfidences: sectionConfidences,
    verificationId,
    verificationRequired,
    autoSaveReason,
    savedImagePath,
    processingTimeMs: processingTime,
    markdown: markdownText.substring(0, 2000),
    processingVersion: 'v2-section-level'
  };
}

/**
 * Check if scanner is initialized
 * @returns {boolean} True if scanner is ready
 */
function isScannerReady() {
  return landingAIScanner !== null;
}

/**
 * PROFESSIONAL IMPROVEMENT: Global deduplication of lab test results
 * Deduplicates lab tests across ALL sections (not just per section)
 * @param {Array} rows - All verification rows
 * @returns {Array} Deduplicated rows
 */
function deduplicateLabTests(rows) {
  const seenLabTests = new Map(); // key: testName_value
  const deduplicatedRows = [];
  let duplicateCount = 0;
  
  rows.forEach((row) => {
    // Check if this is a lab result row
    if (row.category === 'lab_results' && row.dataType === 'object' && row.originalValue) {
      const labResult = row.originalValue;
      const testKey = `${labResult.testName || 'unknown'}_${labResult.value || ''}`.toLowerCase();
      
      if (!seenLabTests.has(testKey)) {
        // First occurrence - keep it
        seenLabTests.set(testKey, row);
        deduplicatedRows.push(row);
      } else {
        // Duplicate - skip it
        duplicateCount++;
        console.log(`[SCAN-V2] 🧹 Skipping duplicate lab test: ${labResult.testName} = ${labResult.value}`);
      }
    } else {
      // Not a lab result - always keep
      deduplicatedRows.push(row);
    }
  });
  
  if (duplicateCount > 0) {
    console.log(`[SCAN-V2] 🧹 Removed ${duplicateCount} duplicate lab tests globally`);
  }
  
  return deduplicatedRows;
}

/**
 * PROFESSIONAL IMPROVEMENT: Determine accurate document type
 * For multi-section documents, use MULTI_SECTION_MEDICAL_RECORD
 * @param {Array} documentTypes - Array of detected document types
 * @param {number} sectionCount - Number of sections
 * @returns {string} Accurate document type
 */
function determineDocumentType(documentTypes, sectionCount) {
  // If only one type, use it
  if (documentTypes.length === 1) {
    return documentTypes[0];
  }
  
  // If multiple types (multi-section document)
  if (documentTypes.length > 1) {
    return 'MULTI_SECTION_MEDICAL_RECORD';
  }
  
  // Fallback
  return 'MEDICAL_HISTORY';
}

module.exports = {
  processDocumentScanV2,
  isScannerReady,
  landingAIScanner
};

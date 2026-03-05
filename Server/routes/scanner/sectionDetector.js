/**
 * scanner/sectionDetector.js
 * Section-level document processing for multi-section medical documents
 * Professional-grade extraction like Epic Systems and athenahealth
 */

const { logh } = require('./utils');

/**
 * Section type patterns with keywords
 */
const SECTION_PATTERNS = {
  CONSULTATION: {
    keywords: ['consultation', 'visit notes', 'clinical notes', 'doctor notes', 'examination', 'assessment'],
    schema_type: 'MEDICAL_HISTORY'
  },
  PRESCRIPTION: {
    keywords: ['prescription', 'rx', 'medication', 'medicines prescribed', 'drug', 'treatment plan'],
    schema_type: 'PRESCRIPTION'
  },
  LAB_REPORT: {
    keywords: ['lab report', 'laboratory', 'test results', 'pathology', 'investigation', 'diagnostic report'],
    schema_type: 'LAB_REPORT'
  },
  DISCHARGE_SUMMARY: {
    keywords: ['discharge', 'discharge summary', 'hospital discharge', 'discharge note'],
    schema_type: 'MEDICAL_HISTORY'
  },
  BILLING: {
    keywords: ['billing', 'invoice', 'payment', 'charges', 'bill summary', 'fees'],
    schema_type: 'BILLING'
  },
  RADIOLOGY: {
    keywords: ['radiology', 'x-ray', 'ct scan', 'mri', 'ultrasound', 'imaging'],
    schema_type: 'LAB_REPORT'
  },
  VITALS: {
    keywords: ['vitals', 'vital signs', 'bp', 'blood pressure', 'temperature', 'pulse'],
    schema_type: 'MEDICAL_HISTORY'
  },
  MEDICAL_HISTORY: {
    keywords: ['medical history', 'past history', 'patient history', 'case history'],
    schema_type: 'MEDICAL_HISTORY'
  }
};

/**
 * Detect section type from heading text
 * @param {string} heading - Section heading text
 * @returns {Object} { sectionType, schemaType }
 */
function detectSectionType(heading) {
  const headingLower = heading.toLowerCase().trim();
  
  for (const [sectionType, config] of Object.entries(SECTION_PATTERNS)) {
    for (const keyword of config.keywords) {
      if (headingLower.includes(keyword)) {
        return {
          sectionType,
          schemaType: config.schema_type
        };
      }
    }
  }
  
  return {
    sectionType: 'GENERAL',
    schemaType: 'MEDICAL_HISTORY'
  };
}

/**
 * ADVANCED: Content-based section classification
 * Works even when documents have NO HEADINGS
 * @param {string} content - Section content text
 * @returns {Object} { sectionType, schemaType, confidence }
 */
function classifySectionByContent(content) {
  const contentLower = content.toLowerCase();
  
  // IMPROVED: Scoring system for accurate classification
  const scores = {
    PRESCRIPTION: 0,
    LAB_REPORT: 0,
    CONSULTATION: 0,
    BILLING: 0,
    VITALS: 0
  };
  
  // Prescription indicators (medicines, dosages)
  const prescriptionIndicators = [
    { pattern: /tab\.|cap\.|syrup|injection|cream|ointment/i, weight: 3 },
    { pattern: /\d+\s*mg|\d+\s*ml/i, weight: 2 },
    { pattern: /\d-\d-\d|morning|evening|night/i, weight: 2 },
    { pattern: /before food|after food|with food/i, weight: 2 },
    { pattern: /rx:|prescribed|medication|medicine/i, weight: 3 }
  ];
  
  // Lab report indicators (test names, values with units)
  const labIndicators = [
    { pattern: /hemoglobin|hb|glucose|cholesterol|creatinine|urea/i, weight: 4 },
    { pattern: /\d+\.?\d*\s*(mg\/dl|g\/dl|mmol\/l|iu\/l)/i, weight: 4 },
    { pattern: /test.*result|investigation|pathology/i, weight: 3 },
    { pattern: /normal range|reference range/i, weight: 3 },
    { pattern: /low|high|normal.*(?:range|value)/i, weight: 2 }
  ];
  
  // Consultation/Medical History indicators
  const consultationIndicators = [
    { pattern: /doctor.*:|physician.*:|consultant.*:/i, weight: 3 },
    { pattern: /department.*:|specialty.*:/i, weight: 2 },
    { pattern: /complaint|symptoms|diagnosis/i, weight: 3 },
    { pattern: /examination|assessment|clinical notes/i, weight: 3 },
    { pattern: /patient.*complains|presented with/i, weight: 2 }
  ];
  
  // IMPROVED: Billing indicators with higher weights
  const billingIndicators = [
    { pattern: /bill|invoice|receipt|payment|charges/i, weight: 4 },
    { pattern: /rs\.|inr|rupees|total.*amount/i, weight: 3 },
    { pattern: /pharmacy.*charges|surgical.*charges|consultation.*fee/i, weight: 5 },
    { pattern: /issue no|bill no|receipt no/i, weight: 4 },
    { pattern: /paid|due|balance|advance/i, weight: 2 },
    { pattern: /cgst|sgst|gst|tax/i, weight: 3 }
  ];
  
  // Vitals indicators
  const vitalsIndicators = [
    { pattern: /bp|blood pressure|pulse|temperature|spo2/i, weight: 3 },
    { pattern: /\d+\/\d+\s*mmhg/i, weight: 3 },
    { pattern: /bpm|beats per minute/i, weight: 2 },
    { pattern: /°c|°f|celsius|fahrenheit/i, weight: 2 }
  ];
  
  // Calculate weighted scores
  prescriptionIndicators.forEach(({ pattern, weight }) => {
    if (pattern.test(content)) scores.PRESCRIPTION += weight;
  });
  
  labIndicators.forEach(({ pattern, weight }) => {
    if (pattern.test(content)) scores.LAB_REPORT += weight;
  });
  
  consultationIndicators.forEach(({ pattern, weight }) => {
    if (pattern.test(content)) scores.CONSULTATION += weight;
  });
  
  billingIndicators.forEach(({ pattern, weight }) => {
    if (pattern.test(content)) scores.BILLING += weight;
  });
  
  vitalsIndicators.forEach(({ pattern, weight }) => {
    if (pattern.test(content)) scores.VITALS += weight;
  });
  
  // Get highest score
  let maxScore = 0;
  let detectedType = 'GENERAL';
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type;
    }
  }
  
  // Calculate confidence (normalize to 0-1)
  const confidence = Math.min(maxScore / 10, 1.0); // 10+ points = high confidence
  
  // Map to schema type
  const schemaMapping = {
    PRESCRIPTION: 'PRESCRIPTION',
    LAB_REPORT: 'LAB_REPORT',
    CONSULTATION: 'MEDICAL_HISTORY',
    BILLING: 'BILLING',
    VITALS: 'MEDICAL_HISTORY',
    GENERAL: 'MEDICAL_HISTORY'
  };
  
  return {
    sectionType: detectedType,
    schemaType: schemaMapping[detectedType],
    confidence: confidence,
    score: maxScore,
    scores: scores // For debugging
  };
}

/**
 * Split markdown into sections based on headings
 * @param {string} markdown - Markdown text from LandingAI PARSE
 * @returns {Array} Array of section objects
 */
function splitIntoSections(markdown) {
  const sections = [];
  const lines = markdown.split('\n');
  
  let currentSection = null;
  let currentContent = [];
  let lineNumber = 0;
  
  for (const line of lines) {
    lineNumber++;
    
    // Detect markdown headings (# or ##)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    
    if (headingMatch) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        currentSection.endLine = lineNumber - 1;
        if (currentSection.content.length > 0) {
          
          // ENHANCEMENT: Use content-based classification for validation
          const contentClassification = classifySectionByContent(currentSection.content);
          
          // If content classification has higher confidence, use it
          if (contentClassification.confidence > 0.6) {
            currentSection.sectionType = contentClassification.sectionType;
            currentSection.schemaType = contentClassification.schemaType;
            currentSection.detectionMethod = 'content-based';
            currentSection.confidence = contentClassification.confidence;
          } else {
            currentSection.detectionMethod = 'heading-based';
            currentSection.confidence = 0.8;
          }
          
          sections.push(currentSection);
        }
      }
      
      // Start new section
      const heading = headingMatch[2].trim();
      const { sectionType, schemaType } = detectSectionType(heading);
      
      currentSection = {
        heading,
        sectionType,
        schemaType,
        startLine: lineNumber,
        content: ''
      };
      currentContent = [];
    } else {
      // Add content to current section
      currentContent.push(line);
    }
  }
  
  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    currentSection.endLine = lineNumber;
    if (currentSection.content.length > 0) {
      
      // ENHANCEMENT: Use content-based classification
      const contentClassification = classifySectionByContent(currentSection.content);
      
      if (contentClassification.confidence > 0.6) {
        currentSection.sectionType = contentClassification.sectionType;
        currentSection.schemaType = contentClassification.schemaType;
        currentSection.detectionMethod = 'content-based';
        currentSection.confidence = contentClassification.confidence;
      } else {
        currentSection.detectionMethod = 'heading-based';
        currentSection.confidence = 0.8;
      }
      
      sections.push(currentSection);
    }
  }
  
  // ENHANCEMENT: If no sections found (no headings), split by content blocks
  if (sections.length === 0) {
    return splitByContentBlocks(markdown);
  }
  
  return sections;
}

/**
 * ADVANCED: Split document by content blocks when NO HEADINGS exist
 * @param {string} markdown - Markdown text
 * @returns {Array} Array of section objects
 */
function splitByContentBlocks(markdown) {
  const sections = [];
  
  // Split by double line breaks (paragraph blocks)
  const blocks = markdown.split(/\n\s*\n/).filter(block => block.trim().length > 50);
  
  blocks.forEach((block, index) => {
    const classification = classifySectionByContent(block);
    
    // Only create section if confidence is reasonable
    if (classification.confidence > 0.4) {
      sections.push({
        heading: `${classification.sectionType} (Auto-detected)`,
        sectionType: classification.sectionType,
        schemaType: classification.schemaType,
        startLine: index * 10 + 1,
        endLine: index * 10 + 10,
        content: block.trim(),
        detectionMethod: 'content-block',
        confidence: classification.confidence,
        matchCount: classification.matchCount
      });
    }
  });
  
  // If still nothing detected, treat entire document as one section
  if (sections.length === 0) {
    const classification = classifySectionByContent(markdown);
    sections.push({
      heading: 'Document',
      sectionType: classification.sectionType,
      schemaType: classification.schemaType,
      startLine: 1,
      endLine: markdown.split('\n').length,
      content: markdown.trim(),
      detectionMethod: 'full-document',
      confidence: classification.confidence
    });
  }
  
  return sections;
}

/**
 * Process document with section-level detection
 * @param {string} markdown - Markdown from LandingAI PARSE
 * @param {string} batchId - Batch ID for logging
 * @returns {Object} { sections, documentTypes, primaryType }
 */
function detectSections(markdown, batchId) {
  logh(batchId, '📄 Starting section-level detection');
  
  const sections = splitIntoSections(markdown);
  
  logh(batchId, `📋 Detected ${sections.length} sections`);
  
  // Log each section
  sections.forEach((section, index) => {
    logh(batchId, `   ${index + 1}. ${section.heading} (${section.sectionType})`);
  });
  
  // Determine primary document type (most common schema type)
  const schemaTypeCounts = {};
  sections.forEach(section => {
    schemaTypeCounts[section.schemaType] = (schemaTypeCounts[section.schemaType] || 0) + 1;
  });
  
  const primaryType = Object.keys(schemaTypeCounts).reduce((a, b) => 
    schemaTypeCounts[a] > schemaTypeCounts[b] ? a : b
  );
  
  const documentTypes = [...new Set(sections.map(s => s.schemaType))];
  
  // IMPROVEMENT: Merge consecutive sections of the same type to reduce over-segmentation
  const mergedSections = mergeConsecutiveSections(sections);
  
  console.log(`[SECTION-DETECTOR] ✅ Merged ${sections.length} sections → ${mergedSections.length} sections`);
  
  return {
    sections: mergedSections,
    documentTypes,
    primaryType,
    sectionCount: mergedSections.length,
    originalSectionCount: sections.length
  };
}

/**
 * PROFESSIONAL IMPROVEMENT: Merge consecutive sections of the same type
 * Reduces API calls and improves processing speed
 * @param {Array} sections - Array of detected sections
 * @returns {Array} Merged sections
 */
function mergeConsecutiveSections(sections) {
  if (sections.length === 0) return sections;
  
  const merged = [];
  let currentGroup = { ...sections[0] };
  
  for (let i = 1; i < sections.length; i++) {
    const prev = sections[i - 1];
    const current = sections[i];
    
    // Merge if same section type AND same schema type
    if (current.sectionType === prev.sectionType && current.schemaType === prev.schemaType) {
      // Merge content
      currentGroup.content += '\n\n' + current.content;
      currentGroup.endLine = current.endLine;
      
      // FIX: Clean ALL labels (Auto-detected, Merged, etc.) and add only (Merged) once
      if (!currentGroup.heading.includes('(Merged)')) {
        // Remove all existing suffixes
        const cleanHeading = currentGroup.heading
          .replace(/\s*\(Auto-detected\)\s*/gi, '')
          .replace(/\s*\(Merged\)\s*/gi, '')
          .trim();
        currentGroup.heading = `${cleanHeading} (Merged)`;
      }
      
      // Average confidence if available
      if (current.confidence && currentGroup.confidence) {
        currentGroup.confidence = (currentGroup.confidence + current.confidence) / 2;
      }
    } else {
      // Different type - clean and save current group
      // Clean heading before pushing
      if (!merged.length) {
        // First section - clean it
        const cleanHeading = currentGroup.heading
          .replace(/\s*\(Auto-detected\)\s*/gi, '')
          .trim();
        currentGroup.heading = cleanHeading;
      }
      
      merged.push(currentGroup);
      currentGroup = { ...current };
    }
  }
  
  // Don't forget the last group - clean it too
  if (currentGroup) {
    const cleanHeading = currentGroup.heading
      .replace(/\s*\(Auto-detected\)\s*/gi, '')
      .replace(/\s*\(Merged\)\s*/gi, '')
      .trim();
    
    // Add (Merged) only if it was actually merged
    if (currentGroup.heading.includes('(Merged)')) {
      currentGroup.heading = `${cleanHeading} (Merged)`;
    } else {
      currentGroup.heading = cleanHeading;
    }
    
    merged.push(currentGroup);
  }
  
  return merged;
}

/**
 * Merge extracted data from multiple sections
 * @param {Array} sectionResults - Array of extraction results per section
 * @returns {Object} Merged data organized by section type
 */
function mergeSectionData(sectionResults) {
  const merged = {
    sections: [],
    prescriptions: [],
    labReports: [],
    medicalHistory: [],
    billing: [],
    general: []
  };
  
  sectionResults.forEach(result => {
    const sectionData = {
      heading: result.heading,
      sectionType: result.sectionType,
      schemaType: result.schemaType,
      extractedData: result.extractedData,
      startLine: result.startLine,
      endLine: result.endLine
    };
    
    merged.sections.push(sectionData);
    
    // Organize by type
    switch (result.schemaType) {
      case 'PRESCRIPTION':
        merged.prescriptions.push(result.extractedData);
        break;
      case 'LAB_REPORT':
        merged.labReports.push(result.extractedData);
        break;
      case 'MEDICAL_HISTORY':
        merged.medicalHistory.push(result.extractedData);
        break;
      case 'BILLING':
        merged.billing.push(result.extractedData);
        break;
      default:
        merged.general.push(result.extractedData);
    }
  });
  
  return merged;
}

module.exports = {
  detectSections,
  splitIntoSections,
  detectSectionType,
  mergeSectionData,
  SECTION_PATTERNS
};

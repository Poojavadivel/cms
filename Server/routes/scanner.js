const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const auth = require('../Middleware/Auth'); // Add authentication

const {
  Patient, LabReport, PatientPDF, startSession
} = require('../Models'); // adjust path if needed

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
const CONFIG = {
  MAX_FILE_SIZE: 12 * 1024 * 1024, // 12MB
  MAX_FILES_PER_UPLOAD: 10,
  MAX_LINES_FOR_NAME_SEARCH: 5,
  REGEX_TIMEOUT_MS: 1000,
  GEMINI_MODEL: 'gemini-2.5-flash',
  SUPPORTED_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  
  // New: Quality thresholds for extraction
  QUALITY_THRESHOLD_HIGH: 60,
  QUALITY_THRESHOLD_MEDIUM: 40,
  
  // Gemini extraction settings
  GEMINI_MAX_RETRIES: 2,
  GEMINI_TEMPERATURE: 0.1, // Low temperature for consistent extraction
};

// ============================================================================
// JSON SCHEMA FOR GEMINI STRUCTURED EXTRACTION
// ============================================================================
const EXTRACTION_SCHEMA = {
  patient: {
    firstName: "string (required)",
    lastName: "string (optional)",
    dateOfBirth: "string ISO format YYYY-MM-DD (optional)",
    age: "number (optional)",
    gender: "string: Male/Female/Other (optional)",
    phone: "string with country code (optional)",
    email: "string (optional)",
    address: {
      line1: "string (optional)",
      city: "string (optional)",
      state: "string (optional)",
      pincode: "string (optional)",
      country: "string (optional)"
    },
    mrNo: "string - Medical Record Number (optional)",
    labId: "string - Lab ID/Sample ID (optional)"
  },
  labReport: {
    testType: "string - Type of test (e.g., Complete Blood Count)",
    testDate: "string ISO datetime (optional)",
    reportedDate: "string ISO datetime (optional)",
    labName: "string - Name of laboratory (optional)",
    doctorName: "string - Referring doctor (optional)",
    results: [
      {
        testName: "string - Name of the test parameter",
        value: "number - Numeric value",
        unit: "string - Unit of measurement",
        normalRange: "string - Normal range as text",
        normalRangeMin: "number - Minimum normal value (optional)",
        normalRangeMax: "number - Maximum normal value (optional)",
        flag: "string - Normal/High/Low/Critical",
        category: "string - Test category (optional)"
      }
    ],
    notes: "string - Any notes or comments (optional)",
    interpretation: "string - Overall interpretation (optional)",
    technician: "string - Lab technician name (optional)",
    verifiedBy: "string - Verified by (optional)"
  }
};


/**
 * Normalizes phone numbers to international format
 * @param {string} raw - Raw phone number input
 * @returns {string|null} - Normalized phone number or null
 */
function normalizePhone(raw) {
  if (!raw) return null;
  
  try {
    let s = String(raw).trim();
    
    // Remove common separators
    s = s.replace(/[.\-()\s]/g, '');
    
    // Remove non-digit characters except leading +
    s = s.replace(/(?!^\+)\D/g, '');
    
    // FIXED: Only remove leading zeros if not part of international code
    // Don't strip leading zeros blindly as some country codes start with 0
    if (!s.startsWith('+') && s.startsWith('0')) {
      s = s.replace(/^0+/, '');
    }
    
    const digits = s.replace(/\D/g, '');
    
    // Indian 10-digit number
    if (!s.startsWith('+') && digits.length === 10) {
      return '+91' + digits;
    }
    
    // International number with +
    if (s.startsWith('+') && digits.length >= 8 && digits.length <= 15) {
      return '+' + digits;
    }
    
    // International number without +
    if (!s.startsWith('+') && digits.length >= 8 && digits.length <= 15) {
      return '+' + digits;
    }
    
    return null;
  } catch (e) {
    console.error('[normalizePhone] Error:', e.message);
    return null;
  }
}

/**
 * Multer configuration with memory storage
 * Note: Consider switching to disk storage for production to reduce memory usage
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE,
    files: CONFIG.MAX_FILES_PER_UPLOAD
  },
  fileFilter: (req, file, cb) => {
    const isValid = CONFIG.SUPPORTED_MIME_TYPES.includes(file.mimetype);
    if (!isValid) {
      return cb(new Error(`Only PDF/JPG/PNG allowed. Got: ${file.mimetype}`));
    }
    cb(null, true);
  }
});

// ============================================================================
// GOOGLE CLOUD VISION CLIENT INITIALIZATION
// ============================================================================
let visionClient = null;
(() => {
  try {
    console.log('[scanner:init] 🔍 Checking Vision configuration...');
    const raw = process.env.GCP_SERVICE_ACCOUNT;
    
    if (!raw) {
      console.warn('[scanner:init] ❌ GCP_SERVICE_ACCOUNT env missing → image OCR disabled (PDF text-only will still work)');
      return;
    }
    
    console.log('[scanner:init] ✅ GCP_SERVICE_ACCOUNT found, parsing...');
    const creds = JSON.parse(raw);

    // Fix private key newlines properly
    if (typeof creds.private_key === 'string') {
      creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }

    if (!creds.client_email || !creds.private_key) {
      console.warn('[scanner:init] ⚠️ Missing client_email or private_key in GCP_SERVICE_ACCOUNT → OCR disabled');
      return;
    }

    console.log('[scanner:init] 🧠 Initializing Vision client with project:', creds.project_id);

    visionClient = new vision.ImageAnnotatorClient({
      credentials: creds,
      projectId: creds.project_id
    });

    console.log('[scanner:init] ✅ Vision client initialized successfully (project:', creds.project_id, ')');
  } catch (e) {
    console.error('[scanner:init] 💥 Failed to initialize Vision client:', e.message || e);
  }
})();

// ============================================================================
// GOOGLE GEMINI AI CLIENT INITIALIZATION
// ============================================================================
let genAI = null;
(() => {
  try {
    console.log('[scanner:init] 🔍 Checking Gemini configuration...');
    // FIXED: Use consistent env variable name (documented as GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY || process.env.Gemi_Api_Key;
    
    if (!apiKey) {
      console.warn('[scanner:init] ❌ GEMINI_API_KEY env missing → text enhancement disabled');
      return;
    }
    
    console.log('[scanner:init] ✅ GEMINI_API_KEY found, initializing...');
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('[scanner:init] ✅ Gemini client initialized successfully');
  } catch (e) {
    console.error('[scanner:init] 💥 Failed to initialize Gemini client:', e.message || e);
  }
})();

// ============================================================================
// GEMINI STRUCTURED EXTRACTION FUNCTIONS (NEW APPROACH)
// ============================================================================

/**
 * Extract structured data from OCR text using Gemini AI
 * This is the NEW approach - Gemini returns properly formatted JSON
 * @param {string} ocrText - Raw OCR text from Google Vision
 * @param {string} batchId - Batch ID for logging
 * @returns {Promise<Object>} - Structured data with patient and labReport
 */
async function extractStructuredDataWithGemini(ocrText, batchId = '') {
  if (!genAI) {
    logh(batchId, '❌ Gemini client not configured, cannot extract structured data');
    return null;
  }

  if (!ocrText || ocrText.trim().length < 50) {
    logh(batchId, '⚠️ OCR text too short for meaningful extraction');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: CONFIG.GEMINI_MODEL,
      generationConfig: {
        temperature: CONFIG.GEMINI_TEMPERATURE,
        responseMimeType: "application/json",
      },
    });

    // Create the extraction prompt
    const prompt = `You are an expert medical lab report data extraction AI. Your task is to extract structured information from OCR text of medical lab reports.

**IMPORTANT RULES:**
1. Return ONLY valid JSON, no markdown, no explanations
2. Extract ALL test results with their values, units, and normal ranges
3. Parse dates in ISO format (YYYY-MM-DD for dates, full ISO for datetimes)
4. Normalize phone numbers to international format (e.g., +919876543210)
5. For gender, use exactly: "Male", "Female", or "Other"
6. For flag values, use exactly: "Normal", "High", "Low", or "Critical"
7. If information is missing or unclear, use null (don't guess or make up data)
8. Extract numeric values as numbers, not strings
9. For normal ranges, extract both the text version and min/max numbers if possible
10. Categorize tests into: "Hematology", "Biochemistry", "Serology", "Microbiology", "Pathology", or "Other"

**SCHEMA TO FOLLOW:**
${JSON.stringify(EXTRACTION_SCHEMA, null, 2)}

**EXTRACTION GUIDELINES:**
[Same as before...]

**OCR TEXT TO PARSE:**
${ocrText}

**OUTPUT (JSON only):**`;

    logh(batchId, `🤖 Calling Gemini for structured extraction (${ocrText.length} chars)...`);
    const startTime = Date.now();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();

    const extractionTime = Date.now() - startTime;
    logh(batchId, `✅ Gemini response received (${extractionTime}ms)`);

    // 🔍 DEBUG LOGGING — shows what Gemini actually sent back
    console.log("\n==============================");
    console.log("🔍 [Gemini RAW Response Start]");
    console.log(jsonText);
    console.log("🔍 [Gemini RAW Response End]");
    console.log("==============================\n");

    // Parse JSON response
    let structuredData;
    try {
      // Remove markdown code blocks if present
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      structuredData = JSON.parse(cleanJson);

      // ✅ Log parsed JSON
      console.log("✅ Parsed Structured Data (First 1KB):");
      console.log(JSON.stringify(structuredData, null, 2).substring(0, 1024));
      console.log("========================================\n");

    } catch (parseError) {
      logh(batchId, '❌ Failed to parse Gemini JSON response:', parseError.message);
      logh(batchId, 'Raw response:', jsonText.substring(0, 500));

      // Extra debugging info in console
      console.error("❌ JSON Parse Error:", parseError.message);
      console.error("🔴 Raw Gemini Text:", jsonText);
      return null;
    }

    // Validate the response structure
    const validation = validateGeminiResponse(structuredData, batchId);
    if (!validation.valid) {
      logh(batchId, '⚠️ Invalid Gemini response:', validation.errors);
      console.warn("⚠️ Gemini response validation errors:", validation.errors);
      return null;
    }

    // Calculate extraction quality
    const quality = calculateExtractionQuality(structuredData);

    logh(batchId, `📊 Extraction quality: ${quality.score}% (${quality.level})`);
    logh(batchId, `📋 Extracted: ${structuredData.patient?.firstName || 'Unknown'}, ${structuredData.labReport?.results?.length || 0} test results`);

    // ✅ Log summary in console
    console.log("📋 Gemini Extraction Summary:");
    console.log({
      firstName: structuredData.patient?.firstName,
      resultsCount: structuredData.labReport?.results?.length || 0,
      quality: quality,
    });
    console.log("========================================\n");

    // Add metadata
    structuredData.metadata = {
      ocrEngine: null, // Will be set by caller
      ocrConfidence: null, // Will be set by caller
      geminiModel: CONFIG.GEMINI_MODEL,
      extractionTimeMs: extractionTime,
      extractionQuality: quality.level,
      extractionScore: quality.score,
      rawOcrLength: ocrText.length,
      timestamp: new Date().toISOString(),
    };

    return structuredData;

  } catch (error) {
    logh(batchId, '💥 Gemini extraction error:', error.message || error);

    console.error("💥 Gemini extraction error (full):", error);

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      logh(batchId, '⚠️ API quota exceeded or rate limited');
    }

    return null;
  }
}


/**
 * Validate Gemini response structure
 * @param {Object} data - Gemini response data
 * @param {string} batchId - Batch ID for logging
 * @returns {Object} - Validation result {valid: boolean, errors: array}
 */
function validateGeminiResponse(data, batchId = '') {
  const errors = [];
  const warnings = [];

  // Check basic structure
  if (!data || typeof data !== 'object') {
    errors.push('Response is not an object');
    return { valid: false, errors, warnings };
  }

  // Validate patient section
  if (!data.patient) {
    errors.push('Missing patient section');
  } else {
    if (!data.patient.firstName || data.patient.firstName.trim().length === 0) {
      errors.push('Missing patient firstName');
    }

    // Validate gender enum if present
    if (data.patient.gender && !['Male', 'Female', 'Other'].includes(data.patient.gender)) {
      errors.push(`Invalid gender value: ${data.patient.gender}`);
    }

    // Validate dateOfBirth format if present (accept YYYY-MM-DD)
    if (data.patient.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(data.patient.dateOfBirth)) {
      errors.push(`Invalid dateOfBirth format: ${data.patient.dateOfBirth}`);
    }
  }

  // Validate labReport section
  if (!data.labReport) {
    errors.push('Missing labReport section');
  } else {
    if (!data.labReport.results || !Array.isArray(data.labReport.results)) {
      errors.push('Missing or invalid results array');
    } else if (data.labReport.results.length === 0) {
      errors.push('Empty results array');
    } else {
      // Validate each result
      data.labReport.results.forEach((result, index) => {
        // testName required
        if (!result.testName || String(result.testName).trim().length === 0) {
          errors.push(`Result ${index}: missing testName`);
        }

        // Distinguish between undefined (error) and explicit null (warning)
        if (typeof result.value === 'undefined') {
          errors.push(`Result ${index}: missing value`);
        } else if (result.value === null) {
          // Value legitimately missing/unreadable — warn but do not fail validation
          warnings.push(`Result ${index}: value is null (unreadable/missing)`);
        } else if (typeof result.value !== 'number') {
          // If the value is present but not a number, that's an error
          errors.push(`Result ${index}: value is not a number`);
        }

        // Validate flag enum if present (allow null/undefined)
        if (typeof result.flag !== 'undefined' && result.flag !== null) {
          if (!['Normal', 'High', 'Low', 'Critical'].includes(result.flag)) {
            errors.push(`Result ${index}: invalid flag value: ${result.flag}`);
          }
        }

        // Optionally: validate normalRangeMin/max if present (must be numbers or null)
        if (typeof result.normalRangeMin !== 'undefined' && result.normalRangeMin !== null && typeof result.normalRangeMin !== 'number') {
          errors.push(`Result ${index}: normalRangeMin is not a number`);
        }
        if (typeof result.normalRangeMax !== 'undefined' && result.normalRangeMax !== null && typeof result.normalRangeMax !== 'number') {
          errors.push(`Result ${index}: normalRangeMax is not a number`);
        }
      });
    }
  }

  const valid = errors.length === 0;

  if (!valid) {
    logh(batchId, `❌ Validation failed with ${errors.length} errors`);
    errors.forEach(e => logh(batchId, `  • ${e}`));
  } else if (warnings.length) {
    // valid but with warnings
    logh(batchId, `⚠️ Validation passed with ${warnings.length} warnings`);
    warnings.forEach(w => logh(batchId, `  • ${w}`));
  } else {
    logh(batchId, '✅ Validation passed with no errors or warnings');
  }

  return { valid, errors, warnings };
}


/**
 * Calculate extraction quality score
 * @param {Object} data - Structured data from Gemini
 * @returns {Object} - Quality assessment {score: number, level: string}
 */
function calculateExtractionQuality(data) {
  let score = 0;
  
  // Patient information scoring (40 points total)
  if (data.patient?.firstName && data.patient.firstName !== 'Unknown') {
    score += 15;
  }
  if (data.patient?.lastName && data.patient.lastName.length > 0) {
    score += 5;
  }
  if (data.patient?.dateOfBirth) {
    score += 10;
  }
  if (data.patient?.phone) {
    score += 5;
  }
  if (data.patient?.gender) {
    score += 5;
  }
  
  // Lab report scoring (60 points total)
  if (data.labReport?.testType) {
    score += 10;
  }
  if (data.labReport?.results?.length > 0) {
    score += 30;
    
    // Bonus for well-structured results
    const wellStructuredResults = data.labReport.results.filter(r => 
      r.testName && 
      typeof r.value === 'number' && 
      r.unit && 
      r.flag
    );
    
    const structureQuality = (wellStructuredResults.length / data.labReport.results.length) * 20;
    score += Math.round(structureQuality);
  }
  if (data.labReport?.testDate) {
    score += 5;
  }
  if (data.labReport?.labName) {
    score += 5;
  }
  
  // Determine quality level
  let level;
  if (score >= CONFIG.QUALITY_THRESHOLD_HIGH) {
    level = 'high';
  } else if (score >= CONFIG.QUALITY_THRESHOLD_MEDIUM) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return { score, level };
}

/**
 * OLD FUNCTION: Enhance OCR text using Google Gemini AI (DEPRECATED - Kept for fallback)
 * @param {string} text - Raw OCR text
 * @param {string} batchId - Batch ID for logging
 * @returns {Promise<string>} - Enhanced text
 */
async function enhanceTextWithGemini(text, batchId = '') {
  if (!genAI) {
    console.warn(`[scanner:gemini ${batchId}] Gemini client not configured, skipping enhancement`);
    return text;
  }
  
  if (!text || text.trim().length < 10) {
    console.warn(`[scanner:gemini ${batchId}] Text too short for enhancement`);
    return text;
  }
  
  try {
    // FIXED: Use correct model name
    const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });
    
    const prompt = `Enhance the following OCR text from a medical lab report. Correct any mistakes, format it for readability, and extract the key information. Preserve all the original information. OCR TEXT: ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedText = response.text();
    
    console.log(`[scanner:gemini ${batchId}] ✅ Text enhanced successfully (${text.length} → ${enhancedText.length} chars)`);
    return enhancedText;
  } catch (e) {
    console.error(`[scanner:gemini ${batchId}] 💥 Failed to enhance text with Gemini:`, e.message || e);
    return text; // Return original text on error
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate SHA256 hash of buffer
 * @param {Buffer} buf - Buffer to hash
 * @returns {string} - Hex hash
 */
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/**
 * Get current timestamp in milliseconds
 * @returns {number} - Current timestamp
 */
const nowMs = () => Date.now();

/**
 * Log with batch ID prefix
 * @param {string} batchId - Batch identifier
 * @param {...any} args - Arguments to log
 */
const logh = (batchId, ...args) => console.log(`[scanner ${batchId}]`, ...args);

/**
 * Store PDF document in database
 * @param {Object} params - Storage parameters
 * @returns {Promise<Object>} - Created PatientPDF document
 */
async function storePdf({ buffer, fileName, mimeType, patientId, batchId }) {
  const size = buffer.length;
  const hash = sha256(buffer);
  
  logh(batchId, `→ storing binary: ${fileName} (${mimeType}, ${size} bytes), sha256=${hash.slice(0, 8)}…`);
  
  const doc = await PatientPDF.create({
    patientId,
    title: fileName,
    fileName,
    mimeType: mimeType || 'application/pdf',
    data: buffer,
    size
  });
  
  logh(batchId, `✓ stored PatientPDF id=${doc._id}`);
  return doc;
}

/**
 * Perform OCR on any supported file type (PDF or Image)
 * @param {Object} params - OCR parameters
 * @returns {Promise<Object>} - OCR result with text and metadata
 */
async function ocrAny({ buffer, mimetype, batchId, fileName }) {
  const t0 = nowMs();
  
  // Handle PDF files
  if (mimetype === 'application/pdf') {
    logh(batchId, `PDF detected: ${fileName} → trying embedded text via pdf-parse (ESM import)…`);
    
    try {
      const { default: pdfParse } = await import('pdf-parse');
      const parsed = await pdfParse(buffer);
      const text = (parsed?.text || '').trim();
      const t1 = nowMs();
      
      if (text.length > 0) {
        logh(batchId, `pdf-parse ✓ chars=${text.length}, pages=${parsed.numpages}, took=${t1 - t0}ms`);
        return {
          text,
          engine: 'pdf-parse',
          confidence: null,
          tookMs: t1 - t0
        };
      }
      
      logh(batchId, `pdf-parse found NO text layer (probably scanned).`);
      return {
        text: '',
        engine: 'pdf-parse',
        confidence: null,
        tookMs: t1 - t0
      };
    } catch (e) {
      const t1 = nowMs();
      logh(batchId, `pdf-parse import/use error: ${e.message} (took ${t1 - t0}ms)`);
      return {
        text: '',
        engine: 'pdf-parse-error',
        confidence: null,
        tookMs: t1 - t0
      };
    }
  }
  
  // Handle image files
  if (!visionClient) {
    logh(batchId, `Vision client not configured → cannot OCR image ${fileName}`);
    return {
      text: '',
      engine: 'none',
      confidence: null,
      tookMs: 0
    };
  }
  
  logh(batchId, `Image detected: ${fileName} → sharp preprocess (rotate→grayscale→normalize→png)`);
  
  let prepped;
  try {
    prepped = await sharp(buffer)
      .rotate()
      .grayscale()
      .normalize()
      .png()
      .toBuffer();
  } catch (e) {
    logh(batchId, '✗ sharp preprocessing failed:', e.message || e);
    return {
      text: '',
      engine: 'sharp-error',
      confidence: null,
      tookMs: 0
    };
  }
  
  const t1 = nowMs();
  logh(batchId, `calling Vision.documentTextDetection (bytes=${prepped.length})…`);
  
  try {
    const [resp] = await visionClient.documentTextDetection({
      image: { content: prepped }
    });
    
    const t2 = nowMs();
    const raw = resp?.fullTextAnnotation?.text || '';
    
    // Clean up text
    const text = raw
      .replace(/\u00AD/g, '') // Remove soft hyphens
      .replace(/-\n(?=\p{L})/gu, '') // Join hyphenated words
      .replace(/[ \t]+\n/g, '\n') // Clean trailing spaces
      .trim();
    
    // Calculate average confidence
    let sum = 0, cnt = 0;
    resp?.fullTextAnnotation?.pages?.forEach(p =>
      p.blocks?.forEach(b =>
        b.paragraphs?.forEach(pa =>
          pa.words?.forEach(w => {
            if (w.confidence != null) {
              sum += w.confidence;
              cnt++;
            }
          })
        )
      )
    );
    
    const confidence = cnt ? +(sum / cnt).toFixed(3) : null;
    
    logh(batchId, `Vision ✓ chars=${text.length}, avgConf=${confidence}, took=${t2 - t1}ms (total=${t2 - t0}ms)`);
    
    return {
      text,
      engine: 'vision',
      confidence,
      tookMs: t2 - t1
    };
  } catch (e) {
    const t2 = nowMs();
    logh(batchId, `Vision call failed: ${e.message || e} (took ${t2 - t1}ms)`);
    return {
      text: '',
      engine: 'vision-error',
      confidence: null,
      tookMs: t2 - t1
    };
  }
}




// ============================================================================
// ENTERPRISE-GRADE LOCAL PARSER - IMPROVED WITH SAFETY CHECKS
// ============================================================================

/**
 * Safe regex matching with timeout protection
 * @param {string} text - Text to match
 * @param {RegExp} pattern - Regex pattern
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Array|null} - Match result or null
 */
function safeRegexMatch(text, pattern, timeout = CONFIG.REGEX_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn('[safeRegexMatch] Regex timeout, returning null');
      resolve(null);
    }, timeout);
    
    try {
      const match = text.match(pattern);
      clearTimeout(timer);
      resolve(match);
    } catch (e) {
      clearTimeout(timer);
      console.error('[safeRegexMatch] Regex error:', e.message);
      resolve(null);
    }
  });
}

/**
 * Parse date string into ISO format
 * Handles multiple date formats with ambiguity resolution
 * @param {string} dateStr - Date string to parse
 * @param {string} locale - Locale hint (default: 'IN' for India)
 * @returns {string|null} - ISO date string or null
 */
function parseDate(dateStr, locale = 'IN') {
  try {
    let dobStr = dateStr.replace(/\./g, '/').replace(/\-/g, '/');
    const parts = dobStr.split('/').map(p => parseInt(p, 10));
    
    if (parts.length !== 3) return null;
    
    let year, month, day;
    
    // Determine format based on value ranges
    if (parts[0] > 31) {
      // YYYY/MM/DD
      [year, month, day] = parts;
    } else if (parts[2] > 31) {
      // DD/MM/YYYY or MM/DD/YYYY
      // FIXED: Use locale to resolve ambiguity
      if (locale === 'IN' || locale === 'EU') {
        // Indian/European format: DD/MM/YYYY
        [day, month, year] = parts;
      } else {
        // US format: MM/DD/YYYY
        [month, day, year] = parts;
      }
    } else {
      // Ambiguous case (e.g., 01/02/03)
      // Use heuristics: if first number > 12, it's likely DD/MM
      if (parts[0] > 12) {
        [day, month, year] = parts;
      } else if (parts[1] > 12) {
        [month, day, year] = parts;
      } else {
        // Default to locale preference
        if (locale === 'IN' || locale === 'EU') {
          [day, month, year] = parts;
        } else {
          [month, day, year] = parts;
        }
      }
    }
    
    // Handle 2-digit year
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }
    
    // Validate ranges
    if (year < 1900 || year > new Date().getFullYear()) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    
    // Create date and validate it's real (handles Feb 31, etc.)
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      return null;
    }
    
    return date.toISOString().slice(0, 10);
  } catch (e) {
    console.error('[parseDate] Error:', e.message);
    return null;
  }
}

/**
 * High-quality local parser for medical lab reports
 * Extracts patient information and test results
 * @param {string} text - OCR text to parse
 * @param {string} batchId - Batch ID for logging
 * @returns {Object} - Parsed data with patient info and results
 */
function localParseHighQuality(text, batchId = '') {
  const rawText = text || '';
  const lines = rawText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  const joined = lines.join('\n');

  // -------------------------------------------------------------------------
  // 1. PATIENT NAME EXTRACTION (Multi-Strategy)
  // -------------------------------------------------------------------------
  let firstName = null, lastName = null;

  // Strategy 1: Explicit labels with variations
  const namePatterns = [
    // Simple patterns first (more reliable, less complex)
    /(?:Patient\s*Name|Name|Pt\.?\s*Name)\s*[:\-]\s*([A-Z][A-Za-z\s.''-]{2,40}?)(?:\s{2,}|$|\||Age|DOB|Phone)/i,
    /(?:^|\n)Name\s*[:\-]?\s*([A-Z][A-Za-z\s.''-]{2,40}?)(?:\s{2,}|$|\n)/im,
    /(?:MR\s*No|ID|Reg\.?\s*No\.?)\s*[:\-]?\s*[\w\-]{3,20}\s+([A-Z][A-Za-z\s.''-]{2,40}?)(?:\s{2,}|$|\n)/i,
  ];

  let fullName = null;
  for (const pattern of namePatterns) {
    const match = joined.match(pattern);
    if (match && match[1]) {
      fullName = match[1].trim();
      // Clean up common artifacts
      fullName = fullName.replace(/\s+(Mr|Mrs|Ms|Dr|Miss)\.?$/i, '');
      fullName = fullName.replace(/\s+(Male|Female|M|F)$/i, '');
      break;
    }
  }

  // Strategy 2: Capitalized name at document start (first few lines)
  if (!fullName) {
    for (let i = 0; i < Math.min(CONFIG.MAX_LINES_FOR_NAME_SEARCH, lines.length); i++) {
      const line = lines[i];
      // Match: Two or more capitalized words (potential name)
      const match = line.match(/^([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){1,3})(?:\s|$)/);
      if (match && !line.match(/Lab|Report|Hospital|Clinic|Test|Results|Date/i)) {
        fullName = match[1];
        break;
      }
    }
  }

  // Parse name components
  if (fullName) {
    const nameParts = fullName.split(/\s+/).filter(p => p.length > 1);
    firstName = nameParts[0] || 'Unknown';
    lastName = nameParts.slice(1).join(' ') || '';
  } else {
    firstName = 'Unknown';
    lastName = '';
  }

  // -------------------------------------------------------------------------
  // 2. PHONE NUMBER EXTRACTION (International + Indian formats)
  // -------------------------------------------------------------------------
  const phonePatterns = [
    /(?:Phone|Mobile|Cell|Contact|Tel\.?|Ph\.?)\s*[:\-]?\s*(\+?\d[\d\s\-\(\)]{7,18})/i,
    /\b(\+91[\s\-]?\d{10})\b/,
    /\b(\d{10})\b/,  // 10-digit Indian number
    /\b(\+\d{1,3}[\s\-]?\d{7,14})\b/,  // International
  ];

  let phone = null;
  for (const pattern of phonePatterns) {
    const match = joined.match(pattern);
    if (match && match[1]) {
      phone = match[1].replace(/[\s\-\(\)]/g, '');
      // Validate length
      if (phone.length >= 10 && phone.length <= 15) {
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. DATE OF BIRTH EXTRACTION (Multiple formats)
  // -------------------------------------------------------------------------
  const dobPatterns = [
    /(?:DOB|Date\s*of\s*Birth|Birth\s*Date|D\.?O\.?B\.?)\s*[:\-]?\s*(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/i,
    /(?:DOB|Date\s*of\s*Birth)\s*[:\-]?\s*(\d{4}[\-\/\.]\d{1,2}[\-\/\.]\d{1,2})/i,
    /\b(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{4})\b/,
    /\b(\d{4}[\-\/\.]\d{1,2}[\-\/\.]\d{1,2})\b/,
  ];

  let dateOfBirth = null;
  for (const pattern of dobPatterns) {
    const match = joined.match(pattern);
    if (match && match[1]) {
      // Use improved date parser
      dateOfBirth = parseDate(match[1], 'IN');
      if (dateOfBirth) break;
    }
  }

  // -------------------------------------------------------------------------
  // 4. AGE EXTRACTION
  // -------------------------------------------------------------------------
  const agePatterns = [
    /(?:Age|Yrs?|Years?)\s*[:\-]?\s*(\d{1,3})/i,
    /(\d{1,3})\s*(?:Years?|Yrs?|Y)\b/i
  ];

  let age = null;
  for (const pattern of agePatterns) {
    const match = joined.match(pattern);
    if (match && match[1]) {
      const ageNum = parseInt(match[1], 10);
      if (ageNum > 0 && ageNum < 150) {
        age = ageNum;
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. GENDER/SEX EXTRACTION
  // -------------------------------------------------------------------------
  const genderPatterns = [
    /(?:Gender|Sex)\s*[:\-]?\s*(Male|Female|M|F|Other|Transgender)\b/i,
    /\b(Male|Female)\b/i
  ];

  let sex = null;
  for (const pattern of genderPatterns) {
    const match = joined.match(pattern);
    if (match && match[1]) {
      const g = match[1].toUpperCase();
      if (g === 'MALE' || g === 'M') sex = 'M';
      else if (g === 'FEMALE' || g === 'F') sex = 'F';
      else sex = 'Other';
      break;
    }
  }

  // -------------------------------------------------------------------------
  // 6. LAB ID / MR NUMBER EXTRACTION
  // -------------------------------------------------------------------------
  const labIdPatterns = [
    /(?:Lab\s*(?:ID|No|Number)|Sample\s*(?:ID|No)|Specimen\s*(?:ID|No))\s*[:\-]?\s*([A-Z0-9\-]{3,20})/i,
    /(?:MR\s*No|MRN|Medical\s*Record\s*No|Patient\s*ID|Reg\.?\s*No)\s*[:\-]?\s*([A-Z0-9\-]{3,20})/i
  ];

  let labId = null, mrNo = null;
  for (const pattern of labIdPatterns) {
    const match = joined.match(pattern);
    if (match && match[1]) {
      if (!labId) labId = match[1].trim();
      if (!mrNo) mrNo = match[1].trim();
      break;
    }
  }

  // -------------------------------------------------------------------------
  // 7. LAB TEST RESULTS EXTRACTION (IMPROVED - Simplified Regex)
  // -------------------------------------------------------------------------
  const results = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header/footer lines
    if (line.match(/^(Lab|Report|Hospital|Clinic|Page|Date|Signature|Doctor|Prepared)/i)) {
      continue;
    }

    // IMPROVED: Simplified regex patterns to avoid catastrophic backtracking
    // Format 1: "Test Name    Value  Unit"
    // Simplified character classes and limited quantifiers
    let match = line.match(/^([A-Za-z][\w\s\-\(\)\/\.%]{2,50}?)\s{2,}([<>≤≥]?\d+(?:\.\d+)?)\s*([\w%\/\.μ\^]{0,15})?\s*$/i);

    if (match) {
      const testName = match[1].trim();
      const valueStr = match[2].replace(/[<>≤≥]/g, '');
      const value = parseFloat(valueStr);
      const unit = match[3] ? match[3].trim() : null;

      if (!isNaN(value) && testName.length >= 3 && testName.length <= 50) {
        results[testName] = {
          value,
          unit,
          refRange: null,
          flag: null,
          raw: line
        };
        continue;
      }
    }

    // Format 2: "Test Name: Value Unit"
    match = line.match(/^([\w\s\-\(\)\/\.%]{3,50})\s*[:\-]\s*([<>≤≥]?\d+(?:\.\d+)?)\s*([\w%\/\.μ\^]{0,15})?/i);

    if (match) {
      const testName = match[1].trim();
      const valueStr = match[2].replace(/[<>≤≥]/g, '');
      const value = parseFloat(valueStr);
      const unit = match[3] ? match[3].trim() : null;

      if (!isNaN(value) && testName.length >= 3 && testName.length <= 50) {
        results[testName] = {
          value,
          unit,
          refRange: null,
          flag: null,
          raw: line
        };
        continue;
      }
    }

    // Format 3: "Test Name  Value" (no unit)
    match = line.match(/^([\w\s\-\(\)\/]{3,40})\s{2,}(\d+(?:\.\d+)?)\s*$/);

    if (match) {
      const testName = match[1].trim();
      const value = parseFloat(match[2]);

      if (!isNaN(value) && testName.length >= 3 && testName.length <= 40) {
        results[testName] = {
          value,
          unit: null,
          refRange: null,
          flag: null,
          raw: line
        };
        continue;
      }
    }

    // Format 4: Free text with common test keywords
    const testKeywords = ['hemoglobin', 'glucose', 'wbc', 'rbc', 'platelet', 'sodium', 'potassium', 'creatinine'];
    const lowerLine = line.toLowerCase();
    
    for (const keyword of testKeywords) {
      if (lowerLine.includes(keyword)) {
        const valueMatch = line.match(/(\d+(?:\.\d+)?)/);
        if (valueMatch) {
          const value = parseFloat(valueMatch[1]);
          if (!isNaN(value) && !results[keyword]) {
            results[keyword] = {
              value,
              unit: null,
              refRange: null,
              flag: null,
              raw: line
            };
            break;
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 8. POST-PROCESSING & VALIDATION
  // -------------------------------------------------------------------------
  const cleanedResults = {};
  for (const [testName, data] of Object.entries(results)) {
    const cleanName = testName.replace(/[:\-]+$/, '').trim();
    if (cleanName.length >= 3 && cleanName.length <= 100) {
      cleanedResults[cleanName] = data;
    }
  }

  // -------------------------------------------------------------------------
  // 9. RETURN STRUCTURED DATA
  // -------------------------------------------------------------------------
  return {
    patient: {
      firstName: firstName || 'Unknown',
      lastName: lastName || '',
      phone: phone || null,
      dateOfBirth: dateOfBirth || null,
      age: age || null,
      sex: sex || null,
      labId: labId || null,
      mrNo: mrNo || null
    },
    results: cleanedResults,
    metadata: {
      ocrEngine: null,
      ocrConfidence: null,
      rawTextChars: rawText.length,
      parser: 'enterprise-local-v2',
      patternsMatched: {
        nameFound: !!fullName,
        phoneFound: !!phone,
        dobFound: !!dateOfBirth,
        resultsCount: Object.keys(cleanedResults).length
      }
    }
  };
}



/**
 * Fallback parser for when main parser fails
 * @param {string} text - Text to parse
 * @returns {Object} - Basic parsed data
 */
function parseFieldsFallback(text) {
  const name = text.match(/(?:Patient\s*Name|Name)\s*[:\-]\s*(.+)/i)?.[1]?.trim() || 
               text.match(/\bName\s*[:\-]\s*([A-Z][A-Za-z .'-]{2,40})/i)?.[1]?.trim();
  
  const firstName = name ? name.split(/\s+/)[0] : 'Unknown';
  const lastName = name ? name.split(/\s+/).slice(1).join(' ') : '';
  
  const phone = text.match(/\b(\+?\d{7,15})\b/)?.[1] || null;
  
  const dob = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/)?.[1] || 
              text.match(/\b(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/)?.[1] || null;
  
  const dateOfBirth = dob ? parseDate(dob) : null;
  
  const results = {};
  text.split('\n').forEach(line => {
    const m = line.match(/^\s*([\w\s\-\(\)\/\%]{3,40})\s+([<>]?\d+(?:\.\d+)?)\s*([\w%\/\.μ]{0,15})?\s*$/);
    if (m) {
      const test = m[1].trim().replace(/\s+/g, ' ');
      const val = parseFloat(m[2]);
      const unit = m[3] || null;
      if (!Number.isNaN(val)) {
        results[test] = { value: val, unit };
      }
    }
  });
  
  return {
    firstName,
    lastName,
    phone,
    dateOfBirth,
    results
  };
}

/**
 * Convert old parser format to new structured format
 * Used for backward compatibility when Gemini extraction fails
 * @param {Object} oldFormat - Data from localParseHighQuality or parseFieldsFallback
 * @returns {Object} - New structured format matching Gemini output
 */
function convertOldFormatToNew(oldFormat) {
  // Build patient object
  const patient = {
    firstName: oldFormat.patient?.firstName || oldFormat.firstName || 'Unknown',
    lastName: oldFormat.patient?.lastName || oldFormat.lastName || '',
    dateOfBirth: oldFormat.patient?.dateOfBirth || oldFormat.dateOfBirth || null,
    age: oldFormat.patient?.age || null,
    gender: oldFormat.patient?.sex || oldFormat.patient?.gender || null,
    phone: oldFormat.patient?.phone || oldFormat.phone || null,
    email: null,
    address: {
      line1: null,
      city: null,
      state: null,
      pincode: null,
      country: null
    },
    mrNo: oldFormat.patient?.mrNo || null,
    labId: oldFormat.patient?.labId || null
  };
  
  // Normalize gender to proper format
  if (patient.gender) {
    const g = patient.gender.toUpperCase();
    if (g === 'M' || g === 'MALE') {
      patient.gender = 'Male';
    } else if (g === 'F' || g === 'FEMALE') {
      patient.gender = 'Female';
    } else {
      patient.gender = 'Other';
    }
  }
  
  // Convert results object to array format
  const resultsArray = [];
  const resultsObj = oldFormat.results || {};
  
  for (const [testName, testData] of Object.entries(resultsObj)) {
    const result = {
      testName: testName,
      value: testData.value || null,
      unit: testData.unit || null,
      normalRange: testData.refRange || null,
      normalRangeMin: null,
      normalRangeMax: null,
      flag: testData.flag || null,
      category: null
    };
    
    // Try to parse normalRange into min/max
    if (result.normalRange) {
      const rangeMatch = result.normalRange.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
      if (rangeMatch) {
        result.normalRangeMin = parseFloat(rangeMatch[1]);
        result.normalRangeMax = parseFloat(rangeMatch[2]);
      }
    }
    
    resultsArray.push(result);
  }
  
  // Build labReport object
  const labReport = {
    testType: 'Auto-OCR',
    testDate: null,
    reportedDate: null,
    labName: null,
    doctorName: null,
    results: resultsArray,
    notes: null,
    interpretation: null,
    technician: null,
    verifiedBy: null
  };
  
  // Return in new format
  return {
    patient,
    labReport,
    metadata: {
      ocrEngine: oldFormat.metadata?.ocrEngine || null,
      ocrConfidence: oldFormat.metadata?.ocrConfidence || null,
      geminiModel: null,
      extractionTimeMs: 0,
      extractionQuality: 'medium',
      extractionScore: 50,
      rawOcrLength: oldFormat.metadata?.rawTextChars || 0,
      parserUsed: oldFormat.metadata?.parser || 'regex-fallback',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Match or create patient with proper locking to prevent duplicates
 * @param {Object} session - MongoDB session
 * @param {Object} fields - Patient fields
 * @param {string} batchId - Batch ID for logging
 * @returns {Promise<Object>} - Patient data with action taken
 */
async function matchOrCreatePatient(session, fields, batchId) {
  let { firstName, lastName, phone, dateOfBirth } = fields;
  let matchedBy = 'created-new';
  let patient = null;

  try {
    const phoneNorm = normalizePhone(phone);
    if (phoneNorm) {
      phone = phoneNorm;
    } else {
      phone = null;
    }

    // IMPROVED: Added unique constraint check to prevent race conditions
    // Strategy: Try to match existing patient before creating new one
    
    // PRIORITY 1: Try matching by name only (case-insensitive)
    if (firstName && firstName !== 'Unknown') {
      logh(batchId, `trying name lookup: ${firstName} ${lastName || ''}`);
      
      const nameQuery = {
        firstName: new RegExp(`^${escapeRegex(firstName)}$`, 'i')
      };
      
      if (lastName) {
        nameQuery.lastName = new RegExp(`^${escapeRegex(lastName)}$`, 'i');
      }
      
      patient = await Patient.findOne(nameQuery).session(session);
      if (patient) {
        matchedBy = 'name';
      }
    }

    // PRIORITY 2: Try name + DOB if name alone failed
    if (!patient && firstName && dateOfBirth) {
      logh(batchId, `trying name+dob lookup: ${firstName} ${lastName} ${dateOfBirth}`);
      
      patient = await Patient.findOne({
        firstName: new RegExp(`^${escapeRegex(firstName)}$`, 'i'),
        lastName: lastName ? new RegExp(`^${escapeRegex(lastName)}$`, 'i') : '',
        dateOfBirth
      }).session(session);
      
      if (patient) {
        matchedBy = 'name+dob';
      }
    }

    // PRIORITY 3: Try phone as fallback (only if name matching failed)
    if (!patient && phone) {
      logh(batchId, `trying phone lookup: ${phone}`);
      patient = await Patient.findOne({ phone }).session(session);
      if (patient) {
        matchedBy = 'phone';
      }
    }

    // If found, update missing fields
    if (patient) {
      let dirty = false;
      
      if (!patient.lastName && lastName) {
        patient.lastName = lastName;
        dirty = true;
      }
      
      if (!patient.dateOfBirth && dateOfBirth) {
        patient.dateOfBirth = dateOfBirth;
        dirty = true;
      }
      
      if (!patient.phone && phone) {
        patient.phone = phone;
        dirty = true;
      }
      
      if (dirty) {
        logh(batchId, `updating patient ${patient._id} with missing fields`);
        await patient.save({ session });
      }
      
      logh(batchId, `patient match ✓ id=${patient._id}, by=${matchedBy}, dirty=${dirty}`);
      return { patient, action: 'updated', matchedBy };
    }

    // Create new patient if no match found
    const createPayload = {
      firstName: firstName || 'Unknown',
      lastName: lastName || '',
      dateOfBirth: dateOfBirth || null,
      phone: phone || null
    };

    try {
      const created = await Patient.create([createPayload], { session }).then(a => a[0]);
      logh(batchId, `patient created ✓ id=${created._id}`);
      return { patient: created, action: 'created', matchedBy };
    } catch (e) {
      // IMPROVED: Better error handling for duplicate key errors
      if (e.code === 11000 || e.name === 'MongoServerError') {
        logh(batchId, '⚠️ Duplicate key error, retrying lookup...');
        
        // Retry lookup - another process may have created the patient
        if (phone) {
          patient = await Patient.findOne({ phone }).session(session);
          if (patient) {
            logh(batchId, `patient found on retry ✓ id=${patient._id}`);
            return { patient, action: 'found-on-retry', matchedBy: 'phone' };
          }
        }
        
        // Try without phone
        logh(batchId, '✗ patient create with phone failed, retrying without phone');
        createPayload.phone = null;
        const created = await Patient.create([createPayload], { session }).then(a => a[0]);
        logh(batchId, `patient created (without phone) ✓ id=${created._id}`);
        return { patient: created, action: 'created', matchedBy };
      }
      
      throw e;
    }
  } catch (e) {
    logh(batchId, '✗ matchOrCreatePatient error:', e.message || e);
    throw e;
  }
}

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create lab report in database
 * @param {Object} session - MongoDB session
 * @param {Object} params - Lab report parameters
 * @returns {Promise<Object>} - Created lab report
 */
async function createLabReport(session, { patientId, pdfId, results, ocrMeta, rawText, enhancedText, batchId }) {
  try {
    const lab = await LabReport.create([{
      patientId,
      appointmentId: null,
      testType: 'Auto-OCR',
      results: results || {},
      fileRef: pdfId,
      rawText: rawText || '',
      enhancedText: enhancedText || '',
      metadata: {
        ocrEngine: ocrMeta.engine,
        ocrConfidence: ocrMeta.confidence,
        rawTextChars: rawText ? rawText.length : 0,
        enhancer: 'gemini-pro'
      }
    }], { session }).then(a => a[0]);
    
    logh(batchId, `labReport created ✓ id=${lab._id}`);
    return lab;
  } catch (e) {
    logh(batchId, '✗ createLabReport error:', e.message || e);
    throw e;
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Health check endpoint
 */
router.get('/health', auth, (req, res) => {
  return res.json({ ok: true, timestamp: new Date().toISOString() });
});

/**
 * Upload and process medical documents
 * Supports PDF and image files (JPEG, PNG)
 * Maximum 10 files per request, 12MB each
 */
router.post('/upload', auth, upload.array('files', CONFIG.MAX_FILES_PER_UPLOAD), async (req, res) => {
  const batchId = uuidv4().slice(0, 8);
  const t0 = nowMs();
  
  logh(batchId, `→ /scanner/upload files=${req.files?.length || 0}`);
  
  // Validate request
  if (!req.files || req.files.length === 0) {
    logh(batchId, '✗ no files uploaded');
    return res.status(400).json({
      ok: false,
      error: 'No files uploaded',
      batchId
    });
  }
  
  if (req.files.length > CONFIG.MAX_FILES_PER_UPLOAD) {
    logh(batchId, `✗ too many files (${req.files.length})`);
    return res.status(400).json({
      ok: false,
      error: `Maximum ${CONFIG.MAX_FILES_PER_UPLOAD} files allowed`,
      batchId
    });
  }
  
  let session = null;
  
  try {
    // Initialize database session
    session = await startSession();
    logh(batchId, 'db session started');
  } catch (e) {
    console.error(`[scanner ${batchId}] could not start DB session:`, e);
    return res.status(500).json({
      ok: false,
      error: 'Database session initialization failed',
      batchId
    });
  }
  
  const results = [];
  const failed = [];
  
  try {
    // Process each file
    for (const f of req.files) {
      try {
        await session.withTransaction(async () => {
          const tFile = nowMs();
          const { originalname, mimetype, buffer, size } = f;
          
          logh(batchId, `file START: ${originalname} (type=${mimetype}, size=${size})`);
          
          // Perform OCR
          let ocrRes;
          try {
            ocrRes = await ocrAny({
              buffer,
              mimetype,
              batchId,
              fileName: originalname
            });
          } catch (e) {
            logh(batchId, `✗ OCR threw for ${originalname}:`, e.message || e);
            throw new Error(`OCR failed: ${e.message}`);
          }
          
          const { text, engine, confidence, tookMs } = ocrRes;
          logh(batchId, `OCR done: engine=${engine}, conf=${confidence}, t=${tookMs}ms`);
          
          // ========================================================================
          // NEW LOGIC: Use Gemini for structured extraction instead of regex
          // ========================================================================
          
          let structuredData = null;
          let extractionMethod = 'none';
          
          // Try Gemini structured extraction first
          try {
            logh(batchId, `🚀 Attempting Gemini structured extraction...`);
            structuredData = await extractStructuredDataWithGemini(text, batchId);
            
            if (structuredData) {
              // Set OCR metadata
              structuredData.metadata.ocrEngine = engine;
              structuredData.metadata.ocrConfidence = confidence;
              
              const quality = structuredData.metadata.extractionQuality;
              extractionMethod = `gemini-${quality}`;
              
              // Check if quality is acceptable
              if (quality === 'low') {
                logh(batchId, '⚠️ Gemini extraction quality is LOW, will try fallback...');
                structuredData = null; // Force fallback
              } else {
                logh(batchId, `✅ Gemini extraction successful with ${quality} quality`);
              }
            } else {
              logh(batchId, '⚠️ Gemini extraction returned null, trying fallback...');
            }
          } catch (e) {
            logh(batchId, '❌ Gemini extraction failed:', e.message);
            structuredData = null;
          }
          
          // Fallback to old regex parser if Gemini fails or quality is low
          if (!structuredData) {
            logh(batchId, `🔄 Using fallback regex parser...`);
            
            try {
              // Try enhanced text first with old parser
              const enhancedText = await enhanceTextWithGemini(text, batchId);
              const parsed = localParseHighQuality(enhancedText, batchId);
              parsed.metadata.ocrEngine = engine;
              parsed.metadata.ocrConfidence = confidence;
              
              // Convert old format to new format
              structuredData = convertOldFormatToNew(parsed);
              extractionMethod = 'regex-with-enhancement';
              logh(batchId, `✅ Fallback parser succeeded (with enhancement)`);
            } catch (e) {
              logh(batchId, '⚠️ Enhanced parser failed, trying basic fallback:', e.message);
              
              // Last resort: basic fallback parser
              try {
                const basicParsed = parseFieldsFallback(text);
                structuredData = convertOldFormatToNew(basicParsed);
                extractionMethod = 'regex-basic';
                logh(batchId, `✅ Basic fallback parser succeeded`);
              } catch (e2) {
                logh(batchId, '❌ All parsers failed:', e2.message);
                throw new Error('Failed to extract any data from document');
              }
            }
          }
          
          // At this point, structuredData should be in new format
          if (!structuredData || !structuredData.patient || !structuredData.labReport) {
            throw new Error('Structured data is invalid or incomplete');
          }
          
          logh(batchId, `📋 Final extraction method: ${extractionMethod}`);
          logh(batchId, `👤 Patient: ${structuredData.patient.firstName} ${structuredData.patient.lastName || ''}`);
          logh(batchId, `🧪 Test results: ${structuredData.labReport.results?.length || 0}`);
          logh(batchId, `📊 Test type: ${structuredData.labReport.testType || 'Unknown'}`);
          
          // Prepare patient data for matching/creation
          const patientData = {
            firstName: structuredData.patient.firstName || 'Unknown',
            lastName: structuredData.patient.lastName || '',
            phone: structuredData.patient.phone || null,
            dateOfBirth: structuredData.patient.dateOfBirth ? new Date(structuredData.patient.dateOfBirth) : null,
            gender: structuredData.patient.gender || null,
            email: structuredData.patient.email || null,
            address: structuredData.patient.address || null
          };
          
          const dobStr = patientData.dateOfBirth ? 
                        patientData.dateOfBirth.toISOString().slice(0, 10) : 
                        null;
          
          logh(batchId, `📝 Patient data prepared:`, {
            firstName: patientData.firstName,
            lastName: patientData.lastName,
            phone: patientData.phone,
            dateOfBirth: dobStr,
            gender: patientData.gender
          });
          
          // Match or create patient
          const { patient, action, matchedBy } = await matchOrCreatePatient(
            session,
            patientData,
            batchId
          );
          
          // Update patient with additional info if available
          let patientUpdated = false;
          if (patient && structuredData.patient) {
            if (structuredData.patient.email && !patient.email) {
              patient.email = structuredData.patient.email;
              patientUpdated = true;
            }
            if (structuredData.patient.address && !patient.address?.line1) {
              patient.address = structuredData.patient.address;
              patientUpdated = true;
            }
            if (structuredData.patient.gender && !patient.gender) {
              patient.gender = structuredData.patient.gender;
              patientUpdated = true;
            }
            
            if (patientUpdated) {
              await patient.save({ session });
              logh(batchId, `✅ Updated patient with additional info from extraction`);
            }
          }
          
          // Store PDF
          const pdfDoc = await storePdf({
            buffer,
            fileName: originalname,
            mimeType: mimetype,
            patientId: patient._id,
            batchId
          });
          
          // Create lab report with structured results
          const labReportData = {
            patientId: patient._id,
            appointmentId: null,
            testType: structuredData.labReport.testType || 'Auto-OCR',
            results: structuredData.labReport.results || [],  // Array format now
            fileRef: pdfDoc._id,
            uploadedBy: req.user?._id || null,
            rawText: text || '',
            enhancedText: JSON.stringify(structuredData, null, 2),  // Store full structured data
            metadata: {
              ...structuredData.metadata,
              extractionMethod,
              testDate: structuredData.labReport.testDate || null,
              reportedDate: structuredData.labReport.reportedDate || null,
              labName: structuredData.labReport.labName || null,
              doctorName: structuredData.labReport.doctorName || null,
              notes: structuredData.labReport.notes || null,
              interpretation: structuredData.labReport.interpretation || null,
              technician: structuredData.labReport.technician || null,
              verifiedBy: structuredData.labReport.verifiedBy || null
            }
          };
          
          const lab = await LabReport.create([labReportData], { session }).then(a => a[0]);
          logh(batchId, `✅ LabReport created id=${lab._id}`);
          
          const elapsed = nowMs() - tFile;
          logh(batchId, `file END: ${originalname} → patient=${patient._id}, pdf=${pdfDoc._id}, lab=${lab._id}, action=${action}, took=${elapsed}ms`);
          
          // Add to results with detailed information
          results.push({
            file: originalname,
            action,
            extractionMethod,
            patient: {
              id: patient._id,
              firstName: patient.firstName,
              lastName: patient.lastName,
              matchedBy,
              updated: patientUpdated
            },
            pdf: {
              id: pdfDoc._id,
              fileName: originalname,
              size,
              mimeType: mimetype
            },
            ocr: {
              engine,
              confidence,
              chars: (text || '').length
            },
            labReport: {
              id: lab._id,
              testType: structuredData.labReport.testType || 'Auto-OCR',
              resultsCount: structuredData.labReport.results?.length || 0,
              testDate: structuredData.labReport.testDate || null,
              labName: structuredData.labReport.labName || null,
              quality: structuredData.metadata?.extractionQuality || 'unknown',
              qualityScore: structuredData.metadata?.extractionScore || 0
            },
            processing: {
              timeMs: elapsed,
              extractionTimeMs: structuredData.metadata?.extractionTimeMs || 0
            }
          });
        });
      } catch (err) {
        // Transaction failed for this file
        logh(batchId, `✗ transaction failed for ${f.originalname}: ${err.message}`);
        failed.push({
          file: f.originalname,
          reason: err.message || 'Transaction failed'
        });
      }
    }
    
    const t1 = nowMs();
    logh(batchId, `batch END: ok=${failed.length === 0}, processed=${results.length}, failed=${failed.length}, totalT=${t1 - t0}ms`);
    
    const payload = {
      ok: failed.length === 0,
      batchId,
      results,
      processed: results.length,
      failed: failed.length,
      totalTimeMs: t1 - t0
    };
    
    if (failed.length) {
      payload.failures = failed;
    }
    
    return res.status(200).json(payload);
  } catch (e) {
    logh(batchId, `FATAL: ${e.stack || e.message}`);
    return res.status(500).json({
      ok: false,
      error: e.message || 'Internal server error',
      batchId,
      results,
      failed
    });
  } finally {
    // FIXED: Always close session, even on early returns or errors
    if (session) {
      try {
        await session.endSession();
        logh(batchId, 'db session ended');
      } catch (e) {
        console.warn(`[scanner ${batchId}] error ending session:`, e.message);
      }
    }
  }
});
    
/**
 * Get PDF document by ID
 * Returns the PDF file for viewing/download
 */
router.get('/pdf/:id', auth, async (req, res) => {
  const id = req.params.id;
  
  console.log('[scanner:pdf] fetch id=', id);
  
  try {
    const doc = await PatientPDF.findById(id);
    
    if (!doc) {
      console.warn('[scanner:pdf] not found:', id);
      return res.status(404).json({
        ok: false,
        error: 'PDF not found'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
    res.setHeader('Content-Length', doc.size || doc.data?.length || 0);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName || (doc._id + '.pdf')}"`);
    
    console.log('[scanner:pdf] streaming', id, 'mime=', doc.mimeType, 'bytes=', doc.size);
    
    return res.send(doc.data);
  } catch (e) {
    console.error('[scanner:pdf] error fetching pdf:', e.message || e);
    return res.status(500).json({
      ok: false,
      error: 'Server error while fetching PDF'
    });
  }
});

/**
 * Get all lab reports for a specific patient
 * Returns list of reports with metadata
 */
router.get('/reports/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  
  console.log('[scanner:reports] list for patientId=', patientId);
  
  try {
    const items = await LabReport.find({ patientId })
      .sort({ createdAt: -1 })
      .select('_id patientId fileRef testType createdAt results metadata')
      .lean();
    
    const shaped = items.map(r => ({
      labReportId: r._id,
      pdfId: r.fileRef || null,
      title: r.testType || 'Auto-OCR Report',
      createdAt: r.createdAt,
      resultsCount: r.results ? Object.keys(r.results).length : 0,
      ocrEngine: r.metadata?.ocrEngine || null,
      ocrConfidence: r.metadata?.ocrConfidence || null
    }));
    
    console.log('[scanner:reports] count=', shaped.length);
    
    res.json({
      ok: true,
      patientId,
      count: shaped.length,
      items: shaped
    });
  } catch (e) {
    console.error('[scanner:reports] error:', e.message || e);
    res.status(500).json({
      ok: false,
      error: 'Server error while fetching reports'
    });
  }
});

module.exports = router;

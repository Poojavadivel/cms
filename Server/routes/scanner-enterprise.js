const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const auth = require('../Middleware/Auth');
const { Patient, LabReport, PatientPDF, PrescriptionDocument, LabReportDocument, startSession } = require('../Models');

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_UPLOAD: 10,
  GEMINI_MODEL: 'gemini-2.0-flash-exp',
  TEMP_UPLOAD_DIR: path.join(__dirname, '../uploads/temp'),
};

// ============================================================================
// MULTER CONFIGURATION - DISK STORAGE (IMPROVED)
// ============================================================================
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(CONFIG.TEMP_UPLOAD_DIR, { recursive: true });
      cb(null, CONFIG.TEMP_UPLOAD_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE,
    files: CONFIG.MAX_FILES_PER_UPLOAD
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
    cb(null, true);
  }
});

// ============================================================================
// API CLIENTS INITIALIZATION
// ============================================================================
let visionClient = null;
let genAI = null;

(() => {
  try {
    const gcpCreds = process.env.GCP_SERVICE_ACCOUNT;
    if (gcpCreds) {
      const creds = JSON.parse(gcpCreds);
      if (creds.private_key) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
      }
      visionClient = new vision.ImageAnnotatorClient({
        credentials: creds,
        projectId: creds.project_id
      });
      console.log('[scanner-enterprise] ✅ Vision API initialized');
    }
  } catch (e) {
    console.error('[scanner-enterprise] ❌ Vision API init failed:', e.message);
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.Gemi_Api_Key;
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('[scanner-enterprise] ✅ Gemini API initialized');
    }
  } catch (e) {
    console.error('[scanner-enterprise] ❌ Gemini API init failed:', e.message);
  }
})();

// ============================================================================
// TEST TYPE INTENTS AND SPECIALIZED PROMPTS
// ============================================================================
const TEST_INTENTS = {
  THYROID: {
    keywords: ['thyroid', 'tsh', 't3', 't4', 'free t3', 'free t4', 'thyroid profile'],
    fields: ['TSH', 'T3', 'T4', 'Free T3', 'Free T4', 'Anti-TPO', 'Thyroglobulin'],
    category: 'Endocrinology'
  },
  BLOOD_COUNT: {
    keywords: ['cbc', 'complete blood', 'hemogram', 'wbc', 'rbc', 'platelet', 'hemoglobin'],
    fields: ['Hemoglobin', 'RBC', 'WBC', 'Platelet Count', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'],
    category: 'Hematology'
  },
  LIPID: {
    keywords: ['lipid', 'cholesterol', 'hdl', 'ldl', 'triglyceride', 'vldl'],
    fields: ['Total Cholesterol', 'HDL', 'LDL', 'VLDL', 'Triglycerides', 'Cholesterol/HDL Ratio', 'LDL/HDL Ratio'],
    category: 'Biochemistry'
  },
  DIABETES: {
    keywords: ['glucose', 'sugar', 'hba1c', 'fasting', 'pp', 'post prandial', 'diabetes'],
    fields: ['Fasting Glucose', 'Post Prandial Glucose', 'Random Glucose', 'HbA1c', 'Insulin'],
    category: 'Biochemistry'
  },
  LIVER: {
    keywords: ['liver', 'lft', 'sgot', 'sgpt', 'alt', 'ast', 'bilirubin', 'albumin', 'globulin'],
    fields: ['SGOT (AST)', 'SGPT (ALT)', 'Total Bilirubin', 'Direct Bilirubin', 'Indirect Bilirubin', 'Albumin', 'Globulin', 'A/G Ratio', 'Alkaline Phosphatase', 'GGT'],
    category: 'Biochemistry'
  },
  KIDNEY: {
    keywords: ['kidney', 'kft', 'creatinine', 'urea', 'bun', 'uric acid', 'renal'],
    fields: ['Creatinine', 'Blood Urea', 'BUN', 'Uric Acid', 'Sodium', 'Potassium', 'Chloride', 'eGFR'],
    category: 'Biochemistry'
  },
  VITAMIN: {
    keywords: ['vitamin', 'vitamin d', 'vitamin b12', 'folate', 'folic acid'],
    fields: ['Vitamin D', 'Vitamin B12', 'Folate', 'Vitamin D3', '25-OH Vitamin D'],
    category: 'Biochemistry'
  },
  URINE: {
    keywords: ['urine', 'urinalysis', 'urine routine', 'urine culture'],
    fields: ['Color', 'Appearance', 'pH', 'Specific Gravity', 'Protein', 'Glucose', 'Ketones', 'Blood', 'Bilirubin', 'Urobilinogen', 'Nitrite', 'Leukocyte Esterase', 'WBC', 'RBC', 'Epithelial Cells', 'Bacteria', 'Crystals', 'Casts'],
    category: 'Pathology'
  },
  CARDIAC: {
    keywords: ['cardiac', 'troponin', 'cpk', 'ck-mb', 'ldh', 'heart'],
    fields: ['Troponin I', 'Troponin T', 'CPK', 'CK-MB', 'LDH', 'Myoglobin'],
    category: 'Biochemistry'
  },
  HORMONE: {
    keywords: ['hormone', 'prolactin', 'testosterone', 'estrogen', 'progesterone', 'cortisol', 'lh', 'fsh'],
    fields: ['Prolactin', 'Testosterone', 'Estrogen', 'Progesterone', 'Cortisol', 'LH', 'FSH', 'DHEA'],
    category: 'Endocrinology'
  },
  INFECTION: {
    keywords: ['infection', 'culture', 'sensitivity', 'antibiotic', 'bacteria', 'organism'],
    fields: ['Organism', 'Culture Result', 'Antibiotic Sensitivity', 'Colony Count', 'Gram Stain'],
    category: 'Microbiology'
  },
  PRESCRIPTION: {
    keywords: ['prescription', 'rx', 'medication', 'medicine', 'drug', 'tablet', 'capsule', 'syrup', 'dosage', 'prescribed'],
    fields: ['Medicine Name', 'Dosage', 'Frequency', 'Duration', 'Instructions', 'Doctor Name', 'Prescription Date'],
    category: 'Prescription'
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const logh = (batchId, ...args) => console.log(`[scanner-ent ${batchId}]`, ...args);

async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (e) {
    // Ignore errors
  }
}

// ============================================================================
// STEP 1: OCR TEXT EXTRACTION
// ============================================================================
async function performOCR(filePath, mimetype, batchId) {
  const t0 = Date.now();
  
  try {
    // Read file
    const buffer = await fs.readFile(filePath);
    
    // Handle PDF
    if (mimetype === 'application/pdf') {
      logh(batchId, '📄 Processing PDF...');
      try {
        const { default: pdfParse } = await import('pdf-parse');
        const parsed = await pdfParse(buffer);
        const text = (parsed?.text || '').trim();
        
        if (text.length > 0) {
          logh(batchId, `✅ PDF text extracted: ${text.length} chars, ${parsed.numpages} pages`);
          return {
            text,
            engine: 'pdf-parse',
            confidence: 1.0,
            tookMs: Date.now() - t0
          };
        }
        
        logh(batchId, '⚠️ PDF has no text layer, using Vision OCR...');
      } catch (e) {
        logh(batchId, '❌ PDF parse failed:', e.message);
      }
    }
    
    // Handle Images (or scanned PDFs)
    if (!visionClient) {
      throw new Error('Vision API not configured');
    }
    
    logh(batchId, '🖼️ Processing image with Vision API...');
    
    // Preprocess image
    const preprocessed = await sharp(buffer)
      .rotate()
      .grayscale()
      .normalize()
      .png()
      .toBuffer();
    
    const [response] = await visionClient.documentTextDetection({
      image: { content: preprocessed }
    });
    
    const text = response?.fullTextAnnotation?.text || '';
    
    // Calculate confidence
    let sum = 0, count = 0;
    response?.fullTextAnnotation?.pages?.forEach(page => {
      page.blocks?.forEach(block => {
        block.paragraphs?.forEach(para => {
          para.words?.forEach(word => {
            if (word.confidence != null) {
              sum += word.confidence;
              count++;
            }
          });
        });
      });
    });
    
    const confidence = count ? sum / count : 0;
    
    logh(batchId, `✅ Vision OCR: ${text.length} chars, confidence: ${(confidence * 100).toFixed(1)}%`);
    
    return {
      text,
      engine: 'vision',
      confidence,
      tookMs: Date.now() - t0
    };
  } catch (error) {
    logh(batchId, '❌ OCR failed:', error.message);
    throw error;
  }
}

// ============================================================================
// STEP 2: INTENT DETECTION
// ============================================================================
async function detectIntent(ocrText, batchId) {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }
  
  logh(batchId, '🎯 Detecting test intent...');
  
  const model = genAI.getGenerativeModel({
    model: CONFIG.GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });
  
  const intentPrompt = `You are a medical lab report classifier. Analyze the OCR text and determine the PRIMARY test type.

Available test types:
${Object.keys(TEST_INTENTS).map(key => `- ${key}: ${TEST_INTENTS[key].keywords.join(', ')}`).join('\n')}

Return JSON in this format:
{
  "primaryIntent": "TEST_TYPE_NAME",
  "confidence": 0.95,
  "detectedTests": ["test1", "test2"],
  "reasoning": "Brief explanation"
}

OCR TEXT:
${ocrText.substring(0, 2000)}

OUTPUT (JSON only):`;

  try {
    const result = await model.generateContent(intentPrompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const intentData = JSON.parse(jsonText);
    
    logh(batchId, `✅ Intent detected: ${intentData.primaryIntent} (${(intentData.confidence * 100).toFixed(0)}%)`);
    
    return intentData;
  } catch (error) {
    logh(batchId, '⚠️ Intent detection failed, using GENERAL:', error.message);
    return {
      primaryIntent: 'GENERAL',
      confidence: 0.5,
      detectedTests: [],
      reasoning: 'Intent detection failed, using general extraction'
    };
  }
}

// ============================================================================
// STEP 3: SPECIALIZED EXTRACTION BASED ON INTENT
// ============================================================================
function buildPrescriptionPrompt(ocrText) {
  return `You are an expert medical prescription data extraction AI.

**EXTRACTION TASK:**
Extract structured information from this prescription OCR text.

**EXTRACTION RULES:**
1. Extract ALL medications with complete details
2. Return ONLY valid JSON, no markdown formatting
3. Parse dates in ISO format (YYYY-MM-DD)
4. Normalize phone numbers to international format (+91XXXXXXXXXX)
5. For gender, use: "Male", "Female", or "Other"
6. If information is missing, use null (don't guess)

**OUTPUT SCHEMA:**
{
  "patient": {
    "firstName": "string (required)",
    "lastName": "string (optional)",
    "dateOfBirth": "string ISO YYYY-MM-DD (optional)",
    "age": "number (optional)",
    "gender": "Male|Female|Other (optional)",
    "phone": "string with country code (optional)",
    "email": "string (optional)",
    "address": {
      "line1": "string (optional)",
      "city": "string (optional)",
      "state": "string (optional)",
      "pincode": "string (optional)",
      "country": "string (optional)"
    },
    "mrNo": "string (optional)",
    "patientId": "string (optional)"
  },
  "labReport": {
    "testType": "PRESCRIPTION",
    "testCategory": "Prescription",
    "testDate": "string ISO datetime - prescription date (optional)",
    "reportedDate": "string ISO datetime (optional)",
    "labName": "string - clinic/hospital name (optional)",
    "doctorName": "string (required)",
    "results": [
      {
        "testName": "string - medicine name",
        "value": "string - dosage (e.g., 500mg, 5ml)",
        "unit": "string - unit (tablet/capsule/syrup/injection)",
        "normalRange": "string - frequency (e.g., 1-0-1, twice daily)",
        "flag": "string - duration (e.g., 7 days, 1 month)",
        "category": "Prescription",
        "method": "string - route (oral/topical/injection)",
        "notes": "string - instructions (before food/after food/etc)"
      }
    ],
    "notes": "string - general instructions (optional)",
    "interpretation": "string - diagnosis/symptoms (optional)",
    "technician": "string - pharmacist name (optional)",
    "verifiedBy": "string - doctor signature/license (optional)"
  },
  "metadata": {
    "specimenType": "Prescription",
    "collectionDate": "string ISO datetime (optional)",
    "receivedDate": "string ISO datetime (optional)",
    "reportStatus": "Active|Expired|Cancelled (optional)",
    "clinicAddress": "string (optional)",
    "doctorLicense": "string (optional)",
    "prescriptionNumber": "string (optional)"
  }
}

**OCR TEXT:**
${ocrText}

**OUTPUT (JSON only):`;
}

function buildSpecializedPrompt(intent, ocrText) {
  const testConfig = TEST_INTENTS[intent] || {};
  const expectedFields = testConfig.fields || [];
  const category = testConfig.category || 'General';
  
  // Special handling for PRESCRIPTION
  if (intent === 'PRESCRIPTION') {
    return buildPrescriptionPrompt(ocrText);
  }
  
  return `You are an expert medical lab report data extraction AI specialized in ${intent} tests.

**EXTRACTION TASK:**
Extract structured information from this ${intent} lab report OCR text.

**EXPECTED TEST PARAMETERS:**
${expectedFields.map((field, idx) => `${idx + 1}. ${field}`).join('\n')}

**EXTRACTION RULES:**
1. Extract ALL test parameters with their values, units, and normal ranges
2. Return ONLY valid JSON, no markdown formatting
3. Use exact field names from the expected list when possible
4. For numeric values, extract as numbers (not strings)
5. Parse dates in ISO format (YYYY-MM-DD)
6. Normalize phone numbers to international format (+91XXXXXXXXXX)
7. For gender, use: "Male", "Female", or "Other"
8. For flag values, use: "Normal", "High", "Low", or "Critical"
9. If information is missing, use null (don't guess)
10. Extract both text version and min/max numbers for normal ranges

**OUTPUT SCHEMA:**
{
  "patient": {
    "firstName": "string (required)",
    "lastName": "string (optional)",
    "dateOfBirth": "string ISO YYYY-MM-DD (optional)",
    "age": "number (optional)",
    "gender": "Male|Female|Other (optional)",
    "phone": "string with country code (optional)",
    "email": "string (optional)",
    "address": {
      "line1": "string (optional)",
      "city": "string (optional)",
      "state": "string (optional)",
      "pincode": "string (optional)",
      "country": "string (optional)"
    },
    "mrNo": "string (optional)",
    "labId": "string (optional)"
  },
  "labReport": {
    "testType": "${intent}",
    "testCategory": "${category}",
    "testDate": "string ISO datetime (optional)",
    "reportedDate": "string ISO datetime (optional)",
    "labName": "string (optional)",
    "doctorName": "string (optional)",
    "results": [
      {
        "testName": "string - exact parameter name",
        "value": "number - numeric value",
        "unit": "string - unit of measurement",
        "normalRange": "string - range as text",
        "normalRangeMin": "number (optional)",
        "normalRangeMax": "number (optional)",
        "flag": "Normal|High|Low|Critical",
        "category": "${category}",
        "method": "string - test method (optional)",
        "notes": "string - specific notes for this parameter (optional)"
      }
    ],
    "notes": "string - overall notes (optional)",
    "interpretation": "string - clinical interpretation (optional)",
    "technician": "string (optional)",
    "verifiedBy": "string (optional)"
  },
  "metadata": {
    "specimenType": "string - Blood/Urine/etc (optional)",
    "collectionDate": "string ISO datetime (optional)",
    "receivedDate": "string ISO datetime (optional)",
    "reportStatus": "Final|Preliminary|Corrected (optional)"
  }
}

**OCR TEXT:**
${ocrText}

**OUTPUT (JSON only):`;
}

async function extractWithIntent(ocrText, intent, batchId) {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }
  
  logh(batchId, `📊 Extracting data with ${intent} specialization...`);
  
  const model = genAI.getGenerativeModel({
    model: CONFIG.GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });
  
  const prompt = buildSpecializedPrompt(intent, ocrText);
  
  try {
    const t0 = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const structuredData = JSON.parse(jsonText);
    
    const extractionTime = Date.now() - t0;
    
    // Add extraction metadata
    structuredData.extractionMetadata = {
      intent,
      extractionTimeMs: extractionTime,
      model: CONFIG.GEMINI_MODEL,
      timestamp: new Date().toISOString()
    };
    
    logh(batchId, `✅ Extraction complete: ${structuredData.labReport?.results?.length || 0} parameters (${extractionTime}ms)`);
    
    return structuredData;
  } catch (error) {
    logh(batchId, '❌ Extraction failed:', error.message);
    throw error;
  }
}

// ============================================================================
// PATIENT MATCHING AND CREATION
// ============================================================================
async function matchOrCreatePatient(session, patientData, batchId) {
  let { firstName, lastName, phone, dateOfBirth, gender, email, address } = patientData;
  
  // Normalize phone
  if (phone) {
    phone = phone.replace(/[^\d+]/g, '');
    if (phone.length === 10 && !phone.startsWith('+')) {
      phone = '+91' + phone;
    }
  }
  
  let patient = null;
  let matchedBy = null;
  
  // Try name match
  if (firstName && firstName !== 'Unknown') {
    const query = { firstName: new RegExp(`^${firstName}$`, 'i') };
    if (lastName) {
      query.lastName = new RegExp(`^${lastName}$`, 'i');
    }
    patient = await Patient.findOne(query).session(session);
    if (patient) {
      matchedBy = 'name';
      logh(batchId, `✅ Patient matched by name: ${patient._id}`);
    }
  }
  
  // Try phone match
  if (!patient && phone) {
    patient = await Patient.findOne({ phone }).session(session);
    if (patient) {
      matchedBy = 'phone';
      logh(batchId, `✅ Patient matched by phone: ${patient._id}`);
    }
  }
  
  // Update existing patient with new info
  if (patient) {
    let updated = false;
    if (!patient.lastName && lastName) {
      patient.lastName = lastName;
      updated = true;
    }
    if (!patient.dateOfBirth && dateOfBirth) {
      patient.dateOfBirth = dateOfBirth;
      updated = true;
    }
    if (!patient.gender && gender) {
      patient.gender = gender;
      updated = true;
    }
    if (!patient.email && email) {
      patient.email = email;
      updated = true;
    }
    
    if (updated) {
      await patient.save({ session });
      logh(batchId, '✅ Patient updated with new information');
    }
    
    return { patient, action: 'matched', matchedBy };
  }
  
  // Create new patient
  try {
    const newPatient = await Patient.create([{
      firstName: firstName || 'Unknown',
      lastName: lastName || '',
      phone,
      dateOfBirth,
      gender,
      email,
      address
    }], { session });
    
    logh(batchId, `✅ New patient created: ${newPatient[0]._id}`);
    return { patient: newPatient[0], action: 'created', matchedBy: 'new' };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key, retry lookup
      if (phone) {
        patient = await Patient.findOne({ phone }).session(session);
        if (patient) {
          return { patient, action: 'matched', matchedBy: 'phone-retry' };
        }
      }
      throw new Error('Patient creation failed due to duplicate');
    }
    throw error;
  }
}

// ============================================================================
// MAIN UPLOAD ENDPOINT
// ============================================================================
router.post('/upload', auth, upload.array('files'), async (req, res) => {
  const batchId = uuidv4().slice(0, 8);
  const t0 = Date.now();
  
  logh(batchId, `🚀 Starting enterprise scan: ${req.files?.length || 0} files`);
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'No files uploaded',
      batchId
    });
  }
  
  const results = [];
  const failures = [];
  let session = null;
  
  try {
    session = await startSession();
    logh(batchId, '✅ Database session started');
    
    for (const file of req.files) {
      const fileId = uuidv4().slice(0, 6);
      let tempPath = file.path;
      
      try {
        await session.withTransaction(async () => {
          logh(batchId, `📁 Processing: ${file.originalname}`);
          
          // STEP 1: OCR
          const ocrResult = await performOCR(tempPath, file.mimetype, `${batchId}-${fileId}`);
          
          if (!ocrResult.text || ocrResult.text.length < 50) {
            throw new Error('OCR text too short or empty');
          }
          
          // STEP 2: Intent Detection
          const intentResult = await detectIntent(ocrResult.text, `${batchId}-${fileId}`);
          
          // STEP 3: Specialized Extraction
          const extractedData = await extractWithIntent(
            ocrResult.text,
            intentResult.primaryIntent,
            `${batchId}-${fileId}`
          );
          
          // STEP 4: Match/Create Patient
          const { patient, action, matchedBy } = await matchOrCreatePatient(
            session,
            extractedData.patient,
            `${batchId}-${fileId}`
          );
          
          // STEP 5: Store PDF
          const pdfBuffer = await fs.readFile(tempPath);
          const pdfDoc = await PatientPDF.create([{
            patientId: patient._id,
            title: file.originalname,
            fileName: file.originalname,
            mimeType: file.mimetype,
            data: pdfBuffer,
            size: file.size
          }], { session });
          
          logh(batchId, `✅ PDF stored: ${pdfDoc[0]._id}`);
          
          // STEP 6: Create Lab Report
          const labReport = await LabReport.create([{
            patientId: patient._id,
            appointmentId: null,
            testType: extractedData.labReport.testType || intentResult.primaryIntent,
            results: extractedData.labReport.results || [],
            fileRef: pdfDoc[0]._id,
            uploadedBy: req.user?._id || null,
            rawText: ocrResult.text,
            enhancedText: JSON.stringify(extractedData, null, 2),
            metadata: {
              ocrEngine: ocrResult.engine,
              ocrConfidence: ocrResult.confidence,
              intent: intentResult.primaryIntent,
              intentConfidence: intentResult.confidence,
              testCategory: extractedData.labReport.testCategory,
              extractionTimeMs: extractedData.extractionMetadata.extractionTimeMs,
              model: CONFIG.GEMINI_MODEL,
              ...extractedData.metadata
            }
          }], { session });
          
          logh(batchId, `✅ Lab report created: ${labReport[0]._id}`);
          
          results.push({
            file: file.originalname,
            success: true,
            patient: {
              id: patient._id,
              name: `${patient.firstName} ${patient.lastName || ''}`.trim(),
              action,
              matchedBy
            },
            labReport: {
              id: labReport[0]._id,
              testType: extractedData.labReport.testType,
              testCategory: extractedData.labReport.testCategory,
              resultsCount: extractedData.labReport.results?.length || 0,
              intent: intentResult.primaryIntent,
              intentConfidence: intentResult.confidence
            },
            ocr: {
              engine: ocrResult.engine,
              confidence: ocrResult.confidence,
              textLength: ocrResult.text.length
            },
            pdf: {
              id: pdfDoc[0]._id
            }
          });
        });
      } catch (error) {
        logh(batchId, `❌ File processing failed: ${file.originalname}`, error.message);
        failures.push({
          file: file.originalname,
          error: error.message
        });
      } finally {
        // Cleanup temp file
        await cleanupTempFile(tempPath);
      }
    }
    
    const totalTime = Date.now() - t0;
    logh(batchId, `🏁 Batch complete: ${results.length} success, ${failures.length} failed (${totalTime}ms)`);
    
    return res.json({
      ok: failures.length === 0,
      batchId,
      processed: results.length,
      failed: failures.length,
      totalTimeMs: totalTime,
      results,
      failures: failures.length > 0 ? failures : undefined
    });
    
  } catch (error) {
    logh(batchId, '💥 Fatal error:', error.message);
    return res.status(500).json({
      ok: false,
      error: error.message,
      batchId,
      results,
      failures
    });
  } finally {
    if (session) {
      await session.endSession();
      logh(batchId, '✅ Database session ended');
    }
  }
});

// ============================================================================
// NEW: SCAN AND EXTRACT FOR ADD PATIENT FORM (Auto-fill)
// ============================================================================
router.post('/scan-medical', auth, upload.single('image'), async (req, res) => {
  const batchId = `scan-${Date.now()}`;
  const t0 = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    
    // Check if patientId is provided for saving to patient record
    const patientId = req.body.patientId;
    
    logh(batchId, `📸 Processing single image for auto-fill: ${req.file.originalname}`);
    if (patientId) {
      logh(batchId, `👤 Patient ID provided: ${patientId} - Will save to patient record`);
    }
    
    // STEP 1: OCR
    const ocrResult = await performOCR(req.file.path, req.file.mimetype, batchId);
    
    // STEP 2: Intent Detection
    const intentResult = await detectIntent(ocrResult.text, batchId);
    
    // STEP 3: Extract Data
    const extractedData = await extractWithIntent(ocrResult.text, intentResult.primaryIntent, batchId);
    
    let savedImagePath = null;
    let reportId = null;
    
    // STEP 4: If patientId provided, save to patient record AND MongoDB
    if (patientId) {
      try {
        // Find patient
        const patient = await Patient.findById(patientId);
        
        if (!patient) {
          logh(batchId, `❌ Patient not found: ${patientId}`);
          // Continue without saving, just return extracted data
        } else {
          // Read file buffer
          const fileBuffer = await fs.readFile(req.file.path);
          
          // Store PDF/Image in MongoDB
          const patientPDF = new PatientPDF({
            patientId: patientId,
            title: `${intentResult.primaryIntent} Report`,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            data: fileBuffer,
            size: fileBuffer.length,
            uploadedAt: new Date()
          });
          
          await patientPDF.save();
          const pdfIdString = patientPDF._id.toString();
          savedImagePath = pdfIdString; // Store PDF ID, not file path
          
          logh(batchId, `💾 Image saved to MongoDB: ${pdfIdString}`);
          
          // Map intent to valid reportType enum
          const reportTypeMap = {
            'THYROID': 'LAB_REPORT',
            'BLOOD_COUNT': 'LAB_REPORT',
            'LIPID': 'LAB_REPORT',
            'DIABETES': 'LAB_REPORT',
            'LIVER': 'LAB_REPORT',
            'KIDNEY': 'LAB_REPORT',
            'VITAMIN': 'LAB_REPORT',
            'URINE': 'LAB_REPORT',
            'CARDIAC': 'LAB_REPORT',
            'HORMONE': 'LAB_REPORT',
            'INFECTION': 'LAB_REPORT',
            'PRESCRIPTION': 'PRESCRIPTION',
            'DISCHARGE': 'DISCHARGE_SUMMARY',
            'RADIOLOGY': 'RADIOLOGY_REPORT',
            'GENERIC': 'GENERAL'
          };
          
          const reportType = reportTypeMap[intentResult.primaryIntent] || 'LAB_REPORT';
          
          // Save to appropriate collection based on document type
          if (intentResult.primaryIntent === 'PRESCRIPTION') {
            // Save to PrescriptionDocument collection
            // Note: Gemini AI returns prescription data in labReport field
            const prescData = extractedData.labReport || {};
            const prescriptionDoc = new PrescriptionDocument({
              patientId: patientId,
              pdfId: pdfIdString,
              doctorName: prescData.doctorName || '',
              hospitalName: prescData.labName || '',
              prescriptionDate: prescData.testDate || new Date(),
              medicines: prescData.results?.map(r => ({
                name: r.testName || '',
                dosage: r.value || '',
                frequency: r.unit || '',
                duration: r.normalRange || '',
                instructions: r.notes || ''
              })) || [],
              diagnosis: prescData.interpretation || '',
              instructions: prescData.notes || '',
              ocrText: ocrResult.text,
              ocrEngine: ocrResult.engine === 'vision' ? 'google-vision' : ocrResult.engine,
              ocrConfidence: ocrResult.confidence,
              extractedData: extractedData,
              intent: intentResult.primaryIntent,
              status: 'completed',
              uploadedBy: req.user?._id || null,
              uploadDate: new Date()
            });
            
            await prescriptionDoc.save();
            reportId = prescriptionDoc._id.toString();
            logh(batchId, `💊 Created PrescriptionDocument: ${reportId}`);
            
          } else {
            // Save to LabReportDocument collection (for lab reports)
            const labReportDoc = new LabReportDocument({
              patientId: patientId,
              pdfId: pdfIdString,
              testType: intentResult.primaryIntent,
              testCategory: TEST_INTENTS[intentResult.primaryIntent]?.category || 'General',
              intent: intentResult.primaryIntent,
              labName: extractedData.labReport?.labName || '',
              reportDate: extractedData.labReport?.reportDate || new Date(),
              results: extractedData.labReport?.results?.map(r => ({
                testName: r.testName || r.parameter || '',
                value: r.value?.toString() || '',
                unit: r.unit || '',
                referenceRange: r.referenceRange || r.normalRange || '',
                flag: r.flag || ''
              })) || [],
              ocrText: ocrResult.text,
              ocrEngine: ocrResult.engine === 'vision' ? 'google-vision' : ocrResult.engine,
              ocrConfidence: ocrResult.confidence,
              extractedData: extractedData,
              extractionQuality: 'good',
              status: 'completed',
              uploadedBy: req.user?._id || null,
              uploadDate: new Date()
            });
            
            await labReportDoc.save();
            reportId = labReportDoc._id.toString();
            logh(batchId, `🧪 Created LabReportDocument: ${reportId}`);
          }
          
          // Create LabReport entry (for backward compatibility)
          const labReport = new LabReport({
            patientId: patientId,
            testType: intentResult.primaryIntent,
            results: extractedData.testResults || [],
            fileRef: pdfIdString,
            uploadedBy: req.user?._id || null,
            rawText: ocrResult.text,
            enhancedText: JSON.stringify(extractedData),
            metadata: {
              ocrEngine: ocrResult.engine,
              ocrConfidence: ocrResult.confidence,
              intent: intentResult.primaryIntent,
              intentConfidence: intentResult.confidence,
              testCategory: TEST_INTENTS[intentResult.primaryIntent]?.category || 'General'
            }
          });
          
          await labReport.save();
          
          logh(batchId, `📊 Created LabReport (legacy): ${labReport._id}`);
          
          // Add report to patient record (store PDF ID as string)
          patient.medicalReports.push({
            reportId: reportId,
            reportType: reportType,
            imagePath: pdfIdString, // Store MongoDB PDF ID (same as bulk upload)
            uploadDate: new Date(),
            uploadedBy: req.user?._id || null,
            extractedData: extractedData,
            ocrText: ocrResult.text,
            intent: intentResult.primaryIntent
          });
          
          await patient.save();
          
          logh(batchId, `✅ Report attached to patient: ${patientId}`);
        }
      } catch (saveError) {
        logh(batchId, `⚠️ Failed to save to patient record: ${saveError.message}`);
        // Continue execution, return extracted data anyway
      }
    }
    
    // Cleanup temp file
    await cleanupTempFile(req.file.path);
    
    const totalTime = Date.now() - t0;
    logh(batchId, `✅ Scan complete (${totalTime}ms)`);
    
    return res.json({
      success: true,
      intent: intentResult.primaryIntent,
      ocrText: ocrResult.text,
      extractedData: {
        medicalHistory: extractedData.patient?.medicalHistory?.join(', ') || '',
        allergies: extractedData.patient?.allergies?.join(', ') || '',
        diagnosis: extractedData.labReport?.diagnosis || '',
        medications: extractedData.patient?.currentMedications?.map(m => m.name).join(', ') || '',
        testResults: extractedData.labReport?.results || []
      },
      metadata: {
        ocrEngine: ocrResult.engine,
        ocrConfidence: ocrResult.confidence,
        intentConfidence: intentResult.confidence,
        processingTimeMs: totalTime
      },
      // Add saved image info if patient record was updated
      savedToPatient: patientId ? {
        patientId: patientId,
        imagePath: savedImagePath, // This is now the PDF ID
        pdfId: savedImagePath, // Explicitly include pdfId for frontend
        reportId: reportId,
        saved: savedImagePath !== null
      } : null
    });
    
  } catch (error) {
    logh(batchId, '❌ Scan failed:', error.message);
    // Cleanup on error
    if (req.file?.path) {
      await cleanupTempFile(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// NEW: BULK UPLOAD WITH PATIENT MATCHING
// ============================================================================
router.post('/bulk-upload-with-matching', auth, upload.array('images', CONFIG.MAX_FILES_PER_UPLOAD), async (req, res) => {
  const batchId = `bulk-${Date.now()}`;
  const t0 = Date.now();
  let results = [];
  let failures = [];
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    
    logh(batchId, `📤 Bulk upload: ${req.files.length} files`);
    
    // Create uploads directory if doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/medical-reports');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Process each file
    for (const file of req.files) {
      const tempPath = file.path;
      
      try {
        logh(batchId, `📄 Processing: ${file.originalname}`);
        
        // STEP 1: OCR
        const ocrResult = await performOCR(tempPath, file.mimetype, batchId);
        
        // STEP 2: Intent Detection
        const intentResult = await detectIntent(ocrResult.text, batchId);
        
        // STEP 3: Extract Data (including patient name)
        const extractedData = await extractWithIntent(ocrResult.text, intentResult.primaryIntent, batchId);
        
        // STEP 4: Find Patient by Name
        let patient = null;
        let matchedBy = 'none';
        
        if (extractedData.patient?.firstName) {
          const firstName = extractedData.patient.firstName.trim();
          const lastName = extractedData.patient.lastName?.trim() || '';
          
          logh(batchId, `🔍 Searching for patient: ${firstName} ${lastName}`);
          
          // Try exact match first
          patient = await Patient.findOne({
            firstName: new RegExp(`^${firstName}$`, 'i'),
            ...(lastName && { lastName: new RegExp(`^${lastName}$`, 'i') })
          });
          
          if (patient) {
            matchedBy = 'name-exact';
            logh(batchId, `✅ Patient found (exact): ${patient._id}`);
          } else {
            // Try partial match on firstName only
            patient = await Patient.findOne({
              firstName: new RegExp(firstName, 'i')
            });
            
            if (patient) {
              matchedBy = 'name-partial';
              logh(batchId, `⚠️ Patient found (partial): ${patient._id}`);
            }
          }
        }
        
        if (!patient) {
          logh(batchId, `❌ Patient not found for: ${file.originalname}`);
          failures.push({
            file: file.originalname,
            error: 'Patient not found',
            extractedName: `${extractedData.patient?.firstName || ''} ${extractedData.patient?.lastName || ''}`.trim(),
            intent: intentResult.primaryIntent
          });
          await cleanupTempFile(tempPath);
          continue;
        }
        
        // STEP 5: Save image to MongoDB (same as individual upload)
        const fileBuffer = await fs.readFile(tempPath);
        
        // Store PDF/Image in MongoDB
        const patientPDF = new PatientPDF({
          patientId: patient._id,
          title: `${intentResult.primaryIntent} Report`,
          fileName: file.originalname,
          mimeType: file.mimetype,
          data: fileBuffer,
          size: fileBuffer.length,
          uploadedAt: new Date()
        });
        
        await patientPDF.save();
        const pdfIdString = patientPDF._id.toString(); // Convert ObjectId to string
        logh(batchId, `💾 Image stored in MongoDB: ${pdfIdString}`);
        
        // Create LabReport entry
        const labReport = new LabReport({
          patientId: patient._id,
          testType: intentResult.primaryIntent,
          results: extractedData.testResults || [],
          fileRef: pdfIdString, // Use string ID
          uploadedBy: req.user?._id || null,
          rawText: ocrResult.text,
          enhancedText: JSON.stringify(extractedData),
          metadata: {
            ocrEngine: ocrResult.engine,
            ocrConfidence: ocrResult.confidence,
            intent: intentResult.primaryIntent,
            intentConfidence: intentResult.confidence,
            testCategory: TEST_INTENTS[intentResult.primaryIntent]?.category || 'General'
          }
        });
        
        await labReport.save();
        const labReportIdString = labReport._id.toString(); // Convert ObjectId to string
        logh(batchId, `📊 Created LabReport: ${labReportIdString}`);
        
        // Map intent to valid reportType enum
        const reportTypeMap = {
          'THYROID': 'LAB_REPORT',
          'BLOOD_COUNT': 'LAB_REPORT',
          'LIPID': 'LAB_REPORT',
          'DIABETES': 'LAB_REPORT',
          'LIVER': 'LAB_REPORT',
          'KIDNEY': 'LAB_REPORT',
          'VITAMIN': 'LAB_REPORT',
          'URINE': 'LAB_REPORT',
          'CARDIAC': 'LAB_REPORT',
          'HORMONE': 'LAB_REPORT',
          'INFECTION': 'LAB_REPORT',
          'PRESCRIPTION': 'PRESCRIPTION',
          'DISCHARGE': 'DISCHARGE_SUMMARY',
          'RADIOLOGY': 'RADIOLOGY_REPORT',
          'GENERIC': 'GENERAL'
        };
        
        const reportType = reportTypeMap[intentResult.primaryIntent] || 'LAB_REPORT';
        
        // STEP 6: Add report to patient record (store PDF ID as string)
        patient.medicalReports.push({
          reportId: labReportIdString,
          reportType: reportType, // Use mapped value
          imagePath: pdfIdString, // Store MongoDB PDF ID as string (same as individual upload)
          uploadDate: new Date(),
          uploadedBy: req.user?._id || null,
          extractedData: extractedData,
          ocrText: ocrResult.text,
          intent: intentResult.primaryIntent // Store specific intent here
        });
        
        await patient.save();
        
        logh(batchId, `✅ Report attached to patient: ${patient._id}`);
        
        results.push({
          file: file.originalname,
          success: true,
          patient: {
            id: patient._id,
            name: `${patient.firstName} ${patient.lastName || ''}`.trim(),
            matchedBy
          },
          report: {
            imagePath: pdfIdString, // Return PDF ID as string
            pdfId: pdfIdString, // Explicitly include pdfId
            reportId: labReportIdString,
            intent: intentResult.primaryIntent,
            intentConfidence: intentResult.confidence
          },
          ocr: {
            engine: ocrResult.engine,
            confidence: ocrResult.confidence,
            textLength: ocrResult.text.length
          }
        });
        
      } catch (error) {
        logh(batchId, `❌ File processing failed: ${file.originalname}`, error.message);
        failures.push({
          file: file.originalname,
          error: error.message
        });
      } finally {
        // Cleanup temp file
        await cleanupTempFile(tempPath);
      }
    }
    
    const totalTime = Date.now() - t0;
    logh(batchId, `🏁 Bulk upload complete: ${results.length} success, ${failures.length} failed (${totalTime}ms)`);
    
    return res.json({
      success: failures.length === 0,
      batchId,
      processed: results.length,
      failed: failures.length,
      totalTimeMs: totalTime,
      results,
      failures: failures.length > 0 ? failures : undefined
    });
    
  } catch (error) {
    logh(batchId, '💥 Fatal error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      batchId,
      results,
      failures
    });
  }
});

// ============================================================================
// NEW: ATTACH REPORT TO EXISTING PATIENT (FROM ADD PATIENT FORM)
// ============================================================================
router.post('/attach-report/:patientId', auth, upload.single('image'), async (req, res) => {
  const batchId = `attach-${Date.now()}`;
  const { patientId } = req.params;
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    
    logh(batchId, `📎 Attaching report to patient: ${patientId}`);
    
    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      await cleanupTempFile(req.file.path);
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    // Process image
    const ocrResult = await performOCR(req.file.path, req.file.mimetype, batchId);
    const intentResult = await detectIntent(ocrResult.text, batchId);
    const extractedData = await extractWithIntent(ocrResult.text, intentResult.primaryIntent, batchId);
    
    // Read file buffer for database storage
    const fileBuffer = await fs.readFile(req.file.path);
    
    // Store PDF/Image in MongoDB
    const patientPDF = new PatientPDF({
      patientId: patientId,
      title: `${intentResult.primaryIntent} Report`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      data: fileBuffer,
      size: fileBuffer.length,
      uploadedAt: new Date()
    });
    
    await patientPDF.save();
    logh(batchId, `💾 Stored PDF in database: ${patientPDF._id}`);
    
    // Create LabReport entry
    const labReport = new LabReport({
      patientId: patientId,
      testType: intentResult.primaryIntent,
      results: extractedData.testResults || [],
      fileRef: patientPDF._id,
      uploadedBy: req.user?._id || null,
      rawText: ocrResult.text,
      enhancedText: JSON.stringify(extractedData),
      metadata: {
        ocrEngine: ocrResult.engine,
        ocrConfidence: ocrResult.confidence,
        intent: intentResult.primaryIntent,
        intentConfidence: intentResult.confidence,
        testCategory: TEST_INTENTS[intentResult.primaryIntent]?.category || 'General'
      }
    });
    
    await labReport.save();
    logh(batchId, `📊 Created LabReport: ${labReport._id}`);
    
    // Map intent to valid reportType enum (same as batch upload)
    const reportTypeMap = {
      'THYROID': 'LAB_REPORT',
      'BLOOD_COUNT': 'LAB_REPORT',
      'LIPID': 'LAB_REPORT',
      'DIABETES': 'LAB_REPORT',
      'LIVER': 'LAB_REPORT',
      'KIDNEY': 'LAB_REPORT',
      'VITAMIN': 'LAB_REPORT',
      'URINE': 'LAB_REPORT',
      'STOOL': 'LAB_REPORT',
      'RADIOLOGY': 'RADIOLOGY_REPORT',
      'XRAY': 'RADIOLOGY_REPORT',
      'ULTRASOUND': 'RADIOLOGY_REPORT',
      'CT_SCAN': 'RADIOLOGY_REPORT',
      'MRI': 'RADIOLOGY_REPORT',
      'PRESCRIPTION': 'PRESCRIPTION',
      'DISCHARGE_SUMMARY': 'DISCHARGE_SUMMARY'
    };
    
    const reportType = reportTypeMap[intentResult.primaryIntent] || 'LAB_REPORT';
    
    // Add reference to patient's medicalReports (for backward compatibility)
    patient.medicalReports.push({
      reportId: labReport._id,
      reportType: reportType, // ✅ Fixed: Now uses mapped enum value
      imagePath: patientPDF._id, // Store PDF ID instead of file path
      uploadDate: new Date(),
      uploadedBy: req.user?._id || null,
      extractedData: extractedData,
      ocrText: ocrResult.text,
      intent: intentResult.primaryIntent
    });
    
    await patient.save();
    
    // Cleanup temp file
    await cleanupTempFile(req.file.path);
    
    logh(batchId, `✅ Report attached successfully`);
    
    return res.json({
      success: true,
      reportId: labReport._id,
      pdfId: patientPDF._id,
      intent: intentResult.primaryIntent,
      testResults: extractedData.testResults?.length || 0
    });
    
  } catch (error) {
    logh(batchId, '❌ Attach failed:', error.message);
    if (req.file?.path) {
      await cleanupTempFile(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// GET PDF FROM DATABASE
// ============================================================================
router.get('/pdf/:pdfId', auth, async (req, res) => {
  try {
    const { pdfId } = req.params;
    
    const pdf = await PatientPDF.findById(pdfId);
    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }
    
    // Set content type and send binary data
    res.set({
      'Content-Type': pdf.mimeType,
      'Content-Disposition': `inline; filename="${pdf.fileName}"`,
      'Content-Length': pdf.size
    });
    
    return res.send(pdf.data);
  } catch (error) {
    console.error('Error retrieving PDF:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// GET PDF FROM DATABASE (PUBLIC - NO AUTH)
// For displaying images in Image.network() which can't send auth headers
// ============================================================================
router.get('/pdf-public/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params;
    
    console.log(`[PDF-PUBLIC] Fetching PDF: ${pdfId}`);
    
    const pdf = await PatientPDF.findById(pdfId);
    if (!pdf) {
      console.log(`[PDF-PUBLIC] PDF not found: ${pdfId}`);
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }
    
    console.log(`[PDF-PUBLIC] PDF found: ${pdf.fileName}, size: ${pdf.size}, type: ${pdf.mimeType}`);
    
    // Set content type and send binary data
    res.set({
      'Content-Type': pdf.mimeType,
      'Content-Disposition': `inline; filename="${pdf.fileName}"`,
      'Content-Length': pdf.size,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });
    
    return res.send(pdf.data);
  } catch (error) {
    console.error('[PDF-PUBLIC] Error retrieving PDF:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// GET LAB REPORTS FOR PATIENT (WITH MEDICAL HISTORY)
// ============================================================================
router.get('/reports/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  
  try {
    // Fetch from OLD LabReport collection
    const oldReports = await LabReport.find({ patientId })
      .sort({ createdAt: -1 })
      .select('_id testType results metadata createdAt fileRef')
      .lean();
    
    const enrichedOldReports = oldReports.map(report => ({
      id: report._id,
      _id: report._id,
      testType: report.testType,
      testCategory: report.metadata?.testCategory || 'General',
      intent: report.metadata?.intent || 'GENERAL',
      resultsCount: Array.isArray(report.results) ? report.results.length : Object.keys(report.results || {}).length,
      results: report.results,
      date: report.createdAt,
      createdAt: report.createdAt,
      pdfId: report.fileRef,
      ocrEngine: report.metadata?.ocrEngine,
      confidence: report.metadata?.ocrConfidence,
      extractionQuality: report.metadata?.extractionQuality || 'unknown',
      metadata: report.metadata,
      source: 'old' // Mark as old storage
    }));
    
    // Fetch from NEW patients.medicalReports array
    const patient = await Patient.findById(patientId).select('medicalReports').lean();
    const newReports = patient?.medicalReports || [];
    
    const enrichedNewReports = newReports.map(report => ({
      id: report.reportId,
      _id: report.reportId,
      testType: report.intent || report.reportType,
      testCategory: report.intent || 'General',
      intent: report.intent || 'GENERAL',
      resultsCount: report.extractedData?.labReport?.results?.length || 0,
      results: report.extractedData?.labReport?.results || [],
      date: report.uploadDate,
      createdAt: report.uploadDate,
      pdfId: report.imagePath, // Use imagePath as pdfId for image viewing
      ocrEngine: 'google-vision',
      confidence: report.extractedData?.metadata?.ocrConfidence,
      extractionQuality: 'good',
      metadata: {
        intent: report.intent,
        ocrText: report.ocrText,
        extractedData: report.extractedData,
        uploadedBy: report.uploadedBy
      },
      source: 'new', // Mark as new storage
      imagePath: report.imagePath // Include image path
    }));
    
    // Combine both sources, sorted by date (newest first)
    const allReports = [...enrichedNewReports, ...enrichedOldReports]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return res.json({
      success: true,
      ok: true,
      patientId,
      count: allReports.length,
      oldCount: enrichedOldReports.length,
      newCount: enrichedNewReports.length,
      reports: allReports
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================================
// GET LAB REPORT DETAILS
// ============================================================================
router.get('/report/:reportId', auth, async (req, res) => {
  const { reportId } = req.params;
  
  try {
    const report = await LabReport.findById(reportId)
      .populate('patientId', 'firstName lastName dateOfBirth gender phone email')
      .lean();
    
    if (!report) {
      return res.status(404).json({
        ok: false,
        error: 'Report not found'
      });
    }
    
    return res.json({
      ok: true,
      report: {
        id: report._id,
        patient: report.patientId,
        testType: report.testType,
        testCategory: report.metadata?.testCategory || 'General',
        results: report.results,
        metadata: report.metadata,
        rawText: report.rawText,
        enhancedText: report.enhancedText,
        pdfId: report.fileRef,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================================
// VIEW PDF
// ============================================================================
router.get('/pdf/:id', auth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const pdf = await PatientPDF.findById(id);
    
    if (!pdf) {
      return res.status(404).json({
        ok: false,
        error: 'PDF not found'
      });
    }
    
    res.setHeader('Content-Type', pdf.mimeType || 'application/pdf');
    res.setHeader('Content-Length', pdf.size || pdf.data.length);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);
    
    return res.send(pdf.data);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
router.get('/health', auth, async (req, res) => {
  return res.json({
    ok: true,
    services: {
      visionAPI: visionClient ? 'available' : 'not_configured',
      geminiAPI: genAI ? 'available' : 'not_configured'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// GET PRESCRIPTIONS FOR PATIENT (SEPARATE COLLECTION)
// ============================================================================
router.get('/prescriptions/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  const { limit = 100, skip = 0 } = req.query;
  
  try {
    console.log(`[PRESCRIPTIONS] Fetching for patient: ${patientId}`);
    
    // Fetch from PrescriptionDocument collection
    const prescriptions = await PrescriptionDocument.find({ patientId })
      .sort({ uploadDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    console.log(`[PRESCRIPTIONS] Found ${prescriptions.length} prescriptions`);
    
    // Format response
    const formattedPrescriptions = prescriptions.map(prescription => ({
      id: prescription._id,
      _id: prescription._id,
      patientId: prescription.patientId,
      pdfId: prescription.pdfId,
      doctorName: prescription.doctorName,
      hospitalName: prescription.hospitalName,
      prescriptionDate: prescription.prescriptionDate,
      date: prescription.prescriptionDate, // For frontend date extraction
      medicines: prescription.medicines,
      // Map medicines to results array for frontend compatibility
      results: prescription.medicines?.map(med => ({
        testName: med.name,
        value: med.dosage,
        unit: med.frequency,
        normalRange: med.duration,
        notes: med.instructions
      })) || [],
      resultsCount: prescription.medicines?.length || 0,
      diagnosis: prescription.diagnosis,
      instructions: prescription.instructions,
      uploadDate: prescription.uploadDate,
      uploadedBy: prescription.uploadedBy,
      ocrConfidence: prescription.ocrConfidence,
      status: prescription.status
    }));
    
    return res.json({
      success: true,
      ok: true,
      patientId,
      count: formattedPrescriptions.length,
      prescriptions: formattedPrescriptions
    });
  } catch (error) {
    console.error('[PRESCRIPTIONS] Error:', error);
    return res.status(500).json({
      success: false,
      ok: false,
      error: error.message
    });
  }
});

// ============================================================================
// GET LAB REPORTS FOR PATIENT (SEPARATE COLLECTION)
// ============================================================================
router.get('/lab-reports/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  const { limit = 100, skip = 0 } = req.query;
  
  try {
    console.log(`[LAB REPORTS] Fetching for patient: ${patientId}`);
    
    // Fetch from LabReportDocument collection
    const labReports = await LabReportDocument.find({ patientId })
      .sort({ uploadDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    console.log(`[LAB REPORTS] Found ${labReports.length} lab reports`);
    
    // Format response
    const formattedReports = labReports.map(report => ({
      id: report._id,
      _id: report._id,
      patientId: report.patientId,
      pdfId: report.pdfId,
      testType: report.testType,
      testCategory: report.testCategory,
      intent: report.intent,
      labName: report.labName,
      reportDate: report.reportDate,
      results: report.results,
      uploadDate: report.uploadDate,
      uploadedBy: report.uploadedBy,
      ocrConfidence: report.ocrConfidence,
      extractionQuality: report.extractionQuality,
      status: report.status
    }));
    
    return res.json({
      success: true,
      ok: true,
      patientId,
      count: formattedReports.length,
      reports: formattedReports
    });
  } catch (error) {
    console.error('[LAB REPORTS] Error:', error);
    return res.status(500).json({
      success: false,
      ok: false,
      error: error.message
    });
  }
});

// ============================================================================
// UPDATE PATIENT ID FOR DOCUMENTS (from temp ID to real ID after patient creation)
// ============================================================================
router.post('/update-patient-id', auth, async (req, res) => {
  const { oldPatientId, newPatientId } = req.body;
  
  if (!oldPatientId || !newPatientId) {
    return res.status(400).json({
      success: false,
      error: 'oldPatientId and newPatientId are required'
    });
  }
  
  try {
    console.log(`[UPDATE PATIENT ID] Updating from ${oldPatientId} to ${newPatientId}`);
    
    // Update PatientPDF collection
    const pdfResult = await PatientPDF.updateMany(
      { patientId: oldPatientId },
      { $set: { patientId: newPatientId } }
    );
    
    // Update PrescriptionDocument collection
    const prescriptionResult = await PrescriptionDocument.updateMany(
      { patientId: oldPatientId },
      { $set: { patientId: newPatientId } }
    );
    
    // Update LabReportDocument collection
    const labReportResult = await LabReportDocument.updateMany(
      { patientId: oldPatientId },
      { $set: { patientId: newPatientId } }
    );
    
    const totalUpdated = pdfResult.modifiedCount + prescriptionResult.modifiedCount + labReportResult.modifiedCount;
    
    console.log(`[UPDATE PATIENT ID] Updated documents:
      - PatientPDF: ${pdfResult.modifiedCount}
      - PrescriptionDocument: ${prescriptionResult.modifiedCount}
      - LabReportDocument: ${labReportResult.modifiedCount}
      - Total: ${totalUpdated}`);
    
    return res.json({
      success: true,
      ok: true,
      updated: totalUpdated,
      details: {
        patientPdf: pdfResult.modifiedCount,
        prescriptions: prescriptionResult.modifiedCount,
        labReports: labReportResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('[UPDATE PATIENT ID] Error:', error);
    return res.status(500).json({
      success: false,
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;

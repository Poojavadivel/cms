const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const auth = require('../Middleware/Auth'); // Add authentication

const {
  Patient, LabReport, PatientPDF, startSession
} = require('../Models'); // adjust path if needed


function normalizePhone(raw) { if (!raw) return null; try { let s = String(raw).trim(); s = s.replace(/[.\-()\s]/g, ''); s = s.replace(/(?!^\+)\D/g, ''); s = s.replace(/^0+/, ''); const digits = s.replace(/\D/g, ''); if (!s.startsWith('+') && digits.length === 10) return '+91' + digits; if (s.startsWith('+') && digits.length >= 8 && digits.length <= 15) return '+' + digits; if (!s.startsWith('+') && digits.length >= 8 && digits.length <= 15) return '+' + digits; return null; } catch (e) { return null; } }

// Defensive extractor




const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 }, fileFilter: (req, file, cb) => { const ok = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype); if (!ok) return cb(new Error(`Only PDF/JPG/PNG allowed. Got: ${file.mimetype}`)); cb(null, true); } });

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

    // Use keyFilename instead of credentials object (recommended approach)
    // But since we have env var, use credentials with proper format
    visionClient = new vision.ImageAnnotatorClient({
      credentials: creds,  // Pass entire credentials object
      projectId: creds.project_id
    });

    console.log('[scanner:init] ✅ Vision client initialized successfully (project:', creds.project_id, ')');
  } catch (e) {
    console.error('[scanner:init] 💥 Failed to initialize Vision client:', e.message || e);
  }
})();

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const nowMs = () => Date.now();
const logh = (batchId, ...args) => console.log(`[scanner ${batchId}]`, ...args);

async function storePdf({ buffer, fileName, mimeType, patientId, batchId }) { const size = buffer.length; const hash = sha256(buffer); logh(batchId, `→ storing binary: ${fileName} (${mimeType}, ${size} bytes), sha256=${hash.slice(0,8)}…`); const doc = await PatientPDF.create({ patientId, title: fileName, fileName, mimeType: mimeType || 'application/pdf', data: buffer, size }); logh(batchId, `✓ stored PatientPDF id=${doc._id}`); return doc; }

async function ocrAny({ buffer, mimetype, batchId, fileName }) { const t0 = nowMs(); if (mimetype === 'application/pdf') { logh(batchId, `PDF detected: ${fileName} → trying embedded text via pdf-parse (ESM import)…`); try { const { default: pdfParse } = await import('pdf-parse'); const parsed = await pdfParse(buffer); const text = (parsed?.text || '').trim(); const t1 = nowMs(); if (text.length > 0) { logh(batchId, `pdf-parse ✓ chars=${text.length}, pages=${parsed.numpages}, took=${t1 - t0}ms`); return { text, engine: 'pdf-parse', confidence: null, tookMs: t1 - t0 }; } logh(batchId, `pdf-parse found NO text layer (probably scanned).`); return { text: '', engine: 'pdf-parse', confidence: null, tookMs: t1 - t0 }; } catch (e) { const t1 = nowMs(); logh(batchId, `pdf-parse import/use error: ${e.message} (took ${t1 - t0}ms)`); return { text: '', engine: 'pdf-parse-error', confidence: null, tookMs: t1 - t0 }; } }
  if (!visionClient) { logh(batchId, `Vision client not configured → cannot OCR image ${fileName}`); return { text: '', engine: 'none', confidence: null, tookMs: 0 }; }
  logh(batchId, `Image detected: ${fileName} → sharp preprocess (rotate→grayscale→normalize→png)`);
  let prepped; try { prepped = await sharp(buffer).rotate().grayscale().normalize().png().toBuffer(); } catch (e) { logh(batchId, '✗ sharp preprocessing failed:', e.message || e); return { text: '', engine: 'sharp-error', confidence: null, tookMs: 0 }; }
  const t1 = nowMs(); logh(batchId, `calling Vision.documentTextDetection (bytes=${prepped.length})…`);
  try { const [resp] = await visionClient.documentTextDetection({ image: { content: prepped } }); const t2 = nowMs(); const raw = resp?.fullTextAnnotation?.text || ''; const text = raw.replace(/\u00AD/g, '').replace(/-\n(?=\p{L})/gu, '').replace(/[ \t]+\n/g, '\n').trim(); let sum = 0, cnt = 0; resp?.fullTextAnnotation?.pages?.forEach(p => p.blocks?.forEach(b => b.paragraphs?.forEach(pa => pa.words?.forEach(w => { if (w.confidence != null) { sum += w.confidence; cnt++; } })))); const confidence = cnt ? +(sum / cnt).toFixed(3) : null; logh(batchId, `Vision ✓ chars=${text.length}, avgConf=${confidence}, took=${t2 - t1}ms (total=${t2 - t0}ms)`); return { text, engine: 'vision', confidence, tookMs: t2 - t1 }; } catch (e) { const t2 = nowMs(); logh(batchId, `Vision call failed: ${e.message || e} (took ${t2 - t1}ms)`); return { text: '', engine: 'vision-error', confidence: null, tookMs: t2 - t1 }; } }




// ============================================================================
// ENTERPRISE-GRADE LOCAL PARSER - GPT-Level Accuracy
// ============================================================================
function localParseHighQuality(text) {
  const rawText = text || '';
  const lines = rawText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  const joined = lines.join('\n');

  // -------------------------------------------------------------------------
  // 1. PATIENT NAME EXTRACTION (Multi-Strategy)
  // -------------------------------------------------------------------------
  let firstName = null, lastName = null;

  // Strategy 1: Explicit labels with variations
  const namePatterns = [
    /(?:Patient\s*Name|Name|Pt\.?\s*Name|Patient|Subject)\s*[:\-]\s*([A-Z][A-Za-z\s.''-]+?)(?:\s{2,}|$|\||Age|DOB|Phone|Gender|Sex)/i,
    /(?:^|\n)Name\s*[:\-]?\s*([A-Z][A-Za-z\s.''-]+?)(?:\s{2,}|$|\n)/im,
    /(?:MR\s*No|ID|Reg\.?\s*No\.?)\s*[:\-]?\s*[\w\-]+\s+([A-Z][A-Za-z\s.''-]+?)(?:\s{2,}|$|\n)/i,
    /([A-Z]+\s[A-Z]+(?:\s[A-Z])?)/, // All caps name
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

  // Strategy 2: Capitalized name at document start (first 5 lines)
  if (!fullName) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Match: Two or more capitalized words (potential name)
      const match = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s|$)/);
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
    /(?:Phone|Mobile|Cell|Contact|Tel\.?|Ph\.?)\s*[:\-]?\s*(\+?\d[\d\s\-\(\)]{7,})/i,
    /\b(\+91[\s\-]?\d{10})\b/,
    /\b(\d{10})\b/,  // 10-digit Indian number
    /\b(\+\d{1,3}[\s\-]?\d{7,14})\b/,  // International
    /\b(\(\d{3}\)\s*\d{3}-\d{4})\b/ // (xxx) xxx-xxxx format
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
    /\b(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{4})\b/,  // DD/MM/YYYY or MM/DD/YYYY
    /\b(\d{4}[\-\/\.]\d{1,2}[\-\/\.]\d{1,2})\b/,   // YYYY-MM-DD
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})\b/i // Month Day, Year
  ];

  let dateOfBirth = null;
  for (const pattern of dobPatterns) {
    const match = joined.match(pattern);
    if (match && match[1]) {
      try {
        let dobStr = match[1].replace(/\./g, '/').replace(/\-/g, '/');
        const parts = dobStr.split('/').map(p => parseInt(p, 10));

        let year, month, day;

        // Determine format
        if (parts[0] > 31) {
          // YYYY/MM/DD
          [year, month, day] = parts;
        } else if (parts[2] > 31) {
          // DD/MM/YYYY or MM/DD/YYYY
          // Assume DD/MM/YYYY for Indian context
          [day, month, year] = parts;
        } else {
          // Ambiguous - assume DD/MM/YY
          [day, month, year] = parts;
        }

        // Handle 2-digit year
        if (year < 100) {
          year += year > 50 ? 1900 : 2000;
        }

        // Validate ranges
        if (year >= 1900 && year <= new Date().getFullYear() &&
            month >= 1 && month <= 12 &&
            day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day);
          dateOfBirth = date.toISOString().slice(0, 10);
          break;
        }
      } catch (e) {
        // Invalid date, continue
      }
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
    /(?:Lab\s*(?:ID|No|Number)|Sample\s*(?:ID|No)|Specimen\s*(?:ID|No))\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    /(?:MR\s*No|MRN|Medical\s*Record\s*No|Patient\s*ID|Reg\.?\s*No)\s*[:\-]?\s*([A-Z0-9\-]+)/i
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
  // 7. LAB TEST RESULTS EXTRACTION (Enhanced Multi-Format)
  // -------------------------------------------------------------------------
  const results = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header/footer lines
    if (line.match(/^(Lab|Report|Hospital|Clinic|Page|Date|Signature|Doctor|Prepared)/i)) {
      continue;
    }

    // Format 1: "Test Name    Value  Unit  [RefRange]  Flag"
    // Example: "Hemoglobin  14.5  g/dL  [13-17]  Normal"
    let match = line.match(/^([A-Za-z][A-Za-z0-9 \-\(\)\/\.\%\u00B5]+?)\s{2,}([<>≤≥]?\d+(?:\.\d+)?)\s*([A-Za-z0-9%\/\.\u00B5μ\^³²]+)?\s*(?:\[?(\d+[\.\-]\d+)\]?)?\s*(High|Low|Normal|H|L|N|Abnormal)?\s*$/i);

    if (match) {
      const testName = match[1].trim();
      const value = parseFloat(match[2].replace(/[<>≤≥]/g, ''));
      const unit = match[3] ? match[3].trim() : null;
      const refRange = match[4] || null;
      const flag = match[5] || null;

      if (!isNaN(value) && testName.length >= 3) {
        results[testName] = {
          value,
          unit,
          refRange,
          flag: flag ? (flag === 'H' || flag === 'High' ? 'High' : flag === 'L' || flag === 'Low' ? 'Low' : 'Normal') : null,
          raw: line
        };
        continue;
      }
    }

    // Format 2: "Test Name: Value Unit"
    // Example: "WBC Count: 8200 cells/μL"
    match = line.match(/^([A-Za-z][A-Za-z0-9 \-\(\)\/\.\%\u00B5]+?)\s*[:\-]\s*([<>≤≥]?\d+(?:\.\d+)?)\s*([A-Za-z0-9%\/\.\u00B5μ\^³²]+)?/i);

    if (match) {
      const testName = match[1].trim();
      const value = parseFloat(match[2].replace(/[<>≤≥]/g, ''));
      const unit = match[3] ? match[3].trim() : null;

      if (!isNaN(value) && testName.length >= 3) {
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

    // Format 3: "Test Name  Value" (no unit, common for ratios/counts)
    // Example: "Platelet Count  250000"
    match = line.match(/^([A-Za-z][A-Za-z0-9 \-\(\)\/]+?)\s{2,}([<>≤≥]?\d+(?:\.\d+)?)\s*$/);

    if (match) {
      const testName = match[1].trim();
      const value = parseFloat(match[2].replace(/[<>≤≥]/g, ''));

      if (!isNaN(value) && testName.length >= 3) {
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

    // Format 4: Multi-column table format (extract from nearby lines)
    // Example:
    // Test         Value  Unit    Ref Range
    // Hemoglobin   14.5   g/dL    13-17
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const testNameMatch = line.match(/^([A-Za-z][A-Za-z0-9 \-\(\)]+)\s*$/);
      const valueMatch = nextLine.match(/^([<>≤≥]?\d+(?:\.\d+)?)\s+([A-Za-z0-9%\/\.\u00B5μ\^³²]+)?/);

      if (testNameMatch && valueMatch) {
        const testName = testNameMatch[1].trim();
        const value = parseFloat(valueMatch[1].replace(/[<>≤≥]/g, ''));
        const unit = valueMatch[2] ? valueMatch[2].trim() : null;

        if (!isNaN(value) && testName.length >= 3) {
          results[testName] = {
            value,
            unit,
            refRange: null,
            flag: null,
            raw: `${line} ${nextLine}`
          };
          i++; // Skip next line since we used it
          continue;
        }
      }
    }
     // Format 5: Free text with keywords
    match = line.match(/(\b(hemoglobin|glucose|wbc|rbc|platelet|sodium|potassium|creatinine)\b.+(is|=:)\s*([\d\.]+))/i);
    if (match) {
        const testName = match[2];
        const value = parseFloat(match[4]);
        if (!isNaN(value)) {
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
  }

  // -------------------------------------------------------------------------
  // 8. POST-PROCESSING & VALIDATION
  // -------------------------------------------------------------------------

  // Clean test names (remove trailing colons, extra spaces)
  const cleanedResults = {};
  for (const [testName, data] of Object.entries(results)) {
    const cleanName = testName.replace(/[:\-]+$/, '').trim();
    cleanedResults[cleanName] = data;
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
      parser: 'enterprise-local',
      patternsMatched: {
        nameFound: !!fullName,
        phoneFound: !!phone,
        dobFound: !!dateOfBirth,
        resultsCount: Object.keys(cleanedResults).length
      }
    }
  };
}



function parseFieldsFallback(text) { const name = text.match(/(?:Patient\s*Name|Name)\s*[:\-]\s*(.+)/i)?.[1]?.trim() || text.match(/\bName\s*[:\-]\s*([A-Z][A-Za-z .'-]+)/i)?.[1]?.trim(); const firstName = name ? name.split(/\s+/)[0] : 'Unknown'; const lastName = name ? name.split(/\s+/).slice(1).join(' ') : ''; const phone = text.match(/\b(\+?\d{7,15})\b/)?.[1] || null; const dob = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/)?.[1] || text.match(/\b(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/)?.[1] || null; const dateOfBirth = dob ? new Date(dob.replace(/-/g, '/')) : null; const results = {}; text.split('\n').forEach(line => { const m = line.match(/^\s*([A-Za-z][A-Za-z \-\(\)\/\%]+?)\s+([<>]?\d+(?:\.\d+)?)\s*([A-Za-z%\/\.\u00B5]+)?\s*$/); if (m) { const test = m[1].trim().replace(/\s+/g, ' '); const val = parseFloat(m[2]); const unit = m[3] || null; if (!Number.isNaN(val)) results[test] = { value: val, unit }; } }); return { firstName, lastName, phone, dateOfBirth, results }; }

async function matchOrCreatePatient(session, fields, batchId) {
  let { firstName, lastName, phone, dateOfBirth } = fields;
  let matchedBy = 'created-new';
  let patient = null;

  try {
    const phoneNorm = normalizePhone(phone);
    if (phoneNorm) phone = phoneNorm;
    else phone = null;

    // PRIORITY 1: Try matching by name only (case-insensitive)
    if (firstName && firstName !== 'Unknown') {
      logh(batchId, `trying name lookup: ${firstName} ${lastName || ''}`);
      const nameQuery = { firstName: new RegExp(`^${firstName}$`, 'i') };
      if (lastName) {
        nameQuery.lastName = new RegExp(`^${lastName}$`, 'i');
      }
      patient = await Patient.findOne(nameQuery).session(session);
      if (patient) matchedBy = 'name';
    }

    // PRIORITY 2: Try name + DOB if name alone failed
    if (!patient && firstName && dateOfBirth) {
      logh(batchId, `trying name+dob lookup: ${firstName} ${lastName} ${dateOfBirth}`);
      patient = await Patient.findOne({
        firstName: new RegExp(`^${firstName}$`, 'i'),
        lastName: lastName ? new RegExp(`^${lastName}$`, 'i') : '',
        dateOfBirth
      }).session(session);
      if (patient) matchedBy = 'name+dob';
    }

    // PRIORITY 3: Try phone as fallback (only if name matching failed)
    if (!patient && phone) {
      logh(batchId, `trying phone lookup: ${phone}`);
      patient = await Patient.findOne({ phone }).session(session);
      if (patient) matchedBy = 'phone';
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
      logh(batchId, '✗ patient create with phone failed, retrying without phone:', e.message || e);
      createPayload.phone = null;
      const created = await Patient.create([createPayload], { session }).then(a => a[0]);
      logh(batchId, `patient created (without phone) ✓ id=${created._id}`);
      return { patient: created, action: 'created', matchedBy };
    }
  } catch (e) {
    logh(batchId, '✗ matchOrCreatePatient error:', e.message || e);
    throw e;
  }
}

async function createLabReport(session, { patientId, pdfId, results, ocrMeta, rawText, batchId }) { try { const lab = await LabReport.create([{ patientId, appointmentId: null, testType: 'Auto-OCR', results: results || {}, fileRef: pdfId, rawText: rawText || '', metadata: { ocrEngine: ocrMeta.engine, ocrConfidence: ocrMeta.confidence, rawTextChars: rawText ? rawText.length : 0 } }], { session }).then(a => a[0]); logh(batchId, `labReport created ✓ id=${lab._id}`); return lab; } catch (e) { logh(batchId, '✗ createLabReport error:', e.message || e); throw e; } }

router.get('/health', auth, (req, res) => { return res.json({ ok: true }); });

router.post('/upload', auth, upload.array('files', 10), async (req, res) => {
  const batchId = uuidv4().slice(0, 8);
  const t0 = nowMs();
  logh(batchId, `→ /scanner/upload files=${req.files?.length || 0}`);
  if (!req.files || req.files.length === 0) {
    logh(batchId, '✗ no files uploaded');
    return res.status(400).json({ ok: false, error: 'No files uploaded' });
  }
  if (req.files.length > 10) {
    logh(batchId, '✗ too many files');
    return res.status(400).json({ ok: false, error: 'Max 10 files allowed' });
  }
  let session;
  try {
    session = await startSession();
    logh(batchId, 'db session started');
  } catch (e) {
    console.error(`[scanner ${batchId}] could not start DB session:`, e);
    return res.status(500).json({ ok: false, error: 'DB session error' });
  }
  const results = [];
  const failed = [];
  try {
    for (const f of req.files) {
      await session.withTransaction(async () => {
        const tFile = nowMs();
        const { originalname, mimetype, buffer, size } = f;
        logh(batchId, `file START: ${originalname} (type=${mimetype}, size=${size})`);
        let ocrRes;
        try {
          ocrRes = await ocrAny({ buffer, mimetype, batchId, fileName: originalname });
        } catch (e) {
          logh(batchId, `✗ OCR threw for ${originalname}:`, e.message || e);
          throw e;
        }
        const { text, engine, confidence, tookMs } = ocrRes;
        logh(batchId, `OCR done: engine=${engine}, conf=${confidence}, t=${tookMs}ms`);
        let parsed = null;
        let parserUsed = 'none';
        try {
          parsed = localParseHighQuality(text);
          parsed.metadata.ocrEngine = engine;
          parsed.metadata.ocrConfidence = confidence;
          parserUsed = 'enterprise-local';
        } catch (e) {
          logh(batchId, '✗ localParseHighQuality threw:', e.message || e);
          parsed = null;
        }
        let fieldsForUpsert = null;
        if (parsed) {
          const patient = parsed.patient || {};
          const firstName = patient.firstName || (patient.name ? patient.name.split(/\s+/)[0] : null) || 'Unknown';
          const lastName = patient.lastName || '';
          const phone = patient.phone || null;
          const dateOfBirth = patient.dateOfBirth ? new Date(patient.dateOfBirth) : (patient.dob ? new Date(patient.dob) : null);
          const resultsObj = parsed.results || {};
          fieldsForUpsert = { firstName, lastName, phone, dateOfBirth, results: resultsObj };
        } else {
          const fb = parseFieldsFallback(text || '');
          fieldsForUpsert = { ...fb, results: fb.results || {} };
          parserUsed = 'fallback';
        }
        const dobStr = fieldsForUpsert.dateOfBirth ? (new Date(fieldsForUpsert.dateOfBirth)).toISOString().slice(0, 10) : null;
        logh(batchId, `parsed fields (by=${parserUsed}):`, { firstName: fieldsForUpsert.firstName, lastName: fieldsForUpsert.lastName, phone: fieldsForUpsert.phone, dateOfBirth: dobStr, resultsCount: Object.keys(fieldsForUpsert.results || {}).length });
        const { patient, action, matchedBy } = await matchOrCreatePatient(session, fieldsForUpsert, batchId);
        const pdfDoc = await storePdf({ buffer, fileName: originalname, mimeType: mimetype, patientId: patient._id, batchId });
        const lab = await createLabReport(session, { patientId: patient._id, pdfId: pdfDoc._id, results: fieldsForUpsert.results, ocrMeta: { engine, confidence, parser: parserUsed }, rawText: text, batchId });
        const elapsed = nowMs() - tFile;
        logh(batchId, `file END: ${originalname} → patient=${patient._id}, pdf=${pdfDoc._id}, lab=${lab._id}, action=${action}, took=${elapsed}ms`);
        results.push({ file: originalname, action, patient: { id: patient._id, firstName: patient.firstName, lastName: patient.lastName, matchedBy }, pdf: { id: pdfDoc._id, fileName: originalname, size, mimeType: mimetype }, ocr: { engine, confidence, chars: (text || '').length }, labReport: { id: lab._id, testType: lab.testType, resultsCount: Object.keys(fieldsForUpsert.results || {}).length } });
      }).catch(err => {
        logh(batchId, `✗ transaction failed for ${f.originalname}: ${err.message}`);
        failed.push({ file: f.originalname, reason: err.message });
      });
    }
    const t1 = nowMs();
    logh(batchId, `batch END: ok=${failed.length === 0}, processed=${results.length}, failed=${failed.length}, totalT=${t1 - t0}ms`);
    const payload = { ok: failed.length === 0, batchId, results };
    if (failed.length) payload.failed = failed;
    return res.status(200).json(payload);
  } catch (e) {
    logh(batchId, `FATAL: ${e.stack || e.message}`);
    return res.status(500).json({ ok: false, error: e.message, batchId, results, failed });
  } finally {
    try {
      if (session && typeof session.endSession === 'function') {
        await session.endSession();
        logh(batchId, 'db session ended');
      }
    } catch (e) {
      console.warn('[scanner] error ending session:', e);
    }
  }
});
    
router.get('/pdf/:id', auth, async (req, res) => { const id = req.params.id; console.log('[scanner:pdf] fetch id=', id); try { const doc = await PatientPDF.findById(id); if (!doc) { console.warn('[scanner:pdf] not found:', id); return res.status(404).send('Not found'); } res.setHeader('Content-Type', doc.mimeType || 'application/pdf'); res.setHeader('Content-Length', doc.size || doc.data?.length || 0); res.setHeader('Content-Disposition', `inline; filename="${doc.fileName || (doc._id + '.pdf')}"`); console.log('[scanner:pdf] streaming', id, 'mime=', doc.mimeType, 'bytes=', doc.size); return res.send(doc.data); } catch (e) { console.error('[scanner:pdf] error fetching pdf:', e); return res.status(500).send('Server error'); } });

router.get('/reports/:patientId', auth, async (req, res) => { const { patientId } = req.params; console.log('[scanner:reports] list for patientId=', patientId); try { const items = await LabReport.find({ patientId }).sort({ createdAt: -1 }).select('_id patientId fileRef testType createdAt results metadata').lean(); const shaped = items.map(r => ({ labReportId: r._id, pdfId: r.fileRef || null, title: r.testType || 'Auto-OCR Report', createdAt: r.createdAt, resultsCount: r.results ? Object.keys(r.results).length : 0 })); console.log('[scanner:reports] count=', shaped.length); res.json({ ok: true, patientId, items: shaped }); } catch (e) { console.error('[scanner:reports] error:', e); res.status(500).json({ ok: false, error: 'Server error' }); } });

module.exports = router;

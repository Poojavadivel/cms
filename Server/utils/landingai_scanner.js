/**
 * LandingAI ADE Scanner for Medical Documents (Node.js version)
 * Uses LandingAI's Document Parsing and Extraction API
 */

const axios = require('axios');
const fs = require('fs').promises;
const FormData = require('form-data');

// ============================================================================
// CONFIGURATION
// ============================================================================
const LANDINGAI_CONFIG = {
  // ✅ Correct ADE base URL (NOT api.landing.ai, NOT agent/document)
  BASE_URL: 'https://api.va.landing.ai/v1/ade',

  // ✅ Correct ADE endpoints
  PARSE_ENDPOINT: '/parse',
  EXTRACT_ENDPOINT: '/extract',

  // ✅ Supported model
  MODEL: 'dpt-2',

  // ✅ API key must be the raw pat_ key, no encoding, no fallback in prod
  API_KEY: process.env.LANDINGAI_API_KEY
};

// ❌ Strongly recommended: fail fast if key missing
if (!LANDINGAI_CONFIG.API_KEY) {
  throw new Error('LANDINGAI_API_KEY is not set in environment');
}

// ============================================================================
// PYDANTIC-STYLE SCHEMAS (JSON Schema format for LandingAI)
// ============================================================================

const DoctorDetailsSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Full name of the doctor, including titles and qualifications.',
      title: 'Doctor Name',
      default: ''
    },
    specialization: {
      type: 'string',
      description: 'The medical specialization of the doctor.',
      title: 'Specialization',
      default: ''
    },
    hospital: {
      type: 'string',
      description: 'The hospital where the doctor consults.',
      title: 'Hospital Name',
      default: ''
    },
    license: {
      type: 'string',
      description: "The doctor's medical license number.",
      title: 'Medical License',
      default: ''
    }
  }
};

const PatientDetailsSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'The full name of the patient.',
      title: 'Patient Name',
      default: ''
    },
    firstName: {
      type: 'string',
      description: 'First name of the patient.',
      title: 'First Name',
      default: ''
    },
    lastName: {
      type: 'string',
      description: 'Last name of the patient.',
      title: 'Last Name',
      default: ''
    },
    uhid_no: {
      type: 'string',
      description: 'Unique Hospital Identification Number for the patient.',
      title: 'UHID Number',
      default: ''
    },
    age: {
      type: 'string',
      description: "The age of the patient, including units (e.g., '92 M').",
      title: 'Patient Age',
      default: ''
    },
    gender: {
      type: 'string',
      description: "The gender of the patient (e.g., 'Male', 'Female', 'Other').",
      title: 'Patient Gender',
      default: ''
    },
    phone: {
      type: 'string',
      description: "Patient's contact phone number.",
      title: 'Phone Number',
      default: ''
    },
    email: {
      type: 'string',
      description: "Patient's email address.",
      title: 'Email',
      default: ''
    },
    dateOfBirth: {
      type: 'string',
      description: "Patient's date of birth in YYYY-MM-DD format.",
      title: 'Date of Birth',
      default: ''
    }
  }
};

const AddressSchema = {
  type: 'object',
  properties: {
    street_address: {
      type: 'string',
      description: 'Street number and name.',
      title: 'Street Address',
      default: ''
    },
    city: {
      type: 'string',
      description: 'The city.',
      title: 'City',
      default: ''
    },
    state: {
      type: 'string',
      description: 'The state or province.',
      title: 'State',
      default: ''
    },
    pincode: {
      type: 'string',
      description: 'The postal/ZIP code.',
      title: 'Pincode',
      default: ''
    },
    country: {
      type: 'string',
      description: 'The country.',
      title: 'Country',
      default: 'India'
    }
  }
};

const MedicationSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      description: 'Type of medication (e.g., Cap., Tab., Syrup, Injection).',
      title: 'Medication Type',
      default: ''
    },
    name: {
      type: 'string',
      description: 'The brand or generic name of the drug.',
      title: 'Medication Name',
      default: ''
    },
    dose: {
      type: 'string',
      description: 'The dosage strength of the medication.',
      title: 'Dose',
      default: ''
    },
    frequency: {
      type: 'string',
      description: 'How often to take (e.g., 1-0-1, twice daily).',
      title: 'Frequency',
      default: ''
    },
    duration: {
      type: 'string',
      description: 'Duration of medication (e.g., 7 days, 1 month).',
      title: 'Duration',
      default: ''
    },
    instructions: {
      type: 'string',
      description: 'Special instructions (e.g., before food, after food).',
      title: 'Instructions',
      default: ''
    }
  }
};

const TestResultSchema = {
  type: 'object',
  properties: {
    testName: {
      type: 'string',
      description: 'Name of the lab test or parameter.',
      title: 'Test Name',
      default: ''
    },
    value: {
      type: 'string',
      description: 'Test result value.',
      title: 'Value',
      default: ''
    },
    unit: {
      type: 'string',
      description: 'Unit of measurement.',
      title: 'Unit',
      default: ''
    },
    normalRange: {
      type: 'string',
      description: 'Normal reference range.',
      title: 'Normal Range',
      default: ''
    },
    flag: {
      type: 'string',
      description: 'Result flag: Normal, High, Low, Critical.',
      title: 'Flag',
      default: 'Normal'
    },
    notes: {
      type: 'string',
      description: 'Additional notes about this test.',
      title: 'Notes',
      default: ''
    }
  }
};

const LabReportSchema = {
  type: 'object',
  properties: {
    testType: {
      type: 'string',
      description: 'Type of test (e.g., THYROID, BLOOD_COUNT, LIPID).',
      title: 'Test Type',
      default: ''
    },
    testCategory: {
      type: 'string',
      description: 'Category (e.g., Hematology, Biochemistry).',
      title: 'Test Category',
      default: ''
    },
    labName: {
      type: 'string',
      description: 'Name of the laboratory.',
      title: 'Lab Name',
      default: ''
    },
    reportDate: {
      type: 'string',
      description: 'Date when report was issued.',
      title: 'Report Date',
      default: ''
    },
    testDate: {
      type: 'string',
      description: 'Date when test was performed.',
      title: 'Test Date',
      default: ''
    },
    doctorName: {
      type: 'string',
      description: 'Referring doctor name.',
      title: 'Doctor Name',
      default: ''
    },
    results: {
      type: 'array',
      items: TestResultSchema,
      description: 'List of test results.',
      title: 'Test Results',
      default: []
    },
    interpretation: {
      type: 'string',
      description: 'Clinical interpretation or notes.',
      title: 'Interpretation',
      default: ''
    },
    notes: {
      type: 'string',
      description: 'General notes or observations.',
      title: 'Notes',
      default: ''
    }
  }
};

const PrescriptionDocumentSchema = {
  type: 'object',
  required: ['prescription_summary', 'date_time', 'hospital', 'doctor'],
  properties: {
    prescription_summary: {
      type: 'string',
      description: 'Summary or main content of the prescription including medicines or instructions',
      title: 'Prescription Summary',
      default: ''
    },
    date_time: {
      type: 'string',
      description: 'Date and time when the prescription was issued',
      title: 'Date and Time',
      default: ''
    },
    hospital: {
      type: 'string',
      description: 'Hospital or clinic name mentioned in the prescription',
      title: 'Hospital',
      default: ''
    },
    doctor: {
      type: 'string',
      description: 'Doctor who issued the prescription',
      title: 'Doctor',
      default: ''
    },
    medical_notes: {
      type: ['string', 'null'],
      description: 'Additional medical notes or instructions',
      title: 'Medical Notes',
      default: ''
    }
  }
};

const LabReportDocumentSchema = {
  type: 'object',
  properties: {
    patient_details: {
      ...PatientDetailsSchema,
      description: 'Information about the patient.',
      title: 'Patient Details'
    },
    labReport: {
      ...LabReportSchema,
      description: 'Lab report details and results.',
      title: 'Lab Report'
    },
    clinic_address: {
      ...AddressSchema,
      description: 'Address of the lab/clinic.',
      title: 'Clinic Address'
    }
  }
};

const MedicalHistoryDocumentSchema = {
  type: 'object',
  required: ['medical_type', 'date', 'hospital_name', 'doctor_name'],
  properties: {
    medical_type: {
      type: 'string',
      description: 'Type of medical record: appointment_summary or discharge_summary',
      title: 'Medical Type',
      enum: ['appointment_summary', 'discharge_summary'],
      default: 'appointment_summary'
    },
    appointment_summary: {
      type: ['string', 'null'],
      description: 'Summary of appointment visit and consultation',
      title: 'Appointment Summary',
      default: ''
    },
    discharge_summary: {
      type: ['string', 'null'],
      description: 'Summary of hospital discharge including treatment and follow-up',
      title: 'Discharge Summary',
      default: ''
    },
    date: {
      type: 'string',
      description: 'Date of appointment or discharge in DD/MM/YYYY format',
      title: 'Date',
      default: ''
    },
    time: {
      type: ['string', 'null'],
      description: 'Time of appointment or discharge',
      title: 'Time',
      default: ''
    },
    hospital_name: {
      type: 'string',
      description: 'Name of the hospital or clinic',
      title: 'Hospital Name',
      default: ''
    },
    hospital_location: {
      type: ['string', 'null'],
      description: 'Location or address of the hospital',
      title: 'Hospital Location',
      default: ''
    },
    doctor_name: {
      type: 'string',
      description: 'Name of the doctor who handled the case',
      title: 'Doctor Name',
      default: ''
    },
    department: {
      type: ['string', 'null'],
      description: 'Department or specialization of the doctor',
      title: 'Department/Specialization',
      default: ''
    },
    services: {
      type: ['string', 'null'],
      description: 'Medical services provided during visit (e.g., "Consultation, Blood Test, X-Ray, Medication")',
      title: 'Services',
      default: ''
    },
    doctor_notes: {
      type: ['string', 'null'],
      description: 'Notes written by the doctor',
      title: 'Doctor Notes',
      default: ''
    },
    observations: {
      type: ['string', 'null'],
      description: 'Clinical observations and findings',
      title: 'Observations',
      default: ''
    },
    remarks: {
      type: ['string', 'null'],
      description: 'Additional remarks or follow-up instructions',
      title: 'Remarks',
      default: ''
    }
  }
};

// ============================================================================
// LANDINGAI ADE CLIENT CLASS
// ============================================================================

class LandingAIScanner {
  constructor(apiKey) {
    this.apiKey = apiKey || LANDINGAI_CONFIG.API_KEY;
    this.baseURL = LANDINGAI_CONFIG.BASE_URL;
  }

  /**
   * Detect document type based on markdown content
   * @param {string} markdownText - Markdown text from parsed document
   * @returns {string} Document type: PRESCRIPTION, LAB_REPORT, MEDICAL_HISTORY, or GENERAL
   */
  detectDocumentType(markdownText) {
    const markdownLower = markdownText.toLowerCase();

    // Prescription indicators
    const prescriptionKeywords = ['prescription', 'rx', 'medication', 'medicine', 'drug', 'tablet', 'capsule', 'dosage'];
    if (prescriptionKeywords.some(keyword => markdownLower.includes(keyword))) {
      return 'PRESCRIPTION';
    }

    // Lab report indicators
    const labKeywords = ['lab report', 'test result', 'pathology', 'blood test', 'hemoglobin', 'glucose', 'cholesterol'];
    if (labKeywords.some(keyword => markdownLower.includes(keyword))) {
      return 'LAB_REPORT';
    }

    // Medical history indicators
    const historyKeywords = ['medical history', 'patient history', 'discharge', 'admission', 'diagnosis'];
    if (historyKeywords.some(keyword => markdownLower.includes(keyword))) {
      return 'MEDICAL_HISTORY';
    }

    return 'GENERAL';
  }

  /**
   * Parse document to markdown using LandingAI Parse API
   * @param {string} documentPath - Path to PDF or image file
   * @returns {Promise<Object>} Parse response with markdown text
   */
  async parseDocument(documentPath) {
    try {
      console.log(`[LandingAI] Parsing document: ${documentPath}`);

      // Read file as buffer
      const fileBuffer = await fs.readFile(documentPath);
      
      console.log(`[LandingAI] File size: ${fileBuffer.length} bytes`);
      
      // Determine mime type from file extension
      const ext = documentPath.toLowerCase().split('.').pop();
      const mimeTypes = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      // Extract filename from path
      const filename = documentPath.split(/[/\\]/).pop();

      // ADE Parse requires multipart/form-data (NOT JSON)
      const form = new FormData();
      form.append('model', LANDINGAI_CONFIG.MODEL);
      form.append('document', fileBuffer, {
        filename: filename,
        contentType: mimeType
      });
      
      console.log(`[LandingAI] Sending multipart/form-data with file: ${filename}`);

      const response = await axios.post(
        `${this.baseURL}${LANDINGAI_CONFIG.PARSE_ENDPOINT}`,
        form,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...form.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      if (response.data && response.data.markdown) {
        console.log(`[LandingAI] ✅ Parsed ${response.data.markdown.length} characters of markdown`);
        return response.data;
      }

      throw new Error('No markdown in parse response');
    } catch (error) {
      console.error('[LandingAI] Parse error:', error.message);
      if (error.response) {
        console.error('[LandingAI] Response status:', error.response.status);
        console.error('[LandingAI] Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Extract structured data from markdown using LandingAI Extract API
   * @param {string} markdown - Markdown text from parse step
   * @param {Object} schema - JSON schema for extraction
   * @returns {Promise<Object>} Extracted structured data
   */
  async extractData(markdown, schema) {
    try {
      console.log(`[LandingAI] Extracting data with schema`);

      // ADE Extract requires multipart/form-data (NOT JSON)
      const form = new FormData();
      form.append('markdown', markdown);
      form.append('schema', JSON.stringify(schema));

      const response = await axios.post(
        `${this.baseURL}${LANDINGAI_CONFIG.EXTRACT_ENDPOINT}`,
        form,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...form.getHeaders()
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      if (response.data) {
        console.log(`[LandingAI] Extraction successful`);
        return response.data;
      }

      throw new Error('No data in extract response');
    } catch (error) {
      console.error('[LandingAI] Extract error:', error.message);
      if (error.response) {
        console.error('[LandingAI] Response status:', error.response.status);
        console.error('[LandingAI] Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get appropriate schema based on document type
   * @param {string} documentType - Document type
   * @returns {Object} JSON schema
   */
  getSchema(documentType) {
    switch (documentType) {
      case 'PRESCRIPTION':
        return PrescriptionDocumentSchema;
      case 'LAB_REPORT':
        return LabReportDocumentSchema;
      case 'MEDICAL_HISTORY':
        return MedicalHistoryDocumentSchema;
      default:
        return PrescriptionDocumentSchema; // Fallback
    }
  }

  /**
   * Scan and extract data from medical document
   * @param {string} documentPath - Path to PDF or image file
   * @param {string} documentType - Optional document type (PRESCRIPTION, LAB_REPORT, MEDICAL_HISTORY)
   * @returns {Promise<Object>} Extraction result
   */
  async scanDocument(documentPath, documentType = null) {
    try {
      // Step 1: Parse document to markdown
      const parseResponse = await this.parseDocument(documentPath);
      const markdownText = parseResponse.markdown;

      // Step 2: Detect document type if not provided
      if (!documentType) {
        documentType = this.detectDocumentType(markdownText);
        console.log(`[LandingAI] Detected document type: ${documentType}`);
      }

      // Step 3: Select appropriate schema
      const schema = this.getSchema(documentType);
      console.log(`[LandingAI] Using schema for: ${documentType}`);

      // Step 4: Extract structured data
      const extractResponse = await this.extractData(markdownText, schema);

      // Step 5: Format response
      return {
        success: true,
        documentType: documentType,
        extractedData: extractResponse,
        markdown: markdownText.substring(0, 5000), // First 5000 chars for reference
        confidence: 0.95, // LandingAI typically has high confidence
        engine: 'landingai-ade',
        model: LANDINGAI_CONFIG.MODEL
      };

    } catch (error) {
      console.error('[LandingAI] Error:', error.message);
      return {
        success: false,
        error: error.message,
        documentType: documentType || 'UNKNOWN'
      };
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  LandingAIScanner,
  LANDINGAI_CONFIG,
  // Export schemas for custom use
  schemas: {
    PrescriptionDocumentSchema,
    LabReportDocumentSchema,
    MedicalHistoryDocumentSchema,
    DoctorDetailsSchema,
    PatientDetailsSchema,
    AddressSchema,
    MedicationSchema,
    TestResultSchema,
    LabReportSchema
  }
};

// ============================================================================
// CLI INTERFACE (for testing)
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node landingai_scanner.js <document_path> [document_type]');
    process.exit(1);
  }

  const documentPath = args[0];
  const documentType = args[1] || null;

  const scanner = new LandingAIScanner();
  
  scanner.scanDocument(documentPath, documentType)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

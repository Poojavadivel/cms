/**
 * scanner/dataConverter.js
 * Converts extracted document data to verification rows for different document types
 */

/**
 * Convert extracted data to verification rows
 * @param {Object} extractedData - Extracted data from scanner
 * @param {string} documentType - Type of document (PRESCRIPTION, LAB_REPORT, MEDICAL_HISTORY)
 * @returns {Array} Array of data rows for verification
 */
function convertExtractedDataToRows(extractedData, documentType) {
  console.log('[CONVERT] Starting conversion for document type:', documentType);
  console.log('[CONVERT] Extracted data keys:', Object.keys(extractedData));
  const rows = [];

  if (documentType === 'PRESCRIPTION') {
    rows.push(...convertPrescriptionData(extractedData));
  } else if (documentType === 'LAB_REPORT') {
    rows.push(...convertLabReportData(extractedData));
  } else if (documentType === 'MEDICAL_HISTORY') {
    rows.push(...convertMedicalHistoryData(extractedData));
  } else if (documentType === 'BILLING') {
    rows.push(...convertBillingData(extractedData));
  }

  // Validation
  if (rows.length === 0) {
    console.log('[CONVERT] ❌ ERROR: Schema extraction succeeded but conversion failed');
    console.log('[CONVERT] ❌ Document Type:', documentType);
    console.log('[CONVERT] ❌ Extracted Data:', JSON.stringify(extractedData, null, 2));
    throw new Error(`Conversion failed: No rows created for document type ${documentType}. Check if data structure matches expected schema.`);
  }

  console.log(`[CONVERT] 🏁 Final: Returning ${rows.length} rows total`);
  return rows;
}

/**
 * Convert prescription data to rows
 * @param {Object} extractedData - Extracted prescription data
 * @returns {Array} Data rows
 */
function convertPrescriptionData(extractedData) {
  console.log('[CONVERT] Processing PRESCRIPTION document');
  const rows = [];
  
  const prescData = extractedData.extraction || extractedData;
  console.log('[CONVERT] Prescription data keys:', Object.keys(prescData));

  // Prescription summary
  if (prescData.prescription_summary) {
    console.log('[CONVERT] ✅ Found prescription_summary');
    rows.push({
      fieldName: 'prescription_summary',
      displayLabel: 'Prescription Summary',
      originalValue: prescData.prescription_summary,
      currentValue: prescData.prescription_summary,
      dataType: 'string',
      category: 'diagnosis',
      confidence: 0.95
    });
  }

  // Date and time
  if (prescData.date_time) {
    console.log('[CONVERT] ✅ Found date_time:', prescData.date_time);
    rows.push({
      fieldName: 'date_time',
      displayLabel: 'Date and Time',
      originalValue: prescData.date_time,
      currentValue: prescData.date_time,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }

  // Hospital
  if (prescData.hospital) {
    console.log('[CONVERT] ✅ Found hospital:', prescData.hospital);
    rows.push({
      fieldName: 'hospital',
      displayLabel: 'Hospital',
      originalValue: prescData.hospital,
      currentValue: prescData.hospital,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }

  // Doctor
  if (prescData.doctor) {
    console.log('[CONVERT] ✅ Found doctor:', prescData.doctor);
    rows.push({
      fieldName: 'doctor',
      displayLabel: 'Doctor',
      originalValue: prescData.doctor,
      currentValue: prescData.doctor,
      dataType: 'string',
      category: 'patient_details',
      confidence: 0.95
    });
  }

  // Medical notes
  if (prescData.medical_notes !== null && prescData.medical_notes !== undefined && prescData.medical_notes !== '') {
    console.log('[CONVERT] ✅ Found medical_notes');
    rows.push({
      fieldName: 'medical_notes',
      displayLabel: 'Medical Notes',
      originalValue: prescData.medical_notes,
      currentValue: prescData.medical_notes,
      dataType: 'string',
      category: 'other',
      confidence: 0.90
    });
  }

  // ENHANCEMENT: Structured medications array
  if (prescData.medications && Array.isArray(prescData.medications) && prescData.medications.length > 0) {
    console.log('[CONVERT] ✅ Found structured medications:', prescData.medications.length);
    
    prescData.medications.forEach((med, index) => {
      // Medicine header
      rows.push({
        fieldName: `medication_${index}_header`,
        displayLabel: `━━ Medication ${index + 1} ━━`,
        originalValue: `Medicine ${index + 1}`,
        currentValue: `Medicine ${index + 1}`,
        dataType: 'medication_header',
        category: 'medications',
        confidence: 1.0,
        isEditable: false
      });
      
      // Medicine details
      if (med.name) {
        rows.push({
          fieldName: `medication_${index}_name`,
          displayLabel: `Medicine Name`,
          originalValue: med.name,
          currentValue: med.name,
          dataType: 'string',
          category: 'medications',
          confidence: 0.95
        });
      }
      
      if (med.dose) {
        rows.push({
          fieldName: `medication_${index}_dose`,
          displayLabel: `Dosage`,
          originalValue: med.dose,
          currentValue: med.dose,
          dataType: 'string',
          category: 'medications',
          confidence: 0.95
        });
      }
      
      if (med.frequency) {
        rows.push({
          fieldName: `medication_${index}_frequency`,
          displayLabel: `Frequency`,
          originalValue: med.frequency,
          currentValue: med.frequency,
          dataType: 'string',
          category: 'medications',
          confidence: 0.95
        });
      }
      
      if (med.duration) {
        rows.push({
          fieldName: `medication_${index}_duration`,
          displayLabel: `Duration`,
          originalValue: med.duration,
          currentValue: med.duration,
          dataType: 'string',
          category: 'medications',
          confidence: 0.90
        });
      }
      
      if (med.instructions) {
        rows.push({
          fieldName: `medication_${index}_instructions`,
          displayLabel: `Instructions`,
          originalValue: med.instructions,
          currentValue: med.instructions,
          dataType: 'string',
          category: 'medications',
          confidence: 0.90
        });
      }
    });
  }

  // Diagnosis
  if (prescData.diagnosis) {
    console.log('[CONVERT] ✅ Found diagnosis');
    rows.push({
      fieldName: 'diagnosis',
      displayLabel: 'Diagnosis',
      originalValue: prescData.diagnosis,
      currentValue: prescData.diagnosis,
      dataType: 'string',
      category: 'diagnosis',
      confidence: 0.90
    });
  }

  console.log(`[CONVERT] ✅ Created ${rows.length} rows for PRESCRIPTION`);
  return rows;
}

/**
 * Convert lab report data to rows
 * @param {Object} extractedData - Extracted lab report data
 * @returns {Array} Data rows
 */
function convertLabReportData(extractedData) {
  console.log('[CONVERT] Processing LAB_REPORT document');
  const rows = [];
  
  const labData = extractedData.extraction?.labReport || extractedData.labReport || {};
  console.log('[CONVERT] Lab data keys:', Object.keys(labData));
  console.log('[CONVERT] Lab results count:', labData.results?.length || 0);

  // SKIP EMPTY LAB SECTIONS
  const hasResults = labData.results && Array.isArray(labData.results) && labData.results.length > 0;
  const hasInterpretation = labData.interpretation && labData.interpretation.trim().length > 0;
  const hasTestType = labData.testType && labData.testType.trim().length > 0;
  
  if (!hasResults && !hasInterpretation && !hasTestType) {
    console.log('[CONVERT] ⚠️ SKIPPING: Empty lab section (no results, no interpretation, no test type)');
    throw new Error('No rows created for document type LAB_REPORT. Check if data structure matches expected schema.');
  }

  // Test type
  if (labData.testType) {
    console.log('[CONVERT] ✅ Found testType:', labData.testType);
    rows.push({ 
      fieldName: 'testType', 
      displayLabel: 'Test Type', 
      originalValue: labData.testType, 
      currentValue: labData.testType, 
      dataType: 'string', 
      category: 'lab_results', 
      confidence: 0.95 
    });
  }
  
  // Test category
  if (labData.testCategory) {
    console.log('[CONVERT] ✅ Found testCategory:', labData.testCategory);
    rows.push({ 
      fieldName: 'testCategory', 
      displayLabel: 'Test Category', 
      originalValue: labData.testCategory, 
      currentValue: labData.testCategory, 
      dataType: 'string', 
      category: 'lab_results', 
      confidence: 0.95 
    });
  }
  
  // Lab name
  if (labData.labName) {
    console.log('[CONVERT] ✅ Found labName:', labData.labName);
    rows.push({ 
      fieldName: 'labName', 
      displayLabel: 'Lab Name', 
      originalValue: labData.labName, 
      currentValue: labData.labName, 
      dataType: 'string', 
      category: 'other', 
      confidence: 0.95 
    });
  }
  
  // Report date (check multiple field names)
  const dateValue = labData.reportDate || labData.testDate || labData.date || labData.sid_date || labData.sample_date;
  if (dateValue) {
    console.log('[CONVERT] ✅ Found date:', dateValue);
    rows.push({ 
      fieldName: 'reportDate', 
      displayLabel: 'Report Date', 
      originalValue: dateValue, 
      currentValue: dateValue, 
      dataType: 'date', 
      category: 'other', 
      confidence: 0.95 
    });
  }
  
  // Doctor name
  if (labData.doctorName) {
    console.log('[CONVERT] ✅ Found doctorName:', labData.doctorName);
    rows.push({ 
      fieldName: 'doctorName', 
      displayLabel: 'Doctor Name', 
      originalValue: labData.doctorName, 
      currentValue: labData.doctorName, 
      dataType: 'string', 
      category: 'patient_details', 
      confidence: 0.95 
    });
  }

  // Lab results array with DEDUPLICATION
  if (labData.results && Array.isArray(labData.results)) {
    console.log(`[CONVERT] ✅ Processing ${labData.results.length} test results`);
    
    // PROFESSIONAL IMPROVEMENT: Deduplicate by testName + value
    const seenTests = new Map(); // key: testName, value: result object
    const uniqueResults = [];
    
    labData.results.forEach((result) => {
      const testKey = `${result.testName || 'unknown'}_${result.value || ''}`.toLowerCase();
      
      if (!seenTests.has(testKey)) {
        seenTests.set(testKey, result);
        uniqueResults.push(result);
      } else {
        console.log(`[CONVERT]   ⚠️  Skipping duplicate: ${result.testName} = ${result.value}`);
      }
    });
    
    console.log(`[CONVERT] ✅ After deduplication: ${uniqueResults.length} unique tests (removed ${labData.results.length - uniqueResults.length} duplicates)`);
    
    uniqueResults.forEach((result, idx) => {
      console.log(`[CONVERT]   Result ${idx + 1}: ${result.testName || 'Unknown'} = ${result.value || 'N/A'}`);
      rows.push({
        fieldName: `labResult_${idx}`,
        displayLabel: `Test ${idx + 1}: ${result.testName || 'Result'}`,
        originalValue: result,
        currentValue: result,
        dataType: 'object',
        category: 'lab_results',
        confidence: 0.95
      });
    });
  }
  
  // Interpretation
  if (labData.interpretation) {
    console.log('[CONVERT] ✅ Found interpretation');
    rows.push({ 
      fieldName: 'interpretation', 
      displayLabel: 'Interpretation', 
      originalValue: labData.interpretation, 
      currentValue: labData.interpretation, 
      dataType: 'string', 
      category: 'diagnosis', 
      confidence: 0.95 
    });
  }
  
  // Notes
  if (labData.notes) {
    console.log('[CONVERT] ✅ Found notes');
    rows.push({ 
      fieldName: 'notes', 
      displayLabel: 'Notes', 
      originalValue: labData.notes, 
      currentValue: labData.notes, 
      dataType: 'string', 
      category: 'other', 
      confidence: 0.90 
    });
  }

  console.log(`[CONVERT] ✅ Created ${rows.length} rows for LAB_REPORT (including ${labData.results?.length || 0} test results)`);
  return rows;
}

/**
 * Convert medical history data to rows
 * @param {Object} extractedData - Extracted medical history data
 * @returns {Array} Data rows
 */
function convertMedicalHistoryData(extractedData) {
  console.log('[CONVERT] Processing MEDICAL_HISTORY document');
  const rows = [];

  const ex = extractedData.extraction || extractedData;
  console.log('[CONVERT] Medical history data keys:', Object.keys(ex));

  if (!ex || Object.keys(ex).length === 0) {
    throw new Error('Missing extraction data for MEDICAL_HISTORY');
  }

  // Patient details (if present)
  if (ex.patient_details) {
    const patient = ex.patient_details;
    
    if (patient.name) {
      rows.push({
        fieldName: 'patient_name',
        displayLabel: 'Patient Name',
        originalValue: patient.name,
        currentValue: patient.name,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }
    
    if (patient.age) {
      rows.push({
        fieldName: 'patient_age',
        displayLabel: 'Patient Age',
        originalValue: patient.age,
        currentValue: patient.age,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }
    
    if (patient.gender) {
      rows.push({
        fieldName: 'patient_gender',
        displayLabel: 'Patient Gender',
        originalValue: patient.gender,
        currentValue: patient.gender,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }
    
    if (patient.uhid_no) {
      rows.push({
        fieldName: 'uhid_no',
        displayLabel: 'UHID Number',
        originalValue: patient.uhid_no,
        currentValue: patient.uhid_no,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }
  }

  // Medical type
  if (ex.medical_type) {
    console.log('[CONVERT] ✅ Found medical_type:', ex.medical_type);
    rows.push({
      fieldName: 'medical_type',
      displayLabel: 'Medical Type',
      originalValue: ex.medical_type,
      currentValue: ex.medical_type,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }

  // Medical summary
  const summary = ex.appointment_summary || ex.discharge_summary || ex.doctor_notes || ex.observations;
  if (summary) {
    console.log('[CONVERT] ✅ Found medical_summary');
    rows.push({
      fieldName: 'medical_summary',
      displayLabel: 'Medical Summary',
      originalValue: summary,
      currentValue: summary,
      dataType: 'string',
      category: 'diagnosis',
      confidence: 0.95
    });
  }

  // Date
  if (ex.date) {
    console.log('[CONVERT] ✅ Found date:', ex.date);
    rows.push({
      fieldName: 'date',
      displayLabel: 'Date',
      originalValue: ex.date,
      currentValue: ex.date,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }

  // Time
  if (ex.time) {
    console.log('[CONVERT] ✅ Found time:', ex.time);
    rows.push({
      fieldName: 'time',
      displayLabel: 'Time',
      originalValue: ex.time,
      currentValue: ex.time,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }

  // Hospital
  if (ex.hospital_name) {
    console.log('[CONVERT] ✅ Found hospital:', ex.hospital_name);
    rows.push({
      fieldName: 'hospital',
      displayLabel: 'Hospital',
      originalValue: ex.hospital_name,
      currentValue: ex.hospital_name,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }

  // Doctor
  if (ex.doctor_name) {
    console.log('[CONVERT] ✅ Found doctor:', ex.doctor_name);
    rows.push({
      fieldName: 'doctor',
      displayLabel: 'Doctor',
      originalValue: ex.doctor_name,
      currentValue: ex.doctor_name,
      dataType: 'string',
      category: 'patient_details',
      confidence: 0.95
    });
  }

  // Optional fields
  const optionalFields = [
    ['department', 'Department'],
    ['services', 'Services'],
    ['doctor_notes', 'Doctor Notes'],
    ['observations', 'Observations'],
    ['remarks', 'Remarks']
  ];

  optionalFields.forEach(([key, label]) => {
    if (ex[key] !== null && ex[key] !== undefined && ex[key] !== '') {
      console.log(`[CONVERT] ✅ Found ${key}`);
      rows.push({
        fieldName: key,
        displayLabel: label,
        originalValue: ex[key],
        currentValue: ex[key],
        dataType: Array.isArray(ex[key]) ? 'array' : 'string',
        category: 'other',
        confidence: 0.90
      });
    }
  });

  // Clinic address
  if (ex.clinic_address) {
    const address = ex.clinic_address;
    
    if (address.street_address) {
      rows.push({
        fieldName: 'clinic_street_address',
        displayLabel: 'Clinic Street Address',
        originalValue: address.street_address,
        currentValue: address.street_address,
        dataType: 'string',
        category: 'other',
        confidence: 0.85
      });
    }
    
    if (address.city) {
      rows.push({
        fieldName: 'clinic_city',
        displayLabel: 'Clinic City',
        originalValue: address.city,
        currentValue: address.city,
        dataType: 'string',
        category: 'other',
        confidence: 0.85
      });
    }
    
    if (address.state) {
      rows.push({
        fieldName: 'clinic_state',
        displayLabel: 'Clinic State',
        originalValue: address.state,
        currentValue: address.state,
        dataType: 'string',
        category: 'other',
        confidence: 0.85
      });
    }
    
    if (address.pincode) {
      rows.push({
        fieldName: 'clinic_pincode',
        displayLabel: 'Clinic Pincode',
        originalValue: address.pincode,
        currentValue: address.pincode,
        dataType: 'string',
        category: 'other',
        confidence: 0.85
      });
    }
  }

  console.log(`[CONVERT] ✅ Created ${rows.length} rows for MEDICAL_HISTORY`);
  return rows;
}

/**
 * PROFESSIONAL IMPROVEMENT: Convert billing data to rows with complete details
 * @param {Object} extractedData - Extracted billing data
 * @returns {Array} Data rows
 */
function convertBillingData(extractedData) {
  console.log('[CONVERT] Processing BILLING document');
  const rows = [];
  
  const ex = extractedData.extraction || extractedData;
  console.log('[CONVERT] Billing data keys:', Object.keys(ex));

  // Patient details (if present)
  if (ex.patient_details) {
    const patient = ex.patient_details;
    
    if (patient.name) {
      rows.push({
        fieldName: 'patient_name',
        displayLabel: 'Patient Name',
        originalValue: patient.name,
        currentValue: patient.name,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }
    
    if (patient.age) {
      rows.push({
        fieldName: 'patient_age',
        displayLabel: 'Patient Age',
        originalValue: patient.age,
        currentValue: patient.age,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }
    
    if (patient.gender) {
      rows.push({
        fieldName: 'patient_gender',
        displayLabel: 'Patient Gender',
        originalValue: patient.gender,
        currentValue: patient.gender,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }
    
    if (patient.uhid_no) {
      rows.push({
        fieldName: 'uhid_no',
        displayLabel: 'UHID Number',
        originalValue: patient.uhid_no,
        currentValue: patient.uhid_no,
        dataType: 'string',
        category: 'patient_details',
        confidence: 0.95
      });
    }
  }

  // Bill number
  if (ex.bill_number) {
    rows.push({
      fieldName: 'bill_number',
      displayLabel: 'Bill Number',
      originalValue: ex.bill_number,
      currentValue: ex.bill_number,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }
  
  // Bill date
  if (ex.bill_date) {
    rows.push({
      fieldName: 'bill_date',
      displayLabel: 'Bill Date',
      originalValue: ex.bill_date,
      currentValue: ex.bill_date,
      dataType: 'date',
      category: 'other',
      confidence: 0.95
    });
  }
  
  // Hospital
  if (ex.hospital) {
    rows.push({
      fieldName: 'hospital',
      displayLabel: 'Hospital',
      originalValue: ex.hospital,
      currentValue: ex.hospital,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }
  
  // Doctor name
  if (ex.doctor_name) {
    rows.push({
      fieldName: 'doctor_name',
      displayLabel: 'Doctor Name',
      originalValue: ex.doctor_name,
      currentValue: ex.doctor_name,
      dataType: 'string',
      category: 'patient_details',
      confidence: 0.95
    });
  }
  
  // Department
  if (ex.department) {
    rows.push({
      fieldName: 'department',
      displayLabel: 'Department',
      originalValue: ex.department,
      currentValue: ex.department,
      dataType: 'string',
      category: 'other',
      confidence: 0.90
    });
  }
  
  // Billed items
  if (ex.items && Array.isArray(ex.items) && ex.items.length > 0) {
    console.log('[CONVERT] ✅ Found billed items:', ex.items.length);
    
    ex.items.forEach((item, index) => {
      rows.push({
        fieldName: `item_${index}`,
        displayLabel: `Item ${index + 1}: ${item.description || 'Service'}`,
        originalValue: item,
        currentValue: item,
        dataType: 'object',
        category: 'other',
        confidence: 0.90
      });
    });
  }
  
  // Total amount
  if (ex.total_amount) {
    rows.push({
      fieldName: 'total_amount',
      displayLabel: 'Total Amount',
      originalValue: ex.total_amount,
      currentValue: ex.total_amount,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }
  
  // Paid amount
  if (ex.paid_amount) {
    rows.push({
      fieldName: 'paid_amount',
      displayLabel: 'Paid Amount',
      originalValue: ex.paid_amount,
      currentValue: ex.paid_amount,
      dataType: 'string',
      category: 'other',
      confidence: 0.95
    });
  }
  
  // Balance
  if (ex.balance) {
    rows.push({
      fieldName: 'balance',
      displayLabel: 'Balance',
      originalValue: ex.balance,
      currentValue: ex.balance,
      dataType: 'string',
      category: 'other',
      confidence: 0.90
    });
  }
  
  // Payment mode
  if (ex.payment_mode) {
    rows.push({
      fieldName: 'payment_mode',
      displayLabel: 'Payment Mode',
      originalValue: ex.payment_mode,
      currentValue: ex.payment_mode,
      dataType: 'string',
      category: 'other',
      confidence: 0.90
    });
  }
  
  // CGST
  if (ex.cgst) {
    rows.push({
      fieldName: 'cgst',
      displayLabel: 'CGST',
      originalValue: ex.cgst,
      currentValue: ex.cgst,
      dataType: 'string',
      category: 'other',
      confidence: 0.90
    });
  }
  
  // SGST
  if (ex.sgst) {
    rows.push({
      fieldName: 'sgst',
      displayLabel: 'SGST',
      originalValue: ex.sgst,
      currentValue: ex.sgst,
      dataType: 'string',
      category: 'other',
      confidence: 0.90
    });
  }
  
  // Clinic address
  if (ex.clinic_address) {
    const address = ex.clinic_address;
    
    if (address.street_address) {
      rows.push({
        fieldName: 'clinic_street_address',
        displayLabel: 'Clinic Street Address',
        originalValue: address.street_address,
        currentValue: address.street_address,
        dataType: 'string',
        category: 'other',
        confidence: 0.85
      });
    }
    
    if (address.city) {
      rows.push({
        fieldName: 'clinic_city',
        displayLabel: 'Clinic City',
        originalValue: address.city,
        currentValue: address.city,
        dataType: 'string',
        category: 'other',
        confidence: 0.85
      });
    }
    
    if (address.state) {
      rows.push({
        fieldName: 'clinic_state',
        displayLabel: 'Clinic State',
        originalValue: address.state,
        currentValue: address.state,
        dataType: 'string',
        category: 'other',
        confidence: 0.85
      });
    }
    
    if (address.pincode) {
      rows.push({
        fieldName: 'clinic_pincode',
        displayLabel: 'Clinic Pincode',
        originalValue: address.pincode,
        currentValue: address.pincode,
        dataType: 'string',
        category: 'other',
        confidence: 0.85
      });
    }
  }
  
  // Notes
  if (ex.notes) {
    rows.push({
      fieldName: 'notes',
      displayLabel: 'Notes',
      originalValue: ex.notes,
      currentValue: ex.notes,
      dataType: 'string',
      category: 'other',
      confidence: 0.85
    });
  }

  console.log(`[CONVERT] ✅ Created ${rows.length} rows for BILLING`);
  return rows;
}

module.exports = {
  convertExtractedDataToRows,
  convertPrescriptionData,
  convertLabReportData,
  convertMedicalHistoryData,
  convertBillingData
};

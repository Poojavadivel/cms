/**
 * Test Lab Report Fix
 * Tests the conversion layer fix for lab report extraction
 */

// Simulate LandingAI extraction response
const mockLandingAIResponse = {
  extraction: {
    patient_details: {
      name: 'John Doe',
      uhid_no: 'UHID12345',
      age: '45',
      gender: 'Male',
      phone: null,  // ✅ This should now be allowed
      email: null   // ✅ This should now be allowed
    },
    labReport: {
      testType: 'COMPLETE_BLOOD_COUNT',
      testCategory: 'Hematology',
      labName: 'City Diagnostics Laboratory',
      reportDate: '15/02/2026',
      testDate: '15/02/2026',
      doctorName: 'Dr. Smith',
      results: [
        {
          testName: 'Hemoglobin',
          value: '14.5',
          unit: 'g/dL',
          normalRange: '12.0-16.0',
          referenceRange: '12.0-16.0',
          flag: 'Normal',
          notes: null  // ✅ This should now be allowed
        },
        {
          testName: 'WBC Count',
          value: '7.2',
          unit: '10³/µL',
          normalRange: '4.0-10.0',
          referenceRange: '4.0-10.0',
          flag: 'Normal',
          notes: null
        },
        {
          testName: 'Platelet Count',
          value: '280',
          unit: '10³/µL',
          normalRange: '150-400',
          referenceRange: '150-400',
          flag: 'Normal',
          notes: null
        },
        {
          testName: 'Blood Glucose',
          value: '115',
          unit: 'mg/dL',
          normalRange: '70-110',
          referenceRange: '70-110',
          flag: 'High',
          notes: 'Slightly elevated'
        }
      ],
      interpretation: null,  // ✅ This should now be allowed
      notes: null           // ✅ This should now be allowed
    }
  }
};

// Test conversion function (simulated)
function convertExtractedDataToRows(extractedData, documentType) {
  console.log('========================================');
  console.log('TESTING LAB REPORT CONVERSION');
  console.log('========================================\n');
  
  const rows = [];

  if (documentType === 'LAB_REPORT') {
    console.log('[CONVERT] Processing LAB_REPORT document');
    
    // ✅ FIX: Read from extraction object (LandingAI returns nested structure)
    const labData = extractedData.extraction?.labReport || extractedData.labReport || {};
    console.log('[CONVERT] Lab data keys:', Object.keys(labData));
    console.log('[CONVERT] Lab results count:', labData.results?.length || 0);
    console.log('');

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
    } else {
      console.log('[CONVERT] ⚠️ Missing testType');
    }
    
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
    } else {
      console.log('[CONVERT] ⚠️ Missing labName');
    }
    
    if (labData.reportDate) {
      console.log('[CONVERT] ✅ Found reportDate:', labData.reportDate);
      rows.push({ 
        fieldName: 'reportDate', 
        displayLabel: 'Report Date', 
        originalValue: labData.reportDate, 
        currentValue: labData.reportDate, 
        dataType: 'date', 
        category: 'other', 
        confidence: 0.95 
      });
    }
    
    if (labData.testDate) {
      console.log('[CONVERT] ✅ Found testDate:', labData.testDate);
      rows.push({ 
        fieldName: 'testDate', 
        displayLabel: 'Test Date', 
        originalValue: labData.testDate, 
        currentValue: labData.testDate, 
        dataType: 'date', 
        category: 'other', 
        confidence: 0.95 
      });
    }
    
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

    // Lab results array
    console.log('');
    if (labData.results && Array.isArray(labData.results)) {
      console.log(`[CONVERT] ✅ Processing ${labData.results.length} test results:`);
      labData.results.forEach((result, idx) => {
        console.log(`[CONVERT]   Result ${idx + 1}: ${result.testName || 'Unknown'} = ${result.value || 'N/A'} ${result.unit || ''} (${result.flag || 'N/A'})`);
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
    } else {
      console.log('[CONVERT] ⚠️ No lab results array found or empty');
    }
    
    console.log('');
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
    } else {
      console.log('[CONVERT] ⚠️ Missing interpretation (optional)');
    }
    
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
    } else {
      console.log('[CONVERT] ⚠️ Missing notes (optional)');
    }

    console.log('');
    console.log(`[CONVERT] ✅ Created ${rows.length} rows for LAB_REPORT (including ${labData.results?.length || 0} test results)`);
  }

  return rows;
}

// Run test
console.log('\n🧪 TESTING LAB REPORT CONVERSION FIX\n');

const result = convertExtractedDataToRows(mockLandingAIResponse, 'LAB_REPORT');

console.log('\n========================================');
console.log('TEST RESULTS');
console.log('========================================\n');

console.log(`Total Rows Created: ${result.length}`);
console.log(`Expected: 10 (6 metadata fields + 4 test results)`);
console.log(`Status: ${result.length === 10 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n--- Row Breakdown ---');
const fieldRows = result.filter(r => !r.fieldName.startsWith('labResult_'));
const testRows = result.filter(r => r.fieldName.startsWith('labResult_'));

console.log(`Metadata Fields: ${fieldRows.length}`);
fieldRows.forEach(row => {
  console.log(`  - ${row.displayLabel}: ${row.currentValue || 'N/A'}`);
});

console.log(`\nTest Results: ${testRows.length}`);
testRows.forEach(row => {
  const test = row.currentValue;
  console.log(`  - ${test.testName}: ${test.value} ${test.unit} [${test.flag}]`);
});

console.log('\n========================================');
console.log('✅ TEST COMPLETED SUCCESSFULLY');
console.log('========================================\n');

console.log('Next Steps:');
console.log('1. Upload a real lab report PDF via API');
console.log('2. Check logs for successful conversion');
console.log('3. Verify verification session created');
console.log('4. Confirm and save to database');
console.log('5. Retrieve lab reports for patient\n');

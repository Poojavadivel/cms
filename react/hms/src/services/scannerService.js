/**
 * scannerService.js
 * Medical document scanner and OCR service
 * Matches Flutter's scanner functionality
 */

import axios from 'axios';
import { ScannerEndpoints } from './apiConstants';
import logger from './loggerService';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
};

/**
 * Scan and extract medical data from image/PDF file
 * @param {File} file - Image or PDF file
 * @param {string} patientId - Patient ID to associate the document with
 * @param {string} documentType - Type of document (PRESCRIPTION, LAB_REPORT, MEDICAL_HISTORY)
 * @param {boolean} useSectionLevel - Use section-level processing (V2)
 * @returns {Promise<Object>} Scanned data with extracted medical information
 */
export const scanAndExtractMedicalData = async (file, patientId, documentType = 'PRESCRIPTION', useSectionLevel = true) => {
  console.log('[SCANNER-SERVICE] ========================================');
  console.log('[SCANNER-SERVICE] Starting scan request');
  console.log('[SCANNER-SERVICE] ========================================');
  console.log('[SCANNER-SERVICE] 📄 File:', file.name, '(' + file.size + ' bytes)');
  console.log('[SCANNER-SERVICE] 👤 Patient ID:', patientId || 'NOT PROVIDED');
  console.log('[SCANNER-SERVICE] 📋 Document Type:', documentType);
  console.log('[SCANNER-SERVICE] 🚀 Section-Level:', useSectionLevel ? 'V2 (Enabled)' : 'V1 (Disabled)');

  try {
    const formData = new FormData();
    formData.append('image', file);  // Backend expects 'image' field
    formData.append('patientId', patientId);
    formData.append('documentType', documentType); // Specify document type for better accuracy

    console.log('[SCANNER-SERVICE] ✅ FormData created');
    console.log('[SCANNER-SERVICE] 📦 FormData contents:', {
      image: file.name,
      patientId: patientId,
      documentType: documentType
    });

    // Use V2 endpoint for section-level processing
    const scanEndpoint = useSectionLevel ? '/scan-medical-v2' : '/scan-medical';
    const endpoint = `${ScannerEndpoints.upload.replace('/upload', scanEndpoint)}`;
    console.log('[SCANNER-SERVICE] 🌐 Endpoint:', endpoint);
    logger.apiRequest('POST', endpoint);

    const token = getAuthToken();
    console.log('[SCANNER-SERVICE] 🔑 Auth Token:', token ? 'Present' : 'Missing');

    console.log('[SCANNER-SERVICE] 📤 Sending request to backend...');
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { 'x-auth-token': token })
      }
    });

    console.log('[SCANNER-SERVICE] ✅ Response received:', response.status);
    logger.apiResponse('POST', endpoint, response.status);

    const result = response.data;
    console.log('[SCANNER-SERVICE] 📊 Response Data:', {
      success: result.success,
      processingVersion: result.processingVersion,
      primaryDocumentType: result.primaryDocumentType || result.intent,
      sectionCount: result.sectionCount,
      verificationRequired: result.verificationRequired,
      verificationId: result.verificationId,
      hasExtractedData: !!result.extractedData
    });

    if (useSectionLevel && result.sectionCount > 0) {
      console.log('[SCANNER-SERVICE] 📋 Sections detected:', result.sectionCount);
      result.sections?.forEach((section, idx) => {
        console.log(`[SCANNER-SERVICE]   ${idx + 1}. ${section.heading} (${section.sectionType})`);
      });
    }

    logger.success('SCANNER', `✅ Document scanned for patient ${patientId} - Type: ${result.primaryDocumentType || result.intent}`);

    // Handle section-level response format
    const extracted = result.extractedData || {};
    console.log('[SCANNER-SERVICE] 📦 Extracted Data Keys:', Object.keys(extracted));
    
    let medications = '';
    let medicalHistory = '';
    let allergies = '';
    let diagnosis = '';
    let testResults = [];

    if (useSectionLevel && extracted.sections) {
      // Section-based extraction
      console.log('[SCANNER-SERVICE] 🔍 Processing section-based data');
      
      // Extract from prescriptions
      if (extracted.prescriptions?.length > 0) {
        medications = extracted.prescriptions
          .map(p => p.prescription_summary || '')
          .filter(s => s)
          .join('; ');
      }
      
      // Extract from medical history
      if (extracted.medicalHistory?.length > 0) {
        medicalHistory = extracted.medicalHistory
          .map(h => h.appointment_summary || h.discharge_summary || '')
          .filter(s => s)
          .join('; ');
      }
      
      // Extract from lab reports
      if (extracted.labReports?.length > 0) {
        testResults = extracted.labReports.flatMap(lab => lab.labReport?.results || []);
        diagnosis = extracted.labReports
          .map(lab => lab.labReport?.interpretation || '')
          .filter(s => s)
          .join('; ');
      }
    } else {
      // Legacy single-document extraction
      const patientDetails = extracted.patient_details || {};
      const labReport = extracted.labReport || {};
      
      if (extracted.medications && Array.isArray(extracted.medications)) {
        medications = extracted.medications
          .map(med => `${med.name} ${med.dose || ''} ${med.frequency || ''}`.trim())
          .join(', ');
      } else if (extracted.patient_details?.currentMedications) {
        medications = Array.isArray(extracted.patient_details.currentMedications)
          ? extracted.patient_details.currentMedications.join(', ')
          : extracted.patient_details.currentMedications;
      }

      allergies = patientDetails.allergies || extracted.allergies || '';
      medicalHistory = extracted.medicalHistory || 
                      (patientDetails.medicalHistory ? patientDetails.medicalHistory.join(', ') : '') ||
                      '';
      diagnosis = extracted.diagnosis || labReport.interpretation || labReport.notes || '';
      testResults = labReport.results || [];
    }

    console.log('[SCANNER-SERVICE] 💊 Medications:', medications || 'None');
    console.log('[SCANNER-SERVICE] ⚠️ Allergies:', allergies || 'None');
    console.log('[SCANNER-SERVICE] 📋 Medical History:', medicalHistory || 'None');
    console.log('[SCANNER-SERVICE] 🩺 Diagnosis:', diagnosis || 'None');
    console.log('[SCANNER-SERVICE] ✅ Scan complete, returning data');

    return {
      medicalHistory,
      allergies: typeof allergies === 'string' ? allergies : (Array.isArray(allergies) ? allergies.join(', ') : ''),
      medications,
      diagnosis,
      testResults,
      // Document metadata
      documentType: result.primaryDocumentType || result.intent || 'UNKNOWN',
      documentTypes: result.documentTypes || [],
      sectionCount: result.sectionCount || 0,
      sections: result.sections || [],
      ocrEngine: result.metadata?.ocrEngine || 'landingai-ade',
      confidence: result.metadata?.ocrConfidence || 0.95,
      processingTime: result.metadata?.processingTimeMs || 0,
      processingVersion: result.processingVersion || 'v1',
      // Verification data
      verificationRequired: result.verificationRequired || false,
      verificationId: result.verificationId || null,
      // Save info
      savedToPatient: result.savedToPatient || { saved: true, pdfId: null, reportId: null },
      warning: result.warning || null,
      success: result.success || false
    };
  } catch (error) {
    console.error('[SCANNER-SERVICE] ❌ ERROR:', error);
    console.error('[SCANNER-SERVICE] ❌ Response:', error.response?.data);
    console.error('[SCANNER-SERVICE] ❌ Status:', error.response?.status);
    logger.apiError('POST', 'scan-medical', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to scan document');
  }
};

/**
 * Get all reports for a patient
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} List of reports
 */
export const getPatientReports = async (patientId) => {
  try {
    logger.apiRequest('GET', ScannerEndpoints.getReports(patientId));

    const token = getAuthToken();
    const response = await axios.get(ScannerEndpoints.getReports(patientId), {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'x-auth-token': token })
      }
    });

    logger.apiResponse('GET', ScannerEndpoints.getReports(patientId), response.status);

    return response.data.reports || response.data || [];
  } catch (error) {
    logger.apiError('GET', ScannerEndpoints.getReports(patientId), error);
    return [];
  }
};

/**
 * Delete a scanned document
 * @param {string} pdfId - PDF/Document ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteScannedDocument = async (pdfId) => {
  try {
    logger.apiRequest('DELETE', ScannerEndpoints.deletePdf(pdfId));

    const token = getAuthToken();
    await axios.delete(ScannerEndpoints.deletePdf(pdfId), {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'x-auth-token': token })
      }
    });

    logger.success('SCANNER', `Document ${pdfId} deleted successfully`);
    return true;
  } catch (error) {
    logger.apiError('DELETE', ScannerEndpoints.deletePdf(pdfId), error);
    throw new Error(error.response?.data?.message || 'Failed to delete document');
  }
};

const scannerService = {
  scanAndExtractMedicalData,
  getPatientReports,
  deleteScannedDocument,
};

export default scannerService;

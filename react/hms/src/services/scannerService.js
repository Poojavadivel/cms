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
 * @returns {Promise<Object>} Scanned data with extracted medical information
 */
export const scanAndExtractMedicalData = async (file, patientId) => {
  try {
    const formData = new FormData();
    formData.append('image', file);  // Backend expects 'image' field
    formData.append('patientId', patientId);
    // Optional: specify document type for better accuracy
    // formData.append('documentType', 'PRESCRIPTION'); // or LAB_REPORT, MEDICAL_HISTORY

    const endpoint = `${ScannerEndpoints.upload.replace('/upload', '/scan-medical')}`;
    logger.apiRequest('POST', endpoint);

    const token = getAuthToken();
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { 'x-auth-token': token })
      }
    });

    logger.apiResponse('POST', endpoint, response.status);

    const result = response.data;

    logger.success('SCANNER', `✅ LandingAI scanned document for patient ${patientId} - Type: ${result.intent}`);

    // Handle LandingAI response format
    const extracted = result.extractedData || {};
    const patientDetails = extracted.patient_details || {};
    const labReport = extracted.labReport || {};
    
    // Format medications from LandingAI response
    let medications = '';
    if (extracted.medications && Array.isArray(extracted.medications)) {
      // Prescription format
      medications = extracted.medications
        .map(med => `${med.name} ${med.dose || ''} ${med.frequency || ''}`.trim())
        .join(', ');
    } else if (extracted.patient_details?.currentMedications) {
      // Medical history format
      medications = Array.isArray(extracted.patient_details.currentMedications)
        ? extracted.patient_details.currentMedications.join(', ')
        : extracted.patient_details.currentMedications;
    }

    // Format allergies
    const allergies = patientDetails.allergies || extracted.allergies || '';

    // Format medical history
    const medicalHistory = extracted.medicalHistory || 
                          (patientDetails.medicalHistory ? patientDetails.medicalHistory.join(', ') : '') ||
                          '';

    // Format diagnosis
    const diagnosis = extracted.diagnosis || labReport.interpretation || labReport.notes || '';

    return {
      medicalHistory,
      allergies: typeof allergies === 'string' ? allergies : (Array.isArray(allergies) ? allergies.join(', ') : ''),
      medications,
      diagnosis,
      testResults: labReport.results || [],
      // LandingAI metadata
      documentType: result.intent || 'UNKNOWN',
      ocrEngine: result.metadata?.ocrEngine || 'landingai-ade',
      confidence: result.metadata?.ocrConfidence || 0.95,
      processingTime: result.metadata?.processingTimeMs || 0,
      // Save info
      savedToPatient: result.savedToPatient || { saved: true, pdfId: null, reportId: null },
      warning: result.warning || null,
      success: result.success || false
    };
  } catch (error) {
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

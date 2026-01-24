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

    logger.success('SCANNER', `Document scanned successfully for patient ${patientId}`);

    // Handle the response from /scan-medical endpoint
    return {
      medicalHistory: result.extractedData?.medicalHistory || '',
      allergies: result.extractedData?.allergies || '',
      medications: result.extractedData?.medications || '',
      diagnosis: result.extractedData?.diagnosis || '',
      testResults: result.extractedData?.testResults || [],
      savedToPatient: result.savedToPatient || { saved: true },
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

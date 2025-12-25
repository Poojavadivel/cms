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
  return localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
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
    formData.append('file', file);
    formData.append('patientId', patientId);

    logger.apiRequest('POST', ScannerEndpoints.upload);

    const token = getAuthToken();
    const response = await axios.post(ScannerEndpoints.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { 'x-auth-token': token })
      }
    });

    logger.apiResponse('POST', ScannerEndpoints.upload, response.status);

    const result = response.data;
    
    logger.success('SCANNER', `Document scanned successfully for patient ${patientId}`);

    return {
      medicalHistory: result.medicalHistory || '',
      allergies: result.allergies || '',
      medications: result.medications || '',
      diagnosis: result.diagnosis || '',
      testResults: result.testResults || [],
      savedToPatient: result.savedToPatient || { saved: true },
      warning: result.warning || null
    };
  } catch (error) {
    logger.apiError('POST', ScannerEndpoints.upload, error);
    throw new Error(error.response?.data?.message || 'Failed to scan document');
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

/**
 * prescriptionService.js
 * Prescription API Service - Matches Flutter's prescription fetching methods
 * 
 * Provides methods to fetch prescriptions for patients
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
 * Create axios instance with default config
 */
const createAxiosInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-auth-token': token })
    }
  });
};

/**
 * Fetch prescriptions for a patient
 * Matches Flutter's getPrescriptions method in AuthService
 * 
 * @param {string} patientId - Patient ID
 * @param {number} limit - Max number of records (default: 50)
 * @param {number} page - Page number (default: 0)
 * @returns {Promise<Array>} List of prescriptions
 */
export const fetchPrescriptions = async (patientId, limit = 50, page = 0) => {
  if (!patientId || patientId.trim() === '') {
    throw new Error('patientId is required');
  }

  try {
    // Try dedicated prescriptions endpoint first
    const scannerEndpoint = ScannerEndpoints.getPrescriptions(patientId);
    logger.apiRequest('GET', scannerEndpoint);
    logger.info('PRESCRIPTIONS', `Fetching from dedicated endpoint: ${scannerEndpoint}`);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(scannerEndpoint);
    
    logger.apiResponse('GET', scannerEndpoint, response.status);
    
    // Check for successful response with prescriptions
    if (response.data && response.data.success && response.data.prescriptions) {
      const prescriptions = response.data.prescriptions;
      logger.success('PRESCRIPTIONS', `Found ${prescriptions.length} prescriptions`);
      return prescriptions;
    }
    
    // If no prescriptions in response, return empty array
    logger.warning('PRESCRIPTIONS', 'No prescriptions found in response');
    return [];
    
  } catch (error) {
    // If dedicated endpoint fails, try fallback to combined reports endpoint
    logger.warning('PRESCRIPTIONS', `Dedicated endpoint failed: ${error.message}`);
    
    try {
      const reportsEndpoint = ScannerEndpoints.getReports(patientId);
      logger.info('PRESCRIPTIONS', `Trying fallback combined endpoint: ${reportsEndpoint}`);
      
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get(reportsEndpoint);
      
      if (response.data && response.data.success && response.data.reports) {
        const reports = response.data.reports;
        
        // Filter only PRESCRIPTION type reports
        const prescriptions = reports.filter(report => {
          const intent = report.intent?.toString().toUpperCase();
          const testType = report.testType?.toString().toUpperCase();
          return intent === 'PRESCRIPTION' || testType === 'PRESCRIPTION';
        });
        
        logger.success('PRESCRIPTIONS', `Found ${prescriptions.length} prescriptions out of ${reports.length} total reports`);
        return prescriptions;
      }
      
      logger.warning('PRESCRIPTIONS', 'No prescriptions found in fallback endpoint');
      return [];
      
    } catch (fallbackError) {
      logger.apiError('GET', ScannerEndpoints.getReports(patientId), fallbackError);
      logger.warning('PRESCRIPTIONS', 'No prescriptions found');
      return [];
    }
  }
};

/**
 * Fetch lab reports for a patient
 * 
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} List of lab reports
 */
export const fetchLabReports = async (patientId) => {
  if (!patientId || patientId.trim() === '') {
    throw new Error('patientId is required');
  }

  try {
    const endpoint = ScannerEndpoints.getLabReports(patientId);
    logger.apiRequest('GET', endpoint);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(endpoint);
    
    logger.apiResponse('GET', endpoint, response.status);
    
    if (response.data && response.data.success && response.data.labReports) {
      logger.success('LAB_REPORTS', `Found ${response.data.labReports.length} lab reports`);
      return response.data.labReports;
    }
    
    return [];
  } catch (error) {
    logger.apiError('GET', ScannerEndpoints.getLabReports(patientId), error);
    return [];
  }
};

/**
 * Fetch medical history for a patient
 * 
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} List of medical history records
 */
export const fetchMedicalHistory = async (patientId) => {
  if (!patientId || patientId.trim() === '') {
    throw new Error('patientId is required');
  }

  try {
    const endpoint = ScannerEndpoints.getMedicalHistory(patientId);
    logger.apiRequest('GET', endpoint);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(endpoint);
    
    logger.apiResponse('GET', endpoint, response.status);
    
    if (response.data && response.data.success && response.data.medicalHistory) {
      logger.success('MEDICAL_HISTORY', `Found ${response.data.medicalHistory.length} medical history records`);
      return response.data.medicalHistory;
    }
    
    return [];
  } catch (error) {
    logger.apiError('GET', ScannerEndpoints.getMedicalHistory(patientId), error);
    return [];
  }
};

const prescriptionService = {
  fetchPrescriptions,
  fetchLabReports,
  fetchMedicalHistory,
};

export default prescriptionService;

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
    // FIRST: Try pharmacy records endpoint (for real prescriptions/dispense records)
    const pharmacyEndpoint = `/pharmacy/records?patientId=${patientId}&type=Dispense&limit=${limit}&page=${page}`;
    logger.apiRequest('GET', pharmacyEndpoint);
    logger.info('PRESCRIPTIONS', `Fetching from pharmacy records: ${pharmacyEndpoint}`);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(pharmacyEndpoint);

    logger.apiResponse('GET', pharmacyEndpoint, response.status);

    // Check for successful response with records AND has data
    if (response.data && response.data.success && response.data.records && response.data.records.length > 0) {
      const prescriptions = response.data.records;
      logger.success('PRESCRIPTIONS', `Found ${prescriptions.length} pharmacy records (prescriptions)`);
      return prescriptions;
    } else {
      logger.info('PRESCRIPTIONS', `Pharmacy records empty, trying scanned prescriptions...`);
    }

  } catch (pharmacyError) {
    logger.warning('PRESCRIPTIONS', `Pharmacy endpoint failed: ${pharmacyError.message}`);
  }

  try {
    // SECOND: Try dedicated prescriptions endpoint (scanned documents)
    const scannerEndpoint = ScannerEndpoints.getPrescriptions(patientId);
    logger.apiRequest('GET', scannerEndpoint);
    logger.info('PRESCRIPTIONS', `Trying scanned prescriptions: ${scannerEndpoint}`);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(scannerEndpoint);

    logger.apiResponse('GET', scannerEndpoint, response.status);

    // Check for successful response with prescriptions
    if (response.data && response.data.success && response.data.prescriptions) {
      const prescriptions = response.data.prescriptions;
      logger.success('PRESCRIPTIONS', `Found ${prescriptions.length} scanned prescriptions`);
      return prescriptions;
    }

  } catch (error) {
    logger.warning('PRESCRIPTIONS', `Scanner endpoint failed: ${error.message}`);
  }

  try {
    // THIRD: Try fallback to combined reports endpoint
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

  } catch (fallbackError) {
    logger.apiError('GET', ScannerEndpoints.getReports(patientId), fallbackError);
  }

  logger.warning('PRESCRIPTIONS', 'No prescriptions found from any endpoint');
  return [];
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

  console.log('[LAB_REPORTS] 🔍 Starting fetch for patient:', patientId);

  try {
    // FIRST: Try pathology reports endpoint (for real lab reports)
    const pathologyEndpoint = `/pathology/reports?patientId=${patientId}&limit=100`;
    logger.apiRequest('GET', pathologyEndpoint);
    logger.info('LAB_REPORTS', `Fetching from pathology reports: ${pathologyEndpoint}`);
    console.log('[LAB_REPORTS] 📡 Trying pathology endpoint:', pathologyEndpoint);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(pathologyEndpoint);

    logger.apiResponse('GET', pathologyEndpoint, response.status);
    console.log('[LAB_REPORTS] ✅ Pathology response:', response.status, response.data);

    if (response.data && response.data.success && response.data.reports && response.data.reports.length > 0) {
      logger.success('LAB_REPORTS', `Found ${response.data.reports.length} pathology reports`);
      console.log('[LAB_REPORTS] ✅ Returning', response.data.reports.length, 'pathology reports');
      return response.data.reports;
    } else {
      console.log('[LAB_REPORTS] ⚠️ Pathology response has no reports, trying scanner endpoint...');
    }

  } catch (pathologyError) {
    logger.warning('LAB_REPORTS', `Pathology endpoint failed: ${pathologyError.message}`);
    console.log('[LAB_REPORTS] ⚠️ Pathology endpoint failed:', pathologyError.message);
  }

  try {
    // SECOND: Try scanner lab reports endpoint (scanned documents)
    const endpoint = ScannerEndpoints.getLabReports(patientId);
    logger.apiRequest('GET', endpoint);
    logger.info('LAB_REPORTS', `Trying scanned lab reports: ${endpoint}`);
    console.log('[LAB_REPORTS] 📡 Trying scanner endpoint:', endpoint);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(endpoint);

    logger.apiResponse('GET', endpoint, response.status);
    console.log('[LAB_REPORTS] ✅ Scanner response:', response.status, response.data);

    if (response.data && response.data.success && response.data.labReports) {
      logger.success('LAB_REPORTS', `Found ${response.data.labReports.length} scanned lab reports`);
      console.log('[LAB_REPORTS] ✅ Returning', response.data.labReports.length, 'scanned lab reports');
      return response.data.labReports;
    } else if (response.data && response.data.labReports) {
      // Handle case where success field might be missing but data exists
      console.log('[LAB_REPORTS] ✅ Found labReports without success flag:', response.data.labReports.length);
      return response.data.labReports;
    } else {
      console.log('[LAB_REPORTS] ⚠️ Scanner response structure:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    logger.apiError('GET', ScannerEndpoints.getLabReports(patientId), error);
    console.error('[LAB_REPORTS] ❌ Scanner endpoint error:', error.message);
    if (error.response) {
      console.error('[LAB_REPORTS] ❌ Error response:', error.response.status, error.response.data);
    }
  }

  logger.warning('LAB_REPORTS', 'No lab reports found from any endpoint');
  console.log('[LAB_REPORTS] ⚠️ No lab reports found from any endpoint');
  return [];
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
    console.log('[SERVICE] 🔍 Fetching medical history from:', endpoint);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(endpoint);

    logger.apiResponse('GET', endpoint, response.status);
    console.log('[SERVICE] 📦 Response data:', {
      success: response.data?.success,
      count: response.data?.medicalHistory?.length || 0
    });

    if (response.data && response.data.success && response.data.medicalHistory) {
      logger.success('MEDICAL_HISTORY', `Found ${response.data.medicalHistory.length} medical history records`);
      console.log('[SERVICE] ✅ Returning', response.data.medicalHistory.length, 'records');
      return response.data.medicalHistory;
    }

    console.log('[SERVICE] ⚠️ No medical history in response');
    return [];
  } catch (error) {
    logger.apiError('GET', ScannerEndpoints.getMedicalHistory(patientId), error);
    console.error('[SERVICE] ❌ Failed to fetch medical history:', error.message);
    return [];
  }
};

const prescriptionService = {
  fetchPrescriptions,
  fetchLabReports,
  fetchMedicalHistory,
};

export default prescriptionService;

/**
 * patientsService.js
 * Patients API Service - React equivalent of Flutter's patient methods in AuthService
 * 
 * Provides CRUD operations for patients with real API integration
 */

import axios from 'axios';
import { PatientEndpoints, ReportEndpoints } from './apiConstants';
import logger from './loggerService';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Create axios instance with default config
 */
const createAxiosInstance = () => {
  const token = getAuthToken();
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
};

/**
 * Fetch all patients
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.q - Search query
 * @param {string} options.status - Status filter
 * @returns {Promise<Array>} List of patients
 */
export const fetchPatients = async (options = {}) => {
  try {
    const { page = 0, limit = 50, q = '', status = '' } = options;
    
    // Build query string
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (q) params.append('q', q);
    if (status) params.append('status', status);
    
    const url = `${PatientEndpoints.getAll}?${params.toString()}`;
    
    logger.apiRequest('GET', url);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);
    
    logger.apiResponse('GET', url, response.status);
    
    // Handle both array response and object with patients property
    let patients = [];
    if (Array.isArray(response.data)) {
      patients = response.data;
    } else if (response.data.patients) {
      patients = response.data.patients;
    } else if (response.data.data) {
      patients = response.data.data;
    }
    
    logger.success('PATIENTS', `Fetched ${patients.length} patients`);
    return patients;
  } catch (error) {
    logger.apiError('GET', PatientEndpoints.getAll, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch patients');
  }
};

/**
 * Fetch patient by ID
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Patient details
 */
export const fetchPatientById = async (id) => {
  try {
    logger.apiRequest('GET', PatientEndpoints.getById(id));
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(PatientEndpoints.getById(id));
    
    logger.apiResponse('GET', PatientEndpoints.getById(id), response.status);
    
    const patient = response.data.patient || response.data.data || response.data;
    
    logger.success('PATIENTS', `Fetched patient ${id}`);
    return patient;
  } catch (error) {
    logger.apiError('GET', PatientEndpoints.getById(id), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch patient');
  }
};

/**
 * Create new patient
 * @param {Object} patientData - Patient data
 * @returns {Promise<Object>} Created patient
 */
export const createPatient = async (patientData) => {
  try {
    logger.apiRequest('POST', PatientEndpoints.create, patientData);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post(PatientEndpoints.create, patientData);
    
    logger.apiResponse('POST', PatientEndpoints.create, response.status);
    logger.success('PATIENTS', 'Patient created successfully');
    
    return response.data.patient || response.data.data || response.data;
  } catch (error) {
    logger.apiError('POST', PatientEndpoints.create, error);
    throw new Error(error.response?.data?.message || 'Failed to create patient');
  }
};

/**
 * Update existing patient
 * @param {string} id - Patient ID
 * @param {Object} patientData - Updated patient data
 * @returns {Promise<Object>} Updated patient
 */
export const updatePatient = async (id, patientData) => {
  try {
    logger.apiRequest('PUT', PatientEndpoints.update(id), patientData);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.put(PatientEndpoints.update(id), patientData);
    
    logger.apiResponse('PUT', PatientEndpoints.update(id), response.status);
    logger.success('PATIENTS', `Patient ${id} updated successfully`);
    
    return response.data.patient || response.data.data || response.data;
  } catch (error) {
    logger.apiError('PUT', PatientEndpoints.update(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update patient');
  }
};

/**
 * Delete patient
 * @param {string} id - Patient ID
 * @returns {Promise<boolean>} Success status
 */
export const deletePatient = async (id) => {
  try {
    logger.apiRequest('DELETE', PatientEndpoints.delete(id));
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.delete(PatientEndpoints.delete(id));
    
    logger.apiResponse('DELETE', PatientEndpoints.delete(id), response.status);
    logger.success('PATIENTS', `Patient ${id} deleted successfully`);
    
    return true;
  } catch (error) {
    logger.apiError('DELETE', PatientEndpoints.delete(id), error);
    throw new Error(error.response?.data?.message || 'Failed to delete patient');
  }
};

/**
 * Download patient report
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Download result
 */
export const downloadPatientReport = async (patientId) => {
  try {
    logger.apiRequest('GET', ReportEndpoints.download(patientId));
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(ReportEndpoints.download(patientId), {
      responseType: 'blob' // For file download
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `patient_${patientId}_report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    logger.success('PATIENTS', `Downloaded report for patient ${patientId}`);
    
    return {
      success: true,
      message: 'Report downloaded successfully'
    };
  } catch (error) {
    logger.apiError('GET', ReportEndpoints.download(patientId), error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to download report'
    };
  }
};

// Export as default
const patientsService = {
  fetchPatients,
  fetchPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  downloadPatientReport,
};

export default patientsService;

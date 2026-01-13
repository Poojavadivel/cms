/**
 * patientsService.js
 * Patients API Service - React equivalent of Flutter's patient methods in AuthService
 * 
 * Provides CRUD operations for patients with real API integration
 */

import axios from 'axios';
import { PatientEndpoints, ReportsEndpoints } from './apiConstants';
import logger from './loggerService';
import { PatientDetails } from '../models/Patients';
import { fetchPrescriptions, fetchLabReports } from './prescriptionService';

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
    let rawPatients = [];
    if (Array.isArray(response.data)) {
      rawPatients = response.data;
    } else if (response.data.patients) {
      rawPatients = response.data.patients;
    } else if (response.data.data) {
      rawPatients = response.data.data;
    }

    // Transform each patient using PatientDetails.fromJSON for proper data extraction
    const patients = rawPatients.map(p => PatientDetails.fromJSON(p));

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
 * @returns {Promise<PatientDetails>} Patient details
 */
export const fetchPatientById = async (id) => {
  try {
    logger.apiRequest('GET', PatientEndpoints.getById(id));

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(PatientEndpoints.getById(id));

    logger.apiResponse('GET', PatientEndpoints.getById(id), response.status);

    const rawPatient = response.data.patient || response.data.data || response.data;

    // Transform using PatientDetails.fromJSON to ensure proper data extraction
    const patient = PatientDetails.fromJSON(rawPatient);

    logger.success('PATIENTS', `Fetched patient ${id} - Name: ${patient.name}, Age: ${patient.age}, Blood Group: ${patient.bloodGroup}`);
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
 * Download patient report (matching Flutter's ReportService implementation)
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Download result
 */
export const downloadPatientReport = async (patientId) => {
  try {
    const endpoint = ReportsEndpoints.patientReport(patientId);
    logger.apiRequest('GET', endpoint);

    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found. Please login again.'
      };
    }

    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      responseType: 'blob'
    });

    // Get filename from header or create default
    let filename = `Patient_Report_${Date.now()}.pdf`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    logger.success('PATIENTS', `Downloaded report for patient ${patientId}`);

    return {
      success: true,
      message: 'Patient report downloaded successfully',
      filename: filename
    };
  } catch (error) {
    logger.apiError('GET', ReportsEndpoints.patientReport(patientId), error);

    if (error.response?.status === 404) {
      return {
        success: false,
        message: 'Patient not found'
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || `Failed to generate patient report: ${error.message}`
    };
  }
};

/**
 * Fetch patient appointments/medical history
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} List of appointments
 */
export const fetchPatientAppointments = async (patientId) => {
  try {
    const url = `/appointments?patientId=${patientId}`;
    logger.apiRequest('GET', url);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);

    logger.apiResponse('GET', url, response.status);

    const appointments = response.data.appointments || response.data.data || response.data || [];

    logger.success('PATIENTS', `Fetched ${appointments.length} appointments for patient ${patientId}`);
    return appointments;
  } catch (error) {
    logger.apiError('GET', `/api/appointments?patientId=${patientId}`, error);
    return [];
  }
};

/**
 * Fetch patient prescriptions
 * Now uses the dedicated prescription service that matches Flutter's implementation
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} List of prescriptions
 */
export const fetchPatientPrescriptions = async (patientId) => {
  try {
    // Use the new prescription service that matches Flutter's getPrescriptions
    return await fetchPrescriptions(patientId, 100, 0);
  } catch (error) {
    logger.error('PATIENTS', `Failed to fetch prescriptions for patient ${patientId}: ${error.message}`);
    return [];
  }
};

/**
 * Fetch patient lab results
 * Now uses the dedicated prescription service that matches Flutter's implementation
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} List of lab results
 */
export const fetchPatientLabResults = async (patientId) => {
  try {
    // Use the new prescription service that matches Flutter's getLabReports
    return await fetchLabReports(patientId);
  } catch (error) {
    logger.error('PATIENTS', `Failed to fetch lab results for patient ${patientId}: ${error.message}`);
    return [];
  }
};

/**
 * Create follow-up appointment for patient
 * @param {string} patientId - Patient ID
 * @param {Object} followUpData - Follow-up data
 * @returns {Promise<Object>} Created follow-up
 */
export const createFollowUp = async (patientId, followUpData) => {
  try {
    const api = createAxiosInstance();
    const payload = {
      patientId: patientId,
      followUpDate: followUpData.followUpDate,
      followUpTime: followUpData.followUpTime || '09:00',
      reason: followUpData.reason,
      notes: followUpData.notes || '',
      status: 'scheduled'
    };

    logger.info('PATIENTS', `Creating follow-up for patient ${patientId}`, payload);

    const response = await api.post('/appointments/follow-up', payload);

    logger.success('PATIENTS', `Follow-up created successfully for patient ${patientId}`);
    return response.data;
  } catch (error) {
    logger.error('PATIENTS', `Failed to create follow-up for patient ${patientId}: ${error.message}`);
    throw new Error(error.response?.data?.message || 'Failed to schedule follow-up');
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
  fetchPatientAppointments,
  fetchPatientPrescriptions,
  fetchPatientLabResults,
  createFollowUp,
};

export default patientsService;

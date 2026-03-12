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
 * Prioritizes digital EMR records from intakes, then falls back to scanned docs.
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

  const allRecords = [];

  // ── SOURCE 1: Intake EMR records (digital prescriptions with pharmacy items) ──
  try {
    const intakeEndpoint = `/intake/${patientId}/intake`;
    logger.apiRequest('GET', intakeEndpoint);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(intakeEndpoint);

    if (response.data && response.data.success && response.data.intakes) {
      const digitalPrescriptions = response.data.intakes
        .filter(intake => intake.meta?.pharmacyItems && intake.meta.pharmacyItems.length > 0)
        .map(intake => ({
          _id: intake._id,
          prescriptionDate: intake.createdAt,
          date: intake.createdAt,
          hospitalName: 'Clinic',
          doctorName: intake.doctorName || 'Attending Physician',
          prescriptionSummary: intake.notes || intake.triage?.chiefComplaint || '',
          diagnosis: intake.triage?.chiefComplaint || '',
          items: intake.meta.pharmacyItems,
          type: 'DIGITAL',
          dispensed: !!intake.meta?.pharmacyId
        }));

      allRecords.push(...digitalPrescriptions);
      if (digitalPrescriptions.length > 0) {
        logger.success('PRESCRIPTIONS', `Found ${digitalPrescriptions.length} digital EMR prescriptions`);
      }
    }
  } catch (err) {
    logger.warn('PRESCRIPTIONS', `Intake EMR fetch failed: ${err.message}`);
  }

  // ── SOURCE 2: Dedicated PrescriptionDocument collection (scanned prescriptions only) ──
  try {
    const scannerEndpoint = ScannerEndpoints.getPrescriptions(patientId);
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(scannerEndpoint);

    if (response.data && response.data.success && response.data.prescriptions) {
      const scannedPrescriptions = response.data.prescriptions.map(rx => ({
        ...rx,
        type: 'SCANNED'
      }));
      allRecords.push(...scannedPrescriptions);
      if (scannedPrescriptions.length > 0) {
        logger.success('PRESCRIPTIONS', `Found ${scannedPrescriptions.length} scanned prescription documents`);
      }
    }
  } catch (e) {
    logger.warn('PRESCRIPTIONS', 'Scanner prescriptions fetch failed');
  }

  // ── SOURCE 3: Pharmacy dispense records ──
  try {
    const pharmacyEndpoint = `/pharmacy/records?patientId=${patientId}&type=Dispense&limit=${limit}&page=${page}`;
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(pharmacyEndpoint);

    if (response.data && response.data.success && response.data.records) {
      const dispenseRecords = response.data.records.map(rec => ({
        ...rec,
        type: 'DISPENSED'
      }));
      allRecords.push(...dispenseRecords);
    }
  } catch (e) {
    logger.warn('PRESCRIPTIONS', 'Pharmacy dispense records fetch failed');
  }

  // NOTE: We intentionally do NOT fetch from ScannerEndpoints.getReports() here.
  // That endpoint returns ALL scanned documents (lab reports, medical history, etc.)
  // and was causing data contamination in the Prescriptions tab.

  // Remove duplicates by _id and sort newest first
  const uniqueRecords = Array.from(
    new Map(allRecords.filter(r => r._id).map(item => [item._id.toString(), item])).values()
  );
  return uniqueRecords.sort((a, b) => {
    const dateA = new Date(a.prescriptionDate || a.date || a.createdAt || 0);
    const dateB = new Date(b.prescriptionDate || b.date || b.createdAt || 0);
    return dateB - dateA;
  });
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
    const pathologyEndpoint = `/pathology/reports?patientId=${patientId}&limit=100`;
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(pathologyEndpoint);

    if (response.data && response.data.success && response.data.reports && response.data.reports.length > 0) {
      return response.data.reports;
    }
  } catch (e) { /* fallback */ }

  try {
    const endpoint = ScannerEndpoints.getLabReports(patientId);
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(endpoint);

    if (response.data && response.data.success && response.data.labReports) {
      return response.data.labReports;
    }
    return response.data?.labReports || [];
  } catch (error) {
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
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(endpoint);

    if (response.data && response.data.success && response.data.medicalHistory) {
      return response.data.medicalHistory;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const addMedicalHistory = async (data) => {
  try {
    const endpoint = ScannerEndpoints.addMedicalHistory;
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMedicalHistory = async (id, data) => {
  try {
    const endpoint = ScannerEndpoints.updateMedicalHistory(id);
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMedicalHistory = async (id) => {
  try {
    const endpoint = ScannerEndpoints.deleteMedicalHistory(id);
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const prescriptionService = {
  fetchPrescriptions,
  fetchLabReports,
  fetchMedicalHistory,
  addMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
};

export default prescriptionService;

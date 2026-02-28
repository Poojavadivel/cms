import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ||
  ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : 'https://hms-dev.onrender.com/api');

const getAuthToken = () => localStorage.getItem('auth_token');

const createAxiosInstance = () => axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': getAuthToken(),
  },
});

/**
 * Fetch all beds grouped by ward + summary stats
 */
export const fetchBeds = async () => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.get('/beds');
  return response.data;
};

/**
 * Search patients for the assignment dropdown
 */
export const searchPatients = async (query = '') => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.get('/beds/patients', { params: { q: query } });
  return response.data;
};

/**
 * Assign a patient to a bed (AVAILABLE → OCCUPIED)
 */
export const assignBed = async (bedId, patientId, notes = '') => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.put(`/beds/${bedId}/assign`, { patientId, notes });
  return response.data;
};

/**
 * Discharge a patient from a bed (OCCUPIED → CLEANING)
 */
export const dischargeBed = async (bedId, reason = '') => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.put(`/beds/${bedId}/discharge`, { reason });
  return response.data;
};

/**
 * Mark bed available after cleaning (CLEANING → AVAILABLE)
 */
export const markBedAvailable = async (bedId) => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.put(`/beds/${bedId}/mark-available`);
  return response.data;
};

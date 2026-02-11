/**
 * medicinesService.js
 * API service for medicines/pharmacy operations
 */

import axios from 'axios';
import logger from './loggerService';

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? (process.env.REACT_APP_API_URL || 'http://localhost:5000/api')
  : 'https://hms-dev.onrender.com/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
};

/**
 * Create axios instance with auth header
 */
const createAxiosInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-auth-token': token }),
    },
  });
};

/**
 * Search medicines by query
 * @param {string} query - Search query
 * @param {number} limit - Results limit
 * @returns {Promise<Array>} Medicine list
 */
export const searchMedicines = async (query = '', limit = 50) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (query) params.append('q', query); // alternate param name
    params.append('limit', limit);

    const url = `/pharmacy/medicines?${params.toString()}`;

    logger.apiRequest('GET', url);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);

    logger.apiResponse('GET', url, response.status);

    // Handle different response formats
    let medicines = [];
    if (Array.isArray(response.data)) {
      medicines = response.data;
    } else if (response.data.medicines) {
      medicines = response.data.medicines;
    } else if (response.data.data) {
      medicines = response.data.data;
    }

    logger.success('MEDICINES', `Fetched ${medicines.length} medicines`);
    return medicines;
  } catch (error) {
    logger.apiError('GET', `/api/medicines`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch medicines');
  }
};

/**
 * Fetch all medicines
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Medicine list
 */
export const fetchMedicines = async (options = {}) => {
  try {
    const { page = 0, limit = 100, q = '' } = options;

    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (q) params.append('q', q);

    const url = `/pharmacy/medicines?${params.toString()}`;

    logger.apiRequest('GET', url);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);

    logger.apiResponse('GET', url, response.status);

    let medicines = [];
    if (Array.isArray(response.data)) {
      medicines = response.data;
    } else if (response.data.medicines) {
      medicines = response.data.medicines;
    } else if (response.data.data) {
      medicines = response.data.data;
    }

    logger.success('MEDICINES', `Fetched ${medicines.length} medicines`);
    return medicines;
  } catch (error) {
    logger.apiError('GET', `/api/medicines`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch medicines');
  }
};

/**
 * Fetch medicine by ID
 * @param {string} id - Medicine ID
 * @returns {Promise<Object>} Medicine details
 */
export const fetchMedicineById = async (id) => {
  try {
    const url = `/pharmacy/medicines/${id}`;

    logger.apiRequest('GET', url);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);

    logger.apiResponse('GET', url, response.status);

    const medicine = response.data.medicine || response.data.data || response.data;

    logger.success('MEDICINES', `Fetched medicine ${id}`);
    return medicine;
  } catch (error) {
    logger.apiError('GET', `/api/medicines/${id}`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch medicine');
  }
};

/**
 * Check medicine stock
 * @param {string} medicineId - Medicine ID
 * @returns {Promise<Object>} Stock information
 */
export const checkStock = async (medicineId) => {
  try {
    const url = `/pharmacy/medicines/${medicineId}/stock`;

    logger.apiRequest('GET', url);

    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(url);

    logger.apiResponse('GET', url, response.status);

    const stock = response.data.stock || response.data.data || response.data;

    logger.success('MEDICINES', `Checked stock for medicine ${medicineId}: ${stock}`);
    return stock;
  } catch (error) {
    logger.apiError('GET', `/api/medicines/${medicineId}/stock`, error);
    throw new Error(error.response?.data?.message || 'Failed to check stock');
  }
};

const medicinesService = {
  searchMedicines,
  fetchMedicines,
  fetchMedicineById,
  checkStock,
};

export default medicinesService;

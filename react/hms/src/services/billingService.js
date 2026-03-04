/**
 * Billing Service
 * Handles all API calls related to patient billing
 */

import axios from 'axios';
import logger from './loggerService';

const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

const API_BASE = '/billing';

const BillingEndpoints = {
  getAll: API_BASE,
  getById: (id) => `${API_BASE}/${id}`,
  getByPatient: (patientId) => `${API_BASE}/patient/${patientId}`,
  getStats: `${API_BASE}/stats`,
  create: API_BASE,
  update: (id) => `${API_BASE}/${id}`,
  delete: (id) => `${API_BASE}/${id}`,
  addPayment: (id) => `${API_BASE}/${id}/payment`,
  downloadPDF: (id) => `${API_BASE}/${id}/pdf`,
};

/**
 * Fetch all bills with optional filters
 */
const fetchBills = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      status = '',
      patientId = '',
      startDate = '',
      endDate = '',
      search = ''
    } = params;

    let url = BillingEndpoints.getAll;
    const queryParams = [];
    
    if (page) queryParams.push(`page=${page}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    if (patientId) queryParams.push(`patientId=${encodeURIComponent(patientId)}`);
    if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('GET', BillingEndpoints.getAll, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch bills');
  }
};

/**
 * Fetch billing statistics
 */
const fetchBillingStats = async (startDate = '', endDate = '') => {
  try {
    let url = BillingEndpoints.getStats;
    const queryParams = [];
    
    if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);

    return response.data.stats;
  } catch (error) {
    logger.apiError('GET', BillingEndpoints.getStats, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch billing stats');
  }
};

/**
 * Fetch bill by ID
 */
const fetchBillById = async (id) => {
  try {
    logger.apiRequest('GET', BillingEndpoints.getById(id));
    const response = await api.get(BillingEndpoints.getById(id));
    logger.apiResponse('GET', BillingEndpoints.getById(id), response.status, response.data);

    return response.data.bill;
  } catch (error) {
    logger.apiError('GET', BillingEndpoints.getById(id), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch bill');
  }
};

/**
 * Fetch bills for a patient
 */
const fetchBillsByPatient = async (patientId) => {
  try {
    logger.apiRequest('GET', BillingEndpoints.getByPatient(patientId));
    const response = await api.get(BillingEndpoints.getByPatient(patientId));
    logger.apiResponse('GET', BillingEndpoints.getByPatient(patientId), response.status, response.data);

    return response.data.bills;
  } catch (error) {
    logger.apiError('GET', BillingEndpoints.getByPatient(patientId), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch patient bills');
  }
};

/**
 * Create new bill
 */
const createBill = async (billData) => {
  try {
    logger.apiRequest('POST', BillingEndpoints.create, billData);
    const response = await api.post(BillingEndpoints.create, billData);
    logger.apiResponse('POST', BillingEndpoints.create, response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('POST', BillingEndpoints.create, error);
    throw new Error(error.response?.data?.message || 'Failed to create bill');
  }
};

/**
 * Update bill
 */
const updateBill = async (id, billData) => {
  try {
    logger.apiRequest('PUT', BillingEndpoints.update(id), billData);
    const response = await api.put(BillingEndpoints.update(id), billData);
    logger.apiResponse('PUT', BillingEndpoints.update(id), response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('PUT', BillingEndpoints.update(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update bill');
  }
};

/**
 * Delete (cancel) bill
 */
const deleteBill = async (id) => {
  try {
    logger.apiRequest('DELETE', BillingEndpoints.delete(id));
    const response = await api.delete(BillingEndpoints.delete(id));
    logger.apiResponse('DELETE', BillingEndpoints.delete(id), response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('DELETE', BillingEndpoints.delete(id), error);
    throw new Error(error.response?.data?.message || 'Failed to delete bill');
  }
};

/**
 * Add payment to bill
 */
const addPayment = async (id, paymentData) => {
  try {
    logger.apiRequest('POST', BillingEndpoints.addPayment(id), paymentData);
    const response = await api.post(BillingEndpoints.addPayment(id), paymentData);
    logger.apiResponse('POST', BillingEndpoints.addPayment(id), response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('POST', BillingEndpoints.addPayment(id), error);
    throw new Error(error.response?.data?.message || 'Failed to add payment');
  }
};

/**
 * Download bill PDF
 */
const downloadBillPDF = async (id, billNumber = 'bill') => {
  try {
    logger.apiRequest('GET', BillingEndpoints.downloadPDF(id));
    const response = await api.get(BillingEndpoints.downloadPDF(id), {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${billNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    logger.apiResponse('GET', BillingEndpoints.downloadPDF(id), response.status, 'File downloaded');
    return response.data;
  } catch (error) {
    logger.apiError('GET', BillingEndpoints.downloadPDF(id), error);
    throw new Error(error.response?.data?.message || 'Failed to download bill PDF');
  }
};

const billingService = {
  fetchBills,
  fetchBillingStats,
  fetchBillById,
  fetchBillsByPatient,
  createBill,
  updateBill,
  deleteBill,
  addPayment,
  downloadBillPDF
};

export default billingService;

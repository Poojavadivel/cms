/**
 * Pharmacy Service
 * Handles all API calls related to pharmacy inventory management
 */

import axios from 'axios';
import logger from './loggerService';

const getAuthToken = () => {
  return localStorage.getItem('authToken');
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
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const API_BASE = '/pharmacy';

const PharmacyEndpoints = {
  getAll: `${API_BASE}/medicines`,
  getById: (id) => `${API_BASE}/medicines/${id}`,
  create: `${API_BASE}/medicines`,
  update: (id) => `${API_BASE}/medicines/${id}`,
  delete: (id) => `${API_BASE}/medicines/${id}`,
  downloadReport: (id) => `${API_BASE}/medicines/${id}/report`,
  lowStock: `${API_BASE}/medicines/low-stock`,
};

const fetchMedicines = async (params = {}) => {
  try {
    const { page = 0, limit = 100, q = '', status = '' } = params;
    
    // Build query parameters
    let url = PharmacyEndpoints.getAll;
    const queryParams = [];
    if (page) queryParams.push(`page=${page}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (q) queryParams.push(`q=${encodeURIComponent(q)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);
    
    // Handle different response formats from backend
    let medicinesData;
    if (Array.isArray(response.data)) {
      medicinesData = response.data;
    } else if (response.data?.medicines) {
      medicinesData = response.data.medicines;
    } else if (response.data?.data) {
      medicinesData = response.data.data;
    } else {
      medicinesData = [];
    }
    
    // Transform backend data to match frontend expectations
    return medicinesData.map(med => ({
      id: med._id || med.id,
      name: med.name || med.medicineName || 'Unknown Medicine',
      category: med.category || med.type || 'General',
      manufacturer: med.manufacturer || med.company || 'Unknown',
      quantity: med.quantity || med.stock || 0,
      unit: med.unit || med.unitType || 'units',
      batchNumber: med.batchNumber || med.batch || med.batchNo || 'N/A',
      expiryDate: med.expiryDate || med.expiry || med.expirationDate || null,
      price: med.price || med.mrp || med.unitPrice || 0,
      stockStatus: determineStockStatus(med.quantity || med.stock || 0, med.minStock)
    }));
  } catch (error) {
    logger.apiError('GET', PharmacyEndpoints.getAll, error);
    console.error('Failed to fetch medicines from API:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch medicines');
  }
};

// Helper function to determine stock status
const determineStockStatus = (quantity, minStock = 50) => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= minStock) return 'Low Stock';
  return 'In Stock';
};

const fetchMedicineById = async (id) => {
  try {
    logger.apiRequest('GET', PharmacyEndpoints.getById(id));
    const response = await api.get(PharmacyEndpoints.getById(id));
    logger.apiResponse('GET', PharmacyEndpoints.getById(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('GET', PharmacyEndpoints.getById(id), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch medicine');
  }
};

const createMedicine = async (medicineData) => {
  try {
    logger.apiRequest('POST', PharmacyEndpoints.create, medicineData);
    const response = await api.post(PharmacyEndpoints.create, medicineData);
    logger.apiResponse('POST', PharmacyEndpoints.create, response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('POST', PharmacyEndpoints.create, error);
    throw new Error(error.response?.data?.message || 'Failed to create medicine');
  }
};

const updateMedicine = async (id, medicineData) => {
  try {
    logger.apiRequest('PUT', PharmacyEndpoints.update(id), medicineData);
    const response = await api.put(PharmacyEndpoints.update(id), medicineData);
    logger.apiResponse('PUT', PharmacyEndpoints.update(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('PUT', PharmacyEndpoints.update(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update medicine');
  }
};

const deleteMedicine = async (id) => {
  try {
    logger.apiRequest('DELETE', PharmacyEndpoints.delete(id));
    const response = await api.delete(PharmacyEndpoints.delete(id));
    logger.apiResponse('DELETE', PharmacyEndpoints.delete(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('DELETE', PharmacyEndpoints.delete(id), error);
    throw new Error(error.response?.data?.message || 'Failed to delete medicine');
  }
};

const downloadMedicineReport = async (id) => {
  try {
    logger.apiRequest('GET', PharmacyEndpoints.downloadReport(id));
    const response = await api.get(PharmacyEndpoints.downloadReport(id), {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medicine_${id}_report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    logger.apiResponse('GET', PharmacyEndpoints.downloadReport(id), response.status, 'File downloaded');
    return response.data;
  } catch (error) {
    logger.apiError('GET', PharmacyEndpoints.downloadReport(id), error);
    throw new Error(error.response?.data?.message || 'Failed to download report');
  }
};

const pharmacyService = {
  fetchMedicines,
  fetchMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  downloadMedicineReport
};

export default pharmacyService;

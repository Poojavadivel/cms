/**
 * medicineService.js
 * Medicine/Stock API Service - Matches Flutter's medicine fetching methods
 * 
 * Provides methods to fetch medicines and check stock availability
 */

import axios from 'axios';
import { PharmacyEndpoints } from './apiConstants';
import logger from './loggerService';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
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
 * Fetch all medicines with optional filtering
 * Matches Flutter's fetchMedicines method in AuthService
 * 
 * @param {Object} options - Fetch options
 * @param {number} options.page - Page number (default: 0)
 * @param {number} options.limit - Max number of records (default: 50)
 * @param {string} options.search - Search query (default: '')
 * @param {string} options.status - Status filter (default: '')
 * @returns {Promise<Array>} List of medicines
 */
export const fetchMedicines = async (options = {}) => {
  const {
    page = 0,
    limit = 50,
    search = '',
    status = ''
  } = options;

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('q', search);
    if (status) params.append('status', status);
    
    const endpoint = `${PharmacyEndpoints.getMedicines}?${params.toString()}`;
    logger.apiRequest('GET', endpoint);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(endpoint);
    
    logger.apiResponse('GET', endpoint, response.status);
    
    // Handle different response formats
    let medicines = [];
    if (Array.isArray(response.data)) {
      medicines = response.data;
    } else if (response.data.medicines) {
      medicines = response.data.medicines;
    } else if (response.data.data) {
      medicines = response.data.data;
    } else if (response.data.success && response.data.records) {
      medicines = response.data.records;
    }
    
    logger.success('MEDICINES', `Fetched ${medicines.length} medicines`);
    return medicines;
    
  } catch (error) {
    logger.apiError('GET', PharmacyEndpoints.getMedicines, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch medicines');
  }
};

/**
 * Get stock for a specific medicine by ID
 * 
 * @param {string} medicineId - Medicine ID
 * @returns {Promise<Object>} Medicine with stock info
 */
export const getMedicineStock = async (medicineId) => {
  if (!medicineId) {
    throw new Error('medicineId is required');
  }

  try {
    const endpoint = PharmacyEndpoints.getMedicineById(medicineId);
    logger.apiRequest('GET', endpoint);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(endpoint);
    
    logger.apiResponse('GET', endpoint, response.status);
    
    const medicine = response.data.medicine || response.data.data || response.data;
    
    // Extract stock information
    const stock = {
      medicineId: medicine._id || medicine.id,
      name: medicine.name || medicine.genericName,
      availableQty: medicine.availableQty || medicine.stock || 0,
      reorderLevel: medicine.reorderLevel || 20,
      status: medicine.status || 'In Stock',
      batches: medicine.batches || []
    };
    
    logger.success('MEDICINES', `Fetched stock for ${stock.name}: ${stock.availableQty} units`);
    return stock;
    
  } catch (error) {
    logger.apiError('GET', PharmacyEndpoints.getMedicineById(medicineId), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch medicine stock');
  }
};

/**
 * Check stock warnings for a list of pharmacy items
 * Matches Flutter's getStockWarnings method
 * 
 * @param {Array} pharmacyItems - Array of pharmacy items with medicineId and quantity
 * @param {Array} medicines - Array of available medicines
 * @returns {Array} Array of stock warnings
 */
export const checkStockWarnings = (pharmacyItems, medicines) => {
  const warnings = [];
  
  for (const item of pharmacyItems) {
    const medicineName = item.Medicine || item.medicineName || 'Unknown';
    const medicineId = item.medicineId;
    const requestedQty = parseInt(item.quantity || item.Quantity || 1);
    
    // Find medicine in available medicines list
    const medicine = medicines.find(m => 
      m._id === medicineId || 
      m.id === medicineId ||
      m.name === medicineName ||
      m.genericName === medicineName
    );
    
    if (!medicine) {
      warnings.push({
        medicine: medicineName,
        type: 'NOT_FOUND',
        severity: 'error',
        message: `${medicineName} not found in inventory`
      });
      continue;
    }
    
    const availableStock = medicine.availableQty || medicine.stock || 0;
    const reorderLevel = medicine.reorderLevel || 20;
    
    // Check if out of stock
    if (availableStock === 0) {
      warnings.push({
        medicine: medicineName,
        type: 'OUT_OF_STOCK',
        severity: 'error',
        message: `${medicineName} is out of stock`
      });
    }
    // Check if insufficient quantity
    else if (requestedQty > availableStock) {
      warnings.push({
        medicine: medicineName,
        type: 'INSUFFICIENT',
        severity: 'error',
        message: `${medicineName}: Only ${availableStock} units available, but ${requestedQty} requested`
      });
    }
    // Check if low stock (below reorder level)
    else if (availableStock <= reorderLevel) {
      warnings.push({
        medicine: medicineName,
        type: 'LOW_STOCK',
        severity: 'warning',
        message: `${medicineName}: Low stock (${availableStock} units remaining)`
      });
    }
  }
  
  return warnings;
};

/**
 * Get stock color based on quantity
 * 
 * @param {number} stock - Available stock quantity
 * @param {number} reorderLevel - Reorder threshold (default: 20)
 * @returns {string} Color code
 */
export const getStockColor = (stock, reorderLevel = 20) => {
  if (stock === 0) return '#E53E3E'; // Red - Out of stock
  if (stock <= reorderLevel) return '#ED8936'; // Orange - Low stock
  return '#38A169'; // Green - In stock
};

/**
 * Get stock status text
 * 
 * @param {number} stock - Available stock quantity
 * @param {number} reorderLevel - Reorder threshold (default: 20)
 * @returns {string} Status text
 */
export const getStockStatus = (stock, reorderLevel = 20) => {
  if (stock === 0) return 'Out of Stock';
  if (stock <= reorderLevel) return 'Low Stock';
  return 'In Stock';
};

export default {
  fetchMedicines,
  getMedicineStock,
  checkStockWarnings,
  getStockColor,
  getStockStatus,
};

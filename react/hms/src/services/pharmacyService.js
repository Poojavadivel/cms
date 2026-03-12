/**
 * Pharmacy Service
 * Handles all API calls related to pharmacy inventory management
 */

import axios from 'axios';
import logger from './loggerService';

const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
};

const api = axios.create({
  baseURL: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? (process.env.REACT_APP_API_URL || 'http://localhost:5000/api')
    : 'https://hms-dev.onrender.com/api',
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

const PharmacyEndpoints = {
  getAll: `/pharmacy/medicines`,
  getById: (id) => `/pharmacy/medicines/${id}`,
  create: `/pharmacy/medicines`,
  update: (id) => `/pharmacy/medicines/${id}`,
  delete: (id) => `/pharmacy/medicines/${id}`,
  downloadReport: (id) => `/pharmacy/medicines/${id}/report`,
  lowStock: `/pharmacy/medicines/low-stock`,
  getBatches: `/pharmacy/batches`,
  getBatchById: (id) => `/pharmacy/batches/${id}`,
  createBatch: `/pharmacy/batches`,
  updateBatch: (id) => `/pharmacy/batches/${id}`,
  deleteBatch: (id) => `/pharmacy/batches/${id}`,
  createPrescriptionFromIntake: `/pharmacy/prescriptions/create-from-intake`,
  getPrescriptions: `/pharmacy/prescriptions`,
  dispensePrescription: (id) => `/pharmacy/prescriptions/${id}/dispense`,
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

/**
 * Create prescription from intake form
 * This creates a prescription and automatically reduces stock
 * @param {Object} prescriptionData - Prescription data from intake
 * @returns {Promise} Prescription with stock reduction info
 */
const createPrescriptionFromIntake = async (prescriptionData) => {
  try {
    logger.apiRequest('POST', PharmacyEndpoints.createPrescriptionFromIntake, prescriptionData);

    const response = await api.post(PharmacyEndpoints.createPrescriptionFromIntake, prescriptionData);

    logger.apiResponse('POST', PharmacyEndpoints.createPrescriptionFromIntake, response.status, response.data);

    // Log prescription creation details
    const { total, stockReductions } = response.data;
    console.log('✅ Prescription created! Total: ₹' + (total || 0));
    console.log('📦 Stock reduced from ' + (stockReductions?.length || 0) + ' batch(es)');

    return response.data;
  } catch (error) {
    logger.apiError('POST', PharmacyEndpoints.createPrescriptionFromIntake, error);
    console.error('⚠️ Warning: Failed to create prescription:', error);
    throw new Error(error.response?.data?.message || 'Failed to create prescription');
  }
};

/**
 * Check stock availability for pharmacy items
 * @param {Array} pharmacyItems - Array of pharmacy items with medicineId and quantity
 * @returns {Promise<Object>} Stock check results with warnings
 */
const checkStockAvailability = async (pharmacyItems) => {
  try {
    const warnings = [];
    const stockChecks = await Promise.all(
      pharmacyItems.map(async (item) => {
        if (!item.medicineId) return null;

        try {
          const medicine = await fetchMedicineById(item.medicineId);
          const requestedQty = parseInt(item.quantity || 1);
          const availableQty = medicine.quantity || medicine.stock || 0;

          if (availableQty === 0) {
            warnings.push({
              medicine: item.Medicine,
              type: 'OUT_OF_STOCK',
              message: `${item.Medicine} is out of stock`,
              available: 0,
              requested: requestedQty
            });
          } else if (availableQty < requestedQty) {
            warnings.push({
              medicine: item.Medicine,
              type: 'LOW_STOCK',
              message: `${item.Medicine} has only ${availableQty} units available (requested: ${requestedQty})`,
              available: availableQty,
              requested: requestedQty
            });
          }

          return {
            medicineId: item.medicineId,
            medicineName: item.Medicine,
            available: availableQty,
            requested: requestedQty,
            sufficient: availableQty >= requestedQty
          };
        } catch (err) {
          console.error('Error checking stock for:', item.Medicine, err);
          return null;
        }
      })
    );

    return {
      hasWarnings: warnings.length > 0,
      warnings,
      stockChecks: stockChecks.filter(Boolean)
    };
  } catch (error) {
    console.error('Error checking stock availability:', error);
    return {
      hasWarnings: false,
      warnings: [],
      stockChecks: []
    };
  }
};

/**
 * Fetch all batches
 */
const fetchBatches = async (params = {}) => {
  try {
    const { page = 0, limit = 100 } = params;
    const url = `${PharmacyEndpoints.getBatches}?page=${page}&limit=${limit}`;

    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);

    let batchesData;
    if (Array.isArray(response.data)) {
      batchesData = response.data;
    } else if (response.data?.batches) {
      batchesData = response.data.batches;
    } else if (response.data?.data) {
      batchesData = response.data.data;
    } else {
      batchesData = [];
    }

    return batchesData;
  } catch (error) {
    logger.apiError('GET', PharmacyEndpoints.getBatches, error);
    console.error('Failed to fetch batches from API:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch batches');
  }
};

/**
 * Create new batch
 */
const createBatch = async (batchData) => {
  try {
    logger.apiRequest('POST', PharmacyEndpoints.createBatch, batchData);
    const response = await api.post(PharmacyEndpoints.createBatch, batchData);
    logger.apiResponse('POST', PharmacyEndpoints.createBatch, response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('POST', PharmacyEndpoints.createBatch, error);
    throw new Error(error.response?.data?.message || 'Failed to create batch');
  }
};

/**
 * Update batch
 */
const updateBatch = async (id, batchData) => {
  try {
    logger.apiRequest('PUT', PharmacyEndpoints.updateBatch(id), batchData);
    const response = await api.put(PharmacyEndpoints.updateBatch(id), batchData);
    logger.apiResponse('PUT', PharmacyEndpoints.updateBatch(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('PUT', PharmacyEndpoints.updateBatch(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update batch');
  }
};

/**
 * Delete batch
 */
const deleteBatch = async (id) => {
  try {
    logger.apiRequest('DELETE', PharmacyEndpoints.deleteBatch(id));
    const response = await api.delete(PharmacyEndpoints.deleteBatch(id));
    logger.apiResponse('DELETE', PharmacyEndpoints.deleteBatch(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('DELETE', PharmacyEndpoints.deleteBatch(id), error);
    throw new Error(error.response?.data?.message || 'Failed to delete batch');
  }
};

const pharmacyService = {
  fetchMedicines,
  fetchMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  downloadMedicineReport,
  fetchBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  createPrescriptionFromIntake,
  checkStockAvailability,
};

export default pharmacyService;

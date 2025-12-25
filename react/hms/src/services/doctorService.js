/**
 * Doctor Service
 * Handles all doctor-related API operations
 * Matches Flutter's AuthService.fetchAllDoctors() functionality
 */

import axios from 'axios';
import { DoctorEndpoints } from './apiConstants';
import logger from './loggerService';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
};

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Cache for doctors list (optional, for performance)
let doctorsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all doctors from the API
 * @param {boolean} forceRefresh - Force refresh even if cache exists
 * @returns {Promise<Array>} Array of doctor objects
 */
export const fetchAllDoctors = async (forceRefresh = false) => {
  try {
    // Check cache first (optional)
    if (!forceRefresh && doctorsCache && cacheTimestamp) {
      const now = Date.now();
      if (now - cacheTimestamp < CACHE_DURATION) {
        logger.info('Returning cached doctors list');
        return doctorsCache;
      }
    }

    logger.apiRequest('GET', '/doctors');
    const response = await api.get(DoctorEndpoints.getAll);
    logger.apiResponse('GET', '/doctors', response.status, response.data);

    // Handle different response formats (Flutter compatibility)
    // Accept either: [{...}, {...}] OR { "doctors": [{...}, {...}] }
    let doctors;
    if (Array.isArray(response.data)) {
      doctors = response.data;
    } else if (response.data?.doctors) {
      doctors = response.data.doctors;
    } else if (response.data?.data) {
      doctors = response.data.data;
    } else {
      throw new Error('Unexpected response format from /api/doctors');
    }

    // Map to ensure consistent format
    const mappedDoctors = doctors.map(doctor => ({
      id: doctor._id || doctor.id,
      name: doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
      firstName: doctor.firstName || doctor.name?.split(' ')[0] || '',
      lastName: doctor.lastName || doctor.name?.split(' ')[1] || '',
      specialization: doctor.specialization || doctor.specialty || 'General Medicine',
      email: doctor.email || '',
      phone: doctor.phone || '',
      qualification: doctor.qualification || '',
      experience: doctor.experience || 0,
      consultationFee: doctor.consultationFee || 0,
      availability: doctor.availability || [],
      photo: doctor.photo || null,
      status: doctor.status || 'active',
    }));

    // Update cache
    doctorsCache = mappedDoctors;
    cacheTimestamp = Date.now();

    logger.info(`✅ Successfully fetched ${mappedDoctors.length} doctors`);
    return mappedDoctors;

  } catch (error) {
    logger.error('❌ Failed to fetch doctors:', error);
    
    // If network error or server error, return cached data if available
    if (doctorsCache && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
      logger.warn('⚠️ Using stale cached doctors due to network/server error');
      return doctorsCache;
    }
    
    throw error;
  }
};

/**
 * Fetch a single doctor by ID
 * @param {string} doctorId - Doctor's ID
 * @returns {Promise<Object>} Doctor object
 */
export const getDoctorById = async (doctorId) => {
  try {
    logger.apiRequest('GET', `/doctors/${doctorId}`);
    const response = await api.get(DoctorEndpoints.getById(doctorId));
    logger.apiResponse('GET', `/doctors/${doctorId}`, response.status, response.data);
    
    return response.data?.doctor || response.data;
  } catch (error) {
    logger.error(`❌ Failed to fetch doctor ${doctorId}:`, error);
    throw error;
  }
};

/**
 * Get doctor's schedule
 * @param {string} doctorId - Doctor's ID
 * @returns {Promise<Object>} Schedule object
 */
export const getDoctorSchedule = async (doctorId) => {
  try {
    logger.apiRequest('GET', `/doctors/${doctorId}/schedule`);
    const response = await api.get(DoctorEndpoints.getSchedule(doctorId));
    logger.apiResponse('GET', `/doctors/${doctorId}/schedule`, response.status, response.data);
    
    return response.data?.schedule || response.data;
  } catch (error) {
    logger.error(`❌ Failed to fetch schedule for doctor ${doctorId}:`, error);
    throw error;
  }
};

/**
 * Clear doctors cache
 * Call this when doctors are added/updated/deleted
 */
export const clearDoctorsCache = () => {
  doctorsCache = null;
  cacheTimestamp = null;
  logger.info('🗑️ Doctors cache cleared');
};

/**
 * Create a new doctor
 * @param {Object} doctorData - Doctor data
 * @returns {Promise<Object>} Created doctor object
 */
export const createDoctor = async (doctorData) => {
  try {
    logger.apiRequest('POST', '/doctors', doctorData);
    const response = await api.post(DoctorEndpoints.create, doctorData);
    logger.apiResponse('POST', '/doctors', response.status, response.data);
    
    // Clear cache after creating
    clearDoctorsCache();
    
    return response.data?.doctor || response.data;
  } catch (error) {
    logger.error('❌ Failed to create doctor:', error);
    throw error;
  }
};

/**
 * Update a doctor
 * @param {string} doctorId - Doctor's ID
 * @param {Object} doctorData - Updated doctor data
 * @returns {Promise<Object>} Updated doctor object
 */
export const updateDoctor = async (doctorId, doctorData) => {
  try {
    logger.apiRequest('PUT', `/doctors/${doctorId}`, doctorData);
    const response = await api.put(DoctorEndpoints.update(doctorId), doctorData);
    logger.apiResponse('PUT', `/doctors/${doctorId}`, response.status, response.data);
    
    // Clear cache after updating
    clearDoctorsCache();
    
    return response.data?.doctor || response.data;
  } catch (error) {
    logger.error(`❌ Failed to update doctor ${doctorId}:`, error);
    throw error;
  }
};

/**
 * Delete a doctor
 * @param {string} doctorId - Doctor's ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteDoctor = async (doctorId) => {
  try {
    logger.apiRequest('DELETE', `/doctors/${doctorId}`);
    const response = await api.delete(DoctorEndpoints.delete(doctorId));
    logger.apiResponse('DELETE', `/doctors/${doctorId}`, response.status, response.data);
    
    // Clear cache after deleting
    clearDoctorsCache();
    
    return response.data;
  } catch (error) {
    logger.error(`❌ Failed to delete doctor ${doctorId}:`, error);
    throw error;
  }
};

// Default export
const doctorService = {
  fetchAllDoctors,
  getDoctorById,
  getDoctorSchedule,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  clearDoctorsCache,
};

export default doctorService;

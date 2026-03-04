/**
 * Services Service
 * Handles API calls for hospital services/items
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

const API_BASE = '/services';

/**
 * Fetch all services with optional filters
 */
const fetchServices = async (params = {}) => {
  try {
    const { category = '', isActive = true, search = '' } = params;

    let url = API_BASE;
    const queryParams = [];
    
    if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
    if (isActive !== undefined) queryParams.push(`isActive=${isActive}`);
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('GET', API_BASE, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch services');
  }
};

/**
 * Fetch service categories
 */
const fetchCategories = async () => {
  try {
    const url = `${API_BASE}/categories`;
    
    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);

    return response.data.categories;
  } catch (error) {
    logger.apiError('GET', `${API_BASE}/categories`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch categories');
  }
};

/**
 * Fetch service by ID
 */
const fetchServiceById = async (id) => {
  try {
    const url = `${API_BASE}/${id}`;
    
    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);

    return response.data.service;
  } catch (error) {
    logger.apiError('GET', `${API_BASE}/${id}`, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch service');
  }
};

/**
 * Create new service
 */
const createService = async (serviceData) => {
  try {
    logger.apiRequest('POST', API_BASE, serviceData);
    const response = await api.post(API_BASE, serviceData);
    logger.apiResponse('POST', API_BASE, response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('POST', API_BASE, error);
    throw new Error(error.response?.data?.message || 'Failed to create service');
  }
};

/**
 * Update service
 */
const updateService = async (id, serviceData) => {
  try {
    const url = `${API_BASE}/${id}`;
    
    logger.apiRequest('PUT', url, serviceData);
    const response = await api.put(url, serviceData);
    logger.apiResponse('PUT', url, response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('PUT', `${API_BASE}/${id}`, error);
    throw new Error(error.response?.data?.message || 'Failed to update service');
  }
};

/**
 * Delete (deactivate) service
 */
const deleteService = async (id) => {
  try {
    const url = `${API_BASE}/${id}`;
    
    logger.apiRequest('DELETE', url);
    const response = await api.delete(url);
    logger.apiResponse('DELETE', url, response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('DELETE', `${API_BASE}/${id}`, error);
    throw new Error(error.response?.data?.message || 'Failed to delete service');
  }
};

/**
 * Seed initial services (one-time setup)
 */
const seedServices = async () => {
  try {
    const url = `${API_BASE}/seed/initial`;
    
    logger.apiRequest('POST', url);
    const response = await api.post(url);
    logger.apiResponse('POST', url, response.status, response.data);

    return response.data;
  } catch (error) {
    logger.apiError('POST', `${API_BASE}/seed/initial`, error);
    throw new Error(error.response?.data?.message || 'Failed to seed services');
  }
};

const servicesService = {
  fetchServices,
  fetchCategories,
  fetchServiceById,
  createService,
  updateService,
  deleteService,
  seedServices
};

export default servicesService;

/**
 * medicinesService.js
 * Medicines API Service - Port from web medicinesService.js
 * 
 * Provides specialized medicine search and stock checking
 */

import authService from './authService';
import { PharmacyEndpoints } from './apiConstants';

/**
 * Search medicines by query
 */
export const searchMedicines = async (query = '', limit = 50) => {
    try {
        const params = new URLSearchParams();
        if (query) {
            params.append('search', query);
            params.append('q', query);
        }
        params.append('limit', limit);

        const url = `${PharmacyEndpoints.getMedicines}?${params.toString()}`;
        const response = await authService.get(url);

        let medicines = response.medicines || response.data || (Array.isArray(response) ? response : []);
        return medicines;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch medicines');
    }
};

/**
 * Fetch all medicines
 */
export const fetchMedicines = async (options = {}) => {
    try {
        const { page = 0, limit = 100, q = '' } = options;
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (q) params.append('q', q);

        const url = `${PharmacyEndpoints.getMedicines}?${params.toString()}`;
        const response = await authService.get(url);

        let medicines = response.medicines || response.data || (Array.isArray(response) ? response : []);
        return medicines;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch medicines');
    }
};

/**
 * Fetch medicine by ID
 */
export const fetchMedicineById = async (id) => {
    try {
        const response = await authService.get(PharmacyEndpoints.getMedicineById(id));
        return response.medicine || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch medicine');
    }
};

const medicinesService = {
    searchMedicines,
    fetchMedicines,
    fetchMedicineById,
};

export default medicinesService;

/**
 * pharmacyService.js
 * Pharmacy API Service - Port from web pharmacyService.js
 * 
 * Provides inventory management and prescription dispensing
 */

import authService from './authService';
import { PharmacyEndpoints } from './apiConstants';

/**
 * Fetch all medicines
 */
export const fetchMedicines = async (params = {}) => {
    try {
        const { page = 0, limit = 100, q = '', status = '' } = params;
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (q) queryParams.append('q', q);
        if (status) queryParams.append('status', status);

        const url = `${PharmacyEndpoints.getMedicines}?${queryParams.toString()}`;
        const response = await authService.get(url);

        let medicinesData = response.medicines || response.data || (Array.isArray(response) ? response : []);

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
        }));
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

/**
 * Create new medicine
 */
export const createMedicine = async (medicineData) => {
    try {
        const response = await authService.post(PharmacyEndpoints.createMedicine, medicineData);
        return response.medicine || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to create medicine');
    }
};

/**
 * Update medicine
 */
export const updateMedicine = async (id, medicineData) => {
    try {
        const response = await authService.put(PharmacyEndpoints.updateMedicine(id), medicineData);
        return response.medicine || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to update medicine');
    }
};

/**
 * Delete medicine
 */
export const deleteMedicine = async (id) => {
    try {
        await authService.delete(PharmacyEndpoints.deleteMedicine(id));
        return true;
    } catch (error) {
        throw new Error(error.message || 'Failed to delete medicine');
    }
};

/**
 * Create prescription from intake
 */
export const createPrescriptionFromIntake = async (prescriptionData) => {
    try {
        const response = await authService.post(PharmacyEndpoints.createPrescriptionFromIntake, prescriptionData);
        return response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to create prescription');
    }
};

/**
 * Fetch pharmacy dashboard data
 */
export const fetchDashboardData = async () => {
    try {
        const response = await authService.get(PharmacyEndpoints.getDashboard);
        return response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch pharmacy dashboard');
    }
};

/**
 * Fetch all prescriptions
 */
export const fetchPrescriptions = async () => {
    try {
        const response = await authService.get(PharmacyEndpoints.getPrescriptions);
        return response.prescriptions || response.data || (Array.isArray(response) ? response : []);
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch prescriptions');
    }
};

const pharmacyService = {
    fetchMedicines,
    fetchMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    createPrescriptionFromIntake,
    fetchDashboardData,
    fetchPrescriptions,
    dispensePrescription: async (id, data) => {
        try {
            // Data should include items: [{medicineId, quantity, unitPrice, ...}]
            const response = await authService.post(PharmacyEndpoints.dispensePrescription(id), data);
            return response.data || response;
        } catch (error) {
            throw new Error(error.message || 'Failed to dispense prescription');
        }
    },
    /**
     * Fetch pending prescriptions (Intakes with pharmacy items)
     */
    fetchPendingPrescriptions: async (params = {}) => {
        try {
            const { status = 'pending', page = 0, limit = 50 } = params;
            const url = `${PharmacyEndpoints.getPrescriptions}?status=${status}&page=${page}&limit=${limit}`;
            const response = await authService.get(url);
            return response.prescriptions || response.data || (Array.isArray(response) ? response : []);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch pending prescriptions');
        }
    }
};

export default pharmacyService;

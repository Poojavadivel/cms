/**
 * staffService.js
 * Staff API Service - Port from web staffService.js
 * 
 * Provides CRUD operations for staff with real API integration
 */

import authService from './authService';
import { StaffEndpoints } from './apiConstants';
import { Staff } from '../models/Staff';

/**
 * Fetch all staff members
 */
export const fetchStaffs = async () => {
    try {
        const response = await authService.get(StaffEndpoints.getAll);

        let rawStaff = [];
        if (Array.isArray(response)) {
            rawStaff = response;
        } else if (response.staff) {
            rawStaff = response.staff;
        } else if (response.data) {
            rawStaff = response.data;
        }

        return rawStaff.map(s => Staff.fromJSON(s));
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch staff');
    }
};

/**
 * Fetch single staff by ID
 */
export const fetchStaffById = async (id) => {
    try {
        const response = await authService.get(StaffEndpoints.getById(id));
        const data = response.staff || response.data || response;
        return Staff.fromJSON(data);
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch staff member');
    }
};

/**
 * Create new staff member
 */
export const createStaff = async (staffData) => {
    try {
        const response = await authService.post(StaffEndpoints.create, staffData);
        return Staff.fromJSON(response.staff || response.data || response);
    } catch (error) {
        throw new Error(error.message || 'Failed to create staff member');
    }
};

/**
 * Update staff member
 */
export const updateStaff = async (id, staffData) => {
    try {
        const response = await authService.put(StaffEndpoints.update(id), staffData);
        return response.success || !!(response.staff || response.data);
    } catch (error) {
        throw new Error(error.message || 'Failed to update staff member');
    }
};

/**
 * Delete staff member
 */
export const deleteStaff = async (id) => {
    try {
        await authService.delete(StaffEndpoints.delete(id));
        return true;
    } catch (error) {
        throw new Error(error.message || 'Failed to delete staff member');
    }
};

/**
 * Search staff members
 */
export const searchStaff = async (query) => {
    try {
        const url = `${StaffEndpoints.search}?q=${encodeURIComponent(query)}`;
        const response = await authService.get(url);
        const data = response.staff || response.data || response || [];
        return data.map(s => Staff.fromJSON(s));
    } catch (error) {
        throw new Error(error.message || 'Failed to search staff');
    }
};

const staffService = {
    fetchStaffs,
    fetchStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    searchStaff,
};

export default staffService;

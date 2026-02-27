/**
 * doctorService.js
 * Doctor API Service - Port from web doctorService.js
 * 
 * Handles all doctor-related API operations
 */

import authService from './authService';
import { DoctorEndpoints, AuthEndpoints } from './apiConstants';

/**
 * Fetch all doctors
 */
export const fetchAllDoctors = async () => {
    try {
        const response = await authService.get(DoctorEndpoints.getAll);

        let doctors = response.doctors || response.data || (Array.isArray(response) ? response : []);

        return doctors.map(doctor => ({
            id: doctor._id || doctor.id,
            name: doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
            firstName: doctor.firstName || '',
            lastName: doctor.lastName || '',
            specialization: doctor.specialization || 'General Medicine',
            email: doctor.email || '',
            phone: doctor.phone || '',
            qualification: doctor.qualification || '',
            experience: doctor.experience || 0,
            status: doctor.status || 'active',
        }));
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch doctors');
    }
};

/**
 * Fetch doctor by ID
 */
export const fetchDoctorById = async (id) => {
    try {
        const response = await authService.get(DoctorEndpoints.getById(id));
        return response.doctor || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch doctor details');
    }
};

/**
 * Fetch doctor schedule
 */
export const fetchDoctorSchedule = async (id) => {
    try {
        const response = await authService.get(DoctorEndpoints.getSchedule(id));
        return response.schedule || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch doctor schedule');
    }
};

/**
 * Fetch doctor dashboard data
 */
export const fetchDashboardData = async () => {
    try {
        const response = await authService.get(DoctorEndpoints.getDashboard);
        return response.data || response.stats || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch doctor dashboard');
    }
};

/**
 * Fetch doctor's assigned patients
 */
export const fetchMyPatients = async () => {
    try {
        const response = await authService.get(DoctorEndpoints.getMyPatients);
        return response.patients || response.data || (Array.isArray(response) ? response : []);
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch doctor patients');
    }
};

/**
 * Fetch current doctor's schedule
 */
export const fetchMySchedule = async (dateStr = null) => {
    try {
        const user = await authService.getUser();
        const doctorId = user?.id || user?._id;
        if (!doctorId) throw new Error('Doctor ID not found in session');

        const date = dateStr || new Date().toISOString().split('T')[0];
        const url = `${DoctorEndpoints.getSchedule(doctorId)}?date=${date}`;

        const response = await authService.get(url);
        return response.schedule || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch doctor schedule');
    }
};

/**
 * Create a new doctor (Admin only)
 * Creates a User account with role 'doctor'
 */
export const createDoctor = async (doctorData) => {
    try {
        const payload = {
            ...doctorData,
            role: 'doctor',
            // Backend expects metadata for specialization, dept etc.
            metadata: {
                specialization: doctorData.specialization,
                department: doctorData.department || 'Medical',
                experience: doctorData.experience,
                qualification: doctorData.qualification,
            }
        };
        const response = await authService.post(AuthEndpoints.createUser, payload);
        return response.user || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to create doctor');
    }
};

const doctorService = {
    fetchAllDoctors,
    fetchDoctorById,
    fetchDoctorSchedule,
    fetchDashboardData,
    fetchMyPatients,
    fetchMySchedule,
    createDoctor,
};

export default doctorService;

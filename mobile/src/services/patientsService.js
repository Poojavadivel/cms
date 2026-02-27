/**
 * patientsService.js
 * Patients API Service - Port from web patientsService.js
 * 
 * Provides CRUD operations for patients with real API integration
 */

import authService from './authService';
import { PatientEndpoints, ReportEndpoints, DoctorEndpoints, IntakeEndpoints } from './apiConstants';
import { PatientDetails } from '../models/Patients';

/**
 * Fetch all patients
 * @param {Object} options - Query options
 */
export const fetchPatients = async (options = {}) => {
    try {
        const { page = 0, limit = 50, q = '', status = '' } = options;
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (q) params.append('q', q);
        if (status) params.append('status', status);

        const url = `${PatientEndpoints.getAll}?${params.toString()}`;
        const response = await authService.get(url);

        let rawPatients = [];
        if (Array.isArray(response)) {
            rawPatients = response;
        } else if (response.patients) {
            rawPatients = response.patients;
        } else if (response.data) {
            rawPatients = response.data;
        }

        return rawPatients.map(p => PatientDetails.fromJSON(p));
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch patients');
    }
};

/**
 * Fetch patients for the logged-in doctor
 */
export const fetchMyPatients = async () => {
    try {
        const response = await authService.get(DoctorEndpoints.getMyPatients);

        let rawPatients = [];
        if (response && response.patients) {
            rawPatients = response.patients;
        } else if (Array.isArray(response)) {
            rawPatients = response;
        }

        return rawPatients.map(p => PatientDetails.fromJSON(p));
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch your patients');
    }
};

/**
 * Fetch patient by ID
 */
export const fetchPatientById = async (id) => {
    try {
        const response = await authService.get(PatientEndpoints.getById(id));
        const rawPatient = response.patient || response.data || response;
        return PatientDetails.fromJSON(rawPatient);
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch patient');
    }
};

/**
 * Create new patient
 */
export const createPatient = async (patientData) => {
    try {
        const response = await authService.post(PatientEndpoints.create, patientData);
        return response.patient || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to create patient');
    }
};

/**
 * Update existing patient
 */
export const updatePatient = async (id, patientData) => {
    try {
        const response = await authService.put(PatientEndpoints.update(id), patientData);
        return response.patient || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to update patient');
    }
};

/**
 * Delete patient
 */
export const deletePatient = async (id) => {
    try {
        await authService.delete(PatientEndpoints.delete(id));
        return true;
    } catch (error) {
        throw new Error(error.message || 'Failed to delete patient');
    }
};

/**
 * Fetch patient appointments
 */
export const fetchPatientAppointments = async (patientId) => {
    try {
        const url = `/appointments?patientId=${patientId}`;
        const response = await authService.get(url);
        return response.appointments || response.data || response || [];
    } catch (error) {
        console.error('Failed to fetch appointments:', error);
        return [];
    }
};

/**
 * Submit patient intake form
 */
export const saveIntake = async (patientId, intakeData) => {
    try {
        return await authService.post(IntakeEndpoints.create(patientId), intakeData);
    } catch (error) {
        throw new Error(error.message || 'Failed to save intake form');
    }
};

/**
 * Fetch intakes for a patient
 */
export const fetchIntakes = async (patientId, options = {}) => {
    try {
        const params = new URLSearchParams(options).toString();
        const url = `${IntakeEndpoints.get(patientId)}?${params}`;
        const response = await authService.get(url);
        return response.intakes || [];
    } catch (error) {
        console.error('Failed to fetch intakes:', error);
        return [];
    }
};

const patientsService = {
    fetchPatients,
    fetchMyPatients,
    fetchPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    fetchPatientAppointments,
    saveIntake,
    fetchIntakes,
};

export default patientsService;

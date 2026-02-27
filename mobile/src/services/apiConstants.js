/**
 * apiConstants.js
 * API endpoint constants - Direct port from web apiConstants.js
 * Auto-detects local development vs production
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const ENV = 'development';

// Automatically detect host IP for physical devices using Expo
const getHostUrl = () => {
    if (ENV !== 'development') return 'https://hms-dev.onrender.com';

    const hostUri = Constants.expoConfig?.hostUri;
    if (!hostUri) return 'localhost';

    // Extract IP from hostUri (e.g., 192.168.1.5:8081 -> 192.168.1.5)
    return hostUri.split(':')[0];
};

const HOST = getHostUrl();
const API_BASE_URL = ENV === 'development'
    ? `http://${HOST}:5000/api`
    : 'https://hms-dev-2.onrender.com/api';

/**
 * Auth endpoints
 */
export const AuthEndpoints = {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/signout`,
    changePassword: `${API_BASE_URL}/auth/change-password`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/auth/reset-password`,
    validateToken: `${API_BASE_URL}/auth/validate-token`,
    getProfile: `${API_BASE_URL}/users/profile`,
    updateProfile: `${API_BASE_URL}/users/profile`,
    uploadAvatar: `${API_BASE_URL}/users/avatar`,
    createUser: `${API_BASE_URL}/auth/create-user`,
};

/**
 * Patient endpoints
 */
export const PatientEndpoints = {
    getAll: `${API_BASE_URL}/patients`,
    getById: (id) => `${API_BASE_URL}/patients/${id}`,
    create: `${API_BASE_URL}/patients`,
    update: (id) => `${API_BASE_URL}/patients/${id}`,
    delete: (id) => `${API_BASE_URL}/patients/${id}`,
    search: `${API_BASE_URL}/patients/search`,
    getDoctorPatients: `${API_BASE_URL}/patients/doctor`,
    getVitals: (id) => `${API_BASE_URL}/patients/${id}/vitals`,
    addVitals: (id) => `${API_BASE_URL}/patients/${id}/vitals`,
};

/**
 * Appointment endpoints
 */
export const AppointmentEndpoints = {
    getAll: `${API_BASE_URL}/appointments`,
    getById: (id) => `${API_BASE_URL}/appointments/${id}`,
    create: `${API_BASE_URL}/appointments`,
    update: (id) => `${API_BASE_URL}/appointments/${id}`,
    delete: (id) => `${API_BASE_URL}/appointments/${id}`,
    getDoctorAppointments: `${API_BASE_URL}/appointments`,
    getPatientAppointments: (patientId) => `${API_BASE_URL}/appointments/patient/${patientId}`,
    updateStatus: (id) => `${API_BASE_URL}/appointments/${id}/status`,
    getToday: `${API_BASE_URL}/appointments/today`,
    getUpcoming: `${API_BASE_URL}/appointments/upcoming`,
};

/**
 * Intake endpoints
 */
export const IntakeEndpoints = {
    create: (patientId) => `${API_BASE_URL}/intake/${patientId}`,
    get: (patientId) => `${API_BASE_URL}/intake/${patientId}`,
};

/**
 * Doctor endpoints
 */
export const DoctorEndpoints = {
    getAll: `${API_BASE_URL}/doctors`,
    getById: (id) => `${API_BASE_URL}/doctors/${id}`,
    create: `${API_BASE_URL}/doctors`,
    update: (id) => `${API_BASE_URL}/doctors/${id}`,
    delete: (id) => `${API_BASE_URL}/doctors/${id}`,
    getSchedule: (id) => `${API_BASE_URL}/appointments/doctor/${id}/schedule`,
    getDashboard: `${API_BASE_URL}/doctors/dashboard`,
    getMyPatients: `${API_BASE_URL}/doctors/patients/my`,
};

/**
 * Staff endpoints
 */
export const StaffEndpoints = {
    getAll: `${API_BASE_URL}/staff`,
    getById: (id) => `${API_BASE_URL}/staff/${id}`,
    create: `${API_BASE_URL}/staff`,
    update: (id) => `${API_BASE_URL}/staff/${id}`,
    delete: (id) => `${API_BASE_URL}/staff/${id}`,
    search: `${API_BASE_URL}/staff`,
};

/**
 * Pharmacy endpoints
 */
export const PharmacyEndpoints = {
    getMedicines: `${API_BASE_URL}/pharmacy/medicines`,
    getMedicineById: (id) => `${API_BASE_URL}/pharmacy/medicines/${id}`,
    createMedicine: `${API_BASE_URL}/pharmacy/medicines`,
    updateMedicine: (id) => `${API_BASE_URL}/pharmacy/medicines/${id}`,
    deleteMedicine: (id) => `${API_BASE_URL}/pharmacy/medicines/${id}`,
    getPrescriptions: `${API_BASE_URL}/pharmacy/prescriptions`,
    createPrescription: `${API_BASE_URL}/pharmacy/prescriptions`,
    updatePrescription: (id) => `${API_BASE_URL}/pharmacy/prescriptions/${id}`,
    deletePrescription: (id) => `${API_BASE_URL}/pharmacy/prescriptions/${id}`,
    getDashboard: `${API_BASE_URL}/pharmacy/dashboard`,
    dispensePrescription: (intakeId) => `${API_BASE_URL}/pharmacy/prescriptions/${intakeId}/dispense`,
};

/**
 * Pathology endpoints
 */
export const PathologyEndpoints = {
    getTests: `${API_BASE_URL}/pathology/tests`,
    getTestById: (id) => `${API_BASE_URL}/pathology/tests/${id}`,
    createTest: `${API_BASE_URL}/pathology/tests`,
    updateTest: (id) => `${API_BASE_URL}/pathology/tests/${id}`,
    deleteTest: (id) => `${API_BASE_URL}/pathology/tests/${id}`,
    getReports: `${API_BASE_URL}/pathology/reports`,
    getReportById: (id) => `${API_BASE_URL}/pathology/reports/${id}`,
    createReport: `${API_BASE_URL}/pathology/reports`,
    updateReport: (id) => `${API_BASE_URL}/pathology/reports/${id}`,
    deleteReport: (id) => `${API_BASE_URL}/pathology/reports/${id}`,
    uploadReport: `${API_BASE_URL}/pathology/reports/upload`,
    downloadReport: (id) => `${API_BASE_URL}/pathology/reports/${id}/download`,
    getPendingTests: `${API_BASE_URL}/pathology/pending-tests`,
    getDashboard: `${API_BASE_URL}/pathology/dashboard`,
    createReportFromIntake: `${API_BASE_URL}/pathology/reports/from-intake`,
};

/**
 * Report endpoints
 */
export const ReportEndpoints = {
    getAll: `${API_BASE_URL}/reports`,
    getById: (id) => `${API_BASE_URL}/reports/${id}`,
    download: (id) => `${API_BASE_URL}/reports/${id}/download`,
    getPatientReports: (patientId) => `${API_BASE_URL}/reports/patient/${patientId}`,
};

/**
 * Payroll endpoints
 */
export const PayrollEndpoints = {
    getAll: `${API_BASE_URL}/payroll`,
    getById: (id) => `${API_BASE_URL}/payroll/${id}`,
    create: `${API_BASE_URL}/payroll`,
    update: (id) => `${API_BASE_URL}/payroll/${id}`,
};

export { API_BASE_URL };
export default API_BASE_URL;

/**
 * appointmentsService.js
 * Appointments API Service - React equivalent of Flutter's appointment methods in AuthService
 * 
 * Provides CRUD operations for appointments with real API integration
 */

import axios from 'axios';
import { AppointmentEndpoints, PatientEndpoints } from './apiConstants';
import logger from './loggerService';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Create axios instance with default config
 */
const createAxiosInstance = () => {
  const token = getAuthToken();
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
};

/**
 * Fetch all appointments
 * @returns {Promise<Array>} List of appointments
 */
export const fetchAppointments = async () => {
  try {
    logger.apiRequest('GET', AppointmentEndpoints.getAll);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(AppointmentEndpoints.getAll);
    
    logger.apiResponse('GET', AppointmentEndpoints.getAll, response.status);
    
    // Handle both array response and object with data property
    const appointments = Array.isArray(response.data) 
      ? response.data 
      : response.data.appointments || response.data.data || [];
    
    logger.success('APPOINTMENTS', `Fetched ${appointments.length} appointments`);
    return appointments;
  } catch (error) {
    logger.apiError('GET', AppointmentEndpoints.getAll, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
  }
};

/**
 * Fetch appointment by ID
 * @param {string} id - Appointment ID
 * @returns {Promise<Object>} Appointment details
 */
export const fetchAppointmentById = async (id) => {
  try {
    logger.apiRequest('GET', AppointmentEndpoints.getById(id));
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(AppointmentEndpoints.getById(id));
    
    logger.apiResponse('GET', AppointmentEndpoints.getById(id), response.status);
    
    const appointment = response.data.appointment || response.data.data || response.data;
    
    logger.success('APPOINTMENTS', `Fetched appointment ${id}`);
    return appointment;
  } catch (error) {
    logger.apiError('GET', AppointmentEndpoints.getById(id), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch appointment');
  }
};

/**
 * Create new appointment
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<Object>} Created appointment
 */
export const createAppointment = async (appointmentData) => {
  try {
    logger.apiRequest('POST', AppointmentEndpoints.create, appointmentData);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post(AppointmentEndpoints.create, appointmentData);
    
    logger.apiResponse('POST', AppointmentEndpoints.create, response.status);
    logger.success('APPOINTMENTS', 'Appointment created successfully');
    
    return response.data.appointment || response.data.data || response.data;
  } catch (error) {
    logger.apiError('POST', AppointmentEndpoints.create, error);
    throw new Error(error.response?.data?.message || 'Failed to create appointment');
  }
};

/**
 * Update existing appointment
 * @param {string} id - Appointment ID
 * @param {Object} appointmentData - Updated appointment data
 * @returns {Promise<Object>} Updated appointment
 */
export const updateAppointment = async (id, appointmentData) => {
  try {
    logger.apiRequest('PUT', AppointmentEndpoints.update(id), appointmentData);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.put(AppointmentEndpoints.update(id), appointmentData);
    
    logger.apiResponse('PUT', AppointmentEndpoints.update(id), response.status);
    logger.success('APPOINTMENTS', `Appointment ${id} updated successfully`);
    
    return response.data.appointment || response.data.data || response.data;
  } catch (error) {
    logger.apiError('PUT', AppointmentEndpoints.update(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update appointment');
  }
};

/**
 * Delete appointment
 * @param {string} id - Appointment ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAppointment = async (id) => {
  try {
    logger.apiRequest('DELETE', AppointmentEndpoints.delete(id));
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.delete(AppointmentEndpoints.delete(id));
    
    logger.apiResponse('DELETE', AppointmentEndpoints.delete(id), response.status);
    logger.success('APPOINTMENTS', `Appointment ${id} deleted successfully`);
    
    return true;
  } catch (error) {
    logger.apiError('DELETE', AppointmentEndpoints.delete(id), error);
    throw new Error(error.response?.data?.message || 'Failed to delete appointment');
  }
};

/**
 * Fetch all patients (for patient selection in appointment form)
 * @returns {Promise<Array>} List of patients
 */
export const fetchPatients = async () => {
  try {
    logger.apiRequest('GET', PatientEndpoints.getAll);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(PatientEndpoints.getAll);
    
    logger.apiResponse('GET', PatientEndpoints.getAll, response.status);
    
    const patients = Array.isArray(response.data) 
      ? response.data 
      : response.data.patients || response.data.data || [];
    
    logger.success('PATIENTS', `Fetched ${patients.length} patients`);
    return patients;
  } catch (error) {
    logger.apiError('GET', PatientEndpoints.getAll, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch patients');
  }
};

/**
 * Update appointment status
 * @param {string} id - Appointment ID
 * @param {string} status - New status (Scheduled, Completed, Cancelled, Pending)
 * @returns {Promise<Object>} Updated appointment
 */
export const updateAppointmentStatus = async (id, status) => {
  try {
    logger.apiRequest('PATCH', AppointmentEndpoints.updateStatus(id), { status });
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.patch(AppointmentEndpoints.updateStatus(id), { status });
    
    logger.apiResponse('PATCH', AppointmentEndpoints.updateStatus(id), response.status);
    logger.success('APPOINTMENTS', `Appointment ${id} status updated to ${status}`);
    
    return response.data.appointment || response.data.data || response.data;
  } catch (error) {
    logger.apiError('PATCH', AppointmentEndpoints.updateStatus(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update appointment status');
  }
};

/**
 * Get today's appointments
 * @returns {Promise<Array>} List of today's appointments
 */
export const fetchTodayAppointments = async () => {
  try {
    logger.apiRequest('GET', AppointmentEndpoints.getToday);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(AppointmentEndpoints.getToday);
    
    logger.apiResponse('GET', AppointmentEndpoints.getToday, response.status);
    
    const appointments = Array.isArray(response.data) 
      ? response.data 
      : response.data.appointments || response.data.data || [];
    
    logger.success('APPOINTMENTS', `Fetched ${appointments.length} today's appointments`);
    return appointments;
  } catch (error) {
    logger.apiError('GET', AppointmentEndpoints.getToday, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch today\'s appointments');
  }
};

/**
 * Get upcoming appointments
 * @returns {Promise<Array>} List of upcoming appointments
 */
export const fetchUpcomingAppointments = async () => {
  try {
    logger.apiRequest('GET', AppointmentEndpoints.getUpcoming);
    
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(AppointmentEndpoints.getUpcoming);
    
    logger.apiResponse('GET', AppointmentEndpoints.getUpcoming, response.status);
    
    const appointments = Array.isArray(response.data) 
      ? response.data 
      : response.data.appointments || response.data.data || [];
    
    logger.success('APPOINTMENTS', `Fetched ${appointments.length} upcoming appointments`);
    return appointments;
  } catch (error) {
    logger.apiError('GET', AppointmentEndpoints.getUpcoming, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch upcoming appointments');
  }
};

const appointmentsService = {
  fetchAppointments,
  fetchAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  fetchPatients,
  updateAppointmentStatus,
  fetchTodayAppointments,
  fetchUpcomingAppointments
};

export default appointmentsService;

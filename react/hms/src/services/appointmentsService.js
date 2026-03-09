/**
 * appointmentsService.js
 * Appointments API Service - React equivalent of Flutter's appointment methods in AuthService
 * 
 * Provides CRUD operations for appointments with real API integration
 */

import api from './apiService';
import { AppointmentEndpoints, PatientEndpoints, IntakeEndpoints, DoctorEndpoints } from './apiConstants';
import logger from './loggerService';

/**
 * Fetch all appointments
 * @returns {Promise<Array>} List of appointments
 */
export const fetchAppointments = async () => {
  try {
    logger.apiRequest('GET', AppointmentEndpoints.getAll);

    const response = await api.get(AppointmentEndpoints.getAll);

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

    const response = await api.get(AppointmentEndpoints.getById(id));

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

    const response = await api.post(AppointmentEndpoints.create, appointmentData);

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

    const response = await api.put(AppointmentEndpoints.update(id), appointmentData);

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

    const response = await api.delete(AppointmentEndpoints.delete(id));

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

    const response = await api.get(PatientEndpoints.getAll, {
      params: {
        limit: 100, // Backend max limit per page
        page: 0,
        meta: 1 // Request metadata to get total count
      }
    });

    logger.apiResponse('GET', PatientEndpoints.getAll, response.status);

    let patients = response.data.patients || response.data.data || (Array.isArray(response.data) ? response.data : []);
    const total = response.data.total || patients.length;

    logger.info('PATIENTS', `Fetched page 0: ${patients.length} of ${total} total patients`);

    // If there are more patients, fetch all remaining pages
    if (total > 100) {
      const totalPages = Math.ceil(total / 100);
      const additionalRequests = [];

      for (let page = 1; page < totalPages; page++) {
        logger.info('PATIENTS', `Fetching page ${page}...`);
        additionalRequests.push(
          api.get(PatientEndpoints.getAll, {
            params: { limit: 100, page, meta: 1 }
          })
        );
      }

      const additionalResponses = await Promise.all(additionalRequests);
      additionalResponses.forEach((res, idx) => {
        const morePatients = res.data.patients || res.data.data || (Array.isArray(res.data) ? res.data : []);
        logger.info('PATIENTS', `Fetched page ${idx + 1}: ${morePatients.length} patients`);
        patients = [...patients, ...morePatients];
      });
    }

    logger.success('PATIENTS', `Total fetched: ${patients.length} patients`);
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

    const response = await api.patch(AppointmentEndpoints.updateStatus(id), { status });

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

    const response = await api.get(AppointmentEndpoints.getToday);

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

    const response = await api.get(AppointmentEndpoints.getUpcoming);

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

/**
 * Add intake data for a patient
 * @param {Object} payload - Intake data
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Created intake
 */
export const addIntake = async (payload, patientId) => {
  try {
    if (!patientId || patientId.trim() === '') {
      throw new Error('patientId is required');
    }

    const endpoint = IntakeEndpoints.create(patientId);
    logger.apiRequest('POST', endpoint, payload);

    const response = await api.post(endpoint, payload);

    logger.apiResponse('POST', endpoint, response.status);
    logger.success('INTAKE', 'Intake data saved successfully');

    return response.data.intake || response.data.data || response.data;
  } catch (error) {
    logger.apiError('POST', IntakeEndpoints.create(patientId), error);
    throw new Error(error.response?.data?.message || 'Failed to save intake data');
  }
};

/**
 * Fetch deleted appointments
 * @returns {Promise<Array>} List of deleted appointments
 */
export const fetchDeletedAppointments = async () => {
  try {
    const endpoint = '/appointments/deleted/list';
    logger.apiRequest('GET', endpoint);

    const response = await api.get(endpoint);

    logger.apiResponse('GET', endpoint, response.status);

    const appointments = Array.isArray(response.data)
      ? response.data
      : response.data.appointments || response.data.data || [];

    logger.success('APPOINTMENTS', `Fetched ${appointments.length} deleted appointments`);
    return appointments;
  } catch (error) {
    logger.apiError('GET', '/appointments/deleted/list', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch deleted appointments');
  }
};

/**
 * Fetch all doctors
 * @returns {Promise<Array>} List of doctors
 */
export const fetchDoctors = async () => {
  try {
    logger.apiRequest('GET', DoctorEndpoints.getAll);

    const response = await api.get(DoctorEndpoints.getAll);

    logger.apiResponse('GET', DoctorEndpoints.getAll, response.status);

    const doctors = Array.isArray(response.data)
      ? response.data
      : response.data.doctors || response.data.data || [];

    const mappedDoctors = doctors.map(d => ({
      id: d.id || d._id,
      name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim(),
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      specialization: d.specialization,
      department: d.department,
      role: d.role || 'doctor'
    }));

    logger.success('DOCTORS', `Fetched ${mappedDoctors.length} doctors`);
    return mappedDoctors;
  } catch (error) {
    logger.apiError('GET', DoctorEndpoints.getAll, error);
    throw new Error(error.response?.data?.message || 'Failed to fetch doctors');
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
  fetchUpcomingAppointments,
  addIntake,
  fetchDoctors,
  fetchDeletedAppointments
};

export default appointmentsService;

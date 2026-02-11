/**
 * Availability Service
 * Service for checking doctor and patient availability
 */

import axios from 'axios';
import logger from './loggerService';

const getAuthToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('x-auth-token') ||
  localStorage.getItem('authToken');

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers['x-auth-token'] = token;
  return config;
});

/**
 * Check availability for doctor and patient
 * @param {Object} params - Availability check parameters
 * @param {string} params.doctorId - Doctor ID
 * @param {string} params.patientId - Patient ID
 * @param {string|Date} params.startAt - Start time
 * @param {string|Date} params.endAt - End time (optional)
 * @param {number} params.duration - Duration in minutes (default: 30)
 * @param {string} params.excludeAppointmentId - Appointment ID to exclude (for editing)
 * @returns {Promise<Object>} Availability result
 */
export const checkAvailability = async (params) => {
  try {
    logger.apiRequest('POST', '/appointments/check-availability', params);
    const response = await api.post('/appointments/check-availability', params);
    logger.apiResponse('POST', '/appointments/check-availability', response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('POST', '/appointments/check-availability', error);
    throw error;
  }
};

/**
 * Get doctor's schedule for a specific date
 * @param {string} doctorId - Doctor ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Doctor's schedule
 */
export const getDoctorSchedule = async (doctorId, date) => {
  try {
    logger.apiRequest('GET', `/appointments/doctor/${doctorId}/schedule?date=${date}`);
    const response = await api.get(`/appointments/doctor/${doctorId}/schedule`, {
      params: { date }
    });
    logger.apiResponse('GET', `/appointments/doctor/${doctorId}/schedule`, response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('GET', `/appointments/doctor/${doctorId}/schedule`, error);
    throw error;
  }
};

/**
 * Get available time slots for a doctor on a specific date
 * @param {string} doctorId - Doctor ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} duration - Desired appointment duration in minutes (default: 30)
 * @returns {Promise<Array>} Available time slots
 */
export const getAvailableSlots = async (doctorId, date, duration = 30) => {
  try {
    const schedule = await getDoctorSchedule(doctorId, date);

    if (!schedule.success) {
      throw new Error('Failed to get doctor schedule');
    }

    // Filter free slots that can accommodate the desired duration
    const availableSlots = schedule.schedule.freeSlots
      .filter(slot => slot.durationMinutes >= duration)
      .map(slot => ({
        ...slot,
        label: `${formatTime(slot.startAt)} - ${formatTime(slot.endAt)} (${slot.durationMinutes} min)`
      }));

    return availableSlots;
  } catch (error) {
    logger.apiError('GET', '/appointments/available-slots', error);
    throw error;
  }
};

/**
 * Format time for display
 */
const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const availabilityService = {
  checkAvailability,
  getDoctorSchedule,
  getAvailableSlots,
};

export default availabilityService;

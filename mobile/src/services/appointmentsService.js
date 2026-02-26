/**
 * appointmentsService.js
 * Appointments API Service - Port from web appointmentsService.js
 * 
 * Provides CRUD operations for appointments with real API integration
 */

import authService from './authService';
import { AppointmentEndpoints, PatientEndpoints, IntakeEndpoints, DoctorEndpoints } from './apiConstants';

/**
 * Fetch all appointments
 */
export const fetchAppointments = async () => {
    try {
        const response = await authService.get(AppointmentEndpoints.getAll);
        const rawAppointments = response.appointments || response.data || response || [];

        // Transform backend data to consistent format
        return rawAppointments.map(apt => ({
            _id: apt._id || apt.id,
            id: apt._id || apt.id,
            patientName: apt.patientName || apt.patient?.name || apt.Patient || 'Unknown Patient',
            patientId: (typeof apt.patientId === 'object' ? apt.patientId?._id || apt.patientId?.id : apt.patientId) ||
                apt.patient?._id || apt.Patient_id || (typeof apt.patient === 'string' ? apt.patient : null),
            doctorName: apt.doctorName || apt.doctor?.name || apt.Doctor || 'Unassigned',
            doctorId: (typeof apt.doctorId === 'object' ? apt.doctorId?._id || apt.doctorId?.id : apt.doctorId) ||
                apt.doctor?._id || apt.Doctor_id || (typeof apt.doctor === 'string' ? apt.doctor : null),
            date: apt.date || apt.appointmentDate || apt.scheduledDate || apt.dateTime || apt.createdAt,
            time: apt.time || apt.appointmentTime || apt.slot || apt.timeSlot || 'Not specified',
            status: apt.status || 'pending',
            reason: apt.reason || apt.visitReason || apt.purpose,
            notes: apt.notes || apt.description,
            createdAt: apt.createdAt,
            updatedAt: apt.updatedAt
        }));
    } catch (error) {
        console.error('❌ [Appointments Service] Error fetching appointments:', error);
        throw new Error(error.message || 'Failed to fetch appointments');
    }
};

/**
 * Fetch appointment by ID
 */
export const fetchAppointmentById = async (id) => {
    try {
        const response = await authService.get(AppointmentEndpoints.getById(id));
        return response.appointment || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch appointment');
    }
};

/**
 * Create new appointment
 */
export const createAppointment = async (appointmentData) => {
    try {
        const response = await authService.post(AppointmentEndpoints.create, appointmentData);
        return response.appointment || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to create appointment');
    }
};

/**
 * Update existing appointment
 */
export const updateAppointment = async (id, appointmentData) => {
    try {
        const response = await authService.put(AppointmentEndpoints.update(id), appointmentData);
        return response.appointment || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to update appointment');
    }
};

/**
 * Delete appointment
 */
export const deleteAppointment = async (id) => {
    try {
        await authService.delete(AppointmentEndpoints.delete(id));
        return true;
    } catch (error) {
        throw new Error(error.message || 'Failed to delete appointment');
    }
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (id, status) => {
    try {
        const response = await authService.patch(AppointmentEndpoints.updateStatus(id), { status });
        return response.appointment || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to update appointment status');
    }
};

/**
 * Get today's appointments
 */
export const fetchTodayAppointments = async () => {
    try {
        // Try to fetch from dedicated today endpoint first
        const response = await authService.get(AppointmentEndpoints.getToday);
        const rawAppointments = response.appointments || response.data || response || [];

        // Transform backend data to consistent format
        return rawAppointments.map(apt => ({
            _id: apt._id || apt.id,
            id: apt._id || apt.id,
            patientName: apt.patientName || apt.patient?.name || apt.Patient || 'Unknown Patient',
            patientId: apt.patientId || apt.patient?._id || apt.Patient_id,
            doctorName: apt.doctorName || apt.doctor?.name || apt.Doctor || 'Unassigned',
            doctorId: apt.doctorId || apt.doctor?._id || apt.Doctor_id,
            date: apt.date || apt.appointmentDate || apt.scheduledDate || apt.dateTime || apt.createdAt,
            time: apt.time || apt.appointmentTime || apt.slot || apt.timeSlot || 'Not specified',
            status: apt.status || 'pending',
            reason: apt.reason || apt.visitReason || apt.purpose,
            notes: apt.notes || apt.description,
            createdAt: apt.createdAt,
            updatedAt: apt.updatedAt
        }));
    } catch (error) {
        console.warn('⚠️ [Appointments Service] Today endpoint not available, using fallback filter:', error.message);

        // Fallback: Fetch all appointments and filter for today locally
        try {
            const allAppointments = await fetchAppointments();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Filter for today's appointments
            const todayAppointments = allAppointments.filter(apt => {
                if (!apt.date) return false;

                const aptDate = new Date(apt.date);
                if (isNaN(aptDate.getTime())) return false;

                // Strip time info for date comparison
                const aptDateOnly = new Date(aptDate);
                aptDateOnly.setHours(0, 0, 0, 0);

                const todayOnly = new Date();
                todayOnly.setHours(0, 0, 0, 0);

                return aptDateOnly.getTime() === todayOnly.getTime();
            });

            console.log(`✅ [Appointments Service] Filtered ${todayAppointments.length} appointments for today (${new Date().toLocaleDateString()}) from ${allAppointments.length} total`);
            return todayAppointments;
        } catch (fallbackError) {
            console.error('❌ [Appointments Service] Fallback also failed:', fallbackError);
            return []; // Return empty array instead of throwing
        }
    }
};

/**
 * Get upcoming appointments
 */
export const fetchUpcomingAppointments = async () => {
    try {
        const response = await authService.get(AppointmentEndpoints.getUpcoming);
        return response.appointments || response.data || response || [];
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch upcoming appointments');
    }
};

/**
 * Fetch all doctors
 */
export const fetchDoctors = async () => {
    try {
        const response = await authService.get(DoctorEndpoints.getAll);
        const doctors = response.doctors || response.data || response || [];

        return doctors.map(d => ({
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
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch doctors');
    }
};

/**
 * Fetch appointments for a specific doctor
 */
export const fetchDoctorAppointments = async () => {
    try {
        const response = await authService.get(AppointmentEndpoints.getDoctorAppointments);
        return response.appointments || response.data || (Array.isArray(response) ? response : []);
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch doctor appointments');
    }
};

const appointmentsService = {
    fetchAppointments,
    fetchAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    fetchTodayAppointments,
    fetchUpcomingAppointments,
    fetchDoctors,
    fetchDoctorAppointments,
};

export default appointmentsService;

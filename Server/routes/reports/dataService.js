/**
 * reports/dataService.js
 * Data fetching service for reports
 */

const { Patient, Appointment, User } = require('../../Models');
const config = require('./config');

/**
 * Fetch patient data for medical report
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Patient data with appointments and doctor
 */
async function fetchPatientReportData(patientId) {
  // Fetch patient
  const patient = await Patient.findById(patientId).lean();
  if (!patient) {
    throw new Error('Patient not found');
  }

  // Fetch appointments
  const appointments = await Appointment.find({ patientId })
    .sort({ appointmentDate: -1 })
    .limit(config.MAX_APPOINTMENTS_IN_REPORT)
    .lean();

  // Fetch doctor if assigned
  let doctor = null;
  if (patient.doctorId) {
    doctor = await User.findById(patient.doctorId).lean();
  }

  return {
    patient,
    appointments,
    doctor
  };
}

/**
 * Fetch doctor data for performance report
 * @param {string} doctorId - Doctor ID
 * @returns {Promise<Object>} Doctor data with appointments and patients
 */
async function fetchDoctorReportData(doctorId) {
  // Fetch doctor
  const doctor = await User.findById(doctorId).lean();
  if (!doctor) {
    throw new Error('Doctor not found');
  }

  if (doctor.role !== 'doctor') {
    throw new Error('User is not a doctor');
  }

  // Get current week dates
  const { getWeekDates } = require('./utils');
  const { startDate, endDate } = getWeekDates();

  // Fetch week appointments
  const weekAppointments = await Appointment.find({
    doctorId,
    startAt: { $gte: startDate, $lte: endDate }
  })
    .populate('patientId', 'firstName lastName age gender')
    .sort({ startAt: -1 })
    .lean();

  // Fetch all appointments for statistics
  const allAppointments = await Appointment.find({ doctorId })
    .select('patientId status startAt')
    .lean();

  // Get unique patient IDs
  const patientIds = [...new Set(allAppointments.map(a => 
    a.patientId?.toString() || a.patientId
  ))].filter(Boolean);

  // Fetch patients
  const patients = await Patient.find({ 
    _id: { $in: patientIds } 
  })
    .select('firstName lastName age gender')
    .lean();

  return {
    doctor,
    weekAppointments,
    allAppointments,
    patients,
    startDate,
    endDate
  };
}

module.exports = {
  fetchPatientReportData,
  fetchDoctorReportData
};

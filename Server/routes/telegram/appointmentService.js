/**
 * telegram/appointmentService.js
 * Appointment booking logic
 */

const Appointment = require('../../Models/Appointment');
const Patient = require('../../Models/Patient');
const User = require('../../Models/User');
const config = require('./config');

/**
 * Find available doctors
 * @returns {Promise<Array>} List of doctors
 */
async function findAvailableDoctors() {
  try {
    const doctors = await User.find({
      role: 'doctor',
      'metadata.availability': { $ne: 'unavailable' }
    }).select('firstName lastName metadata').lean();

    return doctors;
  } catch (error) {
    console.error('Error finding doctors:', error);
    return [];
  }
}

/**
 * Check for duplicate appointment
 * @param {string} telegramUserId - Telegram user ID
 * @param {Date} dateTime - Appointment date/time
 * @returns {Promise<boolean>} True if duplicate exists
 */
async function checkDuplicateAppointment(telegramUserId, dateTime) {
  try {
    const existing = await Appointment.findOne({
      telegramUserId: telegramUserId,
      startAt: dateTime,
      status: { $ne: 'Cancelled' }
    });

    return !!existing;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return false;
  }
}

/**
 * Create appointment
 * @param {Object} patientData - Patient and appointment data
 * @param {string} telegramUserId - Telegram user ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Result object
 */
async function createAppointment(patientData, telegramUserId, chatId) {
  try {
    // Find doctor
    const doctor = await User.findOne({ role: 'doctor' }).lean();
    if (!doctor) {
      return { success: false, error: 'No doctors available' };
    }

    // Generate patient code
    const generatePatientCode = () => {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `PAT-TG-${timestamp}-${random}`;
    };

    let patient;

    if (patientData.isExisting && patientData.patientId) {
      // Use existing patient
      patient = await Patient.findById(patientData.patientId);

      if (!patient) {
        return { success: false, error: 'Patient record not found' };
      }

      // Update telegram info if not set
      if (!patient.telegramUserId) {
        patient.telegramUserId = telegramUserId.toString();
        patient.telegramUsername = patientData.username;
        await patient.save();
      }

      console.log(`✅ Using existing patient: ${patient.firstName} ${patient.lastName}`);
    } else {
      // Create new patient
      const nameParts = patientData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';

      patient = new Patient({
        patientCode: generatePatientCode(),
        firstName,
        lastName,
        age: 0,
        gender: 'Other',
        phone: patientData.phone,
        email: `telegram_${telegramUserId}@telegram.user`,
        bloodGroup: patientData.bloodGroup || 'Unknown',
        address: {
          line1: patientData.address || 'Telegram User',
          houseNo: '',
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        emergencyContact: {
          name: patientData.emergencyContactName || '',
          phone: patientData.emergencyPhone || '',
          relationship: 'Emergency Contact'
        },
        telegramUserId: telegramUserId.toString(),
        telegramUsername: patientData.username,
        metadata: {
          source: 'telegram',
          createdViaBot: true
        }
      });
      await patient.save();
      console.log(`✅ Created new patient: ${patientData.fullName}`);
    }

    // Check for duplicates
    const isDuplicate = await checkDuplicateAppointment(
      telegramUserId.toString(),
      patientData.dateTime
    );
    if (isDuplicate) {
      return { success: false, error: 'You already have an appointment at this time' };
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentType: 'Consultation',
      startAt: patientData.dateTime,
      endAt: new Date(patientData.dateTime.getTime() + config.DEFAULT_APPOINTMENT_DURATION),
      location: 'Movi Innovations',
      status: 'Scheduled',
      notes: `Reason: ${patientData.reason}\nBooked via Telegram Bot`,
      telegramUserId: telegramUserId.toString(),
      telegramChatId: chatId.toString(),
      bookingSource: 'telegram'
    });

    await appointment.save();

    return {
      success: true,
      appointmentCode: appointment.appointmentCode,
      doctorName: `${doctor.firstName} ${doctor.lastName || ''}`.trim() || doctor.firstName || 'Doctor',
      patientName: patientData.fullName,
      dateTime: patientData.dateTime
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user appointments
 * @param {string} telegramUserId - Telegram user ID
 * @returns {Promise<Array>} List of appointments
 */
async function getUserAppointments(telegramUserId) {
  try {
    const appointments = await Appointment.find({
      telegramUserId: telegramUserId,
      status: { $ne: 'Cancelled' }
    })
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .sort({ startAt: -1 })
      .limit(5)
      .lean();

    return appointments;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

module.exports = {
  findAvailableDoctors,
  checkDuplicateAppointment,
  createAppointment,
  getUserAppointments
};

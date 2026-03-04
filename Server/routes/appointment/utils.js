/**
 * appointment/utils.js
 * Utility functions for appointment module
 */

/**
 * Extract doctor name from doctor object
 */
function extractDoctorName(docObj) {
  if (!docObj) return '';
  const first = (docObj.firstName || '').toString().trim();
  const last = (docObj.lastName || '').toString().trim();
  if (first || last) return `${first} ${last}`.trim();
  if (docObj.email) return docObj.email.toString();
  return docObj._id ? docObj._id.toString() : '';
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return 0;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age > 0 ? age : 0;
}

/**
 * Normalize appointments for response
 */
function normalizeAppointments(arr) {
  return arr.map(a => {
    const patientFirstName = a.patientId?.firstName || '';
    const patientLastName = a.patientId?.lastName || '';
    const fullName = `${patientFirstName} ${patientLastName}`.trim();
    const patientName = fullName || a.patientName || 'Unknown Patient';

    const patientAge = a.patientId?.age || calculateAge(a.patientId?.dateOfBirth) || 0;
    const patientCode = a.patientId?.patientCode || '';

    return {
      ...a,
      doctor: extractDoctorName(a.doctorId),
      patientName,
      patientFullName: fullName,
      patientAge,
      patientCode
    };
  });
}

module.exports = {
  extractDoctorName,
  calculateAge,
  normalizeAppointments
};

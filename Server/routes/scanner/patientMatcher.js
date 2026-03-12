/**
 * scanner/patientMatcher.js
 * Patient matching and creation logic for scanned documents
 */

const { Patient } = require('../../Models');
const { logh } = require('./utils');

/**
 * Match or create patient from extracted data
 * @param {Object} extractedData - Extracted data containing patient details
 * @param {string} batchId - Batch ID for logging
 * @returns {Promise<Object>} Patient object with action and matchedBy info
 */
async function matchOrCreatePatient(extractedData, batchId) {
  const patientInfo = extractedData.patient_details || {};

  // Extract patient information
  let firstName = patientInfo.firstName || patientInfo.name?.split(' ')[0] || 'Unknown';
  let lastName = patientInfo.lastName || patientInfo.name?.split(' ').slice(1).join(' ') || '';
  let phone = patientInfo.phone || '';
  let dateOfBirth = patientInfo.dateOfBirth || null;
  let gender = patientInfo.gender || '';
  let email = patientInfo.email || '';

  // Normalize phone number
  if (phone) {
    phone = phone.replace(/[^\d+]/g, '');
    if (phone.length === 10 && !phone.startsWith('+')) {
      phone = '+91' + phone;
    }
  }

  let patient = null;
  let matchedBy = null;

  // Try to match by name
  if (firstName && firstName !== 'Unknown') {
    const query = { firstName: new RegExp(`^${firstName}$`, 'i') };
    if (lastName) {
      query.lastName = new RegExp(`^${lastName}$`, 'i');
    }
    patient = await Patient.findOne(query);
    if (patient) {
      matchedBy = 'name';
      logh(batchId, `✅ Patient matched by name: ${patient._id}`);
    }
  }

  // Try to match by phone
  if (!patient && phone) {
    patient = await Patient.findOne({ phone });
    if (patient) {
      matchedBy = 'phone';
      logh(batchId, `✅ Patient matched by phone: ${patient._id}`);
    }
  }

  // Update existing patient with missing information
  if (patient) {
    let updated = false;
    if (!patient.lastName && lastName) {
      patient.lastName = lastName;
      updated = true;
    }
    if (!patient.dateOfBirth && dateOfBirth) {
      patient.dateOfBirth = dateOfBirth;
      updated = true;
    }
    if (!patient.gender && gender) {
      patient.gender = gender;
      updated = true;
    }
    if (!patient.email && email) {
      patient.email = email;
      updated = true;
    }

    if (updated) {
      await patient.save();
      logh(batchId, '✅ Patient updated with new information');
    }

    return { patient, action: 'matched', matchedBy };
  }

  // Create new patient if no match found
  try {
    const newPatient = await Patient.create({
      firstName: firstName || 'Unknown',
      lastName: lastName || '',
      phone,
      dateOfBirth,
      gender,
      email
    });

    logh(batchId, `✅ New patient created: ${newPatient._id}`);
    return { patient: newPatient, action: 'created', matchedBy: 'new' };
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      if (phone) {
        patient = await Patient.findOne({ phone });
        if (patient) {
          return { patient, action: 'matched', matchedBy: 'phone-retry' };
        }
      }
      throw new Error('Patient creation failed due to duplicate');
    }
    throw error;
  }
}

module.exports = {
  matchOrCreatePatient
};

/**
 * reports/patientReportGenerator.js
 * PDF generator for patient medical reports
 */

const pdfGen = require('../../utils/enterprisePdfGenerator');
const { formatPatientName, formatDate } = require('./utils');
const config = require('./config');

/**
 * Generate patient information section
 */
function generatePatientInfoSection(doc, patient) {
  pdfGen.addSectionHeader(doc, 'Patient Information', '', {
    color: pdfGen.colors.primary
  });

  const patientName = formatPatientName(patient);

  // Basic Information
  pdfGen.addInfoRow(doc, 'Patient ID', patient._id?.toString(), { labelWidth: 140 });
  pdfGen.addInfoRow(doc, 'Full Name', patientName, { labelWidth: 140 });
  pdfGen.addInfoRow(doc, 'First Name', patient.firstName || 'N/A', { labelWidth: 140 });
  pdfGen.addInfoRow(doc, 'Last Name', patient.lastName || 'N/A', { labelWidth: 140 });
  pdfGen.addInfoRow(doc, 'Date of Birth',
    formatDate(patient.dateOfBirth),
    { labelWidth: 140 }
  );
  pdfGen.addInfoRow(doc, 'Age', `${patient.age || 'N/A'} years`, { labelWidth: 140 });
  pdfGen.addInfoRow(doc, 'Gender', patient.gender || 'N/A', { labelWidth: 140 });
  pdfGen.addInfoRow(doc, 'Blood Group', patient.bloodGroup || 'Unknown', { labelWidth: 140 });
}

/**
 * Generate contact information section
 */
function generateContactInfoSection(doc, patient) {
  pdfGen.addSectionHeader(doc, 'Contact & Address Information', '', {
    color: pdfGen.colors.secondary,
    marginTop: 15
  });

  pdfGen.addInfoRow(doc, 'Phone Number', patient.phone || 'N/A', { labelWidth: 140 });
  pdfGen.addInfoRow(doc, 'Email Address', patient.email || 'N/A', { labelWidth: 140 });

  // Address breakdown
  if (patient.address) {
    pdfGen.addInfoRow(doc, 'House Number', patient.address.houseNo || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Street', patient.address.street || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Address Line 1', patient.address.line1 || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'City', patient.address.city || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'State', patient.address.state || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Pincode', patient.address.pincode || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Country', patient.address.country || 'N/A', { labelWidth: 140 });
  } else {
    pdfGen.addInfoRow(doc, 'Address', 'Not Provided', { labelWidth: 140 });
  }
}

/**
 * Generate emergency contact section
 */
function generateEmergencyContactSection(doc, patient) {
  pdfGen.addSectionHeader(doc, 'Emergency Contact', '', {
    color: pdfGen.colors.secondary,
    marginTop: 15
  });

  if (patient.emergencyContact) {
    pdfGen.addInfoRow(doc, 'Contact Name', patient.emergencyContact.name || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Contact Phone', patient.emergencyContact.phone || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Relationship', patient.emergencyContact.relationship || 'N/A', { labelWidth: 140 });
  } else {
    pdfGen.addInfoRow(doc, 'Emergency Contact', 'Not Provided', { labelWidth: 140 });
  }
}

/**
 * Generate medical information section
 */
function generateMedicalInfoSection(doc, patient, doctor) {
  pdfGen.addSectionHeader(doc, 'Medical Information', '', {
    color: pdfGen.colors.primary,
    marginTop: 15
  });

  pdfGen.addInfoRow(doc, 'Assigned Doctor',
    doctor ? `Dr. ${doctor.firstName || doctor.name || 'Unknown'}` : 'Not Assigned',
    { labelWidth: 140 }
  );

  // Medical History
  if (patient.medicalHistory && patient.medicalHistory.length > 0) {
    pdfGen.addInfoRow(doc, 'Medical History', patient.medicalHistory.join(', '), { labelWidth: 140 });
  } else {
    pdfGen.addInfoRow(doc, 'Medical History', 'None recorded', { labelWidth: 140 });
  }

  // Allergies
  if (patient.allergies && patient.allergies.length > 0) {
    pdfGen.addInfoRow(doc, 'Known Allergies', patient.allergies.join(', '), {
      labelWidth: 140,
      valueColor: pdfGen.colors.danger
    });
  } else {
    pdfGen.addInfoRow(doc, 'Known Allergies', 'None recorded', { labelWidth: 140 });
  }

  // Current Medications
  if (patient.currentMedications && patient.currentMedications.length > 0) {
    pdfGen.addInfoRow(doc, 'Current Medications', patient.currentMedications.join(', '), { labelWidth: 140 });
  } else {
    pdfGen.addInfoRow(doc, 'Current Medications', 'None recorded', { labelWidth: 140 });
  }
}

module.exports = {
  generatePatientInfoSection,
  generateContactInfoSection,
  generateEmergencyContactSection,
  generateMedicalInfoSection
};

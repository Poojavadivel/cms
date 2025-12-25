/**
 * EditPatientModal.jsx
 * Multi-step patient edit form - Uses AddPatientModal for consistency
 */

import React from 'react';
import AddPatientModal from './addpatient';

const EditPatientModal = ({ patient, isOpen, onClose, onSuccess }) => {
  // Simply reuse AddPatientModal with patient data for editing
  return (
    <AddPatientModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      patientId={patient?.id || patient?.patientId || patient?._id}
    />
  );
};

export default EditPatientModal;

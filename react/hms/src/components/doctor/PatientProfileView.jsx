/**
 * PatientProfileView.jsx
 * Simple patient profile card view - just shows PatientProfileHeaderCard
 * Shown when clicking on patient name
 */

import React from 'react';
import { MdClose } from 'react-icons/md';
import PatientProfileHeaderCard from './PatientProfileHeaderCard';
import MissingEmergencyPhone from '../common/MissingEmergencyPhone';
import './PatientProfileView.css';

const PatientProfileView = ({ patient, isOpen, onClose, onEdit }) => {
  if (!isOpen || !patient) return null;

  return (
    <div className="patient-profile-view-overlay" onClick={onClose}>
      <div className="patient-profile-view-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="profile-view-close-btn" onClick={onClose} title="Close">
          <MdClose />
        </button>

        {/* Patient Profile Header Card - Full Details */}
        <div className="profile-view-content">
          <PatientProfileHeaderCard
            patient={patient}
            onEdit={onEdit}
          />

          {/* Additional Patient Details */}
          <div className="profile-details-section">
            <h3>Contact Information</h3>
            <div className="detail-grid">
              <DetailItem label="Phone" value={patient?.phone || 'N/A'} />
              <DetailItem label="Email" value={patient?.email || 'N/A'} />
            </div>

            <h3>Address</h3>
            <div className="detail-grid">
              <DetailItem
                label="Full Address"
                value={[
                  patient?.houseNo,
                  patient?.street,
                  patient?.city,
                  patient?.state,
                  patient?.pincode,
                  patient?.country
                ].filter(Boolean).join(', ') || 'N/A'}
                fullWidth
              />
            </div>

            {/* Emergency Contact */}
            <h3>Emergency Contact</h3>
            <div className="detail-grid">
              <DetailItem label="Name" value={patient?.emergencyContactName || <span className="text-slate-400 italic text-sm font-normal">Not Provided</span>} />
              <DetailItem label="Relationship" value={(patient?.emergencyContactRelation || patient?.metadata?.emergencyContactRelation) || <span className="text-slate-400 italic text-sm font-normal">Not Provided</span>} />
              <DetailItem label="Phone" value={patient?.emergencyContactPhone || <MissingEmergencyPhone onEdit={onEdit} patient={patient} />} />
            </div>

            {patient?.medicalHistory && patient.medicalHistory.length > 0 && (
              <>
                <h3>Medical History</h3>
                <div className="medical-history-list">
                  {patient.medicalHistory.map((item, index) => (
                    <div key={index} className="history-item">{item}</div>
                  ))}
                </div>
              </>
            )}

            {patient?.allergies && patient.allergies.length > 0 && (
              <>
                <h3>⚠️ Allergies</h3>
                <div className="allergies-list">
                  {patient.allergies.map((allergy, index) => (
                    <div key={index} className="allergy-item">{allergy}</div>
                  ))}
                </div>
              </>
            )}

            {patient?.notes && (
              <>
                <h3>Notes</h3>
                <div className="notes-content">{patient.notes}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, fullWidth }) => (
  <div className={`detail-item ${fullWidth ? 'full-width' : ''}`}>
    <div className="detail-label">{label}</div>
    <div className="detail-value">{value || 'N/A'}</div>
  </div>
);

export default PatientProfileView;

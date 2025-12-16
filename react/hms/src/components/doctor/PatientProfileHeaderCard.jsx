/**
 * PatientProfileHeaderCard.jsx
 * Exact replica of Flutter's PatientProfileHeaderCard
 * Shows patient avatar, name, patient code, and vitals grid
 */

import React, { useState, useEffect } from 'react';
import { MdEdit, MdBadge, MdHeight, MdMonitorWeight, MdScale, MdMonitorHeart } from 'react-icons/md';
import patientsService from '../../services/patientsService';
import './PatientProfileHeaderCard.css';

import boyIcon from '../../assets/boyicon.png';
import girlIcon from '../../assets/girlicon.png';

const PatientProfileHeaderCard = ({ patient, latestIntake, onEdit }) => {
  const [freshData, setFreshData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.patientId]);

  const loadFreshData = async () => {
    if (!patient?.patientId) {
      setFreshData(patient);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await patientsService.fetchPatientById(patient.patientId);
      setFreshData(data);
    } catch (error) {
      console.warn('Failed to fetch fresh data, using provided patient:', error);
      setFreshData(patient);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="patient-profile-header-card loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const displayPatient = freshData || patient;

  return (
    <PatientProfileHeaderCardContent
      patient={displayPatient}
      latestIntake={latestIntake}
      onEdit={onEdit}
    />
  );
};

const PatientProfileHeaderCardContent = ({ patient, latestIntake, onEdit }) => {
  const name = patient?.name || patient?.fullName || '—';
  const isFemale = patient?.gender?.toLowerCase() === 'female';
  const avatar = isFemale ? girlIcon : boyIcon;

  const formatValue = (val, suffix = '') => {
    if (val == null || val === '' || val === 0 || val === '0') return '—';
    return `${val}${suffix}`;
  };

  const getInitials = (name) => {
    if (!name || name === '—') return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const bloodGroup = formatValue(patient?.bloodGroup);
  const age = patient?.age || 0;
  const ageDisplay = age === 0 ? '—' : `${age} yrs`;
  const height = formatValue(patient?.height, ' cm');
  const weight = formatValue(patient?.weight, ' kg');
  const bmi = formatValue(patient?.bmi);
  const spo2 = formatValue(patient?.oxygen, '%');

  return (
    <div className="patient-profile-header-card">
      <div className="patient-card-container">
        <div className="patient-card-content">
          {/* Left Section: Avatar + Identity */}
          <div className="patient-identity-section">
            <div className="patient-avatar-container">
              <img
                src={avatar}
                alt={name}
                className="patient-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="patient-avatar-fallback" style={{ display: 'none' }}>
                {getInitials(name)}
              </div>
            </div>

            <div className="patient-identity-info">
              <h2 className="patient-name-title">{name}</h2>

              {/* Patient Code Badge */}
              <div className="patient-code-badge">
                <MdBadge />
                <span>{patient?.patientCode || patient?.patientId || 'N/A'}</span>
              </div>

              {/* Basic Info Pills */}
              <div className="patient-basic-info">
                <span className="info-pill gender">
                  {isFemale ? '👩 Female' : '👨 Male'}
                </span>
                <span className="info-pill age">{ageDisplay}</span>
                <span className="info-pill blood-group">{bloodGroup}</span>
              </div>
            </div>
          </div>

          {/* Right Section: Vitals Grid */}
          <div className="patient-vitals-section">
            <div className="vitals-grid">
              <VitalBox label="Height" value={height} icon={<MdHeight />} />
              <VitalBox label="Weight" value={weight} icon={<MdMonitorWeight />} />
              <VitalBox label="BMI" value={bmi} icon={<MdScale />} />
              <VitalBox label="Oxygen (SpO₂)" value={spo2} icon={<MdMonitorHeart />} />
            </div>
          </div>
        </div>

        {/* Edit Button */}
        {onEdit && (
          <button className="patient-edit-btn" onClick={onEdit} title="Edit Patient">
            <MdEdit />
          </button>
        )}
      </div>
    </div>
  );
};

const VitalBox = ({ label, value, icon }) => (
  <div className="vital-box">
    <div className="vital-icon-container">
      <span className="vital-icon">{icon}</span>
    </div>
    <div className="vital-content">
      <div className="vital-value">{value}</div>
      <div className="vital-label">{label}</div>
    </div>
  </div>
);

export default PatientProfileHeaderCard;

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
  const bmi = formatValue(patient?.bmi);
  const weight = formatValue(patient?.weight, ' kg');
  const height = formatValue(patient?.height, ' cm');
  const bp = patient?.bp || patient?.bloodPressure || '—';

  return (
    <div className="pv-summary-header">
      <div className="pv-header-content">
        {/* Avatar */}
        <div className="pv-avatar-section">
          <div className="pv-avatar-container">
            <img
              src={avatar}
              alt={name}
              className="pv-avatar-image"
              onError={(e) => {
                e.target.src = isFemale ? girlIcon : boyIcon;
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="pv-info-section">
          <div className="pv-name-row">
            <h2 className="pv-name-main">{name}</h2>
          </div>

          <div className="pv-info-pills">
            <div className="pv-pill">
              {isFemale ? <MdBadge /> : <MdBadge />} <span>{isFemale ? 'Female' : 'Male'}</span>
            </div>
            <div className="pv-pill">
              <MdBadge /> <span>Age: {ageDisplay}</span>
            </div>
            <div className="pv-pill">
              <MdBadge /> <span>Blood: {bloodGroup}</span>
            </div>
          </div>

          <div className="pv-metrics-row">
            <div className="pv-metric-card">
              <span className="pv-metric-val">{bmi}</span>
              <span className="pv-metric-lbl">BMI</span>
            </div>
            <div className="pv-metric-card">
              <span className="pv-metric-val">{weight.replace(' kg', '')} <small>kg</small></span>
              <span className="pv-metric-lbl">Weight</span>
            </div>
            <div className="pv-metric-card">
              <span className="pv-metric-val">{height.replace(' cm', '')} <small>Cm</small></span>
              <span className="pv-metric-lbl">Height</span>
            </div>
            <div className="pv-metric-card">
              <span className="pv-metric-val">{bp}</span>
              <span className="pv-metric-lbl">Blood Pressure</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        {onEdit && (
          <div className="pv-header-right">
            <button className="pv-edit-btn" onClick={onEdit}>
              <MdEdit size={14} /> Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfileHeaderCard;

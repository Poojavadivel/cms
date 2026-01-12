/**
 * PatientDetailsDialog_FLUTTER.jsx
 * Flutter-styled patient details popup
 * Matches exact design patterns from Flutter DoctorAppointmentPreview
 */

import React, { useState } from 'react';
import { 
  MdClose, MdBadge, MdBloodtype, MdMale, MdFemale, 
  MdCake, MdHeight, MdMonitorWeight, MdScale, 
  MdMonitorHeart, MdPhone, MdEmail, MdLocationOn,
  MdWork, MdCalendarToday
} from 'react-icons/md';
import './PatientDetailsDialog.css';
import { getGenderAvatar } from '../../utils/avatarHelpers';

const PatientDetailsDialog = ({ patient, isOpen, onClose, showBillingTab = true }) => {
  const [activeTab, setActiveTab] = useState('profile');

  if (!isOpen || !patient) return null;

  // Helpers
  const f = (val, suffix = '') => (val || val === 0 ? `${val}${suffix}` : '—');
  const isFemale = patient.gender?.toLowerCase()?.startsWith('f');

  // Tabs
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'history', label: 'Medical History' },
    { id: 'prescriptions', label: 'Prescription' },
    { id: 'lab', label: 'Lab Result' },
    ...(showBillingTab ? [{ id: 'billing', label: 'Billings' }] : [])
  ];

  // Prepare modern patient data
  const getPatientData = () => {
    const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || patient.clientName || 'Unknown Patient';

    let phone = '';
    if (typeof patient.phone === 'object') {
      phone = patient.phone.phone || patient.phone.number || '';
    } else {
      phone = patient.phone || patient.phoneNumber || '';
    }

    let email = '';
    if (typeof patient.email === 'object') {
      email = patient.email.email || patient.email.address || '';
    } else {
      email = patient.email || '';
    }

    const gender = patient.gender || 'Male';

    let location = 'Location not set';
    if (patient.address?.city) {
      location = patient.address.city;
    }

    const occupation = patient.profession || patient.metadata?.profession || 'Not specified';

    let dob = '';
    let age = patient.age || 0;
    if (patient.dateOfBirth) {
      const dobDate = new Date(patient.dateOfBirth);
      dob = dobDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const today = new Date();
      age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
    }

    // Vitals
    const weightKg = patient.vitals?.weightKg || patient.weight || null;
    const heightCm = patient.vitals?.heightCm || patient.height || null;
    const bp = patient.vitals?.bp || patient.bp || '—';

    // BMI
    let bmi = null;
    if (weightKg && heightCm) {
      bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
    } else if (patient.vitals?.bmi || patient.bmi) {
      bmi = patient.vitals?.bmi || patient.bmi;
    }

    // Lifestyle
    const noAlcohol = patient.metadata?.noAlcohol === true || patient.metadata?.alcohol === false;
    const noSmoker = patient.metadata?.noSmoker === true || patient.metadata?.smoker === false;

    return {
      name, phone, email, gender, location, occupation, dob, age,
      weightKg, heightCm, bp, bmi,
      noAlcohol, noSmoker,
      bloodGroup: patient.bloodGroup,
      avatarUrl: patient.avatarUrl || patient.metadata?.avatarUrl
    };
  };

  const patientData = getPatientData();
  const avatarSrc = patientData.avatarUrl || getGenderAvatar(patientData.gender);
  
  const getGenderIcon = (gender) => {
    return gender?.toLowerCase() === 'female' ? <MdFemale size={14} /> : <MdMale size={14} />;
  };

  return (
    <div className="patient-modal-overlay-flutter" onClick={onClose}>
      <div className="patient-modal-content-flutter" onClick={e => e.stopPropagation()}>
        
        {/* Floating Close Button */}
        <button className="btn-close-floating-flutter" onClick={onClose}>
          <MdClose size={20} />
        </button>

        {/* Main Content Wrapper */}
        <div className="pd-flutter-wrapper">
          
          {/* Modern Header Card - Matching Admin PatientView */}
          <div className="pv-summary-header">
            <div className="pv-header-content">
              
              {/* Avatar Section */}
              <div className="pv-avatar-section">
                <div className="pv-avatar-container">
                  <img
                    src={avatarSrc}
                    alt={patientData.name}
                    className="pv-avatar-image"
                    onError={(e) => { e.target.src = getGenderAvatar(patientData.gender); }}
                  />
                  <div className="pv-lifestyle-indicators">
                    {patientData.noAlcohol && (
                      <div className="pv-lifestyle-badge no-alcohol">
                        <span className="pv-lifestyle-label">Alcohol</span>
                      </div>
                    )}
                    {patientData.noSmoker && (
                      <div className="pv-lifestyle-badge no-smoker">
                        <span className="pv-lifestyle-label">Smoker</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="pv-info-section">
                <div className="pv-name-row">
                  <h2 className="pv-name-main">{patientData.name}</h2>
                  <div className="pv-contact-icons">
                    {patientData.phone && <button className="pv-contact-btn" title={patientData.phone}><MdPhone size={14} /></button>}
                    {patientData.email && <button className="pv-contact-btn" title={patientData.email}><MdEmail size={14} /></button>}
                  </div>
                </div>

                <div className="pv-info-pills">
                  <div className="pv-pill">
                    {getGenderIcon(patientData.gender)} <span>{patientData.gender}</span>
                  </div>
                  <div className="pv-pill">
                    <MdLocationOn size={14} /> <span>{patientData.location}</span>
                  </div>
                  <div className="pv-pill">
                    <MdWork size={14} /> <span>{patientData.occupation}</span>
                  </div>
                  {patientData.dob && (
                    <div className="pv-pill">
                      <MdCalendarToday size={14} /> <span>{patientData.dob} ({patientData.age} years)</span>
                    </div>
                  )}
                </div>

                <div className="pv-metrics-row">
                  <div className="pv-metric-card">
                    <span className="pv-metric-val">{patientData.bmi || '—'}</span>
                    <span className="pv-metric-lbl">BMI</span>
                  </div>
                  <div className="pv-metric-card">
                    <span className="pv-metric-val">{patientData.weightKg || '—'} <small>kg</small></span>
                    <span className="pv-metric-lbl">Weight</span>
                  </div>
                  <div className="pv-metric-card">
                    <span className="pv-metric-val">{patientData.heightCm || '—'} <small>cm</small></span>
                    <span className="pv-metric-lbl">Height</span>
                  </div>
                  <div className="pv-metric-card">
                    <span className="pv-metric-val">{patientData.bp}</span>
                    <span className="pv-metric-lbl">Blood Pressure</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Blood Group Badge */}
              <div className="pv-header-right">
                <div className="pv-blood-group-badge">
                  <MdBloodtype size={24} />
                  <span className="pv-blood-text">{patientData.bloodGroup || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Container */}
          <div className="pd-tabs-container-flutter">
            
            {/* Tab Bar */}
            <div className="pd-tabs-flutter">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`pd-tab-flutter ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </div>
              ))}
            </div>

            {/* Tab Content */}
            <div className="pd-tab-content-flutter">
              {activeTab === 'profile' && <ProfileTab patient={patient} />}
              {activeTab === 'history' && <HistoryTab patient={patient} />}
              {activeTab === 'prescriptions' && <PrescriptionsTab patient={patient} />}
              {activeTab === 'lab' && <LabTab patient={patient} />}
              {activeTab === 'billing' && <BillingTab patient={patient} />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Vital Card Component
const VitalCard = ({ icon, label, value, type }) => (
  <div className="pd-vital-card-flutter">
    <div className={`pd-vital-icon-flutter ${type}`}>
      {icon}
    </div>
    <span className="pd-vital-value-flutter">{value}</span>
    <span className="pd-vital-label-flutter">{label}</span>
  </div>
);

// Tab Components
const ProfileTab = ({ patient }) => (
  <div className="pd-tab-inner">
    <h3 className="pd-section-title-flutter">Personal Information</h3>
    <div className="pd-info-grid">
      <div className="pd-info-card">
        <h4 className="pd-card-title">Contact Details</h4>
        <InfoRow label="Phone Number" value={patient.phone || patient.phoneNumber} />
        <InfoRow label="Email Address" value={patient.email} />
        <InfoRow label="Residential Address" value={
          [patient.houseNo, patient.street, patient.city, patient.state]
            .filter(Boolean).join(', ')
        } />
      </div>
      
      <div className="pd-info-card">
        <h4 className="pd-card-title">Emergency & Allergies</h4>
        <InfoRow label="Emergency Contact" value={patient.emergencyContactName} />
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
          {patient.emergencyContactPhone}
        </div>
        <InfoRow label="Allergies" value={
          patient.allergies?.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {patient.allergies.map((a, i) => (
                <span key={i} className="allergy-badge">
                  {a}
                </span>
              ))}
            </div>
          ) : 'No Known Allergies'
        } />
      </div>
    </div>

    {patient.notes && (
      <div className="pd-info-card" style={{ marginTop: '24px' }}>
        <h4 className="pd-card-title">Clinical Notes</h4>
        <p className="pd-notes">{patient.notes}</p>
      </div>
    )}
  </div>
);

const HistoryTab = ({ patient }) => (
  <div className="pd-tab-inner">
    <h3 className="pd-section-title-flutter">Medical History Timeline</h3>
    {patient.medicalHistory?.length > 0 ? (
      <div>
        {patient.medicalHistory.map((item, i) => (
          <div key={i} className="pd-history-item-flutter">
            {item}
          </div>
        ))}
      </div>
    ) : (
      <EmptyState title="No Medical History" />
    )}
  </div>
);

const PrescriptionsTab = () => (
  <div className="pd-tab-inner">
    <h3 className="pd-section-title-flutter">Active Prescriptions</h3>
    <EmptyState 
      title="No Active Prescriptions" 
      subtitle="Prescriptions issued by doctors will appear here."
    />
  </div>
);

const LabTab = () => (
  <div className="pd-tab-inner">
    <h3 className="pd-section-title-flutter">Lab Reports</h3>
    <EmptyState 
      title="No Lab Results" 
      subtitle="Pathology and imaging reports will be listed here."
    />
  </div>
);

const BillingTab = () => (
  <div className="pd-tab-inner">
    <h3 className="pd-section-title-flutter">Billing & Payments</h3>
    <EmptyState title="No Invoices Found" />
  </div>
);

// Helper Components
const InfoRow = ({ label, value }) => (
  <div className="pd-field-group-flutter">
    <span className="pd-label-flutter">{label}</span>
    <div className="pd-value-flutter">{value || '—'}</div>
  </div>
);

const EmptyState = ({ title, subtitle }) => (
  <div className="empty-state-flutter">
    <div className="empty-icon">
      📋
    </div>
    <h3 className="empty-title">{title}</h3>
    <p className="empty-subtitle">
      {subtitle || 'No data available for this section yet.'}
    </p>
  </div>
);

export default PatientDetailsDialog;

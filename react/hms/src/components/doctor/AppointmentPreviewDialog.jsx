/**
 * AppointmentPreviewDialog.jsx
 * Flutter-styled appointment preview popup
 * Matches exact design patterns from Flutter DoctorAppointmentPreview
 */

import React, { useState } from 'react';
import { 
  MdClose, MdBadge, MdBloodtype, MdMale, MdFemale, 
  MdCake, MdHeight, MdMonitorWeight, MdScale, 
  MdMonitorHeart 
} from 'react-icons/md';
import './AppointmentPreviewDialog.css';

const AppointmentPreviewDialog = ({ patient, isOpen, onClose, showBillingTab = true }) => {
  const [activeTab, setActiveTab] = useState('profile');

  if (!isOpen || !patient) return null;

  // Helper to extract vital from vitals object or legacy field
  const extractVital = (vitalKey, legacyKey) => {
    if (patient.vitals && typeof patient.vitals === 'object') {
      const value = patient.vitals[vitalKey];
      if (value != null) return value.toString();
    }
    return patient[legacyKey]?.toString() || '';
  };

  // Extract vitals properly
  const height = extractVital('heightCm', 'height');
  const weight = extractVital('weightKg', 'weight');
  const bmi = extractVital('bmi', 'bmi');
  const oxygen = extractVital('spo2', 'oxygen');

  // Helpers - Updated
  const f = (val, suffix = '') => (val || val === 0 ? `${val}${suffix}` : '—');
  const isFemale = patient.gender?.toLowerCase()?.startsWith('f');

  // Get patient code (prefer patientCode over patientId)
  const patientCode = patient.patientCode || patient.patientId || 'NO-ID';
  
  // Build complete address
  const addressParts = [
    patient.houseNo, 
    patient.street, 
    patient.city, 
    patient.state
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '—';

  // Tabs
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'history', label: 'Medical History' },
    { id: 'prescriptions', label: 'Prescription' },
    { id: 'lab', label: 'Lab Result' },
    ...(showBillingTab ? [{ id: 'billing', label: 'Billings' }] : [])
  ];

  return (
    <div className="appointment-preview-overlay-flutter" onClick={onClose}>
      <div className="appointment-preview-content-flutter" onClick={e => e.stopPropagation()}>
        
        {/* Floating Close Button */}
        <button className="btn-close-floating-appt" onClick={onClose}>
          <MdClose size={20} />
        </button>

        {/* Main Content Wrapper */}
        <div className="appt-flutter-wrapper">
          
          {/* Header Card */}
          <div className="appt-header-card-flutter">
            
            {/* Left: Avatar */}
            <img 
              src={isFemale ? '/girlicon.png' : '/boyicon.png'}
              alt={patient.gender}
              className="appt-avatar-flutter"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="appt-avatar-fallback-flutter" style={{ display: 'none' }}>
              {isFemale ? '👩' : '👨'}
            </div>

            {/* Middle: Identity Block */}
            <div className="appt-identity-flutter">
              <h1 className="appt-name-flutter">
                {patient.name || patient.clientName || 'Unknown'}
              </h1>

              {/* Patient Code Badge */}
              <div className="appt-code-badge-flutter">
                <MdBadge className="icon" />
                <span className="text">{patientCode}</span>
              </div>

              {/* Info Pills */}
              <div className="appt-pills-flutter">
                <div className="appt-pill-flutter blood">
                  <MdBloodtype className="icon" />
                  <span>Blood: {patient.bloodGroup || 'N/A'}</span>
                </div>
                <div className={`appt-pill-flutter ${isFemale ? 'female' : 'male'}`}>
                  {isFemale ? <MdFemale className="icon" /> : <MdMale className="icon" />}
                  <span>{patient.gender || 'N/A'}</span>
                </div>
                <div className="appt-pill-flutter age">
                  <MdCake className="icon" />
                  <span>{patient.age ? `${patient.age} yrs` : 'Age: N/A'}</span>
                </div>
              </div>
            </div>

            {/* Right: Vitals Grid */}
            <div className="appt-vitals-grid-flutter">
              <VitalCard 
                icon={<MdHeight />} 
                label="Height" 
                value={f(height, ' cm')} 
                type="height"
              />
              <VitalCard 
                icon={<MdMonitorWeight />} 
                label="Weight" 
                value={f(weight, ' kg')} 
                type="weight"
              />
              <VitalCard 
                icon={<MdScale />} 
                label="BMI" 
                value={f(bmi)} 
                type="bmi"
              />
              <VitalCard 
                icon={<MdMonitorHeart />} 
                label="SpO₂" 
                value={f(oxygen, '%')} 
                type="spo2"
              />
            </div>
          </div>

          {/* Tabs Container */}
          <div className="appt-tabs-container-flutter">
            
            {/* Tab Bar */}
            <div className="appt-tabs-flutter">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`appt-tab-flutter ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </div>
              ))}
            </div>

            {/* Tab Content */}
            <div className="appt-tab-content-flutter">
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
  <div className="appt-vital-card-flutter">
    <div className={`appt-vital-icon-flutter ${type}`}>
      {icon}
    </div>
    <span className="appt-vital-value-flutter">{value}</span>
    <span className="appt-vital-label-flutter">{label}</span>
  </div>
);

// Tab Components
const ProfileTab = ({ patient }) => {
  // Build address properly
  const addressParts = [patient.houseNo, patient.street, patient.city, patient.state].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '—';

  return (
    <div className="appt-tab-inner">
      <h3 className="appt-section-title-flutter">Personal Information</h3>
      <div className="appt-info-grid">
        <div className="appt-info-card">
          <h4 className="appt-card-title">Contact Details</h4>
          <InfoRow label="Phone Number" value={patient.phone || patient.phoneNumber || patient.contact} />
          <InfoRow label="Email Address" value={patient.email} />
          <InfoRow label="Residential Address" value={fullAddress} />
        </div>
        
        <div className="appt-info-card">
          <h4 className="appt-card-title">Emergency & Allergies</h4>
          <InfoRow label="Emergency Contact" value={patient.emergencyContactName} />
          {patient.emergencyContactPhone && (
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              {patient.emergencyContactPhone}
            </div>
          )}
          <InfoRow label="Allergies" value={
            patient.allergies && patient.allergies.length > 0 ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {patient.allergies.map((a, i) => (
                  <span key={i} className="appt-allergy-badge">
                    {a}
                  </span>
                ))}
              </div>
            ) : 'No Known Allergies'
          } />
        </div>
      </div>

      {patient.notes && (
        <div className="appt-info-card" style={{ marginTop: '24px' }}>
          <h4 className="appt-card-title">Clinical Notes</h4>
          <p className="appt-notes">{patient.notes}</p>
        </div>
      )}
    </div>
  );
};

const HistoryTab = ({ patient }) => {
  // Extract medical history from various possible locations
  const medicalHistory = (() => {
    if (patient.medicalHistory && Array.isArray(patient.medicalHistory) && patient.medicalHistory.length > 0) {
      return patient.medicalHistory;
    }
    if (patient.metadata && patient.metadata.medicalHistory) {
      if (Array.isArray(patient.metadata.medicalHistory)) {
        return patient.metadata.medicalHistory;
      }
      if (patient.metadata.medicalHistory.currentConditions && Array.isArray(patient.metadata.medicalHistory.currentConditions)) {
        return patient.metadata.medicalHistory.currentConditions;
      }
    }
    return [];
  })();

  return (
    <div className="appt-tab-inner">
      <h3 className="appt-section-title-flutter">Medical History Timeline</h3>
      {medicalHistory.length > 0 ? (
        <div>
          {medicalHistory.map((item, i) => (
            <div key={i} className="appt-history-item-flutter">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Medical History" />
      )}
    </div>
  );
};

const PrescriptionsTab = () => (
  <div className="appt-tab-inner">
    <h3 className="appt-section-title-flutter">Active Prescriptions</h3>
    <EmptyState 
      title="No Active Prescriptions" 
      subtitle="Prescriptions issued by doctors will appear here."
    />
  </div>
);

const LabTab = () => (
  <div className="appt-tab-inner">
    <h3 className="appt-section-title-flutter">Lab Reports</h3>
    <EmptyState 
      title="No Lab Results" 
      subtitle="Pathology and imaging reports will be listed here."
    />
  </div>
);

const BillingTab = () => (
  <div className="appt-tab-inner">
    <h3 className="appt-section-title-flutter">Billing & Payments</h3>
    <EmptyState title="No Invoices Found" />
  </div>
);

// Helper Components
const InfoRow = ({ label, value }) => (
  <div className="appt-field-group-flutter">
    <span className="appt-label-flutter">{label}</span>
    <div className="appt-value-flutter">{value || '—'}</div>
  </div>
);

const EmptyState = ({ title, subtitle }) => (
  <div className="appt-empty-state-flutter">
    <div className="appt-empty-icon">
      📋
    </div>
    <h3 className="appt-empty-title">{title}</h3>
    <p className="appt-empty-subtitle">
      {subtitle || 'No data available for this section yet.'}
    </p>
  </div>
);

export default AppointmentPreviewDialog;

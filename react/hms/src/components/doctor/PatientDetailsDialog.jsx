/**
 * PatientDetailsDialog_FLUTTER.jsx
 * Flutter-styled patient details popup
 * Matches exact design patterns from Flutter DoctorAppointmentPreview
 */

import React, { useState } from 'react';
import { 
  MdClose, MdBadge, MdBloodtype, MdMale, MdFemale, 
  MdCake, MdHeight, MdMonitorWeight, MdScale, 
  MdMonitorHeart 
} from 'react-icons/md';
import './PatientDetailsDialog.css';

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

  return (
    <div className="patient-modal-overlay-flutter" onClick={onClose}>
      <div className="patient-modal-content-flutter" onClick={e => e.stopPropagation()}>
        
        {/* Floating Close Button */}
        <button className="btn-close-floating-flutter" onClick={onClose}>
          <MdClose size={20} />
        </button>

        {/* Main Content Wrapper */}
        <div className="pd-flutter-wrapper">
          
          {/* Header Card */}
          <div className="pd-header-card-flutter">
            
            {/* Left: Avatar */}
            <img 
              src={isFemale ? '/girlicon.png' : '/boyicon.png'}
              alt={patient.gender}
              className="pd-avatar-flutter"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="pd-avatar-fallback-flutter" style={{ display: 'none' }}>
              {isFemale ? '👩' : '👨'}
            </div>

            {/* Middle: Identity Block */}
            <div className="pd-identity-flutter">
              <h1 className="pd-name-flutter">
                {patient.name || patient.clientName || 'Unknown'}
              </h1>

              {/* Patient Code Badge */}
              <div className="pd-code-badge-flutter">
                <MdBadge className="icon" />
                <span className="text">{patient.patientId || patient.patientCode || 'NO-ID'}</span>
              </div>

              {/* Info Pills */}
              <div className="pd-pills-flutter">
                <div className="pd-pill-flutter blood">
                  <MdBloodtype className="icon" />
                  <span>Blood: {patient.bloodGroup || 'N/A'}</span>
                </div>
                <div className={`pd-pill-flutter ${isFemale ? 'female' : 'male'}`}>
                  {isFemale ? <MdFemale className="icon" /> : <MdMale className="icon" />}
                  <span>{patient.gender || 'N/A'}</span>
                </div>
                <div className="pd-pill-flutter age">
                  <MdCake className="icon" />
                  <span>{patient.age ? `${patient.age} yrs` : 'Age: N/A'}</span>
                </div>
              </div>
            </div>

            {/* Right: Vitals Grid */}
            <div className="pd-vitals-grid-flutter">
              <VitalCard 
                icon={<MdHeight />} 
                label="Height" 
                value={f(patient.height, ' cm')} 
                type="height"
              />
              <VitalCard 
                icon={<MdMonitorWeight />} 
                label="Weight" 
                value={f(patient.weight, ' kg')} 
                type="weight"
              />
              <VitalCard 
                icon={<MdScale />} 
                label="BMI" 
                value={f(patient.bmi)} 
                type="bmi"
              />
              <VitalCard 
                icon={<MdMonitorHeart />} 
                label="SpO₂" 
                value={f(patient.oxygen, '%')} 
                type="spo2"
              />
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

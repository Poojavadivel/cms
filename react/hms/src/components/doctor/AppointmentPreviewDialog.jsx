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

const AppointmentPreviewDialog = ({ patient, isOpen, onClose, onEdit, showBillingTab = true }) => {
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
  const f = (val) => (val || val === 0 ? val : '—');
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
                value={f(height)}
                unit="cm"
                type="height"
              />
              <VitalCard
                icon={<MdMonitorWeight />}
                label="Weight"
                value={f(weight)}
                unit="kg"
                type="weight"
              />
              <VitalCard
                icon={<MdScale />}
                label="BMI"
                value={f(bmi)}
                unit="kg/m²"
                type="bmi"
              />
              <VitalCard
                icon={<MdMonitorHeart />}
                label="SpO₂"
                value={f(oxygen)}
                unit="%"
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
const VitalCard = ({ icon, label, value, type, unit }) => (
  <div className="appt-vital-card-flutter">
    <div className={`appt-vital-icon-flutter ${type}`}>
      {icon}
    </div>
    <div className="flex items-baseline justify-center gap-1 mt-1">
      <span className="appt-vital-value-flutter" style={{ lineHeight: 1 }}>{value}</span>
      {unit && value !== '—' && (
        <span className="text-xs font-semibold text-slate-400">{unit}</span>
      )}
    </div>
    <span className="appt-vital-label-flutter" style={{ marginTop: '2px' }}>{label}</span>
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
          <InfoRow label="Emergency Contact" value={patient.emergencyContactName || <span className="text-slate-400 italic font-normal">Not Provided</span>} />
          <InfoRow label="Relationship" value={(patient.emergencyContactRelation || patient.metadata?.emergencyContactRelation) || <span className="text-slate-400 italic font-normal">Not Provided</span>} />
          <InfoRow label="Phone Number" value={patient.emergencyContactPhone || <span className="text-slate-400 italic font-normal">Not Provided</span>} />
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
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Bug 27: Add New state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const patientId = patient.id || patient._id || patient.patientId;

  React.useEffect(() => {
    const fetchHistory = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/scanner-enterprise/medical-history/${patientId}`, {
          headers: {
            'x-auth-token': localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token')
          }
        });
        const data = await response.json();
        if (data.success && data.medicalHistory) {
          setHistory(data.medicalHistory);
        }
      } catch (error) {
        console.error('Error fetching medical history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  const formatDateTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="appt-tab-inner">
        <h3 className="appt-section-title-flutter">Medical History Timeline</h3>
        <p>Loading medical history...</p>
      </div>
    );
  }

  return (
    <div className="appt-tab-inner">
      {/* Bug 27: Interactive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="appt-section-title-flutter" style={{ marginBottom: 0 }}>Medical History Timeline</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="pv-btn-primary flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm text-sm font-medium"
        >
          <span>+ Add History</span>
        </button>
      </div>
      {history.length > 0 ? (
        <div className="appt-prescriptions-table-wrapper">
          <table className="appt-prescriptions-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date and Time</th>
                <th>Hospital</th>
                <th>Doctor</th>
                <th>Summary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatDateTime(item.recordDate || item.uploadDate)}</td>
                  <td>{item.hospitalName || '—'}</td>
                  <td>{item.doctorName || '—'}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    {item.medicalHistory || item.diagnosis || '—'}
                  </td>
                  <td>
                    <button
                      className="appt-prescription-action-btn"
                      onClick={() => {
                        if (item.pdfId) {
                          window.open(`/api/scanner-enterprise/pdf-public/${item.pdfId}`, '_blank');
                        }
                      }}
                      disabled={!item.pdfId}
                      title="View Medical History"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No Medical History" />
      )}

      {/* Bug 27: Placeholder Modal for Add Action */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsAddModalOpen(false)}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Add Medical History</h3>
            <div style={{ padding: '32px 0', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Form component goes here.</p>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0f766e', color: 'white', cursor: 'not-allowed', opacity: 0.5 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PrescriptionsTab = ({ patient }) => {
  const [prescriptions, setPrescriptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Bug 27: Add New state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const patientId = patient.id || patient._id || patient.patientId;

  React.useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/scanner-enterprise/prescriptions/${patientId}`, {
          headers: {
            'x-auth-token': localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token')
          }
        });
        const data = await response.json();
        if (data.success && data.prescriptions) {
          setPrescriptions(data.prescriptions);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [patientId]);

  const formatDateTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="appt-tab-inner">
        <h3 className="appt-section-title-flutter">Active Prescriptions</h3>
        <p>Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="appt-tab-inner">
      {/* Bug 27: Interactive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="appt-section-title-flutter" style={{ marginBottom: 0 }}>Active Prescriptions</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="pv-btn-primary flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm text-sm font-medium"
        >
          <span>+ Add Prescription</span>
        </button>
      </div>
      {prescriptions.length > 0 ? (
        <div className="appt-prescriptions-table-wrapper">
          <table className="appt-prescriptions-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date and Time</th>
                <th>Hospital</th>
                <th>Doctor</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((prescription, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatDateTime(prescription.prescriptionDate || prescription.uploadDate)}</td>
                  <td>{prescription.hospitalName || '—'}</td>
                  <td>{prescription.doctorName || '—'}</td>
                  <td>{prescription.prescriptionSummary || prescription.diagnosis || '—'}</td>
                  <td>
                    <button
                      className="appt-prescription-action-btn"
                      onClick={() => {
                        if (prescription.pdfId) {
                          window.open(`/api/scanner-enterprise/pdf-public/${prescription.pdfId}`, '_blank');
                        }
                      }}
                      disabled={!prescription.pdfId}
                      title="View Prescription"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No Active Prescriptions"
          subtitle="Prescriptions issued by doctors will appear here."
        />
      )}

      {/* Bug 27: Placeholder Modal for Add Action */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsAddModalOpen(false)}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Add Prescription</h3>
            <div style={{ padding: '32px 0', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Prescription form structure (Drug, Dose, Route, Frequency) goes here.</p>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0f766e', color: 'white', cursor: 'not-allowed', opacity: 0.5 }}>Save Prescription</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LabTab = () => {
  // Bug 27: Add New state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  return (
    <div className="appt-tab-inner">
      {/* Bug 27: Interactive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="appt-section-title-flutter" style={{ marginBottom: 0 }}>Lab Reports</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="pv-btn-primary flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm text-sm font-medium"
        >
          <span>+ Upload Lab Result</span>
        </button>
      </div>
      <EmptyState
        title="No Lab Results"
        subtitle="Pathology and imaging reports will be listed here."
      />

      {/* Bug 27: Placeholder Modal for Add Action */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsAddModalOpen(false)}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Upload Lab Result</h3>
            <div style={{ padding: '32px 0', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>File upload & Test Details form goes here.</p>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0f766e', color: 'white', cursor: 'not-allowed', opacity: 0.5 }}>Upload Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

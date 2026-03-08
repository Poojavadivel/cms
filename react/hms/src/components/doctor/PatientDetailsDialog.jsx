/**
 * PatientDetailsDialog_FLUTTER.jsx
 * Flutter-styled patient details popup
 * Matches exact design patterns from Flutter DoctorAppointmentPreview
 */

import React, { useState, useEffect } from 'react';
import {
  MdClose, MdBadge, MdBloodtype, MdMale, MdFemale,
  MdCake, MdHeight, MdMonitorWeight, MdScale,
  MdMonitorHeart, MdPhone, MdEmail, MdLocationOn,
  MdWork, MdCalendarToday, MdContentCopy, MdPictureAsPdf, MdVisibility,
  MdSearch, MdFilterList, MdCheck
} from 'react-icons/md';
import './PatientDetailsDialog.css';
import patientsService from '../../services/patientsService';
import prescriptionService from '../../services/prescriptionService';
import reportService from '../../services/reportService';
import { getGenderAvatar } from '../../utils/avatarHelpers';
import { calculateBMI } from '../../utils/vitalsHelpers';
import MissingEmergencyPhone from '../common/MissingEmergencyPhone';

const PatientDetailsDialog = ({ patient, isOpen, onClose, onEdit, showBillingTab = true }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDownloading, setIsDownloading] = useState(false);

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
    let bmi = calculateBMI(weightKg, heightCm, age);
    if (bmi === null && (patient.vitals?.bmi || patient.bmi)) {
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
      avatarUrl: patient.avatarUrl || patient.metadata?.avatarUrl,
      patientCode: patient.patientCode ||
        patient.metadata?.patientCode ||
        patient.patient_code ||
        'PAT-SYNCING...'
    };
  };

  const handleDownloadReport = async () => {
    const id = patient.id || patient._id || patient.patientId;
    if (!id) {
      alert('Patient ID not found for download');
      return;
    }

    setIsDownloading(true);
    try {
      const result = await reportService.downloadPatientReport(id);
      if (!result.success) {
        alert(result.message);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) {
      alert(`No ${label} information available to copy`);
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert(`${label} copied to clipboard!`);
        })
        .catch((err) => {
          console.error(`Failed to copy ${label}:`, err);
          fallbackCopyTextToClipboard(text, label);
        });
    } else {
      fallbackCopyTextToClipboard(text, label);
    }
  };

  const fallbackCopyTextToClipboard = (text, label) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        alert(`${label} copied to clipboard!`);
      } else {
        throw new Error('Copy command was unsuccessful');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert(`Failed to copy ${label}. Please select and copy manually.`);
    }
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
                  <div className="pv-name-id-group">
                    <h2 className="pv-name-main">{patientData.name}</h2>
                    <div className="pv-patient-code-badge" onClick={() => copyToClipboard(patientData.patientCode, 'Patient Code')} title="Click to copy Patient Code">
                      <span className="pv-code-prefix">ID:</span>
                      <span className="pv-code-val">{patientData.patientCode}</span>
                      <MdContentCopy size={12} className="pv-code-copy-icon" />
                    </div>
                  </div>
                  <div className="pv-contact-icons">
                    {patientData.phone && (
                      <button
                        className="pv-contact-btn"
                        title={`Copy Phone: ${patientData.phone}`}
                        onClick={() => copyToClipboard(patientData.phone, 'Phone Number')}
                      >
                        <MdPhone size={14} />
                      </button>
                    )}
                    {patientData.email && (
                      <button
                        className="pv-contact-btn"
                        title={`Copy Email: ${patientData.email}`}
                        onClick={() => copyToClipboard(patientData.email, 'Email Address')}
                      >
                        <MdEmail size={14} />
                      </button>
                    )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                  <VitalCard label="BMI" value={patientData.bmi} unit="kg/m²" />
                  <VitalCard label="Weight" value={patientData.weightKg} unit="kg" />
                  <VitalCard label="Height" value={patientData.heightCm} unit="cm" />
                  <VitalCard label="Blood Pressure" value={patientData.bp} unit="mmHg" />
                </div>
              </div>

              {/* Right Section - Download & Blood Group */}
              <div className="pv-header-right">
                <button
                  className={`pv-btn-fill ${isDownloading ? 'loading' : ''}`}
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                  style={{ marginRight: '12px', background: '#EF4444' }}
                >
                  <MdPictureAsPdf size={14} /> {isDownloading ? '...' : 'Report'}
                </button>
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
              {activeTab === 'profile' && <ProfileTab patient={patient} copyToClipboard={copyToClipboard} />}
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

// Reusable VitalCard component enforcing strict typographic hierarchy and semantic color-coding
const getVitalStatusColor = (label, value) => {
  if (!value || value === '—' || value === '—/—') return 'bg-white border-slate-200 text-slate-900';
  const num = parseFloat(value);

  if (label.toLowerCase() === 'bmi' && !isNaN(num)) {
    if (num < 18.5) return 'bg-amber-50 border-amber-200 text-amber-900'; // Underweight
    if (num >= 25 && num < 30) return 'bg-amber-50 border-amber-200 text-amber-900'; // Overweight
    if (num >= 30) return 'bg-red-50 border-red-200 text-red-900'; // Obese
  }

  if (label.toLowerCase() === 'blood pressure' && typeof value === 'string' && value.includes('/')) {
    const [sys, dia] = value.split('/').map(Number);
    if (sys >= 180 || dia >= 120) return 'bg-red-50 border-red-200 text-red-900'; // Crisis
    if (sys >= 130 || dia >= 80) return 'bg-amber-50 border-amber-200 text-amber-900'; // High/Warning
  }

  return 'bg-white border-slate-200 text-slate-900'; // Normal default
};

const VitalCard = ({ label, value, unit }) => {
  let colorClass = getVitalStatusColor(label, value);
  const isStringMessage = typeof value === 'string' && value.length > 10;

  if (label.toLowerCase() === 'bmi' && isStringMessage) {
    colorClass = 'bg-amber-50 border-amber-200 text-amber-900';
  }

  return (
    <div className={`flex flex-col w-full p-3.5 border rounded-xl shadow-sm transition-shadow hover:shadow-md ring-1 ring-transparent hover:border-teal-200 ${colorClass}`}>
      <span className="text-xs uppercase tracking-wider opacity-60 font-bold mb-1">{label}</span>
      <div className="flex items-baseline gap-1 mt-auto">
        {isStringMessage ? (
          <span className="text-[11px] font-medium leading-tight">{value}</span>
        ) : (
          <>
            <span className="text-2xl font-bold">{value && value !== '—/—' ? value : '—'}</span>
            {unit && value && value !== '—' && value !== '—/—' && (
              <span className="text-sm font-medium opacity-70">{unit}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Tab Components
const ProfileTab = ({ patient, copyToClipboard }) => {
  const [isAddressCopied, setIsAddressCopied] = useState(false);
  const fullAddress = [patient.houseNo, patient.street, patient.city, patient.state]
    .filter(Boolean).join(', ');

  return (
    <div className="pd-tab-inner">
      <h3 className="pd-section-title-flutter">Personal Information</h3>
      <div className="pd-info-grid">
        <div className="pd-info-card">
          <div className="pd-card-header-with-action">
            <h4 className="pd-card-title">Contact Details</h4>
            {fullAddress && (
              <div className="relative group">
                <button
                  className={`pv-btn-outline-small flex items-center gap-1.5 transition-all duration-200 ${isAddressCopied ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''}`}
                  onClick={() => {
                    copyToClipboard(fullAddress, 'Address');
                    setIsAddressCopied(true);
                    setTimeout(() => setIsAddressCopied(false), 2000);
                  }}
                  aria-label="Copy full residential address to clipboard"
                >
                  {isAddressCopied ? <MdCheck size={12} className="animate-in zoom-in duration-200" /> : <MdContentCopy size={12} />}
                  {isAddressCopied ? 'Address Copied!' : 'Copy Address'}
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30 shadow-xl border border-white/10 scale-90 group-hover:scale-100 origin-bottom">
                  {isAddressCopied ? 'Address Copied!' : 'Copy to Clipboard'}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-slate-900/95"></div>
                </div>
              </div>
            )}
          </div>
          <InfoRow label="Phone Number" value={patient.phone || patient.phoneNumber} />
          <InfoRow label="Email Address" value={patient.email} />
          <InfoRow label="Residential Address" value={fullAddress || 'Not Provided'} />
        </div>

        <div className="pd-info-card">
          <h4 className="pd-card-title">Emergency & Allergies</h4>
          <InfoRow label="Emergency Contact" value={patient.emergencyContactName || <span className="text-slate-400 italic font-normal">Not Provided</span>} />
          <InfoRow label="Relationship" value={(patient.emergencyContactRelation || patient.metadata?.emergencyContactRelation) || <span className="text-slate-400 italic font-normal">Not Provided</span>} />
          <InfoRow label="Phone Number" value={patient.emergencyContactPhone || <MissingEmergencyPhone onEdit={onEdit} patient={patient} />} />
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
};

const HistoryTab = ({ patient }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Bug 27: Add New state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const patientId = patient.id || patient._id || patient.patientId;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      console.log('[HISTORY_TAB] 🔍 Fetching medical history for patient:', patientId);
      const data = await prescriptionService.fetchMedicalHistory(patientId);
      console.log('[HISTORY_TAB] ✅ Received:', data?.length || 0, 'records');
      console.log('[HISTORY_TAB] 📋 Sample data:', data?.[0]);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[HISTORY_TAB] ❌ Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchHistory();
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

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  if (loading) return <div className="pd-tab-inner"><p>Loading medical history...</p></div>;

  return (
    <div className="pd-tab-inner">
      {/* Bug 27: Interactive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="pd-section-title-flutter" style={{ marginBottom: 0 }}>Medical History Timeline</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="pv-btn-primary flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm text-sm font-medium"
        >
          <span>+ Add History</span>
        </button>
      </div>
      {history.length > 0 ? (
        <div className="pd-prescriptions-table-wrapper">
          <table className="pd-prescriptions-table">
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
                      className="pd-prescription-action-btn"
                      onClick={() => item.pdfId ? reportService.viewPdf(item.pdfId) : handleViewDetails(item)}
                      title="View Medical History"
                    >
                      <MdVisibility size={16} /> View
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

      {/* Medical History Detail Modal */}
      {showDetailModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }} onClick={handleCloseDetailModal}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
                Medical History Details
              </h2>
              <button
                onClick={handleCloseDetailModal}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <MdClose size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '14px' }}>Date: </span>
                <span style={{ color: '#1e293b', fontSize: '14px' }}>
                  {selectedItem.recordDate
                    ? new Date(selectedItem.recordDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                    : '—'
                  }
                </span>
              </div>

              <div>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '14px' }}>Hospital: </span>
                <span style={{ color: '#1e293b', fontSize: '14px' }}>
                  {selectedItem.hospitalName || '—'}
                </span>
              </div>

              <div>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '14px' }}>Doctor: </span>
                <span style={{ color: '#1e293b', fontSize: '14px' }}>
                  {selectedItem.doctorName || '—'}
                </span>
              </div>

              {selectedItem.medicalHistory && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontWeight: '600', color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Medical Summary:</div>
                  <div style={{ color: '#1e293b', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    {selectedItem.medicalHistory}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCloseDetailModal}
                style={{
                  background: '#207DC0',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PrescriptionsTab = ({ patient }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bug 27: Add New state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const patientId = patient.id || patient._id || patient.patientId;

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        console.log('[PRESCRIPTIONS_TAB] 🔍 Fetching prescriptions for patient:', patientId);
        const data = await prescriptionService.fetchPrescriptions(patientId);
        console.log('[PRESCRIPTIONS_TAB] ✅ Received:', data?.length || 0, 'prescriptions');
        console.log('[PRESCRIPTIONS_TAB] 📋 Sample data:', data?.[0]);
        setPrescriptions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[PRESCRIPTIONS_TAB] ❌ Failed to fetch prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchPrescriptions();
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

  if (loading) return <div className="pd-tab-inner"><p>Loading prescriptions...</p></div>;

  return (
    <div className="pd-tab-inner">
      {/* Bug 27: Interactive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="pd-section-title-flutter" style={{ marginBottom: 0 }}>Prescriptions</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="pv-btn-primary flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm text-sm font-medium"
        >
          <span>+ Add Prescription</span>
        </button>
      </div>
      {prescriptions.length > 0 ? (
        <div className="pd-prescriptions-table-wrapper">
          <table className="pd-prescriptions-table">
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
              {prescriptions.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatDateTime(item.prescriptionDate || item.uploadDate)}</td>
                  <td>{item.hospitalName || '—'}</td>
                  <td>{item.doctorName || '—'}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    {item.prescriptionSummary || item.diagnosis || '—'}
                  </td>
                  <td>
                    <button
                      className="pd-prescription-action-btn"
                      onClick={() => item.pdfId ? reportService.viewPdf(item.pdfId) : null}
                      disabled={!item.pdfId}
                      title="View Prescription"
                    >
                      <MdVisibility size={16} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No Prescriptions Found" />
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

const LabTab = ({ patient }) => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bug 27: Add New state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const patientId = patient.id || patient._id || patient.patientId;

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      try {
        console.log('[LAB_TAB] 🔍 Fetching lab reports for patient:', patientId);
        const data = await prescriptionService.fetchLabReports(patientId);
        console.log('[LAB_TAB] ✅ Received:', data?.length || 0, 'lab reports');
        setLabs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[LAB_TAB] ❌ Failed to fetch lab results:', error);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchLabs();
  }, [patientId]);

  if (loading) return <div className="pd-tab-inner"><p>Loading lab reports...</p></div>;

  return (
    <div className="pd-tab-inner">
      {/* Bug 27: Interactive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="pd-section-title-flutter" style={{ marginBottom: 0 }}>Lab Reports</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="pv-btn-primary flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm text-sm font-medium"
        >
          <span>+ Upload Lab Result</span>
        </button>
      </div>
      {labs.length > 0 ? (
        <div className="pd-grid-flutter">
          {labs.map((item, i) => (
            <div key={i} className="pd-info-card">
              <div className="pd-card-header-flex">
                <h4 className="pd-card-title">{item.testType || 'Lab Test'}</h4>
                {item.pdfId && (
                  <button
                    className="pd-view-pdf-btn"
                    onClick={() => reportService.viewPdf(item.pdfId)}
                    title="View Lab Report Image"
                  >
                    <MdVisibility size={18} />
                  </button>
                )}
              </div>

              <p><strong>Lab:</strong> {item.labName || '—'}</p>
              <p><strong>Date:</strong> {item.reportDate ? new Date(item.reportDate).toLocaleDateString() : '—'}</p>
              <p><strong>Category:</strong> {item.testCategory || '—'}</p>

              {item.results && item.results.length > 0 && (
                <div className="pd-lab-results">
                  <strong>Test Results:</strong>
                  <div className="pd-lab-results-list">
                    {item.results.slice(0, 3).map((result, idx) => (
                      <div key={idx} className="pd-lab-result-item">
                        <span className="pd-lab-test-name">{result.testName}</span>
                        <span className={`pd-lab-value ${result.flag !== 'Normal' ? 'abnormal' : ''}`}>
                          {result.value} {result.unit}
                        </span>
                      </div>
                    ))}
                    {item.results.length > 3 && (
                      <p className="pd-notes-small">+{item.results.length - 3} more tests</p>
                    )}
                  </div>
                </div>
              )}

              <span className={`pd-status-badge ${item.status || 'completed'}`}>
                {item.status || 'Completed'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Lab Results Found" />
      )}

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

const BillingTab = ({ patient }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const patientId = patient._id || patient.id;
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/billing/patient/${patientId}`, {
          headers: {
            'x-auth-token': localStorage.getItem('x-auth-token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken'),
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setBills(data.bills || []);
        } else {
          console.error('Failed to fetch bills:', response.status);
          setBills([]);
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    if (patient) {
      fetchBills();
    }
  }, [patient]);

  return (
    <div className="pd-tab-inner">
      <h3 className="pd-section-title-flutter">Billing & Payments</h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Loading bills...
        </div>
      ) : bills.length > 0 ? (
        <div className="pd-items-list">
          {bills.map((bill) => (
            <div key={bill._id} className="pd-prescription-item">
              <div className="pd-item-header">
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
                  {bill.billNumber}
                </h4>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {new Date(bill.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  <strong>Total Amount:</strong> ₹{bill.totalAmount?.toFixed(2) || '0.00'}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  <strong>Paid:</strong> ₹{bill.paidAmount?.toFixed(2) || '0.00'}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  <strong>Balance:</strong> ₹{bill.balanceAmount?.toFixed(2) || '0.00'}
                </p>
                {bill.paymentMethod && (
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    <strong>Payment Method:</strong> {bill.paymentMethod}
                  </p>
                )}
              </div>

              {bill.items && bill.items.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <strong style={{ fontSize: '0.875rem' }}>Items:</strong>
                  <div style={{ marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid #e0e0e0' }}>
                    {bill.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                        • {item.description} - ₹{item.amount?.toFixed(2)} ({item.quantity}x)
                      </div>
                    ))}
                    {bill.items.length > 3 && (
                      <p className="pd-notes-small">+{bill.items.length - 3} more items</p>
                    )}
                  </div>
                </div>
              )}

              <span className={`pd-status-badge ${bill.status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                {bill.status || 'Pending'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Invoices Found" />
      )}
    </div>
  );
};

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

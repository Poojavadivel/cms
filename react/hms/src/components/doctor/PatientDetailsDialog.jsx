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
  MdSearch, MdFilterList
} from 'react-icons/md';
import './PatientDetailsDialog.css';
import patientsService from '../../services/patientsService';
import prescriptionService from '../../services/prescriptionService';
import reportService from '../../services/reportService';
import { getGenderAvatar } from '../../utils/avatarHelpers';

const PatientDetailsDialog = ({ patient, isOpen, onClose, showBillingTab = true }) => {
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
const ProfileTab = ({ patient, copyToClipboard }) => {
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
              <button
                className="pv-btn-outline-small"
                onClick={() => copyToClipboard(fullAddress, 'Address')}
                title="Copy full address"
              >
                <MdContentCopy size={12} /> Copy Address
              </button>
            )}
          </div>
          <InfoRow label="Phone Number" value={patient.phone || patient.phoneNumber} />
          <InfoRow label="Email Address" value={patient.email} />
          <InfoRow label="Residential Address" value={fullAddress || 'Not Provided'} />
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
};

const HistoryTab = ({ patient }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const patientId = patient.id || patient._id || patient.patientId;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [appointments, scannedHistory] = await Promise.all([
        patientsService.fetchPatientAppointments(patientId),
        prescriptionService.fetchMedicalHistory(patientId)
      ]);

      const mappedAppointments = (Array.isArray(appointments) ? appointments : []).map(apt => ({
        id: apt._id || apt.id,
        title: apt.condition || apt.title || apt.reason || 'Medical Checkup',
        date: apt.startAt || apt.date,
        notes: apt.notes || '',
        category: apt.appointmentType || 'Consultation',
        pdfId: apt.pdfId || (apt.metadata && apt.metadata.pdfId),
        type: 'appointment'
      }));

      const mappedScanned = (Array.isArray(scannedHistory) ? scannedHistory : []).map(record => ({
        id: record._id || record.id,
        title: record.title || 'Scanned Record',
        date: record.recordDate || record.reportDate || record.uploadDate,
        notes: record.notes || record.diagnosis || '',
        category: record.category || 'Medical History',
        pdfId: record.pdfId,
        type: 'scanned'
      }));

      const combined = [...mappedAppointments, ...mappedScanned].sort((a, b) =>
        new Date(b.date || 0) - new Date(a.date || 0)
      );

      setHistory(combined);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchHistory();
  }, [patientId]);

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  if (loading) return <div className="pd-tab-inner"><p>Loading history...</p></div>;

  return (
    <div className="pd-tab-inner">
      <h3 className="pd-section-title-flutter">Medical History Timeline</h3>
      {history.length > 0 ? (
        <div className="pd-timeline-flutter">
          {history.map((item, i) => (
            <div key={i} className="pd-history-item-flutter">
              <div className="pd-history-header">
                <span className="pd-history-date">{new Date(item.date).toLocaleDateString()}</span>
                <span className="pd-history-tag">{item.category}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {item.pdfId && (
                    <button className="pd-view-pdf-btn" onClick={() => reportService.viewPdf(item.pdfId)}>
                      <MdPictureAsPdf size={16} />
                    </button>
                  )}
                  {!item.pdfId && (
                    <button className="pd-view-pdf-btn" onClick={() => handleViewDetails(item)} title="View Details">
                      <MdVisibility size={16} />
                    </button>
                  )}
                </div>
              </div>
              <h4 className="pd-history-title">{item.title}</h4>
              <p className="pd-history-notes">{item.notes}</p>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {patient.medicalHistory?.length > 0 ? (
            <div className="pd-timeline-flutter">
              {patient.medicalHistory.map((item, i) => (
                <div key={i} className="pd-history-item-flutter">{item}</div>
              ))}
            </div>
          ) : (
            <EmptyState title="No Medical History" />
          )}
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
                {selectedItem.title || 'Medical History Details'}
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
                  {selectedItem.date
                    ? new Date(selectedItem.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                    : '—'
                  }
                </span>
              </div>

              <div>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '14px' }}>Category: </span>
                <span style={{ color: '#1e293b', fontSize: '14px' }}>
                  {selectedItem.category || 'General'}
                </span>
              </div>

              <div>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '14px' }}>Type: </span>
                <span style={{ color: '#1e293b', fontSize: '14px' }}>
                  {selectedItem.type === 'appointment' ? 'Appointment' : 'Scanned Record'}
                </span>
              </div>

              {selectedItem.notes && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontWeight: '600', color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Notes:</div>
                  <div style={{ color: '#1e293b', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    {selectedItem.notes}
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
  const patientId = patient.id || patient._id || patient.patientId;

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const data = await patientsService.fetchPatientPrescriptions(patientId);
        setPrescriptions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchPrescriptions();
  }, [patientId]);

  if (loading) return <div className="pd-tab-inner"><p>Loading prescriptions...</p></div>;

  return (
    <div className="pd-tab-inner">
      <h3 className="pd-section-title-flutter">Prescriptions</h3>
      {prescriptions.length > 0 ? (
        <div className="pd-grid-flutter">
          {prescriptions.map((item, i) => (
            <div key={i} className="pd-info-card">
              <div className="pd-card-header-flex">
                <h4 className="pd-card-title">{item.medicationName || item.medicine || 'Medicine'}</h4>
                {item.pdfId && (
                  <button className="pd-view-pdf-btn" onClick={() => reportService.viewPdf(item.pdfId)}>
                    <MdPictureAsPdf size={16} />
                  </button>
                )}
              </div>
              <p><strong>Dosage:</strong> {item.dosage || '—'}</p>
              <p><strong>Frequency:</strong> {item.frequency || '—'}</p>
              {item.instructions && <p className="pd-notes-small">{item.instructions}</p>}
              <span className="pd-date-tag">{new Date(item.createdAt || item.prescriptionDate).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Prescriptions Found" />
      )}
    </div>
  );
};

const LabTab = ({ patient }) => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const patientId = patient.id || patient._id || patient.patientId;

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      try {
        const data = await patientsService.fetchPatientLabResults(patientId);
        setLabs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch lab results:', error);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchLabs();
  }, [patientId]);

  if (loading) return <div className="pd-tab-inner"><p>Loading lab reports...</p></div>;

  return (
    <div className="pd-tab-inner">
      <h3 className="pd-section-title-flutter">Lab Reports</h3>
      {labs.length > 0 ? (
        <div className="pd-grid-flutter">
          {labs.map((item, i) => (
            <div key={i} className="pd-info-card">
              <div className="pd-card-header-flex">
                <h4 className="pd-card-title">{item.testName || item.testType || 'Lab Test'}</h4>
                {item.pdfId && (
                  <button className="pd-view-pdf-btn" onClick={() => reportService.viewPdf(item.pdfId)}>
                    <MdPictureAsPdf size={16} />
                  </button>
                )}
              </div>
              <p><strong>Result:</strong> {item.result || item.summary || '—'}</p>
              <span className={`pd-status-badge ${item.status || 'Completed'}`}>{item.status || 'Completed'}</span>
              <span className="pd-date-tag">{new Date(item.date || item.uploadDate).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Lab Results Found" />
      )}
    </div>
  );
};

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

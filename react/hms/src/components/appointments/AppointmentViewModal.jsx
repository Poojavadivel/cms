/**
 * AppointmentViewModal.jsx
 * Full-screen appointment view modal with tabs
 * Matches Flutter's DoctorAppointmentPreview
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdEdit, MdPerson, MdMedicalServices, MdDescription, MdScience, MdPayment } from 'react-icons/md';
import './AppointmentViewModal.css';
import appointmentsService from '../../services/appointmentsService';

const AppointmentViewModal = ({ isOpen, onClose, appointmentId, onEdit, onPatientClick }) => {
  const [appointment, setAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <MdPerson /> },
    { id: 'medical-history', label: 'Medical History', icon: <MdMedicalServices /> },
    { id: 'prescription', label: 'Prescription', icon: <MdDescription /> },
    { id: 'lab-results', label: 'Lab Results', icon: <MdScience /> },
    { id: 'billings', label: 'Billings', icon: <MdPayment /> }
  ];

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appointmentId]);

  const fetchAppointment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await appointmentsService.fetchAppointmentById(appointmentId);
      
      // Transform nested patient object if present
      const transformedData = { ...data };
      if (data.patientId && typeof data.patientId === 'object') {
        const patient = data.patientId;
        transformedData.clientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        
        // Handle phone (could be object or string)
        if (typeof patient.phone === 'object') {
          transformedData.phoneNumber = patient.phone?.phone || patient.phone?.number || '';
        } else {
          transformedData.phoneNumber = patient.phone || patient.phoneNumber || '';
        }
        
        // Handle email (could be object or string)
        if (typeof patient.email === 'object') {
          transformedData.patientEmail = patient.email?.email || patient.email?.address || '';
        } else {
          transformedData.patientEmail = patient.email || '';
        }
        
        transformedData.patientObjectId = patient._id;
        transformedData.patientId = patient.metadata?.patientCode || patient._id || 'N/A';
        if (patient.gender) {
          transformedData.gender = patient.gender;
        }
        if (patient.metadata) {
          transformedData.metadata = { ...transformedData.metadata, ...patient.metadata };
        }
      }
      
      // Transform nested doctor object if present
      if (data.doctorId && typeof data.doctorId === 'object') {
        const doctor = data.doctorId;
        transformedData.doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
      }
      
      setAppointment(transformedData);
    } catch (err) {
      setError(err.message || 'Failed to load appointment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#0EA5E9',
      completed: '#10B981',
      cancelled: '#EF4444',
      pending: '#F59E0B'
    };
    return colors[status?.toLowerCase()] || '#94A3B8';
  };

  const getGenderIcon = (gender) => {
    return gender?.toLowerCase() === 'female' ? '👩' : '👨';
  };

  return (
    <div className="appointment-view-overlay">
      <div className="appointment-view-container">
        {/* Close Button */}
        <button className="appointment-view-close" onClick={onClose}>
          <MdClose size={28} />
        </button>

        {/* Content */}
        {isLoading ? (
          <div className="appointment-view-loading">
            <div className="spinner"></div>
            <p>Loading appointment details...</p>
          </div>
        ) : error ? (
          <div className="appointment-view-error">
            <p>{error}</p>
            <button onClick={onClose} className="btn-error-close">Close</button>
          </div>
        ) : appointment ? (
          <>
            {/* Header Card */}
            <div className="appointment-view-header">
              <div className="header-left">
                <div className="patient-avatar-large">
                  <span>{getGenderIcon(appointment.gender || appointment.metadata?.gender)}</span>
                </div>
                <div className="patient-info-header">
                  <h2 
                    className="patient-name-clickable"
                    onClick={() => {
                      const patientId = appointment.patientObjectId || 
                                       (typeof appointment.patientId === 'object' ? appointment.patientId?._id : appointment.patientId);
                      onPatientClick && patientId && onPatientClick(patientId);
                    }}
                  >
                    {appointment.clientName || 'Unknown Patient'}
                  </h2>
                  <div className="patient-meta">
                    <span>ID: {
                      (() => {
                        if (typeof appointment.patientId === 'object' && appointment.patientId) {
                          return String(appointment.patientId.metadata?.patientCode || appointment.patientId._id || 'N/A');
                        }
                        return String(appointment.patientId || 'N/A');
                      })()
                    }</span>
                    <span>•</span>
                    <span>{
                      (() => {
                        if (typeof appointment.gender === 'object') {
                          return 'N/A';
                        }
                        return String(appointment.gender || appointment.metadata?.gender || 'N/A');
                      })()
                    }</span>
                  </div>
                </div>
              </div>
              <div className="header-right">
                <div 
                  className="status-badge-large" 
                  style={{ 
                    backgroundColor: `${getStatusColor(appointment.status)}20`,
                    color: getStatusColor(appointment.status)
                  }}
                >
                  {String(appointment.status || 'Unknown')}
                </div>
                <button className="btn-edit-header" onClick={() => onEdit(appointment)}>
                  <MdEdit size={18} />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="appointment-details-card">
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{String(appointment.date || 'Not set')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{String(appointment.time || 'Not set')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{String(appointment.appointmentType || 'General')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mode:</span>
                <span className="detail-value">{String(appointment.mode || 'In-clinic')}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="appointment-tabs-section">
              {/* Tab Headers */}
              <div className="tabs-header">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="tabs-content">
                {activeTab === 'profile' && (
                  <ProfileTab appointment={appointment} />
                )}
                {activeTab === 'medical-history' && (
                  <MedicalHistoryTab appointment={appointment} />
                )}
                {activeTab === 'prescription' && (
                  <PrescriptionTab appointment={appointment} />
                )}
                {activeTab === 'lab-results' && (
                  <LabResultsTab appointment={appointment} />
                )}
                {activeTab === 'billings' && (
                  <BillingsTab appointment={appointment} />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="appointment-view-error">
            <p>No appointment data available</p>
            <button onClick={onClose} className="btn-error-close">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Tab Components

const ProfileTab = ({ appointment }) => {
  return (
    <div className="tab-content-wrapper">
      <div className="info-section">
        <h3>Personal Information</h3>
        <div className="info-grid">
          <div className="info-field">
            <label>Full Name</label>
            <p>{String(appointment.clientName || 'N/A')}</p>
          </div>
          <div className="info-field">
            <label>Patient ID</label>
            <p>{
              (() => {
                if (typeof appointment.patientId === 'object' && appointment.patientId) {
                  return String(appointment.patientId.metadata?.patientCode || appointment.patientId._id || 'N/A');
                }
                return String(appointment.patientId || 'N/A');
              })()
            }</p>
          </div>
          <div className="info-field">
            <label>Phone Number</label>
            <p>{
              (() => {
                if (typeof appointment.phoneNumber === 'object' && appointment.phoneNumber) {
                  return String(appointment.phoneNumber.phone || appointment.phoneNumber.number || 'N/A');
                }
                return String(appointment.phoneNumber || 'N/A');
              })()
            }</p>
          </div>
          <div className="info-field">
            <label>Gender</label>
            <p>{
              (() => {
                if (typeof appointment.gender === 'object') {
                  return 'N/A';
                }
                return String(appointment.gender || appointment.metadata?.gender || 'N/A');
              })()
            }</p>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>Appointment Details</h3>
        <div className="info-grid">
          <div className="info-field">
            <label>Chief Complaint</label>
            <p>{String(appointment.chiefComplaint || 'None recorded')}</p>
          </div>
          <div className="info-field">
            <label>Location</label>
            <p>{String(appointment.location || 'N/A')}</p>
          </div>
          <div className="info-field">
            <label>Duration</label>
            <p>{String(appointment.durationMinutes || 30)} minutes</p>
          </div>
          <div className="info-field">
            <label>Priority</label>
            <p>{String(appointment.priority || 'Normal')}</p>
          </div>
        </div>
      </div>

      {/* Vitals */}
      {(appointment.heightCm || appointment.weightKg || appointment.bp || appointment.heartRate || appointment.spo2) && (
        <div className="info-section">
          <h3>Vitals</h3>
          <div className="info-grid">
            {appointment.heightCm && (
              <div className="info-field">
                <label>Height</label>
                <p>{String(appointment.heightCm)} cm</p>
              </div>
            )}
            {appointment.weightKg && (
              <div className="info-field">
                <label>Weight</label>
                <p>{String(appointment.weightKg)} kg</p>
              </div>
            )}
            {appointment.bp && (
              <div className="info-field">
                <label>Blood Pressure</label>
                <p>{String(appointment.bp)}</p>
              </div>
            )}
            {appointment.heartRate && (
              <div className="info-field">
                <label>Heart Rate</label>
                <p>{String(appointment.heartRate)} bpm</p>
              </div>
            )}
            {appointment.spo2 && (
              <div className="info-field">
                <label>SpO2</label>
                <p>{String(appointment.spo2)}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {appointment.notes && (
        <div className="info-section">
          <h3>Notes</h3>
          <p className="notes-text">{String(appointment.notes)}</p>
        </div>
      )}
    </div>
  );
};

const MedicalHistoryTab = ({ appointment }) => {
  return (
    <div className="tab-content-wrapper">
      <div className="empty-state">
        <MdMedicalServices size={64} color="#CBD5E1" />
        <h3>Medical History</h3>
        <p>Medical history information will be displayed here</p>
        <p className="empty-note">Feature coming soon</p>
      </div>
    </div>
  );
};

const PrescriptionTab = ({ appointment }) => {
  return (
    <div className="tab-content-wrapper">
      <div className="empty-state">
        <MdDescription size={64} color="#CBD5E1" />
        <h3>Prescriptions</h3>
        <p>Prescription details will be displayed here</p>
        <p className="empty-note">Feature coming soon</p>
      </div>
    </div>
  );
};

const LabResultsTab = ({ appointment }) => {
  return (
    <div className="tab-content-wrapper">
      <div className="empty-state">
        <MdScience size={64} color="#CBD5E1" />
        <h3>Lab Results</h3>
        <p>Laboratory test results will be displayed here</p>
        <p className="empty-note">Feature coming soon</p>
      </div>
    </div>
  );
};

const BillingsTab = ({ appointment }) => {
  return (
    <div className="tab-content-wrapper">
      <div className="empty-state">
        <MdPayment size={64} color="#CBD5E1" />
        <h3>Billing Information</h3>
        <p>Billing and payment details will be displayed here</p>
        <p className="empty-note">Feature coming soon</p>
      </div>
    </div>
  );
};

export default AppointmentViewModal;

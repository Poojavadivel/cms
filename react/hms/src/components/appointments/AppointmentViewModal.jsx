/**
 * AppointmentViewModal.jsx
 * Full-screen appointment view modal with tabs
 * Matches Flutter's DoctorAppointmentPreview
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdEdit, MdPerson, MdMedicalServices, MdDescription, MdScience, MdPayment, MdPhone, MdEmail, MdLocationOn, MdWork, MdCalendarToday, MdMale, MdFemale } from 'react-icons/md';
import './AppointmentViewModal.css';
import appointmentsService from '../../services/appointmentsService';
import patientsService from '../../services/patientsService';
import { getGenderAvatar } from '../../utils/avatarHelpers';

const AppointmentViewModal = ({ isOpen, onClose, appointmentId, onEdit, onPatientClick }) => {
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
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
      let patientIdToFetch = null;

      if (data.patientId && typeof data.patientId === 'object') {
        const patientObj = data.patientId;
        transformedData.clientName = `${patientObj.firstName || ''} ${patientObj.lastName || ''}`.trim();

        // Handle phone (could be object or string)
        if (typeof patientObj.phone === 'object') {
          transformedData.phoneNumber = patientObj.phone?.phone || patientObj.phone?.number || '';
        } else {
          transformedData.phoneNumber = patientObj.phone || patientObj.phoneNumber || '';
        }

        // Handle email (could be object or string)
        if (typeof patientObj.email === 'object') {
          transformedData.patientEmail = patientObj.email?.email || patientObj.email?.address || '';
        } else {
          transformedData.patientEmail = patientObj.email || '';
        }

        transformedData.patientObjectId = patientObj._id;
        patientIdToFetch = patientObj._id;
        transformedData.patientId = patientObj.metadata?.patientCode || patientObj._id || 'N/A';
        if (patientObj.gender) {
          transformedData.gender = patientObj.gender;
        }
        if (patientObj.metadata) {
          transformedData.metadata = { ...transformedData.metadata, ...patientObj.metadata };
        }

        // Set patient data if already available
        setPatient(patientObj);
      } else if (typeof data.patientId === 'string') {
        patientIdToFetch = data.patientId;
        transformedData.patientObjectId = data.patientId;
      }

      // Transform nested doctor object if present
      if (data.doctorId && typeof data.doctorId === 'object') {
        const doctor = data.doctorId;
        transformedData.doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
      }

      setAppointment(transformedData);

      // Fetch full patient details if we have patientId and patient data is not complete
      if (patientIdToFetch && !patient) {
        try {
          const patientData = await patientsService.fetchPatientById(patientIdToFetch);
          setPatient(patientData);
        } catch (patientErr) {
          console.warn('Failed to fetch patient details:', patientErr);
          // Continue without patient details
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getGenderIcon = (gender) => {
    return gender?.toLowerCase() === 'female' ? <MdFemale size={16} /> : <MdMale size={16} />;
  };

  // Extract patient data for header
  const getPatientData = () => {
    const patientData = patient || (appointment?.patientId && typeof appointment.patientId === 'object' ? appointment.patientId : null);
    const apptData = appointment || {};

    const name = apptData.clientName ||
      (patientData ? `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() : 'Unknown Patient');

    const gender = apptData.gender || patientData?.gender || 'Male';
    const isFemale = gender.toLowerCase() === 'female';

    // Phone
    let phone = '';
    if (apptData.phoneNumber) {
      phone = typeof apptData.phoneNumber === 'object'
        ? (apptData.phoneNumber.phone || apptData.phoneNumber.number || '')
        : apptData.phoneNumber;
    } else if (patientData?.phone) {
      phone = typeof patientData.phone === 'object'
        ? (patientData.phone.phone || patientData.phone.number || '')
        : patientData.phone;
    }

    // Email
    let email = '';
    if (apptData.patientEmail) {
      email = typeof apptData.patientEmail === 'object'
        ? (apptData.patientEmail.email || apptData.patientEmail.address || '')
        : apptData.patientEmail;
    } else if (patientData?.email) {
      email = typeof patientData.email === 'object'
        ? (patientData.email.email || patientData.email.address || '')
        : patientData.email;
    }

    // Location
    const location = patientData?.address?.city
      ? `${patientData.address.city}${patientData.address.state ? `, ${patientData.address.state}` : ''}`
      : apptData.location || patientData?.location || 'Location not set';

    // Occupation
    const occupation = patientData?.profession ||
      patientData?.metadata?.profession ||
      apptData.occupation ||
      'Not specified';

    // Date of Birth and Age
    let dob = '';
    let age = 0;
    if (patientData?.dateOfBirth) {
      try {
        const dobDate = new Date(patientData.dateOfBirth);
        dob = dobDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const today = new Date();
        age = today.getFullYear() - dobDate.getFullYear();
        if (today.getMonth() < dobDate.getMonth() ||
          (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())) {
          age--;
        }
      } catch (e) {
        console.warn('Error parsing date of birth:', e);
      }
    } else if (patientData?.age) {
      age = typeof patientData.age === 'number' ? patientData.age : parseInt(patientData.age) || 0;
    } else if (apptData.patientAge) {
      age = typeof apptData.patientAge === 'number' ? apptData.patientAge : parseInt(apptData.patientAge) || 0;
    }

    // Vitals
    const weightKg = apptData.weightKg || patientData?.vitals?.weightKg || patientData?.weight || null;
    const heightCm = apptData.heightCm || patientData?.vitals?.heightCm || patientData?.height || null;
    const bp = apptData.bp || patientData?.vitals?.bp || patientData?.bp || '—';

    // Calculate BMI
    let bmi = null;
    if (weightKg && heightCm) {
      bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
    } else if (apptData.bmi) {
      bmi = parseFloat(apptData.bmi).toFixed(1);
    } else if (patientData?.vitals?.bmi) {
      bmi = parseFloat(patientData.vitals.bmi).toFixed(1);
    } else if (patientData?.bmi) {
      bmi = parseFloat(patientData.bmi).toFixed(1);
    }

    // Diagnosis (from appointment or patient)
    const diagnosis = apptData.diagnosis ||
      patientData?.diagnosis ||
      patientData?.metadata?.diagnosis ||
      patientData?.medicalHistory ||
      [];
    const diagnosisArray = Array.isArray(diagnosis) ? diagnosis : [];

    // Health Barriers
    const barriers = apptData.barriers ||
      patientData?.barriers ||
      patientData?.metadata?.barriers ||
      [];
    const barriersArray = Array.isArray(barriers) ? barriers : [];

    // Lifestyle indicators (from patient metadata - only show if explicitly set)
    const noAlcohol = patientData?.metadata?.noAlcohol === true || patientData?.metadata?.alcohol === false;
    const noSmoker = patientData?.metadata?.noSmoker === true || patientData?.metadata?.smoker === false;

    return {
      name,
      gender,
      isFemale,
      phone,
      email,
      location,
      occupation,
      dob,
      age,
      weightKg,
      heightCm,
      bp,
      bmi,
      diagnosis: diagnosisArray,
      barriers: barriersArray,
      noAlcohol,
      noSmoker,
      avatarUrl: patientData?.avatarUrl || patientData?.metadata?.avatarUrl || null,
    };
  };

  return (
    <div className="appointment-view-overlay">
      {/* Floating Close Button */}
      <button className="appointment-close-floating" onClick={onClose}>
        <MdClose size={32} />
      </button>

      <div className="appointment-view-container">

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
            {/* Header Card - Matching Image Design */}
            {(() => {
              const patientData = getPatientData();
              const avatarSrc = patientData.avatarUrl || getGenderAvatar(patientData.gender);

              return (
                <div className="appointment-view-header-new">
                  <div className="header-main-content">
                    {/* Left Section: Avatar with Lifestyle Indicators */}
                    <div className="header-avatar-section">
                      <div className="patient-avatar-container">
                        <img
                          src={avatarSrc}
                          alt={patientData.name}
                          className="patient-avatar-image"
                          onError={(e) => {
                            e.target.src = getGenderAvatar(patientData.gender);
                          }}
                        />
                        {/* Lifestyle Indicators Overlay */}
                        <div className="lifestyle-indicators">
                          {patientData.noAlcohol && (
                            <div className="lifestyle-badge no-alcohol">
                              <span className="lifestyle-label">Alcohol</span>
                            </div>
                          )}
                          {patientData.noSmoker && (
                            <div className="lifestyle-badge no-smoker">
                              <span className="lifestyle-label">Smoker</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center Section: Patient Info */}
                    <div className="header-info-section">
                      {/* Name with Contact Icons */}
                      <div className="patient-name-row">
                        <h2
                          className="patient-name-main"
                          onClick={() => {
                            const patientId = appointment.patientObjectId ||
                              (typeof appointment.patientId === 'object' ? appointment.patientId?._id : appointment.patientId);
                            onPatientClick && patientId && onPatientClick(patientId);
                          }}
                        >
                          {patientData.name}
                        </h2>
                        <div className="contact-icons-group">
                          {patientData.phone && (
                            <button className="contact-icon-btn" title={patientData.phone}>
                              <MdPhone size={14} />
                            </button>
                          )}
                          {patientData.email && (
                            <button className="contact-icon-btn" title={patientData.email}>
                              <MdEmail size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Personal Information Pills */}
                      <div className="personal-info-pills">
                        <span className="info-pill">
                          {getGenderIcon(patientData.gender)}
                          <span>{patientData.gender}</span>
                        </span>
                        <span className="info-pill">
                          <MdLocationOn size={14} />
                          <span>{patientData.location}</span>
                        </span>
                        <span className="info-pill">
                          <MdWork size={14} />
                          <span>{patientData.occupation}</span>
                        </span>
                        {patientData.dob && (
                          <span className="info-pill">
                            <MdCalendarToday size={14} />
                            <span>{patientData.dob} {patientData.age ? `(${patientData.age} years)` : ''}</span>
                          </span>
                        )}
                      </div>

                      {/* Health Metrics Cards */}
                      <div className="health-metrics-row">
                        {patientData.bmi && (
                          <div className="health-metric-card">
                            <span className="metric-value">{patientData.bmi}</span>
                            <span className="metric-label">BMI</span>
                            {/* Change indicator - would need previous value from backend */}
                            {/* <span className="metric-change positive">↓ 10</span> */}
                          </div>
                        )}
                        {patientData.weightKg && (
                          <div className="health-metric-card">
                            <span className="metric-value">{patientData.weightKg} <small>kg</small></span>
                            <span className="metric-label">Weight</span>
                            {/* <span className="metric-change positive">↓ 10 kg</span> */}
                          </div>
                        )}
                        {patientData.heightCm && (
                          <div className="health-metric-card">
                            <span className="metric-value">{patientData.heightCm} <small>Cm</small></span>
                            <span className="metric-label">Height</span>
                          </div>
                        )}
                        {patientData.bp && patientData.bp !== '—' && (
                          <div className="health-metric-card">
                            <span className="metric-value">{patientData.bp}</span>
                            <span className="metric-label">Blood pressure</span>
                            {/* <span className="metric-change negative">↑ 10</span> */}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section: Edit Button, Diagnosis, Barriers */}
                    <div className="header-right-section">
                      <button className="edit-button-header" onClick={() => onEdit(appointment)}>
                        <MdEdit size={14} />
                        <span>Edit</span>
                      </button>

                      {/* Own Diagnosis */}
                      {patientData.diagnosis.length > 0 && (
                        <div className="diagnosis-section">
                          <span className="section-label">Own diagnosis</span>
                          <div className="tags-container">
                            {patientData.diagnosis.map((diag, idx) => (
                              <span key={idx} className="diagnosis-tag">{diag}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Health Barriers */}
                      {patientData.barriers.length > 0 && (
                        <div className="barriers-section">
                          <span className="section-label">Health barriers</span>
                          <div className="tags-container">
                            {patientData.barriers.map((barrier, idx) => (
                              <span key={idx} className="barrier-tag">{barrier}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}



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

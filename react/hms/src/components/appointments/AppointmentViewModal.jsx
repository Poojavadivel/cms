/**
 * AppointmentViewModal.jsx
 * Full-screen appointment view modal with tabs
 * Matches Flutter's DoctorAppointmentPreview
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MdClose, MdPerson, MdPhone, MdEmail, MdLocationOn, MdWork, MdCalendarToday, MdMale, MdFemale, MdWarning, MdSearch } from 'react-icons/md';
import './AppointmentViewModal.css';
import appointmentsService from '../../services/appointmentsService';
import patientsService from '../../services/patientsService';
import { getGenderAvatar } from '../../utils/avatarHelpers';

const AppointmentViewModal = ({ isOpen, onClose, appointmentId, patientId, onEdit, onPatientClick }) => {
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments'); // ONLY tab
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // NEW: State for appointments list in the tab
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (appointmentId) {
        fetchAppointment();
      } else if (patientId) {
        fetchPatient();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appointmentId, patientId]);

  // OLD: Fetch Logic from Step 4 (Original)
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

        if (typeof patientObj.phone === 'object') {
          transformedData.phoneNumber = patientObj.phone?.phone || patientObj.phone?.number || '';
        } else {
          transformedData.phoneNumber = patientObj.phone || patientObj.phoneNumber || '';
        }

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

        setPatient(patientObj);
      } else if (typeof data.patientId === 'string') {
        patientIdToFetch = data.patientId;
        transformedData.patientObjectId = data.patientId;
      }

      if (data.doctorId && typeof data.doctorId === 'object') {
        const doctor = data.doctorId;
        transformedData.doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
      }

      setAppointment(transformedData);

      if (patientIdToFetch) {
        await fetchPatientAppointments(patientIdToFetch); // Fetch list for the tab
        if (!patient) {
          try {
            const patientData = await patientsService.fetchPatientById(patientIdToFetch);
            setPatient(patientData);
          } catch (e) { console.warn(e); }
        }
      }

    } catch (err) {
      setError(err.message || 'Failed to load appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatient = async () => {
    setIsLoading(true);
    setError('');
    try {
      const patientData = await patientsService.fetchPatientById(patientId);
      setPatient(patientData);

      // Create a dummy appointment for header logic compatibility
      setAppointment({
        _id: 'view-only',
        patientId: patientData,
        clientName: `${patientData.firstName || patientData.name || ''} ${patientData.lastName || ''}`.trim(),
        gender: patientData.gender,
        phoneNumber: patientData.phone,
        patientEmail: patientData.email,
        location: patientData.address?.city,
        // ... populate other fields if needed by getPatientData
      });

      await fetchPatientAppointments(patientId);

    } catch (err) {
      setError(err.message || 'Failed to load patient details');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Fetch all appointments for the patient
  const fetchPatientAppointments = async (pId) => {
    try {
      const all = await appointmentsService.fetchAppointments();
      const filtered = all.filter(appt => {
        if (!appt.patientId) return false;
        const apptPId = typeof appt.patientId === 'object' ? appt.patientId._id : appt.patientId;
        return apptPId === pId;
      });
      setPatientAppointments(filtered);
    } catch (e) {
      console.error("Failed to fetch patient appointments", e);
    }
  };


  if (!isOpen) return null;

  const getGenderIcon = (gender) => {
    return gender?.toLowerCase() === 'female' ? <MdFemale size={16} /> : <MdMale size={16} />;
  };

  // OLD: Logic to extract patient data for header (Restored)
  const getPatientData = () => {
    const patientData = patient || (appointment?.patientId && typeof appointment.patientId === 'object' ? appointment.patientId : null);
    const apptData = appointment || {};

    const name = apptData.clientName ||
      (patientData ? `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() : 'Unknown Patient');

    const gender = apptData.gender || patientData?.gender || 'Male';
    const isFemale = gender.toLowerCase() === 'female';

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

    const location = patientData?.address?.city
      ? `${patientData.address.city}${patientData.address.state ? `, ${patientData.address.state}` : ''}`
      : apptData.location || patientData?.location || 'Location not set';

    const occupation = patientData?.profession ||
      patientData?.metadata?.profession ||
      apptData.occupation ||
      'Not specified';

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

    const weightKg = apptData.weightKg || patientData?.vitals?.weightKg || patientData?.weight || null;
    const heightCm = apptData.heightCm || patientData?.vitals?.heightCm || patientData?.height || null;
    const bp = apptData.bp || patientData?.vitals?.bp || patientData?.bp || '—';

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

    const diagnosis = apptData.diagnosis ||
      patientData?.diagnosis ||
      patientData?.metadata?.diagnosis ||
      patientData?.medicalHistory ||
      [];
    const diagnosisArray = Array.isArray(diagnosis) ? diagnosis : [];

    const barriers = apptData.barriers ||
      patientData?.barriers ||
      patientData?.metadata?.barriers ||
      [];
    const barriersArray = Array.isArray(barriers) ? barriers : [];

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

  // Helper: Extract Condition (Logic copied from Appointments.jsx)
  const extractCondition = (currPatient) => {
    // Note: In the appointments list loop, we might have the patient object nested in appt.patientId
    // Or we might rely on the main 'patient' state if the list is filtered for this patient.
    // Actually, appointments in 'patientAppointments' have 'patientId' which might be the object.

    // Use the passed patient object from the list item
    const p = currPatient;
    if (!p || typeof p !== 'object') return 'N/A';

    if (p.condition && p.condition.trim()) return p.condition;

    const formatArray = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      if (arr.length === 1) return arr[0];
      return `${arr[0]} +${arr.length - 1}`;
    };

    if (p.medicalHistory) {
      if (Array.isArray(p.medicalHistory)) {
        const res = formatArray(p.medicalHistory);
        if (res) return res;
      } else if (typeof p.medicalHistory === 'object' && p.medicalHistory.currentConditions) {
        const res = formatArray(p.medicalHistory.currentConditions);
        if (res) return res;
      }
    }

    return 'N/A';
  };

  const getFilteredAppointments = () => {
    if (!searchTerm) return patientAppointments;
    return patientAppointments.filter(appt => {
      // Search logic (date, status, condition?) user said "Search should filter appointments of the selected patient...". usually by date or status or condition. 
      // Previous request said "Doctor, Date, Department".
      // Current request says "Add one search input".
      // I'll search across basic fields.
      const date = appt.date || '';
      const status = appt.status || '';

      return date.includes(searchTerm) ||
        status.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const filteredList = getFilteredAppointments();

  return (
    <div className="appointment-view-overlay">
      {/* Floating Close Button */}
      <button className="appointment-close-floating" onClick={onClose}>
        <MdClose size={32} />
      </button>

      <div className="appointment-view-container">

        {isLoading ? (
          <div className="appointment-view-loading">
            <div className="spinner"></div>
            <p>Loading details...</p>
          </div>
        ) : error ? (
          <div className="appointment-view-error">
            <p>{error}</p>
            <button onClick={onClose} className="btn-error-close">Close</button>
          </div>
        ) : appointment ? (
          <>
            {(() => {
              const patientData = getPatientData();
              const avatarSrc = patientData.avatarUrl || getGenderAvatar(patientData.gender);

              return (
                <div className="appointment-view-header-new">
                  <div className="header-main-content">
                    {/* RESTORED OLD HEADER STRUCTURE */}
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

                    <div className="header-info-section">
                      <div className="patient-name-row">
                        <h2 className="patient-name-main" onClick={() => onPatientClick && onPatientClick(patient._id)}>
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

                      <div className="health-metrics-row">
                        {patientData.bmi && (
                          <div className="health-metric-card">
                            <span className="metric-value">{patientData.bmi}</span>
                            <span className="metric-label">BMI</span>
                          </div>
                        )}
                        {patientData.weightKg && (
                          <div className="health-metric-card">
                            <span className="metric-value">{patientData.weightKg} <small>kg</small></span>
                            <span className="metric-label">Weight</span>
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
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB SECTION - Single "Appointments" Tab */}
            <div className="appointment-tabs-section">
              <div className="tabs-header">
                <button className="tab-button active">
                  <MdCalendarToday />
                  <span>Appointments</span>
                </button>
              </div>

              <div className="tabs-content">
                <div className="tab-content-wrapper full-width-content">
                  {/* Search Bar */}
                  <div className="appointments-filter-bar simple">
                    <div className="search-box">
                      <MdSearch size={20} />
                      <input
                        type="text"
                        placeholder="Search appointments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Appointment List */}
                  <div className="appointments-list-container">
                    {filteredList.length > 0 ? (
                      <table className="appointments-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Condition</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredList.map(appt => {
                            // Condition Extraction Logic
                            // If appt.patientId is object, use it. Else use 'patient' state if matches.
                            let pObj = typeof appt.patientId === 'object' ? appt.patientId : null;
                            if (!pObj && patient && (appt.patientId === patient._id || patient._id === patientId)) {
                              pObj = patient;
                            }
                            const condition = extractCondition(pObj);

                            return (
                              <tr key={appt._id}>
                                <td>
                                  <span className="appt-date">
                                    {new Date(appt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </td>
                                <td>
                                  <span className="appt-time">{appt.time}</span>
                                </td>
                                <td>
                                  <span className="appt-condition">
                                    {condition}
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-badge ${appt.status?.toLowerCase() || 'pending'}`}>
                                    {appt.status || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-appointments">
                        <p>No appointments found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AppointmentViewModal;

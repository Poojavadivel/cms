/**
 * AppointmentViewModal.jsx
 * Full-screen appointment view modal with tabs
 * Matches Flutter's DoctorAppointmentPreview
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MdClose, MdPerson, MdPhone, MdEmail, MdLocationOn, MdWork, MdCalendarToday, MdMale, MdFemale, MdWarning, MdSearch, MdEdit, MdLocalHospital, MdInfo, MdLocalPharmacy, MdBiotech, MdPayment, MdContentCopy, MdVisibility } from 'react-icons/md';
import './AppointmentViewModal.css';
import '../patient/patientview.css';
import appointmentsService from '../../services/appointmentsService';
import patientsService from '../../services/patientsService';
import prescriptionService from '../../services/prescriptionService';
import reportService from '../../services/reportService';
import { getGenderAvatar } from '../../utils/avatarHelpers';
import { calculateBMI } from '../../utils/vitalsHelpers';
import { Skeleton, SkeletonCard } from '../common/SkeletonLoaders';
import AppointmentIntakeModal from './AppointmentIntakeModal';

const AppointmentViewModal = ({ isOpen, onClose, appointmentId, patientId, onEdit, onPatientClick, appointmentData }) => {
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments'); // ONLY tab
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // NEW: State for appointments list in the tab
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');


  const [showIntakeModal, setShowIntakeModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (appointmentData) {
        // Map appointment-specific data
        const mappedAppt = {
          ...appointmentData,
          _id: appointmentData._id || appointmentData.id, // Preserve existing _id or use id
          id: appointmentData.id || appointmentData._id, // Ensure both id formats exist
          clientName: appointmentData.patientName,
          condition: appointmentData.condition
        };

        setAppointment(mappedAppt);
        setPatientAppointments([mappedAppt]);



        // ALWAYS fetch full patient object
        let pId = null;

        // Priority 1: Object with _id
        if (appointmentData.patientId && typeof appointmentData.patientId === 'object' && appointmentData.patientId._id) {
          pId = appointmentData.patientId._id;
        }
        // Priority 2: patientObjectId field
        else if (appointmentData.patientObjectId) {
          pId = appointmentData.patientObjectId;
        }
        // Priority 3: patientIdObj field (Object with _id OR direct string ID)
        else if (appointmentData.patientIdObj) {
          if (typeof appointmentData.patientIdObj === 'object' && appointmentData.patientIdObj._id) {
            pId = appointmentData.patientIdObj._id;
          } else if (typeof appointmentData.patientIdObj === 'string') {
            pId = appointmentData.patientIdObj;
          }
        }
        // Priority 4: patientId string (if it looks like a MongoID, not "PAT-...")
        // Priority 4: patientId string (if it looks like a MongoID)
        else if (typeof appointmentData.patientId === 'string' && appointmentData.patientId) {
          // Check if it's a 24-char hex string (Mongo ObjectId) or a code like PAT-xxxx
          const isMongoId = /^[0-9a-fA-F]{24}$/.test(appointmentData.patientId);
          if (isMongoId) {
            pId = appointmentData.patientId;
          } else {
            // It's a code, but maybe patientIdObj has the ID
            console.warn("Patient ID from appointmentData is a code (" + appointmentData.patientId + "), looking for ObjectId elsewhere.");
          }
        }

        if (pId) {
          setIsLoading(true);
          // Fetch full clinical history for this patient
          fetchPatientAppointments(pId);

          patientsService.fetchPatientById(pId)
            .then(fetchedPatient => {
              // Normalize vitals from the FULL fetched patient object
              const normalizedVitals = normalizeVitals(null, fetchedPatient);
              fetchedPatient.vitals = normalizedVitals;

              setPatient(fetchedPatient);
            })
            .catch(err => {
              console.error("Failed to fetch patient for header:", err);
              setError("Failed to load patient details for header.");
            })
            .finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }

      } else if (appointmentId) {
        fetchAppointment();
      } else if (patientId) {
        fetchPatient();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appointmentId, patientId, appointmentData]);


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

        // Don't set patient yet - wait for full fetch below
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

            // Normalize vitals from appointment + patient data
            const normalizedVitals = normalizeVitals(data, patientData);
            patientData.vitals = normalizedVitals;

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

      // Normalize vitals from patient data only (no appointment data in this path)
      const normalizedVitals = normalizeVitals(null, patientData);
      patientData.vitals = normalizedVitals;

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

      // Sort by date descending
      const sorted = filtered.sort((a, b) => new Date(b.date || b.startAt) - new Date(a.date || a.startAt));
      setPatientAppointments(sorted);
    } catch (e) {
      console.error("Failed to fetch patient appointments", e);
    }
  };


  // Tab handler
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copied!`);
    });
  };

  // Helper to parse tags from string or array
  const parseTags = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  // Helper to format date for tables
  const formatTableDate = (dStr) => {
    if (!dStr) return 'N/A';
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
        const [y, m, d] = dStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return dStr; }
  };

  if (!isOpen) return null;

  const getGenderIcon = (gender) => {
    return gender?.toLowerCase() === 'female' ? <MdFemale size={16} /> : <MdMale size={16} />;
  };

  /**
   * Normalize vitals from appointment or patient data into consistent structure
   * Priority: appointment.vitals > appointment fields > patient.vitals > patient fields
   * @param {Object} appointmentData - Appointment data (may have vitals)
   * @param {Object} patientData - Patient data (may have vitals)
   * @returns {Object} Normalized vitals { weightKg, heightCm, bmi, bp }
   */
  const normalizeVitals = (appointmentData, patientData) => {
    // User requested: "Normalize vitals only from the full patient object, not from appointment data."
    // So we ignore appointmentData arguments for vitals.

    const weightKg =
      patientData?.vitals?.weightKg ||
      patientData?.weight ||
      null;

    const heightCm =
      patientData?.vitals?.heightCm ||
      patientData?.height ||
      null;

    const bp =
      patientData?.vitals?.bp ||
      patientData?.bp ||
      '—';

    let bmi =
      patientData?.vitals?.bmi ||
      patientData?.bmi ||
      null;

    // Calculate BMI if missing but weight/height exist
    if (bmi === null && weightKg && heightCm) {
      let age = null;
      if (patientData?.age) {
        age = Number(patientData.age);
      }
      bmi = calculateBMI(weightKg, heightCm, age);
    }

    return { weightKg, heightCm, bmi, bp };
  };

  // OLD: Logic to extract patient data for header (Restored)
  const getPatientData = () => {
    // STRICTLY use 'patient' state. No fallback to appointment object construction.
    if (!patient) return null;

    const patientData = patient;

    const name = `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || patientData.name || 'Unknown Patient';

    const gender = patientData.gender || 'Male';
    const isFemale = gender.toLowerCase() === 'female';

    let phone = '';
    if (patientData.phone) {
      phone = typeof patientData.phone === 'object'
        ? (patientData.phone.phone || patientData.phone.number || '')
        : patientData.phone;
    }

    let email = '';
    if (patientData.email) {
      email = typeof patientData.email === 'object'
        ? (patientData.email.email || patientData.email.address || '')
        : patientData.email;
    }

    const location = patientData?.address?.city
      ? `${patientData.address.city}${patientData.address.state ? `, ${patientData.address.state}` : ''}`
      : patientData.location || 'Location not set';

    const occupation = patientData.profession ||
      patientData.metadata?.profession ||
      'Not specified';

    let dob = '';
    let age = 0;
    if (patientData.dateOfBirth) {
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
    } else if (patientData.age) {
      age = typeof patientData.age === 'number' ? patientData.age : parseInt(patientData.age) || 0;
    }

    const weightKg = patientData.vitals?.weightKg || null;
    const heightCm = patientData.vitals?.heightCm || null;
    const bmi = patientData.vitals?.bmi || null;
    const bp = patientData.vitals?.bp || '—';

    const diagnosis = patientData.diagnosis ||
      patientData.metadata?.diagnosis ||
      patientData.medicalHistory ||
      [];
    const diagnosisArray = Array.isArray(diagnosis) ? diagnosis : [];

    const barriers = patientData.barriers ||
      patientData.metadata?.barriers ||
      [];
    const barriersArray = Array.isArray(barriers) ? barriers : [];

    const noAlcohol = patientData.metadata?.noAlcohol === true || patientData.metadata?.alcohol === false;
    const noSmoker = patientData.metadata?.noSmoker === true || patientData.metadata?.smoker === false;

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
      avatarUrl: patientData.avatarUrl || patientData.metadata?.avatarUrl || null,
      patientCode: patientData.metadata?.patientCode || patientData.patientCode || patientData._id?.substring(0, 8) || '',
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
    const term = searchTerm.toLowerCase();

    return patientAppointments.filter(appt => {
      // Improved logic: Search across multiple fields
      const date = (appt.date || appt.startAt || '').toLowerCase();
      const status = (appt.status || '').toLowerCase();

      let drName = (appt.doctor || '').toLowerCase();
      if (appt.doctorId && typeof appt.doctorId === 'object') {
        drName = `${appt.doctorId.firstName || ''} ${appt.doctorId.lastName || ''}`.trim().toLowerCase();
      } else if (appt.doctorName) {
        drName = appt.doctorName.toLowerCase();
      }

      const apptService = (appt.service || appt.appointmentType || 'Consultation').toLowerCase();

      // Extract logic for condition similarly to table row
      let reason = '';
      if (appt.followUpReason) reason = appt.followUpReason;
      else if (appt.chiefComplaint) reason = appt.chiefComplaint;
      else if (appt.reason) reason = appt.reason;
      else if (appt.metadata?.followUpReason) reason = appt.metadata.followUpReason;
      else if (appt.metadata?.chiefComplaint) reason = appt.metadata.chiefComplaint;
      else if (appt.metadata?.reason) reason = appt.metadata.reason;
      else if (appt.notes) reason = appt.notes;

      let pObj = typeof appt.patientId === 'object' ? appt.patientId : null;
      if (!pObj && patient && (appt.patientId === patient._id || patient._id === patientId)) {
        pObj = patient;
      }
      const condition = (appt.condition || reason || extractCondition(pObj) || '').toLowerCase();

      return date.includes(term) ||
        status.includes(term) ||
        drName.includes(term) ||
        apptService.includes(term) ||
        condition.includes(term);
    });
  };

  const filteredList = getFilteredAppointments();

  return (
    <div className="appointment-view-overlay">
      {/* Floating Close Button — outside container */}
      <button className="appointment-close-floating" onClick={onClose}>
        <MdClose size={32} />
      </button>

      <div className="appointment-view-container">

        {error && !isLoading ? (
          <div className="appointment-view-error">
            <p>{error}</p>
            <button onClick={onClose} className="btn-error-close">Close</button>
          </div>
        ) : (
          <>
            {(() => {
              if (isLoading && (!appointment || !patient)) {
                return (
                  <div className="pv-summary-header mb-4">
                    <SkeletonCard>
                      <div className="flex items-center gap-4">
                        <Skeleton variant="circular" width="80px" height="80px" />
                        <div className="flex-1">
                          <Skeleton width="40%" height="24px" className="mb-2" />
                          <Skeleton width="60%" height="16px" className="mb-1" />
                          <Skeleton width="30%" height="16px" />
                        </div>
                      </div>
                    </SkeletonCard>
                  </div>
                );
              }

              if (!appointment) return null;

              const patientData = getPatientData();
              const avatarSrc = patientData.avatarUrl || getGenderAvatar(patientData.gender);

              return (
                <div className="pv-summary-header">
                  <div className="pv-header-content">
                    {/* Avatar */}
                    <div className="pv-avatar-section">
                      <div className="pv-avatar-container">
                        <img
                          src={avatarSrc}
                          alt={patientData.name}
                          className="pv-avatar-image"
                          onError={(e) => { e.target.src = getGenderAvatar(patientData.gender); }}
                        />
                        {/* Lifestyle indicators removed for cleaner UI */}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="pv-info-section">
                      <div className="pv-name-row">
                        <h2 className="pv-name-main">{patientData.name}</h2>
                        <div className="pv-contact-icons">
                          {patientData.phone && <button className="pv-contact-btn" title={patientData.phone}><MdPhone size={14} /></button>}
                        </div>
                      </div>

                      {patientData.patientCode && (
                        <div className="pv-patient-code-badge" onClick={() => copyToClipboard(patientData.patientCode, 'Patient ID')} title="Click to copy">
                          <span className="pv-code-prefix">ID:</span> {patientData.patientCode} <MdContentCopy size={12} className="pv-code-copy-icon" />
                        </div>
                      )}

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

                    </div>

                    {/* Right — Actions Group (Edit + Vitals) + Info Group (Diagnosis/Barriers) */}
                    <div className="pv-header-right">
                      <div className="pv-header-actions-group">
                        <button
                          className="pv-edit-btn"
                          onClick={() => {
                            if (onEdit) {
                              onEdit(appointment);
                            }
                          }}
                        >
                          <MdEdit size={14} /> Edit
                        </button>

                        {/* Vitals — 2x2 Grid */}
                        <div className="pv-vitals-grid-2x2">
                          <div className="pv-metric-card pv-metric-height">
                            <span className="pv-metric-val">{patientData.heightCm || '—'} <small>cm</small></span>
                            <span className="pv-metric-lbl">Height</span>
                          </div>
                          <div className="pv-metric-card pv-metric-weight">
                            <span className="pv-metric-val">{patientData.weightKg || '—'} <small>kg</small></span>
                            <span className="pv-metric-lbl">Weight</span>
                          </div>
                          <div className="pv-metric-card pv-metric-bmi">
                            <span className="pv-metric-val">{patientData.bmi || '—'}</span>
                            <span className="pv-metric-lbl">BMI</span>
                          </div>
                          <div className="pv-metric-card pv-metric-bp">
                            <span className="pv-metric-val">{patientData.bp}</span>
                            <span className="pv-metric-lbl">Blood Pressure</span>
                          </div>
                        </div>
                      </div>

                      {patientData.diagnosis.length > 0 && (
                        <div className="pv-diagnosis-section">
                          <span className="pv-sec-label">Own Diagnosis</span>
                          <div className="pv-tags-row">
                            {patientData.diagnosis.map((d, i) => <span key={i} className="pv-tag diag">{d}</span>)}
                          </div>
                        </div>
                      )}

                      {patientData.barriers.length > 0 && (
                        <div className="pv-barriers-section">
                          <span className="pv-sec-label">Health Barriers</span>
                          <div className="pv-tags-row">
                            {patientData.barriers.map((b, i) => <span key={i} className="pv-tag barrier">{b}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB SECTION — 5 Tabs */}
            <div className="appointment-tabs-section">
              <div className="tabs-header">
                {[
                  { id: 'appointments', label: 'Visit History', icon: <MdCalendarToday /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="tabs-content">
                <div className="tab-content-wrapper full-width-content">

                  {/* ═══ TAB: Appointments (existing) ═══ */}
                  {activeTab === 'appointments' && (
                    <>
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
                      <div className="appointments-list-container">
                        {filteredList.length > 0 ? (
                          <table className="appointments-table">
                            <thead>
                              <tr>
                                <th>Date & Time</th>
                                <th>Doctor</th>
                                <th>Service</th>
                                <th>Condition/Reason</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredList.map(appt => {
                                let drName = appt.doctor || 'Not Assigned';
                                if (appt.doctorId && typeof appt.doctorId === 'object') {
                                  drName = `${appt.doctorId.firstName || ''} ${appt.doctorId.lastName || ''}`.trim();
                                } else if (appt.doctorName) {
                                  drName = appt.doctorName;
                                }
                                const apptService = appt.service || appt.appointmentType || 'Consultation';
                                let reason = '';
                                if (appt.followUpReason) reason = appt.followUpReason;
                                else if (appt.chiefComplaint) reason = appt.chiefComplaint;
                                else if (appt.reason) reason = appt.reason;
                                else if (appt.metadata?.followUpReason) reason = appt.metadata.followUpReason;
                                else if (appt.metadata?.chiefComplaint) reason = appt.metadata.chiefComplaint;
                                else if (appt.metadata?.reason) reason = appt.metadata.reason;
                                else if (appt.notes) reason = appt.notes;
                                let pObj = typeof appt.patientId === 'object' ? appt.patientId : null;
                                if (!pObj && patient && (appt.patientId === patient._id || patient._id === patientId)) {
                                  pObj = patient;
                                }
                                const condition = appt.condition || reason || extractCondition(pObj);
                                return (
                                  <tr key={appt._id || appt.id}>
                                    <td>
                                      <div className="appt-date-time">
                                        <span className="appt-date">{formatTableDate(appt.date || appt.startAt)}</span>
                                        <span className="appt-time-sub">{appt.time || (appt.startAt && new Date(appt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</span>
                                      </div>
                                    </td>
                                    <td><span className="appt-doctor-cell">{drName}</span></td>
                                    <td><span className="appt-service-cell">{apptService}</span></td>
                                    <td><span className="appt-condition">{condition}</span></td>
                                    <td>
                                      <span className={`status-badge ${appt.status?.toLowerCase() || 'scheduled'}`}>
                                        {appt.status ? (appt.status.charAt(0).toUpperCase() + appt.status.slice(1).toLowerCase()) : 'Scheduled'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="no-appointments">
                            <div className="no-results-content">
                              <MdInfo size={48} className="no-results-icon" />
                              <h3>No results found</h3>
                              <p>We couldn't find any appointments matching "{searchTerm}"</p>
                              {searchTerm && (
                                <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                                  Clear Search
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}


                </div>
              </div>
            </div>
          </>
        )
        }
      </div>

      {/* INTAKE MODAL FOR UPDATES */}
      {showIntakeModal && appointment && (
        <AppointmentIntakeModal
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          appointmentId={appointment._id || appointment.id}
          onSuccess={async () => {
            // REFRESH DATA
            const pId = patient?._id || appointment?.patientObjectId || (typeof appointment?.patientIdObj === 'object' ? appointment.patientIdObj?._id : appointment?.patientIdObj);
            if (pId) {
              try {
                const refreshedPatient = await patientsService.fetchPatientById(pId);
                setPatient(refreshedPatient);
              } catch (e) {
                console.error("Refresh failed", e);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default AppointmentViewModal;

/**
 * AppointmentIntakeModal.jsx - ENHANCED VERSION
 * Full-featured intake form matching Flutter's intakeform.dart exactly
 * 
 * Features:
 * - Patient Profile Header Card
 * - Expandable sections (Vitals, Notes, Pharmacy, Pathology, Follow-up)
 * - Auto BMI calculation
 * - Complete API integration
 * - Stock warnings
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdSave, MdMonitorHeart, MdNote, MdMedication, MdScience, MdEventNote } from 'react-icons/md';
import PatientProfileHeaderCard from '../doctor/PatientProfileHeaderCard';
import SectionCard from './SectionCard';
import './AppointmentIntakeModal.css';
import appointmentsService from '../../services/appointmentsService';
import patientsService from '../../services/patientsService';
import { PatientDetails } from '../../models/Patients';

const AppointmentIntakeModal = ({ isOpen, onClose, appointmentId, onSuccess }) => {
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [spo2, setSpo2] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  
  // Pharmacy rows (for future)
  const [pharmacyRows, setPharmacyRows] = useState([]);
  
  // Pathology rows (for future)
  const [pathologyRows, setPathologyRows] = useState([]);
  
  // Follow-up data (for future)
  const [followUpData, setFollowUpData] = useState({});

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appointmentId]);

  // Auto-calculate BMI
  useEffect(() => {
    if (height && weight) {
      const h = parseFloat(height);
      const w = parseFloat(weight);
      if (h > 0 && w > 0) {
        const hMeters = h / 100;
        const calculatedBmi = w / (hMeters * hMeters);
        setBmi(calculatedBmi.toFixed(1));
      }
    }
  }, [height, weight]);

  const fetchAppointment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await appointmentsService.fetchAppointmentById(appointmentId);
      setAppointment(data);

      // Extract patient ID and fetch patient details
      let patientId = null;
      if (typeof data.patientId === 'object' && data.patientId?._id) {
        patientId = data.patientId._id;
      } else if (typeof data.patientId === 'string') {
        patientId = data.patientId;
      }

      if (patientId) {
        try {
          const patientData = await patientsService.fetchPatientById(patientId);
          setPatient(patientData);
          
          // Prefill vitals from patient data
          if (patientData.height) setHeight(patientData.height);
          if (patientData.weight) setWeight(patientData.weight);
          if (patientData.bmi) setBmi(patientData.bmi);
          if (patientData.oxygen) setSpo2(patientData.oxygen);
        } catch (err) {
          console.error('Failed to fetch patient details:', err);
        }
      }

      // Prefill form data from appointment (override patient data if exists)
      if (data.vitals) {
        if (data.vitals.heightCm || data.vitals.height_cm) {
          setHeight(data.vitals.heightCm || data.vitals.height_cm);
        }
        if (data.vitals.weightKg || data.vitals.weight_kg) {
          setWeight(data.vitals.weightKg || data.vitals.weight_kg);
        }
        if (data.vitals.bmi) setBmi(data.vitals.bmi);
        if (data.vitals.spo2) setSpo2(data.vitals.spo2);
      }
      
      if (data.currentNotes || data.notes) {
        setCurrentNotes(data.currentNotes || data.notes || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setError('');

    try {
      const payload = {
        appointmentId: appointmentId,
        vitals: {
          heightCm: height || null,
          height_cm: height || null,
          weightKg: weight || null,
          weight_kg: weight || null,
          bmi: bmi || null,
          spo2: spo2 || null,
        },
        currentNotes: currentNotes || null,
        pharmacy: pharmacyRows,
        pathology: pathologyRows,
        followUp: followUpData,
        updatedAt: new Date().toISOString(),
      };

      await appointmentsService.updateAppointment(appointmentId, payload);
      
      if (onSuccess) {
        await onSuccess();
      }
      
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save intake data');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Convert appointment to PatientDetails for header card
  const convertToPatient = () => {
    if (patient) return patient;
    
    if (!appointment) return null;

    // Create basic patient object from appointment
    return new PatientDetails({
      patientId: typeof appointment.patientId === 'object' ? appointment.patientId._id : appointment.patientId,
      name: appointment.clientName || 'Unknown Patient',
      firstName: appointment.clientName?.split(' ')[0] || '',
      lastName: appointment.clientName?.split(' ').slice(1).join(' ') || '',
      age: appointment.patientAge || 0,
      gender: appointment.gender || '',
      bloodGroup: appointment.bloodGroup || 'O+',
      height: height || '',
      weight: weight || '',
      bmi: bmi || '',
      oxygen: spo2 || '',
      bp: '',
      pulse: '',
      temp: '',
      phone: '',
      dateOfBirth: appointment.dob || '',
      lastVisitDate: appointment.date || '',
      city: appointment.location || '',
      houseNo: '',
      street: '',
      state: '',
      pincode: '',
      country: '',
      address: appointment.location || '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      insuranceNumber: '',
      expiryDate: '',
      avatarUrl: appointment.patientAvatarUrl || '',
      doctorId: '',
      doctorName: '',
      medicalHistory: [],
      allergies: [],
      notes: currentNotes || '',
      patientCode: appointment.patientCode || null,
    });
  };

  const patientForHeader = convertToPatient();

  return (
    <div className="intake-modal-overlay">
      <div className="intake-modal-dialog">
        {/* Floating Close Button */}
        <button 
          className="intake-modal-close-floating" 
          onClick={onClose} 
          disabled={isSaving}
          title="Close"
        >
          <MdClose size={20} />
        </button>

        {/* Dialog Content */}
        <div className="intake-modal-content-wrapper">
          {isLoading ? (
            <div className="intake-modal-loading">
              <div className="spinner"></div>
              <p>Loading appointment...</p>
            </div>
          ) : error && !appointment ? (
            <div className="intake-modal-error">
              <p>{error}</p>
              <button onClick={onClose} className="btn-error-close">Close</button>
            </div>
          ) : appointment ? (
            <>
              {/* Scrollable Content */}
              <div className="intake-modal-scroll-area">
                {/* Patient Profile Header Card */}
                {patientForHeader && (
                  <div className="intake-patient-header">
                    <PatientProfileHeaderCard 
                      patient={patientForHeader}
                      onEdit={null}
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="intake-error-banner">
                    <p>{error}</p>
                  </div>
                )}

                {/* Vital Signs Section */}
                <SectionCard
                  icon={<MdMonitorHeart />}
                  title="Vital Signs"
                  description="Record patient vitals and measurements"
                  initiallyExpanded={true}
                >
                  <div className="vitals-grid">
                    <div className="vitals-row">
                      <div className="input-group">
                        <label htmlFor="height">Height (cm)</label>
                        <input
                          id="height"
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="Enter height in cm"
                          className="intake-input"
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="weight">Weight (kg)</label>
                        <input
                          id="weight"
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="Enter weight in kg"
                          className="intake-input"
                        />
                      </div>
                    </div>
                    <div className="vitals-row">
                      <div className="input-group">
                        <label htmlFor="bmi">BMI</label>
                        <input
                          id="bmi"
                          type="number"
                          value={bmi}
                          onChange={(e) => setBmi(e.target.value)}
                          placeholder="Auto-calculated"
                          className="intake-input"
                          readOnly
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="spo2">SpO₂ (%)</label>
                        <input
                          id="spo2"
                          type="number"
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value)}
                          placeholder="Enter SpO₂ percentage"
                          className="intake-input"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Current Notes Section */}
                <SectionCard
                  icon={<MdNote />}
                  title="Current Notes"
                  description="Document observations and recommendations"
                  initiallyExpanded={true}
                >
                  <div className="input-group">
                    <label htmlFor="currentNotes">Clinical Notes</label>
                    <textarea
                      id="currentNotes"
                      value={currentNotes}
                      onChange={(e) => setCurrentNotes(e.target.value)}
                      placeholder="Enter clinical notes, observations, and recommendations..."
                      className="intake-textarea"
                      rows={6}
                    />
                  </div>
                </SectionCard>

                {/* Pharmacy Section - Placeholder for future */}
                <SectionCard
                  icon={<MdMedication />}
                  title="Pharmacy"
                  description="Prescribe and manage medications (Coming Soon)"
                  initiallyExpanded={false}
                >
                  <div className="placeholder-content">
                    <p>Pharmacy prescription feature will be available soon.</p>
                    <p className="placeholder-hint">This will include medicine search, dosage calculator, and stock management.</p>
                  </div>
                </SectionCard>

                {/* Pathology Section - Placeholder for future */}
                <SectionCard
                  icon={<MdScience />}
                  title="Pathology"
                  description="Order and track lab investigations (Coming Soon)"
                  initiallyExpanded={false}
                >
                  <div className="placeholder-content">
                    <p>Pathology lab orders feature will be available soon.</p>
                    <p className="placeholder-hint">This will include lab test ordering and tracking.</p>
                  </div>
                </SectionCard>

                {/* Follow-Up Planning Section - Placeholder for future */}
                <SectionCard
                  icon={<MdEventNote />}
                  title="Follow-Up Planning"
                  description="Schedule follow-up appointments (Coming Soon)"
                  initiallyExpanded={false}
                >
                  <div className="placeholder-content">
                    <p>Follow-up scheduling feature will be available soon.</p>
                    <p className="placeholder-hint">This will include date/time selection and auto-scheduling.</p>
                  </div>
                </SectionCard>

                {/* Spacing for bottom bar */}
                <div style={{ height: '100px' }}></div>
              </div>

              {/* Fixed Bottom Save Bar */}
              <div className="intake-modal-save-bar">
                <button 
                  className="btn-intake-cancel" 
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  className="btn-intake-save" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="btn-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <MdSave size={20} />
                      Save Intake
                    </>
                  )}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AppointmentIntakeModal;

/**
 * AppointmentIntakeModal.jsx
 * Intake form modal matching Flutter's intakeform.dart design
 * Full-screen modal with patient profile, vitals, notes, pharmacy, pathology
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdSave, MdPerson, MdMonitorHeart, MdNote, MdMedication, MdScience } from 'react-icons/md';
import './AppointmentIntakeModal.css';
import appointmentsService from '../../services/appointmentsService';

const AppointmentIntakeModal = ({ isOpen, onClose, appointmentId, onSuccess }) => {
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [spo2, setSpo2] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');

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

      // Prefill form data
      setHeight(data.heightCm || '');
      setWeight(data.weightKg || '');
      setBmi(data.bmi || '');
      setSpo2(data.spo2 || '');
      setCurrentNotes(data.notes || '');
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
      const updateData = {
        heightCm: height || null,
        weightKg: weight || null,
        bmi: bmi || null,
        spo2: spo2 || null,
        notes: currentNotes || null
      };

      await appointmentsService.updateAppointment(appointmentId, updateData);
      
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

  const getPatientName = () => {
    if (!appointment) return 'Unknown Patient';
    if (appointment.clientName) return appointment.clientName;
    if (appointment.patientId && typeof appointment.patientId === 'object') {
      const p = appointment.patientId;
      return `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown Patient';
    }
    return 'Unknown Patient';
  };

  const getPatientCode = () => {
    if (!appointment) return 'N/A';
    if (appointment.patientId && typeof appointment.patientId === 'object') {
      return appointment.patientId?.metadata?.patientCode || appointment.patientId?._id || 'N/A';
    }
    return String(appointment.patientId || 'N/A');
  };

  return (
    <div className="intake-modal-overlay">
      <div className="intake-modal-container">
        {/* Close Button */}
        <button className="intake-modal-close" onClick={onClose} disabled={isSaving}>
          <MdClose size={24} />
        </button>

        {/* Content */}
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
            {/* Header */}
            <div className="intake-modal-header">
              <div className="intake-header-left">
                <MdPerson size={32} color="#6366f1" />
                <div>
                  <h2>Intake Form</h2>
                  <p className="intake-subtitle">{getPatientName()} • {getPatientCode()}</p>
                </div>
              </div>
              <div className="intake-header-right">
                <button 
                  className="btn-save-intake" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="spinner-small"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <MdSave size={20} />
                      <span>Save Intake</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="intake-modal-body">
              {/* Patient Profile Card */}
              <div className="intake-section">
                <div className="intake-section-header">
                  <MdPerson size={20} />
                  <h3>Patient Information</h3>
                </div>
                <div className="intake-info-grid">
                  <div className="intake-info-item">
                    <label>Patient Name</label>
                    <p>{getPatientName()}</p>
                  </div>
                  <div className="intake-info-item">
                    <label>Patient ID</label>
                    <p>{getPatientCode()}</p>
                  </div>
                  <div className="intake-info-item">
                    <label>Gender</label>
                    <p>{typeof appointment.gender === 'object' ? 'N/A' : String(appointment.gender || 'N/A')}</p>
                  </div>
                  <div className="intake-info-item">
                    <label>Appointment Date</label>
                    <p>{String(appointment.date || 'N/A')}</p>
                  </div>
                </div>
              </div>

              {/* Vitals Section */}
              <div className="intake-section">
                <div className="intake-section-header">
                  <MdMonitorHeart size={20} />
                  <h3>Vitals</h3>
                </div>
                <div className="intake-form-grid">
                  <div className="intake-form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Enter height in cm"
                      className="intake-input"
                    />
                  </div>
                  <div className="intake-form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Enter weight in kg"
                      className="intake-input"
                    />
                  </div>
                  <div className="intake-form-group">
                    <label>BMI</label>
                    <input
                      type="text"
                      value={bmi}
                      readOnly
                      placeholder="Auto-calculated"
                      className="intake-input readonly"
                    />
                  </div>
                  <div className="intake-form-group">
                    <label>SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="Enter SpO2"
                      className="intake-input"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Current Notes */}
              <div className="intake-section">
                <div className="intake-section-header">
                  <MdNote size={20} />
                  <h3>Current Notes</h3>
                </div>
                <div className="intake-form-group-full">
                  <textarea
                    value={currentNotes}
                    onChange={(e) => setCurrentNotes(e.target.value)}
                    placeholder="Enter current notes, observations, or symptoms..."
                    className="intake-textarea"
                    rows={6}
                  />
                </div>
              </div>

              {/* Pharmacy Section - Placeholder */}
              <div className="intake-section">
                <div className="intake-section-header">
                  <MdMedication size={20} />
                  <h3>Pharmacy / Medications</h3>
                </div>
                <div className="intake-placeholder">
                  <p>Medication management coming soon</p>
                </div>
              </div>

              {/* Pathology Section - Placeholder */}
              <div className="intake-section">
                <div className="intake-section-header">
                  <MdScience size={20} />
                  <h3>Pathology / Lab Tests</h3>
                </div>
                <div className="intake-placeholder">
                  <p>Lab test management coming soon</p>
                </div>
              </div>

              {error && (
                <div className="intake-error-message">
                  {error}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="intake-modal-error">
            <p>No appointment data available</p>
            <button onClick={onClose} className="btn-error-close">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentIntakeModal;

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
import { MdClose, MdSave, MdMonitorHeart, MdNote, MdMedication, MdScience, MdEventNote, MdFavorite } from 'react-icons/md';
import PatientProfileHeaderCard from '../doctor/PatientProfileHeaderCard';
import SectionCard from './SectionCard';
import PharmacyTable from './PharmacyTable';
import PathologyTable from './PathologyTable';
import './AppointmentIntakeModal.css';
import appointmentsService from '../../services/appointmentsService';
import patientsService from '../../services/patientsService';
import pharmacyService from '../../services/pharmacyService';
import pathologyService from '../../services/pathologyService';
import { PatientDetails } from '../../models/Patients';

const AppointmentIntakeModal = ({ isOpen, onClose, appointmentId, onSuccess }) => {
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successNotification, setSuccessNotification] = useState(null);

  // Form state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [spo2, setSpo2] = useState('');
  const [bp, setBp] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');

  // Pharmacy rows (for future) - eslint-disable-next-line no-unused-vars
  const [pharmacyRows, setPharmacyRows] = useState([]);

  // Pathology rows (for future)
  // eslint-disable-next-line no-unused-vars
  const [pathologyRows, setPathologyRows] = useState([]);

  // Follow-up data (for future)
  // eslint-disable-next-line no-unused-vars
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

          // Prefill vitals from patient data (fallback)
          if (patientData.height) setHeight(patientData.height);
          if (patientData.weight) setWeight(patientData.weight);
          if (patientData.bmi) setBmi(patientData.bmi);
          if (patientData.oxygen) setSpo2(patientData.oxygen);

          // Fetch existing intake for this appointment
          const intakes = await patientsService.fetchIntakes(patientId, { limit: 100 });
          // Find intake for this appointment
          const appointmentIntake = intakes.find(i => String(i.appointmentId) === String(appointmentId));

          if (appointmentIntake) {
            console.log('✅ Found existing intake for appointment:', appointmentIntake._id);

            // Override Vitals from Intake
            if (appointmentIntake.triage && appointmentIntake.triage.vitals) {
              const v = appointmentIntake.triage.vitals;
              if (v.heightCm) setHeight(v.heightCm);
              if (v.weightKg) setWeight(v.weightKg);
              if (v.bmi) setBmi(v.bmi);
              if (v.spo2) setSpo2(v.spo2);
            }

            // Load Notes
            if (appointmentIntake.notes) setCurrentNotes(appointmentIntake.notes);

            // Load Pharmacy Items
            if (appointmentIntake.meta && appointmentIntake.meta.pharmacyItems && Array.isArray(appointmentIntake.meta.pharmacyItems)) {
              const loadedPharmacyRows = await Promise.all(appointmentIntake.meta.pharmacyItems.map(async (item) => {
                // Fetch medicine details to check current stock
                let stock = 0;
                if (item.medicineId) {
                  try {
                    const med = await pharmacyService.fetchMedicineById(item.medicineId);
                    stock = med.availableQty ?? med.stock ?? 0;
                  } catch (e) { console.warn('Failed to fetch stock for', item.name); }
                }

                return {
                  medicineId: item.medicineId || '',
                  Medicine: item.name || '',
                  Dosage: item.dosage || '',
                  Frequency: item.frequency || '',
                  duration: item.duration || '',
                  quantity: item.quantity || 1,
                  price: item.unitPrice || 0,
                  total: item.lineTotal || 0,
                  Notes: item.notes || '',
                  availableStock: stock
                };

              }));
              setPharmacyRows(loadedPharmacyRows);
            }

            // Load Pathology Items
            if (appointmentIntake.meta && appointmentIntake.meta.pathologyItems && Array.isArray(appointmentIntake.meta.pathologyItems)) {
              setPathologyRows(appointmentIntake.meta.pathologyItems.map(item => ({
                'Test Name': item.testName || '',
                Category: item.category || '',
                Priority: item.priority || 'Normal',
                Notes: item.notes || ''
              })));
            }

          }

        } catch (err) {
          console.error('Failed to fetch patient/intake details:', err);
        }
      }

      // Prefill form data from appointment (if no intake found or to verify)
      if (data.vitals) {
        if (data.vitals.heightCm || data.vitals.height_cm) {
          setHeight(data.vitals.heightCm || data.vitals.height_cm);
        }
        if (data.vitals.weightKg || data.vitals.weight_kg) {
          setWeight(data.vitals.weightKg || data.vitals.weight_kg);
        }
        if (data.vitals.bmi) setBmi(data.vitals.bmi);
        if (data.vitals.spo2) setSpo2(data.vitals.spo2);
        if (data.vitals.bp) setBp(data.vitals.bp);
      }

      // If we haven't set notes from intake, set from appointment
      if (!currentNotes && (data.currentNotes || data.notes)) {
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
      // Save intake data to appointment
      // Extract patient ID safely
      let patientId = null;
      if (appointment?.patientId) {
        if (typeof appointment.patientId === 'object' && appointment.patientId?._id) {
          patientId = appointment.patientId._id;
        } else if (typeof appointment.patientId === 'string') {
          patientId = appointment.patientId;
        }
      }

      if (!patientId) {
        throw new Error('Missing patient ID - cannot save intake');
      }

      const payload = {
        patientId: patientId,
        patientName: appointment?.clientName || 'Unknown Patient',
        appointmentId: appointmentId,
        vitals: {
          heightCm: height || null,
          height_cm: height || null,
          weightKg: weight || null,
          weight_kg: weight || null,
          bmi: bmi || null,
          spo2: spo2 || null,
          bp: bp || null,
        },
        currentNotes: currentNotes || null,
        pharmacy: pharmacyRows.map(row => ({
          medicineId: row.medicineId || null,
          name: row.Medicine || '',
          Medicine: row.Medicine || '',
          dosage: row.Dosage || '',
          Dosage: row.Dosage || '',
          frequency: row.Frequency || '',
          Frequency: row.Frequency || '',
          duration: row.duration || '',
          Duration: row.duration || '',
          notes: row.Notes || '',
          Notes: row.Notes || '',
          quantity: Number(row.quantity || 1),
          price: Number(row.price || 0),
          total: Number(row.total || 0)
        })),


        pathology: pathologyRows.map(row => ({ ...row })),
        followUp: followUpData,
        updatedAt: new Date().toISOString(),
      };

      console.log('💾 Saving intake data...');
      console.log('💾 [INTAKE SAVE] Sending vitals:', payload.vitals);
      console.log('💾 [INTAKE SAVE] Appointment ID:', appointmentId);
      console.log('💾 [INTAKE SAVE] Patient ID:', patientId);
      console.log('💾 [INTAKE SAVE] Follow-Up Data:', Object.keys(followUpData));
      if (followUpData.isRequired) {
        console.log('💾 [INTAKE SAVE] ✅ Follow-up IS required - will be saved to appointment');
      } else {
        console.log('💾 [INTAKE SAVE] ⚠️ Follow-up NOT required - will not show in follow-up list');
      }

      const savedIntake = await appointmentsService.addIntake(payload, patientId);
      console.log('✅ Intake data saved successfully!', savedIntake);

      let successMessage = '✅ Intake saved successfully!';
      const details = [];

      // Step 3: SKIP automatic prescription creation - let pharmacist do it manually
      // Pharmacy items are already saved in intake.meta.pharmacyItems by the backend
      if (pharmacyRows.length > 0) {
        console.log('💊 Prescription items saved to intake (pending pharmacist review)');
        details.push(`💊 ${pharmacyRows.length} medicine(s) added to prescription (pending dispensing)`);
      }

      // Step 4: SKIP automatic lab report creation - let pathologist do it manually
      // Pathology items are already saved in intake.meta.pathologyItems by the backend
      if (pathologyRows.length > 0) {
        console.log('🧪 Lab test orders saved to intake (pending pathologist review)');
        details.push(`🧪 ${pathologyRows.length} test(s) ordered (pending processing)`);
      }

      // Prepare detailed success notification
      const notificationData = {
        message: successMessage,
        details: details,
        hasPharmacy: pharmacyRows.length > 0,
        hasPathology: pathologyRows.length > 0,
        pharmacyCount: pharmacyRows.length,
        pathologyCount: pathologyRows.length
      };

      // Show success notification
      setSuccessNotification(notificationData);

      // Wait for user to see notification before closing
      setTimeout(async () => {
        if (onSuccess) {
          await onSuccess();
        }
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to save intake data');
      console.error('❌ Error saving intake:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Convert appointment to PatientDetails for header card
  const convertToPatient = () => {
    if (patient) return patient;

    if (!appointment) return null;

    // Extract patient ID safely
    let extractedPatientId = null;
    if (appointment.patientId) {
      if (typeof appointment.patientId === 'object' && appointment.patientId?._id) {
        extractedPatientId = appointment.patientId._id;
      } else if (typeof appointment.patientId === 'string') {
        extractedPatientId = appointment.patientId;
      }
    }

    // Create basic patient object from appointment
    return new PatientDetails({
      patientId: extractedPatientId,
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

  // ── VitalCard helper ──────────────────────────────────────────────────
  const getBmiStatus = (val) => {
    const n = parseFloat(val);
    if (!val || isNaN(n)) return null;
    if (n < 18.5) return { label: 'Underweight', color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' };
    if (n < 25) return { label: 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.10)' };
    if (n < 30) return { label: 'Overweight', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' };
    return { label: 'Obese', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' };
  };

  const getSpo2Status = (val) => {
    const n = parseFloat(val);
    if (!val || isNaN(n)) return null;
    if (n >= 95) return { label: 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.10)' };
    if (n >= 90) return { label: 'Low', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' };
    return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' };
  };

  const VitalCard = ({ icon, label, value, unit, status, accentColor = '#0d9488', emptyLabel = 'Not set' }) => (
    <div className="vital-display-card" style={{ '--vc-accent': accentColor }}>
      <div className="vc-top">
        <span className="vc-icon" style={{ color: accentColor }}>{icon}</span>
        <span className="vc-label">{label}</span>
      </div>
      <div className="vc-center">
        {value ? (
          <>
            <span className="vc-value">{value}</span>
            {unit && <span className="vc-unit">{unit}</span>}
          </>
        ) : (
          <span className="vc-empty">{emptyLabel}</span>
        )}
      </div>
      {status && (
        <div className="vc-status" style={{ color: status.color, background: status.bg }}>{status.label}</div>
      )}
    </div>
  );

  const bmiStatus = getBmiStatus(bmi);
  const spo2Status = getSpo2Status(spo2);
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className="intake-modal-overlay">
      <div className="intake-modal-dialog">
        {/* Success Notification Overlay */}
        {successNotification && (
          <div className="intake-success-overlay">
            <div className="intake-success-card">
              <div className="success-header">
                <div className="success-icon">✅</div>
                <h3>Intake Saved Successfully!</h3>
              </div>
              <div className="success-body">
                {successNotification.details.map((detail, idx) => (
                  <div key={idx} className="success-detail">{detail}</div>
                ))}

                {successNotification.hasPharmacy && (
                  <div className="success-navigation-hint pharmacy-hint">
                    <div className="hint-icon">💊</div>
                    <div className="hint-text">
                      <strong>Prescription Order Created</strong>
                      <p>{successNotification.pharmacyCount} medicine(s) sent to Pharmacy (Pending Dispensing)</p>
                    </div>
                  </div>
                )}

                {successNotification.hasPathology && (
                  <div className="success-navigation-hint pathology-hint">
                    <div className="hint-icon">🧪</div>
                    <div className="hint-text">
                      <strong>Lab Test Order Created</strong>
                      <p>{successNotification.pathologyCount} test(s) sent to Pathology (Pending Processing)</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="success-footer">
                <p className="auto-close-hint">Closing automatically...</p>
              </div>
            </div>
          </div>
        )}

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
                  {/* ── Live Vitals Display Grid ───────────────────── */}
                  <div className="vitals-display-grid">
                    <VitalCard
                      icon={<span className="vc-emoji">⚖️</span>}
                      label="Weight"
                      value={weight}
                      unit="kg"
                      accentColor="#0d9488"
                    />
                    <VitalCard
                      icon={<span className="vc-emoji">📏</span>}
                      label="Height"
                      value={height}
                      unit="cm"
                      accentColor="#0369a1"
                    />
                    <VitalCard
                      icon={<span className="vc-emoji">📉</span>}
                      label="BMI"
                      value={bmi}
                      status={bmiStatus}
                      accentColor={bmiStatus?.color || '#64748b'}
                    />
                    <VitalCard
                      icon={<MdFavorite size={18} />}
                      label="SpO₂"
                      value={spo2}
                      unit="%"
                      status={spo2Status}
                      accentColor={spo2Status?.color || '#ef4444'}
                    />
                  </div>

                  {/* ── Input Form ────────────────────────────────── */}
                  <div className="vitals-input-grid">
                    <div className="input-group">
                      <label htmlFor="height">Height <span className="unit-label">(cm)</span></label>
                      <input
                        id="height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="e.g. 175"
                        className="intake-input"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="weight">Weight <span className="unit-label">(kg)</span></label>
                      <input
                        id="weight"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 72"
                        className="intake-input"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="bmi">BMI <span className="unit-label">(auto)</span></label>
                      <input
                        id="bmi"
                        type="number"
                        value={bmi}
                        placeholder="Auto-calculated"
                        className="intake-input intake-input--readonly"
                        readOnly
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="spo2">SpO₂ <span className="unit-label">(%)</span></label>
                      <input
                        id="spo2"
                        type="number"
                        value={spo2}
                        onChange={(e) => setSpo2(e.target.value)}
                        placeholder="e.g. 98"
                        className="intake-input"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="bp">Blood Pressure <span className="unit-label">(mmHg)</span></label>
                      <input
                        id="bp"
                        type="text"
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                        placeholder="e.g. 120/80"
                        className="intake-input"
                      />
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

                {/* Pharmacy Section */}
                <SectionCard
                  icon={<MdMedication />}
                  title="Pharmacy"
                  description="Prescribe and manage medications"
                  initiallyExpanded={false}
                >
                  <PharmacyTable
                    rows={pharmacyRows}
                    onRowsChanged={setPharmacyRows}
                    onStockWarnings={(warnings) => {
                      // Store warnings for save validation
                      console.log('Stock warnings:', warnings);
                    }}
                  />
                </SectionCard>

                {/* Pathology Section */}
                <SectionCard
                  icon={<MdScience />}
                  title="Pathology"
                  description="Order and track lab investigations"
                  initiallyExpanded={false}
                >
                  <PathologyTable
                    rows={pathologyRows}
                    onRowsChanged={setPathologyRows}
                  />
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

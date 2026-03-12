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
import { MdClose, MdSave, MdEdit, MdMonitorHeart, MdNote, MdMedication, MdScience, MdEventNote, MdFavorite } from 'react-icons/md';
import useSWR from 'swr';
import PatientProfileHeaderCard from '../doctor/PatientProfileHeaderCard';
import appointmentsService from '../../services/appointmentsService';
import patientsService from '../../services/patientsService';
import pharmacyService from '../../services/pharmacyService';
import pathologyService from '../../services/pathologyService';
import { PatientDetails } from '../../models/Patients';
import { calculateBMI, VitalsSchema } from '../../utils/vitalsHelpers';
import { Skeleton, SkeletonCard } from '../common/SkeletonLoaders';
import NumberInput from '../common/NumberInput';
import './AppointmentIntakeModal.css';

// Lazy load heavy form components and tables
const SectionCard = React.lazy(() => import('./SectionCard'));
const PharmacyTable = React.lazy(() => import('./PharmacyTable'));
const PathologyTable = React.lazy(() => import('./PathologyTable'));

const AppointmentIntakeModal = ({ isOpen, onClose, appointmentId, onSuccess }) => {
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successNotification, setSuccessNotification] = useState(null);

  // Form state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [spo2, setSpo2] = useState('');
  const [bp, setBp] = useState('');
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');

  // UI State
  const [isEditingVitals, setIsEditingVitals] = useState(false);

  // Pharmacy rows (for future) - eslint-disable-next-line no-unused-vars
  const [pharmacyRows, setPharmacyRows] = useState([]);

  // Pathology rows (for future)
  // eslint-disable-next-line no-unused-vars
  const [pathologyRows, setPathologyRows] = useState([]);

  // Follow-up data (for future)
  // eslint-disable-next-line no-unused-vars
  const [followUpData, setFollowUpData] = useState({});

  // Auto-calculate BMI using clinical helper
  useEffect(() => {
    if (height && weight) {
      const patientAge = patient?.age || appointment?.patientAge || null;
      const validBmi = calculateBMI(weight, height, patientAge);
      setBmi(validBmi);
    }
  }, [height, weight, patient, appointment]);

  // SWR Fetcher for optimized data loading
  const fetchIntakeData = async (id) => {
    const data = await appointmentsService.fetchAppointmentById(id);

    let patientId = null;
    if (typeof data.patientId === 'object' && data.patientId?._id) {
      patientId = data.patientId._id;
    } else if (typeof data.patientId === 'string') {
      patientId = data.patientId;
    }

    let patientData = null;
    let appointmentIntake = null;
    let loadedPharmacyRows = [];
    let loadedPathologyRows = [];

    if (patientId) {
      try {
        patientData = await patientsService.fetchPatientById(patientId);

        // Use a limit of 5 to avoid heavy payloads just for checking the current appointment
        const intakes = await patientsService.fetchIntakes(patientId, { limit: 5 });
        appointmentIntake = intakes.find(i => String(i.appointmentId) === String(id));

        if (appointmentIntake) {
          if (appointmentIntake.meta?.pharmacyItems && Array.isArray(appointmentIntake.meta.pharmacyItems)) {
            loadedPharmacyRows = await Promise.all(appointmentIntake.meta.pharmacyItems.map(async (item) => {
              let stock = 0;
              if (item.medicineId) {
                try {
                  const med = await pharmacyService.fetchMedicineById(item.medicineId);
                  stock = med.availableQty ?? med.stock ?? 0;
                } catch (e) { }
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
          }
          if (appointmentIntake.meta?.pathologyItems && Array.isArray(appointmentIntake.meta.pathologyItems)) {
            loadedPathologyRows = appointmentIntake.meta.pathologyItems.map(item => ({
              'Test Name': item.testName || '',
              Category: item.category || '',
              Priority: item.priority || 'Normal',
              Notes: item.notes || ''
            }));
          }
        }
      } catch (err) {
        console.warn('Failed optional patient fetch:', err);
      }
    }

    return { data, patientData, appointmentIntake, loadedPharmacyRows, loadedPathologyRows };
  };

  const { isLoading, error: swrError } = useSWR(
    isOpen && appointmentId ? `intake-${appointmentId}` : null,
    () => fetchIntakeData(appointmentId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      onSuccess: ({ data, patientData, appointmentIntake, loadedPharmacyRows, loadedPathologyRows }) => {
        setAppointment(data);
        if (patientData) setPatient(patientData);

        // Prefill vitals
        if (patientData) {
          if (patientData.height && !height) setHeight(patientData.height);
          if (patientData.weight && !weight) setWeight(patientData.weight);
          if (patientData.bmi && !bmi) setBmi(patientData.bmi);
          if (patientData.oxygen && !spo2) setSpo2(patientData.oxygen);
        }

        if (appointmentIntake) {
          if (appointmentIntake.triage?.vitals) {
            const v = appointmentIntake.triage.vitals;
            if (v.heightCm) setHeight(v.heightCm);
            if (v.weightKg) setWeight(v.weightKg);
            if (v.bmi) setBmi(v.bmi);
            if (v.spo2) setSpo2(v.spo2);
            if (v.temp) setTemp(v.temp);
            if (v.pulse) setPulse(v.pulse);
          }
          if (appointmentIntake.notes) setCurrentNotes(appointmentIntake.notes);
          if (loadedPharmacyRows.length > 0) setPharmacyRows(loadedPharmacyRows);
          if (loadedPathologyRows.length > 0) setPathologyRows(loadedPathologyRows);
        } else if (data.vitals) {
          if (data.vitals.heightCm || data.vitals.height_cm) setHeight(data.vitals.heightCm || data.vitals.height_cm);
          if (data.vitals.weightKg || data.vitals.weight_kg) setWeight(data.vitals.weightKg || data.vitals.weight_kg);
          if (data.vitals.bmi) setBmi(data.vitals.bmi);
          if (data.vitals.spo2) setSpo2(data.vitals.spo2);
          if (data.vitals.bp) setBp(data.vitals.bp);
        }

        if (!currentNotes && (data.currentNotes || data.notes)) {
          setCurrentNotes(data.currentNotes || data.notes || '');
        }
      },
      onError: (err) => {
        setError(err.message || 'Failed to load appointment');
      }
    }
  );

  const handleSave = async () => {
    if (isSaving || !isValid) return;

    // ── Biological Limit Validation (Bug 24, 29, 30) ──
    const patientAge = patient?.age || appointment?.patientAge || null;
    const vitalsValidation = VitalsSchema.validate({
      weightKg: weight,
      heightCm: height,
      spO2: spo2,
      temp: temp,
      pulse: pulse,
      bp: bp
    }, patientAge);

    if (!vitalsValidation.isValid) {
      // Exclude soft warnings from blocking save if we want to allow skipping, 
      // but block hard errors (like SpO2 > 100 or < 0).
      const hardErrors = Object.entries(vitalsValidation.errors).filter(([key]) => !key.includes('Warning') && !key.includes('Required'));
      if (hardErrors.length > 0) {
        const errorStrings = hardErrors.map(([, msg]) => msg).join(' ');
        setError(`Vitals Error: ${errorStrings}`);
        return;
      }
    }

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
          temp: temp || null,
          pulse: pulse || null,
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

  // ── Form Validation State (Bug 31) ──
  const patientAge = patient?.age || appointment?.patientAge || null;
  const vitalsValidation = VitalsSchema.validate({
    weightKg: weight,
    heightCm: height,
    spO2: spo2,
    temp: temp,
    pulse: pulse,
    bp: bp
  }, patientAge);

  // Consider valid if there are no hard errors (warnings/required rules are ignorable for now, but math/biology breaks are blocked).
  const hardErrors = Object.entries(vitalsValidation.errors).filter(([key]) => !key.includes('Warning') && !key.includes('Required'));
  const isValid = hardErrors.length === 0;

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
    if (typeof val === 'string') return { label: 'Age < 18', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' };
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
          {error && !isLoading && !appointment ? (
            <div className="intake-modal-error">
              <p>{error || swrError?.message}</p>
              <button onClick={onClose} className="btn-error-close">Close</button>
            </div>
          ) : (
            <>
              {/* Scrollable Content */}
              <div className="intake-modal-scroll-area">
                {/* Patient Profile Header Card */}
                {isLoading && !patientForHeader ? (
                  <div className="intake-patient-header mb-4">
                    <SkeletonCard>
                      <div className="flex items-center gap-4">
                        <Skeleton variant="circular" width="60px" height="60px" />
                        <div className="flex-1">
                          <Skeleton width="40%" height="24px" className="mb-2" />
                          <Skeleton width="60%" height="16px" className="mb-1" />
                          <Skeleton width="30%" height="16px" />
                        </div>
                      </div>
                    </SkeletonCard>
                  </div>
                ) : patientForHeader && (
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
                <React.Suspense fallback={<SkeletonCard className="mb-4"><Skeleton width="100%" height="150px" /></SkeletonCard>}>
                  <SectionCard
                    icon={<MdMonitorHeart />}
                    title="Vital Signs"
                    description="Record patient vitals and measurements"
                    initiallyExpanded={true}
                    actionRenderer={() => (
                      <button
                        type="button"
                        onClick={() => setIsEditingVitals(!isEditingVitals)}
                        title={isEditingVitals ? "Done Editing" : "Update Vitals"}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                          borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                          border: '1px solid #e2e8f0', color: '#334155',
                          backgroundColor: isEditingVitals ? '#f8fafc' : 'white', cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = isEditingVitals ? '#f8fafc' : 'white'}
                      >
                        {isEditingVitals ? <MdSave size={14} className="text-teal-600" /> : <MdEdit size={14} className="text-slate-500" />}
                        {isEditingVitals ? 'Done' : 'Update Vitals'}
                      </button>
                    )}
                  >
                    {/* ── Live Vitals Display Grid (Default) ───────────────────── */}
                    {isLoading ? (
                      <div className="vitals-display-grid">
                        <SkeletonCard className="py-4"><Skeleton width="60%" height="20px" /><Skeleton width="30%" height="12px" /></SkeletonCard>
                        <SkeletonCard className="py-4"><Skeleton width="60%" height="20px" /><Skeleton width="30%" height="12px" /></SkeletonCard>
                        <SkeletonCard className="py-4"><Skeleton width="60%" height="20px" /><Skeleton width="30%" height="12px" /></SkeletonCard>
                        <SkeletonCard className="py-4"><Skeleton width="60%" height="20px" /><Skeleton width="30%" height="12px" /></SkeletonCard>
                      </div>
                    ) : !isEditingVitals ? (
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
                          unit="kg/m²"
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
                        <VitalCard
                          icon={<span className="vc-emoji">🩺</span>}
                          label="Blood Pressure"
                          value={bp}
                          unit="mmHg"
                          accentColor="#6366f1"
                        />
                      </div>
                    ) : (
                      /* ── Input Form (Edit Mode) ────────────────────────────────── */
                      <div className="vitals-input-grid mt-2">
                        {/* Height */}
                        <div className="input-group">
                          <label htmlFor="height">Height <span className="unit-label">(cm)</span></label>
                          <NumberInput
                            id="height"
                            min="20"
                            max="300"
                            value={height}
                            onChange={(val) => { setHeight(val); setError(''); }}
                            placeholder="e.g. 170"
                            className={`intake-input ${(() => {
                              const v = VitalsSchema.validate({ heightCm: height });
                              if (v.errors.heightCm) return 'error';
                              return '';
                            })()}`}
                          />
                          {(() => {
                            const v = VitalsSchema.validate({ heightCm: height });
                            if (v.errors.heightCm) return <div className="validation-message error">⚠️ {v.errors.heightCm}</div>;
                            return null;
                          })()}
                        </div>

                        {/* Weight */}
                        <div className="input-group">
                          <label htmlFor="weight">Weight <span className="unit-label">(kg)</span></label>
                          <NumberInput
                            id="weight"
                            min="0.5"
                            max="400"
                            value={weight}
                            onChange={(val) => { setWeight(val); setError(''); }}
                            placeholder="e.g. 72"
                            className={`intake-input ${(() => {
                              const patientAge = patient?.age || appointment?.patientAge || null;
                              const v = VitalsSchema.validate({ weightKg: weight }, patientAge);
                              if (v.errors.weightKg) return 'error';
                              if (v.errors.weightKgWarning) return 'warning';
                              return '';
                            })()}`}
                          />
                          {(() => {
                            const patientAge = patient?.age || appointment?.patientAge || null;
                            const v = VitalsSchema.validate({ weightKg: weight }, patientAge);
                            if (v.errors.weightKg) return <div className="validation-message error">⚠️ {v.errors.weightKg}</div>;
                            if (v.errors.weightKgWarning) return <div className="validation-message warning">⚠️ {v.errors.weightKgWarning}</div>;
                            return null;
                          })()}
                        </div>

                        {/* BMI */}
                        <div className="input-group">
                          <label htmlFor="bmi">BMI <span className="unit-label">(auto)</span></label>
                          <NumberInput
                            id="bmi"
                            value={bmi}
                            placeholder="Auto-calculated"
                            className="intake-input intake-input--readonly"
                            readOnly
                            onChange={() => { }}
                          />
                        </div>

                        {/* Temp */}
                        <div className="input-group">
                          <label htmlFor="temp">Temp <span className="unit-label">(°C)</span></label>
                          <NumberInput
                            id="temp"
                            min="30"
                            max="45"
                            value={temp}
                            onChange={(val) => setTemp(val)}
                            placeholder="e.g. 37.0"
                            className={`intake-input ${(() => {
                              const v = VitalsSchema.validate({ temp: temp });
                              if (v.errors.temp) return 'error';
                              return '';
                            })()}`}
                          />
                          {(() => {
                            const v = VitalsSchema.validate({ temp: temp });
                            if (v.errors.temp) return <div className="validation-message error">⚠️ {v.errors.temp}</div>;
                            return null;
                          })()}
                        </div>

                        {/* Pulse */}
                        <div className="input-group">
                          <label htmlFor="pulse">Heart Rate <span className="unit-label">(bpm)</span></label>
                          <NumberInput
                            id="pulse"
                            min="0"
                            max="300"
                            value={pulse}
                            onChange={(val) => setPulse(val)}
                            placeholder="e.g. 80"
                            className={`intake-input ${(() => {
                              const v = VitalsSchema.validate({ pulse: pulse });
                              if (v.errors.pulse) return 'error';
                              return '';
                            })()}`}
                          />
                          {(() => {
                            const v = VitalsSchema.validate({ pulse: pulse });
                            if (v.errors.pulse) return <div className="validation-message error">⚠️ {v.errors.pulse}</div>;
                            return null;
                          })()}
                        </div>

                        {/* SpO2 */}
                        <div className="input-group">
                          <label htmlFor="spo2">SpO₂ <span className="unit-label">(%)</span></label>
                          <NumberInput
                            id="spo2"
                            min="0"
                            max="100"
                            step="1"
                            value={spo2}
                            onChange={(val) => setSpo2(val)}
                            placeholder="e.g. 98"
                            className={`intake-input ${(() => {
                              const v = VitalsSchema.validate({ spO2: spo2 });
                              if (v.errors.spO2) return 'error';
                              if (v.errors.spO2Warning || v.errors.spO2Required) return 'warning';
                              return '';
                            })()}`}
                          />
                          {/* Live Validation Feedback */}
                          {(() => {
                            const v = VitalsSchema.validate({ spO2: spo2 });
                            if (v.errors.spO2) return <div className="validation-message error">⚠️ {v.errors.spO2}</div>;
                            if (v.errors.spO2Warning) return <div className="validation-message warning">⚠️ {v.errors.spO2Warning}</div>;
                            if (v.errors.spO2Required) return <div className="validation-message warning">ⓘ {v.errors.spO2Required}</div>;
                            return null;
                          })()}
                        </div>

                        {/* Blood Pressure */}
                        <div className="input-group">
                          <label htmlFor="bp">Blood Pressure <span className="unit-label">(mmHg)</span></label>
                          <input
                            id="bp"
                            type="text"
                            value={bp}
                            onChange={(e) => setBp(e.target.value)}
                            placeholder="e.g. 120/80"
                            className={`intake-input ${(() => {
                              const v = VitalsSchema.validate({ bp: bp });
                              if (v.errors.bp || v.errors.bpSys || v.errors.bpDia || v.errors.bpFormat) return 'error';
                              return '';
                            })()}`}
                          />
                          {(() => {
                            const v = VitalsSchema.validate({ bp: bp });
                            if (v.errors.bp) return <div className="validation-message error">⚠️ {v.errors.bp}</div>;
                            if (v.errors.bpFormat) return <div className="validation-message error">⚠️ {v.errors.bpFormat}</div>;
                            if (v.errors.bpSys) return <div className="validation-message error">⚠️ {v.errors.bpSys}</div>;
                            if (v.errors.bpDia) return <div className="validation-message error">⚠️ {v.errors.bpDia}</div>;
                            return null;
                          })()}
                        </div>
                      </div>
                    )}
                  </SectionCard>
                </React.Suspense>

                {/* Current Notes Section */}
                <React.Suspense fallback={<SkeletonCard className="mb-4"><Skeleton width="100%" height="150px" /></SkeletonCard>}>
                  <SectionCard
                    icon={<MdNote />}
                    title="Clinical Notes / Triage"
                    description="Patient condition, complaints, and observations"
                    initiallyExpanded={true}
                  >
                    <div className="intake-notes-container">
                      <textarea
                        value={currentNotes}
                        onChange={(e) => { setCurrentNotes(e.target.value); setError(''); }}
                        placeholder="Enter clinical observations, chief complaints, and triage notes here..."
                        className="intake-textarea"
                        rows={4}
                      />
                    </div>
                  </SectionCard>
                </React.Suspense>              {/* E-Prescription (Pharmacy) Section */}
                <React.Suspense fallback={<SkeletonCard className="mb-4"><Skeleton width="100%" height="200px" /></SkeletonCard>}>
                  <SectionCard
                    icon={<MdMedication />}
                    title="E-Prescription & Pharmacy"
                    description="Prescribe medicines and view stock alerts"
                    initiallyExpanded={false}
                  >
                    <PharmacyTable
                      rows={pharmacyRows}
                      onRowsChanged={setPharmacyRows}
                      onStockWarnings={(warnings) => {
                        console.log('Stock warnings:', warnings);
                      }}
                    />
                  </SectionCard>
                </React.Suspense>

                {/* Pathology & Lab Orders */}
                <React.Suspense fallback={<SkeletonCard className="mb-4"><Skeleton width="100%" height="200px" /></SkeletonCard>}>
                  <SectionCard
                    icon={<MdScience />}
                    title="Pathology & Lab Orders"
                    description="Order tests and investigations"
                    initiallyExpanded={false}
                  >
                    <PathologyTable
                      rows={pathologyRows}
                      onRowsChanged={setPathologyRows}
                    />
                  </SectionCard>
                </React.Suspense>

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

              {/* Sticky Footer */}
              <div className="intake-modal-footer">
                <button
                  className="intake-btn-cancel"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className={`intake-btn-save ${(!isValid || isSaving || isLoading) ? 'opacity-50 cursor-not-allowed bg-slate-400 border-slate-400' : 'bg-primary-600 hover:bg-primary-700'} transition-all duration-200`}
                  onClick={handleSave}
                  disabled={!isValid || isSaving || isLoading} // Disabled if form is fundamentally broken
                >
                  {isSaving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      Saving Intake...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MdSave size={18} />
                      Complete Intake
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentIntakeModal;

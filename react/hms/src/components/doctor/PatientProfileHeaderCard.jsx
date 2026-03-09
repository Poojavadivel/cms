/**
 * PatientProfileHeaderCard.jsx
 * Shows patient avatar, name, patient code, and info pills.
 * Includes a self-contained Edit Modal (slide-out drawer) that opens
 * when the Edit button is clicked — no parent wiring required.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdEdit, MdClose, MdSave, MdBadge } from 'react-icons/md';
import patientsService from '../../services/patientsService';
import './PatientProfileHeaderCard.css';

import boyIcon from '../../assets/boyicon.png';
import girlIcon from '../../assets/girlicon.png';

// ─── Constants ────────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Edit Drawer Overlay ──────────────────────────────────────────────────────
const EditPatientDrawer = ({ patient, isOpen, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    phone: '',
    email: '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Populate form when drawer opens
  useEffect(() => {
    if (isOpen && patient) {
      setForm({
        name: patient.name || patient.fullName || '',
        age: patient.age || '',
        gender: patient.gender || 'Male',
        bloodGroup: patient.bloodGroup || '',
        phone: patient.phone || '',
        email: patient.email || '',
        houseNo: patient.houseNo || '',
        street: patient.street || '',
        city: patient.city || '',
        state: patient.state || '',
        pincode: patient.pincode || '',
        country: patient.country || '',
      });
      setErrors({});
      setSaveMsg('');
    }
  }, [isOpen, patient]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Patient name is required';
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) <= 0)) e.age = 'Enter a valid age';
    if (form.phone && !/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid phone number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const patientId = patient.patientId || patient._id || patient.id;
      await patientsService.updatePatient(patientId, {
        name: form.name.trim(),
        fullName: form.name.trim(),
        age: Number(form.age) || undefined,
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        houseNo: form.houseNo || undefined,
        street: form.street || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        country: form.country || undefined,
      });
      setSaveMsg('✅ Saved successfully!');
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 600);
    } catch (err) {
      setSaveMsg(`❌ ${err.message || 'Save failed'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = (field) =>
    `w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${errors[field]
      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
      : 'border-slate-200 focus:ring-primary-500/20 focus:border-primary-500'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={onClose}
      />
      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col animate-[slideIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-primary-700 to-primary-900 text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Edit Patient Profile</h2>
            <p className="text-[11px] font-medium text-primary-100 mt-0.5 uppercase tracking-wider">
              {patient?.patientCode || 'No Code'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Personal Info */}
          <SectionLabel>Personal Information</SectionLabel>

          <div className="space-y-1.5">
            <FieldLabel required>Full Name</FieldLabel>
            <input className={inputCls('name')} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Patient full name" />
            {errors.name && <ErrorMsg>{errors.name}</ErrorMsg>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Age</FieldLabel>
              <input type="number" min="0" className={inputCls('age')} value={form.age} onChange={e => updateField('age', e.target.value)} placeholder="e.g. 29" />
              {errors.age && <ErrorMsg>{errors.age}</ErrorMsg>}
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Gender</FieldLabel>
              <select className={inputCls('gender')} value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Blood Group</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map(bg => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => updateField('bloodGroup', bg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.bloodGroup === bg
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                    }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <SectionLabel>Contact</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Phone</FieldLabel>
              <input className={inputCls('phone')} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+91 9876543210" />
              {errors.phone && <ErrorMsg>{errors.phone}</ErrorMsg>}
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Email</FieldLabel>
              <input className={inputCls('email')} value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="patient@email.com" />
              {errors.email && <ErrorMsg>{errors.email}</ErrorMsg>}
            </div>
          </div>

          {/* Address */}
          <SectionLabel>Address</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>House / Flat No.</FieldLabel>
              <input className={inputCls('houseNo')} value={form.houseNo} onChange={e => updateField('houseNo', e.target.value)} placeholder="e.g. 42-B" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Street</FieldLabel>
              <input className={inputCls('street')} value={form.street} onChange={e => updateField('street', e.target.value)} placeholder="e.g. MG Road" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>City</FieldLabel>
              <input className={inputCls('city')} value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="e.g. Chennai" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>State</FieldLabel>
              <input className={inputCls('state')} value={form.state} onChange={e => updateField('state', e.target.value)} placeholder="e.g. TN" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Pincode</FieldLabel>
              <input className={inputCls('pincode')} value={form.pincode} onChange={e => updateField('pincode', e.target.value)} placeholder="600001" />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Country</FieldLabel>
            <input className={inputCls('country')} value={form.country} onChange={e => updateField('country', e.target.value)} placeholder="e.g. India" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 shrink-0 space-y-3">
          {saveMsg && (
            <p className={`text-sm font-bold text-center ${saveMsg.startsWith('✅') ? 'text-emerald-600' : 'text-rose-600'}`}>{saveMsg}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <><MdSave size={18} /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0.5; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
    </>
  );
};

// ─── Tiny helper sub-components ───────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-2 pt-2">
    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{children}</span>
    <div className="flex-1 h-px bg-slate-200" />
  </div>
);
const FieldLabel = ({ children, required }) => (
  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);
const ErrorMsg = ({ children }) => (
  <p className="text-[10px] text-rose-500 font-bold ml-1">{children}</p>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PatientProfileHeaderCard = ({ patient, latestIntake, onEdit }) => {
  const [freshData, setFreshData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadFreshData = useCallback(async () => {
    if (!patient?.patientId) {
      setFreshData(patient);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await patientsService.fetchPatientById(patient.patientId);
      setFreshData(data);
    } catch (error) {
      console.warn('Failed to fetch fresh data, using provided patient:', error);
      setFreshData(patient);
    } finally {
      setIsLoading(false);
    }
  }, [patient]);

  useEffect(() => {
    loadFreshData();
  }, [loadFreshData]);

  if (isLoading) {
    return (
      <div className="patient-profile-header-card loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const displayPatient = freshData || patient;

  const handleEditClick = () => {
    if (onEdit) {
      // If parent provided an onEdit handler, use it
      onEdit();
    } else {
      // Otherwise, open built-in drawer
      setIsEditOpen(true);
    }
  };

  return (
    <>
      <PatientProfileHeaderCardContent
        patient={displayPatient}
        latestIntake={latestIntake}
        onEdit={handleEditClick}
      />
      <EditPatientDrawer
        patient={displayPatient}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={() => loadFreshData()}
      />
    </>
  );
};

const PatientProfileHeaderCardContent = ({ patient, latestIntake, onEdit }) => {
  const name = patient?.name || patient?.fullName || '—';
  const isFemale = patient?.gender?.toLowerCase() === 'female';
  const avatar = isFemale ? girlIcon : boyIcon;

  const formatValue = (val, suffix = '') => {
    if (val == null || val === '' || val === 0 || val === '0') return '—';
    return `${val}${suffix}`;
  };

  const bloodGroup = formatValue(patient?.bloodGroup);
  const age = patient?.age || 0;
  const ageDisplay = age === 0 ? '—' : `${age} yrs`;

  return (
    <div className="pv-summary-header">
      <div className="pv-header-content">
        {/* Avatar */}
        <div className="pv-avatar-section">
          <div className="pv-avatar-container">
            <img
              src={avatar}
              alt={name}
              className="pv-avatar-image"
              onError={(e) => {
                e.target.src = isFemale ? girlIcon : boyIcon;
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="pv-info-section flex-1 w-full">
          <div className="flex justify-between items-start w-full">
            <div className="pv-name-row">
              <h2 className="pv-name-main">{name}</h2>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 transition-all duration-200"
              onClick={onEdit}
            >
              <MdEdit size={16} className="text-slate-500" /> Edit
            </button>
          </div>

          <div className="pv-info-pills mt-3">
            <div className="pv-pill">
              <MdBadge /> <span>{isFemale ? 'Female' : 'Male'}</span>
            </div>
            <div className="pv-pill">
              <MdBadge /> <span>Age: {ageDisplay}</span>
            </div>
            <div className="pv-pill">
              <MdBadge /> <span>Blood: {bloodGroup}</span>
            </div>
          </div>
        </div>

        {/* Right Actions — Removed legacy edit button */}
      </div>
    </div>
  );
};

export default PatientProfileHeaderCard;

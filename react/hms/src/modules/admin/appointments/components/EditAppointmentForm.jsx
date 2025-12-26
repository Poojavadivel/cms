import React, { useState, useEffect, useCallback } from 'react';
import appointmentsService from '../../../../services/appointmentsService';
import { AppointmentDraft } from '../../../../models/AppointmentDraft';
import {
  MdClose,
  MdPerson,
  MdEvent,
  MdLocationOn,
  MdMonitorHeart,
  MdNotes,
  MdDelete,
  MdSave,
  MdCheckCircle,
  MdMale,
  MdFemale
} from 'react-icons/md';

const EditAppointmentForm = ({ appointmentId, onClose, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    appointmentType: 'Consultation',
    date: '',
    time: '',
    location: '',
    notes: '',
    chiefComplaint: '',
    mode: 'In-clinic',
    priority: 'Normal',
    duration: 20,
    status: 'Scheduled',
    heightCm: '',
    weightKg: '',
    bp: '',
    heartRate: '',
    spo2: '',
    phoneNumber: '',
    gender: 'Male',
    sendReminder: true
  });

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentsService.fetchAppointmentById(appointmentId);

      // Parse date and time
      let date = '';
      let time = '';

      if (data.startAt) {
        const startAt = new Date(data.startAt);
        date = startAt.toISOString().split('T')[0];
        time = `${String(startAt.getHours()).padStart(2, '0')}:${String(startAt.getMinutes()).padStart(2, '0')}`;
      } else {
        date = data.date || '';
        time = data.time || '';
      }

      // Get patient details
      let patientName = '';
      let patientId = '';
      let phoneNumber = '';
      let gender = 'Male';

      if (data.patientId && typeof data.patientId === 'object') {
        const p = data.patientId;
        patientName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        patientId = p.metadata?.patientCode || p._id || '';

        if (typeof p.phone === 'object') {
          phoneNumber = p.phone?.phone || p.phone?.number || '';
        } else {
          phoneNumber = p.phone || p.phoneNumber || '';
        }

        gender = p.gender || 'Male';
      } else if (data.patientId) {
        patientId = data.patientId;
        patientName = data.clientName || '';
      }

      const metadata = data.metadata || {};
      const vitals = data.vitals || {};

      setFormData({
        patientName: data.clientName || patientName,
        patientId: patientId,
        appointmentType: data.appointmentType || 'Consultation',
        date,
        time,
        location: data.location || '',
        notes: data.notes || '',
        chiefComplaint: metadata.chiefComplaint || data.chiefComplaint || '',
        mode: metadata.mode || 'In-clinic',
        priority: metadata.priority || 'Normal',
        duration: metadata.durationMinutes || 20,
        status: data.status || 'Scheduled',
        heightCm: vitals.heightCm || '',
        weightKg: vitals.weightKg || '',
        bp: vitals.bp || '',
        heartRate: vitals.heartRate || '',
        spo2: vitals.spo2 || '',
        phoneNumber: metadata.phoneNumber || phoneNumber,
        gender: metadata.gender || gender,
        sendReminder: metadata.reminder !== undefined ? metadata.reminder : true
      });
    } catch (error) {
      console.error('Failed to load appointment:', error);
      alert('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.time) {
      alert('Date and Time are required');
      return;
    }

    setSaving(true);
    try {
      // Use AppointmentDraft structure
      const draft = new AppointmentDraft({
        id: appointmentId,
        clientName: formData.patientName,
        patientId: formData.patientId,
        appointmentType: formData.appointmentType,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.notes,
        chiefComplaint: formData.chiefComplaint,
        mode: formData.mode,
        priority: formData.priority,
        durationMinutes: formData.duration,
        status: formData.status,
        heightCm: formData.heightCm || null,
        weightKg: formData.weightKg || null,
        bp: formData.bp || null,
        heartRate: formData.heartRate || null,
        spo2: formData.spo2 || null,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        reminder: formData.sendReminder
      });

      const payload = draft.toJSON();

      await appointmentsService.updateAppointment(appointmentId, payload);

      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update appointment:', error);
      alert('Failed to update appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this appointment for ${formData.patientName}?`)) {
      return;
    }

    try {
      await appointmentsService.deleteAppointment(appointmentId);
      if (onDelete) onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      alert('Failed to delete appointment');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  // --- REUSABLE COMPONENTS FOR UI CONSISTENCY ---

  const FormSection = ({ icon: Icon, title, subtitle, children }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-4">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-[#1e293b] rounded-xl text-white">
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', required = false, placeholder = '', disabled = false, fullWidth = false }) => (
    <div className={`flex flex-col ${fullWidth ? 'col-span-full' : ''}`}>
      <label className="text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {/* Icon placeholders could go here if needed */}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>
    </div>
  );

  const SelectField = ({ label, value, onChange, options, required = false }) => (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 1 6 6 11 1"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-[#f8fafc] w-[95%] max-w-[1400px] h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="bg-[#1e3a8a] text-white px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="p-2 bg-white/10 rounded-lg"><MdCheckCircle size={24} /></span>
              Edit Appointment
            </h2>
            <p className="text-blue-100 mt-1 text-sm opacity-90">Update appointment details and save changes</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-6">

            {/* SECTION 1: Patient Information */}
            <FormSection
              icon={MdPerson}
              title="Patient Information"
              subtitle="Basic patient details and demographics"
            >
              <div className="grid grid-cols-2 gap-6">
                <InputField
                  label="Client Name"
                  value={formData.patientName}
                  onChange={(val) => handleChange('patientName', val)}
                  required
                  placeholder="Patient Name"
                // disabled // Usually locked in edit mode but let's allow edits for now or keep disabled if preferred
                />
                <InputField
                  label="Patient ID"
                  value={formData.patientId}
                  onChange={(val) => handleChange('patientId', val)}
                  placeholder="ID"
                  disabled
                />

                {/* Gender Selection - Custom Radio Look */}
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleChange('gender', 'Male')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${formData.gender === 'Male' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <MdMale size={20} /> Male
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('gender', 'Female')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${formData.gender === 'Female' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <MdFemale size={20} /> Female
                    </button>
                  </div>
                </div>

                <InputField
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(val) => handleChange('phoneNumber', val)}
                  placeholder="+91..."
                />
              </div>
            </FormSection>

            {/* SECTION 2: Appointment Schedule */}
            <FormSection
              icon={MdEvent}
              title="Appointment Schedule"
              subtitle="Date, time, and appointment details"
            >
              <div className="grid grid-cols-2 gap-6">
                <InputField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(val) => handleChange('date', val)}
                  required
                />
                <InputField
                  label="Time"
                  type="time"
                  value={formData.time}
                  onChange={(val) => handleChange('time', val)}
                  required
                />
                <SelectField
                  label="Mode"
                  value={formData.mode}
                  onChange={(val) => handleChange('mode', val)}
                  options={[
                    { value: 'In-clinic', label: 'In-clinic' },
                    { value: 'Video', label: 'Video Call' },
                    { value: 'Phone', label: 'Phone Call' }
                  ]}
                />
                <SelectField
                  label="Duration"
                  value={formData.duration}
                  onChange={(val) => handleChange('duration', parseInt(val))}
                  options={[
                    { value: 15, label: '15 minutes' },
                    { value: 20, label: '20 minutes' },
                    { value: 30, label: '30 minutes' },
                    { value: 45, label: '45 minutes' },
                    { value: 60, label: '1 hour' }
                  ]}
                />
                <SelectField
                  label="Priority"
                  value={formData.priority}
                  onChange={(val) => handleChange('priority', val)}
                  options={[
                    { value: 'Normal', label: 'Normal' },
                    { value: 'Urgent', label: 'Urgent' },
                    { value: 'High', label: 'High' }
                  ]}
                />
                <SelectField
                  label="Status"
                  value={formData.status}
                  onChange={(val) => handleChange('status', val)}
                  options={[
                    { value: 'Scheduled', label: 'Scheduled' },
                    { value: 'Confirmed', label: 'Confirmed' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Cancelled', label: 'Cancelled' },
                    { value: 'Completed', label: 'Completed' }
                  ]}
                />
              </div>
            </FormSection>

            {/* SECTION 3: Location & Contact */}
            <FormSection
              icon={MdLocationOn}
              title="Location & Contact"
              subtitle="Appointment venue and contact details"
            >
              <div className="space-y-6">
                <InputField
                  label="Location"
                  value={formData.location}
                  onChange={(val) => handleChange('location', val)}
                  required
                  placeholder="e.g. Consultation Room 2"
                  fullWidth
                />
                <InputField
                  label="Chief Complaint"
                  value={formData.chiefComplaint}
                  onChange={(val) => handleChange('chiefComplaint', val)}
                  placeholder="Reasons for visit"
                  fullWidth
                />
              </div>
            </FormSection>

            {/* SECTION 4: Quick Vitals */}
            <FormSection
              icon={MdMonitorHeart}
              title="Quick Vitals"
              subtitle="Optional health measurements"
            >
              <div className="grid grid-cols-2 gap-6">
                <InputField
                  label="Height (cm)"
                  value={formData.heightCm}
                  onChange={(val) => handleChange('heightCm', val)}
                  placeholder="e.g., 175"
                />
                <InputField
                  label="Weight (kg)"
                  value={formData.weightKg}
                  onChange={(val) => handleChange('weightKg', val)}
                  placeholder="e.g., 72"
                />
                <InputField
                  label="Blood Pressure"
                  value={formData.bp}
                  onChange={(val) => handleChange('bp', val)}
                  placeholder="120/80"
                />
                <InputField
                  label="Heart Rate (bpm)"
                  value={formData.heartRate}
                  onChange={(val) => handleChange('heartRate', val)}
                  placeholder="e.g., 78"
                />
                <InputField
                  label="SpO₂ (%)"
                  value={formData.spo2}
                  onChange={(val) => handleChange('spo2', val)}
                  placeholder="98"
                  fullWidth
                />
              </div>
            </FormSection>

            {/* SECTION 5: Clinical Notes & Preferences */}
            <FormSection
              icon={MdNotes}
              title="Clinical Notes & Preferences"
              subtitle="Additional information and reminders"
            >
              <div className="space-y-6">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Clinical Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Add any private notes here..."
                  />
                </div>

                {/* Send Reminder Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <h4 className="font-bold text-gray-900">Send Reminder</h4>
                    <p className="text-sm text-gray-500">Notify patient before appointment</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.sendReminder}
                      onChange={(e) => handleChange('sendReminder', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </FormSection>

          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-gray-200 p-6 flex justify-between items-center shrink-0 rounded-b-2xl">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <MdClose size={18} /> Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-2.5 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <MdDelete size={18} /> Delete
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-[#1e3a8a] text-white font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <MdCheckCircle size={20} /> Save Changes
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditAppointmentForm;

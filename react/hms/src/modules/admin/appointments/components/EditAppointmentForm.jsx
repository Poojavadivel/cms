import React, { useState, useEffect, useCallback } from 'react';
import appointmentsService from '../../../../services/appointmentsService';
import { AppointmentDraft } from '../../../../models/AppointmentDraft';
import {
  MdClose,
  MdPerson,
  MdEvent,
  MdNotes,
  MdDelete,
  MdCheckCircle,
  MdMale,
  MdFemale
} from 'react-icons/md';

const EditAppointmentForm = ({ appointmentId, onClose, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Simplified form state matching New Appointment flow
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    date: '',
    time: '',
    notes: '',
    chiefComplaint: '', // Reason
    status: 'Scheduled',
    gender: 'Male',
    patientCode: ''
  });

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentsService.fetchAppointmentById(appointmentId);

      // Parse date and time robustly
      let date = '';
      let time = '';

      if (data.startAt) {
        const startAt = new Date(data.startAt);
        date = startAt.toISOString().split('T')[0];
        time = startAt.toTimeString().substring(0, 5); // HH:mm
      } else {
        // Handle date
        if (data.date) {
          if (data.date.includes('T')) {
            date = data.date.split('T')[0];
          } else {
            date = data.date;
          }
        }

        // Handle time
        if (data.time) {
          time = data.time;
          const lowerTime = time.toLowerCase();
          if (lowerTime.includes('am') || lowerTime.includes('pm')) {
            const [tPart, modifier] = time.split(' ');
            let [hours, minutes] = tPart.split(':');
            if (hours === '12') hours = '00';
            if (modifier.toLowerCase() === 'pm') hours = parseInt(hours, 10) + 12;
            time = `${hours}:${minutes}`;
          }
        }
      }

      // Patient Details
      let patientName = '';
      let patientId = '';
      let gender = 'Male';
      let patientCode = '';

      if (data.patientId && typeof data.patientId === 'object') {
        const p = data.patientId;
        patientName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        patientId = p._id || '';
        patientCode = p.metadata?.patientCode || p._id || '';
        gender = p.gender || 'Male';
      } else if (data.patientId) {
        patientId = data.patientId;
        patientName = data.clientName || '';
        patientCode = data.patientId;
      }

      setFormData({
        patientName: data.clientName || patientName,
        patientId: patientId,
        date,
        time,
        notes: data.notes || '',
        chiefComplaint: data.chiefComplaint || data.reason || '',
        status: data.status || 'Scheduled',
        gender: gender,
        patientCode: patientCode
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
      // Build simple payload for update
      const payload = {
        date: formData.date,
        time: formData.time,
        reason: formData.chiefComplaint,
        chiefComplaint: formData.chiefComplaint,
        notes: formData.notes,
        status: formData.status,
        startAt: new Date(`${formData.date}T${formData.time}`).toISOString()
      };

      await appointmentsService.updateAppointment(appointmentId, payload);
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update:', error);
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
      console.error('Failed to delete:', error);
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

  // Helper Components
  const FormSection = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', required = false, placeholder = '', disabled = false, fullWidth = false }) => (
    <div className={`flex flex-col ${fullWidth ? 'col-span-full' : ''}`}>
      <label className="text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-[#f8fafc] w-[95%] max-w-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        {/* HEADER */}
        <div className="bg-[#1e3a8a] text-white px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <MdCheckCircle size={24} className="text-green-400" />
              Edit Appointment
            </h2>
            <p className="text-blue-100 mt-1 text-sm opacity-90">Update details for {formData.patientName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white">
            <MdClose size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-6">

            {/* Patient Info (Read Only) */}
            <FormSection icon={MdPerson} title="Patient Information">
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Patient Name" value={formData.patientName} onChange={() => { }} disabled />
                <InputField label="Patient ID" value={formData.patientCode} onChange={() => { }} disabled />
              </div>
            </FormSection>

            {/* Schedule & Details */}
            <FormSection icon={MdEvent} title="Appointment Details">
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Date" type="date" value={formData.date} onChange={(val) => handleChange('date', val)} required />
                <InputField label="Time" type="time" value={formData.time} onChange={(val) => handleChange('time', val)} required />

                <InputField
                  label="Reason / Chief Complaint"
                  value={formData.chiefComplaint}
                  onChange={(val) => handleChange('chiefComplaint', val)}
                  fullWidth
                  required
                  placeholder="Reason for visit"
                />

                <div className="flex flex-col col-span-full">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['Scheduled', 'Confirmed', 'Pending', 'Cancelled'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleChange('status', s)}
                        className={`py-3 px-2 rounded-lg border font-bold text-sm transition-all ${formData.status === s
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Notes */}
            <FormSection icon={MdNotes} title="Clinical Notes">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">Private Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Add any private notes here..."
                />
              </div>
            </FormSection>

          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-gray-200 p-6 flex justify-between items-center shrink-0">
          <button
            onClick={handleDelete}
            className="px-6 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <MdDelete size={18} /> Delete
          </button>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-[#1e3a8a] text-white font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditAppointmentForm;

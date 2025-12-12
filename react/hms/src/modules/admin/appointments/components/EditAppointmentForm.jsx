import React, { useState, useEffect, useCallback } from 'react';
import AuthService from '../../../../services/authService';
import { AppointmentDraft } from '../../../../models/AppointmentDraft';

const EditAppointmentForm = ({ appointmentId, onClose, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    appointmentType: 'Consultation',
    date: '',
    time: '',
    location: 'Clinic',
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
  });

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AuthService.get(`/appointments/${appointmentId}`);
      const data = response.data || response;
      
      // Parse date and time
      let date = '';
      let time = '';
      
      if (data.startAt) {
        const startAt = new Date(data.startAt);
        date = startAt.toISOString().split('T')[0];
        time = `${String(startAt.getHours()).padStart(2, '0')}:${String(startAt.getMinutes()).padStart(2, '0')}`;
      }
      
      // Get patient name
      let patientName = '';
      let patientId = '';
      if (data.patientId && typeof data.patientId === 'object') {
        patientName = `${data.patientId.firstName || ''} ${data.patientId.lastName || ''}`.trim();
        patientId = data.patientId._id || data.patientId.id;
      } else if (data.patientId) {
        patientId = data.patientId;
        patientName = data.clientName || '';
      }
      
      const metadata = data.metadata || {};
      const vitals = data.vitals || {};
      
      setFormData({
        patientName,
        patientId,
        appointmentType: data.appointmentType || 'Consultation',
        date,
        time,
        location: data.location || 'Clinic',
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
    // Validation
    if (!formData.date || !formData.time || !formData.chiefComplaint) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      // Create draft
      const draft = new AppointmentDraft({
        id: appointmentId,
        clientName: formData.patientName,
        patientId: formData.patientId,
        appointmentType: formData.appointmentType,
        date: new Date(formData.date),
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
      });

      const payload = draft.toJSON();
      
      await AuthService.put(`/appointments/${appointmentId}`, payload);
      
      onUpdate();
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
      await AuthService.delete(`/appointments/${appointmentId}`);
      onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      alert('Failed to delete appointment');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Appointment</h2>
                <p className="text-sm text-gray-600 mt-1">Updating for {formData.patientName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name</label>
                <input
                  type="text"
                  value={formData.patientName}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Appointment Type</label>
                <select
                  value={formData.appointmentType}
                  onChange={(e) => handleChange('appointmentType', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Check-up">Check-up</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (min)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Appointment Details</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => handleChange('mode', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="In-clinic">In-clinic</option>
                  <option value="Telehealth">Telehealth</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chief Complaint *</label>
                <input
                  type="text"
                  value={formData.chiefComplaint}
                  onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                  placeholder="e.g., Fever, Headache"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Clinical Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Vitals (Optional) */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Vitals (Optional)</h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                <input
                  type="text"
                  value={formData.heightCm}
                  onChange={(e) => handleChange('heightCm', e.target.value)}
                  placeholder="175"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="text"
                  value={formData.weightKg}
                  onChange={(e) => handleChange('weightKg', e.target.value)}
                  placeholder="70"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">BP</label>
                <input
                  type="text"
                  value={formData.bp}
                  onChange={(e) => handleChange('bp', e.target.value)}
                  placeholder="120/80"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">HR (bpm)</label>
                <input
                  type="text"
                  value={formData.heartRate}
                  onChange={(e) => handleChange('heartRate', e.target.value)}
                  placeholder="72"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SpO2 (%)</label>
                <input
                  type="text"
                  value={formData.spo2}
                  onChange={(e) => handleChange('spo2', e.target.value)}
                  placeholder="98"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={handleDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentForm;

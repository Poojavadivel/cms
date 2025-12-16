/**
 * AppointmentEditModal.jsx
 * Neo-Pro Standard Edition
 * Matching StaffFormEnterprise Design System
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdSave, MdDelete } from 'react-icons/md';
import './AppointmentEditModal.css';
import appointmentsService from '../../services/appointmentsService';

const AppointmentEditModal = ({ isOpen, onClose, appointmentId, onSuccess }) => {
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    clientName: '',
    patientId: '',
    phoneNumber: '',
    gender: 'Male',
    date: '',
    time: '',
    appointmentType: '',
    mode: 'In-clinic',
    priority: 'Normal',
    status: 'Scheduled',
    durationMinutes: 20,
    location: '',
    chiefComplaint: '',
    notes: '',
    heightCm: '',
    weightKg: '',
    bp: '',
    heartRate: '',
    spo2: ''
  });

  // Fetch Data on Open
  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appointmentId]);

  const fetchAppointment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await appointmentsService.fetchAppointmentById(appointmentId);

      // Handle nested patient object
      let clientName = data.clientName || '';
      let patientIdValue = data.patientId || '';
      let phoneNumber = data.phoneNumber || '';
      let gender = data.metadata?.gender || data.gender || 'Male';

      if (data.patientId && typeof data.patientId === 'object') {
        const patient = data.patientId;
        clientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        phoneNumber = patient.phone || patient.phoneNumber || '';
        patientIdValue = patient.metadata?.patientCode || patient._id || '';
        if (patient.gender) gender = patient.gender;
      }

      setFormData({
        clientName: clientName,
        patientId: String(patientIdValue),
        phoneNumber: String(phoneNumber),
        gender: gender,
        date: data.date || '',
        time: data.time || '',
        appointmentType: data.appointmentType || '',
        mode: data.mode || 'In-clinic',
        priority: data.priority || 'Normal',
        status: data.status || 'Scheduled',
        durationMinutes: data.durationMinutes || 20,
        location: data.location || '',
        chiefComplaint: data.chiefComplaint || '',
        notes: data.notes || '',
        heightCm: data.heightCm || '',
        weightKg: data.weightKg || '',
        bp: data.bp || '',
        heartRate: data.heartRate || '',
        spo2: data.spo2 || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const updateData = {
        ...formData,
        metadata: {
          ...formData.metadata,
          gender: formData.gender
        }
      };

      await appointmentsService.updateAppointment(appointmentId, updateData);

      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update appointment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      setIsSaving(true);
      await appointmentsService.deleteAppointment(appointmentId);
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete appointment');
      setIsSaving(false);
    }
  };

  // Safe Render Check: Hooks are called above, so now we can return null safely
  if (!isOpen) return null;

  return (
    <div className="appointment-edit-overlay">
      <div className="appointment-edit-container">

        {/* NEO HEADER */}
        <div className="neo-header">
          <div className="neo-title-group">
            <h2>Edit Appointment</h2>
            <p>ID: {formData.patientId || 'NEW'}</p>
          </div>
          <button className="neo-close-btn" onClick={onClose} disabled={isSaving}>
            <MdClose size={20} />
          </button>
        </div>

        {/* NEO BODY */}
        <div className="neo-body">
          <form onSubmit={handleSubmit} id="editForm">
            <div className="neo-form-grid">

              {/* Patient Info */}
              <div className="neo-input-group">
                <div className="neo-input-box">
                  <label className="neo-input-label">Patient Name</label>
                  <input className="neo-input" name="clientName" value={formData.clientName} onChange={handleChange} required disabled={isSaving} />
                </div>
              </div>

              <div className="neo-input-group">
                <div className="neo-input-box">
                  <label className="neo-input-label">Contact Number</label>
                  <input className="neo-input" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={isSaving} />
                </div>
              </div>

              {/* Date & Time */}
              <div className="neo-input-group">
                <div className="neo-input-box">
                  <label className="neo-input-label">Appointment Date</label>
                  <input type="date" className="neo-input" name="date" value={formData.date} onChange={handleChange} required disabled={isSaving} />
                </div>
              </div>

              <div className="neo-input-group">
                <div className="neo-input-box">
                  <label className="neo-input-label">Time</label>
                  <input type="time" className="neo-input" name="time" value={formData.time} onChange={handleChange} required disabled={isSaving} />
                </div>
              </div>

              {/* Status & Type */}
              <div className="neo-input-group">
                <div className="neo-input-box">
                  <label className="neo-input-label">Type</label>
                  <select className="neo-input" name="appointmentType" value={formData.appointmentType} onChange={handleChange} disabled={isSaving}>
                    <option value="">Select Type</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="neo-input-group">
                <div className="neo-input-box">
                  <label className="neo-input-label">Status</label>
                  <select className="neo-input" name="status" value={formData.status} onChange={handleChange} disabled={isSaving}>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Notes - Full Width */}
              <div className="neo-input-group neo-full-width">
                <div className="neo-input-box">
                  <label className="neo-input-label">Chief Complaint / Notes</label>
                  <textarea className="neo-input" rows="3" name="chiefComplaint" value={formData.chiefComplaint} onChange={handleChange} disabled={isSaving} placeholder="Reason for visit..." />
                </div>
              </div>

              <div className="neo-input-group neo-full-width">
                <div className="neo-input-box">
                  <label className="neo-input-label">Doctor's Internal Notes</label>
                  <textarea className="neo-input" rows="2" name="notes" value={formData.notes} onChange={handleChange} disabled={isSaving} placeholder="Private notes..." />
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* NEO FOOTER */}
        <div className="neo-footer">
          <button type="button" className="neo-btn-danger" onClick={handleDelete} disabled={isSaving}>
            <MdDelete size={16} /> Delete
          </button>

          <div className="neo-actions-right" style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="neo-btn-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" form="editForm" className="neo-btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'} <MdSave size={16} style={{ marginLeft: '4px' }} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AppointmentEditModal;

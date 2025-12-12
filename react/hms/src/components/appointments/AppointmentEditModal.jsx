/**
 * AppointmentEditModal.jsx
 * 95% screen edit modal matching Flutter's EditAppointmentForm
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdPerson, MdCalendarToday, MdLocationOn, MdNotes, MdDelete } from 'react-icons/md';
import './AppointmentEditModal.css';
import appointmentsService from '../../services/appointmentsService';

const AppointmentEditModal = ({ isOpen, onClose, appointmentId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  if (!isOpen) return null;

  return (
    <div className="appointment-edit-overlay">
      <div className="appointment-edit-container">
        {/* Close Button */}
        <button className="appointment-edit-close" onClick={onClose} disabled={isSaving}>
          <MdClose size={24} />
        </button>

        {/* Header */}
        <div className="appointment-edit-header">
          <h2>Edit Appointment</h2>
          <p>Update appointment information and vitals</p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="edit-loading">
            <div className="spinner"></div>
            <p>Loading appointment...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="appointment-edit-form">
            {error && <div className="error-banner">{error}</div>}

            <div className="form-scroll-container">
              {/* Patient Information */}
              <div className="form-section">
                <h3><MdPerson /> Patient Information</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Patient Name *</label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-field">
                    <label>Patient ID</label>
                    <input
                      type="text"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} disabled={isSaving}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="form-section">
                <h3><MdCalendarToday /> Appointment Details</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-field">
                    <label>Time *</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Type</label>
                    <select name="appointmentType" value={formData.appointmentType} onChange={handleChange} disabled={isSaving}>
                      <option value="">Select Type</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Routine">Routine</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      name="durationMinutes"
                      value={formData.durationMinutes}
                      onChange={handleChange}
                      min="5"
                      step="5"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Mode</label>
                    <select name="mode" value={formData.mode} onChange={handleChange} disabled={isSaving}>
                      <option value="In-clinic">In-clinic</option>
                      <option value="Telemedicine">Telemedicine</option>
                      <option value="Home Visit">Home Visit</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} disabled={isSaving}>
                      <option value="Normal">Normal</option>
                      <option value="Important">Important</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} disabled={isSaving}>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label><MdLocationOn style={{ verticalAlign: 'middle' }} /> Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Information */}
              <div className="form-section">
                <h3><MdNotes /> Clinical Information</h3>
                <div className="form-field">
                  <label>Chief Complaint</label>
                  <textarea
                    name="chiefComplaint"
                    value={formData.chiefComplaint}
                    onChange={handleChange}
                    rows="3"
                    disabled={isSaving}
                  />
                </div>
                <div className="form-field">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Vitals */}
              <div className="form-section">
                <h3>📊 Vitals (Optional)</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      name="heightCm"
                      value={formData.heightCm}
                      onChange={handleChange}
                      disabled={isSaving}
                      step="0.1"
                    />
                  </div>
                  <div className="form-field">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      name="weightKg"
                      value={formData.weightKg}
                      onChange={handleChange}
                      disabled={isSaving}
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Blood Pressure</label>
                    <input
                      type="text"
                      name="bp"
                      value={formData.bp}
                      onChange={handleChange}
                      placeholder="120/80"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-field">
                    <label>Heart Rate (bpm)</label>
                    <input
                      type="number"
                      name="heartRate"
                      value={formData.heartRate}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-field">
                    <label>SpO2 (%)</label>
                    <input
                      type="number"
                      name="spo2"
                      value={formData.spo2}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="appointment-edit-footer">
              <button
                type="button"
                className="btn-delete"
                onClick={handleDelete}
                disabled={isSaving}
              >
                <MdDelete />
                <span>Delete</span>
              </button>
              <div className="right-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AppointmentEditModal;

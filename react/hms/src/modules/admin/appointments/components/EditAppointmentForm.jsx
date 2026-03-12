import React, { useState, useEffect, useCallback } from 'react';
import appointmentsService from '../../../../services/appointmentsService';
import AvailabilityChecker from '../../../../components/appointments/AvailabilityChecker';
import './EditAppointmentForm.css';
import {
  MdClose,
  MdPerson,
  MdEvent,
  MdAccessTime,
  MdNotes,
  MdDelete,
  MdSave,
  MdMale,
  MdFemale,
  MdLocalHospital,
  MdBadge,
  MdPhone
} from 'react-icons/md';

// Placeholder patterns to filter out from notes/reason fields
const PLACEHOLDER_PATTERNS = [
  /created during registration/i,
  /auto[- ]?generated/i,
  /^default$/i,
  /^n\/?a$/i,
  /^none$/i,
  /^-+$/,
];
const isPlaceholder = (text) => {
  if (!text || !text.trim()) return true;
  return PLACEHOLDER_PATTERNS.some(p => p.test(text.trim()));
};
const cleanField = (val) => (val && !isPlaceholder(val)) ? val : '';

const EditAppointmentForm = ({ appointmentId, onClose, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    doctorId: '',
    doctorName: '',
    date: '',
    time: '',
    notes: '',
    chiefComplaint: '',
    status: 'Scheduled',
    gender: 'Male',
    patientCode: '',
    phone: ''
  });

  // Calculate startAt for availability checking
  const startAt = formData.date && formData.time
    ? new Date(`${formData.date}T${formData.time}`)
    : null;

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
        time = startAt.toTimeString().substring(0, 5);
      } else {
        if (data.date) {
          date = data.date.includes('T') ? data.date.split('T')[0] : data.date;
        }
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
      let phone = '';
      if (data.patientId && typeof data.patientId === 'object') {
        const p = data.patientId;
        patientName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        patientId = p._id || '';
        patientCode = p.metadata?.patientCode || p._id || '';
        gender = p.gender || 'Male';
        phone = p.phone?.number || p.phone || '';
      } else if (data.patientId) {
        patientId = data.patientId;
        patientName = data.clientName || '';
        patientCode = data.patientId;
      }

      // Doctor Details
      let doctorId = '';
      let doctorName = '';
      if (data.doctorId && typeof data.doctorId === 'object') {
        doctorId = data.doctorId._id || data.doctorId.id || '';
        doctorName = data.doctorId.name || `${data.doctorId.firstName || ''} ${data.doctorId.lastName || ''}`.trim();
      } else if (data.doctorId) {
        doctorId = data.doctorId;
        doctorName = data.doctorName || '';
      }

      // Load doctors list
      const doctorsList = await appointmentsService.fetchDoctors();
      setDoctors(doctorsList || []);

      setFormData({
        patientName: data.clientName || patientName,
        patientId,
        doctorId,
        doctorName,
        date,
        time,
        notes: cleanField(data.notes),
        chiefComplaint:
          data.chiefComplaint ||
          data.reason ||
          data.metadata?.chiefComplaint ||
          data.metadata?.reason ||
          '',
        status: data.status || 'Scheduled',
        gender,
        patientCode,
        phone
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
    if (!formData.doctorId) {
      alert('Doctor is required');
      return;
    }
    if (!isAvailable) {
      alert('The selected time slot is not available. Please choose a different time.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        date: formData.date,
        time: formData.time,
        reason: formData.chiefComplaint,
        chiefComplaint: formData.chiefComplaint,
        notes: formData.notes,
        status: formData.status,
        startAt: new Date(`${formData.date}T${formData.time}`).toISOString()
      };

      await appointmentsService.updateAppointment(appointmentId, payload);
      // Pass updated fields back to parent for immediate table refresh
      if (onUpdate) await onUpdate({
        chiefComplaint: formData.chiefComplaint,
        reason: formData.chiefComplaint,
        notes: formData.notes,
        status: formData.status,
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        date: formData.date,
        time: formData.time,
      });
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

  // Determine avatar based on gender
  const getAvatar = () => {
    const g = (formData.gender || '').toLowerCase().trim();
    if (g.includes('female') || g.startsWith('f')) return '/girlicon.png';
    return '/boyicon.png';
  };

  // Format time for display
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return 'Not set';
    try {
      const [h, m] = timeStr.split(':');
      let hr = parseInt(h);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      if (hr > 12) hr -= 12;
      if (hr === 0) hr = 12;
      return `${hr}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="edit-appt-overlay">
        <div className="edit-loading-container">
          <div className="edit-loading-inner">
            <div className="edit-loading-spinner"></div>
            <p className="edit-loading-text">Loading appointment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-appt-overlay">
      <button className="edit-close-floating" onClick={onClose} title="Close">
        <MdClose size={22} />
      </button>

      <div className="edit-appt-modal">
        {/* ===== LEFT PANEL: Patient Info ===== */}
        <div className="edit-left-panel">
          <div className="edit-patient-header">
            <div className="edit-patient-header-label">Patient</div>
            <h3 className="edit-patient-header-title">Details</h3>
          </div>

          <div className="edit-patient-card">
            <div className="edit-patient-avatar-wrapper">
              <img
                src={getAvatar()}
                alt={formData.gender}
                className="edit-patient-avatar"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className={`edit-patient-gender-badge ${formData.gender?.toLowerCase() === 'female' ? 'female' : 'male'}`}>
                {formData.gender?.toLowerCase() === 'female' ? <MdFemale size={16} /> : <MdMale size={16} />}
              </div>
            </div>

            <div className="edit-patient-info-center">
              <div className="edit-patient-name">{formData.patientName || 'Unknown'}</div>
              <div className="edit-patient-code">{formData.patientCode || formData.patientId}</div>

              <div className="edit-patient-details">
                <div className="edit-patient-detail-item">
                  <div className="edit-patient-detail-icon"><MdBadge size={18} /></div>
                  <div className="edit-patient-detail-text">
                    <div className="edit-patient-detail-label">Gender</div>
                    <div className="edit-patient-detail-value">{formData.gender || 'N/A'}</div>
                  </div>
                </div>

                {formData.phone && (
                  <div className="edit-patient-detail-item">
                    <div className="edit-patient-detail-icon"><MdPhone size={18} /></div>
                    <div className="edit-patient-detail-text">
                      <div className="edit-patient-detail-label">Phone</div>
                      <div className="edit-patient-detail-value">{formData.phone}</div>
                    </div>
                  </div>
                )}

                <div className="edit-patient-detail-item">
                  <div className="edit-patient-detail-icon"><MdEvent size={18} /></div>
                  <div className="edit-patient-detail-text">
                    <div className="edit-patient-detail-label">Appointment</div>
                    <div className="edit-patient-detail-value">{formatDateDisplay(formData.date)}</div>
                  </div>
                </div>

                <div className="edit-patient-detail-item">
                  <div className="edit-patient-detail-icon"><MdAccessTime size={18} /></div>
                  <div className="edit-patient-detail-text">
                    <div className="edit-patient-detail-label">Time Slot</div>
                    <div className="edit-patient-detail-value">{formatTimeDisplay(formData.time)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT PANEL: Editable Form ===== */}
        <div className="edit-right-panel">
          {/* Header */}
          <div className="edit-rp-header">
            <div className="edit-icon-badge">✏️</div>
            <div>
              <h2 className="edit-rp-title">Edit Appointment</h2>
              <p className="edit-rp-subtitle">Update details for {formData.patientName}</p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="edit-panel-content">
            {/* Doctor Selection */}
            <h3 className="edit-section-title">
              <MdLocalHospital size={18} />
              Assigned Doctor
            </h3>
            <div className="edit-form-group">
              <label>Doctor <span className="required">*</span></label>
              <select
                className="edit-input"
                value={formData.doctorId}
                onChange={(e) => {
                  const doctor = doctors.find(d => d.id === e.target.value);
                  handleChange('doctorId', e.target.value);
                  handleChange('doctorName', doctor ? doctor.name : '');
                }}
              >
                <option value="">Choose a doctor</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name} {doc.department ? `• ${doc.department}` : doc.specialization ? `• ${doc.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule */}
            <h3 className="edit-section-title">
              <MdEvent size={18} />
              Schedule
            </h3>
            <div className="edit-form-row">
              <div className="edit-form-group half">
                <label>Date <span className="required">*</span></label>
                <input
                  type="date"
                  className="edit-input"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>
              <div className="edit-form-group half">
                <label>Time <span className="required">*</span></label>
                <input
                  type="time"
                  className="edit-input"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                />
              </div>
            </div>

            {/* Availability Checker */}
            {formData.doctorId && formData.patientId && formData.date && formData.time && (
              <div className="edit-availability-wrapper">
                <AvailabilityChecker
                  doctorId={formData.doctorId}
                  patientId={formData.patientId}
                  startAt={startAt}
                  duration={30}
                  excludeAppointmentId={appointmentId}
                  onAvailabilityChange={(availability) => {
                    setIsAvailable(availability.isAvailable);
                  }}
                  autoCheck={true}
                  showSuggestions={true}
                />
              </div>
            )}

            {/* Appointment Details */}
            <h3 className="edit-section-title">
              <MdNotes size={18} />
              Appointment Details
            </h3>
            <div className="edit-form-group">
              <label>Reason / Chief Complaint <span className="required">*</span></label>
              <input
                type="text"
                className="edit-input"
                value={formData.chiefComplaint}
                onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                placeholder="E.g., Routine check-up, Follow-up consultation..."
              />
            </div>
            <div className="edit-form-group">
              <label>Clinical Notes (Optional)</label>
              <textarea
                className="edit-input"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional private notes or observations..."
              />
            </div>

            {/* Status */}
            <h3 className="edit-section-title">
              <MdPerson size={18} />
              Status
            </h3>
            <div className="edit-status-grid">
              {['Scheduled', 'Confirmed', 'Pending', 'Cancelled'].map(s => (
                <button
                  key={s}
                  type="button"
                  className={`edit-status-btn ${formData.status === s ? 'active ' + s.toLowerCase() : ''}`}
                  onClick={() => handleChange('status', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="edit-rp-footer">
            <div className="edit-footer-left">
              <button className="edit-btn-delete" onClick={handleDelete} disabled={saving}>
                <MdDelete size={18} /> Delete
              </button>
            </div>
            <div className="edit-footer-right">
              <button className="edit-btn-cancel" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button
                className="edit-btn-save"
                onClick={handleSubmit}
                disabled={saving || !isAvailable}
              >
                <MdSave size={18} />
                {saving ? 'Saving...' : isAvailable ? 'Save Changes' : 'Slot Unavailable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentForm;

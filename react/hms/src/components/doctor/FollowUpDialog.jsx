/**
 * FollowUpDialog.jsx
 * Follow-up appointment dialog matching Flutter's follow_up_dialog.dart
 * Creates a follow-up appointment for a patient
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdCalendarToday, MdAccessTime, MdEvent, MdEventNote } from 'react-icons/md';
import authService from '../../services/authService';
import './FollowUpDialog.css';

const FollowUpDialog = ({ patient, isOpen, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedType, setSelectedType] = useState('Follow-Up');
  const [followUpReason, setFollowUpReason] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('Main Clinic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const appointmentTypes = [
    'Follow-Up',
    'Check-Up',
    'Review',
    'Post-Treatment',
    'Lab Results Review',
    'Medication Review',
  ];

  const quickDateOptions = [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
    { label: '3 Months', days: 90 },
  ];

  useEffect(() => {
    if (isOpen) {
      // Default to 1 week from now
      const oneWeekLater = new Date();
      oneWeekLater.setDate(oneWeekLater.getDate() + 7);
      setSelectedDate(oneWeekLater.toISOString().split('T')[0]);
      setSelectedTime('10:00');
      setError('');
    }
  }, [isOpen]);

  const setQuickDate = (days) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    setSelectedDate(futureDate.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!patient) {
      setError('Patient information is missing');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError('Please select date and time');
      return;
    }

    if (!followUpReason.trim()) {
      setError('Please enter a follow-up reason');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const dateTime = new Date(`${selectedDate}T${selectedTime}:00`);

      const patientId = patient.patientId || patient._id;
      
      if (!patientId) {
        setError('Invalid patient ID');
        setIsSubmitting(false);
        return;
      }

      // Get the most recent appointment for this patient to link as previous
      let previousAppointmentId = null;
      try {
        const response = await authService.get(
          `/appointments?patientId=${patientId}&limit=1&sort=startAt:desc`
        );
        if (response.data?.appointments && response.data.appointments.length > 0) {
          previousAppointmentId = response.data.appointments[0]._id;
        }
      } catch (err) {
        console.warn('Could not fetch previous appointment:', err);
      }

      // Create follow-up appointment
      const payload = {
        patientId: patientId,
        doctorId: patient.doctorId || localStorage.getItem('userId'),
        appointmentType: selectedType,
        startAt: dateTime.toISOString(),
        location: location || 'Main Clinic',
        status: 'Scheduled',
        notes: notes,
        isFollowUp: true,
        ...(previousAppointmentId && { previousAppointmentId }),
        followUpReason: followUpReason,
        bookingSource: 'web',
      };

      await authService.post('/appointments', payload);

      alert(
        `✅ Follow-up scheduled for ${new Date(dateTime).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`
      );

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to create follow-up:', err);
      setError(err.response?.data?.message || 'Failed to create follow-up appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="followup-dialog-overlay" onClick={() => !isSubmitting && onClose && onClose()}>
      <div className="followup-dialog-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="followup-dialog-header">
          <div>
            <h2>Schedule Follow-Up</h2>
            <p className="patient-name">{patient?.name || 'Unknown Patient'}</p>
          </div>
          <button
            className="btn-close"
            onClick={() => onClose && onClose()}
            disabled={isSubmitting}
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form className="followup-dialog-body" onSubmit={handleSubmit}>
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Quick Date Options */}
          <div className="form-section">
            <label className="section-label">Quick Select</label>
            <div className="quick-date-grid">
              {quickDateOptions.map((option) => (
                <button
                  key={option.days}
                  type="button"
                  className="quick-date-btn"
                  onClick={() => setQuickDate(option.days)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="form-section">
            <label className="section-label">
              <MdCalendarToday size={18} />
              Date & Time
            </label>
            <div className="date-time-grid">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Appointment Type */}
          <div className="form-section">
            <label className="section-label">
              <MdEvent size={18} />
              Appointment Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="select-input"
            >
              {appointmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Follow-up Reason */}
          <div className="form-section">
            <label className="section-label">
              <MdEventNote size={18} />
              Follow-Up Reason *
            </label>
            <input
              type="text"
              value={followUpReason}
              onChange={(e) => setFollowUpReason(e.target.value)}
              placeholder="e.g., Post-surgery review, Medication check"
              className="text-input"
              required
            />
          </div>

          {/* Location */}
          <div className="form-section">
            <label className="section-label">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Main Clinic"
              className="text-input"
            />
          </div>

          {/* Additional Notes */}
          <div className="form-section">
            <label className="section-label">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              className="textarea-input"
              rows={3}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="followup-dialog-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onClose && onClose()}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                Creating...
              </>
            ) : (
              <>
                <MdEvent size={18} />
                Schedule Follow-Up
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowUpDialog;

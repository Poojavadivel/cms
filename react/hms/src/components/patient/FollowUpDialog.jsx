/**
 * FollowUpDialog.jsx
 * Simple Follow-Up scheduling dialog
 */

import React, { useState } from 'react';
import './FollowUpDialog.css';

const FollowUpDialog = ({ isOpen, patient, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    followUpDate: '',
    followUpTime: '',
    reason: '',
    notes: ''
  });

  if (!isOpen || !patient) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.followUpDate) {
      alert('Please select a follow-up date');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="follow-up-overlay" onClick={onClose}>
      <div className="follow-up-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="follow-up-header">
          <h2>Schedule Follow-Up</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="follow-up-patient-info">
          <p><strong>Patient:</strong> {patient.name}</p>
          <p><strong>Patient ID:</strong> {patient.patientId || patient.id}</p>
        </div>

        <form onSubmit={handleSubmit} className="follow-up-form">
          <div className="form-group">
            <label>Follow-Up Date *</label>
            <input
              type="date"
              name="followUpDate"
              value={formData.followUpDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>Follow-Up Time</label>
            <input
              type="time"
              name="followUpTime"
              value={formData.followUpTime}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Reason for Follow-Up *</label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g., Check-up, Test results, Medication review"
              required
            />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional information..."
            />
          </div>

          <div className="follow-up-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-schedule">
              Schedule Follow-Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowUpDialog;

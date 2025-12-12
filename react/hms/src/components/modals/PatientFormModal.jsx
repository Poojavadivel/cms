/**
 * PatientFormModal.jsx
 * Enterprise patient form modal - Add/Edit patient
 * Matching Flutter's enterprise_patient_form.dart
 * Uses PatientDetails model from models/Patients.js
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdPerson, MdPhone, MdEmail, MdHome, MdLocalHospital } from 'react-icons/md';
import patientsService from '../../services/patientsService';
import { PatientDetails } from '../../models/Patients';
import './PatientFormModal.css';

const PatientFormModal = ({ isOpen, onClose, patient = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    medicalHistory: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patient) {
      // Edit mode - populate form
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        age: patient.age || '',
        gender: patient.gender || 'Male',
        phone: patient.phone || patient.contactNumber || '',
        email: patient.email || '',
        address: patient.address || '',
        bloodGroup: patient.bloodGroup || '',
        medicalHistory: Array.isArray(patient.medicalHistory) 
          ? patient.medicalHistory.join(', ') 
          : patient.medicalHistory || '',
        allergies: Array.isArray(patient.allergies)
          ? patient.allergies.join(', ')
          : patient.allergies || '',
        emergencyContact: patient.emergencyContact || '',
        emergencyPhone: patient.emergencyPhone || '',
      });
    } else {
      // Add mode - reset form
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        gender: 'Male',
        phone: '',
        email: '',
        address: '',
        bloodGroup: '',
        medicalHistory: '',
        allergies: '',
        emergencyContact: '',
        emergencyPhone: '',
      });
    }
    setError('');
  }, [patient, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Prepare data
      const submitData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        age: parseInt(formData.age) || 0,
        medicalHistory: formData.medicalHistory.split(',').map(item => item.trim()).filter(Boolean),
        allergies: formData.allergies.split(',').map(item => item.trim()).filter(Boolean),
      };

      let result;
      if (patient) {
        // Update existing patient
        result = await patientsService.updatePatient(patient.id || patient._id, submitData);
      } else {
        // Create new patient
        result = await patientsService.createPatient(submitData);
      }

      if (result) {
        onSuccess?.(result);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container patient-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <MdPerson size={24} />
            <h2>{patient ? 'Edit Patient' : 'Add New Patient'}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Body */}
        <form className="modal-body" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div className="form-section">
            <h3><MdPerson /> Personal Information</h3>
            <div className="form-row">
              <div className="form-field">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-field">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="0"
                  max="150"
                  placeholder="Age"
                />
              </div>
              <div className="form-field">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-field">
                <label>Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h3><MdPhone /> Contact Information</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Phone number"
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                />
              </div>
            </div>
            <div className="form-field">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                placeholder="Full address"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="form-section">
            <h3><MdLocalHospital /> Emergency Contact</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Contact Name</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Emergency contact name"
                />
              </div>
              <div className="form-field">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  placeholder="Emergency phone number"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="form-section">
            <h3><MdLocalHospital /> Medical Information</h3>
            <div className="form-field">
              <label>Medical History</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                rows="3"
                placeholder="Enter medical history (comma separated)"
              />
              <small>Separate multiple conditions with commas</small>
            </div>
            <div className="form-field">
              <label>Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                rows="2"
                placeholder="Enter allergies (comma separated)"
              />
              <small>Separate multiple allergies with commas</small>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (patient ? 'Update Patient' : 'Add Patient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientFormModal;

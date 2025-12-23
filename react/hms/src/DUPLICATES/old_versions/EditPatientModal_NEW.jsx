/**
 * EditPatientModal.jsx
 * Clean tab-based patient edit form - Simple & Beautiful
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdPerson, MdPhone, MdHome, MdLocalHospital, MdSave } from 'react-icons/md';
import patientsService from '../../services/patientsService';
import './EditPatientModal.css';

const EditPatientModal = ({ patient, isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'Male',
    dateOfBirth: '',
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    bloodGroup: '',
    height: '',
    weight: '',
    bmi: '',
    bloodPressure: '',
    pulse: '',
    oxygenLevel: '',
    medicalHistory: '',
    allergies: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    notes: ''
  });

  const tabs = [
    { id: 'personal', label: 'Personal', icon: MdPerson },
    { id: 'contact', label: 'Contact', icon: MdPhone },
    { id: 'address', label: 'Address', icon: MdHome },
    { id: 'medical', label: 'Medical', icon: MdLocalHospital }
  ];

  useEffect(() => {
    if (patient && isOpen) {
      setFormData({
        firstName: patient.firstName || patient.name?.split(' ')[0] || '',
        lastName: patient.lastName || patient.name?.split(' ').slice(1).join(' ') || '',
        age: patient.age || '',
        gender: patient.gender || 'Male',
        dateOfBirth: patient.dateOfBirth || '',
        phone: patient.phone || patient.contactNumber || '',
        email: patient.email || '',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactPhone: patient.emergencyContactPhone || '',
        houseNo: patient.address?.houseNo || patient.houseNo || '',
        street: patient.address?.street || patient.street || '',
        city: patient.address?.city || patient.city || '',
        state: patient.address?.state || patient.state || '',
        pincode: patient.address?.pincode || patient.pincode || '',
        country: patient.address?.country || patient.country || 'India',
        bloodGroup: patient.bloodGroup || '',
        height: patient.vitals?.height || patient.height || '',
        weight: patient.vitals?.weight || patient.weight || '',
        bmi: patient.vitals?.bmi || patient.bmi || '',
        bloodPressure: patient.vitals?.bloodPressure || patient.bloodPressure || '',
        pulse: patient.vitals?.pulse || patient.pulse || '',
        oxygenLevel: patient.vitals?.oxygenLevel || patient.oxygenLevel || '',
        medicalHistory: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : patient.medicalHistory || '',
        allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies || '',
        insuranceNumber: patient.insuranceNumber || '',
        insuranceExpiry: patient.insuranceExpiry || patient.expiryDate || '',
        notes: patient.notes || ''
      });
      setActiveTab('personal');
      setError('');
    }
  }, [patient, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-calculate BMI
    if (name === 'height' || name === 'weight') {
      const height = name === 'height' ? parseFloat(value) : parseFloat(formData.height);
      const weight = name === 'weight' ? parseFloat(value) : parseFloat(formData.weight);
      if (height > 0 && weight > 0) {
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
        setFormData(prev => ({ ...prev, bmi }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      setActiveTab('personal');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      setActiveTab('contact');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const updatedPatient = {
        ...patient,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        houseNo: formData.houseNo.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country.trim(),
        bloodGroup: formData.bloodGroup.trim(),
        height: formData.height.trim(),
        weight: formData.weight.trim(),
        bmi: formData.bmi.trim(),
        bloodPressure: formData.bloodPressure.trim(),
        pulse: formData.pulse.trim(),
        oxygenLevel: formData.oxygenLevel.trim(),
        medicalHistory: formData.medicalHistory.split(',').map(s => s.trim()).filter(Boolean),
        allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
        insuranceNumber: formData.insuranceNumber.trim(),
        expiryDate: formData.insuranceExpiry,
        notes: formData.notes.trim()
      };

      await patientsService.updatePatient(patient.id, updatedPatient);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update patient');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-modal-header">
          <div className="edit-modal-header-left">
            <div className="edit-modal-icon-badge">
              <MdPerson size={24} />
            </div>
            <div>
              <h2>Edit Patient</h2>
              <p>Update patient information</p>
            </div>
          </div>
          <button onClick={onClose} className="edit-modal-close-btn" disabled={isSaving}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="edit-modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`edit-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="edit-modal-error">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="edit-modal-content">
          {activeTab === 'personal' && (
            <div className="edit-form-grid">
              <div className="edit-form-field">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="edit-form-field">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                />
              </div>
              <div className="edit-form-field">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                  min="1"
                  max="120"
                />
              </div>
              <div className="edit-form-field">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="edit-form-field full-width">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="edit-form-grid">
              <div className="edit-form-field">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="edit-form-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>
              <div className="edit-form-field">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Enter name"
                />
              </div>
              <div className="edit-form-field">
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Enter phone"
                />
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="edit-form-grid">
              <div className="edit-form-field">
                <label>House/Flat No</label>
                <input
                  type="text"
                  name="houseNo"
                  value={formData.houseNo}
                  onChange={handleChange}
                  placeholder="House number"
                />
              </div>
              <div className="edit-form-field">
                <label>Street</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Street name"
                />
              </div>
              <div className="edit-form-field">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div className="edit-form-field">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
              <div className="edit-form-field">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                />
              </div>
              <div className="edit-form-field">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="edit-form-grid">
              <div className="edit-form-field">
                <label>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="">Select blood group</option>
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
              <div className="edit-form-field">
                <label>Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="Height"
                />
              </div>
              <div className="edit-form-field">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Weight"
                />
              </div>
              <div className="edit-form-field">
                <label>BMI</label>
                <input
                  type="text"
                  name="bmi"
                  value={formData.bmi}
                  readOnly
                  placeholder="Auto-calculated"
                  className="readonly"
                />
              </div>
              <div className="edit-form-field">
                <label>Blood Pressure</label>
                <input
                  type="text"
                  name="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={handleChange}
                  placeholder="e.g., 120/80"
                />
              </div>
              <div className="edit-form-field">
                <label>Pulse</label>
                <input
                  type="text"
                  name="pulse"
                  value={formData.pulse}
                  onChange={handleChange}
                  placeholder="e.g., 72"
                />
              </div>
              <div className="edit-form-field full-width">
                <label>Medical History (comma separated)</label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  placeholder="Enter medical history"
                  rows="3"
                />
              </div>
              <div className="edit-form-field full-width">
                <label>Allergies (comma separated)</label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="Enter allergies"
                  rows="2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="edit-modal-footer">
          <button onClick={onClose} className="btn-cancel" disabled={isSaving}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-save" disabled={isSaving}>
            <MdSave size={18} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPatientModal;

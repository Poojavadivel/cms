/**
 * EditPatientModal.jsx
 * Clean, modern patient edit form with tab navigation
 * Inspired by Flutter but simpler and more elegant
 */

import React, { useState, useEffect } from 'react';
import { 
  MdClose, MdPerson, MdPhone, MdHome, MdLocalHospital,
  MdSave
} from 'react-icons/md';
import patientsService from '../../services/patientsService';
import './EditPatientModal.css';

const EditPatientModal = ({ patient, isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    age: '',
    gender: 'Male',
    dateOfBirth: '',
    
    // Contact Info
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Address
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    
    // Medical Info
    bloodGroup: '',
    height: '',
    weight: '',
    bmi: '',
    bloodPressure: '',
    pulse: '',
    oxygenLevel: '',
    medicalHistory: '',
    allergies: '',
    
    // Additional
    insuranceNumber: '',
    insuranceExpiry: '',
    notes: ''
  });

  const steps = [
    { id: 0, title: 'Personal Info', icon: MdPerson },
    { id: 1, title: 'Contact Details', icon: MdPhone },
    { id: 2, title: 'Address', icon: MdLocationOn },
    { id: 3, title: 'Medical Info', icon: MdLocalHospital }
  ];

  // Load patient data when modal opens
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
        houseNo: patient.address?.houseNo || '',
        street: patient.address?.street || '',
        city: patient.address?.city || '',
        state: patient.address?.state || '',
        pincode: patient.address?.pincode || '',
        country: patient.address?.country || 'India',
        bloodGroup: patient.bloodGroup || '',
        height: patient.vitals?.height || '',
        weight: patient.vitals?.weight || '',
        bmi: patient.vitals?.bmi || '',
        bloodPressure: patient.vitals?.bloodPressure || '',
        pulse: patient.vitals?.pulse || '',
        oxygenLevel: patient.vitals?.oxygenLevel || '',
        medicalHistory: patient.medicalHistory || '',
        allergies: patient.allergies || '',
        insuranceNumber: patient.insuranceNumber || '',
        insuranceExpiry: patient.insuranceExpiry || '',
        notes: patient.notes || ''
      });
      setCurrentStep(0);
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
      if (height && weight && height > 0) {
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi }));
      }
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) {
          setError('First name is required');
          return false;
        }
        if (!formData.age || formData.age <= 0) {
          setError('Valid age is required');
          return false;
        }
        break;
      case 1: // Contact
        if (!formData.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        if (formData.phone.length < 10) {
          setError('Phone number must be at least 10 digits');
          return false;
        }
        break;
      case 2: // Address
        if (!formData.city.trim()) {
          setError('City is required');
          return false;
        }
        break;
      case 3: // Medical - optional
        break;
      default:
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone,
        contactNumber: formData.phone,
        email: formData.email,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        address: {
          houseNo: formData.houseNo,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country
        },
        bloodGroup: formData.bloodGroup,
        vitals: {
          height: formData.height ? parseFloat(formData.height) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          bmi: formData.bmi ? parseFloat(formData.bmi) : null,
          bloodPressure: formData.bloodPressure,
          pulse: formData.pulse ? parseInt(formData.pulse) : null,
          oxygenLevel: formData.oxygenLevel ? parseInt(formData.oxygenLevel) : null
        },
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        insuranceNumber: formData.insuranceNumber,
        insuranceExpiry: formData.insuranceExpiry,
        notes: formData.notes
      };

      await patientsService.updatePatient(patient.id || patient._id || patient.patientId, payload);
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to update patient:', err);
      setError(err.response?.data?.message || 'Failed to update patient');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-patient-overlay" onClick={onClose}>
      <div className="edit-patient-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-patient-header">
          <div>
            <h2>Edit Patient</h2>
            <p className="edit-patient-subtitle">
              Update {patient?.name || 'patient'} information
            </p>
          </div>
          <button className="btn-close-edit" onClick={onClose} disabled={isSaving}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="steps-indicator">
          {steps.map((step, index) => (
            <div key={step.id} className="step-item-container">
              <div
                className={`step-item ${
                  currentStep === index ? 'active' : currentStep > index ? 'completed' : ''
                }`}
              >
                <div className="step-circle">
                  {currentStep > index ? (
                    <MdCheck size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                <span className="step-title">{step.title}</span>
              </div>
              {index < steps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner-edit">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Form Content */}
        <div className="edit-patient-body">
          {/* Step 0: Personal Info */}
          {currentStep === 0 && (
            <div className="form-step">
              <div className="form-row">
                <div className="form-group">
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
                <div className="form-group">
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
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    min="0"
                    max="150"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
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

          {/* Step 1: Contact Details */}
          {currentStep === 1 && (
            <div className="form-step">
              <div className="form-row">
                <div className="form-group">
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
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="Emergency contact person"
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    placeholder="Emergency phone number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <div className="form-step">
              <div className="form-row">
                <div className="form-group">
                  <label>House/Flat No.</label>
                  <input
                    type="text"
                    name="houseNo"
                    value={formData.houseNo}
                    onChange={handleChange}
                    placeholder="House/Flat number"
                  />
                </div>
                <div className="form-group">
                  <label>Street</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Street name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                  />
                </div>
                <div className="form-group">
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
            </div>
          )}

          {/* Step 3: Medical Info */}
          {currentStep === 3 && (
            <div className="form-step">
              <div className="form-row">
                <div className="form-group">
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
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="Height in cm"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Weight in kg"
                  />
                </div>
                <div className="form-group">
                  <label>BMI</label>
                  <input
                    type="text"
                    name="bmi"
                    value={formData.bmi}
                    readOnly
                    placeholder="Auto-calculated"
                    className="readonly-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Blood Pressure</label>
                  <input
                    type="text"
                    name="bloodPressure"
                    value={formData.bloodPressure}
                    onChange={handleChange}
                    placeholder="e.g. 120/80"
                  />
                </div>
                <div className="form-group">
                  <label>Pulse (bpm)</label>
                  <input
                    type="number"
                    name="pulse"
                    value={formData.pulse}
                    onChange={handleChange}
                    placeholder="Pulse rate"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Oxygen Level (%)</label>
                <input
                  type="number"
                  name="oxygenLevel"
                  value={formData.oxygenLevel}
                  onChange={handleChange}
                  placeholder="Oxygen saturation"
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Medical History</label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  placeholder="Previous medical conditions, surgeries, etc."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="Known allergies"
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Insurance Number</label>
                  <input
                    type="text"
                    name="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={handleChange}
                    placeholder="Insurance ID"
                  />
                </div>
                <div className="form-group">
                  <label>Insurance Expiry</label>
                  <input
                    type="date"
                    name="insuranceExpiry"
                    value={formData.insuranceExpiry}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes"
                  rows="2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="edit-patient-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 0 || isSaving}
          >
            <MdArrowBack size={20} />
            Back
          </button>

          <div className="footer-info">
            Step {currentStep + 1} of {steps.length}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleNext}
            disabled={isSaving}
          >
            {isSaving ? (
              'Saving...'
            ) : currentStep === steps.length - 1 ? (
              <>
                <MdCheck size={20} />
                Update Patient
              </>
            ) : (
              <>
                Next
                <MdArrowForward size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPatientModal;

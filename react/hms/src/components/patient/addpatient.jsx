import React, { useState, useEffect } from 'react';
import {
    MdClose,
    MdPerson,
    MdPhone,
    MdMedicalServices,
    MdFavorite,
    MdCheck,
    MdArrowBack,
    MdArrowForward,
    MdSave,
    MdHome,
    MdLocationCity,
    MdLocalHospital
} from 'react-icons/md';
import patientsService from '../../services/patientsService';
import './addpatient.css';

const AddPatientModal = ({ isOpen, onClose, onSuccess }) => {
    // --- State ---
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Step 1: Personal
        firstName: '',
        lastName: '',
        age: '',
        gender: '', // 'Male', 'Female', 'Other'
        bloodGroup: '',

        // Step 2: Contact
        phone: '',
        email: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        houseNo: '',
        street: '',
        city: '',
        state: '',

        // Step 3: Medical
        knownConditions: '', // Comma spread later if needed, or keeping as string
        allergies: '',
        currentMedications: '',
        pastSurgeries: '',
        notes: '',

        // Step 4: Vitals
        height: '',
        weight: '',
        bmi: '',
        bp: '', // systolic/diastolic
        pulse: '',
        spo2: ''
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setLoading(false);
            setFormData({
                firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
                phone: '', email: '', emergencyContactName: '', emergencyContactPhone: '',
                houseNo: '', street: '', city: '', state: '',
                knownConditions: '', allergies: '', currentMedications: '', pastSurgeries: '', notes: '',
                height: '', weight: '', bmi: '', bp: '', pulse: '', spo2: ''
            });
        }
    }, [isOpen]);

    // --- Logic ---

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate BMI if height/weight change
            if (name === 'height' || name === 'weight') {
                const h = name === 'height' ? value : prev.height;
                const w = name === 'weight' ? value : prev.weight;
                if (h && w) {
                    const heightM = h / 100;
                    const bmi = (w / (heightM * heightM)).toFixed(1);
                    newData.bmi = bmi;
                }
            }
            return newData;
        });
    };

    const handleSelectGender = (gender) => {
        setFormData(prev => ({ ...prev, gender }));
    };

    const validateStep = () => {
        // Basic validation for required fields
        if (currentStep === 0) {
            return formData.firstName && formData.lastName && formData.age && formData.gender;
        }
        if (currentStep === 1) {
            return formData.phone && formData.city; // Minimal requirement
        }
        return true; // Other steps optional
    };

    const handleNext = () => {
        if (validateStep()) {
            setCurrentStep(prev => prev + 1);
        } else {
            alert('Please fill in all required fields');
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Basic validation strict check
            if (!formData.firstName || !formData.phone) {
                throw new Error('First Name and Phone Number are required.');
            }

            const safeInt = (val) => (val && !isNaN(parseInt(val)) ? parseInt(val) : null);
            const safeFloat = (val) => (val && !isNaN(parseFloat(val)) ? parseFloat(val) : null);

            // Payload construction to match Backend Route & Schema
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName || '',
                // name: is composite, backend handles it or ignores it
                age: safeInt(formData.age),
                gender: formData.gender || null,
                bloodGroup: formData.bloodGroup || null, // Ensure empty string becomes null

                phone: formData.phone,
                email: formData.email || null,

                address: {
                    houseNo: formData.houseNo || '',
                    street: formData.street || '',
                    city: formData.city || '',
                    state: formData.state || ''
                },

                // Metadata fields that backend route might expect at root or handle via metadata
                emergencyContactName: formData.emergencyContactName,
                emergencyContactPhone: formData.emergencyContactPhone,

                // Lists
                medicalHistory: formData.knownConditions ? formData.knownConditions.split(',').map(s => s.trim()) : [],
                allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
                prescriptions: formData.currentMedications ? formData.currentMedications.split(',').map(s => s.trim()) : [],
                // surgeries mapped to notes or ignored? Backend doesn't explicitly map surgeries.
                // We'll append to notes.
                notes: `${formData.notes || ''}\nPast Surgeries: ${formData.pastSurgeries || 'None'}`.trim(),

                // Vitals Object (Explicitly matches PatientVitals Schema)
                vitals: {
                    bloodPressure: (() => {
                        if (!formData.bp) return null;
                        const parts = formData.bp.split('/');
                        if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                            return {
                                systolic: parseInt(parts[0]),
                                diastolic: parseInt(parts[1]),
                                reading: formData.bp
                            };
                        }
                        return null;
                    })(),
                    heartRate: safeInt(formData.pulse),
                    temperature: null, // Form doesn't have temp input
                    oxygenSaturation: safeFloat(formData.spo2),
                    weight: safeFloat(formData.weight) ? { value: safeFloat(formData.weight), unit: 'kg' } : null,
                    height: safeFloat(formData.height) ? { value: safeFloat(formData.height), unit: 'cm' } : null,
                    bmi: safeFloat(formData.bmi),
                    // Legacy fields if backend looks for them directly
                    bp: formData.bp || null,
                    pulse: safeInt(formData.pulse),
                    spo2: safeFloat(formData.spo2),
                    weightKg: safeFloat(formData.weight),
                    heightCm: safeFloat(formData.height)
                }
            };

            console.log('Sending Payload:', payload);

            await patientsService.createPatient(payload);

            // Close and Refresh
            setLoading(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Submission error:', error);
            // Detailed error logging
            const backendMsg = error.response?.data?.message || error.message || 'Unknown error';
            const backendDetails = error.response?.data?.error || '';
            alert(`Failed to save: ${backendMsg} \n ${backendDetails}`);
            setLoading(false);
        }
    };


    // --- Render Steps ---

    const steps = [
        { title: 'Personal Information', icon: <MdPerson /> },
        { title: 'Contact Details', icon: <MdPhone /> },
        { title: 'Medical History', icon: <MdMedicalServices /> },
        { title: 'Vitals', icon: <MdFavorite /> }
    ];

    if (!isOpen) return null;

    return (
        <div className="add-patient-overlay">
            <div className="add-patient-modal">
                {/* Header */}
                <div className="modal-header-top">
                    <div className="header-title-block">
                        <h2>Add New Patient</h2>
                        <p>Complete patient information and medical records</p>
                    </div>
                    <button className="close-btn" onClick={onClose}><MdClose size={24} /></button>
                </div>

                {/* Stepper */}
                <div className="stepper-container">
                    {steps.map((s, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        return (
                            <div key={index} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                <div className="step-icon">
                                    {isCompleted ? <MdCheck /> : s.icon}
                                </div>
                                <span className="step-label">{s.title}</span>
                                {index !== steps.length - 1 && <div className="step-line"></div>}
                            </div>
                        );
                    })}
                </div>

                {/* Form Content */}
                <div className="modal-form-content">

                    {/* STEP 1: Personal */}
                    {currentStep === 0 && (
                        <div className="form-step-container fade-in">
                            <h3>Personal Information</h3>
                            <p className="step-desc">Enter the patient's basic demographic information</p>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <div className="input-wrapper">
                                        <MdPerson className="input-icon" />
                                        <input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <div className="input-wrapper">
                                        <MdPerson className="input-icon" />
                                        <input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Age</label>
                                    <div className="input-wrapper">
                                        <MdPerson className="input-icon" />
                                        <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Age" min="1" max="120" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Blood Group</label>
                                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="std-select">
                                        <option value="">Select Group</option>
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

                            <div className="form-group full-width" style={{ marginTop: '16px' }}>
                                <label>Gender</label>
                                <div className="gender-selector">
                                    <button
                                        className={`gender-btn ${formData.gender === 'Male' ? 'active' : ''}`}
                                        onClick={() => handleSelectGender('Male')}
                                    >Male</button>
                                    <button
                                        className={`gender-btn ${formData.gender === 'Female' ? 'active' : ''}`}
                                        onClick={() => handleSelectGender('Female')}
                                    >Female</button>
                                    <button
                                        className={`gender-btn ${formData.gender === 'Other' ? 'active' : ''}`}
                                        onClick={() => handleSelectGender('Other')}
                                    >Other</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Contact */}
                    {currentStep === 1 && (
                        <div className="form-step-container fade-in">
                            <h3>Contact Details</h3>
                            <p className="step-desc">Patient contact information and emergency contacts</p>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <div className="input-wrapper">
                                        <MdPhone className="input-icon" />
                                        <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Primary Phone" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <div className="input-wrapper">
                                        <MdPerson className="input-icon" />
                                        <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Optional" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Emergency Contact Name</label>
                                    <div className="input-wrapper">
                                        <MdPerson className="input-icon" />
                                        <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} placeholder="Contact Name" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Emergency Contact Phone</label>
                                    <div className="input-wrapper">
                                        <MdPhone className="input-icon" />
                                        <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} placeholder="Contact Phone" />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group full-width" style={{ marginTop: '20px' }}>
                                <label>Address</label>
                                <div className="address-grid">
                                    <div className="input-wrapper"><MdHome className="input-icon" /><input name="houseNo" value={formData.houseNo} onChange={handleInputChange} placeholder="House / Flat No" /></div>
                                    <div className="input-wrapper"><MdLocationCity className="input-icon" /><input name="street" value={formData.street} onChange={handleInputChange} placeholder="Street Name" /></div>
                                    <div className="input-wrapper"><MdLocationCity className="input-icon" /><input name="city" value={formData.city} onChange={handleInputChange} placeholder="City" /></div>
                                    <div className="input-wrapper"><MdLocationCity className="input-icon" /><input name="state" value={formData.state} onChange={handleInputChange} placeholder="State" /></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Medical */}
                    {currentStep === 2 && (
                        <div className="form-step-container fade-in">
                            <h3>Medical History</h3>
                            <p className="step-desc">Known conditions and past medical records</p>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Known Conditions</label>
                                    <div className="input-wrapper">
                                        <MdLocalHospital className="input-icon" />
                                        <input name="knownConditions" value={formData.knownConditions} onChange={handleInputChange} placeholder="e.g. Diabetes, Hypertension" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Allergies</label>
                                    <div className="input-wrapper">
                                        <MdMedicalServices className="input-icon" />
                                        <input name="allergies" value={formData.allergies} onChange={handleInputChange} placeholder="e.g. Peanuts, Penicillin" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Current Medications</label>
                                    <div className="input-wrapper">
                                        <MdMedicalServices className="input-icon" />
                                        <input name="currentMedications" value={formData.currentMedications} onChange={handleInputChange} placeholder="List current meds" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Past Surgeries</label>
                                    <div className="input-wrapper">
                                        <MdLocalHospital className="input-icon" />
                                        <input name="pastSurgeries" value={formData.pastSurgeries} onChange={handleInputChange} placeholder="Any past surgeries" />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group full-width" style={{ marginTop: '16px' }}>
                                <label>Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional medical notes..." className="std-textarea"></textarea>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Vitals */}
                    {currentStep === 3 && (
                        <div className="form-step-container fade-in">
                            <h3>Vitals</h3>
                            <p className="step-desc">Record patient vital signs</p>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Height (cm)</label>
                                    <div className="input-wrapper">
                                        <input type="number" name="height" value={formData.height} onChange={handleInputChange} placeholder="Height in cm" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Weight (kg)</label>
                                    <div className="input-wrapper">
                                        <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Weight in kg" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>BMI</label>
                                    <div className="input-wrapper disabled-bg">
                                        <input name="bmi" value={formData.bmi} readOnly placeholder="Auto-calculated" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Blood Pressure</label>
                                    <div className="input-wrapper">
                                        <input name="bp" value={formData.bp} onChange={handleInputChange} placeholder="e.g. 120/80" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Pulse (bpm)</label>
                                    <div className="input-wrapper">
                                        <input type="number" name="pulse" value={formData.pulse} onChange={handleInputChange} placeholder="BPM" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Oxygen Saturation (%)</label>
                                    <div className="input-wrapper">
                                        <input type="number" name="spo2" value={formData.spo2} onChange={handleInputChange} placeholder="SpO2 %" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="modal-footer-actions">
                    {currentStep > 0 ? (
                        <button className="btn-secondary" onClick={handleBack}>
                            <MdArrowBack /> Previous
                        </button>
                    ) : (
                        <button className="btn-text" onClick={onClose}>Cancel</button>
                    )}

                    {currentStep < 3 ? (
                        <button className="btn-primary" onClick={handleNext}>
                            Next Step <MdArrowForward />
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Patient'} {loading ? '' : <MdSave />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddPatientModal;

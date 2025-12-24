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
import {
  FiUser, FiPhone, FiHeart, FiActivity, FiCheck, FiX, FiAlertCircle, FiArrowRight
} from 'react-icons/fi';
import patientsService from '../../services/patientsService';
import './addpatient.css';

const AddPatientModal = ({ isOpen, onClose, onSuccess, patientId }) => {
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
    // Reset or Fetch when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setLoading(false);

            const initialData = {
                firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
                phone: '', email: '', emergencyContactName: '', emergencyContactPhone: '',
                houseNo: '', street: '', city: '', state: '',
                knownConditions: '', allergies: '', currentMedications: '', pastSurgeries: '', notes: '',
                height: '', weight: '', bmi: '', bp: '', pulse: '', spo2: ''
            };

            if (patientId) {
                // Edit Mode: Fetch and Fill
                // We'll set a local loading flag or just rely on async update
                patientsService.fetchPatientById(patientId).then(patient => {
                    setFormData({
                        firstName: patient.firstName || (patient.name ? patient.name.split(' ')[0] : ''),
                        lastName: patient.lastName || (patient.name ? patient.name.split(' ').slice(1).join(' ') : ''),
                        age: patient.age || '',
                        gender: patient.gender || '',
                        bloodGroup: patient.bloodGroup || '',
                        phone: patient.phone || '',
                        email: '', // Not currently in PatientDetails model
                        emergencyContactName: patient.emergencyContactName || '',
                        emergencyContactPhone: patient.emergencyContactPhone || '',
                        houseNo: patient.houseNo || '',
                        street: patient.street || '',
                        city: patient.city || '',
                        state: patient.state || '',
                        knownConditions: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : (patient.medicalHistory || ''),
                        allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : (patient.allergies || ''),
                        currentMedications: '', // Not in model
                        pastSurgeries: '', // Not in model
                        notes: patient.notes || '',
                        height: patient.height || '',
                        weight: patient.weight || '',
                        bmi: patient.bmi || '',
                        bp: patient.bp || '',
                        pulse: patient.pulse || '',
                        spo2: patient.oxygen || '' // Mapped from spo2 in model to oxygen
                    });
                }).catch(error => {
                    console.error('Failed to fetch patient details for edit:', error);
                    alert('Failed to load patient details');
                    onClose();
                });
            } else {
                // Add Mode: Reset
                setFormData(initialData);
            }
        }
    }, [isOpen, patientId]);

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

            // Payload construction aligned with PatientDetails.toJSON()
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName || '',
                // Combine for name if backend needs it (toJSON uses name property)
                name: `${formData.firstName} ${formData.lastName || ''}`.trim(),
                age: safeInt(formData.age),
                gender: formData.gender || null,
                bloodGroup: formData.bloodGroup || null,
                phone: formData.phone,
                email: formData.email || null,

                address: {
                    houseNo: formData.houseNo || '',
                    street: formData.street || '',
                    city: formData.city || '',
                    state: formData.state || '',
                    line1: `${formData.houseNo || ''} ${formData.street || ''} ${formData.city || ''}`.trim()
                },

                // Root level fields that match PatientDetails
                allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
                notes: `${formData.notes || ''}\nPast Surgeries: ${formData.pastSurgeries || 'None'}`.trim(),

                // Metadata strictly for fields that live there in toJSON
                metadata: {
                    emergencyContactName: formData.emergencyContactName,
                    emergencyContactPhone: formData.emergencyContactPhone,
                    medicalHistory: formData.knownConditions ? formData.knownConditions.split(',').map(s => s.trim()) : [],
                    prescriptions: formData.currentMedications ? formData.currentMedications.split(',').map(s => s.trim()) : [],
                },

                // Vitals Object - Simplified to match PatientDetails.toJSON ('vitals' keys)
                vitals: {
                    // Use simple keys as per toJSON
                    bp: formData.bp || null,
                    heartRate: safeInt(formData.pulse), // Backend might map this or pulse
                    pulse: safeInt(formData.pulse),
                    temperature: null,
                    spo2: safeFloat(formData.spo2),
                    oxygen: safeFloat(formData.spo2), // Alias
                    weightKg: safeFloat(formData.weight),
                    heightCm: safeFloat(formData.height),
                    bmi: safeFloat(formData.bmi)
                }
            };

            console.log('Sending Payload:', payload);

            if (patientId) {
                await patientsService.updatePatient(patientId, payload);
            } else {
                await patientsService.createPatient(payload);
            }

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

    const stepsConfig = [
        { id: 1, name: 'Personal Info', desc: 'Basic demographics', icon: <FiUser /> },
        { id: 2, name: 'Contact', desc: 'Address & emergency', icon: <FiPhone /> },
        { id: 3, name: 'Medical History', desc: 'Conditions & allergies', icon: <FiHeart /> },
        { id: 4, name: 'Vitals', desc: 'Height, weight, BP', icon: <FiActivity /> }
    ];

    const InputGroup = ({ label, error, children, className = '' }) => (
        <div className={`group relative ${className}`}>
            <div className={`
                border rounded-xl transition-all duration-200 bg-white
                ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 group-focus-within:border-blue-400 group-focus-within:ring-2 group-focus-within:ring-blue-100'}
            `}>
                <label className="absolute top-2 left-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 pointer-events-none">
                    {label}
                </label>
                <div className="pt-6 pb-2 px-3">
                    {children}
                </div>
                {error && (
                    <div className="absolute top-2 right-2 text-red-500">
                        <FiAlertCircle size={14} />
                    </div>
                )}
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <style>
                {`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}
            </style>
            <div className="w-full max-w-6xl h-[85vh] bg-slate-50 rounded-3xl border border-white shadow-2xl flex overflow-hidden relative">

                {/* LEFT SIDEBAR - TIMELINE */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
                    <div className="p-8 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Editor</h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                            {patientId ? `ID: ${patientId}` : 'New Entry'}
                        </p>
                    </div>

                    <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
                        {stepsConfig.map((step) => {
                            const isActive = currentStep === (step.id - 1);
                            const isComplete = currentStep > (step.id - 1);

                            return (
                                <div key={step.id} className="relative pl-6 group cursor-default">
                                    {/* Timeline Line */}
                                    <div className={`absolute left-[3px] top-2 bottom-[-24px] w-[2px] bg-slate-100 ${step.id === 4 ? 'hidden' : ''}`} />

                                    {/* Dot */}
                                    <div className={`
                                        absolute left-0 top-1.5 w-2 h-2 rounded-full ring-4 ring-white transition-colors duration-300
                                        ${isActive ? 'bg-blue-600 shadow-md' : isComplete ? 'bg-emerald-500' : 'bg-slate-300'}
                                    `} />

                                    <div className={`${isActive ? 'opacity-100' : 'opacity-60'} transition-opacity`}>
                                        <span className={`text-xs font-bold uppercase tracking-widest block mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                            Step {step.id}
                                        </span>
                                        <h3 className="text-sm font-semibold text-slate-800">{step.name}</h3>
                                        <p className="text-[11px] text-slate-500">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 border-t border-slate-100">
                        <button onClick={onClose} className="w-full py-3 px-4 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                            <FiX size={14} /> Cancel
                        </button>
                    </div>
                </div>

                {/* RIGHT CONTENT - FORM FOCUS */}
                <div className="flex-1 flex flex-col relative bg-slate-50">

                    {/* Context Header (Mobile/Compact) */}
                    <div className="md:hidden p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                        <span className="text-slate-800 font-bold">Step {currentStep + 1}/4</span>
                        <button onClick={onClose} className="p-2 text-slate-500"><FiX /></button>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
                        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
                            {/* STEP 1: Personal Info */}
                            {currentStep === 0 && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                                        <p className="text-slate-500">Basic demographics and identification</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="First Name" className="col-span-1">
                                            <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300 font-medium" placeholder="e.g. John" autoFocus />
                                        </InputGroup>

                                        <InputGroup label="Last Name" className="col-span-1">
                                            <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="e.g. Doe" />
                                        </InputGroup>

                                        <InputGroup label="Age">
                                            <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="Age" min="1" max="120" />
                                        </InputGroup>

                                        <InputGroup label="Blood Group">
                                            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0">
                                                <option value="">Select...</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </InputGroup>

                                        <InputGroup label="Gender" className="col-span-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectGender('Male')}
                                                    className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                                                        formData.gender === 'Male' 
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    Male
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectGender('Female')}
                                                    className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                                                        formData.gender === 'Female' 
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    Female
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectGender('Other')}
                                                    className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                                                        formData.gender === 'Other' 
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    Other
                                                </button>
                                            </div>
                                        </InputGroup>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Contact */}
                            {currentStep === 1 && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Contact Details</h2>
                                        <p className="text-slate-500">Address and emergency contact information</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Phone Number" className="col-span-1">
                                            <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="+1 555 000 0000" autoFocus />
                                        </InputGroup>

                                        <InputGroup label="Email Address" className="col-span-1">
                                            <input name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="patient@email.com" />
                                        </InputGroup>

                                        <InputGroup label="House No." className="col-span-1">
                                            <input name="houseNo" value={formData.houseNo} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="123" />
                                        </InputGroup>

                                        <InputGroup label="Street" className="col-span-1">
                                            <input name="street" value={formData.street} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="Main Street" />
                                        </InputGroup>

                                        <InputGroup label="City" className="col-span-1">
                                            <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="City Name" />
                                        </InputGroup>

                                        <InputGroup label="State" className="col-span-1">
                                            <input name="state" value={formData.state} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="State" />
                                        </InputGroup>

                                        <InputGroup label="Emergency Contact Name" className="col-span-1">
                                            <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="Contact Person" />
                                        </InputGroup>

                                        <InputGroup label="Emergency Phone" className="col-span-1">
                                            <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="+1 555 000 0000" />
                                        </InputGroup>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Medical History */}
                            {currentStep === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Medical History</h2>
                                        <p className="text-slate-500">Known conditions, allergies, and past records</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Known Conditions" className="col-span-2">
                                            <input name="knownConditions" value={formData.knownConditions} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="e.g. Diabetes, Hypertension" autoFocus />
                                        </InputGroup>

                                        <InputGroup label="Allergies" className="col-span-2">
                                            <input name="allergies" value={formData.allergies} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="e.g. Peanuts, Penicillin" />
                                        </InputGroup>

                                        <InputGroup label="Current Medications" className="col-span-1">
                                            <input name="currentMedications" value={formData.currentMedications} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="List current medications" />
                                        </InputGroup>

                                        <InputGroup label="Past Surgeries" className="col-span-1">
                                            <input name="pastSurgeries" value={formData.pastSurgeries} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="Any past surgeries" />
                                        </InputGroup>

                                        <InputGroup label="Additional Notes" className="col-span-2">
                                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300 min-h-[80px] resize-none" placeholder="Any additional medical notes..."></textarea>
                                        </InputGroup>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Vitals */}
                            {currentStep === 3 && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Vital Signs</h2>
                                        <p className="text-slate-500">Record patient measurements and vital statistics</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <InputGroup label="Height (cm)">
                                            <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="170" autoFocus />
                                        </InputGroup>

                                        <InputGroup label="Weight (kg)">
                                            <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="70" />
                                        </InputGroup>

                                        <InputGroup label="BMI">
                                            <input name="bmi" value={formData.bmi} readOnly className="w-full bg-slate-50 border-none p-0 text-slate-500 focus:ring-0 font-mono" placeholder="Auto" />
                                        </InputGroup>

                                        <InputGroup label="Blood Pressure">
                                            <input name="bp" value={formData.bp} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300 font-mono" placeholder="120/80" />
                                        </InputGroup>

                                        <InputGroup label="Pulse (bpm)">
                                            <input type="number" name="pulse" value={formData.pulse} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="72" />
                                        </InputGroup>

                                        <InputGroup label="SpO2 (%)">
                                            <input type="number" name="spo2" value={formData.spo2} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="98" />
                                        </InputGroup>
                                    </div>
                                </div>
                            )}

                            {/* ACTION BUTTONS */}
                            <div className="flex items-center justify-between pt-8 border-t border-slate-200">
                                <div>
                                    {currentStep > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors flex items-center gap-2"
                                        >
                                            <FiArrowRight className="rotate-180" size={16} />
                                            Previous
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {currentStep < 3 ? (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 flex items-center gap-2"
                                        >
                                            Continue
                                            <FiArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FiCheck size={16} />
                                                    {patientId ? 'Update Patient' : 'Save Patient'}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AddPatientModal;

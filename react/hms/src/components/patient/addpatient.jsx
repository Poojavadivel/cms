import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import doctorService from '../../services/doctorService';
import scannerService from '../../services/scannerService';
import './addpatient.css';

// Move InputGroup OUTSIDE the component to prevent recreation on every render
const InputGroup = ({ label, error, required, children, className = '' }) => (
    <div className={`group relative ${className}`}>
        <div className={`
            border rounded-xl transition-all duration-200 bg-white
            ${error ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 group-focus-within:border-blue-400 group-focus-within:ring-2 group-focus-within:ring-blue-100'}
        `}>
            <label className="absolute top-2 left-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 pointer-events-none">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="pt-6 pb-2 px-3">
                {children}
            </div>
        </div>
    </div>
);

const AddPatientModal = ({ isOpen, onClose, onSuccess, patientId }) => {
    // --- State ---
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    // NEW: Doctor dropdown state
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    // NEW: File upload and scanner state
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [scannerError, setScannerError] = useState(null);
    const [scannedData, setScannedData] = useState(null);

    // Generate temp patient ID for linking documents during creation
    const [tempPatientId] = useState(`temp-${Math.floor(Math.random() * 999999)}`);

    const [formData, setFormData] = useState({
        // Step 1: Personal
        firstName: '',
        lastName: '',
        dateOfBirth: '', // NEW: Date of birth
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
        pincode: '', // NEW: Pincode/Zipcode
        country: 'India', // NEW: Country field

        // Step 3: Medical
        assignedDoctor: '', // NEW: Doctor assignment
        knownConditions: '',
        allergies: '',
        currentMedications: '',
        pastSurgeries: '',
        notes: '',
        lastVisit: '', // NEW: Last visit date

        // Step 4: Vitals
        height: '',
        weight: '',
        bmi: '',
        bp: '',
        pulse: '',
        spo2: '',

        // Step 5: Insurance (NEW)
        insuranceNumber: '',
        insuranceProvider: '',
        insuranceExpiry: '',
        patientCode: ''
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setLoading(false);
            setFetchingData(false);
            setErrors({});
            setFieldErrors({});
            setUploadedFiles([]);
            setScannerError(null);
            setScannedData(null);

            const initialData = {
                firstName: '', lastName: '', dateOfBirth: '', age: '', gender: '', bloodGroup: '',
                phone: '', email: '', emergencyContactName: '', emergencyContactPhone: '',
                houseNo: '', street: '', city: '', state: '', pincode: '', country: 'India',
                assignedDoctor: '', knownConditions: '', allergies: '', currentMedications: '',
                pastSurgeries: '', notes: '', lastVisit: '',
                height: '', weight: '', bmi: '', bp: '', pulse: '', spo2: '',
                insuranceNumber: '', insuranceProvider: '', insuranceExpiry: ''
            };

            if (patientId) {
                // Edit Mode: Fetch and Fill
                setFetchingData(true);
                patientsService.fetchPatientById(patientId).then(patient => {
                    setFormData({
                        firstName: patient.firstName || (patient.name ? patient.name.split(' ')[0] : ''),
                        lastName: patient.lastName || (patient.name ? patient.name.split(' ').slice(1).join(' ') : ''),
                        dateOfBirth: patient.dateOfBirth || patient.dob || '',
                        age: patient.age?.toString() || '',
                        gender: patient.gender || '',
                        bloodGroup: patient.bloodGroup || '',
                        phone: patient.phone || '',
                        email: patient.email || '',
                        emergencyContactName: patient.emergencyContactName || patient.metadata?.emergencyContactName || '',
                        emergencyContactPhone: patient.emergencyContactPhone || patient.metadata?.emergencyContactPhone || '',
                        houseNo: patient.address?.houseNo || patient.houseNo || '',
                        street: patient.address?.street || patient.street || '',
                        city: patient.address?.city || patient.city || '',
                        state: patient.address?.state || patient.state || '',
                        pincode: patient.address?.pincode || patient.pincode || '',
                        country: patient.address?.country || patient.country || 'India',
                        assignedDoctor: patient.assignedDoctor || patient.doctorId || '',
                        knownConditions: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : (patient.medicalHistory || ''),
                        allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : (patient.allergies || ''),
                        currentMedications: patient.currentMedications || patient.metadata?.prescriptions || '',
                        pastSurgeries: patient.pastSurgeries || '',
                        notes: patient.notes || '',
                        lastVisit: patient.lastVisit || '',
                        height: patient.vitals?.heightCm || patient.height || '',
                        weight: patient.vitals?.weightKg || patient.weight || '',
                        bmi: patient.vitals?.bmi || patient.bmi || '',
                        bp: patient.vitals?.bp || patient.bp || '',
                        pulse: patient.vitals?.pulse || patient.pulse || '',
                        spo2: patient.vitals?.spo2 || patient.oxygen || '',
                        insuranceNumber: patient.insuranceNumber || patient.metadata?.insuranceNumber || '',
                        insuranceProvider: patient.insuranceProvider || patient.metadata?.insuranceProvider || '',
                        insuranceExpiry: patient.insuranceExpiry || patient.metadata?.insuranceExpiry || '',
                        patientCode: patient.patientCode || patient.metadata?.patientCode || ''
                    });
                    setFetchingData(false);
                }).catch(error => {
                    console.error('Failed to fetch patient details for edit:', error);
                    alert('Failed to load patient details');
                    setFetchingData(false);
                    onClose();
                });
            } else {
                // Add Mode: Reset
                setFormData(initialData);
            }

            // Fetch doctors list
            fetchDoctors();
        }
    }, [isOpen, patientId, onClose]);

    // ESC key handler for closing modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, loading, onClose]);

    // Fetch doctors for dropdown
    const fetchDoctors = useCallback(async () => {
        setLoadingDoctors(true);
        try {
            console.log('🔍 [DOCTOR DROPDOWN] Fetching doctors from API...');

            // Call real doctor service
            const doctors = await doctorService.fetchAllDoctors();

            console.log(`✅ [DOCTOR DROPDOWN] Received ${doctors.length} doctors:`, doctors);

            setDoctors(doctors);
        } catch (error) {
            console.error('❌ [DOCTOR DROPDOWN] Failed to fetch doctors:', error);

            // Fallback to mock data if API fails (for development)
            console.warn('⚠️ [DOCTOR DROPDOWN] Using mock data as fallback');
            setDoctors([
                { id: 'doc1', name: 'Dr. Sharma', specialization: 'General Medicine' },
                { id: 'doc2', name: 'Dr. Patel', specialization: 'Cardiology' },
                { id: 'doc3', name: 'Dr. Kumar', specialization: 'Pediatrics' }
            ]);
        } finally {
            setLoadingDoctors(false);
        }
    }, []);

    // Validation helper functions
    const validateEmail = useCallback((email) => {
        if (!email) return true; // optional field
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }, []);

    const validatePhone = useCallback((phone) => {
        if (!phone) return false; // required field
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    }, []);

    const validateBP = useCallback((bp) => {
        if (!bp) return true; // optional field
        const re = /^\d{2,3}\/\d{2,3}$/;
        return re.test(bp);
    }, []);

    // Calculate age from date of birth
    const calculateAge = useCallback((dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age.toString();
    }, []);

    // --- Logic ---

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate age from DOB
            if (name === 'dateOfBirth') {
                newData.age = calculateAge(value);
            }

            // Auto-calculate BMI if height/weight change with validation
            if (name === 'height' || name === 'weight') {
                const h = name === 'height' ? value : prev.height;
                const w = name === 'weight' ? value : prev.weight;

                // Only calculate if both values are positive numbers
                if (h && w && parseFloat(h) > 0 && parseFloat(w) > 0) {
                    const heightM = parseFloat(h) / 100;
                    const bmi = (parseFloat(w) / (heightM * heightM)).toFixed(1);
                    newData.bmi = bmi;
                } else {
                    newData.bmi = '';
                }
            }

            return newData;
        });
    }, [calculateAge, fieldErrors]);

    const handleSelectGender = useCallback((gender) => {
        setFormData(prev => ({ ...prev, gender }));

        // Clear error
        if (fieldErrors.gender) {
            setFieldErrors(prev => {
                const updated = { ...prev };
                delete updated.gender;
                return updated;
            });
        }
    }, [fieldErrors]);

    const validateStep = () => {
        const newErrors = {};

        // Step 1: Personal Info
        if (currentStep === 0) {
            if (!formData.firstName?.trim()) newErrors.firstName = true;
            if (!formData.lastName?.trim()) newErrors.lastName = true;
            if (!formData.age) newErrors.age = true;
            if (!formData.gender) newErrors.gender = true;
        }

        // Step 2: Contact
        if (currentStep === 1) {
            if (!formData.phone?.trim()) newErrors.phone = true;
            if (!formData.city?.trim()) newErrors.city = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            setErrors({}); // Clear errors on successful validation
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setErrors({});
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        // Validate before submit
        if (!validateStep()) {
            return;
        }

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
                dateOfBirth: formData.dateOfBirth || null,
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
                    pincode: formData.pincode || '',
                    country: formData.country || 'India',
                    line1: `${formData.houseNo || ''} ${formData.street || ''} ${formData.city || ''}`.trim()
                },

                doctorId: formData.assignedDoctor || null,
                lastVisit: formData.lastVisit || null,

                // Root level fields that match PatientDetails
                allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
                notes: `${formData.notes || ''}\nPast Surgeries: ${formData.pastSurgeries || 'None'}`.trim(),

                // Metadata strictly for fields that live there in toJSON
                metadata: {
                    emergencyContactName: formData.emergencyContactName,
                    emergencyContactPhone: formData.emergencyContactPhone,
                    medicalHistory: formData.knownConditions ? formData.knownConditions.split(',').map(s => s.trim()) : [],
                    prescriptions: formData.currentMedications ? formData.currentMedications.split(',').map(s => s.trim()) : [],
                    insuranceNumber: formData.insuranceNumber || null,
                    insuranceProvider: formData.insuranceProvider || null,
                    insuranceExpiry: formData.insuranceExpiry || null,
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

    // File upload handlers
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setScannerError(null);

        try {
            const file = files[0];
            console.log('📤 Uploading file:', file.name);

            // Use temp patient ID for new patients, real ID for editing
            const patientIdForUpload = patientId || tempPatientId;

            // Scan and extract data
            const scannedResult = await scannerService.scanAndExtractMedicalData(file, patientIdForUpload);

            console.log('✅ File scanned successfully:', scannedResult);

            // Store scanned data
            setScannedData(scannedResult);

            // Auto-fill form fields if data was extracted
            if (scannedResult.medicalHistory) {
                const current = formData.knownConditions;
                setFormData(prev => ({
                    ...prev,
                    knownConditions: current ? `${current}, ${scannedResult.medicalHistory}` : scannedResult.medicalHistory
                }));
            }

            if (scannedResult.allergies) {
                const current = formData.allergies;
                setFormData(prev => ({
                    ...prev,
                    allergies: current ? `${current}, ${scannedResult.allergies}` : scannedResult.allergies
                }));
            }

            if (scannedResult.medications) {
                const current = formData.currentMedications;
                setFormData(prev => ({
                    ...prev,
                    currentMedications: current ? `${current}, ${scannedResult.medications}` : scannedResult.medications
                }));
            }

            // Add to uploaded files list
            setUploadedFiles(prev => [...prev, { file, name: file.name, scannedResult }]);

        } catch (error) {
            console.error('❌ File upload error:', error);
            setScannerError(error.message || 'Failed to process document');
        } finally {
            setUploading(false);
        }
    };

    const removeUploadedFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));

        // Clear scanned data if all files are removed
        if (uploadedFiles.length === 1) {
            setScannedData(null);
        }
    };


    // --- Render Steps ---

    const stepsConfig = [
        { id: 1, name: 'Personal Info', desc: 'Basic demographics', icon: <FiUser /> },
        { id: 2, name: 'Contact', desc: 'Address & emergency', icon: <FiPhone /> },
        { id: 3, name: 'Medical History', desc: 'Conditions & doctor', icon: <FiHeart /> },
        { id: 4, name: 'Vitals', desc: 'Height, weight, BP', icon: <FiActivity /> },
        { id: 5, name: 'Insurance', desc: 'Insurance details', icon: <FiCheck /> }
    ];

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
                        <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider flex items-center gap-2">
                            {formData.patientCode ? (
                                <>
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">
                                        ID: {formData.patientCode}
                                    </span>
                                </>
                            ) : patientId ? (
                                <span className="opacity-50">ID: {patientId.slice(0, 8)}...</span>
                            ) : (
                                'New Entry'
                            )}
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

                    {/* Loading Overlay */}
                    {fetchingData && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-700 font-medium">Loading patient data...</p>
                            </div>
                        </div>
                    )}

                    {/* Context Header (Mobile/Compact) */}
                    <div className="md:hidden p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                        <span className="text-slate-800 font-bold">Step {currentStep + 1}/5</span>
                        <button onClick={onClose} className="p-2 text-slate-500"><FiX /></button>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                // Prevent auto-submit - user must click the button
                            }}
                            className="max-w-2xl mx-auto space-y-8"
                        >
                            {/* STEP 1: Personal Info */}
                            {currentStep === 0 && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                                        <p className="text-slate-500">Basic demographics and identification</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="First Name" error={fieldErrors.firstName} required className="col-span-1">
                                            <input
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300 font-medium"
                                                placeholder="e.g. John"
                                            />
                                            {fieldErrors.firstName && <span className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</span>}
                                        </InputGroup>

                                        <InputGroup label="Last Name" error={fieldErrors.lastName} required className="col-span-1">
                                            <input
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                placeholder="e.g. Doe"
                                            />
                                            {fieldErrors.lastName && <span className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</span>}
                                        </InputGroup>

                                        <InputGroup label="Date of Birth" error={fieldErrors.dateOfBirth} required>
                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                            {fieldErrors.dateOfBirth && <span className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth}</span>}
                                        </InputGroup>

                                        <InputGroup label="Age" error={fieldErrors.age}>
                                            <input
                                                type="number"
                                                name="age"
                                                value={formData.age}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                placeholder="Auto-calculated from DOB"
                                                min="1"
                                                max="120"
                                                readOnly={formData.dateOfBirth !== ''}
                                            />
                                            {fieldErrors.age && <span className="text-red-500 text-xs mt-1">{fieldErrors.age}</span>}
                                            {formData.dateOfBirth && <span className="text-blue-500 text-xs mt-1">Auto-calculated from DOB</span>}
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

                                        <InputGroup label="Gender" error={fieldErrors.gender} required className="col-span-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectGender('Male')}
                                                    className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${formData.gender === 'Male'
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                        }`}
                                                >
                                                    Male
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectGender('Female')}
                                                    className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${formData.gender === 'Female'
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                        }`}
                                                >
                                                    Female
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectGender('Other')}
                                                    className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${formData.gender === 'Other'
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
                                        <InputGroup label="Phone Number" error={fieldErrors.phone} required className="col-span-1">
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                placeholder="+1 555 000 0000"
                                            />
                                            {fieldErrors.phone && <span className="text-red-500 text-xs mt-1">{fieldErrors.phone}</span>}
                                        </InputGroup>

                                        <InputGroup label="Email Address" error={fieldErrors.email} className="col-span-1">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                placeholder="patient@email.com"
                                            />
                                            {fieldErrors.email && <span className="text-red-500 text-xs mt-1">{fieldErrors.email}</span>}
                                        </InputGroup>

                                        <InputGroup label="House No." className="col-span-1">
                                            <input name="houseNo" value={formData.houseNo} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="123" />
                                        </InputGroup>

                                        <InputGroup label="Street" className="col-span-1">
                                            <input name="street" value={formData.street} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="Main Street" />
                                        </InputGroup>

                                        <InputGroup label="City" error={fieldErrors.city} required className="col-span-1">
                                            <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="City Name" />
                                            {fieldErrors.city && <span className="text-red-500 text-xs mt-1">{fieldErrors.city}</span>}
                                        </InputGroup>

                                        <InputGroup label="State" className="col-span-1">
                                            <input name="state" value={formData.state} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="State" />
                                        </InputGroup>

                                        <InputGroup label="Pincode/Zipcode" error={fieldErrors.pincode} required className="col-span-1">
                                            <input
                                                type="text"
                                                name="pincode"
                                                value={formData.pincode}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                placeholder="e.g. 560001"
                                                maxLength="6"
                                                pattern="[0-9]{6}"
                                            />
                                            {fieldErrors.pincode && <span className="text-red-500 text-xs mt-1">{fieldErrors.pincode}</span>}
                                        </InputGroup>

                                        <InputGroup label="Country" error={fieldErrors.country} required className="col-span-1">
                                            <select
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0"
                                            >
                                                <option value="India">India</option>
                                                <option value="USA">USA</option>
                                                <option value="UK">UK</option>
                                                <option value="Canada">Canada</option>
                                                <option value="Australia">Australia</option>
                                                <option value="UAE">UAE</option>
                                                <option value="Singapore">Singapore</option>
                                            </select>
                                            {fieldErrors.country && <span className="text-red-500 text-xs mt-1">{fieldErrors.country}</span>}
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
                                        <p className="text-slate-500">Known conditions, doctor assignment, and medical records</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Assign Doctor" error={fieldErrors.assignedDoctor} required className="col-span-2">
                                            <select
                                                name="assignedDoctor"
                                                value={formData.assignedDoctor}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0"
                                                disabled={loadingDoctors}
                                            >
                                                <option value="">-- Select Doctor --</option>
                                                {doctors.map(doctor => (
                                                    <option key={doctor.id} value={doctor.id}>
                                                        Dr. {doctor.name} - {doctor.specialization}
                                                    </option>
                                                ))}
                                            </select>
                                            {loadingDoctors && <span className="text-blue-500 text-xs mt-1">Loading doctors...</span>}
                                            {fieldErrors.assignedDoctor && <span className="text-red-500 text-xs mt-1">{fieldErrors.assignedDoctor}</span>}
                                        </InputGroup>

                                        <InputGroup label="Last Visit Date" error={fieldErrors.lastVisit} className="col-span-2">
                                            <input
                                                type="date"
                                                name="lastVisit"
                                                value={formData.lastVisit}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                            {fieldErrors.lastVisit && <span className="text-red-500 text-xs mt-1">{fieldErrors.lastVisit}</span>}
                                        </InputGroup>

                                        <InputGroup label="Known Conditions" className="col-span-2">
                                            <input name="knownConditions" value={formData.knownConditions} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="e.g. Diabetes, Hypertension" />
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

                                        {/* Medical Report Upload Section */}
                                        <div className="col-span-2 mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                            <div className="flex items-center gap-3 mb-4">
                                                <FiActivity className="text-blue-600" size={24} />
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">Upload Medical Reports</h3>
                                                    <p className="text-sm text-slate-600">Upload lab reports or medical history documents (auto-scanned with OCR)</p>
                                                </div>
                                            </div>

                                            {/* Upload Button */}
                                            <div className="flex gap-3 mb-4">
                                                <label className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                                                    <FiArrowRight size={18} />
                                                    Choose File (Image/PDF)
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={handleFileUpload}
                                                        className="hidden"
                                                        disabled={uploading}
                                                    />
                                                </label>
                                            </div>

                                            {/* Processing Indicator */}
                                            {uploading && (
                                                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-300">
                                                    <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-sm text-slate-700 font-medium">Processing document with scanner...</span>
                                                </div>
                                            )}

                                            {/* Error Display */}
                                            {scannerError && (
                                                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-300">
                                                    <FiAlertCircle className="text-red-600" size={20} />
                                                    <span className="text-sm text-red-700">{scannerError}</span>
                                                </div>
                                            )}

                                            {/* Uploaded Files List */}
                                            {uploadedFiles.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-semibold text-slate-800 mb-2">Uploaded Documents ({uploadedFiles.length})</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {uploadedFiles.map((item, index) => (
                                                            <div key={index} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-300">
                                                                <span className="text-sm text-slate-700">{item.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeUploadedFile(index)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    <FiX size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Scanned Data Display */}
                                            {scannedData && (
                                                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-300">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <FiCheck className="text-green-600" size={20} />
                                                            <h4 className="text-sm font-bold text-green-800">Scanned Data Extracted</h4>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setScannedData(null)}
                                                            className="text-slate-500 hover:text-slate-700"
                                                        >
                                                            <FiX size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        {scannedData.medicalHistory && (
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Medical History: </span>
                                                                <span className="text-slate-600">{scannedData.medicalHistory}</span>
                                                            </div>
                                                        )}
                                                        {scannedData.allergies && (
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Allergies: </span>
                                                                <span className="text-slate-600">{scannedData.allergies}</span>
                                                            </div>
                                                        )}
                                                        {scannedData.medications && (
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Medications: </span>
                                                                <span className="text-slate-600">{scannedData.medications}</span>
                                                            </div>
                                                        )}
                                                        {scannedData.warning && (
                                                            <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                                                                <FiAlertCircle className="inline mr-2 text-yellow-700" size={14} />
                                                                <span className="text-xs text-yellow-800">{scannedData.warning}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
                                            <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="170" />
                                        </InputGroup>

                                        <InputGroup label="Weight (kg)">
                                            <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="70" />
                                        </InputGroup>

                                        <InputGroup label="BMI">
                                            <input name="bmi" value={formData.bmi} readOnly className="w-full bg-slate-50 border-none p-0 text-slate-500 focus:ring-0 font-mono" placeholder="Auto" />
                                        </InputGroup>

                                        <InputGroup label="Blood Pressure" error={fieldErrors.bp}>
                                            <input
                                                type="text"
                                                name="bp"
                                                value={formData.bp}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300 font-mono"
                                                placeholder="120/80"
                                                pattern="[0-9]{2,3}/[0-9]{2,3}"
                                            />
                                            {fieldErrors.bp && <span className="text-red-500 text-xs mt-1">{fieldErrors.bp}</span>}
                                            <span className="text-slate-400 text-xs mt-1">Format: systolic/diastolic (e.g., 120/80)</span>
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

                            {/* STEP 5: Insurance Details */}
                            {currentStep === 4 && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Insurance Details</h2>
                                        <p className="text-slate-500">Insurance and billing information (Optional)</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Insurance Number" error={fieldErrors.insuranceNumber} className="col-span-2">
                                            <input
                                                type="text"
                                                name="insuranceNumber"
                                                value={formData.insuranceNumber}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                placeholder="e.g. INS-123456789"
                                            />
                                            {fieldErrors.insuranceNumber && <span className="text-red-500 text-xs mt-1">{fieldErrors.insuranceNumber}</span>}
                                        </InputGroup>

                                        <InputGroup label="Insurance Provider" error={fieldErrors.insuranceProvider}>
                                            <input
                                                type="text"
                                                name="insuranceProvider"
                                                value={formData.insuranceProvider}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                placeholder="e.g. HDFC ERGO, Star Health"
                                            />
                                            {fieldErrors.insuranceProvider && <span className="text-red-500 text-xs mt-1">{fieldErrors.insuranceProvider}</span>}
                                        </InputGroup>

                                        <InputGroup label="Insurance Expiry Date" error={fieldErrors.insuranceExpiry}>
                                            <input
                                                type="date"
                                                name="insuranceExpiry"
                                                value={formData.insuranceExpiry}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            {fieldErrors.insuranceExpiry && <span className="text-red-500 text-xs mt-1">{fieldErrors.insuranceExpiry}</span>}
                                        </InputGroup>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> Insurance information is optional but recommended for billing and claims processing.
                                        </p>
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
                                    {currentStep < 4 ? (
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
                                            type="button"
                                            onClick={handleSubmit}
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

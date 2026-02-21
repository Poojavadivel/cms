import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdPerson,
    MdMedicalServices,
    MdCheck,
    MdArrowForward,
    MdArrowBack,
    MdLocationOn,
    MdPhone,
    MdEmail,
    MdCalendarToday,
    MdWarning,
    MdHeight,
    MdMonitorWeight,
    MdOpacity,
    MdUploadFile,
    MdDelete
} from 'react-icons/md';
import {
    FiUser, FiPhone, FiHeart, FiActivity, FiShield, FiFileText, FiLoader, FiX
} from 'react-icons/fi';
import patientsService from '../../services/patientsService';
import doctorService from '../../services/doctorService';
import scannerService from '../../services/scannerService';
import appointmentsService from '../../services/appointmentsService';
import './addpatient.css';

// --- Indian States and Cities Data ---
const INDIAN_STATES = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Bihar Sharif'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
    'Haryana': ['Faridabad', 'Gurgaon', 'Rohtak', 'Panipat', 'Karnal', 'Hisar', 'Ambala'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Baddi'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
    'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum', 'Gulbarga', 'Dharwad'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Palakkad'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri', 'Brahmapur', 'Sambalpur'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Chandigarh'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Ajmer', 'Bikaner', 'Alwar'],
    'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Karur'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Noida'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Rishikesh'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Darjeeling'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Rangat'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
    'Delhi': ['New Delhi', 'Delhi Cantt', 'Dwarka', 'Rohini', 'Karol Bagh'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam']
};

// --- Country Codes ---
const COUNTRY_CODES = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
];

// --- Reusable Components ---

const StepIndicator = ({ step, currentStep, icon, label, description, isLast }) => {
    const isActive = currentStep === step;
    const isCompleted = currentStep > step;

    return (
        <div className="relative group">
            {/* Connector Line */}
            {!isLast && (
                <div className={`absolute left-5 top-10 bottom-[-48px] w-0.5 transition-all duration-500 delay-100 ${isCompleted ? 'bg-[#207DC0]' : 'bg-white/10'}`} />
            )}

            <div className="flex items-center gap-5 relative z-10">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-white text-[#207DC0] border-white shadow-xl scale-110' : isCompleted ? 'bg-[#207DC0] border-[#207DC0] text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    {isCompleted ? <MdCheck size={16} /> : React.cloneElement(icon, { size: 16 })}
                </div>
                <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>Step 0{step + 1}</span>
                    <span className={`text-[13px] font-bold ${isActive ? 'text-white' : 'text-white/60'}`}>{label}</span>
                </div>
            </div>
        </div>
    );
};

const PremiumInput = ({ label, error, required, children, className = '', icon }) => (
    <div className={`group relative ${className}`}>
        <label className={`block text-xs font-extrabold uppercase tracking-wider mb-2 ml-1 transition-colors
            ${error ? 'text-red-500' : 'text-slate-500 group-focus-within:text-[#207DC0]'}`}>
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className={`
            relative flex items-center bg-white border rounded-xl overflow-hidden transition-all duration-300 shadow-sm
            ${error
                ? 'border-red-300 ring-2 ring-red-50'
                : 'border-slate-200 hover:border-slate-300 group-focus-within:border-[#207DC0] group-focus-within:ring-4 group-focus-within:ring-[#207DC0]/10'
            }
        `}>
            {icon && (
                <div className={`pl-3 pr-1.5 text-base transition-colors ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#207DC0]'}`}>
                    {icon}
                </div>
            )}
            <div className={`flex-1 ${icon ? '' : 'pl-4'} pr-4 py-2`}>
                {children}
            </div>
            {error && (
                <div className="pr-4 text-red-500 animate-pulse">
                    <MdWarning />
                </div>
            )}
        </div>
        {error && (
            <motion.p
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-[10px] sm:text-xs mt-1.5 ml-1 font-medium flex items-center gap-1"
            >
                <MdWarning size={12} /> {typeof error === 'string' ? error : 'This field is required'}
            </motion.p>
        )}
    </div>
);

// --- Main Component ---

const AddPatientModal = ({ isOpen, onClose, onSuccess, patientId }) => {
    // --- State ---
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [errors, setErrors] = useState({});
    const [doctors, setDoctors] = useState([]);
    const [cities, setCities] = useState([]);

    // Phone number state with country code
    const [countryCode, setCountryCode] = useState('+91'); // Default India
    const [phoneNumber, setPhoneNumber] = useState('');

    // File Upload State
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [scannerError, setScannerError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', dateOfBirth: '', age: '', gender: '', bloodGroup: '',
        phone: '', email: '', emergencyContactName: '', emergencyContactPhone: '',
        houseNo: '', street: '', town: '', city: '', state: '', pincode: '', country: 'India',
        assignedDoctor: '', knownConditions: '', allergies: '', currentMedications: '',
        pastSurgeries: '', notes: '', lastVisit: '',
        height: '', weight: '', bmi: '', bp: '', pulse: '', spo2: '',
        insuranceNumber: '', insuranceProvider: '', insuranceExpiry: '',
        appointmentDate: '', appointmentTime: '', appointmentReason: '', patientCode: ''
    });
    
    // Medications and Surgeries as arrays
    const [medications, setMedications] = useState([]);
    const [surgeries, setSurgeries] = useState([]);
    const [newMedication, setNewMedication] = useState('');
    const [newSurgery, setNewSurgery] = useState('');

    // Reset & Load Data
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setErrors({});
            setUploadedFiles([]);
            setScannerError(null);
            fetchDoctors();

            if (patientId) {
                setFetchingData(true);
                patientsService.fetchPatientById(patientId).then(patient => {
                    // Extract phone number and country code
                    const fullPhone = patient.phone || '';
                    let extractedCode = '+91';
                    let extractedNumber = '';
                    
                    if (fullPhone) {
                        // Try to extract country code (starts with +)
                        const match = fullPhone.match(/^(\+\d{1,4})?(\d+)$/);
                        if (match) {
                            extractedCode = match[1] || '+91';
                            extractedNumber = match[2] || '';
                        } else {
                            extractedNumber = fullPhone.replace(/\D/g, '');
                        }
                    }
                    
                    setCountryCode(extractedCode);
                    setPhoneNumber(extractedNumber);
                    
                    setFormData({
                        firstName: patient.firstName || (patient.name ? patient.name.split(' ')[0] : ''),
                        lastName: patient.lastName || (patient.name ? patient.name.split(' ').slice(1).join(' ') : ''),
                        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
                        age: patient.age || '',
                        gender: patient.gender || '', bloodGroup: patient.bloodGroup || '',
                        phone: fullPhone, email: patient.email || '',
                        emergencyContactName: patient.emergencyContactName || '', emergencyContactPhone: patient.emergencyContactPhone || '',
                        houseNo: patient.houseNo || '', street: patient.street || '',
                        town: patient.town || '', city: patient.city || '', state: patient.state || '',
                        pincode: patient.pincode || '', country: patient.country || 'India',
                        assignedDoctor: patient.doctorId || '',
                        knownConditions: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : (patient.medicalHistory || ''),
                        allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : (patient.allergies || ''),
                        currentMedications: '',
                        pastSurgeries: '',
                        height: patient.height || '', weight: patient.weight || '',
                        bmi: patient.bmi || '', bp: patient.bp || '',
                        pulse: patient.pulse || '', spo2: patient.oxygen || '',
                        insuranceNumber: patient.insuranceNumber || '',
                        insuranceProvider: patient.insuranceProvider || '',
                        insuranceExpiry: patient.expiryDate || '',
                        patientCode: patient.patientCode || ''
                    });
                    
                    // Load medications and surgeries as arrays
                    if (patient.currentMedications) {
                        const meds = typeof patient.currentMedications === 'string' 
                            ? patient.currentMedications.split(',').map(s => s.trim()).filter(Boolean)
                            : patient.currentMedications;
                        setMedications(Array.isArray(meds) ? meds : []);
                    }
                    if (patient.pastSurgeries) {
                        const surgs = typeof patient.pastSurgeries === 'string'
                            ? patient.pastSurgeries.split(',').map(s => s.trim()).filter(Boolean)
                            : patient.pastSurgeries;
                        setSurgeries(Array.isArray(surgs) ? surgs : []);
                    }
                    
                    // Set cities if state is present
                    if (patient.state && INDIAN_STATES[patient.state]) {
                        setCities(INDIAN_STATES[patient.state]);
                    }
                }).catch(console.error).finally(() => setFetchingData(false));
            } else {
                // Reset for new patient
                setFormData({
                    firstName: '', lastName: '', dateOfBirth: '', age: '', gender: '', bloodGroup: '',
                    phone: '', email: '', emergencyContactName: '', emergencyContactPhone: '',
                    houseNo: '', street: '', town: '', city: '', state: '', pincode: '', country: 'India',
                    assignedDoctor: '', knownConditions: '', allergies: '', currentMedications: '',
                    pastSurgeries: '', notes: '', lastVisit: '',
                    height: '', weight: '', bmi: '', bp: '', pulse: '', spo2: '',
                    insuranceNumber: '', insuranceProvider: '', insuranceExpiry: '',
                    appointmentDate: '', appointmentTime: '', appointmentReason: '', patientCode: ''
                });
                setMedications([]);
                setSurgeries([]);
                setCities([]);
                setCountryCode('+91'); // Reset to default
                setPhoneNumber(''); // Clear phone number
            }
        }
    }, [isOpen, patientId]);

    // Close on Escape
    useEffect(() => {
        const handleLimit = (e) => {
            if (e.key === 'Escape' && isOpen && !loading) onClose();
        };
        window.addEventListener('keydown', handleLimit);
        return () => window.removeEventListener('keydown', handleLimit);
    }, [isOpen, loading, onClose]);

    const fetchDoctors = async () => {
        try {
            const list = await doctorService.fetchAllDoctors();
            setDoctors(list);
        } catch (e) {
            console.warn('Using mock doctors');
            setDoctors([
                { id: 'doc1', name: 'Dr. Sharma', specialization: 'General' },
                { id: 'doc2', name: 'Dr. Patel', specialization: 'Cardiology' }
            ]);
        }
    };

    // Calculate Age
    const calculateAge = useCallback((dob) => {
        if (!dob) return '';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString();
    }, []);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };

            // Auto-logic
            if (name === 'dateOfBirth') next.age = calculateAge(value);
            if ((name === 'height' || name === 'weight')) {
                const h = name === 'height' ? value : prev.height;
                const w = name === 'weight' ? value : prev.weight;
                if (h && w && parseFloat(h) > 0 && parseFloat(w) > 0) {
                    const heightM = parseFloat(h) / 100;
                    next.bmi = (parseFloat(w) / (heightM * heightM)).toFixed(1);
                }
            }
            return next;
        });
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    // File Upload Handler
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setScannerError(null);

        try {
            // Process multiple files
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Use temp ID if new patient
                const pid = patientId || `temp-${Date.now()}`;
                
                try {
                    const scannedResult = await scannerService.scanAndExtractMedicalData(file, pid);

                    // Auto-fill form fields if data was extracted
                    if (scannedResult) {
                        setFormData(prev => ({
                            ...prev,
                            knownConditions: prev.knownConditions ? `${prev.knownConditions}, ${scannedResult.medicalHistory || ''}` : (scannedResult.medicalHistory || ''),
                            allergies: prev.allergies ? `${prev.allergies}, ${scannedResult.allergies || ''}` : (scannedResult.allergies || '')
                        }));
                        
                        // Add extracted medications to list
                        if (scannedResult.medications) {
                            const extractedMeds = scannedResult.medications.split(',').map(s => s.trim()).filter(Boolean);
                            setMedications(prev => [...prev, ...extractedMeds]);
                        }
                    }

                    setUploadedFiles(prev => [...prev, { file, name: file.name, scannedResult }]);
                } catch (fileError) {
                    console.error(`Error processing ${file.name}:`, fileError);
                    setUploadedFiles(prev => [...prev, { file, name: file.name, error: fileError.message }]);
                }
            }
        } catch (error) {
            console.error('File upload error:', error);
            setScannerError(error.message || 'Failed to process documents');
        } finally {
            setUploading(false);
            event.target.value = ''; // Reset input
        }
    };

    const removeUploadedFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Medication handlers
    const addMedication = () => {
        if (newMedication.trim()) {
            setMedications(prev => [...prev, newMedication.trim()]);
            setNewMedication('');
        }
    };

    const removeMedication = (index) => {
        setMedications(prev => prev.filter((_, i) => i !== index));
    };

    // Surgery handlers
    const addSurgery = () => {
        if (newSurgery.trim()) {
            setSurgeries(prev => [...prev, newSurgery.trim()]);
            setNewSurgery('');
        }
    };

    const removeSurgery = (index) => {
        setSurgeries(prev => prev.filter((_, i) => i !== index));
    };

    // State/City handler
    const handleStateChange = (e) => {
        const selectedState = e.target.value;
        setFormData(prev => ({
            ...prev,
            state: selectedState,
            city: '', // Reset city when state changes
            pincode: ''
        }));
        setCities(INDIAN_STATES[selectedState] || []);
    };

    // Handle phone number input (only allow digits, max 10)
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length <= 10) {
            setPhoneNumber(value);
            // Update formData with country code + phone
            setFormData(prev => ({
                ...prev,
                phone: countryCode + value
            }));
        }
    };

    // Handle country code change
    const handleCountryCodeChange = (e) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
        // Update formData with new country code + existing phone
        setFormData(prev => ({
            ...prev,
            phone: newCode + phoneNumber
        }));
    };

    const validateStep = () => {
        const newErrors = {};
        if (currentStep === 0) {
            if (!formData.firstName.trim()) newErrors.firstName = true;
            if (!formData.lastName.trim()) newErrors.lastName = true;
            if (!formData.gender) newErrors.gender = true;
            // Either age or DOB is fine, but usually at least one
            if (!formData.age && !formData.dateOfBirth) newErrors.age = true;
        }
        if (currentStep === 1) {
            // Phone validation: Must be exactly 10 digits
            const phoneDigits = phoneNumber.replace(/\D/g, ''); // Remove non-digits
            if (!phoneDigits || phoneDigits.length !== 10) {
                newErrors.phone = 'Phone number must be exactly 10 digits';
            }
        }
        if (currentStep === 2) {
            // Mandatory vitals during initial registration
            if (!patientId) {
                if (!formData.height || parseFloat(formData.height) <= 0) newErrors.height = 'Height is required';
                if (!formData.weight || parseFloat(formData.weight) <= 0) newErrors.weight = 'Weight is required';
                if (!formData.bp || !formData.bp.trim()) newErrors.bp = 'Blood Pressure is required';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) setCurrentStep(p => p + 1);
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;
        setLoading(true);
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                dateOfBirth: formData.dateOfBirth || null,
                age: formData.age ? parseInt(formData.age) : null,
                gender: formData.gender,
                bloodGroup: formData.bloodGroup,
                phone: formData.phone,
                email: formData.email,
                address: {
                    houseNo: formData.houseNo, street: formData.street,
                    town: formData.town, city: formData.city, state: formData.state,
                    pincode: formData.pincode, country: formData.country,
                    line1: `${formData.houseNo} ${formData.street} ${formData.town} ${formData.city}`.trim()
                },
                doctorId: formData.assignedDoctor || null,
                metadata: {
                    emergencyContactName: formData.emergencyContactName,
                    emergencyContactPhone: formData.emergencyContactPhone,
                    medicalHistory: formData.knownConditions ? formData.knownConditions.split(',').map(s => s.trim()) : [],
                    prescriptions: medications,
                    allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
                    pastSurgeries: surgeries,
                    insuranceNumber: formData.insuranceNumber,
                    insuranceProvider: formData.insuranceProvider
                },
                // Flattened fields for some backward compatibility if needed
                medicalHistory: formData.knownConditions ? formData.knownConditions.split(',').map(s => s.trim()) : [],
                allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
                currentMedications: medications.join(', '),
                pastSurgeries: surgeries.join(', '),
                town: formData.town,

                vitals: {
                    heightCm: formData.height ? parseFloat(formData.height) : null,
                    weightKg: formData.weight ? parseFloat(formData.weight) : null,
                    bmi: formData.bmi ? parseFloat(formData.bmi) : null,
                    bp: formData.bp,
                    pulse: formData.pulse,
                    spo2: formData.spo2
                }
            };

            let resultPatient;
            let appointmentCreated = false;

            if (patientId) {
                resultPatient = await patientsService.updatePatient(patientId, payload);
            } else {
                resultPatient = await patientsService.createPatient(payload);
                if (formData.appointmentDate) {
                    await appointmentsService.createAppointment({
                        patientId: resultPatient.id || resultPatient._id,
                        clientName: resultPatient.name,
                        date: new Date(`${formData.appointmentDate}T${formData.appointmentTime || '09:00'}`),
                        time: formData.appointmentTime || '09:00',
                        appointmentType: 'Consultation',
                        status: 'Scheduled',
                        reason: formData.appointmentReason || 'Initial Visit',
                        notes: 'Created during registration',
                        startAt: new Date(`${formData.appointmentDate}T${formData.appointmentTime || '09:00'}`).toISOString()
                    });
                    appointmentCreated = true;
                }
            }
            if (onSuccess) onSuccess(resultPatient, appointmentCreated);
            onClose();
        } catch (error) {
            console.error('Save failed', error);
            alert('Error saving patient: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { icon: <FiUser />, label: 'Details', desc: 'Personal Info' },
        { icon: <FiPhone />, label: 'Contact', desc: 'Address & Phone' },
        { icon: <FiHeart />, label: 'Medical', desc: 'History & Vitals' },
        { icon: <FiFileText />, label: 'Finish', desc: 'Insurance & Appt' },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 font-primary">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="add-patient-modal-container relative w-full flex overflow-hidden ring-1 ring-white/20 z-10"
                    >

                        {/* Sidebar - Modern Deep Blue */}
                        <div className="hidden md:flex flex-col w-[280px] bg-gradient-to-br from-[#207DC0] to-[#165a8a] relative overflow-hidden shrink-0">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-white/5" />
                            <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/5" />

                            <div className="p-10 relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/30 shadow-xl">
                                        <FiUser className="text-white text-xl" />
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none">MOVI HOSPITAL</h2>
                                </div>
                            </div>

                            <div className="flex-1 px-10 py-6 relative z-10 overflow-y-auto no-scrollbar">
                                <div className="space-y-12 h-full">
                                    {steps.map((step, idx) => (
                                        <StepIndicator
                                            key={idx} step={idx} currentStep={currentStep}
                                            icon={step.icon} label={step.label} description={step.desc}
                                            isLast={idx === steps.length - 1}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="p-10 relative z-10">
                                <button
                                    onClick={onClose}
                                    className="w-full flex items-center gap-3 text-white/40 hover:text-white transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-red-500/20 group-hover:text-red-500 flex items-center justify-center transition-all border border-white/10">
                                        <FiX size={18} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Discard Entry</span>
                                </button>
                            </div>
                        </div>

                        {/* --- Right Content Area --- */}
                        <div className="flex-1 flex flex-col bg-white relative min-w-0">
                            {/* Mobile Header */}
                            <div className="md:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#207DC0] text-white p-1.5 rounded-md">
                                        <MdPerson />
                                    </div>
                                    <span className="font-bold text-slate-800">Step {currentStep + 1} of {steps.length}</span>
                                </div>
                                <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500"><FiX size={24} /></button>
                            </div>

                            {/* Window Controls (Floating) */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 z-50 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            >
                                <FiX size={24} />
                            </button>

                            {/* Static Header */}
                            <div className="px-8 py-5 md:px-10 md:py-6 border-b border-slate-100 bg-white z-20">
                                <div className="mx-auto">
                                    <motion.div
                                        key={`header-${currentStep}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="relative"
                                    >
                                        <h1 className="text-2xl font-black text-slate-800 mb-0.5 tracking-tight">
                                            {steps[currentStep].label} <span className="text-[#207DC0]">Module</span>
                                        </h1>
                                        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                                            {currentStep === 0 && "Biometric and Demographic Identification Phase"}
                                            {currentStep === 1 && "Secure Communication and Residency Records"}
                                            {currentStep === 2 && "Clinical Vitals and AI-Powered Document Analysis"}
                                            {currentStep === 3 && "Finalization, Coverage and Scheduling"}
                                            — Phase {currentStep + 1} of 4
                                        </p>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Form Content Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 md:pt-8 no-scrollbar bg-slate-50/30">
                                {fetchingData ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 pb-20">
                                        <div className="w-12 h-12 border-4 border-[#207DC0] border-t-transparent rounded-full animate-spin mb-4" />
                                        <p>Loading patient record...</p>
                                    </div>
                                ) : (
                                    <div className="mx-auto space-y-10 pb-20">

                                        <AnimatePresence mode='wait'>
                                            <motion.div
                                                key={currentStep}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {/* Step 0: Personal Info */}
                                                {currentStep === 0 && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <PremiumInput label="First Name" error={errors.firstName} required icon={<FiUser />}>
                                                            <input name="firstName" value={formData.firstName} onChange={handleInputChange}
                                                                className="w-full outline-none text-[#0f3e61] placeholder-slate-300 font-semibold bg-transparent" placeholder="e.g. John" autoFocus />
                                                        </PremiumInput>
                                                        <PremiumInput label="Last Name" error={errors.lastName} required>
                                                            <input name="lastName" value={formData.lastName} onChange={handleInputChange}
                                                                className="w-full outline-none text-[#0f3e61] placeholder-slate-300 font-semibold bg-transparent" placeholder="e.g. Doe" />
                                                        </PremiumInput>

                                                        <PremiumInput label="Date of Birth" error={errors.age} required icon={<MdCalendarToday />}>
                                                            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange}
                                                                max={new Date().toISOString().split('T')[0]}
                                                                className="w-full outline-none text-slate-800 bg-transparent min-h-[1.5rem]" />
                                                        </PremiumInput>
                                                        <PremiumInput label="Age">
                                                            <input type="number" name="age" value={formData.age} onChange={handleInputChange}
                                                                placeholder="Auto-calc" readOnly={!!formData.dateOfBirth}
                                                                className="w-full outline-none text-[#0f3e61] placeholder-slate-300 font-semibold bg-transparent" />
                                                        </PremiumInput>

                                                        <div className="md:col-span-2 space-y-2">
                                                            <label className="text-xs font-bold uppercase text-slate-500 ml-1">Gender *</label>
                                                            <div className="flex gap-4">
                                                                {['Male', 'Female', 'Other'].map(g => (
                                                                    <label key={g} className="flex-1 relative cursor-pointer group">
                                                                        <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleInputChange} className="peer sr-only" />
                                                                        <div className={`
                                                                            p-4 rounded-xl border-2 text-center transition-all duration-200
                                                                            ${formData.gender === g
                                                                                ? 'border-[#207DC0] bg-blue-50 text-[#207DC0] shadow-md transform scale-[1.02]'
                                                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                                                                        `}>
                                                                            <span className={`text-sm ${formData.gender === g ? 'font-extrabold' : 'font-semibold'}`}>{g}</span>
                                                                        </div>
                                                                        {formData.gender === g && (
                                                                            <motion.div
                                                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                                className="absolute top-[-8px] right-[-8px] bg-[#207DC0] text-white rounded-full p-1 shadow-lg"
                                                                            >
                                                                                <MdCheck size={12} />
                                                                            </motion.div>
                                                                        )}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            {errors.gender && <p className="text-red-500 text-xs ml-1">Please select gender</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Step 1: Contact Info */}
                                                {currentStep === 1 && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <PremiumInput label="Phone Number" error={errors.phone} required icon={<MdPhone />} className="md:col-span-2">
                                                            <div className="flex items-center gap-2 w-full">
                                                                <select 
                                                                    value={countryCode} 
                                                                    onChange={handleCountryCodeChange}
                                                                    className="outline-none text-[#0f3e61] font-bold text-base bg-transparent border-r border-slate-200 pr-2"
                                                                >
                                                                    {COUNTRY_CODES.map(item => (
                                                                        <option key={item.code} value={item.code}>
                                                                            {item.flag} {item.code}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <input 
                                                                    type="tel" 
                                                                    value={phoneNumber} 
                                                                    onChange={handlePhoneChange}
                                                                    maxLength={10}
                                                                    className="flex-1 outline-none text-[#0f3e61] placeholder-slate-300 font-bold text-lg bg-transparent" 
                                                                    placeholder="9999900000" 
                                                                />
                                                                <span className="text-xs text-slate-400 font-medium">
                                                                    {phoneNumber.length}/10
                                                                </span>
                                                            </div>
                                                        </PremiumInput>

                                                        <PremiumInput label="Email Address" icon={<MdEmail />} className="md:col-span-2">
                                                            <input name="email" value={formData.email} onChange={handleInputChange} type="email"
                                                                className="w-full outline-none text-[#0f3e61] placeholder-slate-300 font-semibold bg-transparent" placeholder="john.doe@example.com" />
                                                        </PremiumInput>

                                                        <div className="md:col-span-2 pt-4 pb-2 border-t border-slate-100 mt-2">
                                                            <h3 className="text-sm font-extrabold uppercase text-slate-400 flex items-center gap-2">
                                                                <FiPhone /> Emergency Contact
                                                            </h3>
                                                        </div>

                                                        <PremiumInput label="Contact Name">
                                                            <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent" placeholder="e.g. Jane Doe (Wife)" />
                                                        </PremiumInput>

                                                        <PremiumInput label="Emergency Phone">
                                                            <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent" placeholder="+91 ..." />
                                                        </PremiumInput>

                                                        <div className="md:col-span-2 pt-4 pb-2 border-t border-slate-100 mt-2">
                                                            <h3 className="text-sm font-extrabold uppercase text-slate-400 flex items-center gap-2">
                                                                <MdLocationOn /> Address Details
                                                            </h3>
                                                        </div>

                                                        <PremiumInput label="House / Flat No.">
                                                            <input name="houseNo" value={formData.houseNo} onChange={handleInputChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent" placeholder="A-101" />
                                                        </PremiumInput>
                                                        <PremiumInput label="Street / Colony">
                                                            <input name="street" value={formData.street} onChange={handleInputChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent" placeholder="Main Street" />
                                                        </PremiumInput>

                                                        <PremiumInput label="State" icon={<MdLocationOn />}>
                                                            <select name="state" value={formData.state} onChange={handleStateChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent cursor-pointer appearance-none">
                                                                <option value="">Select State</option>
                                                                {Object.keys(INDIAN_STATES).map(state => (
                                                                    <option key={state} value={state}>{state}</option>
                                                                ))}
                                                            </select>
                                                        </PremiumInput>
                                                        <PremiumInput label="City">
                                                            <select name="city" value={formData.city} onChange={handleInputChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent cursor-pointer appearance-none" disabled={!formData.state}>
                                                                <option value="">Select City</option>
                                                                {cities.map(city => (
                                                                    <option key={city} value={city}>{city}</option>
                                                                ))}
                                                            </select>
                                                        </PremiumInput>

                                                        <PremiumInput label="Town / Area">
                                                            <input name="town" value={formData.town} onChange={handleInputChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent" placeholder="Area / Locality" />
                                                        </PremiumInput>
                                                        <PremiumInput label="Pincode">
                                                            <input name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent" placeholder="000000" />
                                                        </PremiumInput>

                                                        <PremiumInput label="Country" className="md:col-span-2">
                                                            <input name="country" value={formData.country} onChange={handleInputChange} className="w-full outline-none text-[#0f3e61] font-semibold bg-transparent" />
                                                        </PremiumInput>
                                                    </div>
                                                )}

                                                {/* Step 2: Medical & Vitals */}
                                                {currentStep === 2 && (
                                                    <div className="space-y-8">

                                                        {/* Scanner Section */}
                                                        <div className="bg-[#ecf6ff] border-2 border-dashed border-[#207DC0]/30 rounded-xl p-6 text-center hover:bg-[#207DC0]/10 transition-colors cursor-pointer relative group">
                                                            <input
                                                                type="file"
                                                                onChange={handleFileUpload}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                accept="image/*,.pdf"
                                                                multiple
                                                                disabled={uploading}
                                                            />
                                                            {uploading ? (
                                                                <div className="flex flex-col items-center">
                                                                    <FiLoader className="animate-spin text-[#207DC0] text-3xl mb-2" />
                                                                    <p className="text-[#165a8a] font-medium">Scanning document with AI...</p>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="w-12 h-12 bg-white text-[#207DC0] rounded-full flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform">
                                                                        <MdUploadFile size={24} />
                                                                    </div>
                                                                    <h4 className="text-[#0f3e61] font-bold mb-1">Scan Medical Records</h4>
                                                                    <p className="text-[#165a8a]/70 text-xs">Upload prescriptions or reports to auto-fill details</p>
                                                                </>
                                                            )}
                                                        </div>

                                                        {uploadedFiles.length > 0 && (
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-bold uppercase text-slate-400">Uploaded Documents</p>
                                                                {uploadedFiles.map((file, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-lg text-sm shadow-sm">
                                                                        <span className="truncate flex-1 font-bold text-[#0f3e61]">{file.name}</span>
                                                                        <button onClick={() => removeUploadedFile(idx)} className="text-red-400 hover:text-red-600 p-1"><MdDelete /></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {scannerError && (
                                                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                                                                <MdWarning /> {scannerError}
                                                            </div>
                                                        )}

                                                        <div className="bg-[#ecf6ff] rounded-2xl p-6 border border-blue-100/50">
                                                            <h3 className="text-[#0f3e61] font-extrabold mb-4 flex items-center gap-2 text-lg tracking-tight">
                                                                <FiActivity className="text-xl text-[#207DC0]" /> Critical Vitals {!patientId && <span className="text-red-500 text-xs">(Required for new patients)</span>}
                                                            </h3>
                                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                                <PremiumInput label="Height (cm)" required={!patientId} error={errors.height} icon={<MdHeight className="rotate-90" />}>
                                                                    <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full outline-none bg-transparent font-bold text-[#0f3e61]" placeholder="170" min="0" />
                                                                </PremiumInput>
                                                                <PremiumInput label="Weight (kg)" required={!patientId} error={errors.weight} icon={<MdMonitorWeight />}>
                                                                    <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full outline-none bg-transparent font-bold text-[#0f3e61]" placeholder="70" min="0" />
                                                                </PremiumInput>
                                                                <PremiumInput label="BP (mmHg)" required={!patientId} error={errors.bp} icon={<FiHeart />}>
                                                                    <input name="bp" value={formData.bp} onChange={handleInputChange} className="w-full outline-none bg-transparent font-bold text-[#0f3e61]" placeholder="120/80" />
                                                                </PremiumInput>
                                                                <PremiumInput label="BMI" className={formData.bmi > 25 ? 'bg-orange-50' : ''}>
                                                                    <input name="bmi" value={formData.bmi} readOnly className="w-full outline-none bg-transparent font-bold text-[#0f3e61]" placeholder="-" />
                                                                </PremiumInput>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-6">
                                                            <PremiumInput label="Blood Group" icon={<MdOpacity />}>
                                                                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="w-full outline-none bg-transparent text-[#0f3e61] font-bold cursor-pointer appearance-none">
                                                                    <option value="">Select...</option>
                                                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                                                </select>
                                                            </PremiumInput>

                                                            <PremiumInput label="Known Conditions / History">
                                                                <textarea name="knownConditions" value={formData.knownConditions} onChange={handleInputChange} rows={2}
                                                                    className="w-full outline-none bg-transparent resize-none text-[#0f3e61] font-semibold" placeholder="e.g. Diabetes, Hypertension..." />
                                                            </PremiumInput>

                                                            {/* Dynamic Medications */}
                                                            <div className="space-y-3">
                                                                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">Current Medications</label>
                                                                <div className="flex gap-2">
                                                                    <input 
                                                                        type="text" 
                                                                        value={newMedication} 
                                                                        onChange={(e) => setNewMedication(e.target.value)}
                                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                                                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none text-[#0f3e61] font-semibold focus:border-[#207DC0] focus:ring-4 focus:ring-[#207DC0]/10" 
                                                                        placeholder="e.g. Metformin 500mg twice daily" 
                                                                    />
                                                                    <button type="button" onClick={addMedication} className="px-6 py-2 bg-[#207DC0] text-white rounded-xl font-bold hover:bg-[#165a8a] transition-colors">Add</button>
                                                                </div>
                                                                {medications.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        {medications.map((med, idx) => (
                                                                            <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg">
                                                                                <span className="text-[#0f3e61] font-semibold">{med}</span>
                                                                                <button type="button" onClick={() => removeMedication(idx)} className="text-red-400 hover:text-red-600"><MdDelete size={20} /></button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Dynamic Past Surgeries */}
                                                            <div className="space-y-3">
                                                                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">Past Surgeries</label>
                                                                <div className="flex gap-2">
                                                                    <input 
                                                                        type="text" 
                                                                        value={newSurgery} 
                                                                        onChange={(e) => setNewSurgery(e.target.value)}
                                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSurgery())}
                                                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none text-[#0f3e61] font-semibold focus:border-[#207DC0] focus:ring-4 focus:ring-[#207DC0]/10" 
                                                                        placeholder="e.g. Appendectomy (2020)" 
                                                                    />
                                                                    <button type="button" onClick={addSurgery} className="px-6 py-2 bg-[#207DC0] text-white rounded-xl font-bold hover:bg-[#165a8a] transition-colors">Add</button>
                                                                </div>
                                                                {surgeries.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        {surgeries.map((surgery, idx) => (
                                                                            <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg">
                                                                                <span className="text-[#0f3e61] font-semibold">{surgery}</span>
                                                                                <button type="button" onClick={() => removeSurgery(idx)} className="text-red-400 hover:text-red-600"><MdDelete size={20} /></button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <PremiumInput label="Assigned Doctor" icon={<MdPerson />}>
                                                                <select name="assignedDoctor" value={formData.assignedDoctor} onChange={handleInputChange} className="w-full outline-none bg-transparent text-[#0f3e61] font-bold cursor-pointer appearance-none">
                                                                    <option value="">Select Primary Doctor...</option>
                                                                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>)}
                                                                </select>
                                                            </PremiumInput>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Step 3: Final Details */}
                                                {currentStep === 3 && (
                                                    <div className="space-y-6">

                                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                                            <h3 className="font-extrabold text-[#0f3e61] mb-4 flex items-center gap-2 text-lg tracking-tight">
                                                                <FiShield className="text-[#207DC0]" /> Insurance Details (Optional)
                                                            </h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <PremiumInput label="Provider Name">
                                                                    <input name="insuranceProvider" value={formData.insuranceProvider} onChange={handleInputChange} className="w-full outline-none bg-transparent text-[#0f3e61] font-semibold" placeholder="e.g. Star Health" />
                                                                </PremiumInput>
                                                                <PremiumInput label="Policy Number">
                                                                    <input name="insuranceNumber" value={formData.insuranceNumber} onChange={handleInputChange} className="w-full outline-none bg-transparent text-[#0f3e61] font-semibold" placeholder="Top-up ID" />
                                                                </PremiumInput>
                                                            </div>
                                                        </div>

                                                        {!patientId && (
                                                            <div className="bg-[#207DC0]/5 border border-[#207DC0]/20 rounded-2xl p-6">
                                                                <h3 className="font-extrabold text-[#165a8a] mb-4 flex items-center gap-2 text-lg tracking-tight">
                                                                    <MdCalendarToday /> Schedule First Appointment
                                                                </h3>
                                                                <p className="text-xs text-[#207DC0] mb-4">Leave empty if you just want to register the patient without booking.</p>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <PremiumInput label="Appointment Date" className="bg-white">
                                                                        <input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleInputChange} className="w-full outline-none bg-transparent min-h-[1.5rem] text-[#0f3e61] font-semibold" min={new Date().toISOString().split('T')[0]} />
                                                                    </PremiumInput>
                                                                    <PremiumInput label="Time" className="bg-white">
                                                                        <input type="time" name="appointmentTime" value={formData.appointmentTime} onChange={handleInputChange} className="w-full outline-none bg-transparent min-h-[1.5rem] text-[#0f3e61] font-semibold" />
                                                                    </PremiumInput>
                                                                    <PremiumInput label="Reason for Visit" className="md:col-span-2 bg-white">
                                                                        <input name="appointmentReason" value={formData.appointmentReason} onChange={handleInputChange} className="w-full outline-none bg-transparent text-[#0f3e61] font-semibold" placeholder="e.g. Fever, Consultation" />
                                                                    </PremiumInput>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>

                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center z-50 shrink-0 shadow-[0_-5px_25px_rgba(0,0,0,0.03)]">
                                {currentStep > 0 ? (
                                    <button
                                        onClick={() => setCurrentStep(p => p - 1)}
                                        className="px-6 py-3 rounded-[20px] font-black text-slate-400 hover:text-[#0f3e61] transition-all flex items-center gap-2 group text-[11px] uppercase tracking-wider"
                                    >
                                        <MdArrowBack className="group-hover:-translate-x-1 transition-transform" /> Back
                                    </button>
                                ) : <div />}

                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-[20px] font-black text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all font-primary uppercase tracking-widest text-[9px]"
                                    >
                                        Dismiss
                                    </button>

                                    {currentStep < steps.length - 1 ? (
                                        <button
                                            onClick={handleNext}
                                            className="px-10 py-3 rounded-[20px] font-black bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white shadow-xl shadow-blue-500/10 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 uppercase tracking-widest text-[9px]"
                                        >
                                            Next Phase <MdArrowForward />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="px-10 py-3 rounded-[20px] font-black bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white shadow-xl shadow-blue-500/10 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest text-[9px]"
                                        >
                                            {loading ? 'Syncing...' : (patientId ? 'Update Record' : 'Finalize Record')} <MdCheck />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <style>
                        {`
                            .no-scrollbar::-webkit-scrollbar { display: none; }
                            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                        `}
                    </style>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddPatientModal;

/**
 * Neo-Pro Staff Editor - Light Theme
 * "Clean Focus Mode" Design - 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUser, FiCalendar,
  FiBriefcase, FiCheck, FiX, FiAlertCircle,
  FiArrowRight
} from 'react-icons/fi';
import staffService from '../../../services/staffService';

// Move InputGroup outside to prevent re-creation on every render
const InputGroup = ({ label, error, children, className = "" }) => (
  <div className={`group relative ${className}`}>
    <div className={`
      relative bg-white border transition-all duration-200 rounded-lg overflow-hidden shadow-sm
      ${error ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 hover:border-slate-300'}
    `}>
      <label className="block px-3 pt-2 pb-0 text-[10px] uppercase tracking-wider font-bold text-slate-400 transition-colors group-focus-within:text-blue-600 select-none">
        {label}
      </label>
      <div className="px-3 pb-2">
        {children}
      </div>
    </div>
    {error && (
      <div className="absolute top-2 right-2 text-red-500 pointer-events-none">
        <FiAlertCircle size={14} />
      </div>
    )}
    {error && (
      <div className="text-xs text-red-500 mt-1 px-1">{error}</div>
    )}
  </div>
);

const StaffFormEnterprise = ({ initial = null, onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCheckingStaffId, setIsCheckingStaffId] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', contact: '', gender: '', dob: '',
    patientFacingId: '', designation: '', department: '', qualifications: [], experienceYears: 0,
    joinedAt: '', shift: '', status: 'Available', location: '',
    roles: [], emergencyContact: '', address: '', notes: '',
    // User account fields for Doctor/Admin
    createUserAccount: false,
    userRole: '',
    password: '',
    confirmPassword: ''
  });

  // Initialize form data from initial prop (runs once per component mount due to key prop)
  useEffect(() => {
    if (initial) {
      setFormData({
        name: initial.name || '',
        email: initial.email || '',
        contact: initial.contact || '',
        gender: initial.gender || '',
        dob: initial.dob ? (initial.dob.includes('T') ? initial.dob.split('T')[0] : initial.dob) : '',
        patientFacingId: initial.patientFacingId || '',
        designation: initial.designation || '',
        department: initial.department || '',
        qualifications: initial.qualifications || [],
        experienceYears: initial.experienceYears || 0,
        joinedAt: initial.joinedAt ? new Date(initial.joinedAt).toISOString().split('T')[0] : '',
        shift: initial.shift || '',
        status: initial.status || 'Available',
        location: initial.location || '',
        roles: initial.roles || [],
        emergencyContact: initial.emergencyContact || '',
        address: initial.address || '',
        notes: initial.notes?.general || '',
        createUserAccount: false,
        userRole: '',
        password: '',
        confirmPassword: ''
      });
    }
    // Only run on mount - parent uses key prop to force remount for each edit
  }, []);

  const steps = [
    { id: 1, name: 'Personal', icon: FiUser, desc: 'Identity & Contact' },
    { id: 2, name: 'Professional', icon: FiBriefcase, desc: 'Role & Dept' },
    { id: 3, name: 'Employment', icon: FiCalendar, desc: 'Schedule & Loc' },
    { id: 4, name: 'Review', icon: FiCheck, desc: 'Finalize' }
  ];

  /* Constants */
  // Departments - Functional areas/divisions of the hospital
  const departments = [
    'Nursing Department',
    'Medical Department', 
    'Laboratory & Pathology',
    'Pharmacy',
    'Administration',
    'Housekeeping & Maintenance',
    'Security',
    'Reception & Front Desk',
    'Support Services',
    'Other'
  ];
  
  // Designations - Job roles/positions
  const designations = [
    'Doctor',
    'Admin',
    'Staff Nurse',
    'Head Nurse',
    'Nursing Assistant',
    'Lab Technician',
    'Lab Assistant',
    'Pharmacist',
    'Pharmacy Assistant',
    'Receptionist',
    'Front Desk Officer',
    'Administrative Officer',
    'Office Assistant',
    'Accountant',
    'HR Staff',
    'Cleaner',
    'Housekeeping Staff',
    'Maintenance Technician',
    'Electrician',
    'Plumber',
    'Security Guard',
    'Security Supervisor',
    'Driver',
    'Peon',
    'Ward Boy',
    'Other'
  ];
  
  const shifts = ['Morning', 'Evening', 'Night', 'Rotational'];
  const statuses = ['Available', 'On Leave', 'Off Duty', 'Busy'];

  /* Validation & Handlers */
  
  // Auto-check createUserAccount when Doctor/Admin is selected
  useEffect(() => {
    if (formData.designation === 'Doctor' || formData.designation === 'Admin') {
      setFormData(prev => ({
        ...prev,
        createUserAccount: true,
        userRole: formData.designation === 'Doctor' ? 'doctor' : 'admin'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        createUserAccount: false,
        userRole: '',
        password: '',
        confirmPassword: ''
      }));
    }
  }, [formData.designation]);
  
  // Auto-generate Staff ID when department or designation changes
  useEffect(() => {
    // Only auto-generate if:
    // 1. We're creating a new staff (not editing)
    // 2. Staff ID is empty
    // 3. Department and designation are selected
    if (!initial && !formData.patientFacingId.trim() && formData.department && formData.designation) {
      const generateId = async () => {
        try {
          const result = await staffService.generateStaffId(formData.department, formData.designation);
          if (result.success && result.patientFacingId) {
            setFormData(prev => ({ ...prev, patientFacingId: result.patientFacingId }));
          }
        } catch (error) {
          console.error('Error generating Staff ID:', error);
        }
      };
      generateId();
    }
  }, [formData.department, formData.designation, initial, formData.patientFacingId]);
  
  // Debounced Staff ID uniqueness check
  const checkStaffIdUniqueness = useCallback(async (staffId) => {
    if (!staffId || !staffId.trim()) return;
    
    setIsCheckingStaffId(true);
    try {
      const result = await staffService.checkStaffIdUnique(staffId, initial?.id);
      
      if (!result.isUnique) {
        setErrors(prev => ({
          ...prev,
          patientFacingId: result.message || 'Staff ID already exists'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.patientFacingId;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking Staff ID:', error);
    } finally {
      setIsCheckingStaffId(false);
    }
  }, [initial?.id]);

  // Debounce timer for Staff ID check
  useEffect(() => {
    if (!formData.patientFacingId || !formData.patientFacingId.trim()) return;
    
    const timer = setTimeout(() => {
      checkStaffIdUniqueness(formData.patientFacingId);
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timer);
  }, [formData.patientFacingId, checkStaffIdUniqueness]);
  
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Required';
      if (!formData.email.trim()) newErrors.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.contact.trim()) newErrors.contact = 'Required';
      else {
        // Remove spaces, dashes, parentheses for validation
        const cleanedPhone = formData.contact.replace(/[\s\-()]/g, '');
        if (!/^\+?[0-9]{7,15}$/.test(cleanedPhone)) {
          newErrors.contact = 'Invalid phone format (7-15 digits)';
        }
      }
      if (!formData.gender) newErrors.gender = 'Required';
    }
    if (step === 2) {
      if (!formData.designation) newErrors.designation = 'Required';
      if (!formData.department) newErrors.department = 'Required';
      if (!formData.patientFacingId.trim()) newErrors.patientFacingId = 'Required';
      
      // Validate user account fields if creating Doctor/Admin
      if (formData.createUserAccount) {
        if (!formData.userRole) newErrors.userRole = 'Required';
        if (!formData.password) {
          newErrors.password = 'Required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Minimum 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          newErrors.password = 'Must contain uppercase, lowercase, and number';
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Required';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    if (step === 3) {
      if (!formData.joinedAt) newErrors.joinedAt = 'Required';
      if (!formData.shift) newErrors.shift = 'Required';
      if (!formData.location.trim()) newErrors.location = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => validateStep(currentStep) && setCurrentStep(p => Math.min(p + 1, 4));
  const handlePrevious = () => setCurrentStep(p => Math.max(p - 1, 1));
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const handleCancel = () => {
    const hasData = Object.values(formData).some(v => v && v !== '' && v !== 0 && (!Array.isArray(v) || v.length > 0));
    if (hasData && !initial) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    onCancel();
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value.split(',').map(item => item.trim()).filter(item => item) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    try {
      // Remove avatarUrl and user-specific fields from staff data
      const { avatarUrl, createUserAccount, userRole, password, confirmPassword, ...staffData } = formData;
      
      // Submit staff data
      await onSubmit({ ...staffData, ...(initial?.id && { id: initial.id, _id: initial.id }) });
      
      // If creating user account (Doctor/Admin), create user in Users collection
      if (createUserAccount && !initial) {
        try {
          const [firstName, ...lastNameParts] = formData.name.split(' ');
          const userPayload = {
            role: userRole,
            firstName: firstName || formData.name,
            lastName: lastNameParts.join(' ') || '',
            email: formData.email,
            phone: formData.contact,
            password: password,
            metadata: {
              staffId: formData.patientFacingId,
              designation: formData.designation,
              department: formData.department
            }
          };
          
          // Call user creation API
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api'}/auth/create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken') || ''
            },
            body: JSON.stringify(userPayload)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create user account');
          }
          
          if (window.showNotification) {
            window.showNotification('Staff and user account created successfully!', 'success');
          } else {
            alert('Staff and user account created successfully!');
          }
        } catch (userError) {
          console.error('User creation error:', userError);
          if (window.showNotification) {
            window.showNotification('Staff created but user account failed: ' + userError.message, 'warning');
          } else {
            alert('Staff created but user account creation failed: ' + userError.message);
          }
        }
      } else {
        if (window.showNotification) {
          window.showNotification(initial ? 'Staff updated successfully!' : 'Staff added successfully!', 'success');
        } else {
          alert(initial ? 'Staff updated successfully!' : 'Staff added successfully!');
        }
      }
    } catch (error) { 
      console.error(error); 
      const errorMsg = 'Failed to save staff: ' + (error.message || 'Unknown error');
      if (window.showNotification) {
        window.showNotification(errorMsg, 'error');
      } else {
        alert(errorMsg);
      }
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>
      <div
        className="w-full max-w-6xl h-[85vh] bg-slate-50 rounded-3xl border border-white shadow-2xl flex overflow-hidden relative"
      >

        {/* LEFT SIDEBAR - TIMELINE */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Editor</h2>
            <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
              {initial ? `ID: ${initial.patientFacingId || 'Unknown'}` : 'New Entry'}
            </p>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

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
        </div>

        {/* RIGHT CONTENT - FORM FOCUS */}
        <div className="flex-1 flex flex-col relative bg-slate-50">

          {/* Context Header (Mobile/Compact) */}
          <div className="md:hidden p-4 border-b border-slate-200 bg-white flex justify-between items-center">
            <div className="flex-1">
              <div className="text-slate-800 font-bold mb-1">Step {currentStep} of 4</div>
              <div className="text-xs text-slate-500">{steps[currentStep - 1].name}</div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
            <button onClick={handleCancel} className="p-2 text-slate-500 ml-4"><FiX /></button>
          </div>

          {/* Scrollable Form Area */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">

              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                    <p className="text-slate-500">Basic contact details and identity</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Full Name *" error={errors.name} className="col-span-2">
                      <input 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        maxLength={100}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-300 font-medium" 
                        placeholder="e.g. Sarah Johnson" 
                        autoComplete="name"
                      />
                    </InputGroup>

                    <InputGroup label="Email Address *" error={errors.email}>
                      <input 
                        type="email"
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        maxLength={100}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-300" 
                        placeholder="name@hospital.com" 
                        autoComplete="email"
                      />
                    </InputGroup>

                    <InputGroup label="Phone *" error={errors.contact}>
                      <input 
                        type="tel"
                        name="contact" 
                        value={formData.contact} 
                        onChange={handleChange} 
                        title="Enter a valid phone number with 7-15 digits (spaces and dashes allowed)"
                        maxLength={20}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-300" 
                        placeholder="+91 98765 43210" 
                        autoComplete="tel"
                      />
                    </InputGroup>

                    <InputGroup label="Emergency Contact">
                      <input 
                        type="tel"
                        name="emergencyContact" 
                        value={formData.emergencyContact} 
                        onChange={handleChange} 
                        maxLength={20}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-300" 
                        placeholder="+91 98765 43211" 
                        autoComplete="tel"
                      />
                    </InputGroup>

                    <InputGroup label="Gender *" error={errors.gender}>
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleChange} 
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </InputGroup>

                    <InputGroup label="Date of Birth">
                      <input 
                        type="date" 
                        name="dob" 
                        value={formData.dob} 
                        onChange={handleChange} 
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0" 
                        autoComplete="bday"
                      />
                    </InputGroup>

                    <InputGroup label="Address" className="col-span-2">
                      <input 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        maxLength={200}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-300" 
                        placeholder="Full residential address" 
                        autoComplete="street-address"
                      />
                    </InputGroup>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Professional Role</h2>
                    <p className="text-slate-500">Define their position and department. Staff will NOT receive login credentials.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Department *" error={errors.department} className="col-span-2">
                      <select 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange} 
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0"
                      >
                        <option value="">Select Department...</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </InputGroup>

                    <InputGroup label="Designation *" error={errors.designation} className="col-span-2">
                      <select 
                        name="designation" 
                        value={formData.designation} 
                        onChange={handleChange} 
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0"
                      >
                        <option value="">Select Designation...</option>
                        {designations.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </InputGroup>

                    <InputGroup label="Staff ID * (Auto-generated)" error={errors.patientFacingId}>
                      <div className="relative">
                        <input 
                          name="patientFacingId" 
                          value={formData.patientFacingId} 
                          onChange={handleChange} 
                          maxLength={20}
                          readOnly={!initial}
                          style={{textTransform: 'uppercase'}}
                          className={`w-full bg-transparent border-none py-1 px-0 pr-6 text-slate-900 font-mono focus:outline-none focus:ring-0 placeholder-slate-300 ${!initial ? 'cursor-not-allowed opacity-75' : ''}`}
                          placeholder={formData.department && formData.designation ? "Generating..." : "Select dept & role first"} 
                          autoComplete="off"
                          title={!initial ? "Staff ID is auto-generated based on department and designation" : "You can edit the Staff ID"}
                        />
                        {isCheckingStaffId && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          </div>
                        )}
                        {!isCheckingStaffId && formData.patientFacingId.trim() && !errors.patientFacingId && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-green-500">
                            <FiCheck size={16} />
                          </div>
                        )}
                      </div>
                    </InputGroup>

                    <InputGroup label="Experience (Years)">
                      <input 
                        type="number" 
                        name="experienceYears" 
                        value={formData.experienceYears} 
                        onChange={handleChange} 
                        min="0"
                        max="50"
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0" 
                        autoComplete="off"
                      />
                    </InputGroup>

                    <InputGroup label="Qualifications" className="col-span-2">
                      <input 
                        value={formData.qualifications.join(', ')} 
                        onChange={e => handleArrayChange('qualifications', e.target.value)} 
                        maxLength={200}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-300" 
                        placeholder="Comma-separated (e.g., BSc Nursing, Certificate)" 
                        autoComplete="off"
                      />
                    </InputGroup>

                    {/* User Account Section for Doctor/Admin */}
                    {formData.createUserAccount && (
                      <>
                        <div className="col-span-2 mt-6 pt-6 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <FiUser className="text-blue-600" size={18} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">Login Credentials</h3>
                              <p className="text-sm text-slate-500">
                                {formData.designation === 'Doctor' ? 'Doctor' : 'Admin'} account will be created with system access
                              </p>
                            </div>
                          </div>
                        </div>

                        <InputGroup label="User Role *" error={errors.userRole}>
                          <select 
                            name="userRole" 
                            value={formData.userRole} 
                            onChange={handleChange} 
                            className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0"
                            disabled={formData.designation === 'Doctor' || formData.designation === 'Admin'}
                          >
                            <option value="">Select Role...</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </InputGroup>

                        <InputGroup label="Email (for login) *" error={errors.email}>
                          <input 
                            name="email" 
                            type="email"
                            value={formData.email} 
                            onChange={handleChange} 
                            className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0" 
                            placeholder="user@example.com"
                            autoComplete="email"
                            readOnly
                            title="Email from Personal Info will be used for login"
                          />
                        </InputGroup>

                        <InputGroup label="Password *" error={errors.password} className="col-span-2">
                          <input 
                            name="password" 
                            type="password"
                            value={formData.password} 
                            onChange={handleChange} 
                            className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0" 
                            placeholder="Min 8 characters, include uppercase, lowercase & number"
                            autoComplete="new-password"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Requirements: Minimum 8 characters, at least one uppercase, one lowercase, and one number
                          </p>
                        </InputGroup>

                        <InputGroup label="Confirm Password *" error={errors.confirmPassword} className="col-span-2">
                          <input 
                            name="confirmPassword" 
                            type="password"
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0" 
                            placeholder="Re-enter password"
                            autoComplete="new-password"
                          />
                        </InputGroup>

                        <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex gap-3">
                            <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-blue-800">
                              <p className="font-medium mb-1">Account Creation</p>
                              <p>This staff member will be added to both Staff and Users collections, allowing them to log into the system.</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Employment Details</h2>
                    <p className="text-slate-500">Schedule and location information</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Joining Date *" error={errors.joinedAt}>
                      <input 
                        type="date" 
                        name="joinedAt" 
                        value={formData.joinedAt} 
                        onChange={handleChange} 
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0" 
                        autoComplete="off"
                      />
                    </InputGroup>

                    <InputGroup label="Shift *" error={errors.shift}>
                      <select 
                        name="shift" 
                        value={formData.shift} 
                        onChange={handleChange} 
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0"
                      >
                        <option value="">Select Shift...</option>
                        {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </InputGroup>

                    <InputGroup label="Work Location *" error={errors.location} className="col-span-2">
                      <input 
                        name="location" 
                        value={formData.location} 
                        onChange={handleChange} 
                        maxLength={100}
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-300" 
                        placeholder="Building A, Floor 2" 
                        autoComplete="off"
                      />
                    </InputGroup>

                    <InputGroup label="Availability Status" className="col-span-2">
                      <select 
                        name="status" 
                        value={formData.status} 
                        onChange={handleChange} 
                        className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0"
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </InputGroup>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {currentStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
                      <FiCheck size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Ready to {initial ? 'Update' : 'Create'}?</h2>
                    <p className="text-slate-500">Review the details below before confirming</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Name</span>
                      <span className="text-slate-900 font-medium">{formData.name || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Staff Code</span>
                      <span className="text-slate-900 font-medium font-mono">{formData.patientFacingId || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Role</span>
                      <span className="text-slate-900 font-medium">{formData.designation || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Department</span>
                      <span className="text-slate-900 font-medium">{formData.department || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-900 font-medium">{formData.email || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Contact</span>
                      <span className="text-slate-900 font-medium">{formData.contact || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Location</span>
                      <span className="text-slate-900 font-medium">{formData.location || '-'}</span>
                    </div>
                  </div>

                  {/* User Account Info */}
                  {formData.createUserAccount && (
                    <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <FiUser className="text-blue-600" size={20} />
                        <h3 className="text-lg font-semibold text-blue-900">System Access Account</h3>
                      </div>
                      <div className="flex justify-between border-b border-blue-200 pb-3">
                        <span className="text-blue-700">User Role</span>
                        <span className="text-blue-900 font-medium capitalize">{formData.userRole || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-200 pb-3">
                        <span className="text-blue-700">Login Email</span>
                        <span className="text-blue-900 font-medium">{formData.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Password</span>
                        <span className="text-blue-900 font-medium">{'•'.repeat(12)}</span>
                      </div>
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <p className="text-sm text-blue-800">
                          ✓ Account will be created in both Staff and Users collections
                        </p>
                      </div>
                    </div>
                  )}

                  <InputGroup label="Additional Notes">
                    <textarea 
                      name="notes" 
                      value={formData.notes} 
                      onChange={handleChange} 
                      maxLength={500}
                      rows={3}
                      className="w-full bg-transparent border-none py-1 px-0 text-slate-900 focus:outline-none focus:ring-0 placeholder-slate-300 resize-none" 
                      placeholder="Any additional comments or notes..." 
                      autoComplete="off"
                    />
                  </InputGroup>
                </div>
              )}

            </form>
          </div>

          {/* Bottom Bar */}
          <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center z-10">
            <button
              type="button"
              onClick={currentStep === 1 ? handleCancel : handlePrevious}
              className="text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={currentStep < 4 ? handleNext : handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span> Saving...
                  </>
                ) : currentStep === 4 ? (
                  initial ? 'Update Staff' : 'Create Staff'
                ) : (
                  'Continue'
                )}
                {!isSubmitting && currentStep < 4 && <FiArrowRight />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StaffFormEnterprise;

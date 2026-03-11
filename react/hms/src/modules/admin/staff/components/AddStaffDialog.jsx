import React, { useState, useEffect, useCallback } from 'react';
import './AddStaffDialog.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUser, FiMail, FiPhone, FiMapPin,
    FiBriefcase, FiCalendar, FiClock, FiCheck,
    FiX, FiAlertCircle, FiAward, FiShield,
    FiArrowRight, FiArrowLeft, FiSave
} from 'react-icons/fi';
import { MdBiotech, MdPerson, MdEmail, MdPhone } from 'react-icons/md';
import staffService from '../../../../services/staffService';

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

const designations = [
    'Doctor',
    'Admin',
    'Pathologist',
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
const statuses = ['Available', 'On Call', 'On Leave', 'Off Duty', 'Busy', 'Inactive'];

const AddStaffDialog = ({ initial = null, onSubmit, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isCheckingStaffId, setIsCheckingStaffId] = useState(false);

    const [formData, setFormData] = useState({
        name: '', email: '', contact: '', gender: '', dob: '',
        patientFacingId: '', designation: '', department: '', qualifications: [], experienceYears: 0,
        joinedAt: new Date().toISOString().split('T')[0], shift: '', status: 'Available', location: '',
        roles: [], emergencyContact: '', address: '', notes: '',
        createUserAccount: false,
        userRole: '',
        password: '',
        confirmPassword: ''
    });

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
                joinedAt: initial.joinedAt ? new Date(initial.joinedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                shift: initial.shift || '',
                status: initial.status || 'Available',
                location: initial.location || '',
                roles: initial.roles || [],
                emergencyContact: initial.emergencyContact || '',
                address: initial.address || '',
                notes: typeof initial.notes === 'string' ? initial.notes : (initial.notes?.general || ''),
                createUserAccount: false,
                userRole: '',
                password: '',
                confirmPassword: ''
            });
        }
    }, [initial]);

    // Auto-check createUserAccount when Doctor/Admin/Pharmacist/Pathologist is selected
    useEffect(() => {
        const roleMap = {
            'Doctor': 'doctor',
            'Admin': 'admin',
            'Pharmacist': 'pharmacist',
            'Pathologist': 'pathologist'
        };

        if (roleMap[formData.designation]) {
            setFormData(prev => ({
                ...prev,
                createUserAccount: true,
                userRole: roleMap[formData.designation]
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

    // Auto-generate Staff ID
    useEffect(() => {
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
    }, [formData.department, formData.designation, initial]);

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.name.trim()) newErrors.name = 'Full name is required';
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
            if (!formData.contact.trim()) newErrors.contact = 'Phone number is required';
            if (!formData.gender) newErrors.gender = 'Gender is required';
        }
        if (step === 2) {
            if (!formData.designation) newErrors.designation = 'Designation is required';
            if (!formData.department) newErrors.department = 'Department is required';
            if (!formData.patientFacingId.trim()) newErrors.patientFacingId = 'Staff ID is required';

            if (formData.createUserAccount && !initial) {
                if (!formData.password) newErrors.password = 'Password is required';
                else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
                if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
            }
        }
        if (step === 3) {
            if (!formData.joinedAt) newErrors.joinedAt = 'Joining date is required';
            if (!formData.shift) newErrors.shift = 'Shift is required';
            if (!formData.status) newErrors.status = 'Status is required';
            if (!formData.location.trim()) newErrors.location = 'Work location is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (submitError) setSubmitError('');
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;

        setIsSubmitting(true);
        setSubmitError('');
        try {
            const { createUserAccount, userRole, password, confirmPassword, ...staffData } = formData;

            const recordId = initial?.id || initial?._id || null;
            if (initial && !recordId) {
                throw new Error('Unable to update staff: record ID is missing. Please reopen and try again.');
            }

            // Call standard submit
            await onSubmit({ ...staffData, ...(recordId && { id: recordId, _id: recordId }) });

            // Handle user account separately if needed (mirroring original logic)
            if (createUserAccount && !initial) {
                // Logic for user creation... (handled by parent or here)
                // For now we assume the parent's onSubmit handles the staff creation, 
                // and we can trigger user creation if needed.
                // Actually, Staff.jsx handles the staff submission, and StaffFormEnterprise handles user creation internally.
                // I will replicate the internal user creation logic to be safe.
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

                    const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api'}/auth/create-user`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken') || ''
                        },
                        body: JSON.stringify(userPayload)
                    });

                    if (!response.ok) {
                        console.warn('User account creation failed, but staff was created.');
                    }
                } catch (e) {
                    console.error('User creation sub-task failed:', e);
                }
            }
        } catch (error) {
            console.error('Final submit error:', error);
            setSubmitError(error?.message || 'Failed to save staff details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { id: 1, label: 'Profile', icon: <FiUser />, desc: 'Personal details' },
        { id: 2, label: 'Professional', icon: <FiBriefcase />, desc: 'Role & Access' },
        { id: 3, label: 'Work', icon: <FiCalendar />, desc: 'Schedule & Loc' },
        { id: 4, label: 'Finish', icon: <FiCheck />, desc: 'Review & Save' }
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Full Name *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#207DC0]">
                                        <FiUser className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none
                    ${errors.name ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white focus:shadow-lg focus:shadow-blue-500/5 hover:border-slate-200'}`}
                                        placeholder="Enter full name"
                                    />
                                    {errors.name && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.name}</span>}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Email *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[#207DC0]">
                                        <FiMail className="text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none 
                    ${errors.email ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                        placeholder="name@email.com"
                                    />
                                    {errors.email && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.email}</span>}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Contact *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[#207DC0]">
                                        <FiPhone className="text-slate-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none
                    ${errors.contact ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                        placeholder="+91 00000 00000"
                                    />
                                    {errors.contact && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.contact}</span>}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Gender *</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none
                  ${errors.gender ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.gender}</span>}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">DOB</label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207DC0] transition-all hover:border-slate-200"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Address</label>
                                <div className="relative group">
                                    <div className="absolute top-4 left-4 pointer-events-none group-focus-within:text-[#207DC0]">
                                        <FiMapPin className="text-slate-400" />
                                    </div>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207DC0] transition-all hover:border-slate-200 resize-none"
                                        placeholder="Resident address..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Department *</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none
                  ${errors.department ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                {errors.department && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.department}</span>}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Designation *</label>
                                <select
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none
                  ${errors.designation ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                >
                                    <option value="">Select Designation</option>
                                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                {errors.designation && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.designation}</span>}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Staff ID *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[#207DC0]">
                                        <FiShield className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="patientFacingId"
                                        value={formData.patientFacingId}
                                        onChange={handleChange}
                                        readOnly={!initial}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none font-mono
                    ${!initial ? 'bg-slate-100/50 text-slate-400 border-slate-100' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                        placeholder="Auto-generating..."
                                    />
                                    {errors.patientFacingId && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.patientFacingId}</span>}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Experience (Years)</label>
                                <input
                                    type="number"
                                    name="experienceYears"
                                    value={formData.experienceYears}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207DC0] transition-all"
                                    placeholder="0"
                                />
                            </div>

                            {/* Account Section Appears for Doctors/Admins */}
                            <AnimatePresence>
                                {formData.createUserAccount && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="col-span-2 space-y-6 pt-3 border-t border-slate-100"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#207DC0] flex items-center justify-center border border-blue-100 shadow-sm">
                                                <FiShield size={20} />
                                            </div>
                                            <div>
                                                <h4 className="dialog-section-title text-sm font-extrabold text-[#0f3e61] uppercase tracking-tight">Login Credentials</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Account will be created automatically</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-1">
                                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Password *</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-2xl outline-none transition-all
                          ${errors.password ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] hover:border-slate-200'}`}
                                                    placeholder="••••••••"
                                                />
                                                {errors.password && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.password}</span>}
                                            </div>

                                            <div className="col-span-1">
                                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Confirm Password *</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-2xl outline-none transition-all
                          ${errors.confirmPassword ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] hover:border-slate-200'}`}
                                                    placeholder="••••••••"
                                                />
                                                {errors.confirmPassword && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.confirmPassword}</span>}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Joining Date *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[#207DC0]">
                                        <FiCalendar className="text-slate-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="joinedAt"
                                        value={formData.joinedAt}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none
                    ${errors.joinedAt ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                    />
                                    {errors.joinedAt && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.joinedAt}</span>}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Shift *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[#207DC0]">
                                        <FiClock className="text-slate-400" />
                                    </div>
                                    <select
                                        name="shift"
                                        value={formData.shift}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none
                    ${errors.shift ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                    >
                                        <option value="">Select Shift</option>
                                        {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.shift && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.shift}</span>}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Status *</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none ${errors.status ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                >
                                    <option value="">Select Status</option>
                                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {errors.status && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.status}</span>}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Work Location *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[#207DC0]">
                                        <FiMapPin className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-2xl transition-all outline-none
                    ${errors.location ? 'border-red-100 bg-red-50 focus:border-red-400' : 'border-slate-100 focus:border-[#207DC0] focus:bg-white hover:border-slate-200'}`}
                                        placeholder="e.g. O.P.D Block, Floor 1"
                                    />
                                    {errors.location && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.location}</span>}
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Additional Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207DC0] transition-all hover:border-slate-200 resize-none"
                                    placeholder="Medical history, references, or specific instructions..."
                                ></textarea>
                            </div>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="text-center pb-6 border-b border-slate-100">
                            <div className="w-16 h-16 bg-blue-50 text-[#207DC0] rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
                                <FiCheck size={32} />
                            </div>
                            <h3 className="text-xl font-extrabold text-[#0f3e61]">Ready to Confirm!</h3>
                            <p className="text-sm text-slate-500 font-medium">Please review the information before saving.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                                <p className="text-sm font-extrabold text-[#0f3e61]">{formData.name}</p>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Staff ID</p>
                                <p className="text-sm font-extrabold text-[#0f3e61] font-mono">{formData.patientFacingId}</p>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Designation</p>
                                <p className="text-sm font-extrabold text-[#0f3e61]">{formData.designation}</p>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
                                <p className="text-sm font-extrabold text-[#0f3e61]">{formData.department}</p>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                <p className="text-sm font-extrabold text-[#0f3e61] truncate">{formData.email}</p>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                <p className="text-sm font-extrabold text-[#0f3e61]">{formData.location}</p>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-sm font-extrabold text-[#0f3e61]">{formData.status || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div className="flex gap-3">
                                <FiAlertCircle className="text-[#207DC0] mt-0.5" size={16} />
                                <p className="text-[11px] font-bold text-[#207DC0] uppercase leading-relaxed">
                                    By clicking confirm, you are adding this staff member to the hospital records.
                                    {formData.createUserAccount && " A login account will also be generated automatically."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="add-staff-dialog-modal-container"
            >
                {/* Sidebar - Modern Deep Blue */}
                <div className="hidden md:flex flex-col w-[280px] bg-gradient-to-br from-[#207DC0] to-[#165a8a] relative overflow-hidden shrink-0">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-white/5" />
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/5" />

                    <div className="p-10 relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-2xl">
                                <FiBriefcase className="text-white text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Movi Staff</h2>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">Enterprise Portal</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 px-10 py-6 relative z-10 overflow-y-auto no-scrollbar">
                        <div className="space-y-12 h-full">
                            {steps.map((step, idx) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                const isLast = idx === steps.length - 1;

                                return (
                                    <div key={step.id} className="relative group">
                                        {/* Connector Line */}
                                        {!isLast && (
                                            <div className={`absolute left-5 top-10 bottom-[-48px] w-0.5 transition-all duration-500 ${isCompleted ? 'bg-[#207DC0]' : 'bg-white/10'}`} />
                                        )}
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-white text-[#207DC0] border-white shadow-xl scale-110' : isCompleted ? 'bg-[#207DC0] border-[#207DC0] text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                                {isCompleted ? <FiCheck size={18} /> : step.icon}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>Step 0{step.id}</span>
                                                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/60'}`}>{step.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-10 relative z-10">
                        <button
                            onClick={onCancel}
                            className="w-full flex items-center gap-3 text-white/40 hover:text-white transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-red-500/20 group-hover:text-red-500 flex items-center justify-center transition-all border border-white/10">
                                <FiX size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Discard Entry</span>
                        </button>
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="flex-1 flex flex-col bg-white min-w-0 relative">
                    {/* Window Controls (Floating) */}
                    <button
                        onClick={onCancel}
                        className="absolute top-6 right-6 z-50 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                        <FiX size={24} />
                    </button>

                    {/* Static Header */}
                    <div className="px-10 py-6 md:px-14 md:py-8 border-b border-slate-100 bg-white z-20">
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                key={`header-${currentStep}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="relative"
                            >
                                <h1 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">
                                    {steps.find(s => s.id === currentStep)?.label} <span className="text-[#207DC0]">Module</span>
                                </h1>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                    {initial ? 'Modifying existing personnel records' : 'Institutional Onboarding Process'} — Phase {currentStep} of 4
                                </p>
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 md:p-14 md:pt-10 no-scrollbar bg-slate-50/10">
                        <div className="max-w-4xl mx-auto space-y-10 pb-20">

                            <AnimatePresence mode='wait'>
                                {renderStepContent()}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="relative p-8 bg-white border-t border-slate-100 flex justify-between items-center z-50 shrink-0 shadow-[0_-5px_25px_rgba(0,0,0,0.03)]">
                        {submitError ? (
                            <div className="absolute left-8 right-8 -top-10 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wide">
                                {submitError}
                            </div>
                        ) : null}
                        {currentStep > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-8 py-4 rounded-[22px] font-black text-slate-400 hover:text-[#0f3e61] transition-all flex items-center gap-3 group"
                            >
                                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back Phase
                            </button>
                        ) : <div />}

                        <div className="flex gap-4">
                            <button
                                onClick={onCancel}
                                className="px-8 py-4 rounded-[22px] font-black text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all font-primary uppercase tracking-widest text-[10px]"
                            >
                                Dismiss
                            </button>

                            {currentStep < 4 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-12 py-4 rounded-[22px] font-black bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center gap-3 uppercase tracking-widest text-[10px]"
                                >
                                    Next Phase <FiArrowRight />
                                </button>
                            ) : (
                                <button
                                    onClick={handleFinalSubmit}
                                    disabled={isSubmitting}
                                    className="px-12 py-4 rounded-[22px] font-black bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                                >
                                    {isSubmitting ? 'Syncing...' : 'Finalize Record'} <FiSave />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AddStaffDialog;

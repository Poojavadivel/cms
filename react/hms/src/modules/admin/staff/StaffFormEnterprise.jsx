/**
 * Neo-Pro Staff Editor - Light Theme
 * "Clean Focus Mode" Design - 2024
 */

import React, { useState, useEffect } from 'react';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar,
  FiBriefcase, FiUpload, FiCheck, FiX, FiAlertCircle,
  FiSave, FiArrowRight, FiArrowLeft
} from 'react-icons/fi';

const StaffFormEnterprise = ({ initial = null, onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(initial?.avatarUrl || '');

  const [formData, setFormData] = useState({
    name: '', email: '', contact: '', gender: '', dob: '', avatarUrl: '',
    patientFacingId: '', designation: '', department: '', qualifications: [], experienceYears: 0,
    joinedAt: '', shift: '', status: 'Available', location: '',
    roles: [], emergencyContact: '', address: '', notes: ''
  });

  useEffect(() => {
    if (initial) {
      setFormData({
        name: initial.name || '',
        email: initial.email || '',
        contact: initial.contact || '',
        gender: initial.gender || '',
        dob: initial.dob || '',
        avatarUrl: initial.avatarUrl || '',
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
        notes: initial.notes?.general || ''
      });
      setImagePreview(initial.avatarUrl || '');
    }
  }, [initial]);

  const steps = [
    { id: 1, name: 'Personal', icon: FiUser, desc: 'Identity & Contact' },
    { id: 2, name: 'Professional', icon: FiBriefcase, desc: 'Role & Dept' },
    { id: 3, name: 'Employment', icon: FiCalendar, desc: 'Schedule & Loc' },
    { id: 4, name: 'Review', icon: FiCheck, desc: 'Finalize' }
  ];

  /* Constants */
  const departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Surgery', 'Radiology', 'Pathology', 'Emergency', 'ICU', 'Administration', 'Other'];
  const designations = ['Doctor', 'Nurse', 'Surgeon', 'Specialist', 'Consultant', 'Lab Technician', 'Pharmacist', 'Receptionist', 'Admin Staff'];
  const shifts = ['Morning', 'Evening', 'Night', 'Rotational'];
  const statuses = ['Available', 'On Leave', 'Off Duty', 'Busy'];

  /* Validation & Handlers */
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Required';
      if (!formData.email.trim()) newErrors.email = 'Required';
      if (!formData.contact.trim()) newErrors.contact = 'Required';
      if (!formData.gender) newErrors.gender = 'Required';
    }
    if (step === 2) {
      if (!formData.designation) newErrors.designation = 'Required';
      if (!formData.department) newErrors.department = 'Required';
      if (!formData.patientFacingId.trim()) newErrors.patientFacingId = 'Required';
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
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); setFormData(p => ({ ...p, avatarUrl: reader.result })); };
      reader.readAsDataURL(file);
    }
  };
  const handleArrayChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value.split(',').map(item => item.trim()).filter(item => item) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, ...(initial?.id && { id: initial.id, _id: initial.id }) });
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  /* LIGHT THEME COMPONENTS */

  const InputGroup = ({ label, error, children, className = "" }) => (
    <div className={`group relative ${className}`}>
      <div className={`
        relative bg-white border transition-all duration-200 rounded-lg overflow-hidden shadow-sm
        ${error ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 hover:border-slate-300'}
      `}>
        <label className="absolute top-2 left-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-600">
          {label}
        </label>
        <div className="pt-6 pb-2 px-3">
          {children}
        </div>
      </div>
      {error && (
        <div className="absolute top-2 right-2 text-red-500">
          <FiAlertCircle size={14} />
        </div>
      )}
    </div>
  );

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

          <div className="p-6 border-t border-slate-100">
            <button onClick={onCancel} className="w-full py-3 px-4 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
              <FiX size={14} /> Cancel
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT - FORM FOCUS */}
        <div className="flex-1 flex flex-col relative bg-slate-50">

          {/* Context Header (Mobile/Compact) */}
          <div className="md:hidden p-4 border-b border-slate-200 bg-white flex justify-between items-center">
            <span className="text-slate-800 font-bold">Step {currentStep}/4</span>
            <button onClick={onCancel} className="p-2 text-slate-500"><FiX /></button>
          </div>

          {/* Scrollable Form Area */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">

              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                  <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-300 shadow-sm">
                        {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="" /> : <FiUpload size={24} className="text-slate-400" />}
                      </div>
                      <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" acceptable="image/*" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Who is this?</h2>
                      <p className="text-slate-500">Upload a photo and set basic contact info.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Full Name" error={errors.name} className="col-span-2">
                      <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300 font-medium" placeholder="e.g. Dr. Sarah Connor" autoFocus />
                    </InputGroup>

                    <InputGroup label="Email Address" error={errors.email}>
                      <input name="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="name@hospital.com" />
                    </InputGroup>

                    <InputGroup label="Phone" error={errors.contact}>
                      <input name="contact" value={formData.contact} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="+1 555 000 0000" />
                    </InputGroup>

                    <InputGroup label="Gender" error={errors.gender}>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </InputGroup>

                    <InputGroup label="Date of Birth">
                      <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0" />
                    </InputGroup>

                    <InputGroup label="Address" className="col-span-2">
                      <input name="address" value={formData.address} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="Full residential address" />
                    </InputGroup>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Professional Role</h2>
                    <p className="text-slate-500">Define their position and access level.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Staff ID" error={errors.patientFacingId}>
                      <input name="patientFacingId" value={formData.patientFacingId} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 font-mono focus:ring-0 placeholder-slate-300" placeholder="STF-####" autoFocus />
                    </InputGroup>

                    <InputGroup label="EXP (Years)">
                      <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0" />
                    </InputGroup>

                    <InputGroup label="Department" error={errors.department} className="col-span-2">
                      <select name="department" value={formData.department} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0">
                        <option value="">Select Department...</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </InputGroup>

                    <InputGroup label="Designation" error={errors.designation} className="col-span-2">
                      <select name="designation" value={formData.designation} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0">
                        <option value="">Select Designation...</option>
                        {designations.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </InputGroup>

                    <InputGroup label="Qualifications" className="col-span-2">
                      <input value={formData.qualifications.join(', ')} onChange={e => handleArrayChange('qualifications', e.target.value)} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="MBBS, MD..." />
                    </InputGroup>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 fade-in">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Logistics</h2>
                    <p className="text-slate-500">Schedule and location details.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Joining Date" error={errors.joinedAt}>
                      <input type="date" name="joinedAt" value={formData.joinedAt} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0" />
                    </InputGroup>

                    <InputGroup label="Shift" error={errors.shift}>
                      <select name="shift" value={formData.shift} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0">
                        <option value="">Select Shift...</option>
                        {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </InputGroup>

                    <InputGroup label="Work Location" error={errors.location} className="col-span-2">
                      <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300" placeholder="Building A, Floor 2" autoFocus />
                    </InputGroup>

                    <InputGroup label="Availability Status" className="col-span-2">
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0">
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
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Ready to Create?</h2>
                    <p className="text-slate-500">Review the details below before confirming.</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Name</span>
                      <span className="text-slate-900 font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Role</span>
                      <span className="text-slate-900 font-medium">{formData.designation}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-4">
                      <span className="text-slate-500">Department</span>
                      <span className="text-slate-900 font-medium">{formData.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-900 font-medium">{formData.email}</span>
                    </div>
                  </div>

                  <InputGroup label="Final Notes">
                    <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-slate-900 focus:ring-0 placeholder-slate-300 resize-none h-20" placeholder="Any last comments..." />
                  </InputGroup>
                </div>
              )}

            </form>
          </div>

          {/* Bottom Bar */}
          <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center z-10">
            <button
              type="button"
              onClick={currentStep === 1 ? onCancel : handlePrevious}
              className="text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex gap-4">
              <button
                onClick={currentStep < 4 ? handleNext : handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : currentStep === 4 ? 'Confirm Creation' : 'Continue'}
                {!isSubmitting && <FiArrowRight />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StaffFormEnterprise;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdOutlineScience, MdOutlineNoteAlt, MdHealthAndSafety, MdContentCopy } from 'react-icons/md';
import { FiX, FiUser, FiSearch, FiArrowRight, FiArrowLeft, FiSave, FiCheck, FiUpload, FiPhone, FiMail } from 'react-icons/fi';
import { fetchPatients } from '../../../../services/patientsService';
import { fetchAllDoctors } from '../../../../services/doctorService';

const AddPathologyDialog = ({ initial, onSubmit, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Patient search states
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [isSearchingPatients, setIsSearchingPatients] = useState(false);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [patientSelected, setPatientSelected] = useState(false);

    // Doctor states
    const [doctors, setDoctors] = useState([]);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

    const [formData, setFormData] = useState({
        patientId: '',
        patientCode: '',
        patientName: '',
        testName: '',
        testType: '',
        testCategory: '',
        collectionDate: new Date().toISOString().split('T')[0],
        reportDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        priority: 'Normal',
        doctorName: '',
        technician: '',
        notes: '',
        file: null,
        fileName: '',
        testResults: []
    });

    useEffect(() => {
        if (initial) {
            setFormData({
                ...formData,
                ...initial,
                collectionDate: initial.collectionDate ? new Date(initial.collectionDate).toISOString().split('T')[0] : '',
                reportDate: initial.reportDate ? new Date(initial.reportDate).toISOString().split('T')[0] : '',
                notes: initial.remarks || initial.notes || '',
                testResults: initial.testResults || initial.results || []
            });
            setPatientSearchQuery(initial.patientName || '');
            setPatientSelected(true);
        }
        loadDoctors();
    }, [initial]);

    const loadDoctors = async () => {
        try {
            setIsLoadingDoctors(true);
            const doctorsList = await fetchAllDoctors();
            setDoctors(doctorsList);
        } catch (error) {
            console.error('Error loading doctors:', error);
        } finally {
            setIsLoadingDoctors(false);
        }
    };

    const searchPatients = async (query) => {
        if (!query || query.length < 2) return;
        try {
            setIsSearchingPatients(true);
            const results = await fetchPatients({ q: query, limit: 10 });
            setPatientSearchResults(results);
            setShowPatientDropdown(true);
        } catch (error) {
            console.error('Error searching patients:', error);
        } finally {
            setIsSearchingPatients(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (patientSearchQuery && !patientSelected) {
                searchPatients(patientSearchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [patientSearchQuery]);

    const selectPatient = (patient) => {
        const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || '';
        setFormData(prev => ({
            ...prev,
            patientId: patient.patientId || patient.id || patient._id || '',
            patientCode: patient.patientCode || patient.code || '',
            patientName: fullName,
        }));
        setPatientSearchQuery(fullName);
        setPatientSelected(true);
        setShowPatientDropdown(false);
    };

    const steps = [
        { id: 1, name: 'Patient', icon: FiUser },
        { id: 2, name: 'Test Details', icon: MdOutlineScience },
        { id: 3, name: 'Medical Info', icon: MdHealthAndSafety },
        { id: 4, name: 'Finish', icon: FiCheck }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 1 && !formData.patientId) newErrors.patientName = 'Patient selection is required';
        if (step === 2) {
            if (!formData.testName) newErrors.testName = 'Test Name is required';
            if (!formData.testType) newErrors.testType = 'Test Type is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;
        setIsSubmitting(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'file' && formData[key]) {
                    submitData.append('file', formData[key]);
                } else if (key !== 'file' && key !== 'fileName') {
                    const value = formData[key];
                    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                        submitData.append(key, JSON.stringify(value));
                    } else {
                        submitData.append(key, value);
                    }
                }
            });
            await onSubmit(submitData);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-[85%] max-w-[1280px] h-[85vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex border border-white/20"
            >
                {/* Sidebar - Modern Deep Blue */}
                <div className="hidden md:flex flex-col w-[280px] bg-gradient-to-br from-[#207DC0] to-[#165a8a] relative overflow-hidden shrink-0">
                    {/* Decorative Gradient Background */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-white/10" />
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/10" />

                    <div className="p-10 relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-2xl">
                                <MdOutlineScience className="text-white text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Pathology</h2>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">Laboratory Module</p>
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
                                                {isCompleted ? <FiCheck size={18} /> : <step.icon size={18} />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>Step 0{step.id}</span>
                                                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/60'}`}>{step.name}</span>
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
                                    {steps.find(s => s.id === currentStep)?.name} <span className="text-[#207DC0]">Module</span>
                                </h1>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                    Step {currentStep} of 4: Diagnostic Data Entry
                                </p>
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 md:p-14 md:pt-10 no-scrollbar bg-slate-50/10">
                        <div className="max-w-4xl mx-auto space-y-10 pb-20">

                            <AnimatePresence mode="wait">
                                {currentStep === 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="space-y-10"
                                    >
                                        <div className="relative group">
                                            <label className="text-[10px] font-black text-[#207DC0] mb-4 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                                <FiSearch /> Identified Bio-Data Search
                                            </label>
                                            <div className="relative flex items-center bg-white border-2 border-slate-100 rounded-[30px] p-2 pr-6 transition-all duration-300 focus-within:border-[#207DC0] focus-within:shadow-2xl focus-within:shadow-blue-500/10">
                                                <div className="pl-6 pr-4 text-slate-400 group-focus-within:text-[#207DC0] transition-colors">
                                                    <FiSearch size={22} />
                                                </div>
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={patientSearchQuery}
                                                    onChange={(e) => {
                                                        setPatientSearchQuery(e.target.value);
                                                        if (!e.target.value) {
                                                            setFormData(p => ({ ...p, patientId: '', patientCode: '', patientName: '' }));
                                                            setPatientSelected(false);
                                                        }
                                                    }}
                                                    placeholder="Search Patient Name or ID..."
                                                    className="flex-1 py-4 outline-none font-bold text-slate-800 placeholder:text-slate-300 text-lg bg-transparent"
                                                />
                                                {isSearchingPatients && <div className="w-6 h-6 border-3 border-[#207DC0] border-t-transparent rounded-full animate-spin" />}
                                            </div>

                                            {showPatientDropdown && patientSearchResults.length > 0 && (
                                                <div className="absolute w-full mt-4 bg-white border border-slate-100 rounded-[35px] shadow-2xl z-[60] p-3 space-y-1 max-h-72 overflow-y-auto no-scrollbar">
                                                    {patientSearchResults.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => selectPatient(p)}
                                                            className="w-full p-5 hover:bg-slate-50 rounded-[28px] flex justify-between items-center transition-all group border border-transparent hover:border-slate-50"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#207DC0] flex items-center justify-center font-black group-hover:bg-[#207DC0] group-hover:text-white transition-all">
                                                                    {p.firstName[0]}
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="font-black text-slate-800 group-hover:text-[#207DC0] transition-colors uppercase tracking-tight">{p.firstName} {p.lastName}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{p.patientCode || p.id}</p>
                                                                </div>
                                                            </div>
                                                            <FiArrowRight className="text-slate-200 group-hover:text-[#207DC0] group-hover:translate-x-1 transition-all" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {formData.patientId && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                                                className="p-10 rounded-[45px] bg-white border-2 border-slate-50 shadow-2xl shadow-slate-200/40 flex items-center gap-10 relative group overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 opacity-10 rounded-full blur-3xl translate-x-20 -translate-y-20 group-hover:bg-[#207DC0] transition-all duration-1000" />

                                                {/* Patient Avatar Container */}
                                                <div className="w-28 h-28 rounded-[35px] bg-gradient-to-br from-[#207DC0] to-[#165a8a] p-1.5 flex-shrink-0 shadow-2xl shadow-blue-500/20 group-hover:rotate-3 transition-transform">
                                                    <div className="w-full h-full rounded-[30px] bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                                                        <FiUser size={48} />
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-4 mb-3">
                                                        <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">
                                                            {formData.patientName}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="px-4 py-1.5 bg-blue-50 text-[#207DC0] rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border border-blue-100/50">
                                                            ID: {formData.patientCode || formData.patientId}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#207DC0] hover:bg-white transition-all cursor-pointer shadow-sm">
                                                                <FiPhone size={16} />
                                                            </div>
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-all cursor-pointer shadow-sm" onClick={() => setPatientSelected(false)}>
                                                                <FiX size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="hidden lg:flex gap-4">
                                                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center min-w-[100px] group-hover:bg-white transition-colors">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vitals</p>
                                                        <p className="text-xl font-black text-slate-800">Stable</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}

                                {currentStep === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
                                    >
                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-[#207DC0] transition-colors"><MdOutlineScience /> Main Test Title</label>
                                                <input
                                                    type="text" name="testName" value={formData.testName} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                    placeholder="e.g. Complete Blood Count"
                                                />
                                                {errors.testName && <p className="text-red-500 text-[10px] font-bold mt-2 ml-2">⚠️ {errors.testName}</p>}
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-[#207DC0] transition-colors"><MdHealthAndSafety /> Clinical Category</label>
                                                <select
                                                    name="testType" value={formData.testType} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="Blood Test">Haematology (Blood)</option>
                                                    <option value="Urine Test">Urinalysis</option>
                                                    <option value="X-Ray">Radiology (X-Ray)</option>
                                                    <option value="Ultrasound">Sonography (Ultrasound)</option>
                                                    <option value="Pathology">Micro-Biology</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block">Collection Timestamp</label>
                                                <input
                                                    type="date" name="collectionDate" value={formData.collectionDate} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block">Urgency Level</label>
                                                <div className="flex gap-2">
                                                    {['Normal', 'Urgent', 'Critical'].map(p => (
                                                        <button
                                                            key={p} type="button" onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                                                            className={`flex-1 py-4 px-2 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${formData.priority === p
                                                                ? 'bg-[#0f3e61] border-[#0f3e61] text-white shadow-lg'
                                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8 max-w-4xl mx-auto"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="group">
                                                <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">Referring Consultant</label>
                                                <select
                                                    name="doctorName" value={formData.doctorName} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                                                >
                                                    <option value="">Select Primary Doctor</option>
                                                    {doctors.map(d => <option key={d.id} value={d.name}>Dr. {d.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">Certified Technician</label>
                                                <input
                                                    type="text" name="technician" value={formData.technician} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                    placeholder="Pathologist/Technician Name"
                                                />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">Clinical Observations & Detailed Remarks</label>
                                            <textarea
                                                name="notes" value={formData.notes} onChange={handleChange} rows={6}
                                                className="w-full p-6 bg-white border-2 border-slate-100 rounded-[32px] focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm resize-none"
                                                placeholder="Enter comprehensive findings, diagnostic notes, or specific observations here..."
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 4 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex flex-col items-center justify-center py-12 space-y-8 text-center"
                                    >
                                        <div className="w-40 h-40 rounded-[48px] bg-[#207DC0]/10 border-4 border-[#207DC0]/20 flex items-center justify-center text-[#207DC0] shadow-2xl shadow-[#207DC0]/10">
                                            <FiCheck size={64} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight uppercase">Ready to Commit</h3>
                                            <p className="text-sm font-semibold text-slate-400 max-w-sm mx-auto">All diagnostic data has been validated against our secure healthcare protocols.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-[#207DC0] transition-all">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Status</p>
                                                <p className="text-xs font-black text-[#207DC0] uppercase">{formData.status}</p>
                                            </div>
                                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-[#207DC0] transition-all">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Committing Priority</p>
                                                <p className="text-xs font-black text-[#207DC0] uppercase">{formData.priority}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center z-50 shrink-0 shadow-[0_-5px_25px_rgba(0,0,0,0.03)]">
                        {currentStep > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-8 py-4 rounded-[22px] font-black text-slate-400 hover:text-[#0f3e61] transition-all flex items-center gap-3 group"
                            >
                                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
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
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-12 py-4 rounded-[22px] font-black bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                                >
                                    {isSubmitting ? 'Syncing...' : 'Confirm Entry'} <FiSave />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AddPathologyDialog;

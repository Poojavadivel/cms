import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUser, FiDollarSign, FiCalendar, FiCheck,
    FiX, FiAlertCircle, FiSearch, FiFilter,
    FiArrowRight, FiArrowLeft, FiSave, FiCreditCard,
    FiActivity, FiMinusCircle, FiPlusCircle, FiFileText
} from 'react-icons/fi';
import { MdAccountBalance, MdPayments, MdHistory } from 'react-icons/md';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const PayrollEntryDialog = ({ isOpen, onClose, onSubmit, staffList = [], mode = 'create', initialData = null }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [showDeptFilter, setShowDeptFilter] = useState(false);

    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        staffId: '',
        staffName: '',
        department: '',
        designation: '',
        payPeriodMonth: new Date().getMonth() + 1,
        payPeriodYear: new Date().getFullYear(),
        paymentDate: new Date().toISOString().split('T')[0],
        basicSalary: '',
        bonus: '0',
        incentives: '0',
        overtimePay: '0',
        arrears: '0',
        employeePF: '0',
        employeeESI: '0',
        professionalTax: '0',
        tdsDeducted: '0',
        paymentMode: 'bank_transfer',
        bankName: '',
        accountNumber: '',
        status: 'approved',
        notes: ''
    });

    const [totals, setTotals] = useState({
        earnings: 0,
        deductions: 0,
        net: 0
    });

    // Calculate totals whenever form data changes
    useEffect(() => {
        const parse = (val) => parseFloat(val) || 0;
        const earnings = parse(formData.basicSalary) + parse(formData.bonus) +
            parse(formData.incentives) + parse(formData.overtimePay) +
            parse(formData.arrears);
        const deductions = parse(formData.employeePF) + parse(formData.employeeESI) +
            parse(formData.professionalTax) + parse(formData.tdsDeducted);
        setTotals({
            earnings,
            deductions,
            net: earnings - deductions
        });
    }, [formData]);

    // Load existing data if edit mode
    useEffect(() => {
        if (initialData && (mode === 'edit' || mode === 'copy')) {
            setFormData({
                staffId: initialData.staffId || '',
                staffName: initialData.staffName || '',
                department: initialData.department || '',
                designation: initialData.designation || '',
                payPeriodMonth: initialData.payPeriodMonth || new Date().getMonth() + 1,
                payPeriodYear: initialData.payPeriodYear || new Date().getFullYear(),
                paymentDate: initialData.paymentDate || new Date().toISOString().split('T')[0],
                basicSalary: initialData.basicSalary?.toString() || '',
                bonus: initialData.bonus?.toString() || '0',
                incentives: initialData.incentives?.toString() || '0',
                overtimePay: initialData.overtimePay?.toString() || '0',
                arrears: initialData.arrears?.toString() || '0',
                employeePF: initialData.statutory?.employeePF?.toString() || '0',
                employeeESI: initialData.statutory?.employeeESI?.toString() || '0',
                professionalTax: initialData.statutory?.professionalTax?.toString() || '0',
                tdsDeducted: initialData.statutory?.tdsDeducted?.toString() || '0',
                paymentMode: initialData.paymentMode || 'bank_transfer',
                bankName: initialData.bankName || '',
                accountNumber: initialData.accountNumber || '',
                status: mode === 'copy' ? 'approved' : (initialData.status || 'pending'),
                notes: initialData.notes || ''
            });
            if (mode === 'edit') setCurrentStep(2);
        }
    }, [initialData, mode, isOpen]);

    const departments = [...new Set(staffList.map(s => s.department).filter(Boolean))].sort();

    const filteredStaff = staffList.filter(s => {
        if (selectedDepartment && s.department !== selectedDepartment) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return s.name?.toLowerCase().includes(q) || s.patientFacingId?.toLowerCase().includes(q);
    });

    const handleStaffSelect = (staff) => {
        setFormData(prev => ({
            ...prev,
            staffId: staff._id || staff.id,
            staffName: staff.name,
            department: staff.department || '',
            designation: staff.designation || '',
            bankName: staff.bankName || '',
            accountNumber: staff.accountNumber || ''
        }));
        setShowDropdown(false);
        setSearchQuery('');
    };

    const loadLastMonthSalary = async () => {
        if (!formData.staffId) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api'}/payroll/staff/${formData.staffId}`, {
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) throw new Error('Failed to fetch history');
            const payrolls = await response.json();
            if (payrolls && payrolls.length > 0) {
                const last = payrolls.sort((a, b) => b.payPeriodYear - a.payPeriodYear || b.payPeriodMonth - a.payPeriodMonth)[0];
                setFormData(prev => ({
                    ...prev,
                    basicSalary: last.basicSalary?.toString() || prev.basicSalary,
                    bonus: last.bonus?.toString() || '0',
                    incentives: last.incentives?.toString() || '0',
                    overtimePay: last.overtimePay?.toString() || '0',
                    employeePF: last.statutory?.employeePF?.toString() || '0',
                    employeeESI: last.statutory?.employeeESI?.toString() || '0',
                    professionalTax: last.statutory?.professionalTax?.toString() || '0',
                    tdsDeducted: last.statutory?.tdsDeducted?.toString() || '0',
                    paymentMode: last.paymentMode || prev.paymentMode,
                    bankName: last.bankName || prev.bankName,
                    accountNumber: last.accountNumber || prev.accountNumber
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 1 && !formData.staffId) newErrors.staffId = 'Please select an employee';
        if (step === 2 && (!formData.basicSalary || parseFloat(formData.basicSalary) <= 0)) newErrors.basicSalary = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => validateStep(currentStep) && setCurrentStep(p => Math.min(p + 1, 3));
    const handleBack = () => setCurrentStep(p => Math.max(p - 1, 1));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleFinalSubmit = async () => {
        if (!validateStep(currentStep)) return;
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                payPeriodMonth: parseInt(formData.payPeriodMonth),
                payPeriodYear: parseInt(formData.payPeriodYear),
                basicSalary: parseFloat(formData.basicSalary) || 0,
                bonus: parseFloat(formData.bonus) || 0,
                incentives: parseFloat(formData.incentives) || 0,
                overtimePay: parseFloat(formData.overtimePay) || 0,
                arrears: parseFloat(formData.arrears) || 0,
                statutory: {
                    employeePF: parseFloat(formData.employeePF) || 0,
                    employeeESI: parseFloat(formData.employeeESI) || 0,
                    professionalTax: parseFloat(formData.professionalTax) || 0,
                    tdsDeducted: parseFloat(formData.tdsDeducted) || 0
                },
                totalEarnings: totals.earnings,
                totalDeductions: totals.deductions,
                netSalary: totals.net
            };
            await onSubmit(payload);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const steps = [
        { id: 1, label: 'Employee', icon: <FiUser />, desc: 'Select Staff' },
        { id: 2, label: 'Salary', icon: <FiDollarSign />, desc: 'Earnings & Deductions' },
        { id: 3, label: 'Finish', icon: <FiCheck />, desc: 'Review & Confirm' }
    ];

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-5xl h-[85vh] bg-white/95 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex border border-white/20"
            >
                {/* Sidebar */}
                <div className="w-80 bg-gradient-to-b from-[#0f172a] to-[#1e293b] p-12 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#207DC0]/20 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#207DC0] to-[#165a8a] flex items-center justify-center shadow-2xl shadow-[#207DC0]/40 border border-white/10">
                                <MdPayments className="text-white" size={26} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Movi <span className="text-[#207DC0]">Payroll</span></h2>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">Institutional Pro</p>
                            </div>
                        </div>

                        <div className="space-y-10 relative">
                            <div className="absolute left-[23px] top-4 bottom-4 w-px bg-white/10" />
                            {steps.map((step) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                return (
                                    <div key={step.id} className="relative z-10 flex items-center gap-6 group">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2
                                            ${isActive ? 'bg-white border-white shadow-[0_10px_30px_rgba(255,255,255,0.2)] text-[#0f172a] scale-110' :
                                                isCompleted ? 'bg-[#207DC0] border-[#207DC0] text-white' :
                                                    'bg-white/5 border-white/10 text-white/20'}
                                        `}>
                                            {isCompleted ? <FiCheck size={20} /> : step.icon}
                                        </div>
                                        <div>
                                            <h3 className={`text-[11px] font-black uppercase tracking-[0.15em] mb-1 transition-colors duration-300
                                                ${isActive ? 'text-white' : 'text-white/30'}`}>
                                                {step.label}
                                            </h3>
                                            <p className={`text-[9px] font-bold uppercase transition-colors duration-300 ${isActive ? 'text-white/60' : 'text-white/20'}`}>{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button onClick={onClose} className="relative z-10 flex items-center gap-4 text-white/30 hover:text-white transition-all group py-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-red-500/10 border border-white/5 flex items-center justify-center transition-all">
                            <FiX size={18} className="group-hover:text-red-500" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest group-hover:tracking-[0.15em] transition-all">Cancel Entry</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-[#F8FAFC]">
                    <div className="p-12 pb-8 flex justify-between items-center bg-white border-b border-slate-100">
                        <div className="flex-1">
                            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight mb-2 uppercase">
                                {mode === 'edit' ? 'Adjust Payroll' : 'Process <span className="text-[#207DC0]">Payroll</span>'}
                            </h1>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Enterprise Administrative Suite</p>
                        </div>
                        {currentStep === 2 && formData.staffId && (
                            <button
                                onClick={loadLastMonthSalary}
                                className="flex items-center gap-3 px-6 py-3 bg-[#0f172a] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-[#0f172a]/20 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                <MdHistory size={18} className="text-[#207DC0]" /> Load Previous
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 relative">
                                            <label className="block text-[11px] font-black text-[#0f172a]/40 mb-3 uppercase tracking-[0.2em] ml-2">Search Employee Asset</label>
                                            <div className="relative group">
                                                <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#207DC0] transition-all duration-300" size={20} />
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                                                    onFocus={() => setShowDropdown(true)}
                                                    className={`w-full pl-16 pr-8 py-5 bg-white border-2 rounded-[24px] outline-none transition-all duration-300 font-bold text-[#0f172a]
                                                        ${errors.staffId ? 'border-rose-100 bg-rose-50/50 focus:border-rose-400' : 'border-slate-100 focus:border-[#207DC0] focus:shadow-[0_20px_50px_-20px_rgba(32, 125, 192, 0.15)] focus:scale-[1.01]'}`}
                                                    placeholder="Search by name, ID or department..."
                                                />
                                            </div>

                                            <AnimatePresence>
                                                {showDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto no-scrollbar"
                                                    >
                                                        <div className="p-2 border-b border-slate-50 bg-slate-50/50 flex gap-2">
                                                            <select
                                                                value={selectedDepartment}
                                                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                                                className="flex-1 text-[10px] font-bold uppercase bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                                                            >
                                                                <option value="">All Departments</option>
                                                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                                            </select>
                                                        </div>
                                                        {filteredStaff.map((s, i) => (
                                                            <button
                                                                key={s.id || s._id}
                                                                onClick={() => handleStaffSelect(s)}
                                                                className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors flex items-center justify-between group"
                                                            >
                                                                <div>
                                                                    <div className="text-sm font-extrabold text-[#165a8a] group-hover:text-[#207DC0] transition-colors">{s.name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{s.designation} • {s.department}</div>
                                                                </div>
                                                                <span className="text-[9px] font-mono text-slate-300 group-hover:text-slate-500">{s.patientFacingId || s.id}</span>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            {errors.staffId && <span className="text-[10px] text-red-500 font-bold uppercase mt-1.5 block px-1">{errors.staffId}</span>}
                                        </div>

                                        {formData.staffId && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                className="col-span-2 bg-gradient-to-r from-white to-slate-50/50 border border-slate-100 rounded-[32px] p-6 flex items-center gap-6 shadow-sm"
                                            >
                                                <div className="w-16 h-16 rounded-[20px] bg-[#0f172a] text-white flex items-center justify-center shadow-2xl border border-white/10">
                                                    <FiUser size={28} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-[#207DC0] uppercase tracking-[0.2em] mb-1">Target Selection</p>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-2xl font-black text-[#0f172a] uppercase tracking-tighter">{formData.staffName}</span>
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] font-black text-white bg-[#207DC0] px-3 py-1 rounded-full uppercase tracking-widest">{formData.department}</span>
                                                            <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{formData.designation}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Payroll Cycle</label>
                                            <select name="payPeriodMonth" value={formData.payPeriodMonth} onChange={handleChange}
                                                className="w-full px-5 py-4 bg-white border-2 border-slate-50 rounded-2xl focus:border-[#207DC0] focus:bg-white outline-none transition-all font-bold text-[#0f172a]"
                                            >
                                                {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                            </select>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Fiscal Year</label>
                                            <input type="number" name="payPeriodYear" value={formData.payPeriodYear} onChange={handleChange}
                                                className="w-full px-5 py-4 bg-white border-2 border-slate-50 rounded-2xl focus:border-[#207DC0] focus:bg-white outline-none transition-all font-bold text-[#0f172a]"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-[#207DC0]/10 flex items-center justify-center text-[#207DC0]">
                                                <FiPlusCircle size={18} />
                                            </div>
                                            <h3 className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em]">Gross Earnings</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Basic Salary *</label>
                                                <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange}
                                                    className={`w-full px-5 py-4 bg-white border-2 rounded-2xl outline-none font-bold text-[#0f172a] transition-all
                                                        ${errors.basicSalary ? 'border-rose-100 bg-rose-50/50' : 'border-slate-50 focus:border-[#207DC0]'}`}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Bonus / Incentives</label>
                                                <input type="number" name="bonus" value={formData.bonus} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-50 rounded-2xl focus:border-[#207DC0] focus:bg-white outline-none font-bold text-[#0f172a] transition-all"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Performance Rewards</label>
                                                <input type="number" name="incentives" value={formData.incentives} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-50 rounded-2xl focus:border-[#207DC0] focus:bg-white outline-none font-bold text-[#0f172a] transition-all"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Arrears / Adjustments</label>
                                                <input type="number" name="arrears" value={formData.arrears} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-50 rounded-2xl focus:border-[#207DC0] focus:bg-white outline-none font-bold text-[#0f172a] transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                                <FiMinusCircle size={18} />
                                            </div>
                                            <h3 className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em]">Institutional Deductions</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Provident Fund (PF)</label>
                                                <input type="number" name="employeePF" value={formData.employeePF} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-50 rounded-2xl focus:border-[#207DC0] focus:bg-white outline-none font-bold text-[#0f172a] transition-all"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Income Tax (TDS)</label>
                                                <input type="number" name="tdsDeducted" value={formData.tdsDeducted} onChange={handleChange}
                                                    className="w-full px-5 py-4 bg-white border-2 border-slate-50 rounded-2xl focus:border-[#207DC0] focus:bg-white outline-none font-bold text-[#0f172a] transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[40px] p-10 text-white flex justify-between items-center shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#207DC0]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                                        <div className="relative z-10">
                                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#207DC0] mb-3">Estimated Net Salary</p>
                                            <h2 className="text-5xl font-black tracking-tighter">₹ {totals.net.toLocaleString('en-IN')}</h2>
                                        </div>
                                        <div className="relative z-10 text-right space-y-3 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/5 min-w-[240px]">
                                            <div className="flex justify-between items-baseline gap-12">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Gross Pay</span>
                                                <span className="text-sm font-black text-[#207DC0]">₹ {totals.earnings.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="w-full h-px bg-white/5" />
                                            <div className="flex justify-between items-baseline gap-12">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Total Deductions</span>
                                                <span className="text-sm font-black text-rose-400">₹ {totals.deductions.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-[#207DC0]" />
                                        <div className="flex justify-between items-start mb-10">
                                            <div className="flex gap-6 items-center">
                                                <div className="w-20 h-20 rounded-[24px] bg-slate-50 text-[#0f172a] flex items-center justify-center shadow-inner border border-slate-100">
                                                    <FiDollarSign size={32} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tighter">{formData.staffName}</h3>
                                                    <p className="text-[11px] font-black text-[#207DC0] uppercase tracking-[0.2em]">{months[formData.payPeriodMonth - 1]} {formData.payPeriodYear} • Payroll Finalization</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Record Status</p>
                                                <span className="px-5 py-2 bg-[#207DC0] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#207DC0]/20">Verified</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 mb-10">
                                            <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 relative">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-8 h-8 rounded-full bg-[#207DC0]/10 flex items-center justify-center text-[#207DC0]">
                                                        <FiPlusCircle size={18} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.15em]">Credit Components</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Base Salary</span><span className="font-black text-[#0f172a]">₹ {parseFloat(formData.basicSalary).toLocaleString()}</span></div>
                                                    {parseFloat(formData.bonus) > 0 && <div className="flex justify-between text-xs font-bold text-slate-500"><span>Bonus</span><span className="font-black text-[#207DC0]">₹ {parseFloat(formData.bonus).toLocaleString()}</span></div>}
                                                    {parseFloat(formData.incentives) > 0 && <div className="flex justify-between text-xs font-bold text-slate-500"><span>Performance</span><span className="font-black text-[#207DC0]">₹ {parseFloat(formData.incentives).toLocaleString()}</span></div>}
                                                    <div className="pt-4 border-t border-slate-200/50 flex justify-between text-xs font-black text-[#0f172a]"><span>Total Earnings</span><span>₹ {totals.earnings.toLocaleString()}</span></div>
                                                </div>
                                            </div>
                                            <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 relative">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                                        <FiMinusCircle size={18} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.15em]">Debit Components</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Provident Fund</span><span className="font-black text-rose-500">₹ {parseFloat(formData.employeePF).toLocaleString()}</span></div>
                                                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Tax (TDS)</span><span className="font-black text-rose-500">₹ {parseFloat(formData.tdsDeducted).toLocaleString()}</span></div>
                                                    <div className="pt-4 border-t border-slate-200/50 flex justify-between text-xs font-black text-rose-500"><span>Total Deductions</span><span>₹ {totals.deductions.toLocaleString()}</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-[10px] font-black text-[#0f172a]/40 uppercase tracking-[0.2em] ml-2">Preferred Disbursement Method</label>
                                            <div className="flex gap-4">
                                                {['bank_transfer', 'cash', 'cheque'].map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => setFormData(prev => ({ ...prev, paymentMode: m }))}
                                                        className={`flex-1 py-5 px-6 rounded-[24px] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-3
                                                            ${formData.paymentMode === m ? 'border-[#207DC0] bg-[#207DC0]/5 text-[#207DC0] shadow-lg shadow-blue-500/5' : 'border-slate-50 bg-white text-slate-300 hover:border-slate-200'}`}
                                                    >
                                                        {m === 'bank_transfer' ? <MdAccountBalance size={24} /> : m === 'cash' ? <FiDollarSign size={24} /> : <FiFileText size={24} />}
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{m.replace('_', ' ')}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-10 bg-white border-t border-slate-100 flex justify-between items-center px-12">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1 || mode === 'edit'}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                                ${(currentStep === 1 || mode === 'edit') ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-[#0f172a] hover:bg-slate-50'}`}
                        >
                            <FiArrowLeft size={16} /> Back
                        </button>

                        {currentStep < 3 ? (
                            <button
                                onClick={handleNext}
                                className="group flex items-center gap-3 px-10 py-5 bg-[#0f172a] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-[#0f172a]/20 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                Continue <FiArrowRight className="group-hover:translate-x-1 transition-transform text-[#207DC0]" size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-[#207DC0]/40 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><FiSave size={18} /> Process Salary</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PayrollEntryDialog;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiCalendar, FiArrowRight, FiSave, FiAlertCircle, FiCheck, FiChevronRight
} from 'react-icons/fi';
import { MdPayments, MdHistory, MdAutoGraph } from 'react-icons/md';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const NextMonthPayrollDialog = ({ isOpen, onClose, onSubmit, previousPayroll }) => {
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

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (previousPayroll && isOpen) {
            const nextMonth = previousPayroll.payPeriodMonth === 12 ? 1 : (previousPayroll.payPeriodMonth + 1);
            const nextYear = previousPayroll.payPeriodMonth === 12 ? (previousPayroll.payPeriodYear + 1) : previousPayroll.payPeriodYear;

            setFormData({
                staffId: previousPayroll.staffId || '',
                staffName: previousPayroll.staffName || '',
                department: previousPayroll.department || '',
                designation: previousPayroll.designation || '',
                payPeriodMonth: nextMonth,
                payPeriodYear: nextYear,
                paymentDate: new Date().toISOString().split('T')[0],
                basicSalary: previousPayroll.basicSalary?.toString() || '',
                bonus: previousPayroll.bonus?.toString() || '0',
                incentives: previousPayroll.incentives?.toString() || '0',
                overtimePay: previousPayroll.overtimePay?.toString() || '0',
                arrears: '0',
                employeePF: previousPayroll.statutory?.employeePF?.toString() || '0',
                employeeESI: previousPayroll.statutory?.employeeESI?.toString() || '0',
                professionalTax: previousPayroll.statutory?.professionalTax?.toString() || '0',
                tdsDeducted: previousPayroll.statutory?.tdsDeducted?.toString() || '0',
                paymentMode: previousPayroll.paymentMode || 'bank_transfer',
                bankName: previousPayroll.bankName || '',
                accountNumber: previousPayroll.accountNumber || '',
                status: 'approved',
                notes: `Cycle transfer from ${months[previousPayroll.payPeriodMonth - 1]} ${previousPayroll.payPeriodYear}`
            });
        }
    }, [previousPayroll, isOpen]);

    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            const parse = (v) => parseFloat(v) || 0;
            const earnings = parse(formData.basicSalary) + parse(formData.bonus) + parse(formData.incentives) + parse(formData.overtimePay) + parse(formData.arrears);
            const deductions = parse(formData.employeePF) + parse(formData.employeeESI) + parse(formData.professionalTax) + parse(formData.tdsDeducted);

            const payload = {
                ...formData,
                payPeriodMonth: parseInt(formData.payPeriodMonth),
                payPeriodYear: parseInt(formData.payPeriodYear),
                basicSalary: parse(formData.basicSalary),
                bonus: parse(formData.bonus),
                incentives: parse(formData.incentives),
                overtimePay: parse(formData.overtimePay),
                arrears: parse(formData.arrears),
                statutory: {
                    employeePF: parse(formData.employeePF),
                    employeeESI: parse(formData.employeeESI),
                    professionalTax: parse(formData.professionalTax),
                    tdsDeducted: parse(formData.tdsDeducted)
                },
                totalEarnings: earnings,
                totalDeductions: deductions,
                netSalary: earnings - deductions
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

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-white rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border border-white/20"
            >
                <div className="p-10 pb-8 flex justify-between items-center bg-white border-b border-slate-100">
                    <div className="flex gap-5 items-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#207DC0] to-[#165a8a] flex items-center justify-center shadow-2xl shadow-[#207DC0]/40 border border-white/10">
                            <MdAutoGraph className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight uppercase">Rapid <span className="text-[#207DC0]">Forward</span></h1>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Automated Cycle Transition</p>
                        </div>
                    </div>
                </div>

                <div className="p-12 space-y-10 bg-[#F8FAFC]">
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#207DC0]" />
                        <div>
                            <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tighter mb-1">{formData.staffName}</h3>
                            <p className="text-[10px] text-[#207DC0] font-black uppercase tracking-[0.2em]">{formData.designation} • {formData.department}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Target Period</p>
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-black text-[#0f172a] uppercase tracking-tighter">
                                <FiCalendar className="text-[#207DC0]" />
                                {months[formData.payPeriodMonth - 1]} {formData.payPeriodYear}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-2">Base Compensation</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#207DC0] font-black">₹</span>
                                <input
                                    type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange}
                                    className="w-full pl-12 pr-8 py-5 bg-white border-2 border-slate-50 rounded-[24px] focus:border-[#207DC0] focus:shadow-[0_20px_50px_-20px_rgba(32, 125, 192, 0.15)] outline-none transition-all font-black text-[#0f172a]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest ml-2">Cycle Incentive</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#207DC0] font-black">₹</span>
                                <input
                                    type="number" name="bonus" value={formData.bonus} onChange={handleChange}
                                    className="w-full pl-12 pr-8 py-5 bg-white border-2 border-slate-50 rounded-[24px] focus:border-[#207DC0] focus:shadow-[0_20px_50px_-20px_rgba(32, 125, 192, 0.15)] outline-none transition-all font-black text-[#0f172a]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[40px] p-10 text-white flex justify-between items-center shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#207DC0]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#207DC0] mb-3">Projected Net Take-Home</p>
                            <h2 className="text-4xl font-black tracking-tighter italic">₹ {(parseFloat(formData.basicSalary || 0) + parseFloat(formData.bonus || 0) + parseFloat(formData.incentives || 0) - parseFloat(formData.employeePF || 0) - parseFloat(formData.tdsDeducted || 0)).toLocaleString()}</h2>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-widest">
                            <FiAlertCircle size={16} className="text-[#207DC0]" />
                            Statutory Guardrails Active
                        </div>
                    </div>
                </div>

                <div className="p-10 bg-white border-t border-slate-100 flex gap-6 px-12">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 px-8 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:text-[#0f172a] hover:bg-slate-100 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="flex-[2] py-5 px-8 bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-[#207DC0]/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><FiSave size={18} /> Confirm Transaction</>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NextMonthPayrollDialog;

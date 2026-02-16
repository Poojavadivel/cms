import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiCalendar, FiDollarSign, FiCheckCircle,
    FiTrendingUp, FiTrendingDown, FiInfo, FiTag,
    FiCreditCard, FiFileText, FiPrinter, FiCheck
} from 'react-icons/fi';
import { MdAccountBalance, MdPayments, MdSecurity } from 'react-icons/md';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const PayrollViewDialog = ({ isOpen, onClose, payroll }) => {
    if (!isOpen || !payroll) return null;

    const getStatusConfig = (status) => {
        const s = status?.toLowerCase() || 'pending';
        if (s === 'paid') return { color: '#207DC0', bg: 'bg-[#207DC0]', border: 'border-[#207DC0]/30' };
        if (s === 'approved') return { color: '#207DC0', bg: 'bg-blue-500', border: 'border-blue-100' };
        if (s === 'processed') return { color: '#f59e0b', bg: 'bg-amber-500', border: 'border-amber-100' };
        return { color: '#ef4444', bg: 'bg-rose-500', border: 'border-rose-100' };
    };

    const status = getStatusConfig(payroll.status);

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-5xl h-[85vh] bg-white rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex border border-white/20"
            >
                {/* Sidebar Summary */}
                <div className="w-80 bg-gradient-to-b from-[#0f172a] to-[#1e293b] p-12 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#207DC0]/20 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-16">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#207DC0] to-[#165a8a] flex items-center justify-center shadow-2xl shadow-[#207DC0]/40 border border-white/10">
                                <MdPayments className="text-white" size={26} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Movi <span className="text-[#207DC0]">Secure</span></h2>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">Audit Protocol</p>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <div>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.25em] mb-4">Account Holder</p>
                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                    <p className="text-lg font-black text-white uppercase tracking-tight mb-1">{payroll.staffName}</p>
                                    <p className="text-[10px] text-[#207DC0] font-black uppercase tracking-widest">{payroll.designation}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.25em] mb-4">Pay Cycle</p>
                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex items-center gap-4">
                                    <FiCalendar className="text-[#207DC0]" size={20} />
                                    <span className="text-sm font-black text-white uppercase tracking-widest">{months[(payroll.payPeriodMonth || 1) - 1]} {payroll.payPeriodYear}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.25em] mb-4">Verification</p>
                                <div className={`p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex items-center gap-4 group`}>
                                    <div className={`w-3 h-3 rounded-full ${status.bg} shadow-[0_0_15px_${status.color}]`} />
                                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">{payroll.status || 'Verified'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={onClose} className="relative z-10 flex items-center gap-4 text-white/30 hover:text-white transition-all group py-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all">
                            <FiX size={18} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest group-hover:tracking-[0.15em] transition-all">Close Entry</span>
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 bg-[#F8FAFC] flex flex-col">
                    <div className="p-12 pb-8 flex justify-between items-center bg-white border-b border-slate-100">
                        <div className="flex-1">
                            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight mb-2 uppercase">
                                Payroll <span className="text-[#207DC0]">Statement</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Hash ID: {payroll.id?.toString().slice(-12).toUpperCase()}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#207DC0]" />
                                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Processed on {payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'Pending'}</span>
                            </div>
                        </div>
                        <MdSecurity className="text-slate-100" size={60} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 space-y-10 no-scrollbar">
                        <div className="grid grid-cols-2 gap-10">
                            {/* Credits Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-full bg-[#207DC0]/10 flex items-center justify-center text-[#207DC0]">
                                        <FiTrendingUp size={18} />
                                    </div>
                                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#0f172a]">Earnings Breakdown</h4>
                                </div>
                                <div className="space-y-5 px-4 font-bold">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400 uppercase tracking-widest">Base Salary</span>
                                        <span className="text-lg font-black text-[#0f172a]">₹ {parseFloat(payroll.basicSalary || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400 uppercase tracking-widest">Cycle Bonus</span>
                                        <span className="text-lg font-black text-[#0f172a]">₹ {parseFloat(payroll.bonus || 0).toLocaleString()}</span>
                                    </div>
                                    {parseFloat(payroll.incentives || 0) > 0 && <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400 uppercase tracking-widest">Incentives</span>
                                        <span className="text-lg font-black text-[#0f172a]">₹ {parseFloat(payroll.incentives || 0).toLocaleString()}</span>
                                    </div>}
                                    <div className="pt-4 border-t border-slate-50 flex justify-between text-[#0f172a]">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#207DC0]">Gross Pay</span>
                                        <span className="text-xl font-black italic">₹ {(parseFloat(payroll.grossSalary || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Debits Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                        <FiTrendingDown size={18} />
                                    </div>
                                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#0f172a]">Policy Deductions</h4>
                                </div>
                                <div className="space-y-5 px-4 font-bold">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400 uppercase tracking-widest">Provident Fund</span>
                                        <span className="text-lg font-black text-rose-500">₹ {parseFloat(payroll.statutory?.employeePF || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400 uppercase tracking-widest">Income Tax (TDS)</span>
                                        <span className="text-lg font-black text-rose-500">₹ {parseFloat(payroll.statutory?.tdsDeducted || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex justify-between text-[#0f172a]">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Total Deductions</span>
                                        <span className="text-xl font-black italic">₹ {(parseFloat(payroll.statutory?.employeePF || 0) + parseFloat(payroll.statutory?.tdsDeducted || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[40px] p-12 text-white flex justify-between items-center shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#207DC0]/20 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10">
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#207DC0] mb-3">Net Disbursement</p>
                                <h2 className="text-5xl font-black tracking-tighter italic">₹ {parseFloat(payroll.netSalary || 0).toLocaleString('en-IN')}</h2>
                            </div>
                            <div className="relative z-10 text-right space-y-3 bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 min-w-[280px]">
                                <div className="flex justify-between items-center gap-12">
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Method</span>
                                    <span className="text-xs font-black text-white uppercase tracking-widest">{payroll.paymentMode?.replace('_', ' ') || 'SYSTEM TRANSFER'}</span>
                                </div>
                                <div className="w-full h-px bg-white/5" />
                                <div className="flex justify-between items-center gap-12">
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Entity</span>
                                    <span className="text-xs font-black text-[#207DC0] uppercase tracking-widest">{payroll.bankName || 'GLOBAL INSTITUTIONAL'}</span>
                                </div>
                            </div>
                        </div>

                        {payroll.notes && (
                            <div className="p-8 bg-white rounded-[32px] border border-slate-100 relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-[#207DC0] transition-colors duration-500" />
                                <div className="flex items-center gap-3 mb-4">
                                    <FiFileText size={16} className="text-slate-300" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Internal Audit Footnotes</h4>
                                </div>
                                <p className="text-xs leading-relaxed text-[#0f172a] font-bold italic opacity-60">
                                    "{payroll.notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-10 bg-white border-t border-slate-100 flex justify-end gap-5 px-12">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-3 px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-[#0f172a] hover:bg-slate-100 transition-all"
                        >
                            <FiPrinter size={16} /> Print Audit
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-3 px-10 py-5 bg-[#0f172a] text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-[#0f172a]/20 hover:scale-[1.05] active:scale-95 transition-all"
                        >
                            <FiCheck className="text-[#207DC0]" size={16} /> Terminate View
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PayrollViewDialog;

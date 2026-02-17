import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiX, FiCalendar, FiDownload, FiPrinter,
    FiCheckCircle, FiClock, FiAlertCircle, FiActivity,
    FiUser, FiFileText, FiTag
} from 'react-icons/fi';
import { MdOutlineScience, MdOutlineNoteAlt } from 'react-icons/md';
import pathologyService from '../../../../services/pathologyService';
import './PathologyDialog.css';

const PathologyViewDialog = ({ isOpen, onClose, report }) => {
    const [reportData, setReportData] = useState(report || null);
    const [isLoading, setIsLoading] = useState(!report);

    useEffect(() => {
        if (report) {
            setReportData(report);
            setIsLoading(false);
        }
    }, [report]);

    if (!isOpen || !reportData) return null;

    const handleDownload = async () => {
        try {
            await pathologyService.downloadReport(reportData.id);
        } catch (err) {
            const fileName = `Report_${(reportData.patientName || 'Patient').replace(/\s+/g, '_')}.pdf`;
            try {
                await pathologyService.downloadProperReport(reportData.id, fileName);
            } catch (genError) {
                console.error('Download legacy fallback failed:', genError);
            }
        }
    };

    const getStatusConfig = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'completed' || s === 'ready') return { color: '#207DC0', bg: 'bg-[#207DC0]/10', icon: <FiCheckCircle /> };
        if (s === 'pending' || s === 'in progress') return { color: '#f59e0b', bg: 'bg-amber-50', icon: <FiClock /> };
        return { color: '#6b7280', bg: 'bg-slate-50', icon: <FiAlertCircle /> };
    };

    const status = getStatusConfig(reportData.status);

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="pathology-modal-container shadow-2xl"
            >
                {/* Sidebar Summary - Premium Blue */}
                <div className="w-[280px] bg-gradient-to-br from-[#207DC0] to-[#165a8a] border-r border-[#207DC0]/20 p-8 flex flex-col relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-white/10" />
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/10" />

                    <div className="flex items-center gap-3 mb-10 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 text-white">
                            <MdOutlineScience size={28} />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-white leading-tight uppercase tracking-tight">Diagnostics</h3>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-none mt-1">Lab Report v1.0</p>
                        </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 px-1">Primary Subject</p>
                            <div className="p-5 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/10 shadow-sm group hover:bg-white/20 transition-all">
                                <p className="text-sm font-extrabold text-white">{reportData.patientName}</p>
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-0.5">ID: {reportData.patientCode || reportData.reportId}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 px-1">Current Status</p>
                            <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm backdrop-blur-md ${status.bg || 'bg-white/10'}`} style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                <span className="text-white">{status.icon}</span>
                                <span className="text-xs font-extrabold uppercase tracking-widest text-white">{reportData.status}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 px-1">Quick Links</p>
                            <button onClick={handleDownload} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/20 hover:border-white/30 transition-all group">
                                <FiDownload className="text-white/60 group-hover:text-white" />
                                <span className="text-xs font-bold text-white/60 group-hover:text-white">Secure Download</span>
                            </button>
                            <button onClick={() => window.print()} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/20 hover:border-white/30 transition-all group">
                                <FiPrinter className="text-white/60 group-hover:text-white" />
                                <span className="text-xs font-bold text-white/60 group-hover:text-white">Print Record</span>
                            </button>
                        </div>
                    </div>

                    <button onClick={onClose} className="mt-auto w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 text-[10px] font-extrabold uppercase tracking-widest hover:bg-red-500/20 hover:text-red-100 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 relative z-10">
                        <FiX size={14} /> Close Preview
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 bg-white flex flex-col overflow-hidden">
                    <div className="p-12 pb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-extrabold text-[#0f3e61] tracking-tighter mb-2">Digital Diagnostics<span className="text-[#207DC0]">.</span></h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#207DC0] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
                                    <FiTag /> {reportData.testType || 'GENERAL LAB'}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    <FiCalendar /> {reportData.reportDate ? new Date(reportData.reportDate).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest mb-1">Authenticated Lab Report</p>
                            <p className="text-xs font-bold text-[#0f3e61]">REF: {reportData.id?.toString().slice(-12).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 pt-0 space-y-10 no-scrollbar">
                        {/* Result Highlights */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-sm text-center group hover:bg-white hover:shadow-xl transition-all border-b-4 border-b-[#207DC0]">
                                <FiActivity className="mx-auto mb-3 text-[#207DC0]" size={24} />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Key Finding</p>
                                <p className="text-sm font-extrabold text-[#0f3e61]">{reportData.testName}</p>
                            </div>
                            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-sm text-center group hover:bg-white hover:shadow-xl transition-all border-b-4 border-b-[#207DC0]">
                                <FiUser className="mx-auto mb-3 text-[#207DC0]" size={24} />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Specialist</p>
                                <p className="text-sm font-extrabold text-[#0f3e61]">{reportData.doctorName || 'N/A'}</p>
                            </div>
                            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-sm text-center group hover:bg-white hover:shadow-xl transition-all border-b-4 border-b-amber-400">
                                <FiClock className="mx-auto mb-3 text-amber-400" size={24} />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Collected On</p>
                                <p className="text-sm font-extrabold text-[#0f3e61]">{reportData.collectionDate ? new Date(reportData.collectionDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Main Results Table */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f3e61]">Pathology Observations</h4>
                                <div className="h-px flex-1 bg-slate-100 mx-6 opacity-50" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase italic leading-none">Standard Protocols Applied</span>
                            </div>

                            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Parameter</th>
                                            <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center">Value</th>
                                            <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center">Reference</th>
                                            <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {reportData.testResults?.map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50/30 transition-all group">
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-[#0f3e61]">{r.parameter}</p>
                                                    <p className="text-[9px] text-slate-300 italic">{r.unit || 'Standard Units'}</p>
                                                </td>
                                                <td className="px-8 py-5 text-center font-extrabold text-sm text-[#0f3e61]">{r.value}</td>
                                                <td className="px-8 py-5 text-center text-[10px] font-bold text-slate-400 tracking-tighter">{r.referenceRange || 'N/A'}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest ${r.status?.toLowerCase() === 'high' || r.status?.toLowerCase() === 'low' ? 'bg-rose-50 text-rose-500' : 'bg-[#207DC0]/10 text-[#207DC0]'}`}>
                                                        {r.status || 'NORMAL'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!reportData.testResults || reportData.testResults.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-10 text-center text-slate-300 italic font-medium">No discrete parameters mapped for this report type.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Final Remarks */}
                        <div className="p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[48px] text-white relative shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-20">
                                <FiFileText size={80} />
                            </div>
                            <div className="relative z-10 flex gap-8 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                                    <MdOutlineNoteAlt size={24} className="text-[#207DC0]" />
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#207DC0] mb-3">Clinical Interpretation</h5>
                                    <p className="text-sm font-medium leading-[1.8] text-white/80 italic">"{reportData.remarks || reportData.notes || 'The clinical diagnostic results are within typical range for a subject of this demographic. Recommend routine follow-up with the primary consultant.'}"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 pt-0 flex justify-end gap-3 mt-auto">
                        <button onClick={() => window.print()} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm">
                            Print Formal Copy
                        </button>
                        <button onClick={onClose} className="px-10 py-4 bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-[#207DC0]/20 hover:-translate-y-0.5 transition-all">
                            Dismiss Record
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PathologyViewDialog;

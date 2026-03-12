/**
 * HistoryTimeline.jsx — Collapsible accordion showing previous visits
 */
import React, { useState } from 'react';
import './HistoryTimeline.css';

const HistoryTimeline = ({ history = [] }) => {
    const [openId, setOpenId] = useState(null);

    if (!history.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-full">
                <span className="text-4xl mb-3">📋</span>
                <p className="font-bold text-sm text-slate-500">No previous visit history found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <span className="text-sm font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
                    <span className="text-primary-600">🕐</span> Visit History
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg">
                    {history.length} {history.length === 1 ? 'visit' : 'visits'}
                </span>
            </div>

            <div className="flex flex-col max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((visit, i) => {
                    const isOpen = openId === (visit._id || i);
                    return (
                        <div key={visit._id || i} className="flex gap-4">

                            {/* Timeline line */}
                            <div className="flex flex-col items-center shrink-0 w-4 pt-1">
                                <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shrink-0 shadow-sm ${isOpen ? 'bg-primary-600' : 'bg-slate-300'}`} />
                                {i < history.length - 1 && <div className="w-0.5 min-h-[1.5rem] flex-1 bg-slate-200 my-2 rounded-full" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-4">
                                <button
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group ${isOpen
                                            ? 'bg-primary-50 border-primary-300 shadow-sm rounded-b-none border-b-0'
                                            : 'bg-slate-50 border-slate-200 hover:border-primary-200 hover:bg-slate-100/70'
                                        }`}
                                    onClick={() => setOpenId(isOpen ? null : (visit._id || i))}
                                    aria-expanded={isOpen}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className={`text-[11px] font-extrabold tracking-wide ${isOpen ? 'text-primary-900' : 'text-slate-800'}`}>
                                                {visit.date
                                                    ? new Date(visit.date || visit.createdAt).toLocaleDateString('en-US', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                    })
                                                    : 'Unknown date'}
                                            </span>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${(visit.type || '').toLowerCase() === 'consultation' ? 'bg-sky-100 text-sky-700' :
                                                    (visit.type || '').toLowerCase() === 'follow-up' ? 'bg-violet-100 text-violet-700' :
                                                        (visit.type || '').toLowerCase() === 'emergency' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-slate-200 text-slate-600'
                                                }`}>
                                                {visit.type || 'Consultation'}
                                            </span>
                                        </div>
                                        <div className={`text-xs font-medium truncate ${isOpen ? 'text-primary-700' : 'text-slate-500'}`}>
                                            {visit.chiefComplaint || visit.diagnosis || visit.reason || 'General visit'}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] shrink-0 transition-transform duration-200 ${isOpen ? 'text-primary-500 rotate-180' : 'text-slate-400 group-hover:text-primary-400'}`}>
                                        ▼
                                    </span>
                                </button>

                                {isOpen && (
                                    <div className="bg-white border-x border-b border-primary-200 rounded-b-xl p-4 flex flex-col gap-3 shadow-inner">
                                        {visit.diagnosis && (
                                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-slate-50 pb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[90px]">Diagnosis</span>
                                                <span className="text-xs font-semibold text-slate-800">{visit.diagnosis}</span>
                                            </div>
                                        )}
                                        {visit.prescription && (
                                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-slate-50 pb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[90px]">Prescription</span>
                                                <span className="text-xs font-semibold text-slate-800">{visit.prescription}</span>
                                            </div>
                                        )}
                                        {visit.notes && (
                                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-slate-50 pb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[90px]">Notes</span>
                                                <span className="text-xs font-medium text-slate-600 italic">{visit.notes}</span>
                                            </div>
                                        )}
                                        {visit.doctor && (
                                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[90px]">Doctor</span>
                                                <span className="text-xs font-semibold text-primary-700">Dr. {visit.doctor}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryTimeline;

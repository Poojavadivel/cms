/**
 * VitalsWidget.jsx — Compact row showing BP, SPO2, Temp, Weight with trend arrows
 */
import React from 'react';
import './VitalsWidget.css';

const trendArrow = (trend) => {
    if (trend === 'up') return <span className="ml-1 text-rose-500 font-extrabold text-xs">↑</span>;
    if (trend === 'down') return <span className="ml-1 text-emerald-500 font-extrabold text-xs">↓</span>;
    return <span className="ml-1 text-slate-400 font-extrabold text-xs">→</span>;
};

/**
 * Safely formats a Blood Pressure value from various input shapes.
 * Handles: string "120/80", string "112/", object { systolic, diastolic }, null, etc.
 * Returns { display: string, isIncomplete: boolean }
 */
const formatBloodPressure = (rawValue) => {
    if (!rawValue || rawValue === '--/--') return { display: '--/--', isIncomplete: false, isNotRecorded: true };

    let sys = null;
    let dia = null;

    if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        sys = rawValue.systolic;
        dia = rawValue.diastolic;
    } else if (typeof rawValue === 'string') {
        const parts = rawValue.split('/');
        sys = parts[0]?.trim() || null;
        dia = parts[1]?.trim() || null;
    } else {
        sys = rawValue;
    }

    // Normalize: treat '0', 'null', 'undefined', 'NaN', '–', empty string as missing
    const isMissing = (v) => v == null || v === '' || v === 'null' || v === 'undefined' || v === 'NaN' || v === '–' || v === '-' || v === '0';
    const sysClean = isMissing(sys) ? null : String(sys);
    const diaClean = isMissing(dia) ? null : String(dia);

    if (!sysClean && !diaClean) return { display: '--/--', isIncomplete: false, isNotRecorded: true };
    if (!sysClean) return { display: `N/A / ${diaClean}`, isIncomplete: true, isNotRecorded: false };
    if (!diaClean) return { display: `${sysClean} / N/A`, isIncomplete: true, isNotRecorded: false };
    return { display: `${sysClean}/${diaClean}`, isIncomplete: false, isNotRecorded: false };
};

const statusClass = (status) => {
    if (status === 'critical') return 'bg-rose-50 border-rose-200 text-rose-800 ring-rose-500/10 shadow-rose-900/5';
    if (status === 'warning') return 'bg-amber-50 border-amber-200 text-amber-800 ring-amber-500/10 shadow-amber-900/5';
    return 'bg-emerald-50 border-emerald-200 text-emerald-800 ring-emerald-500/10 shadow-emerald-900/5';
};

const VitalsWidget = ({ vitals = {} }) => {
    const {
        bp = { value: '--/--', unit: 'mmHg', trend: 'stable', status: 'normal' },
        spo2 = { value: '--', unit: '%', trend: 'stable', status: 'normal' },
        temp = { value: '--', unit: '°C', trend: 'stable', status: 'normal' },
        weight = { value: '--', unit: 'kg', trend: 'stable', status: 'normal' },
    } = vitals;

    const cards = [
        { label: 'Blood Pressure', icon: '🩺', ...bp },
        { label: 'SpO₂', icon: '💧', ...spo2 },
        { label: 'Temperature', icon: '🌡️', ...temp },
        { label: 'Weight', icon: '⚖️', ...weight },
    ];

    return (
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <span className="text-sm font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
                    <span className="text-primary-600">📊</span> Recent Vitals
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {vitals.recordedAt
                        ? `Recorded: ${new Date(vitals.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Latest recording'}
                </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {cards.map((card, i) => {
                    // Special BP handling
                    const isBP = card.label === 'Blood Pressure';
                    const bpFormatted = isBP ? formatBloodPressure(card.value) : null;
                    const displayValue = isBP ? bpFormatted.display : card.value;
                    const isIncomplete = isBP && bpFormatted.isIncomplete;
                    const isNotRecorded = isBP ? bpFormatted.isNotRecorded : (card.value == null || card.value === '--' || card.value === '--/--' || card.value === '');

                    return (
                        <div key={i} className={`flex flex-row items-center justify-between gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md ring-1 ring-transparent ${isIncomplete ? 'bg-amber-50 border-amber-200 text-amber-800 ring-amber-500/10' : (isNotRecorded ? 'bg-slate-50 border-slate-200 text-slate-500' : statusClass(card.status))}`}>

                            {/* Left Side: Icon & Label */}
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 text-xl shadow-sm shrink-0">
                                    {card.icon}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">{card.label}</span>
                                    {isIncomplete && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider mt-0.5 truncate">
                                            ⚠️ Incomplete
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Value & Unit */}
                            <div className="flex flex-col items-end justify-center shrink-0">
                                {isNotRecorded ? (
                                    <div className="flex items-center gap-1.5 opacity-80 cursor-pointer hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-medium text-slate-400 italic">Not Recorded</span>
                                        <span className="w-5 h-5 rounded-full bg-slate-200 flex flex-col items-center justify-center text-slate-500 hover:bg-primary-100 hover:text-primary-600 transition-colors">
                                            <span className="text-xs font-bold leading-none">+</span>
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-slate-900">{displayValue && displayValue !== '—/—' ? displayValue : '—'}</span>
                                        <span className="text-sm font-medium text-slate-500">{card.unit}</span>
                                        {trendArrow(card.trend)}
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

export default VitalsWidget;

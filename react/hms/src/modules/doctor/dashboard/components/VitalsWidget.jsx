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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {cards.map((card, i) => (
                    <div key={i} className={`flex flex-col gap-2 p-3.5 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md ring-1 ring-transparent ${statusClass(card.status)}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{card.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 truncate">{card.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-auto">
                            <span className="text-xl font-extrabold tracking-tighter">{card.value}</span>
                            <span className="text-[10px] font-bold opacity-60">{card.unit}</span>
                            {trendArrow(card.trend)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VitalsWidget;

import React from 'react';
import { MdFavorite, MdMonitorHeart, MdThermostat, MdScale } from 'react-icons/md';

/**
 * Universally reusable component for compactly displaying patient vitals in list rows or sidebar panels.
 * Accepts robust data mapping to ensure API alignment across different views.
 */
const PatientVitalsBadgeList = ({ data }) => {
    if (!data || typeof data !== 'object') return null;

    // Robust extraction ensuring it catches vitals from either nested .vitals objects or flattened properties
    const bp = data?.vitals?.bp || data?.bp || data?.bloodPressure;
    const hr = data?.vitals?.heartRate || data?.heartRate || data?.hr;
    const spo2 = data?.vitals?.spo2 || data?.spo2 || data?.oxygen;
    const temp = data?.vitals?.temperature || data?.temperature || data?.temp;
    const weight = data?.vitals?.weightKg || data?.weightKg || data?.weight;

    const vitals = [
        { label: 'BP', value: bp, unit: 'mmHg', icon: <MdFavorite className="text-rose-500" size={12} /> },
        { label: 'HR', value: hr, unit: 'bpm', icon: <MdMonitorHeart className="text-rose-400" size={12} /> },
        { label: 'SpO₂', value: spo2, unit: '%', icon: <MdMonitorHeart className="text-cyan-500" size={12} /> },
        { label: 'Temp', value: temp, unit: '°C', icon: <MdThermostat className="text-amber-500" size={12} /> },
        { label: 'Weight', value: weight, unit: 'kg', icon: <MdScale className="text-slate-500" size={12} /> }
    ].filter(v => v.value && v.value !== '--/--' && v.value !== '--' && v.value !== '—' && String(v.value).trim() !== '');

    if (vitals.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mt-2">
            {vitals.map((v, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 shadow-sm" title={v.label}>
                    {v.icon}
                    <span>{v.value} <span className="text-slate-400 font-normal ml-0.5">{v.unit}</span></span>
                </span>
            ))}
        </div>
    );
};

export default PatientVitalsBadgeList;

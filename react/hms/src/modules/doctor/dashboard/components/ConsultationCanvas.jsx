/**
 * ConsultationCanvas.jsx — Main right-panel when a patient is selected
 * Contains: VitalsWidget, HistoryTimeline, Diagnosis+Prescription form, LabOrderPanel
 */
import React, { useState, useEffect } from 'react';
import VitalsWidget from './VitalsWidget';
import HistoryTimeline from './HistoryTimeline';
import LabOrderPanel from './LabOrderPanel';
import SkeletonLoader from './SkeletonLoader';
import { apiGet, apiPost } from '../../../../services/apiService';
import { useToast } from './Toast';
import './ConsultationCanvas.css';

const MEDICINE_SUGGESTIONS = [
    'Paracetamol 500mg', 'Amoxicillin 250mg', 'Ibuprofen 400mg',
    'Metformin 500mg', 'Atorvastatin 10mg', 'Amlodipine 5mg',
    'Omeprazole 20mg', 'Azithromycin 500mg', 'Cetirizine 10mg',
    'Pantoprazole 40mg', 'Metronidazole 400mg', 'Ciprofloxacin 500mg',
];

const ConsultationCanvas = ({ appointment, onConsultationSaved }) => {
    const { showToast } = useToast();
    const [patientData, setPatientData] = useState(null);
    const [loadingPatient, setLoadingPatient] = useState(false);

    // Form state
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatmentPlan, setTreatmentPlan] = useState('');
    const [medicines, setMedicines] = useState([{ name: '', dose: '', duration: '', frequency: '' }]);
    const [notes, setNotes] = useState('');
    const [medicineSuggest, setMedicineSuggest] = useState({ idx: null, query: '' });
    const [submitting, setSubmitting] = useState(false);

    const patientId = appointment?.patientId?._id || appointment?.patientId;

    useEffect(() => {
        if (!patientId) return;
        loadPatient();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const loadPatient = async () => {
        setLoadingPatient(true);
        try {
            const data = await apiGet(`/patients/${patientId}/summary`);
            setPatientData(data?.patient || data);
        } catch (err) {
            // Fallback: try basic patient endpoint
            try {
                const data = await apiGet(`/patients/${patientId}`);
                setPatientData(data?.patient || data);
            } catch {
                showToast('Failed to load patient history.', 'error');
            }
        } finally {
            setLoadingPatient(false);
        }
    };

    const addMedicine = () =>
        setMedicines(prev => [...prev, { name: '', dose: '', duration: '', frequency: '' }]);

    const removeMedicine = (i) =>
        setMedicines(prev => prev.filter((_, idx) => idx !== i));

    const updateMedicine = (i, field, value) =>
        setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

    const handleLabOrder = async ({ orders, note, priority }) => {
        try {
            await apiPost('/pathology/lab-orders', {
                patientId,
                appointmentId: appointment?._id,
                tests: orders.map(o => o.label),
                priority,
                notes: note,
            });
            showToast(`${orders.length} lab test(s) ordered successfully.`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to order lab tests.', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!diagnosis.trim()) { showToast('Please enter a diagnosis.', 'warning'); return; }
        setSubmitting(true);
        try {
            await apiPost('/consultation/submit', {
                patientId,
                appointmentId: appointment?._id,
                chiefComplaint,
                diagnosis,
                treatmentPlan,
                medicines: medicines.filter(m => m.name.trim()),
                notes,
            });
            showToast('Consultation saved successfully!', 'success');
            onConsultationSaved?.();
            // Reset form
            setChiefComplaint(''); setDiagnosis(''); setTreatmentPlan('');
            setMedicines([{ name: '', dose: '', duration: '', frequency: '' }]);
            setNotes('');
        } catch (err) {
            showToast(err.message || 'Failed to save consultation.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const suggestions = medicineSuggest.query
        ? MEDICINE_SUGGESTIONS.filter(s =>
            s.toLowerCase().includes(medicineSuggest.query.toLowerCase()))
        : [];

    if (!appointment) {
        return (
            <div className="canvas-empty">
                <div className="canvas-empty-icon">👈</div>
                <h3>Select a patient from the queue</h3>
                <p>Click any patient in the Active Queue to open the consultation canvas.</p>
            </div>
        );
    }

    const patientName =
        appointment.patientId?.fullName ||
        `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim() ||
        appointment.patientName || 'Patient';

    const vitals = patientData?.vitals
        ? {
            bp: { value: patientData.vitals.bp || '--/--', unit: 'mmHg', trend: 'stable', status: 'normal' },
            spo2: { value: patientData.vitals.spo2 || '--', unit: '%', trend: 'stable', status: patientData.vitals.spo2 < 94 ? 'critical' : 'normal' },
            temp: { value: patientData.vitals.temp || '--', unit: '°C', trend: 'stable', status: patientData.vitals.temp > 38.5 ? 'warning' : 'normal' },
            weight: { value: patientData.vitals.weightKg || '--', unit: 'kg', trend: 'stable', status: 'normal' },
            recordedAt: patientData.vitals.updatedAt,
        }
        : {};

    const history = patientData?.prescriptions?.map(p => ({
        _id: p._id,
        date: p.issuedAt,
        type: 'Consultation',
        diagnosis: p.notes,
        prescription: p.medicines?.map(m => m.name).join(', '),
    })) || [];

    return (
        <div className="flex flex-col h-full bg-slate-50/50 rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
            {/* ── Patient Banner ── */}
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white shrink-0">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold shadow-inner">
                        {patientName.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div>
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            {patientName}
                            {patientData?.bloodGroup && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md">
                                    {patientData.bloodGroup}
                                </span>
                            )}
                        </h2>

                        <div className="flex items-center gap-2 text-sm text-slate-300 mt-1 font-medium">
                            {patientData?.patientCode && <span>#{patientData.patientCode}</span>}
                            {patientData?.age && (
                                <>
                                    <span className="opacity-40">•</span>
                                    <span>{patientData.age} yrs</span>
                                </>
                            )}
                            {patientData?.gender && (
                                <>
                                    <span className="opacity-40">•</span>
                                    <span>{patientData.gender}</span>
                                </>
                            )}
                        </div>

                        {patientData?.allergies?.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 w-fit">
                                <span className="text-amber-400">⚠️ Allergies:</span> {patientData.allergies.join(', ')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status/Time Right Info */}
                <div className="flex flex-col items-end gap-1.5 hidden sm:flex">
                    <span className="text-[11px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-slate-200">
                        {appointment.appointmentType || 'Consultation'}
                    </span>
                    <span className="text-2xl font-extrabold tracking-tighter">
                        {appointment.startAt ? new Date(appointment.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                </div>
            </div>

            {/* ── Three-Panel Canvas Body ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* Panel 1 (Left): Vitals & Context (approx 25%) */}
                <div className="w-[30%] min-w-[280px] border-r border-slate-200 bg-slate-50/50 overflow-y-auto p-5 space-y-6">
                    {loadingPatient ? (
                        <div className="space-y-4">
                            <SkeletonLoader variant="vitals" />
                            <SkeletonLoader variant="text" lines={6} />
                        </div>
                    ) : (
                        <>
                            <VitalsWidget vitals={vitals} />
                            <div className="h-px bg-slate-200/60 w-full" />
                            <HistoryTimeline history={history} />
                        </>
                    )}
                </div>

                {/* Panel 2 (Middle): Workspace Form (approx 45%) */}
                <div className="flex-1 border-r border-slate-200 bg-white overflow-y-auto p-6 lg:p-8">
                    <form id="consultation-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">

                        <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-lg">📝</span>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Clinical Notes</h3>
                        </div>

                        {/* Chief Complaint */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Chief Complaint</label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all"
                                placeholder="e.g. Persistent fever for 3 days..."
                                value={chiefComplaint}
                                onChange={e => setChiefComplaint(e.target.value)}
                            />
                        </div>

                        {/* Diagnosis */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Diagnosis <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all min-h-[100px] resize-y"
                                placeholder="Enter primary diagnosis..."
                                value={diagnosis}
                                onChange={e => setDiagnosis(e.target.value)}
                                required
                            />
                        </div>

                        {/* Treatment Plan */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Treatment Plan</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all min-h-[100px] resize-y"
                                placeholder="e.g. Rest, hydration, follow up in 3 days..."
                                value={treatmentPlan}
                                onChange={e => setTreatmentPlan(e.target.value)}
                            />
                        </div>

                        {/* Doctor's Private Notes */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Doctor's Private Notes</label>
                            <textarea
                                className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-sm font-medium text-slate-800 placeholder:text-amber-700/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-amber-50 transition-all min-h-[80px] resize-y"
                                placeholder="Personal remarks (not visible to patient)..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                    </form>
                </div>

                {/* Panel 3 (Right): Rx & Labs "Cart" (approx 30%) */}
                <div className="w-[32%] min-w-[320px] bg-slate-50/30 overflow-y-auto p-5 flex flex-col gap-6">

                    {/* Prescriptions Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h4 className="text-[13px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <span className="text-primary-600">💊</span> Prescriptions
                            </h4>
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                                {medicines.filter(m => m.name.trim()).length} Items
                            </span>
                        </div>

                        <div className="p-4 space-y-3">
                            {medicines.map((med, i) => (
                                <div key={i} className="group relative bg-slate-50 border border-slate-200 rounded-xl p-3 transition-colors hover:border-primary-300">
                                    {/* Action row */}
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="flex-1 relative">
                                            <input
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                                                placeholder="Medicine Name..."
                                                value={med.name}
                                                onChange={e => {
                                                    updateMedicine(i, 'name', e.target.value);
                                                    setMedicineSuggest({ idx: i, query: e.target.value });
                                                }}
                                                onBlur={() => setTimeout(() => setMedicineSuggest({ idx: null, query: '' }), 200)}
                                            />
                                            {/* Autocomplete */}
                                            {medicineSuggest.idx === i && suggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-primary-500 rounded-lg shadow-lg z-50 overflow-hidden">
                                                    {suggestions.slice(0, 5).map(s => (
                                                        <div
                                                            key={s}
                                                            className="px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 cursor-pointer font-medium"
                                                            onMouseDown={() => {
                                                                updateMedicine(i, 'name', s);
                                                                setMedicineSuggest({ idx: null, query: '' });
                                                            }}
                                                        >
                                                            {s}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {medicines.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMedicine(i)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors shrink-0"
                                                title="Remove Medicine"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {/* Dosage Details */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-400 placeholder:text-slate-400"
                                            placeholder="Dose (e.g. 500mg)"
                                            value={med.dose}
                                            onChange={e => updateMedicine(i, 'dose', e.target.value)}
                                        />
                                        <input
                                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-400 placeholder:text-slate-400"
                                            placeholder="Freq (e.g. 1-0-1)"
                                            value={med.frequency}
                                            onChange={e => updateMedicine(i, 'frequency', e.target.value)}
                                        />
                                        <input
                                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[12px] font-medium text-slate-700 focus:outline-none focus:border-primary-400 placeholder:text-slate-400"
                                            placeholder="Duration (e.g. 5 Days)"
                                            value={med.duration}
                                            onChange={e => updateMedicine(i, 'duration', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addMedicine}
                                className="w-full py-2.5 border-2 border-dashed border-primary-200 text-primary-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary-50 hover:border-primary-300 transition-colors"
                            >
                                + Add Medicine
                            </button>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-auto shrink-0 flex flex-col gap-3">
                        <button
                            type="submit"
                            form="consultation-form"
                            disabled={submitting}
                            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                        >
                            {submitting ? (
                                <span className="animate-pulse">Saving Record...</span>
                            ) : (
                                <>
                                    <span className="text-lg">✅</span> Finalize Consultation
                                </>
                            )}
                        </button>

                        {/* Optional Lab Order triggers can go here */}
                        <LabOrderPanel onSubmit={handleLabOrder} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ConsultationCanvas;

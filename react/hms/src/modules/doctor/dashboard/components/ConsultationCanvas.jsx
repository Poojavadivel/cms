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
    const [medicines, setMedicines] = useState([{ name: '', dose: '', unit: '', frequency: '', duration: '' }]);
    const [notes, setNotes] = useState('');
    const [medicineSuggest, setMedicineSuggest] = useState({ idx: null, query: '' });
    const [submitting, setSubmitting] = useState(false);
    const [rxErrors, setRxErrors] = useState({}); // { idx: { field: 'message' } }
    const [rxTouched, setRxTouched] = useState(false); // true after first submit attempt

    // Medical constants
    const DOSE_UNITS = ['mg', 'ml', 'g', 'mcg', 'IU', 'drops', 'puffs', 'units'];
    const FREQUENCIES = [
        { value: '', label: 'Select...' },
        { value: 'OD', label: 'OD – Once daily' },
        { value: 'BD', label: 'BD – Twice daily' },
        { value: 'TDS', label: 'TDS – Thrice daily' },
        { value: 'QDS', label: 'QDS – Four times daily' },
        { value: '1-0-1', label: '1-0-1 – Morning & Night' },
        { value: '1-1-1', label: '1-1-1 – Three times' },
        { value: '1-0-0', label: '1-0-0 – Morning only' },
        { value: '0-0-1', label: '0-0-1 – Night only' },
        { value: 'SOS', label: 'SOS – As needed' },
        { value: 'PRN', label: 'PRN – When required' },
        { value: 'HS', label: 'HS – At bedtime' },
        { value: 'STAT', label: 'STAT – Immediately' },
    ];

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
        setMedicines(prev => [...prev, { name: '', dose: '', unit: '', frequency: '', duration: '' }]);

    const removeMedicine = (i) => {
        setMedicines(prev => prev.filter((_, idx) => idx !== i));
        setRxErrors(prev => { const next = { ...prev }; delete next[i]; return next; });
    };

    const updateMedicine = (i, field, value) => {
        setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
        // Clear error for this field if it was showing
        if (rxTouched) {
            setRxErrors(prev => {
                const next = { ...prev };
                if (next[i]) { delete next[i][field]; if (Object.keys(next[i]).length === 0) delete next[i]; }
                return next;
            });
        }
    };

    /**
     * Validates all medicines that have at least a name filled in.
     * Returns { isValid, errors: { [idx]: { field: message } } }
     */
    const validatePrescriptions = () => {
        const errors = {};
        medicines.forEach((med, i) => {
            // Skip completely empty rows
            if (!med.name.trim() && !med.dose && !med.unit && !med.frequency) return;

            const rowErrors = {};
            if (!med.name.trim()) rowErrors.name = 'Drug name is required';
            if (!med.dose || isNaN(Number(med.dose)) || Number(med.dose) <= 0) rowErrors.dose = 'Valid dosage number required';
            if (!med.unit) rowErrors.unit = 'Select a unit (mg, ml, etc.)';
            if (!med.frequency) rowErrors.frequency = 'Select frequency';
            if (!med.duration?.trim()) rowErrors.duration = 'Duration required';

            if (Object.keys(rowErrors).length > 0) errors[i] = rowErrors;
        });
        return { isValid: Object.keys(errors).length === 0, errors };
    };

    // Compute form validity for submit button state
    const filledMedicines = medicines.filter(m => m.name.trim());
    const { isValid: rxValid } = filledMedicines.length > 0 ? validatePrescriptions() : { isValid: true };
    const formValid = diagnosis.trim() && rxValid;

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

        // Validate prescriptions
        setRxTouched(true);
        const { isValid, errors } = validatePrescriptions();
        if (!isValid) {
            setRxErrors(errors);
            showToast('Please fix prescription errors before saving.', 'warning');
            return;
        }
        setRxErrors({});

        setSubmitting(true);
        try {
            // Combine dose + unit into a single string for the API
            const formattedMedicines = medicines
                .filter(m => m.name.trim())
                .map(m => ({
                    name: m.name,
                    dose: `${m.dose}${m.unit}`,
                    frequency: m.frequency,
                    duration: m.duration,
                }));

            await apiPost('/consultation/submit', {
                patientId,
                appointmentId: appointment?._id,
                chiefComplaint,
                diagnosis,
                treatmentPlan,
                medicines: formattedMedicines,
                notes,
            });
            showToast('Consultation saved successfully!', 'success');
            onConsultationSaved?.();
            // Reset form
            setChiefComplaint(''); setDiagnosis(''); setTreatmentPlan('');
            setMedicines([{ name: '', dose: '', unit: '', frequency: '', duration: '' }]);
            setNotes(''); setRxErrors({}); setRxTouched(false);
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

    // Robust extraction: Vitals may be nested in `patientData.vitals` or directly on `patientData`
    const vitals = patientData
        ? {
            bp: {
                value: patientData.vitals?.bp || patientData.bp || patientData.bloodPressure || '--/--',
                unit: 'mmHg', trend: 'stable', status: 'normal'
            },
            spo2: {
                value: patientData.vitals?.spo2 || patientData.oxygen || patientData.spo2 || '--',
                unit: '%', trend: 'stable',
                status: (parseFloat(patientData.vitals?.spo2 || patientData.oxygen || patientData.spo2) < 94) ? 'critical' : 'normal'
            },
            temp: {
                value: patientData.vitals?.temp || patientData.temperature || '--',
                unit: '°C', trend: 'stable',
                status: (parseFloat(patientData.vitals?.temp || patientData.temperature) > 38.5) ? 'warning' : 'normal'
            },
            weight: {
                value: patientData.vitals?.weightKg || patientData.weightKg || patientData.weight || '--',
                unit: 'kg', trend: 'stable', status: 'normal'
            },
            recordedAt: patientData.vitals?.updatedAt || patientData.updatedAt || new Date().toISOString(),
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

            {/* ── Main Workspace Body ── */}
            <div className="flex flex-col flex-1 w-full overflow-y-auto p-4 lg:p-6 bg-slate-50/50">

                {/* Row 2: Vitals & Context */}
                <div className="w-full mb-6 relative">
                    {loadingPatient ? (
                        <div className="space-y-4">
                            <SkeletonLoader variant="vitals" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <VitalsWidget vitals={vitals} />
                            {/* History Timeline optionally spans below or can be compressed */}
                            {history.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <span className="text-primary-500">⏳</span> Patient History
                                    </h4>
                                    <HistoryTimeline history={history} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Row 3: Split View (Notes & Prescriptions) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full pb-8">

                    {/* Left Column: Clinical Notes */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-full">
                        <form id="consultation-form" onSubmit={handleSubmit} className="space-y-4 w-full flex-1">
                            <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-lg">📝</span>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Clinical Notes</h3>
                            </div>

                            <div className="space-y-4 w-full">
                                {/* Chief Complaint */}
                                <div className="space-y-1.5 w-full">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Chief Complaint</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all"
                                        placeholder="e.g. Persistent fever for 3 days..."
                                        value={chiefComplaint}
                                        onChange={e => setChiefComplaint(e.target.value)}
                                    />
                                </div>

                                {/* Diagnosis */}
                                <div className="space-y-1.5 w-full">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
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
                                <div className="space-y-1.5 w-full">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Treatment Plan</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all min-h-[100px] resize-y"
                                        placeholder="e.g. Rest, hydration, follow up in 3 days..."
                                        value={treatmentPlan}
                                        onChange={e => setTreatmentPlan(e.target.value)}
                                    />
                                </div>

                                {/* Doctor's Private Notes */}
                                <div className="space-y-1.5 w-full">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Doctor's Private Notes</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-sm font-medium text-slate-800 placeholder:text-amber-700/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-amber-50 transition-all min-h-[80px] resize-y"
                                        placeholder="Personal remarks (not visible to patient)..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Rx & Labs */}
                    <div className="flex flex-col gap-6 h-full">

                        {/* Prescriptions Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h4 className="text-[13px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                    <span className="text-primary-600">💊</span> Prescriptions
                                </h4>
                                <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                                    {medicines.filter(m => m.name.trim()).length} Items
                                </span>
                            </div>

                            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                {medicines.map((med, i) => {
                                    const err = rxErrors[i] || {};
                                    const hasErr = Object.keys(err).length > 0;
                                    return (
                                        <div key={i} className={`group relative border rounded-xl p-4 transition-colors ${hasErr ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50 border-slate-200 hover:border-primary-300'}`}>
                                            {/* Medicine Name row */}
                                            <div className="flex items-start gap-2 mb-3">
                                                <div className="flex-1 relative w-full">
                                                    <input
                                                        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${err.name ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/20'}`}
                                                        placeholder="Medicine Name *"
                                                        value={med.name}
                                                        onChange={e => {
                                                            updateMedicine(i, 'name', e.target.value);
                                                            setMedicineSuggest({ idx: i, query: e.target.value });
                                                        }}
                                                        onBlur={() => setTimeout(() => setMedicineSuggest({ idx: null, query: '' }), 200)}
                                                    />
                                                    {err.name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{err.name}</p>}
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
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-100 hover:border-rose-200 hover:text-rose-600 transition-colors shrink-0"
                                                        title="Remove Medicine"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>

                                            {/* Dose + Unit + Frequency + Duration (4-col Grid) */}
                                            <div className="grid grid-cols-4 gap-2 w-full">
                                                <div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 placeholder:text-slate-400 ${err.dose ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-primary-400 focus:ring-primary-500/20'}`}
                                                        placeholder="Dose *"
                                                        value={med.dose}
                                                        onChange={e => updateMedicine(i, 'dose', e.target.value)}
                                                    />
                                                    {err.dose && <p className="text-[9px] text-rose-500 font-bold mt-0.5">{err.dose}</p>}
                                                </div>

                                                <div>
                                                    <select
                                                        className={`w-full px-2 py-2 bg-white border rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 appearance-none cursor-pointer ${err.unit ? 'border-rose-400 focus:border-rose-500 text-rose-700 focus:ring-rose-500/20' : 'border-slate-200 focus:border-primary-400 focus:ring-primary-500/20'}`}
                                                        value={med.unit}
                                                        onChange={e => updateMedicine(i, 'unit', e.target.value)}
                                                    >
                                                        <option value="">Unit *</option>
                                                        {DOSE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                    </select>
                                                    {err.unit && <p className="text-[9px] text-rose-500 font-bold mt-0.5">{err.unit}</p>}
                                                </div>

                                                <div>
                                                    <select
                                                        className={`w-full px-2 py-2 bg-white border rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 appearance-none cursor-pointer ${err.frequency ? 'border-rose-400 focus:border-rose-500 text-rose-700 focus:ring-rose-500/20' : 'border-slate-200 focus:border-primary-400 focus:ring-primary-500/20'}`}
                                                        value={med.frequency}
                                                        onChange={e => updateMedicine(i, 'frequency', e.target.value)}
                                                    >
                                                        {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                    </select>
                                                    {err.frequency && <p className="text-[9px] text-rose-500 font-bold mt-0.5">{err.frequency}</p>}
                                                </div>

                                                <div>
                                                    <input
                                                        className={`w-full px-3 py-2 bg-white border rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 placeholder:text-slate-400 ${err.duration ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-primary-400 focus:ring-primary-500/20'}`}
                                                        placeholder="e.g. 5 Days *"
                                                        value={med.duration}
                                                        onChange={e => updateMedicine(i, 'duration', e.target.value)}
                                                    />
                                                    {err.duration && <p className="text-[9px] text-rose-500 font-bold mt-0.5">{err.duration}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={addMedicine}
                                    className="w-full py-3 border-2 border-dashed border-primary-200 text-primary-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary-50 hover:border-primary-300 transition-colors"
                                >
                                    + Add Medicine
                                </button>
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-auto shrink-0 flex flex-col gap-4 w-full">
                            <button
                                type="submit"
                                form="consultation-form"
                                disabled={submitting || !formValid}
                                className={`w-full font-bold py-4 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group ${!formValid
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-lg'
                                    }`}
                            >
                                {submitting ? (
                                    <span className="animate-pulse">Saving Record...</span>
                                ) : !formValid ? (
                                    <><span className="text-lg">⚠️</span> Complete Required Fields</>
                                ) : (
                                    <><span className="text-lg">✅</span> Finalize Consultation</>
                                )}
                            </button>

                            {/* Optional Lab Order triggers can go here */}
                            <LabOrderPanel onSubmit={handleLabOrder} />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultationCanvas;

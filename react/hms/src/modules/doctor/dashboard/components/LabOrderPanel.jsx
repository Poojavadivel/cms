/**
 * LabOrderPanel.jsx — Quick checklist to order common lab tests
 */
import React, { useState } from 'react';
import './LabOrderPanel.css';

const COMMON_TESTS = [
    { id: 'cbc', label: 'CBC', category: 'Haematology', icon: '🩸' },
    { id: 'bmp', label: 'BMP (Blood Panel)', category: 'Biochemistry', icon: '🧪' },
    { id: 'lft', label: 'LFT', category: 'Biochemistry', icon: '🧪' },
    { id: 'rft', label: 'RFT / KFT', category: 'Biochemistry', icon: '🧪' },
    { id: 'lipid', label: 'Lipid Profile', category: 'Biochemistry', icon: '🧪' },
    { id: 'tft', label: 'Thyroid (T3/T4/TSH)', category: 'Endocrine', icon: '🧬' },
    { id: 'hba1c', label: 'HbA1c', category: 'Diabetes', icon: '🩸' },
    { id: 'urine', label: 'Urine R&M', category: 'Urology', icon: '💛' },
    { id: 'xray_chest', label: 'X-Ray (Chest)', category: 'Imaging', icon: '📷' },
    { id: 'xray_ap', label: 'X-Ray (AP/Lateral)', category: 'Imaging', icon: '📷' },
    { id: 'ecg', label: 'ECG', category: 'Cardiac', icon: '❤️' },
    { id: 'echo', label: 'ECHO', category: 'Cardiac', icon: '❤️' },
    { id: 'usg_abd', label: 'USG Abdomen', category: 'Imaging', icon: '🔊' },
    { id: 'ct_head', label: 'CT Head', category: 'Imaging', icon: '🧠' },
    { id: 'culture', label: 'Blood Culture', category: 'Microbiology', icon: '🦠' },
];

const LabOrderPanel = ({ onSubmit }) => {
    const [selected, setSelected] = useState(new Set());
    const [note, setNote] = useState('');
    const [priority, setPriority] = useState('Routine');
    const [submitting, setSubmitting] = useState(false);

    const toggle = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!selected.size) return;
        setSubmitting(true);
        const orders = COMMON_TESTS.filter(t => selected.has(t.id));
        try {
            await onSubmit?.({ orders, note, priority });
        } finally {
            setSubmitting(false);
        }
    };

    // Group by category
    const categories = [...new Set(COMMON_TESTS.map(t => t.category))];

    return (
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center mb-1 pb-3 border-b border-slate-100">
                <span className="text-sm font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
                    <span className="text-primary-600">🔬</span> Lab Orders
                </span>
                <div className="flex gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                    {['Routine', 'Urgent', 'STAT'].map(p => (
                        <button
                            key={p}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${priority === p
                                    ? p === 'Routine' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                                        p === 'Urgent' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' :
                                            'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                                }`}
                            onClick={() => setPriority(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => (
                    <div key={cat} className="flex flex-col gap-2">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">{cat}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                            {COMMON_TESTS.filter(t => t.category === cat).map(test => (
                                <button
                                    key={test.id}
                                    className={`flex items-center gap-3 w-full p-2.5 border rounded-xl text-left text-xs font-semibold transition-all group ${selected.has(test.id)
                                            ? 'bg-primary-50 border-primary-300 text-primary-800 ring-1 ring-primary-500/20 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary-200 hover:bg-slate-50'
                                        }`}
                                    onClick={() => toggle(test.id)}
                                    title={test.label}
                                >
                                    <span className="text-sm shrink-0">{test.icon}</span>
                                    <span className="flex-1 truncate">{test.label}</span>
                                    {selected.has(test.id) && (
                                        <span className="text-[10px] font-black text-primary-600 shrink-0">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-4 mt-auto">
                <input
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-slate-50 transition-all focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10 placeholder-slate-400"
                    type="text"
                    placeholder="Additional clinical notes for lab (optional)..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />

                <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500">
                        {selected.size > 0 ? `${selected.size} test${selected.size > 1 ? 's' : ''} selected` : 'No tests selected'}
                    </span>
                    <button
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${!selected.size || submitting
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5 shadow-primary-600/20'
                            }`}
                        onClick={handleSubmit}
                        disabled={!selected.size || submitting}
                    >
                        {submitting ? 'Ordering...' : `Order ${selected.size > 0 ? selected.size : ''} Test${selected.size !== 1 && selected.size !== 0 ? 's' : ''}`}
                        {!submitting && selected.size > 0 && <span>→</span>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabOrderPanel;

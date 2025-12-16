/**
 * AppointmentPreviewDialog.jsx
 * Premium Enterprise Dashboard 2025
 * Features: Fixed Header, Split Layout, Asset Integration, Real Data, Viewport Corner Floating Action
 */

import React, { useState, useEffect } from 'react';
import {
    MdClose, MdPerson, MdHistory, MdMedicalServices,
    MdDescription, MdScience, MdPayment, MdHeight,
    MdMonitorWeight, MdScale, MdMonitorHeart,
    MdPhone, MdEmail, MdLocationOn, MdWarning, MdEditNote, MdContentCopy,
    MdSecurity, MdWork
} from 'react-icons/md';

// Asset Imports
import boyIcon from '../../assets/boyicon.png';
import girlIcon from '../../assets/girlicon.png';

import patientsService from '../../services/patientsService';
import { fetchPrescriptions, fetchLabReports, fetchMedicalHistory } from '../../services/prescriptionService';
import './AppointmentPreviewDialog.css';

const AppointmentPreviewDialog = ({ patient, isOpen, onClose, showBillingTab = true }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [currentPatient, setCurrentPatient] = useState(patient);

    const f = (val, suffix = '') => (val || val === 0 ? `${val}${suffix}` : '—');

    const getAvatarSrc = (p) => {
        if (p?.avatar) return p.avatar;
        const gender = p?.gender?.toLowerCase() || '';
        if (gender.startsWith('f') || gender.includes('girl')) return girlIcon;
        return boyIcon;
    };

    useEffect(() => {
        if (isOpen && patient) {
            setCurrentPatient(patient);
            refreshPatientData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, patient]);

    const refreshPatientData = async () => {
        if (!patient?.patientId) return;
        try {
            const freshData = await patientsService.fetchPatientById(patient.patientId);
            setCurrentPatient(freshData);
        } catch (error) { /* silent */ }
    };

    if (!isOpen || !currentPatient) return null;

    const navItems = [
        { id: 'profile', label: 'Overview', icon: <MdPerson /> },
        { id: 'history', label: 'Medical History', icon: <MdHistory /> },
        { id: 'prescriptions', label: 'Prescriptions', icon: <MdDescription /> },
        { id: 'lab', label: 'Lab Results', icon: <MdScience /> },
        ...(showBillingTab ? [{ id: 'billing', label: 'Billing', icon: <MdPayment /> }] : [])
    ];

    return (
        <div className="appointment-preview-overlay" onClick={onClose}>

            {/* --- FLOATING CLOSE BUTTON (OUTSIDE DIALOG) --- */}
            <button className="btn-close-floating" onClick={onClose} title="Close Dialog">
                <MdClose size={28} />
            </button>

            {/* --- DIALOG CONTENT --- */}
            <div className="appointment-preview-dialog" onClick={e => e.stopPropagation()}>

                {/* --- FIXED TOP HEADER --- */}
                <div className="pd-header">
                    {/* Identity */}
                    <div className="pd-identity">
                        <img
                            src={getAvatarSrc(currentPatient)}
                            alt="Profile"
                            className="pd-avatar-img"
                            onError={(e) => { e.target.src = boyIcon; }}
                        />
                        <div className="pd-info">
                            <h1>{currentPatient.name || currentPatient.clientName || 'Unknown Patient'}</h1>

                            {/* Row 1: Patient ID */}
                            <div className="pd-chips-row">
                                <span className="pd-pill id">{currentPatient.patientId || 'NO ID'}</span>
                            </div>

                            {/* Row 2: Demographics */}
                            <div className="pd-chips-row">
                                <span className="pd-pill">{currentPatient.gender || 'Unknown'}</span>
                                <span className="pd-pill">{currentPatient.age ? `${currentPatient.age} Yrs` : 'Age N/A'}</span>
                                <span className="pd-pill">{currentPatient.bloodGroup || 'Blood N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="pd-vitals-container">
                        <VitalCard type="height" icon={<MdHeight />} label="Height" value={f(currentPatient.height, ' cm')} />
                        <VitalCard type="weight" icon={<MdMonitorWeight />} label="Weight" value={f(currentPatient.weight, ' kg')} />
                        <VitalCard type="bmi" icon={<MdScale />} label="BMI" value={f(currentPatient.bmi)} />
                        <VitalCard type="spo2" icon={<MdMonitorHeart />} label="SpO₂" value={f(currentPatient.oxygen, '%')} />
                    </div>
                </div>

                {/* --- BODY CONTAINER --- */}
                <div className="pd-body-container">

                    {/* SIDEBAR */}
                    <div className="pd-sidebar">
                        <div className="pd-sidebar-header">
                            <span className="pd-sidebar-title">PATIENT MENU</span>
                        </div>
                        <div className="pd-nav-menu">
                            {navItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`pd-nav-item ${activeTab === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MAIN CONTENT Area */}
                    <div className="pd-main">
                        <div className="pd-scroll-area">
                            {activeTab === 'profile' && <OverviewTab patient={currentPatient} />}
                            {activeTab === 'history' && <MedicalHistoryTab patient={currentPatient} />}
                            {activeTab === 'prescriptions' && <PrescriptionTab patient={currentPatient} />}
                            {activeTab === 'lab' && <LabResultsTab patient={currentPatient} />}
                            {activeTab === 'billing' && <BillingTab />}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---
const VitalCard = ({ type, icon, label, value }) => (
    <div className={`pd-vital-card ${type}`}>
        <div className="pd-vital-icon">{icon}</div>
        <div className="pd-vital-content">
            <span className="pd-vital-value">{value}</span>
            <span className="pd-vital-label">{label}</span>
        </div>
    </div>
);

// 1. OVERVIEW TAB - Enterprise Bento Grid (3-Column)
const OverviewTab = ({ patient }) => (
    <div className="animate-in h-full flex flex-col">
        <div className="pd-section-title">
            <MdPerson /> Personal Information
        </div>

        <div className="pd-bento-grid-3">

            {/* COL 1: Contact Information */}
            <div className="pd-bento-col">
                <h3 className="pd-bento-title">Contact Details</h3>
                <div className="pd-bento-list">
                    <BentoItem icon={<MdPhone />} label="Phone Number" value={patient.phone || patient.phoneNumber} color="blue" copyable />
                    <BentoItem icon={<MdEmail />} label="Email Address" value={patient.email} color="indigo" copyable />
                    <BentoItem icon={<MdLocationOn />} label="Residential Address" value={[patient.houseNo, patient.street, patient.city, patient.state, patient.pincode].filter(Boolean).join(', ')} color="emerald" />
                </div>
            </div>

            {/* COL 2: Administrative & Social */}
            <div className="pd-bento-col">
                <h3 className="pd-bento-title">Administrative</h3>
                <div className="pd-bento-list">
                    <BentoItem
                        icon={<MdSecurity />}
                        label="Insurance Provider"
                        value={patient.insuranceProvider || 'Private Pay'}
                        color="rose"
                    />
                    <BentoItem
                        icon={<MdDescription />}
                        label="Policy Number"
                        value={patient.insuranceNumber || 'N/A'}
                        color="rose"
                        copyable
                    />
                    <BentoItem
                        icon={<MdWork />}
                        label="Occupation"
                        value={patient.occupation || 'Not Specified'}
                        color="slate"
                    />
                    <BentoItem
                        icon={<MdPerson />}
                        label="Marital Status"
                        value={patient.maritalStatus || 'Single'}
                        color="slate"
                    />
                </div>
            </div>

            {/* COL 3: Clinical Context */}
            <div className="pd-bento-col clinical-col">

                {/* Emergency Card */}
                <div className="pd-bento-subcard emergency">
                    <div className="pd-subcard-header">
                        <div className="pd-icon-box rose"><MdWarning /></div>
                        <div>
                            <span className="pd-subcard-label">Emergency</span>
                            <div className="pd-subcard-value">{patient.emergencyContactName || 'None'}</div>
                        </div>
                    </div>
                    {patient.emergencyContactPhone && <div className="pd-subcard-meta">{patient.emergencyContactPhone}</div>}
                </div>

                {/* Allergies Card */}
                <div className="pd-bento-subcard allergies">
                    <div className="pd-subcard-header">
                        <div className="pd-icon-box orange"><MdMedicalServices /></div>
                        <span className="pd-subcard-label">Allergies</span>
                    </div>
                    <div className="pd-tags-cloud">
                        {patient.allergies?.length ? patient.allergies.map((a, i) => (
                            <span key={i} className="pd-tag alert">{a}</span>
                        )) : <span className="pd-empty-text">No Known Allergies</span>}
                    </div>
                </div>

                {/* Notes Preview */}
                <div className="pd-bento-subcard notes">
                    <div className="pd-subcard-header">
                        <div className="pd-icon-box slate"><MdEditNote /></div>
                        <span className="pd-subcard-label">Notes</span>
                    </div>
                    <div className="pd-notes-content line-clamp-3">
                        {patient.notes || 'No notes available.'}
                    </div>
                </div>

            </div>
        </div>
    </div>
);

const BentoItem = ({ icon, label, value, color, copyable }) => (
    <div className="pd-bento-item">
        <div className={`pd-icon-box ${color}`}>{icon}</div>
        <div className="pd-item-content">
            <span className="pd-item-label">{label}</span>
            <div className="pd-item-value-row">
                <span className="pd-item-value">{value || 'N/A'}</span>
                {copyable && value && (
                    <button className="pd-copy-btn" title="Copy">
                        <MdContentCopy size={12} />
                    </button>
                )}
            </div>
        </div>
    </div>
);

// 2. MEDICAL HISTORY TAB
const MedicalHistoryTab = ({ patient }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (patient?.patientId) {
            fetchMedicalHistory(patient.patientId, 100, 0)
                .then(setHistory).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [patient]);

    if (isLoading) return <div className="pd-empty-state">Loading History...</div>;
    if (!history.length) return <div className="pd-empty-state">No Medical History Found</div>;

    return (
        <div className="animate-in">
            <div className="pd-section-title"><MdHistory /> Medical History Timeline</div>
            <div className="pd-table-container">
                <table className="pd-table">
                    <thead>
                        <tr><th>Condition / Title</th><th>Date Recorded</th><th>Category</th><th width="40%">Notes</th></tr>
                    </thead>
                    <tbody>
                        {history.map((item, i) => (
                            <tr key={i}>
                                <td><strong>{item.title || item.condition || 'Medical Record'}</strong></td>
                                <td>{new Date(item.date || item.createdAt).toLocaleDateString()}</td>
                                <td><span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{item.category || item.type || 'General'}</span></td>
                                <td style={{ color: '#64748b' }}>{item.description || item.notes || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 3. PRESCRIPTIONS TAB
const PrescriptionTab = ({ patient }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (patient?.patientId) {
            fetchPrescriptions(patient.patientId, 100, 0)
                .then(setPrescriptions).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [patient]);

    if (isLoading) return <div className="pd-empty-state">Loading Prescriptions...</div>;
    if (!prescriptions.length) return <div className="pd-empty-state">No Prescriptions Found</div>;

    return (
        <div className="animate-in">
            <div className="pd-section-title"><MdDescription /> Active Prescriptions</div>
            <div className="pd-table-container">
                <table className="pd-table">
                    <thead>
                        <tr><th>Date</th><th>Prescription Details</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        {prescriptions.map((p, i) => (
                            <tr key={i}>
                                <td>{new Date(p.createdAt || p.date).toLocaleDateString()}</td>
                                <td>{p.notes || `Prescription ID: ${p.id || 'N/A'}`}</td>
                                <td>{p.pdfId ? <button className="text-blue-600 font-bold hover:underline">View PDF</button> : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 4. LAB RESULTS TAB
const LabResultsTab = ({ patient }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (patient?.patientId) {
            fetchLabReports(patient.patientId, 100, 0)
                .then(setReports).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [patient]);

    if (isLoading) return <div className="pd-empty-state">Loading Reports...</div>;
    if (!reports.length) return <div className="pd-empty-state">No Lab Reports Found</div>;

    return (
        <div className="animate-in">
            <div className="pd-section-title"><MdScience /> Lab Results</div>
            <div className="pd-table-container">
                <table className="pd-table">
                    <thead><tr><th>Test Name</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                        {reports.map((r, i) => (
                            <tr key={i}>
                                <td><strong>{r.testName || r.name}</strong></td>
                                <td>{new Date(r.createdAt || r.date).toLocaleDateString()}</td>
                                <td><span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Completed</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BillingTab = () => (
    <div className="pd-empty-state">
        <MdPayment size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
        <h3>No Invoices Generated</h3>
    </div>
);

export default AppointmentPreviewDialog;

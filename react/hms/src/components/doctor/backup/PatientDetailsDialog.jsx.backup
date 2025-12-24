/**
 * PatientDetailsDialog.jsx
 * Premium Dashboard Layout 2025
 * Sidebar Nav + Persistent Premium Header
 */

import React, { useState } from 'react';
import {
    MdClose, MdPerson, MdHistory, MdMedicalServices,
    MdDescription, MdScience, MdPayment, MdHeight,
    MdMonitorWeight, MdScale, MdMonitorHeart, MdEventNote
} from 'react-icons/md';
import FollowUpDialog from './FollowUpDialog';
import './PatientDetailsDialog.css';

const PatientDetailsDialog = ({ patient, isOpen, onClose, showBillingTab = false }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);

    if (!isOpen || !patient) return null;

    // Helpers
    const f = (val, suffix = '') => (val || val === 0 ? `${val}${suffix}` : '—');
    const getGenderIcon = (g) => (g?.toLowerCase()?.startsWith('f') ? '👩' : '👨');

    // Navigation Items
    const navItems = [
        { id: 'profile', label: 'Profile Overview', icon: <MdPerson /> },
        { id: 'history', label: 'Medical History', icon: <MdHistory /> },
        { id: 'prescriptions', label: 'Prescriptions', icon: <MdDescription /> },
        { id: 'lab', label: 'Lab Results', icon: <MdScience /> },
        ...(showBillingTab ? [{ id: 'billing', label: 'Billing & Invoices', icon: <MdPayment /> }] : [])
    ];

    return (
        <div className="patient-modal-overlay" onClick={onClose}>
            <div className="patient-modal-content" onClick={e => e.stopPropagation()}>

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

                {/* MAIN CONTENT */}
                <div className="pd-main">

                    {/* Close Button */}
                    <button className="btn-close-abs" onClick={onClose}>
                        <MdClose size={20} />
                    </button>

                    {/* Follow-Up Button */}
                    <button 
                        className="btn-followup-abs" 
                        onClick={() => setShowFollowUpDialog(true)}
                        title="Schedule Follow-Up"
                    >
                        <MdEventNote size={20} />
                        <span>Follow-Up</span>
                    </button>

                    {/* PERSISTENT HEADER (Identity + Vitals) */}
                    <div className="pd-header">
                        <div className="pd-identity">
                            {patient.avatar ? (
                                <img src={patient.avatar} alt="Avatar" className="pd-avatar-img" />
                            ) : (
                                <div className="pd-avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', background: '#eff6ff' }}>
                                    {getGenderIcon(patient.gender)}
                                </div>
                            )}
                            <div className="pd-info">
                                <h1>{patient.name || patient.clientName || 'Unknown'}</h1>
                                <div className="pd-chips">
                                    <span className="pd-pill id">{patient.patientId || 'NO-ID'}</span>
                                    <span className="pd-pill">{patient.gender || 'Gen'}</span>
                                    <span className="pd-pill">{patient.age ? `${patient.age} Yrs` : 'Age'}</span>
                                    <span className="pd-pill">{patient.bloodGroup || 'Blood'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Vitals Grid */}
                        <div className="pd-vitals-container">
                            <VitalCard icon={<MdHeight />} label="Height" value={f(patient.height, ' cm')} />
                            <VitalCard icon={<MdMonitorWeight />} label="Weight" value={f(patient.weight, ' kg')} />
                            <VitalCard icon={<MdScale />} label="BMI" value={f(patient.bmi)} />
                            <VitalCard icon={<MdMonitorHeart />} label="SpO₂" value={f(patient.oxygen, '%')} />
                        </div>
                    </div>

                    {/* SCROLLABLE TAB CONTENT */}
                    <div className="pd-scroll-area">

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="animate-in">
                                <div className="pd-section-title">
                                    <MdPerson className="text-blue-600" /> Personal Information
                                </div>
                                <div className="pd-grid-2">
                                    <div className="pd-card">
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Contact Details</h3>
                                        <div className="pd-field-group">
                                            <label className="pd-label">Phone Number</label>
                                            <div className="pd-value">{patient.phone || patient.phoneNumber || 'N/A'}</div>
                                        </div>
                                        <div className="pd-field-group">
                                            <label className="pd-label">Email Address</label>
                                            <div className="pd-value">{patient.email || 'N/A'}</div>
                                        </div>
                                        <div className="pd-field-group">
                                            <label className="pd-label">Residential Address</label>
                                            <div className="pd-value">
                                                {[patient.houseNo, patient.street, patient.city, patient.state].filter(Boolean).join(', ') || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pd-card">
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Emergency & Allergies</h3>
                                        <div className="pd-field-group">
                                            <label className="pd-label">Emergency Contact</label>
                                            <div className="pd-value">{patient.emergencyContactName || 'N/A'}</div>
                                            <div className="text-xs text-slate-500 mt-1">{patient.emergencyContactPhone}</div>
                                        </div>
                                        <div className="pd-field-group">
                                            <label className="pd-label">Allergies</label>
                                            <div className="pd-value">
                                                {patient.allergies?.length ? (
                                                    <div className="flex gap-2 flex-wrap mt-1">
                                                        {patient.allergies.map((a, i) => (
                                                            <span key={i} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100">
                                                                {a}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : 'No Known Allergies'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {patient.notes && (
                                    <div className="pd-card" style={{ marginTop: '24px' }}>
                                        <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">Clinical Notes</h3>
                                        <p className="text-slate-600 leading-relaxed text-sm">{patient.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MEDICAL HISTORY TAB */}
                        {activeTab === 'history' && (
                            <div className="animate-in">
                                <div className="pd-section-title">
                                    <MdHistory className="text-blue-600" /> Medical History Timeline
                                </div>
                                {patient.medicalHistory?.length > 0 ? (
                                    <div>
                                        {patient.medicalHistory.map((item, i) => (
                                            <div key={i} className="pd-history-item">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState title="No Medical History" />
                                )}
                            </div>
                        )}

                        {/* PRESCRIPTIONS TAB */}
                        {activeTab === 'prescriptions' && (
                            <div className="animate-in">
                                <div className="pd-section-title">
                                    <MdDescription className="text-blue-600" /> Active Prescriptions
                                </div>
                                <EmptyState title="No Active Prescriptions" subtitle="Prescriptions issued by doctors will appear here." />
                            </div>
                        )}

                        {/* LAB TAB */}
                        {activeTab === 'lab' && (
                            <div className="animate-in">
                                <div className="pd-section-title">
                                    <MdScience className="text-blue-600" /> Lab Reports
                                </div>
                                <EmptyState title="No Lab Results" subtitle="Pathology and imaging reports will be listed here." />
                            </div>
                        )}

                        {/* BILLING TAB */}
                        {activeTab === 'billing' && (
                            <div className="animate-in">
                                <div className="pd-section-title">
                                    <MdPayment className="text-blue-600" /> Billing & Payments
                                </div>
                                <EmptyState title="No Invoices Found" />
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Follow-Up Dialog */}
            {showFollowUpDialog && (
                <FollowUpDialog
                    patient={patient}
                    isOpen={showFollowUpDialog}
                    onClose={() => setShowFollowUpDialog(false)}
                    onSuccess={() => {
                        setShowFollowUpDialog(false);
                        // Optional: refresh patient data or show success message
                    }}
                />
            )}
        </div>
    );
};

// Sub-components
const VitalCard = ({ icon, label, value }) => (
    <div className="pd-vital-card">
        <div className="pd-vital-icon">{icon}</div>
        <span className="pd-vital-value">{value}</span>
        <span className="pd-vital-label">{label}</span>
    </div>
);

const EmptyState = ({ title, subtitle }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
            <MdMedicalServices size={32} />
        </div>
        <h3 className="text-slate-600 font-bold text-lg mb-1">{title}</h3>
        <p className="text-slate-400 text-sm max-w-xs">{subtitle || 'No data available for this section yet.'}</p>
    </div>
);

export default PatientDetailsDialog;

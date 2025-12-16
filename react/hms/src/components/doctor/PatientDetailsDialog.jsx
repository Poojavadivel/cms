/**
 * PatientDetailsDialog.jsx
 * Premium Enterprise View for Patient Details
 * Matching StaffDetailEnterprise design system
 */

import React, { useState } from 'react';
import {
    MdClose, MdEdit, MdEmail, MdPhone, MdLocationOn,
    MdMedicalServices, MdHistory, MdPayment, MdWarning,
    MdPerson, MdEventNote
} from 'react-icons/md';
import './PatientDetailsDialog.css';

const PatientDetailsDialog = ({ patient, isOpen, onClose, showBillingTab = false }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!isOpen || !patient) return null;

    // Helper: Format Date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Helper: Get Gender Icon
    const getGenderIcon = (gender) => {
        const g = (gender || '').toLowerCase();
        return g === 'female' || g === 'f' ? '👩' : '👨';
    };

    return (
        <div className="patient-modal-overlay" onClick={onClose}>
            <div className="patient-modal-content" onClick={e => e.stopPropagation()}>

                {/* Floating Close Button */}
                <button className="btn-close-floating" onClick={onClose}>
                    <MdClose size={20} />
                </button>

                {/* HEADER SECTION */}
                <div className="patient-header">
                    <div className="patient-avatar-box">
                        {patient.avatar ? (
                            <img src={patient.avatar} alt="Patient" className="patient-avatar-lg" />
                        ) : (
                            <div className="patient-avatar-placeholder">
                                {getGenderIcon(patient.gender)}
                            </div>
                        )}
                    </div>

                    <div className="header-info-group">
                        <h1 className="patient-name-lg">
                            {patient.name || patient.clientName || 'Unknown Patient'}
                        </h1>
                        <div className="patient-meta-row">
                            <span className="patient-id-badge">
                                {patient.patientId || 'NO-ID'}
                            </span>
                            <span>•</span>
                            <span>{patient.gender || 'Unknown Gender'}</span>
                            <span>•</span>
                            <span>{patient.age ? `${patient.age} Years` : 'Age N/A'}</span>
                        </div>
                    </div>

                    <div className="header-actions">
                        {patient.email && (
                            <button
                                className="btn-header-action secondary"
                                onClick={() => window.location.href = `mailto:${patient.email}`}
                            >
                                <MdEmail size={18} />
                                <span>Email</span>
                            </button>
                        )}
                        <button className="btn-header-action primary">
                            <MdEdit size={18} />
                            <span>Edit Profile</span>
                        </button>
                    </div>
                </div>

                {/* BODY SECTION */}
                <div className="patient-body">
                    {/* Sidebar Navigation */}
                    <div className="patient-sidebar">
                        <div
                            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <MdPerson size={18} /> Overview
                        </div>
                        <div
                            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <MdHistory size={18} /> Medical History
                        </div>
                        {showBillingTab && (
                            <div
                                className={`nav-tab ${activeTab === 'billing' ? 'active' : ''}`}
                                onClick={() => setActiveTab('billing')}
                            >
                                <MdPayment size={18} /> Billing
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="patient-content-area animate-fade-in">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="detail-grid">

                                {/* Contact Info Card */}
                                <div className="info-card">
                                    <div className="card-header">
                                        <MdPhone className="card-icon" />
                                        <span className="card-title">Contact Information</span>
                                    </div>
                                    <div className="data-row">
                                        <div className="info-row">
                                            <span className="label">Phone Number</span>
                                            <span className="value">{patient.phone || patient.phoneNumber || 'N/A'}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">Email Address</span>
                                            <span className="value">{patient.email || 'N/A'}</span>
                                        </div>
                                        <div className="info-row" style={{ marginTop: '8px' }}>
                                            <span className="label">Address</span>
                                            <span className="value" style={{ maxWidth: '60%' }}>
                                                {[
                                                    patient.houseNo, patient.street, patient.city,
                                                    patient.state, patient.pincode
                                                ].filter(Boolean).join(', ') || 'No address provided'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Vitals / Emergency Card */}
                                <div className="info-card">
                                    <div className="card-header">
                                        <MdMedicalServices className="card-icon" />
                                        <span className="card-title">Medical Profile</span>
                                    </div>
                                    <div className="data-row">
                                        <div className="info-row">
                                            <span className="label">Blood Group</span>
                                            <span className="value">{patient.bloodGroup || 'N/A'}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">Allergies</span>
                                            <span className="value" style={{ color: patient.allergies?.length ? '#ef4444' : 'inherit' }}>
                                                {patient.allergies?.length ? patient.allergies.join(', ') : 'None Known'}
                                            </span>
                                        </div>
                                        <div className="info-row" style={{ marginTop: '12px' }}>
                                            <span className="label">Emergency Contact</span>
                                            <span className="value">
                                                {patient.emergencyContactName || 'N/A'}
                                                {patient.emergencyContactPhone && (
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                                        {patient.emergencyContactPhone}
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Card - Full Width */}
                                {patient.notes && (
                                    <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                                        <div className="card-header">
                                            <MdEventNote className="card-icon" />
                                            <span className="card-title">Clinical Notes</span>
                                        </div>
                                        <p className="text-notes">
                                            {patient.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* HISTORY TAB */}
                        {activeTab === 'history' && (
                            <div className="animate-fade-in">
                                {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                                    <div className="detail-grid">
                                        <div className="info-card" style={{ gridColumn: '1 / -1' }}>
                                            <div className="card-header">
                                                <MdHistory className="card-icon" />
                                                <span className="card-title">Medical History Timeline</span>
                                            </div>
                                            <div className="chip-container" style={{ flexDirection: 'column', gap: '12px' }}>
                                                {patient.medicalHistory.map((item, index) => (
                                                    <div key={index} style={{
                                                        padding: '12px',
                                                        background: '#f8fafc',
                                                        borderRadius: '8px',
                                                        borderLeft: '4px solid #3b82f6'
                                                    }}>
                                                        <span style={{ fontWeight: 600, color: '#334155' }}>
                                                            {item}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-tab-state">
                                        <MdHistory size={48} />
                                        <h3>No Medical History</h3>
                                        <p>No history records found for this patient.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* BILLING TAB */}
                        {activeTab === 'billing' && (
                            <div className="empty-tab-state animate-fade-in">
                                <MdPayment size={48} />
                                <h3>Billing Information</h3>
                                <p>Invoices and payment history section coming soon.</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsDialog;

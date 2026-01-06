/**
 * PatientView.jsx
 * Full-screen patient view modal with tabs
 * Redesigned to match specific UI requirements
 */

import React, { useState, useEffect } from 'react';
import {
    MdClose,
    MdEdit,
    MdPerson,
    MdMedicalServices,
    MdDescription,
    MdScience,
    MdPayment,
    MdPhone,
    MdEmail,
    MdLocationOn,
    MdWork,
    MdCalendarToday,
    MdMale,
    MdFemale,
    MdMap,
    MdContentCopy,
    MdSearch,
    MdVisibility,
    MdDelete,
    MdPictureAsPdf,
    MdFilterList
} from 'react-icons/md';
import './patientview.css';
import patientsService from '../../services/patientsService';
import prescriptionService from '../../services/prescriptionService';
import pathologyService from '../../services/pathologyService';
import invoiceService from '../../services/invoiceService';
import { getGenderAvatar } from '../../utils/avatarHelpers';

const PatientView = ({ isOpen, onClose, patientId, onEdit }) => {
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <MdPerson /> },
        { id: 'medical-history', label: 'Medical History', icon: <MdMedicalServices /> },
        { id: 'prescription', label: 'Prescription', icon: <MdDescription /> },
        { id: 'lab-results', label: 'Lab Results', icon: <MdScience /> },
        { id: 'billings', label: 'Billings', icon: <MdPayment /> }
    ];

    useEffect(() => {
        if (isOpen && patientId) {
            fetchPatient();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, patientId]);

    const fetchPatient = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (!patientId) throw new Error("No patient ID provided");
            const patientData = await patientsService.fetchPatientById(patientId);
            setPatient(patientData);
        } catch (err) {
            setError(err.message || 'Failed to load patient details');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const getGenderIcon = (gender) => {
        return gender?.toLowerCase() === 'female' ? <MdFemale size={14} /> : <MdMale size={14} />;
    };

    // Derived Data for Header
    const getPatientData = () => {
        if (!patient) return null;

        const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || 'Unknown Patient';

        let phone = '';
        if (typeof patient.phone === 'object') {
            phone = patient.phone.phone || patient.phone.number || '';
        } else {
            phone = patient.phone || patient.phoneNumber || '';
        }

        let email = '';
        if (typeof patient.email === 'object') {
            email = patient.email.email || patient.email.address || '';
        } else {
            email = patient.email || '';
        }

        let gender = patient.gender || 'Male';

        let location = 'Location not set';
        if (patient.address?.city) {
            location = patient.address.city;
        }

        let occupation = patient.profession || patient.metadata?.profession || 'Not specified';

        let dob = '';
        let age = patient.age || 0;
        if (patient.dateOfBirth) {
            const dobDate = new Date(patient.dateOfBirth);
            dob = dobDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            // re-calc age to be sure
            const today = new Date();
            age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }
        }

        // Vitals
        const weightKg = patient.vitals?.weightKg || patient.weight || null;
        const heightCm = patient.vitals?.heightCm || patient.height || null;
        const bp = patient.vitals?.bp || patient.bp || '—';

        // BMI
        let bmi = null;
        if (weightKg && heightCm) {
            bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
        } else if (patient.vitals?.bmi) {
            bmi = patient.vitals.bmi;
        }

        // Arrays
        const diagnosis = patient.diagnosis || patient.metadata?.diagnosis || [];
        const barriers = patient.barriers || patient.metadata?.barriers || [];

        // Lifestyle
        const noAlcohol = patient.metadata?.noAlcohol === true || patient.metadata?.alcohol === false;
        const noSmoker = patient.metadata?.noSmoker === true || patient.metadata?.smoker === false;

        return {
            name, phone, email, gender, location, occupation, dob, age,
            weightKg, heightCm, bp, bmi,
            diagnosis: Array.isArray(diagnosis) ? diagnosis : [],
            barriers: Array.isArray(barriers) ? barriers : [],
            noAlcohol, noSmoker,
            avatarUrl: patient.avatarUrl || patient.metadata?.avatarUrl
        };
    };

    const patientData = getPatientData();
    const avatarSrc = patient ? (patientData.avatarUrl || getGenderAvatar(patientData.gender)) : '';

    return (
        <div className="patient-view-overlay">
            <button className="patient-close-floating" onClick={onClose}>
                <MdClose size={32} />
            </button>

            <div className="patient-view-container">
                {isLoading ? (
                    <div className="patient-view-loading">
                        <div className="spinner"></div>
                        <p>Loading details...</p>
                    </div>
                ) : error ? (
                    <div className="patient-view-error">
                        <p>{error}</p>
                        <button onClick={onClose} className="btn-error-close">Close</button>
                    </div>
                ) : patient && patientData && (
                    <>
                        {/* 1. FIXED HEADER SECTION */}
                        <div className="pv-summary-header">
                            <div className="pv-header-content">
                                {/* Avatar */}
                                <div className="pv-avatar-section">
                                    <div className="pv-avatar-container">
                                        <img
                                            src={avatarSrc}
                                            alt={patientData.name}
                                            className="pv-avatar-image"
                                            onError={(e) => { e.target.src = getGenderAvatar(patientData.gender); }}
                                        />
                                        <div className="pv-lifestyle-indicators">
                                            {patientData.noAlcohol && (
                                                <div className="pv-lifestyle-badge no-alcohol">
                                                    <span className="pv-lifestyle-label">Alcohol</span>
                                                </div>
                                            )}
                                            {patientData.noSmoker && (
                                                <div className="pv-lifestyle-badge no-smoker">
                                                    <span className="pv-lifestyle-label">Smoker</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="pv-info-section">
                                    <div className="pv-name-row">
                                        <h2 className="pv-name-main">{patientData.name}</h2>
                                        <div className="pv-contact-icons">
                                            {patientData.phone && <button className="pv-contact-btn" title={patientData.phone}><MdPhone size={14} /></button>}
                                            {patientData.email && <button className="pv-contact-btn" title={patientData.email}><MdEmail size={14} /></button>}
                                        </div>
                                    </div>

                                    <div className="pv-info-pills">
                                        <div className="pv-pill">
                                            {getGenderIcon(patientData.gender)} <span>{patientData.gender}</span>
                                        </div>
                                        <div className="pv-pill">
                                            <MdLocationOn size={14} /> <span>{patientData.location}</span>
                                        </div>
                                        <div className="pv-pill">
                                            <MdWork size={14} /> <span>{patientData.occupation}</span>
                                        </div>
                                        {patientData.dob && (
                                            <div className="pv-pill">
                                                <MdCalendarToday size={14} /> <span>{patientData.dob} ({patientData.age} years)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pv-metrics-row">
                                        <div className="pv-metric-card">
                                            <span className="pv-metric-val">{patientData.bmi || '—'}</span>
                                            <span className="pv-metric-lbl">BMI</span>
                                        </div>
                                        <div className="pv-metric-card">
                                            <span className="pv-metric-val">{patientData.weightKg || '—'} <small>kg</small></span>
                                            <span className="pv-metric-lbl">Weight</span>
                                        </div>
                                        <div className="pv-metric-card">
                                            <span className="pv-metric-val">{patientData.heightCm || '—'} <small>Cm</small></span>
                                            <span className="pv-metric-lbl">Height</span>
                                        </div>
                                        <div className="pv-metric-card">
                                            <span className="pv-metric-val">{patientData.bp}</span>
                                            <span className="pv-metric-lbl">Blood Pressure</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Actions */}
                                <div className="pv-header-right">
                                    <button className="pv-edit-btn" onClick={() => onEdit && onEdit(patient)}>
                                        <MdEdit size={14} /> Edit
                                    </button>

                                    {patientData.diagnosis.length > 0 && (
                                        <div className="pv-diagnosis-section">
                                            <span className="pv-sec-label">Own Diagnosis</span>
                                            <div className="pv-tags-row">
                                                {patientData.diagnosis.map((d, i) => <span key={i} className="pv-tag diag">{d}</span>)}
                                            </div>
                                        </div>
                                    )}

                                    {patientData.barriers.length > 0 && (
                                        <div className="pv-barriers-section">
                                            <span className="pv-sec-label">Health Barriers</span>
                                            <div className="pv-tags-row">
                                                {patientData.barriers.map((b, i) => <span key={i} className="pv-tag barrier">{b}</span>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. TAB NAVIGATION (Below Header) */}
                        <div className="patient-tabs-nav-bar">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`patient-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 3. TAB CONTENT (Scrollable) */}
                        <div className="patient-tab-content">
                            {activeTab === 'profile' && <ProfileTab patient={patient} />}
                            {activeTab === 'medical-history' && <MedicalHistoryTab patientId={patientId} />}
                            {activeTab === 'prescription' && <PrescriptionTab patientId={patientId} />}
                            {activeTab === 'lab-results' && <LabResultTab patientId={patientId} />}
                            {activeTab === 'billings' && <BillingsTab patientId={patientId} />}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// --- PROFILE TAB ---
const ProfileTab = ({ patient }) => {
    const address = patient.address || {};

    const copyAddress = () => {
        const fullAddr = `${address.houseNumber || ''} ${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.pincode || ''} ${address.country || ''}`;
        navigator.clipboard.writeText(fullAddr);
    };

    const openMaps = () => {
        const fullAddr = `${address.houseNumber || ''} ${address.street || ''}, ${address.city || ''}`;
        window.open(`https://maps.google.com/?q=${encodeURIComponent(fullAddr)}`, '_blank');
    };

    return (
        <div className="pv-profile-container">
            {/* Address Card */}
            <div className="pv-card">
                <div className="pv-card-header">
                    <div className="pv-icon-circle red"><MdLocationOn /></div>
                    <h3>Address</h3>
                </div>
                <div className="pv-card-body">
                    <div className="pv-info-row">
                        <span className="pv-label">HOUSE NO</span>
                        <span className="pv-value">
                            <strong>{patient.houseNo || patient.address?.houseNo || 'Not Provided'}</strong>
                        </span>

                    </div>
                    <div className="pv-info-row">
                        <span className="pv-label">STREET</span>
                        <span className="pv-value">
                            <strong>{patient.street || patient.address?.street || 'Not Provided'}</strong>
                        </span>

                    </div>
                    <div className="pv-info-row">
                        <span className="pv-label">CITY</span>
                        <span className="pv-value">
                            <strong>{patient.city || patient.address?.city || 'Not Provided'}</strong>
                        </span>


                    </div>
                    <div className="pv-info-row">
                        <span className="pv-label">STATE</span>
                        <span className="pv-value">
                            <strong>{patient.state || patient.address?.state || 'Not Provided'}</strong>
                        </span>

                    </div>
                    <div className="pv-info-row">
                        <span className="pv-label">PINCODE</span>
                        <span className="pv-value">
                            <strong>{patient.pincode || patient.address?.pincode || 'Not Provided'}</strong>
                        </span>

                    </div>
                    <div className="pv-info-row">
                        <span className="pv-label">COUNTRY</span>
                        <span className="pv-value">
                            <strong>{patient.country || patient.address?.country || 'Not Provided'}</strong>
                        </span>

                    </div>

                    <div className="pv-action-buttons">
                        <button className="pv-btn-outline" onClick={copyAddress}>
                            <MdContentCopy size={16} /> Copy
                        </button>
                        <button className="pv-btn-outline" onClick={openMaps}>
                            <MdMap size={16} /> Open in Maps
                        </button>
                        <span className="pv-badge-updated">Updated: Recently</span>
                    </div>
                </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="pv-card">
                <div className="pv-card-header">
                    <div className="pv-icon-circle red"><MdPhone /></div>
                    <h3>Emergency Contact</h3>
                </div>
                <div className="pv-card-body">
                    <div className="pv-info-row">
                        <span className="pv-label">NAME</span>
                        {patient.emergencyContactName || 'No contact on file'}

                    </div>
                    <div className="pv-info-row">
                        <span className="pv-label">PHONE</span>
                        {patient.emergencyContactPhone || 'No phone on file'}

                    </div>

                    <div className="pv-update-badge-container">
                        <span className="pv-badge-updated">Last Updated: Recently</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MEDICAL HISTORY TAB ---
const MedicalHistoryTab = ({ patientId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patientId) {
            fetchHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await patientsService.fetchPatientAppointments(patientId);

            // Map backend fields to UI fields
            // Backend: appointmentDate, appointmentTime, condition, status, notes
            // UI: title, date, category, notes, reason
            const mappedData = (Array.isArray(data) ? data : []).map(apt => ({
                ...apt,
                title: apt.condition || apt.title || apt.reason || 'Medical Checkup',
                date: apt.appointmentDate ? `${apt.appointmentDate} ${apt.appointmentTime || ''}` : apt.date,
                reason: apt.notes || apt.reason || '',
                category: apt.type || 'General',
                status: apt.status || 'Scheduled'
            }));

            setHistoryData(mappedData);
        } catch (error) {
            console.error('Failed to fetch medical history:', error);
            setHistoryData([]);
        } finally {
            setLoading(false);
        }
    };

    // Optional simple search (title / reason)
    const filteredData = historyData.filter(item =>
        (item.reason || item.title || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pv-tab-container">
            {/* Header */}
            <div className="pv-tab-header-row">
                <h3 className="pv-tab-title">MEDICAL HISTORY</h3>
                <div className="pv-actions-right">
                    <button className="pv-btn-icon">
                        <MdFilterList />
                    </button>
                    <div className="pv-search-box">
                        <MdSearch />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="pv-table-container">
                <table className="pv-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Notes</th>
                            <th>Document</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Loading */}
                        {loading && (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    Loading medical history...
                                </td>
                            </tr>
                        )}

                        {/* No Data */}
                        {!loading && filteredData.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    No Records Found
                                </td>
                            </tr>
                        )}

                        {/* Data Rows */}
                        {!loading &&
                            filteredData.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        {item.title || item.reason || 'General Checkup'}
                                    </td>
                                    <td>
                                        {item.date
                                            ? new Date(item.date).toLocaleDateString()
                                            : item.createdAt
                                                ? new Date(item.createdAt).toLocaleDateString()
                                                : '—'}
                                    </td>
                                    <td>
                                        {item.category || item.speciality || 'General'}
                                    </td>
                                    <td className="pv-td-notes">
                                        {item.notes || item.description || '—'}
                                    </td>
                                    <td>
                                        {item.reportStatus === 'completed' && (
                                            <button className="pv-btn-text-icon red">
                                                <MdPictureAsPdf className="icon-red" /> View
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <button className="pv-btn-action-circle">
                                            <MdVisibility />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination (static for now) */}
            <div className="pv-pagination">
                <span>Page 1 of 1</span>
                <div className="pv-page-controls">
                    <button className="pv-page-btn" disabled>&lt;</button>
                    <button className="pv-page-btn" disabled>&gt;</button>
                </div>
            </div>
        </div>
    );
};


// --- PRESCRIPTION TAB ---
const PrescriptionTab = ({ patientId }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patientId) {
            fetchPrescriptionsData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const fetchPrescriptionsData = async () => {
        setLoading(true);
        try {
            const data = await patientsService.fetchPatientPrescriptions(patientId);
            setPrescriptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch prescriptions:', error);
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pv-tab-container">
            {/* Header */}
            <div className="pv-tab-header-row">
                <h3 className="pv-tab-title">PRESCRIPTIONS</h3>
                <div className="pv-actions-right">
                    <button className="pv-btn-icon">
                        <MdFilterList />
                    </button>
                    <div className="pv-search-box">
                        <MdSearch />
                        <input type="text" placeholder="Search..." />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="pv-table-container">
                <table className="pv-table">
                    <thead>
                        <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Instructions</th>
                            <th>Date</th>
                            <th>Document</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Loading */}
                        {loading && (
                            <tr>
                                <td colSpan="8" className="text-center">
                                    Loading prescriptions...
                                </td>
                            </tr>
                        )}

                        {/* No Data */}
                        {!loading && prescriptions.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center">
                                    No Prescriptions Found
                                </td>
                            </tr>
                        )}

                        {/* Data Rows */}
                        {!loading &&
                            prescriptions.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <strong>
                                            {item.medicationName || item.medicine || '—'}
                                        </strong>
                                    </td>
                                    <td>{item.dosage || '—'}</td>
                                    <td>{item.frequency || '—'}</td>
                                    <td>{item.duration || '—'}</td>
                                    <td>{item.instructions || '—'}</td>
                                    <td>
                                        {item.createdAt
                                            ? new Date(item.createdAt).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td>
                                        <button className="pv-btn-text-icon red">
                                            <MdPictureAsPdf className="icon-red" /> View
                                        </button>
                                    </td>
                                    <td>
                                        <button className="pv-btn-action-circle">
                                            <MdVisibility />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination (static as per current design) */}
            <div className="pv-pagination">
                <span>Page 1 of 1</span>
                <div className="pv-page-controls">
                    <button className="pv-page-btn" disabled>&lt;</button>
                    <button className="pv-page-btn" disabled>&gt;</button>
                </div>
            </div>
        </div>
    );
};

// --- LAB RESULTS TAB ---
const LabResultTab = ({ patientId }) => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (patientId) {
            fetchLabResults();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const fetchLabResults = async () => {
        setLoading(true);
        try {
            const data = await patientsService.fetchPatientLabResults(patientId);
            setLabs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch lab results:', error);
            setLabs([]);
        } finally {
            setLoading(false);
        }
    };

    // Simple search by test name
    const filteredLabs = labs.filter(item =>
        (item.testName || item.name || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pv-tab-container">
            {/* Header */}
            <div className="pv-tab-header-row">
                <h3 className="pv-tab-title">LAB RESULTS</h3>
                <div className="pv-actions-right">
                    <button className="pv-btn-icon">
                        <MdFilterList />
                    </button>
                    <div className="pv-search-box">
                        <MdSearch />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="pv-table-container">
                <table className="pv-table">
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Result</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Loading */}
                        {loading && (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    Loading lab results...
                                </td>
                            </tr>
                        )}

                        {/* No Data */}
                        {!loading && filteredLabs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    No Lab Results Found
                                </td>
                            </tr>
                        )}

                        {/* Data Rows */}
                        {!loading &&
                            filteredLabs.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        {item.testName || item.name || '—'}
                                    </td>
                                    <td>
                                        {item.result || item.summary || '—'}
                                    </td>
                                    <td>
                                        {item.date
                                            ? new Date(item.date).toLocaleDateString()
                                            : item.createdAt
                                                ? new Date(item.createdAt).toLocaleDateString()
                                                : '—'}
                                    </td>
                                    <td>
                                        <span
                                            className={`pv-badge status-${(item.status || 'completed').toLowerCase()}`}
                                        >
                                            {item.status || 'Completed'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="pv-btn-action-circle">
                                            <MdVisibility />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination (static – same as other tabs) */}
            <div className="pv-pagination">
                <span>Page 1 of 1</span>
                <div className="pv-page-controls">
                    <button className="pv-page-btn" disabled>&lt;</button>
                    <button className="pv-page-btn" disabled>&gt;</button>
                </div>
            </div>
        </div>
    );
};


// --- BILLINGS TAB ---
const BillingsTab = ({ patientId }) => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (patientId) {
            fetchBills();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            // Use the safe method we added to invoiceService
            const data = await invoiceService.fetchInvoicesByPatient(patientId);
            setBills(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch billing data:', error);
            setBills([]);
        } finally {
            setLoading(false);
        }
    };

    // Simple search (invoice id / description)
    const filteredBills = bills.filter(item =>
        (item.invoiceId || item.invoiceNumber || item.description || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pv-tab-container">
            {/* Header */}
            <div className="pv-tab-header-row">
                <h3 className="pv-tab-title">BILLINGS</h3>
                <div className="pv-actions-right">
                    <button className="pv-btn-icon">
                        <MdFilterList />
                    </button>
                    <div className="pv-search-box">
                        <MdSearch />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="pv-table-container">
                <table className="pv-table">
                    <thead>
                        <tr>
                            <th>Medication</th>
                            <th>Dose</th>
                            <th>Route</th>
                            <th>Frequency</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Loading */}
                        {loading && (
                            <tr>
                                <td colSpan="8" className="text-center">
                                    Loading billings...
                                </td>
                            </tr>
                        )}

                        {/* No Data */}
                        {!loading && filteredBills.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center">
                                    No Billing Records Found
                                </td>
                            </tr>
                        )}

                        {/* Data Rows */}
                        {!loading &&
                            filteredBills.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        {item.invoiceId || item.invoiceNumber || '—'}
                                    </td>
                                    <td>
                                        {item.date
                                            ? new Date(item.date).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td>
                                        {item.amount || '—'}
                                    </td>
                                    <td>
                                        {item.paymentMode || item.mode || '—'}
                                    </td>
                                    <td>
                                        {item.startDate
                                            ? new Date(item.startDate).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td>
                                        {item.description || '—'}
                                    </td>
                                    <td>
                                        <span
                                            className={`pv-badge status-${(item.status || 'paid').toLowerCase()}`}
                                        >
                                            {item.status || 'Paid'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="pv-action-group">
                                            <button className="pv-btn-action-circle">
                                                <MdVisibility />
                                            </button>
                                            <button className="pv-btn-action-circle">
                                                <MdEdit />
                                            </button>
                                            <button className="pv-btn-action-circle red-text">
                                                <MdDelete />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination (static for now) */}
            <div className="pv-pagination">
                <span>Page 1 of 1</span>
                <div className="pv-page-controls">
                    <button className="pv-page-btn" disabled>&lt;</button>
                    <button className="pv-page-btn" disabled>&gt;</button>
                </div>
            </div>
        </div>
    );
};


export default PatientView;

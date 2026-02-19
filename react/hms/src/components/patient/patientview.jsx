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
import reportService from '../../services/reportService';
import { getGenderAvatar } from '../../utils/avatarHelpers';

const PatientView = ({ isOpen, onClose, patientId, patient: patientProp, onEdit, showBillingTab = true }) => {
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <MdPerson /> },
        { id: 'medical-history', label: 'Medical History', icon: <MdMedicalServices /> },
        { id: 'prescription', label: 'Prescription', icon: <MdDescription /> },
        { id: 'lab-results', label: 'Lab Results', icon: <MdScience /> },
        ...(showBillingTab ? [{ id: 'billings', label: 'Billings', icon: <MdPayment /> }] : [])
    ];

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

    useEffect(() => {
        if (isOpen) {
            if (patientProp) {
                // Patient data already provided, use it directly
                setPatient(patientProp);
                setIsLoading(false);
            } else if (patientId) {
                // Fetch patient by ID
                fetchPatient();
            } else {
                setError("No patient data or ID provided");
                setIsLoading(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, patientId, patientProp]);

    const handleDownloadReport = async () => {
        const id = patientId || patient?._id;
        if (!id) return;
        setIsDownloading(true);
        try {
            const result = await reportService.downloadPatientReport(id);
            if (!result.success) {
                alert(result.message);
            }
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download report: ' + err.message);
        } finally {
            setIsDownloading(false);
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

        // Location: prioritize street, then district/city
        let location = 'Location not set';
        if (patient.address?.street) {
            location = patient.address.street;
        } else if (patient.street) {
            location = patient.street;
        } else if (patient.address?.city) {
            location = patient.address.city;
        } else if (patient.city) {
            location = patient.city;
        } else if (patient.address?.state) {
            location = patient.address.state;
        } else if (patient.state) {
            location = patient.state;
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

        const patientCode = patient.patientCode ||
            patient.metadata?.patientCode ||
            patient.patient_code ||
            'PAT-SYNCING...';

        return {
            name, phone, email, gender, location, occupation, dob, age,
            weightKg, heightCm, bp, bmi,
            diagnosis: Array.isArray(diagnosis) ? diagnosis : [],
            barriers: Array.isArray(barriers) ? barriers : [],
            noAlcohol, noSmoker,
            avatarUrl: patient.avatarUrl || patient.metadata?.avatarUrl,
            patientCode
        };
    };

    const copyToClipboard = (text, label) => {
        if (!text) {
            alert(`No ${label} information available to copy`);
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert(`${label} copied to clipboard!`);
                })
                .catch((err) => {
                    console.error(`Failed to copy ${label}:`, err);
                    fallbackCopyTextToClipboard(text, label);
                });
        } else {
            fallbackCopyTextToClipboard(text, label);
        }
    };

    const fallbackCopyTextToClipboard = (text, label) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            // Ensure textArea is not visible but still part of the DOM
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                alert(`${label} copied to clipboard!`);
            } else {
                throw new Error('Copy command was unsuccessful');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            alert(`Failed to copy ${label}. Please select and copy manually.`);
        }
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
                                        <div className="pv-name-id-group">
                                            <h2 className="pv-name-main">{patientData.name}</h2>
                                            <div className="pv-patient-code-badge" onClick={() => copyToClipboard(patientData.patientCode, 'Patient Code')} title="Click to copy Patient Code">
                                                <span className="pv-code-prefix">ID:</span>
                                                <span className="pv-code-val">{patientData.patientCode}</span>
                                                <MdContentCopy size={12} className="pv-code-copy-icon" />
                                            </div>
                                        </div>
                                        <div className="pv-contact-icons">
                                            {patientData.phone && (
                                                <button
                                                    className="pv-contact-btn"
                                                    title={`Copy Phone: ${patientData.phone}`}
                                                    onClick={() => copyToClipboard(patientData.phone, 'Phone Number')}
                                                >
                                                    <MdPhone size={14} />
                                                </button>
                                            )}
                                            {patientData.email && (
                                                <button
                                                    className="pv-contact-btn"
                                                    title={`Copy Email: ${patientData.email}`}
                                                    onClick={() => copyToClipboard(patientData.email, 'Email Address')}
                                                >
                                                    <MdEmail size={14} />
                                                </button>
                                            )}
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
                            {activeTab === 'profile' && <ProfileTab patient={patient} copyToClipboard={copyToClipboard} />}
                            {activeTab === 'medical-history' && <MedicalHistoryTab patientId={patientId || patient?._id} />}
                            {activeTab === 'prescription' && <PrescriptionTab patientId={patientId || patient?._id} />}
                            {activeTab === 'lab-results' && <LabResultTab patientId={patientId || patient?._id} />}
                            {activeTab === 'billings' && <BillingsTab patientId={patientId || patient?._id} />}
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};

// --- PROFILE TAB ---
const ProfileTab = ({ patient, copyToClipboard }) => {
    const address = patient.address || {};

    const copyAddress = () => {
        // Build address from multiple possible field locations
        let addressParts = [];

        // Check address object first
        if (address.houseNumber || address.houseNo) {
            addressParts.push(address.houseNumber || address.houseNo);
        }
        if (address.street) {
            addressParts.push(address.street);
        }
        if (address.city) {
            addressParts.push(address.city);
        }
        if (address.state) {
            addressParts.push(address.state);
        }
        if (address.pincode) {
            addressParts.push(address.pincode);
        }
        if (address.country) {
            addressParts.push(address.country);
        }

        // Fallback to direct patient fields if address object is empty
        if (addressParts.length === 0) {
            if (patient.houseNo) addressParts.push(patient.houseNo);
            if (patient.street) addressParts.push(patient.street);
            if (patient.city) addressParts.push(patient.city);
            if (patient.state) addressParts.push(patient.state);
            if (patient.pincode) addressParts.push(patient.pincode);
            if (patient.country) addressParts.push(patient.country);
        }

        const fullAddr = addressParts.join(', ').trim();
        copyToClipboard(fullAddr, 'Address');
    };

    const openMaps = () => {
        // Try to build address from multiple possible field locations
        let addressParts = [];

        // Check address object first
        if (address.houseNumber || address.houseNo) {
            addressParts.push(address.houseNumber || address.houseNo);
        }
        if (address.street) {
            addressParts.push(address.street);
        }
        if (address.city) {
            addressParts.push(address.city);
        }
        if (address.state) {
            addressParts.push(address.state);
        }
        if (address.pincode) {
            addressParts.push(address.pincode);
        }

        // Fallback to direct patient fields if address object is empty
        if (addressParts.length === 0) {
            if (patient.houseNo) addressParts.push(patient.houseNo);
            if (patient.street) addressParts.push(patient.street);
            if (patient.city) addressParts.push(patient.city);
            if (patient.state) addressParts.push(patient.state);
            if (patient.pincode) addressParts.push(patient.pincode);
        }

        const fullAddr = addressParts.join(', ').trim();

        if (!fullAddr || fullAddr === '') {
            alert('No address information available to open in maps');
            return;
        }

        // Open Google Maps with the address
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
        window.open(mapsUrl, '_blank');
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
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        if (patientId) {
            fetchHistory();
        } else {
            // No patient ID available, stop loading
            setLoading(false);
            setHistoryData([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Fetch both appointments and scanned medical history
            const [appointments, scannedHistory] = await Promise.all([
                patientsService.fetchPatientAppointments(patientId),
                prescriptionService.fetchMedicalHistory(patientId)
            ]);

            // Map backend appointments to UI fields
            const mappedAppointments = (Array.isArray(appointments) ? appointments : []).map(apt => ({
                id: apt._id || apt.id,
                title: apt.condition || apt.title || apt.reason || 'Medical Checkup',
                date: apt.startAt || (apt.appointmentDate ? `${apt.appointmentDate} ${apt.appointmentTime || ''}` : apt.date),
                reason: apt.notes || apt.reason || '',
                category: apt.appointmentType || apt.type || 'Consultation',
                notes: apt.notes || '',
                status: apt.status || 'Scheduled',
                pdfId: apt.pdfId || (apt.metadata && apt.metadata.pdfId),
                type: 'appointment'
            }));

            // Map scanned history records
            const mappedScanned = (Array.isArray(scannedHistory) ? scannedHistory : []).map(record => ({
                id: record._id || record.id,
                title: record.title || 'Scanned Record',
                date: record.recordDate || record.reportDate || record.uploadDate,
                reason: record.diagnosis || record.notes || '',
                category: record.category || record.intent || 'Medical History',
                notes: record.notes || record.diagnosis || '',
                pdfId: record.pdfId,
                type: 'scanned'
            }));

            // Combine and sort by date descending
            const combined = [...mappedAppointments, ...mappedScanned].sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });

            setHistoryData(combined);
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

    const handleViewDetails = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
    };

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
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Loading */}
                        {loading && (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    Loading medical history...
                                </td>
                            </tr>
                        )}

                        {/* No Data */}
                        {!loading && filteredData.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center">
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
                                        {item.pdfId ? (
                                            <button
                                                className="pv-btn-action-circle"
                                                onClick={() => reportService.viewPdf(item.pdfId)}
                                                title="View Document"
                                            >
                                                <MdVisibility />
                                            </button>
                                        ) : (
                                            <button
                                                className="pv-btn-action-circle"
                                                title="View Details"
                                                onClick={() => handleViewDetails(item)}
                                            >
                                                <MdVisibility />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>


            {/* Medical History Detail Modal */}
            {showDetailModal && selectedItem && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.2s ease-in-out'
                    }}
                    onClick={handleCloseDetailModal}
                >
                    <div
                        className="actions-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '24px 28px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <div>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '22px',
                                    fontWeight: '700',
                                    color: 'white',
                                    letterSpacing: '-0.5px'
                                }}>
                                    Medical History Details
                                </h2>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '13px',
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontWeight: '400'
                                }}>
                                    {selectedItem.type === 'appointment' ? 'Appointment Record' : 'Scanned Medical Record'}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseDetailModal}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white',
                                    transition: 'all 0.2s',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{
                            padding: '28px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {/* Title Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                padding: '20px',
                                borderRadius: '12px',
                                marginBottom: '24px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    lineHeight: '1.4'
                                }}>
                                    {selectedItem.title || 'Medical Record'}
                                </h3>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {/* Date */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '16px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        background: '#207DC0',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        marginRight: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <MdCalendarToday size={20} color="white" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px'
                                        }}>
                                            Date
                                        </div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1e293b'
                                        }}>
                                            {selectedItem.date
                                                ? new Date(selectedItem.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : 'Not specified'
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Category */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '16px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        background: '#207DC0',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        marginRight: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <MdMedicalServices size={20} color="white" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px'
                                        }}>
                                            Category
                                        </div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1e293b'
                                        }}>
                                            {selectedItem.category || 'General'}
                                        </div>
                                    </div>
                                </div>

                                {/* Reason (if available) */}
                                {selectedItem.reason && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#fef3c7',
                                        borderRadius: '10px',
                                        border: '1px solid #fbbf24'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#92400e',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <MdDescription size={16} />
                                            Reason / Chief Complaint
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#78350f',
                                            lineHeight: '1.6',
                                            fontWeight: '500'
                                        }}>
                                            {selectedItem.reason}
                                        </div>
                                    </div>
                                )}

                                {/* Notes (if available) */}
                                {selectedItem.notes && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#f0fdf4',
                                        borderRadius: '10px',
                                        border: '1px solid #86efac'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#166534',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <MdDescription size={16} />
                                            Clinical Notes
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#14532d',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: '400'
                                        }}>
                                            {selectedItem.notes}
                                        </div>
                                    </div>
                                )}

                                {/* Status (if available) */}
                                {selectedItem.status && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px',
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Status
                                        </div>
                                        <div style={{
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            background: selectedItem.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                                            color: selectedItem.status === 'Completed' ? '#166534' : '#92400e',
                                            border: `1px solid ${selectedItem.status === 'Completed' ? '#86efac' : '#fbbf24'}`
                                        }}>
                                            {selectedItem.status}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '20px 28px',
                            borderTop: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                onClick={handleCloseDetailModal}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 32px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { 
                                opacity: 0;
                                transform: translateY(20px);
                            }
                            to { 
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}</style>
                </div>
            )}
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
        } else {
            // No patient ID available, stop loading
            setLoading(false);
            setPrescriptions([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const fetchPrescriptionsData = async () => {
        setLoading(true);
        try {
            const data = await patientsService.fetchPatientPrescriptions(patientId);

            // Flatten PharmacyRecord items to individual prescription rows
            const flattenedPrescriptions = [];
            if (Array.isArray(data)) {
                data.forEach(record => {
                    if (record.items && Array.isArray(record.items)) {
                        record.items.forEach(item => {
                            flattenedPrescriptions.push({
                                medicationName: item.name || item.Medicine || '',
                                medicine: item.name || item.Medicine || '',
                                dosage: item.dosage || item.Dosage || '',
                                frequency: item.frequency || item.Frequency || '',
                                duration: item.duration || item.Duration || '',
                                instructions: item.notes || item.Notes || '',
                                createdAt: record.createdAt || record.date,
                                pdfId: record.pdfId || null,
                                recordId: record._id || record.id,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice
                            });
                        });
                    }
                });
            }

            setPrescriptions(flattenedPrescriptions);
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
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Loading */}
                        {loading && (
                            <tr>
                                <td colSpan="7" className="text-center">
                                    Loading prescriptions...
                                </td>
                            </tr>
                        )}

                        {/* No Data */}
                        {!loading && prescriptions.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center">
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
                                    <td>{item.duration ? `${item.duration} days` : '—'}</td>

                                    <td>{item.instructions || '—'}</td>
                                    <td>
                                        {item.createdAt
                                            ? new Date(item.createdAt).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td>
                                        {item.pdfId ? (
                                            <button
                                                className="pv-btn-action-circle"
                                                onClick={() => reportService.viewPdf(item.pdfId)}
                                                title="View Prescription"
                                            >
                                                <MdVisibility />
                                            </button>
                                        ) : (
                                            <button className="pv-btn-action-circle" title="View Details">
                                                <MdVisibility />
                                            </button>
                                        )}
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
        } else {
            // No patient ID available, stop loading
            setLoading(false);
            setLabs([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const fetchLabResults = async () => {
        setLoading(true);
        const startTime = performance.now();
        console.log('[LAB RESULTS] Starting fetch for patient:', patientId);

        try {
            const data = await patientsService.fetchPatientLabResults(patientId);
            const endTime = performance.now();
            console.log(`[LAB RESULTS] Fetch completed in ${(endTime - startTime).toFixed(0)}ms, found ${data?.length || 0} results`);

            setLabs(Array.isArray(data) ? data : []);
        } catch (error) {
            const endTime = performance.now();
            console.error(`[LAB RESULTS] Fetch failed after ${(endTime - startTime).toFixed(0)}ms:`, error);
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
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {(item.pdfId || item.fileRef) && (
                                                <button
                                                    className="pv-btn-action-circle"
                                                    onClick={() => reportService.viewPdf(item.pdfId || item.fileRef)}
                                                    title="View Report"
                                                    style={{ color: '#7c3aed' }}
                                                >
                                                    <MdVisibility size={18} />
                                                </button>
                                            )}
                                            {!(item.pdfId || item.fileRef || item._id || item.id) && (
                                                <button className="pv-btn-action-circle" disabled title="No PDF available">
                                                    <MdVisibility />
                                                </button>
                                            )}
                                        </div>
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
        } else {
            // No patient ID available, stop loading
            setLoading(false);
            setBills([]);
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
                            <th>Invoice ID</th>
                            <th>Date</th>
                            <th>Amount (₹)</th>
                            <th>Payment Mode</th>
                            <th>Due Date</th>
                            <th>Description</th>
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

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
        if (patient.street) {
            location = patient.street;
        } else if (patient.town) {
            location = patient.town;
        } else if (patient.city) {
            location = patient.city;
        } else if (patient.district) {
            location = patient.district;
        } else if (patient.state) {
            location = patient.state;
        } else if (patient.address && typeof patient.address === 'string') {
            location = patient.address;
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
                                        {patientData.age > 0 && (
                                            <div className="pv-pill">
                                                <MdCalendarToday size={14} /> <span>{patientData.age} yrs{patientData.dob && ` · ${patientData.dob}`}</span>
                                            </div>
                                        )}
                                        <div className="pv-pill">
                                            <MdLocationOn size={14} /> <span>{patientData.location}</span>
                                        </div>
                                        <div className="pv-pill">
                                            <MdWork size={14} /> <span>{patientData.occupation}</span>
                                        </div>
                                    </div>

                                    {/* Vitals — 4-column row, fills all available width */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <VitalCard label="BMI" value={patientData.bmi} />
                                        <VitalCard label="Weight" value={patientData.weightKg} unit="kg" />
                                        <VitalCard label="Height" value={patientData.heightCm} unit="cm" />
                                        <VitalCard label="Blood Pressure" value={patientData.bp} unit="mmHg" />
                                    </div>
                                </div>

                                {/* Right — Edit + Diagnosis/Barriers only */}
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
                            {activeTab === 'medical-history' && <MedicalHistoryTab patientId={patientId || patient?._id} patient={patient} />}
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
        if (address.district) {
            addressParts.push(address.district);
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
            if (patient.district) addressParts.push(patient.district);
            if (patient.state) addressParts.push(patient.state);
            if (patient.pincode) addressParts.push(patient.pincode);
            if (patient.country) addressParts.push(patient.country);
        }

        const fullAddr = addressParts.join(', ').trim();
        copyToClipboard(fullAddr, 'Address');
    };

    const openMaps = () => {
        // PRIORITY 1: Precise Coordinates
        if (patient.lat && patient.lng) {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${patient.lat},${patient.lng}`;
            window.open(mapsUrl, '_blank');
            return;
        }

        // PRIORITY 2: Address String Search
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
        if (address.district) {
            addressParts.push(address.district);
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
            if (patient.district) addressParts.push(patient.district);
            if (patient.state) addressParts.push(patient.state);
            if (patient.pincode) addressParts.push(patient.pincode);
        }

        const fullAddr = addressParts.join(', ').trim();

        if (!fullAddr || fullAddr === '') {
            alert('No address or coordinate information available to open in maps');
            return;
        }

        // Open Google Maps with the address query
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
        window.open(mapsUrl, '_blank');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl mx-auto items-stretch">
            {/* Left Column: General & Address */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                            <MdLocationOn size={18} />
                        </div>
                        <h3 className="font-semibold text-gray-800 m-0 text-base">Address & Details</h3>
                    </div>
                    {/* Action Buttons in Header */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyAddress}
                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                            title="Copy Address"
                        >
                            <MdContentCopy size={16} />
                        </button>
                        <button
                            onClick={openMaps}
                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                            title="Open in Maps"
                        >
                            <MdMap size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-5 flex-1">
                    {/* Father's Name */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Father/Spouse Name</span>
                        <span className="text-sm font-medium text-slate-900">
                            {patient.fatherName || patient.metadata?.fatherName || '—'}
                        </span>
                    </div>

                    {/* Formatted Address */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</span>
                        <div className="text-sm font-medium text-slate-900 leading-relaxed">
                            {/* Street Line */}
                            {(() => {
                                const line1 = [patient.houseNo || patient.address?.houseNo, patient.street || patient.address?.street].filter(Boolean).join(', ');
                                const line2 = [patient.town || patient.city, patient.state || patient.address?.state].filter(Boolean).join(', ');
                                const line3 = [patient.pincode || patient.address?.pincode, patient.country || patient.address?.country].filter(Boolean).join(' - ');

                                if (!line1 && !line2 && !line3) return <span className="text-slate-400 italic font-normal">Not Provided</span>;

                                return (
                                    <>
                                        {line1 && <div>{line1}</div>}
                                        {line2 && <div>{line2}</div>}
                                        {line3 && <div>{line3}</div>}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Emergency & Family */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                            <MdPhone size={18} />
                        </div>
                        <h3 className="font-semibold text-gray-800 m-0 text-base">Emergency Contact</h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-5 flex-1">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Name</span>
                        <span className="text-sm font-medium text-slate-900">
                            {patient.emergencyContactName || 'No contact on file'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Relationship</span>
                        <span className="text-sm font-medium text-slate-900">
                            {patient.emergencyContactRelation || patient.metadata?.emergencyContactRelation || '—'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                        {patient.emergencyContactPhone ? (
                            <a
                                href={`tel:${patient.emergencyContactPhone}`}
                                className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1.5 w-fit"
                            >
                                <MdPhone size={14} />
                                {patient.emergencyContactPhone}
                            </a>
                        ) : (
                            <span className="text-sm font-medium text-slate-900">No phone on file</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MEDICAL HISTORY TAB ---
const MedicalHistoryTab = ({ patientId, patient }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        if (patientId) {
            fetchHistory();
        } else {
            setLoading(false);
            setHistoryData([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            console.log('[MEDICAL_HISTORY_TAB] 🔍 Fetching medical history for:', patientId);
            const data = await prescriptionService.fetchMedicalHistory(patientId);
            console.log('[MEDICAL_HISTORY_TAB] ✅ Received:', data?.length || 0, 'records');
            console.log('[MEDICAL_HISTORY_TAB] 📋 Sample data:', data?.[0]);
            setHistoryData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[MEDICAL_HISTORY_TAB] ❌ Failed to fetch history:', error);
            setHistoryData([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date) => {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredData = historyData.filter(item =>
        (item.medicalHistory || item.hospitalName || item.doctorName || '')
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
                            <th>S.No</th>
                            <th>Date and Time</th>
                            <th>Hospital</th>
                            <th>Doctor</th>
                            <th>Summary</th>
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
                                    <td>{index + 1}</td>
                                    <td>{item.date || formatDateTime(item.recordDate || item.uploadDate)}</td>
                                    <td>{item.hospitalName || '—'}</td>
                                    <td>{item.doctorName || '—'}</td>
                                    <td className="pv-td-notes" style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {item.appointmentSummary || item.dischargeSummary || item.medicalHistory || item.diagnosis || '—'}
                                    </td>
                                    <td>
                                        <button
                                            className="pv-btn-action-circle"
                                            onClick={() => item.pdfId ? reportService.viewPdf(item.pdfId) : handleViewDetails(item)}
                                            title="View Details"
                                        >
                                            <MdVisibility />
                                        </button>
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
                            background: 'linear-gradient(135deg, #207DC0 0%, #165a8a 100%)',
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
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '16px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
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
                                            {selectedItem.recordDate
                                                ? new Date(selectedItem.recordDate).toLocaleDateString('en-US', {
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

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '16px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px'
                                        }}>
                                            Hospital
                                        </div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1e293b'
                                        }}>
                                            {selectedItem.hospitalName || 'Not specified'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '16px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px'
                                        }}>
                                            Doctor
                                        </div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1e293b'
                                        }}>
                                            {selectedItem.doctorName || 'Not specified'}
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Type Badge */}
                                {selectedItem.medicalType && (
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '8px 16px',
                                        background: selectedItem.medicalType === 'discharge_summary' ? '#fef3c7' : '#dbeafe',
                                        color: selectedItem.medicalType === 'discharge_summary' ? '#92400e' : '#1e40af',
                                        borderRadius: '20px',
                                        fontWeight: '600',
                                        fontSize: '12px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '12px'
                                    }}>
                                        {selectedItem.medicalType === 'discharge_summary' ? '📋 Discharge Summary' : '🏥 Appointment Summary'}
                                    </div>
                                )}

                                {/* Date and Time */}
                                {(selectedItem.date || selectedItem.time) && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: selectedItem.time ? '1fr 1fr' : '1fr',
                                        gap: '12px',
                                        marginBottom: '12px'
                                    }}>
                                        {selectedItem.date && (
                                            <div style={{
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
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '4px'
                                                }}>
                                                    📅 Date
                                                </div>
                                                <div style={{
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    color: '#1e293b'
                                                }}>
                                                    {selectedItem.date}
                                                </div>
                                            </div>
                                        )}
                                        {selectedItem.time && (
                                            <div style={{
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
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '4px'
                                                }}>
                                                    🕐 Time
                                                </div>
                                                <div style={{
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    color: '#1e293b'
                                                }}>
                                                    {selectedItem.time}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Hospital Location */}
                                {selectedItem.hospitalLocation && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px'
                                        }}>
                                            📍 Hospital Location
                                        </div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1e293b'
                                        }}>
                                            {selectedItem.hospitalLocation}
                                        </div>
                                    </div>
                                )}

                                {/* Department */}
                                {selectedItem.department && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px'
                                        }}>
                                            🏢 Department
                                        </div>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1e293b'
                                        }}>
                                            {selectedItem.department}
                                        </div>
                                    </div>
                                )}

                                {/* Appointment Summary */}
                                {selectedItem.appointmentSummary && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#f0fdf4',
                                        borderRadius: '10px',
                                        border: '1px solid #86efac',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#166534',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px'
                                        }}>
                                            📝 Appointment Summary
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#14532d',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: '400'
                                        }}>
                                            {selectedItem.appointmentSummary}
                                        </div>
                                    </div>
                                )}

                                {/* Discharge Summary */}
                                {selectedItem.dischargeSummary && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#fef3c7',
                                        borderRadius: '10px',
                                        border: '1px solid #fbbf24',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#92400e',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px'
                                        }}>
                                            📋 Discharge Summary
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#78350f',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: '400'
                                        }}>
                                            {selectedItem.dischargeSummary}
                                        </div>
                                    </div>
                                )}

                                {/* Services */}
                                {selectedItem.services && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#ede9fe',
                                        borderRadius: '10px',
                                        border: '1px solid #c4b5fd',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#5b21b6',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px'
                                        }}>
                                            🔧 Services Provided
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#4c1d95',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: '400'
                                        }}>
                                            {selectedItem.services}
                                        </div>
                                    </div>
                                )}

                                {/* Doctor Notes */}
                                {selectedItem.doctorNotes && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#fef3c7',
                                        borderRadius: '10px',
                                        border: '1px solid #fcd34d',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#92400e',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px'
                                        }}>
                                            👨‍⚕️ Doctor Notes
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#78350f',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: '400'
                                        }}>
                                            {selectedItem.doctorNotes}
                                        </div>
                                    </div>
                                )}

                                {/* Observations */}
                                {selectedItem.observations && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#dbeafe',
                                        borderRadius: '10px',
                                        border: '1px solid #60a5fa',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#1e40af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px'
                                        }}>
                                            🔬 Observations
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#1e3a8a',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: '400'
                                        }}>
                                            {selectedItem.observations}
                                        </div>
                                    </div>
                                )}

                                {/* Remarks */}
                                {selectedItem.remarks && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#fce7f3',
                                        borderRadius: '10px',
                                        border: '1px solid #f9a8d4',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#9f1239',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px'
                                        }}>
                                            💬 Remarks
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#831843',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: '400'
                                        }}>
                                            {selectedItem.remarks}
                                        </div>
                                    </div>
                                )}

                                {/* Legacy Medical History (fallback for old records) */}
                                {!selectedItem.appointmentSummary && !selectedItem.dischargeSummary && selectedItem.medicalHistory && (
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
                                            marginBottom: '8px'
                                        }}>
                                            📝 Medical Summary
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#14532d',
                                            lineHeight: '1.7',
                                            whiteSpace: 'pre-wrap',
                                            fontWeight: '400'
                                        }}>
                                            {selectedItem.medicalHistory}
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
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- PRESCRIPTION TAB ---
const PrescriptionTab = ({ patientId }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
            console.log('[PRESCRIPTION_TAB] 🔍 Fetching prescriptions for:', patientId);
            const data = await prescriptionService.fetchPrescriptions(patientId);
            console.log('[PRESCRIPTION_TAB] ✅ Received:', data?.length || 0, 'prescriptions');
            console.log('[PRESCRIPTION_TAB] 📋 Sample prescription:', data?.[0]);
            setPrescriptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[PRESCRIPTION_TAB] ❌ Failed to fetch prescriptions:', error);
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date) => {
        if (!date) return '—';
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredPrescriptions = prescriptions.filter(item =>
        (item.doctorName || item.hospitalName || item.diagnosis || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

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
                            <th>S.No</th>
                            <th>Date and Time</th>
                            <th>Hospital</th>
                            <th>Doctor</th>
                            <th>Reason</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Loading */}
                        {loading && (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    Loading prescriptions...
                                </td>
                            </tr>
                        )}

                        {/* No Data */}
                        {!loading && filteredPrescriptions.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    No Prescriptions Found
                                </td>
                            </tr>
                        )}

                        {/* Data Rows */}
                        {!loading &&
                            filteredPrescriptions.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{formatDateTime(item.prescriptionDate || item.uploadDate)}</td>
                                    <td>{item.hospitalName || '—'}</td>
                                    <td>{item.doctorName || '—'}</td>
                                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {item.prescriptionSummary || item.diagnosis || '—'}
                                    </td>
                                    <td>
                                        <button
                                            className="pv-btn-action-circle"
                                            onClick={() => item.pdfId ? reportService.viewPdf(item.pdfId) : null}
                                            disabled={!item.pdfId}
                                            title="View Prescription"
                                        >
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

    // Simple search by test name (supports both scanned and manual lab reports)
    const filteredLabs = labs.filter(item => {
        const testName = item.testType || item.testName || item.name || '';
        const labName = item.labName || '';
        const searchText = `${testName} ${labName}`.toLowerCase();
        return searchText.includes(searchTerm.toLowerCase());
    });

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
                            filteredLabs.map((item, idx) => {
                                // Support both scanned lab reports (LabReportDocument) and manual lab reports
                                const testName = item.testType || item.testName || item.name || '—';
                                const labName = item.labName || '—';
                                const resultsCount = item.results?.length || 0;
                                const displayResult = resultsCount > 0
                                    ? `${resultsCount} test${resultsCount > 1 ? 's' : ''} - ${labName}`
                                    : item.result || item.summary || labName;
                                const displayDate = item.reportDate || item.date || item.createdAt;

                                return (
                                    <tr key={idx}>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{testName}</div>
                                            {item.testCategory && (
                                                <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '2px' }}>
                                                    {item.testCategory}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {displayResult}
                                        </td>
                                        <td>
                                            {displayDate
                                                ? new Date(displayDate).toLocaleDateString()
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
                                                        style={{ color: '#207DC0' }}
                                                    >
                                                        <MdVisibility size={18} />
                                                    </button>
                                                )}
                                                {resultsCount > 0 && (
                                                    <button
                                                        className="pv-btn-action-circle"
                                                        onClick={() => alert(`Results:\n\n${item.results.map(r => `${r.testName}: ${r.value} ${r.unit} (${r.referenceRange}) ${r.flag ? '- ' + r.flag.toUpperCase() : ''}`).join('\n')}`)}
                                                        title={`View ${resultsCount} Test Results`}
                                                        style={{ color: '#10b981' }}
                                                    >
                                                        <MdScience size={18} />
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
                                );
                            })}
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
            // FIXED: Use billing API instead of invoice API
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/billing/patient/${patientId}`, {
                headers: {
                    'x-auth-token': localStorage.getItem('x-auth-token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken'),
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBills(Array.isArray(data.bills) ? data.bills : []);
            } else {
                console.error('Failed to fetch bills:', response.status);
                setBills([]);
            }
        } catch (error) {
            console.error('Failed to fetch billing data:', error);
            setBills([]);
        } finally {
            setLoading(false);
        }
    };

    // Simple search (bill number / items)
    const filteredBills = bills.filter(bill =>
        (bill.billNumber || bill.patientName || bill.items?.map(i => i.description).join(' ') || '')
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
                            <th>Bill Number</th>
                            <th>Date</th>
                            <th>Total Amount</th>
                            <th>Payment Method</th>
                            <th>Balance Due</th>
                            <th>Items</th>
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
                            filteredBills.map((bill, idx) => (
                                <tr key={bill._id || idx}>
                                    <td>
                                        {bill.billNumber || '—'}
                                    </td>
                                    <td>
                                        {bill.date
                                            ? new Date(bill.date).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })
                                            : '—'}
                                    </td>
                                    <td>
                                        ₹{bill.totalAmount?.toFixed(2) || '0.00'}
                                    </td>
                                    <td>
                                        {bill.paymentMethod || '—'}
                                    </td>
                                    <td>
                                        {bill.balanceAmount > 0 ? (
                                            <span style={{ color: '#d97706', fontWeight: 600 }}>
                                                ₹{bill.balanceAmount?.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#059669' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        {bill.items?.length > 0
                                            ? `${bill.items[0].description}${bill.items.length > 1 ? ` +${bill.items.length - 1} more` : ''}`
                                            : '—'}
                                    </td>
                                    <td>
                                        <span
                                            className={`pv-badge status-${(bill.status || 'pending').toLowerCase().replace(' ', '-')}`}
                                            style={{
                                                backgroundColor:
                                                    bill.status === 'Paid' ? '#d1fae5' :
                                                        bill.status === 'Partially Paid' ? '#fef3c7' :
                                                            bill.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                                                color:
                                                    bill.status === 'Paid' ? '#059669' :
                                                        bill.status === 'Partially Paid' ? '#d97706' :
                                                            bill.status === 'Cancelled' ? '#dc2626' : '#d97706'
                                            }}
                                        >
                                            {bill.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="pv-action-group">
                                            <button
                                                className="pv-btn-action-circle"
                                                title="View Bill Details"
                                            >
                                                <MdVisibility />
                                            </button>
                                            <button
                                                className="pv-btn-action-circle"
                                                title="Download PDF"
                                            >
                                                <MdPictureAsPdf />
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

// Reusable VitalCard component enforcing strict typographic hierarchy with Tailwind
const VitalCard = ({ label, value, unit }) => (
    <div className="flex flex-col w-full p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm transition-shadow hover:shadow-md ring-1 ring-transparent hover:border-teal-200">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{label}</span>
        <div className="flex items-baseline gap-1 mt-auto">
            <span className="text-2xl font-bold text-slate-900">{value && value !== '—/—' ? value : '—'}</span>
            {unit && value && value !== '—' && value !== '—/—' && (
                <span className="text-sm font-medium text-slate-500">{unit}</span>
            )}
        </div>
    </div>
);

export default PatientView;

/**
 * AppointmentPreviewDialog.jsx
 * React implementation of Flutter's DoctorAppointmentPreview
 * Shows patient profile with tabs: Profile, Medical History, Prescription, Lab Result, Billings
 */

import React, { useState, useEffect } from 'react';
import { 
  MdClose, MdPlace, MdContactPhone, MdVerifiedUser, 
  MdContentCopy, MdMap, MdPerson, MdHistory, 
  MdMedication, MdBiotech, MdPayment 
} from 'react-icons/md';
import PatientProfileHeaderCard from './PatientProfileHeaderCard';
import patientsService from '../../services/patientsService';
import { fetchPrescriptions, fetchLabReports, fetchMedicalHistory } from '../../services/prescriptionService';
import './AppointmentPreviewDialog.css';

const AppointmentPreviewDialog = ({ patient, isOpen, onClose, showBillingTab = true }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPatient, setCurrentPatient] = useState(patient);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      console.log('🔍 [AppointmentPreviewDialog] Received patient data:', patient);
      console.log('📋 [AppointmentPreviewDialog] Patient fields:', {
        patientId: patient.patientId,
        name: patient.name,
        houseNo: patient.houseNo,
        street: patient.street,
        city: patient.city,
        state: patient.state,
        pincode: patient.pincode,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        insuranceNumber: patient.insuranceNumber,
        expiryDate: patient.expiryDate,
      });
      setCurrentPatient(patient);
      refreshPatientData();
    }
  }, [isOpen, patient]);

  const refreshPatientData = async () => {
    if (isRefreshing || !patient?.patientId) return;

    setIsRefreshing(true);
    try {
      console.log('🔄 [APPOINTMENT PREVIEW] Refreshing patient data for:', patient.patientId);
      console.log('📋 [APPOINTMENT PREVIEW] Patient object:', patient);
      
      // Try to fetch fresh data (will work if patientId is UUID)
      const freshData = await patientsService.fetchPatientById(patient.patientId);
      setCurrentPatient(freshData);
      console.log('✅ [APPOINTMENT PREVIEW] Patient data refreshed successfully');
    } catch (error) {
      console.warn('⚠️ [APPOINTMENT PREVIEW] Failed to refresh patient data, using provided data:', error);
      // Just use the patient data we already have
      setCurrentPatient(patient);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEdit = () => {
    console.log('📝 [APPOINTMENT PREVIEW] Edit clicked for patient:', currentPatient?.patientId);
    // TODO: Open edit patient dialog
  };

  if (!isOpen || !currentPatient) return null;

  return (
    <div className="appointment-preview-overlay" onClick={onClose}>
      <div 
        className="appointment-preview-dialog" 
        onClick={e => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button className="appointment-preview-close" onClick={onClose}>
          <MdClose size={20} />
        </button>

        {/* Content */}
        <div className="appointment-preview-content">
          {/* Patient Header */}
          <div className="appointment-preview-header">
            <PatientProfileHeaderCard 
              patient={currentPatient} 
              onEdit={handleEdit}
            />
          </div>

          {/* Tabs Container */}
          <div className="appointment-preview-body">
            {/* Tab Bar */}
            <div className="appointment-tabs">
              <button
                className={`appointment-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button
                className={`appointment-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Medical History
              </button>
              <button
                className={`appointment-tab ${activeTab === 'prescription' ? 'active' : ''}`}
                onClick={() => setActiveTab('prescription')}
              >
                Prescription
              </button>
              <button
                className={`appointment-tab ${activeTab === 'lab' ? 'active' : ''}`}
                onClick={() => setActiveTab('lab')}
              >
                Lab Result
              </button>
              {showBillingTab && (
                <button
                  className={`appointment-tab ${activeTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('billing')}
                >
                  Billings
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="appointment-tab-content">
              {activeTab === 'profile' && <OverviewTab patient={currentPatient} />}
              {activeTab === 'history' && <MedicalHistoryTab patient={currentPatient} />}
              {activeTab === 'prescription' && <PrescriptionTab patient={currentPatient} />}
              {activeTab === 'lab' && <LabResultsTab patient={currentPatient} />}
              {activeTab === 'billing' && showBillingTab && <BillingsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ OVERVIEW TAB ============
const OverviewTab = ({ patient }) => {
  const isMissing = (val) => {
    if (!val) return true;
    const str = String(val).trim().toLowerCase();
    return str === '' || str === '—' || str === '-' || str === 'na' || str === 'n/a' || str === 'null' || str === 'none';
  };

  const handleCopyAddress = () => {
    const addressParts = [
      patient.houseNo,
      patient.street,
      patient.city,
      patient.state,
      patient.pincode,
      patient.country || 'India'
    ].filter(p => p && p.trim());
    
    const fullAddress = addressParts.join(', ');
    navigator.clipboard.writeText(fullAddress);
    alert('Address copied to clipboard!');
  };

  const handleOpenMaps = () => {
    const addressParts = [
      patient.houseNo,
      patient.street,
      patient.city,
      patient.state,
      patient.pincode,
      patient.country || 'India'
    ].filter(p => p && p.trim());
    
    const fullAddress = addressParts.join(', ');
    const url = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="overview-tab-content">
      {/* Address Card */}
      <div className="info-section-card">
        <div className="card-header">
          <div className="card-icon-badge">
            <MdPlace />
          </div>
          <h3 className="card-title">Address</h3>
        </div>
        <div className="card-body">
          <InfoRow label="House No" value={patient.houseNo || 'Not Provided'} />
          <InfoRow label="Street" value={patient.street || 'Not Provided'} />
          <InfoRow label="City" value={patient.city || 'Not Provided'} />
          <InfoRow label="State" value={patient.state || 'Not Provided'} />
          <InfoRow label="Pincode" value={patient.pincode || 'Not Provided'} />
          <InfoRow label="Country" value={patient.country || 'India'} />
          
          <div className="card-actions">
            <button className="action-chip" onClick={handleCopyAddress}>
              <MdContentCopy size={16} />
              Copy
            </button>
            <button className="action-chip" onClick={handleOpenMaps}>
              <MdMap size={16} />
              Open in Maps
            </button>
            <span className="date-tag">Updated: Recently</span>
          </div>
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="info-section-card">
        <div className="card-header">
          <div className="card-icon-badge">
            <MdContactPhone />
          </div>
          <h3 className="card-title">Emergency Contact</h3>
        </div>
        <div className="card-body">
          <InfoRow 
            label="Name" 
            value={isMissing(patient.emergencyContactName) ? 'No contact on file' : patient.emergencyContactName} 
          />
          <InfoRow 
            label="Phone" 
            value={isMissing(patient.emergencyContactPhone) ? 'No phone on file' : patient.emergencyContactPhone} 
          />
          
          <div className="card-actions">
            <span className="date-tag">Last Updated: Recently</span>
          </div>
        </div>
      </div>

      {/* Insurance Card */}
      <div className="info-section-card">
        <div className="card-header">
          <div className="card-icon-badge">
            <MdVerifiedUser />
          </div>
          <h3 className="card-title">Insurance</h3>
        </div>
        <div className="card-body">
          <InfoRow 
            label="Policy Number" 
            value={isMissing(patient.insuranceNumber) ? 'No insurance on file' : patient.insuranceNumber} 
          />
          <InfoRow 
            label="Expiry Date" 
            value={isMissing(patient.expiryDate) ? 'No expiry date' : patient.expiryDate} 
          />
          
          <div className="card-actions">
            <span className="date-tag">Verified: Recently</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => {
  const displayValue = (!value || value.trim() === '' || value === '—') ? 'Not Provided' : value;
  
  return (
    <div className="info-row">
      <span className="info-label">{label.toUpperCase()}</span>
      <span className="info-value" style={{ color: displayValue === 'Not Provided' ? '#9ca3af' : '#0b1324' }}>
        {displayValue}
      </span>
    </div>
  );
};

// ============ MEDICAL HISTORY TAB ============
const MedicalHistoryTab = ({ patient }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadMedicalHistory();
  }, [patient?.patientId]);

  const loadMedicalHistory = async () => {
    if (!patient?.patientId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('📋 [MEDICAL HISTORY] Fetching for patient:', patient.patientId);
      
      const data = await fetchMedicalHistory(patient.patientId, 100, 0);
      setHistory(data);
      console.log('📦 [MEDICAL HISTORY] Received', data.length, 'records');
    } catch (err) {
      console.error('❌ [MEDICAL HISTORY] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const extractTitle = (record) => {
    return record.title || record.diagnosis || record.condition || 'Medical Record';
  };

  const extractDate = (record) => {
    try {
      const date = record.reportDate || record.uploadDate || record.date || record.createdAt;
      if (!date) return '—';
      return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const extractCategory = (record) => {
    return record.category || record.type || 'General';
  };

  const extractNotes = (record) => {
    const extractedData = record.extractedData;
    if (extractedData?.medicalHistory) {
      // Handle if medicalHistory is a string
      if (typeof extractedData.medicalHistory === 'string') {
        const text = extractedData.medicalHistory;
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
      }
      // Handle if medicalHistory is an object with notes
      if (typeof extractedData.medicalHistory === 'object') {
        const text = extractedData.medicalHistory.notes || JSON.stringify(extractedData.medicalHistory);
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
      }
    }
    
    const notes = record.notes || record.description;
    if (notes) {
      if (typeof notes === 'string') {
        return notes.length > 100 ? notes.substring(0, 100) + '...' : notes;
      }
      // Handle if notes is an object
      if (typeof notes === 'object') {
        const text = JSON.stringify(notes);
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
      }
    }
    
    return '—';
  };

  const applyFilters = () => {
    return history.filter(record => {
      const category = extractCategory(record);
      const matchesCategory = categoryFilter === 'All' || category.toLowerCase() === categoryFilter.toLowerCase();
      
      if (!searchQuery.trim()) return matchesCategory;

      const searchLower = searchQuery.toLowerCase();
      const title = extractTitle(record).toLowerCase();
      const notes = extractNotes(record).toLowerCase();
      const date = extractDate(record).toLowerCase();
      
      return matchesCategory && (title.includes(searchLower) || notes.includes(searchLower) || date.includes(searchLower));
    });
  };

  const filtered = applyFilters();
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const pageData = filtered.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="tab-loading">
        <div className="loading-spinner"></div>
        <p>Loading medical history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-error">
        <p className="error-message">Failed to load medical history</p>
        <button onClick={loadMedicalHistory} className="retry-button">Retry</button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="tab-empty">
        <MdHistory size={64} />
        <h3>No medical history found</h3>
        <p>Medical history records will appear here once uploaded</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h3 className="table-title">Medical History</h3>
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="table-search"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="table-filter"
          >
            <option value="All">All</option>
            <option value="General">General</option>
            <option value="Chronic">Chronic</option>
            <option value="Acute">Acute</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Category</th>
              <th>Notes</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((record, index) => (
              <tr key={index}>
                <td>{extractTitle(record)}</td>
                <td>{extractDate(record)}</td>
                <td>{extractCategory(record)}</td>
                <td>{extractNotes(record)}</td>
                <td>
                  {record.pdfId ? (
                    <button className="view-doc-btn">View</button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ============ PRESCRIPTION TAB ============
const PrescriptionTab = ({ patient }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPrescriptions();
  }, [patient?.patientId]);

  const loadPrescriptions = async () => {
    if (!patient?.patientId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('💊 [PRESCRIPTIONS] Fetching for patient:', patient.patientId);
      
      const data = await fetchPrescriptions(patient.patientId, 100, 0);
      setPrescriptions(data);
      console.log('📦 [PRESCRIPTIONS] Received', data.length, 'prescriptions');
    } catch (err) {
      console.error('❌ [PRESCRIPTIONS] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const extractMedicineName = (medicine) => {
    return medicine.testName || medicine.name || medicine.medicineName || medicine.medicine || 'Unknown Medicine';
  };

  const extractDosage = (medicine) => {
    return medicine.value || medicine.dosage || medicine.dose || '—';
  };

  const extractFrequency = (medicine) => {
    return medicine.normalRange || medicine.frequency || medicine.freq || '—';
  };

  const extractDuration = (medicine) => {
    return medicine.flag || medicine.duration || '—';
  };

  const extractInstructions = (medicine) => {
    return medicine.notes || medicine.instructions || '—';
  };

  const extractDate = (prescription) => {
    try {
      const date = prescription.prescriptionDate || prescription.uploadDate || prescription.date || prescription.createdAt;
      if (!date) return '—';
      return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Flatten prescriptions to show each medicine as a row
  const flattenedData = prescriptions.flatMap(prescription => {
    const results = prescription.results;
    const prescriptionDate = extractDate(prescription);
    const pdfId = prescription.pdfId;
    
    if (results && Array.isArray(results) && results.length > 0) {
      return results.map(medicine => ({
        ...medicine,
        prescriptionDate,
        pdfId,
        originalPrescription: prescription
      }));
    }
    return [];
  });

  const applyFilters = () => {
    return flattenedData.filter(item => {
      if (!searchQuery.trim()) return true;

      const searchLower = searchQuery.toLowerCase();
      const medicineName = extractMedicineName(item).toLowerCase();
      const dosage = extractDosage(item).toLowerCase();
      const frequency = extractFrequency(item).toLowerCase();
      
      return medicineName.includes(searchLower) || dosage.includes(searchLower) || frequency.includes(searchLower);
    });
  };

  const filtered = applyFilters();
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const pageData = filtered.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="tab-loading">
        <div className="loading-spinner"></div>
        <p>Loading prescriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-error">
        <p className="error-message">Failed to load prescriptions</p>
        <button onClick={loadPrescriptions} className="retry-button">Retry</button>
      </div>
    );
  }

  if (flattenedData.length === 0) {
    return (
      <div className="tab-empty">
        <MdMedication size={64} />
        <h3>No prescriptions found</h3>
        <p>Prescription records will appear here once uploaded</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h3 className="table-title">Prescriptions</h3>
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="table-search"
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Instructions</th>
              <th>Date</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((item, index) => (
              <tr key={index}>
                <td>{extractMedicineName(item)}</td>
                <td>{extractDosage(item)}</td>
                <td>{extractFrequency(item)}</td>
                <td>{extractDuration(item)}</td>
                <td>{extractInstructions(item)}</td>
                <td>{item.prescriptionDate}</td>
                <td>
                  {item.pdfId ? (
                    <button className="view-doc-btn">View</button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ============ LAB RESULTS TAB ============
const LabResultsTab = ({ patient }) => {
  const [labReports, setLabReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadLabReports();
  }, [patient?.patientId]);

  const loadLabReports = async () => {
    if (!patient?.patientId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('🔬 [LAB RESULTS] Fetching for patient:', patient.patientId);
      
      const data = await fetchLabReports(patient.patientId, 100, 0);
      setLabReports(data);
      console.log('📦 [LAB RESULTS] Received', data.length, 'reports');
    } catch (err) {
      console.error('❌ [LAB RESULTS] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const extractTestName = (report) => {
    return report.testType || report.testName || report.name || 'Lab Test';
  };

  const extractValue = (report) => {
    const resultsCount = report.resultsCount;
    if (resultsCount && resultsCount > 0) {
      return `${resultsCount} parameters`;
    }
    
    const results = report.results;
    if (!results) return '—';
    
    if (Array.isArray(results)) {
      return results.length === 0 ? 'Pending' : `${results.length} parameters`;
    }
    
    return '—';
  };

  const extractDate = (report) => {
    try {
      const date = report.reportDate || report.uploadDate || report.date || report.createdAt;
      if (!date) return '—';
      return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const getStatus = (report) => {
    const resultsCount = report.resultsCount;
    if (resultsCount && resultsCount > 0) return 'Completed';
    
    const results = report.results;
    if (!results || (Array.isArray(results) && results.length === 0)) return 'Pending';
    
    return 'Completed';
  };

  const applyFilters = () => {
    return labReports.filter(report => {
      const status = getStatus(report);
      const matchesStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
      
      if (!searchQuery.trim()) return matchesStatus;

      const searchLower = searchQuery.toLowerCase();
      const testName = extractTestName(report).toLowerCase();
      const value = extractValue(report).toLowerCase();
      const date = extractDate(report).toLowerCase();
      
      return matchesStatus && (testName.includes(searchLower) || value.includes(searchLower) || date.includes(searchLower));
    });
  };

  const filtered = applyFilters();
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const pageData = filtered.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="tab-loading">
        <div className="loading-spinner"></div>
        <p>Loading lab reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-error">
        <p className="error-message">Failed to load lab reports</p>
        <button onClick={loadLabReports} className="retry-button">Retry</button>
      </div>
    );
  }

  if (labReports.length === 0) {
    return (
      <div className="tab-empty">
        <MdBiotech size={64} />
        <h3>No lab reports found</h3>
        <p>Lab results will appear here once tests are uploaded</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h3 className="table-title">Lab Results</h3>
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="table-search"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="table-filter"
          >
            <option value="All">All</option>
            <option value="Normal">Normal</option>
            <option value="Abnormal">Abnormal</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Result</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((report, index) => {
              const status = getStatus(report);
              return (
                <tr key={index}>
                  <td>{extractTestName(report)}</td>
                  <td>{extractValue(report)}</td>
                  <td>{extractDate(report)}</td>
                  <td>
                    <span className={`status-badge status-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ============ BILLINGS TAB ============
const BillingsTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Sample billing data
  const billingData = Array.from({ length: 12 }, (_, i) => ({
    invoice: `INV-${1000 + i}`,
    date: `2025-08-${String(10 + i).padStart(2, '0')}`,
    amount: `${500 + i * 20}`,
    method: i % 2 === 0 ? 'Credit Card' : 'Cash',
    due: `2025-09-${String(10 + i).padStart(2, '0')}`,
    status: i % 3 === 0 ? 'Unpaid' : 'Paid',
    comment: `Billing for visit ${i + 1}`
  }));

  const applyFilters = () => {
    return billingData.filter(item => {
      const matchesStatus = statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase();
      
      if (!searchQuery.trim()) return matchesStatus;

      const searchLower = searchQuery.toLowerCase();
      const searchStr = Object.values(item).join(' ').toLowerCase();
      
      return matchesStatus && searchStr.includes(searchLower);
    });
  };

  const filtered = applyFilters();
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const pageData = filtered.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h3 className="table-title">Billings</h3>
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="table-search"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="table-filter"
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Due Date</th>
              <th>Comment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((item, index) => (
              <tr key={index}>
                <td>{item.invoice}</td>
                <td>{item.date}</td>
                <td>₹{item.amount}</td>
                <td>{item.method}</td>
                <td>{item.due}</td>
                <td>{item.comment}</td>
                <td>
                  <span className={`status-badge status-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentPreviewDialog;

/**
 * PatientsReal.jsx
 * Patients page with REAL API integration
 * React equivalent of Flutter's PatientsScreen with live backend data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import patientsService from '../../../services/patientsService';
import './Patients.css';

// Custom SVG Icons (matching Appointments)
const Icons = {
  Doctor: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  )
};

const Patients = () => {
  // State management
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [ageRangeFilter, setAgeRangeFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const itemsPerPage = 10;

  // Fetch patients from API
  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientsService.fetchPatients({ limit: 100 });
      console.log('✅ Fetched patients:', data);
      
      // Transform data to match expected structure
      const transformedData = data.map(patient => ({
        id: patient._id || patient.id || patient.patientId,
        name: patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown',
        age: patient.age || 0,
        gender: patient.gender || 'Other',
        lastVisit: patient.lastVisit || patient.lastVisitDate || patient.updatedAt || '',
        doctor: extractDoctorName(patient),
        condition: extractCondition(patient),
        reason: patient.reason || '',
        patientId: patient.patientId || patient._id || patient.id,
      }));
      
      setPatients(transformedData);
      setFilteredPatients(transformedData);
    } catch (error) {
      console.error('❌ Failed to fetch patients:', error);
      alert('Failed to load patients: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Extract doctor name from various fields
  const extractDoctorName = (patient) => {
    if (patient.doctor) {
      if (typeof patient.doctor === 'object') {
        return patient.doctor.name || patient.doctor.fullName || '';
      }
      return patient.doctor;
    }
    if (patient.assignedDoctor) return patient.assignedDoctor;
    if (patient.doctorName) return patient.doctorName;
    if (patient.doctorId) return patient.doctorId;
    return '';
  };

  // Extract condition from medical history or notes
  const extractCondition = (patient) => {
    if (patient.condition && patient.condition.trim()) {
      return patient.condition;
    }
    
    if (patient.medicalHistory && Array.isArray(patient.medicalHistory) && patient.medicalHistory.length > 0) {
      if (patient.medicalHistory.length === 1) {
        return patient.medicalHistory[0];
      }
      return `${patient.medicalHistory[0]} +${patient.medicalHistory.length - 1}`;
    }
    
    if (patient.metadata?.medicalHistory && Array.isArray(patient.metadata.medicalHistory) && patient.metadata.medicalHistory.length > 0) {
      const history = patient.metadata.medicalHistory;
      if (history.length === 1) {
        return history[0];
      }
      return `${history[0]} +${history.length - 1}`;
    }
    
    if (patient.metadata?.condition && patient.metadata.condition.trim()) {
      return patient.metadata.condition;
    }
    
    if (patient.notes && patient.notes.trim()) {
      const notes = patient.notes.trim();
      return notes.length > 30 ? `${notes.substring(0, 30)}...` : notes;
    }
    
    return 'N/A';
  };

  // Load patients on mount
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Filter patients
  useEffect(() => {
    let filtered = [...patients];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(patient => {
        const name = (patient.name || '').toLowerCase();
        const doctor = (patient.doctor || '').toLowerCase();
        const id = (patient.id || '').toLowerCase();
        const patientId = (patient.patientId || '').toLowerCase();
        const condition = (patient.condition || '').toLowerCase();
        
        return name.includes(query) ||
               doctor.includes(query) ||
               id.includes(query) ||
               patientId.includes(query) ||
               condition.includes(query);
      });
    }

    // Apply doctor filter
    if (doctorFilter !== 'All') {
      filtered = filtered.filter(patient => 
        patient.doctor === doctorFilter
      );
    }

    // Apply gender filter
    if (genderFilter !== 'All') {
      filtered = filtered.filter(patient => 
        patient.gender.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    // Apply age range filter
    if (ageRangeFilter !== 'All') {
      filtered = filtered.filter(patient => {
        const age = patient.age;
        switch (ageRangeFilter) {
          case '0-18': return age >= 0 && age <= 18;
          case '19-35': return age >= 19 && age <= 35;
          case '36-50': return age >= 36 && age <= 50;
          case '51-65': return age >= 51 && age <= 65;
          case '65+': return age > 65;
          default: return true;
        }
      });
    }

    setFilteredPatients(filtered);
    setCurrentPage(0); // Reset to first page
  }, [searchQuery, doctorFilter, genderFilter, ageRangeFilter, patients]);

  // Get unique doctors for filter
  const uniqueDoctors = ['All', ...new Set(
    patients
      .map(patient => patient.doctor)
      .filter(doctor => doctor && doctor.trim())
  )];

  // Age range options
  const ageRanges = ['All', '0-18', '19-35', '36-50', '51-65', '65+'];
  
  // Gender options
  const genderOptions = ['All', 'Male', 'Female', 'Other'];

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setDoctorFilter('All');
    setGenderFilter('All');
    setAgeRangeFilter('All');
    setShowAdvancedFilters(false);
  };



  // Check if any filter is active
  const hasActiveFilters = searchQuery || 
                          doctorFilter !== 'All' || 
                          genderFilter !== 'All' || 
                          ageRangeFilter !== 'All';

  // Pagination
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPatients.length);
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  // Handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleAdd = () => {
    alert('Add new patient modal will open here');
    // TODO: Open NewPatientModal
  };

  const handleView = async (patient) => {
    try {
      const fullPatient = await patientsService.fetchPatientById(patient.id);
      console.log('View patient:', fullPatient);
      alert(`View: ${patient.name}`);
      // TODO: Open PatientPreviewModal
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
      alert('Failed to load patient details: ' + error.message);
    }
  };

  const handleEdit = async (patient) => {
    try {
      const fullPatient = await patientsService.fetchPatientById(patient.id);
      console.log('Edit patient:', fullPatient);
      alert(`Edit: ${patient.name}`);
      // TODO: Open EditPatientModal
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
      alert('Failed to load patient details: ' + error.message);
    }
  };

  const handleDelete = async (patient) => {
    const confirmed = window.confirm(
      `Delete patient ${patient.name}?`
    );
    
    if (!confirmed) return;

    try {
      setIsLoading(true);
      await patientsService.deletePatient(patient.id);
      console.log('✅ Deleted patient:', patient.id);
      alert(`Deleted patient ${patient.name}`);
      await fetchPatients(); // Refresh list
    } catch (error) {
      console.error('❌ Failed to delete patient:', error);
      alert('Failed to delete patient: ' + error.message);
      setIsLoading(false);
    }
  };

  const handleDownload = async (patient) => {
    setIsDownloading(true);
    try {
      const result = await patientsService.downloadPatientReport(patient.id);
      if (result.success) {
        alert(result.message || 'Report downloaded successfully');
      } else {
        alert(result.message || 'Failed to download report');
      }
    } catch (error) {
      console.error('❌ Failed to download report:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Format date
  const formatLastVisit = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">Patient Management</h1>
          <p className="main-subtitle">Manage patient records, medical history, and appointments.</p>
        </div>
        <button className="btn-new-appointment" onClick={handleAdd}>
          <span>+</span> New Patient
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar-container">
        <div className="search-wrapper">
          <span className="search-icon-lg"><MdSearch size={18} /></span>
          <input
            type="text"
            placeholder="Search by patient name, doctor, or ID..."
            className="search-input-lg"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-right-group">
          <div className="tabs-wrapper">
            <button
              className={`tab-btn ${genderFilter === 'All' ? 'active' : ''}`}
              onClick={() => setGenderFilter('All')}
            >
              All
            </button>
            <button
              className={`tab-btn ${genderFilter === 'Male' ? 'active' : ''}`}
              onClick={() => setGenderFilter('Male')}
            >
              Male
            </button>
            <button
              className={`tab-btn ${genderFilter === 'Female' ? 'active' : ''}`}
              onClick={() => setGenderFilter('Female')}
            >
              Female
            </button>
          </div>
          <button 
            className="btn-filter-date"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            More Filters <span style={{ fontSize: '11px', marginLeft: '2px' }}>▼</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="filter-bar-container" style={{ marginTop: '12px' }}>
          <div className="filter-right-group" style={{ flex: 1, justifyContent: 'flex-start', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Doctor</label>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
              >
                {uniqueDoctors.map(doctor => (
                  <option key={doctor} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Age Range</label>
              <select
                value={ageRangeFilter}
                onChange={(e) => setAgeRangeFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
              >
                {ageRanges.map(range => (
                  <option key={range} value={range}>{range === 'All' ? 'All Ages' : range}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{ alignSelf: 'flex-end', padding: '8px 16px', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#EF4444', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="table-card">
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Patient</th>
                <th style={{ width: '10%' }}>Age</th>
                <th style={{ width: '12%' }}>Gender</th>
                <th style={{ width: '15%' }}>Last Visit</th>
                <th style={{ width: '18%' }}>Doctor</th>
                <th style={{ width: '15%' }}>Condition</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.map((patient, index) => {
                const genderStr = (patient.gender || '').toLowerCase().trim();
                const avatarSrc = genderStr.includes('female') || genderStr.startsWith('f') 
                  ? '/girlicon.png' 
                  : '/boyicon.png';

                return (
                  <tr key={patient.id || index}>
                    {/* PATIENT COLUMN */}
                    <td className="cell-patient">
                      <img 
                        src={avatarSrc} 
                        alt={patient.gender}
                        className="patient-avatar"
                      />
                      <div className="info-group">
                        <span className="primary">{patient.name}</span>
                        <span className="secondary">{patient.patientId || patient.id}</span>
                      </div>
                    </td>

                    {/* AGE */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.age}</td>

                    {/* GENDER */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.gender}</td>

                    {/* LAST VISIT */}
                    <td>
                      <div className="info-group">
                        <span className="primary">{formatLastVisit(patient.lastVisit)}</span>
                      </div>
                    </td>

                    {/* DOCTOR */}
                    <td>
                      <div className="cell-doctor">
                        <div className="doc-avatar-sm">
                          <Icons.Doctor />
                        </div>
                        <span className="font-medium">{patient.doctor || 'Not Assigned'}</span>
                      </div>
                    </td>

                    {/* CONDITION */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.condition}</td>

                    {/* ACTIONS */}
                    <td>
                      <div className="action-buttons-group">
                        <button className="btn-action view" title="View" onClick={() => handleView(patient)}>
                          <Icons.Eye />
                        </button>
                        <button className="btn-action edit" title="Edit" onClick={() => handleEdit(patient)}>
                          <Icons.Edit />
                        </button>
                        <button className="btn-action delete" title="Delete" onClick={() => handleDelete(patient)}>
                          <Icons.Delete />
                        </button>
                        <button className="btn-action download" title="Download" onClick={() => handleDownload(patient)} disabled={isDownloading}>
                          <Icons.Download />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {isLoading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      <span>Loading patients...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && paginatedPatients.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    No patients found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination-footer">
          <button
            className="page-arrow-circle leading"
            disabled={currentPage === 0}
            onClick={handlePreviousPage}
          >
            <MdChevronLeft size={20} />
          </button>

          <div className="page-indicator-box">
            Page {currentPage + 1} of {totalPages || 1}
          </div>

          <button
            className="page-arrow-circle trailing"
            disabled={currentPage >= totalPages - 1 || totalPages === 0}
            onClick={handleNextPage}
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Patients;

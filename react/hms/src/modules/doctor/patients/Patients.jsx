/**
 * DoctorPatients.jsx
 * Doctor's patient management page - EXACTLY matching admin design
 * Filters patients for the logged-in doctor only
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MdSearch, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import patientsService from '../../../services/patientsService';
import reportService from '../../../services/reportService';
import PatientView from '../../../components/patient/patientview';
import FollowUpDialog from '../../../components/doctor/FollowUpDialog';
import './Patients.css';

// Toast notification helper
const toast = {
  success: (msg) => {
    console.log('✅ SUCCESS:', msg);
    alert(msg);
  },
  error: (msg) => {
    console.error('❌ ERROR:', msg);
    alert(msg);
  },
  info: (msg) => {
    console.log('ℹ️ INFO:', msg);
  }
};

// Custom SVG Icons (matching admin)
const Icons = {
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
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

// Configuration constants
const CONFIG = {
  ITEMS_PER_PAGE: 10,
  DEBOUNCE_DELAY: 300
};

const DoctorPatients = () => {
  // State management
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingPatients, setDownloadingPatients] = useState(new Set());
  const [loadingPatientId, setLoadingPatientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [genderFilter, setGenderFilter] = useState('All');
  const [ageRangeFilter, setAgeRangeFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal state management
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [selectedFollowUpPatient, setSelectedFollowUpPatient] = useState(null);

  // Refs for cleanup
  const abortControllerRef = useRef(null);

  const itemsPerPage = CONFIG.ITEMS_PER_PAGE;

  // Fetch patients from API - Doctor's patients only
  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch patients assigned to this doctor
      const data = await patientsService.fetchMyPatients();

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Fetched doctor patients:', data);
      }

      // Helper functions for data extraction (same as admin)
      const normalizeGender = (gender) => {
        if (!gender) return 'Other';
        const normalized = gender.toString().trim();
        const lower = normalized.toLowerCase();
        if (lower === 'male' || lower === 'm') return 'Male';
        if (lower === 'female' || lower === 'f') return 'Female';
        return normalized;
      };

      const formatCondition = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (!trimmed) return null;
          return trimmed.length > 30 ? `${trimmed.substring(0, 30)}...` : trimmed;
        }
        if (Array.isArray(value) && value.length > 0) {
          return value.length === 1 ? value[0] : `${value[0]} +${value.length - 1}`;
        }
        return null;
      };

      const extractCondition = (patient) => {
        if (!patient) return 'N/A';
        const sources = [
          patient.condition,
          patient.medicalHistory,
          patient.metadata?.medicalHistory,
          patient.metadata?.condition,
          patient.notes
        ];
        for (const source of sources) {
          const condition = formatCondition(source);
          if (condition) return condition;
        }
        return 'N/A';
      };

      // Transform data to match expected structure
      const transformedData = data.map((patient, index) => ({
        id: patient._id || patient.id || patient.patientId || `temp-${index}-${Date.now()}`,
        name: patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown',
        age: patient.age || 0,
        gender: normalizeGender(patient.gender),
        lastVisit: patient.lastVisit || patient.lastVisitDate || patient.updatedAt || '',
        condition: extractCondition(patient),
        reason: patient.reason || '',
        patientId: patient.patientId || patient._id || patient.id,
        patientCode: patient.patientCode || patient.patient_code || patient.metadata?.patientCode || null,
      }));

      setPatients(transformedData);
      setFilteredPatients(transformedData);
    } catch (error) {
      console.error('❌ Failed to fetch patients:', error);
      toast.error('Failed to load patients: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load patients on mount and cleanup on unmount
  useEffect(() => {
    // Reset state on mount to ensure fresh start
    setIsLoading(true);
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(0);
    setGenderFilter('All');
    setAgeRangeFilter('All');
    setShowAdvancedFilters(false);
    
    fetchPatients();

    // Cleanup function to cancel pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPatients]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, CONFIG.DEBOUNCE_DELAY);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Filter patients - using debounced search
  useEffect(() => {
    let filtered = [...patients];

    // Apply search filter with debounced value
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(patient => {
        const name = (patient.name || '').toLowerCase();
        const id = (patient.id || '').toLowerCase();
        const patientId = (patient.patientId || '').toLowerCase();
        const condition = (patient.condition || '').toLowerCase();

        return name.includes(query) ||
          id.includes(query) ||
          patientId.includes(query) ||
          condition.includes(query);
      });
    }

    // Apply gender filter with proper case handling
    if (genderFilter !== 'All') {
      filtered = filtered.filter(patient => {
        const patientGender = (patient.gender || '').trim();
        return patientGender.toLowerCase() === genderFilter.toLowerCase();
      });
    }

    // Apply age range filter
    if (ageRangeFilter !== 'All') {
      filtered = filtered.filter(patient => {
        const age = patient.age || 0;
        if (age < 0) return false;

        switch (ageRangeFilter) {
          case '0-18': return age <= 18;
          case '19-35': return age >= 19 && age <= 35;
          case '36-50': return age >= 36 && age <= 50;
          case '51-65': return age >= 51 && age <= 65;
          case '65+': return age >= 66;
          default: return true;
        }
      });
    }

    // Sort alphabetically by name
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    setFilteredPatients(filtered);
    setCurrentPage(0); // Reset to first page
  }, [debouncedSearch, genderFilter, ageRangeFilter, patients]);

  // Age range options
  const ageRanges = ['All', '0-18', '19-35', '36-50', '51-65', '65+'];

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setGenderFilter('All');
    setAgeRangeFilter('All');
    setShowAdvancedFilters(false);
  }, []);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() =>
    searchQuery ||
    genderFilter !== 'All' ||
    ageRangeFilter !== 'All',
    [searchQuery, genderFilter, ageRangeFilter]
  );

  // Pagination
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPatients.length);
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  // Handlers - memoized for performance
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handleView = useCallback(async (patient) => {
    const id = patient.id || patient.patientId || patient._id;
    if (!id) {
      toast.error('Invalid patient data');
      return;
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoadingPatientId(id);

    try {
      const fullPatient = await patientsService.fetchPatientById(id);

      if (process.env.NODE_ENV === 'development') {
        console.log('View patient:', fullPatient);
      }

      setActiveModal('view');
      setModalData(fullPatient);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      console.error('Failed to fetch patient details:', error);
      toast.error('Failed to load patient details: ' + error.message);
    } finally {
      setLoadingPatientId(null);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Handle Patient Report Download
   */
  const handleDownload = useCallback(async (patient) => {
    const id = patient?.id || patient?.patientId || patient?._id;
    if (!patient || !id) {
      toast.error('Invalid patient data for download');
      return;
    }

    // Add patient ID to downloading set
    setDownloadingPatients(prev => new Set(prev).add(id));

    try {
      const result = await reportService.downloadPatientReport(id);

      if (result.success) {
        toast.success(result.message || 'Patient report downloaded successfully');
      } else {
        toast.error(result.message || 'Failed to download report');
      }
    } catch (error) {
      console.error('❌ Failed to download report:', error);
      toast.error('Error downloading report: ' + error.message);
    } finally {
      // Remove patient ID from downloading set
      setDownloadingPatients(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  // Modal close handler
  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const handleFollowUpClick = useCallback((patient, event) => {
    if (event) event.stopPropagation();
    setSelectedFollowUpPatient(patient);
    setShowFollowUpDialog(true);
  }, []);

  const handleCloseFollowUpDialog = useCallback(() => {
    setShowFollowUpDialog(false);
    setSelectedFollowUpPatient(null);
  }, []);

  const handleFollowUpSuccess = useCallback(() => {
    setShowFollowUpDialog(false);
    setSelectedFollowUpPatient(null);
    fetchPatients();
  }, [fetchPatients]);

  // Format date with proper validation
  const formatLastVisit = useCallback((dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle if no modal is open
      if (activeModal || showFollowUpDialog) return;

      if (e.key === 'ArrowLeft' && currentPage > 0) {
        handlePreviousPage();
      }
      if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, activeModal, showFollowUpDialog, handlePreviousPage, handleNextPage]);

  return (
    <div id="doctor-patients-page" className="patients-page dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 
            className="patients-main-title"
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              textTransform: 'uppercase'
            }}
          >
            MY PATIENTS
          </h1>
          <p 
            className="patients-main-subtitle"
            style={{
              fontSize: '14px',
              color: '#64748B',
              margin: '4px 0 0 0',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            View and manage your assigned patients.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar-container">
        <div className="search-group">
          <div className="search-wrapper">
            <span className="search-icon-lg"><MdSearch size={18} /></span>
            <input
              type="text"
              placeholder="Search by patient name or ID..."
              className="search-input-lg"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
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
                <th style={{ width: '30%' }}>Patient Name</th>
                <th style={{ width: '10%' }}>Age</th>
                <th style={{ width: '12%' }}>Gender</th>
                <th style={{ width: '18%' }}>Last Visit</th>
                <th style={{ width: '18%' }}>Condition</th>
                <th style={{ width: '12%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.map((patient) => {
                const genderStr = (patient.gender || '').toLowerCase().trim();
                const avatarSrc = genderStr.includes('female') || genderStr.startsWith('f')
                  ? '/girlicon.png'
                  : '/boyicon.png';

                return (
                  <tr key={patient.id}>
                    {/* PATIENT COLUMN */}
                    <td>
                      <div className="cell-patient">
                        <img
                          src={avatarSrc}
                          alt={patient.gender}
                          className="patient-avatar"
                        />
                        <div className="info-group">
                          <span className="primary font-semibold">{patient.name}</span>
                          <span className="secondary opacity-60 text-xs">
                            {patient.patientCode || 'PAT-SYNCING...'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* AGE */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.age}</td>

                    {/* GENDER */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.gender}</td>

                    {/* LAST VISIT */}
                    <td>
                      <span className="primary">{formatLastVisit(patient.lastVisit)}</span>
                    </td>

                    {/* CONDITION */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.condition}</td>

                    {/* ACTIONS */}
                    <td>
                      <div className="action-buttons-group">
                        <button
                          className="btn-action view"
                          title="View patient details"
                          aria-label={`View details for ${patient.name}`}
                          onClick={() => handleView(patient)}
                          disabled={loadingPatientId === patient.id}
                        >
                          {loadingPatientId === patient.id ? '...' : <Icons.Eye />}
                        </button>
                        <button
                          className="btn-action edit"
                          title="Schedule Follow-Up"
                          aria-label={`Schedule follow-up for ${patient.name}`}
                          onClick={(e) => handleFollowUpClick(patient, e)}
                        >
                          <Icons.Calendar />
                        </button>
                        <button
                          className="btn-action download"
                          title="Download report"
                          aria-label={`Download report for ${patient.name}`}
                          onClick={() => handleDownload(patient)}
                          disabled={downloadingPatients.has(patient.id)}
                        >
                          {downloadingPatients.has(patient.id) ? '...' : <Icons.Download />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {isLoading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#207DC0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      <span>Loading patients...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && paginatedPatients.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
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

      {/* Patient Details Modal */}
      {activeModal === 'view' && modalData && (
        <PatientView
          patientId={modalData.id || modalData._id || modalData.patientId}
          isOpen={true}
          onClose={handleCloseModal}
          showBillingTab={false}
        />
      )}

      {/* Follow-Up Dialog */}
      {showFollowUpDialog && selectedFollowUpPatient && (
        <FollowUpDialog
          patient={selectedFollowUpPatient}
          isOpen={showFollowUpDialog}
          onClose={handleCloseFollowUpDialog}
          onSuccess={handleFollowUpSuccess}
        />
      )}
    </div>
  );
};

export default DoctorPatients;

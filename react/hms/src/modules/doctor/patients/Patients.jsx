/**
 * DoctorPatients.jsx
 * Doctor's patient management page - EXACTLY matching admin design
 */

import React, { useState, useEffect, useCallback } from 'react';
import patientsService from '../../../services/patientsService';
import PatientView from '../../../components/patient/patientview';
import FollowUpDialog from '../../../components/doctor/FollowUpDialog';
import { MdSearch, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import './Patients.css';

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
  )
};

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [genderFilter, setGenderFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [selectedFollowUpPatient, setSelectedFollowUpPatient] = useState(null);

  const itemsPerPage = 10;

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientsService.fetchPatients({ limit: 100 });
      
      console.log('📊 Raw patient data from API:', data.slice(0, 2)); // Log first 2 patients

      const transformed = data.map((p, index) => {
        // Extract medical condition from various possible sources
        let condition = 'No diagnosis';
        
        // Try metadata first
        if (p.metadata?.medicalHistory?.currentConditions && Array.isArray(p.metadata.medicalHistory.currentConditions) && p.metadata.medicalHistory.currentConditions.length > 0) {
          condition = p.metadata.medicalHistory.currentConditions.join(', ');
        } else if (p.metadata?.diagnosis && Array.isArray(p.metadata.diagnosis) && p.metadata.diagnosis.length > 0) {
          condition = p.metadata.diagnosis.join(', ');
        } else if (p.medicalHistory && Array.isArray(p.medicalHistory) && p.medicalHistory.length > 0) {
          condition = p.medicalHistory.join(', ');
        } else if (p.diagnosis && Array.isArray(p.diagnosis) && p.diagnosis.length > 0) {
          condition = p.diagnosis.join(', ');
        } else if (p.condition) {
          condition = p.condition;
        } else if (p.reason) {
          condition = p.reason;
        } else if (p.notes) {
          // Use first 50 chars of notes if available
          condition = p.notes.substring(0, 50) + (p.notes.length > 50 ? '...' : '');
        }

        return {
          // Proper ID handling matching admin page
          id: p._id || p.id || p.patientId || `temp-${index}-${Date.now()}`,
          _id: p._id || p.id, // Keep for compatibility
          name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
          age: p.age || 0,
          gender: p.gender || 'Other',
          lastVisit: p.lastVisit || p.lastVisitDate || p.updatedAt || '',
          doctor: p.doctor || p.doctorName || '',
          condition: condition,
          patientId: p.patientId || p._id || p.id, // Patient code/ID
          patientCode: p.patientCode || p.patient_code || p.metadata?.patientCode || null,
          // Keep original data for reference
          ...p
        };
      });

      console.log('✅ Transformed patient data:', transformed.slice(0, 2)); // Log first 2 transformed

      setPatients(transformed);
      setFilteredPatients(transformed);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    let filtered = [...patients];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.patientId && p.patientId.toLowerCase().includes(query)) ||
        (p.doctor && p.doctor.toLowerCase().includes(query))
      );
    }

    if (genderFilter !== 'All') {
      filtered = filtered.filter(p => p.gender === genderFilter);
    }

    setFilteredPatients(filtered);
    setCurrentPage(0);
  }, [searchQuery, genderFilter, patients]);

  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPatients.length);
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const handlePatientClick = async (patient) => {
    console.log('🔍 Patient clicked:', patient);
    
    try {
      // Fetch full patient details using the ID
      const fullPatient = await patientsService.fetchPatientById(patient.id);
      console.log('✅ Fetched full patient:', fullPatient);
      setSelectedPatient(fullPatient);
      setShowPatientDialog(true);
    } catch (error) {
      console.error('❌ Error fetching patient details:', error);
      // Fallback to the patient data we already have
      setSelectedPatient(patient);
      setShowPatientDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setShowPatientDialog(false);
    setSelectedPatient(null);
  };

  const handleFollowUpClick = (patient, event) => {
    event.stopPropagation(); // Prevent row click
    setSelectedFollowUpPatient(patient);
    setShowFollowUpDialog(true);
  };

  const handleCloseFollowUpDialog = () => {
    setShowFollowUpDialog(false);
    setSelectedFollowUpPatient(null);
  };

  const handleFollowUpSuccess = () => {
    setShowFollowUpDialog(false);
    setSelectedFollowUpPatient(null);
    fetchPatients(); // Refresh patient list
  };

  return (
    <>
      <div className="dashboard-container">
        {/* Header - EXACTLY like admin */}
        <div className="patients-header">
          <div className="header-content">
            <h1 className="main-title">My Patients</h1>
            <p className="main-subtitle">View and manage your assigned patients.</p>
          </div>
        </div>

        {/* Search & Filter Bar - EXACTLY like admin */}
        <div className="filter-bar-container">
          <div className="search-wrapper">
            <span className="search-icon-lg"><MdSearch size={18} /></span>
            <input
              type="text"
              placeholder="Search by patient name, doctor, or ID..."
              className="search-input-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
        </div>

        {/* Table Card - EXACTLY like admin */}
        <div className="table-card">
          <div className="modern-table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Patient</th>
                  <th style={{ width: '10%' }}>Age</th>
                  <th style={{ width: '12%' }}>Gender</th>
                  <th style={{ width: '18%' }}>Last Visit</th>
                  <th style={{ width: '18%' }}>Condition</th>
                  <th style={{ width: '12%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px' }}>
                      <div style={{ color: '#94A3AF', fontSize: '14px' }}>Loading patients...</div>
                    </td>
                  </tr>
                ) : paginatedPatients.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px' }}>
                      <div style={{ color: '#94A3AF', fontSize: '14px' }}>No patients found</div>
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((patient, index) => {
                    const genderStr = (patient.gender || '').toLowerCase().trim();
                    const avatarSrc = genderStr.includes('female') || genderStr.startsWith('f')
                      ? '/girlicon.png'
                      : '/boyicon.png';

                    return (
                      <tr key={patient.id || index}>
                        {/* PATIENT COLUMN - Clickable */}
                        <td
                          className="cell-patient clickable"
                          onClick={() => handlePatientClick(patient)}
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={avatarSrc}
                            alt={patient.name}
                            className="avatar-img"
                            onError={(e) => { e.target.src = '/boyicon.png'; }}
                          />
                          <div className="patient-details">
                            <span className="patient-name">{patient.name}</span>
                            <span className="patient-id">ID: {patient.patientCode || patient.metadata?.patientCode || `PAT-${patient.id?.substring(0, 8)}`}</span>
                          </div>
                        </td>

                        {/* AGE COLUMN */}
                        <td className="cell-age">{patient.age}</td>

                        {/* GENDER COLUMN */}
                        <td className="cell-gender">
                          <span className={`badge-gender badge-${genderStr.startsWith('m') ? 'male' : genderStr.startsWith('f') ? 'female' : 'other'}`}>
                            {patient.gender}
                          </span>
                        </td>

                        {/* LAST VISIT COLUMN */}
                        <td className="cell-date">{formatDate(patient.lastVisit)}</td>

                        {/* CONDITION COLUMN */}
                        <td className="cell-condition">{patient.condition}</td>

                        {/* ACTIONS COLUMN */}
                        <td className="cell-actions">
                          <button
                            className="action-btn action-view"
                            title="View Details"
                            onClick={() => handlePatientClick(patient)}
                          >
                            <Icons.Eye />
                          </button>
                          <button
                            className="action-btn action-appt"
                            title="Schedule Follow-Up"
                            onClick={(e) => handleFollowUpClick(patient, e)}
                          >
                            <Icons.Calendar />
                          </button>
                        </td>
                      </tr>
                    );
                  })
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

      {/* Patient Details Dialog - Using same component as Appointments page */}
      <PatientView
        patient={selectedPatient}
        isOpen={showPatientDialog}
        onClose={handleCloseDialog}
        showBillingTab={false}
      />

      {/* Follow-Up Dialog */}
      {showFollowUpDialog && selectedFollowUpPatient && (
        <FollowUpDialog
          patient={selectedFollowUpPatient}
          isOpen={showFollowUpDialog}
          onClose={handleCloseFollowUpDialog}
          onSuccess={handleFollowUpSuccess}
        />
      )}
    </>
  );
};

export default DoctorPatients;

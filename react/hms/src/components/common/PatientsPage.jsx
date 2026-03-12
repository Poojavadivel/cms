/**
 * PatientsPage.jsx
 * Reusable Patients Page Component
 * Used by both Admin and Doctor modules with different configurations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import patientsService from '../../services/patientsService';
import reportService from '../../services/reportService';
import './PatientsPage.css';
import AddPatientModal from '../patient/addpatient';
import EditPatientModal from '../patient/EditPatientModal';
import PatientView from '../patient/patientview';
import FollowUpDialog from '../doctor/FollowUpDialog';
import doctorFemaleIcon from '../../assets/doctor-femaleicon.png';
import doctorMaleIcon from '../../assets/doctor-male icon.png';
import boyIcon from '../../assets/boyicon.png';
import girlIcon from '../../assets/girlicon.png';

// Toast notification helper
const toast = {
  success: (msg) => alert(msg),
  error: (msg) => alert(msg),
  info: (msg) => console.log(msg)
};

// SVG Icons
const Icons = {
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
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Doctor: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
    </svg>
  )
};

/**
 * PatientsPage Component
 * @param {Object} props
 * @param {string} props.role - 'admin' or 'doctor'
 * @param {Function} props.fetchFunction - Custom fetch function (optional)
 * @param {boolean} props.showAddButton - Show add patient button
 * @param {boolean} props.showEditDelete - Show edit/delete actions
 * @param {boolean} props.showFollowUp - Show follow-up action
 * @param {boolean} props.showDoctorColumn - Show doctor column in table
 */
const PatientsPage = ({
  role = 'admin',
  fetchFunction = null,
  showAddButton = true,
  showEditDelete = true,
  showFollowUp = false,
  showDoctorColumn = true
}) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [genderFilter, setGenderFilter] = useState('All');
  
  // Dialogs
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);

  const itemsPerPage = 10;

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use custom fetch function if provided, otherwise use default based on role
      const data = fetchFunction 
        ? await fetchFunction()
        : role === 'doctor'
          ? await patientsService.fetchMyPatients()
          : await patientsService.fetchPatients();
      
      const transformed = (data || []).map(p => ({
        ...p,
        id: p._id || p.id,
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        displayAge: p.age || calculateAge(p.dateOfBirth) || 'N/A',
        displayGender: p.gender || 'Not Specified',
        displayPhone: p.phone || p.mobile || 'N/A',
        displayEmail: p.email || 'N/A',
        patientCode: p.patientCode || p.metadata?.patientCode || 'N/A',
        doctorName: p.assignedDoctor?.firstName 
          ? `Dr. ${p.assignedDoctor.firstName} ${p.assignedDoctor.lastName || ''}`.trim()
          : p.doctorName || 'Not Assigned',
        doctorGender: p.assignedDoctor?.gender || p.doctor?.gender || 'Male'
      }));

      setPatients(transformed);
      setFilteredPatients(transformed);
    } catch (error) {
      console.error('❌ Failed to fetch patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, role]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  useEffect(() => {
    let result = [...patients];

    if (genderFilter !== 'All') {
      result = result.filter(p => 
        (p.gender || '').toLowerCase() === genderFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(query) ||
        (p.patientCode || '').toLowerCase().includes(query) ||
        (p.phone || '').toLowerCase().includes(query) ||
        (p.email || '').toLowerCase().includes(query) ||
        (p.doctorName || '').toLowerCase().includes(query)
      );
    }

    setFilteredPatients(result);
    setCurrentPage(0);
  }, [patients, genderFilter, searchQuery]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDialog(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setShowEditDialog(true);
  };

  const handleDeletePatient = async (patient) => {
    if (!window.confirm(`Are you sure you want to delete ${patient.name}?`)) return;
    
    try {
      await patientsService.deletePatient(patient.id);
      toast.success('Patient deleted successfully');
      fetchPatients();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete patient');
    }
  };

  const handleFollowUp = (patient) => {
    setSelectedPatient(patient);
    setShowFollowUpDialog(true);
  };

  const handleDownloadReport = async (patient) => {
    try {
      const response = await reportService.downloadPatientReport(patient.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `patient_${patient.patientCode}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="patients-page dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">
            {role === 'doctor' ? 'MY PATIENTS' : 'PATIENTS'}
          </h1>
          <p className="main-subtitle">
            {role === 'doctor' ? 'Manage your assigned patients' : 'Manage all hospital patients'}
          </p>
        </div>
        {showAddButton && (
          <div className="header-actions">
            <button className="btn-new-appointment" onClick={() => setShowAddDialog(true)}>
              <Icons.Plus />
              New Patient
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar-container">
        <div className="filter-right-group">
          <div className="tabs-wrapper">
            {['All', 'Male', 'Female'].map(gender => (
              <button
                key={gender}
                className={`tab-btn ${genderFilter === gender ? 'active' : ''}`}
                onClick={() => setGenderFilter(gender)}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        <div className="search-group">
          <div className="search-wrapper">
            <span className="search-icon-lg"><MdSearch size={18} /></span>
            <input
              type="text"
              placeholder="Search by patient name, code, phone, or email..."
              className="search-input-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{filteredPatients.length}</div>
          <div className="stat-label">Total Patients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {filteredPatients.filter(p => (p.gender || '').toLowerCase() === 'male').length}
          </div>
          <div className="stat-label">Male</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {filteredPatients.filter(p => (p.gender || '').toLowerCase() === 'female').length}
          </div>
          <div className="stat-label">Female</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-state">
            <p>No patients found</p>
          </div>
        ) : (
          <div className="modern-table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: showDoctorColumn ? '22%' : '25%' }}>Patient Name</th>
                  <th style={{ width: '10%' }}>Age</th>
                  <th style={{ width: '12%' }}>Gender</th>
                  <th style={{ width: '12%' }}>Phone</th>
                  <th style={{ width: showDoctorColumn ? '15%' : '18%' }}>Email</th>
                  {showDoctorColumn && <th style={{ width: '15%' }}>Doctor</th>}
                  <th style={{ width: '14%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map(patient => {
                  const patientAvatarSrc = (patient.displayGender || '').toLowerCase() === 'female' ? girlIcon : boyIcon;
                  const doctorAvatarSrc = (patient.doctorGender || '').toLowerCase() === 'female' ? doctorFemaleIcon : doctorMaleIcon;
                  
                  return (
                    <tr key={patient.id}>
                      <td>
                        <div className="cell-patient">
                          <img
                            src={patientAvatarSrc}
                            alt={patient.displayGender}
                            className="patient-avatar"
                          />
                          <div className="info-group">
                            <span className="primary font-semibold">{patient.name}</span>
                            <span className="secondary opacity-60 text-xs">
                              {patient.patientCode || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, color: '#334155' }}>{patient.displayAge}</td>
                      <td style={{ fontWeight: 500, color: '#334155' }}>{patient.displayGender}</td>
                      <td style={{ fontWeight: 500, color: '#334155' }}>{patient.displayPhone}</td>
                      <td style={{ fontWeight: 500, color: '#64748B' }}>{patient.displayEmail}</td>
                      {showDoctorColumn && (
                        <td>
                          <div className="cell-doctor">
                            <img
                              src={doctorAvatarSrc}
                              alt={patient.doctorName}
                              className="patient-avatar"
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span>{patient.doctorName}</span>
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="action-buttons-group">
                          <button
                            className="btn-action view"
                            onClick={() => handleViewPatient(patient)}
                            title="View Patient"
                          >
                            <Icons.Eye />
                          </button>
                          {showFollowUp && (
                            <button
                              className="btn-action followup"
                              onClick={() => handleFollowUp(patient)}
                              title="Schedule Follow-Up"
                            >
                              <Icons.Calendar />
                            </button>
                          )}
                          {showEditDelete && (
                            <>
                              <button
                                className="btn-action edit"
                                onClick={() => handleEditPatient(patient)}
                                title="Edit Patient"
                              >
                                <Icons.Edit />
                              </button>
                              <button
                                className="btn-action delete"
                                onClick={() => handleDeletePatient(patient)}
                                title="Delete Patient"
                              >
                                <Icons.Delete />
                              </button>
                            </>
                          )}
                          <button
                            className="btn-action download"
                            onClick={() => handleDownloadReport(patient)}
                            title="Download Report"
                          >
                            <Icons.Download />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-footer">
          <button
            className="page-arrow-circle"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            <MdChevronLeft />
          </button>
          <span className="page-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            className="page-arrow-circle"
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
          >
            <MdChevronRight />
          </button>
        </div>
      )}

      {/* Dialogs */}
      {showPatientDialog && selectedPatient && (
        <PatientView
          patient={selectedPatient}
          onClose={() => {
            setShowPatientDialog(false);
            setSelectedPatient(null);
          }}
        />
      )}

      {showAddDialog && (
        <AddPatientModal
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            setShowAddDialog(false);
            fetchPatients();
          }}
        />
      )}

      {showEditDialog && selectedPatient && (
        <EditPatientModal
          isOpen={showEditDialog}
          patient={selectedPatient}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            setShowEditDialog(false);
            setSelectedPatient(null);
            fetchPatients();
          }}
        />
      )}

      {showFollowUpDialog && selectedPatient && (
        <FollowUpDialog
          patient={selectedPatient}
          isOpen={showFollowUpDialog}
          onClose={() => {
            setShowFollowUpDialog(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            toast.success('Follow-up appointment scheduled successfully');
            setShowFollowUpDialog(false);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientsPage;

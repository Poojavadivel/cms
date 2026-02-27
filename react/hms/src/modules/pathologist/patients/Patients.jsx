/**
 * Patients.jsx
 * Pathologist patients page - reuses admin pathology design system
 */

import React, { useState, useEffect } from 'react';
import {
  MdPeople,
  MdSearch,
  MdVisibility,
  MdChevronLeft,
  MdChevronRight,
  MdPerson
} from 'react-icons/md';
import patientsService from '../../../services/patientsService';
import PatientTestsDialog from './PatientTestsDialog';
import '../../admin/pathology/Pathology.css';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showTestsDialog, setShowTestsDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientsService.fetchPatients({ limit: 100 });
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const query = searchQuery.toLowerCase();
    const name = (patient.name || `${patient.firstName} ${patient.lastName}`).toLowerCase();
    const code = (patient.patientCode || patient.id || '').toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handleViewReports = (patient) => {
    // Open dialog to show patient's test reports
    setSelectedPatient(patient);
    setShowTestsDialog(true);
    console.log('📋 Opening test reports for patient:', patient.name || `${patient.firstName} ${patient.lastName}`);
  };

  const handleCloseDialog = () => {
    setShowTestsDialog(false);
    setSelectedPatient(null);
  };

  return (
    <div className="pathology-page dashboard-container">
      {/* Patient Tests Dialog */}
      <PatientTestsDialog
        isOpen={showTestsDialog}
        onClose={handleCloseDialog}
        patient={selectedPatient}
      />

      {/* Header matching admin pathology design */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">PATIENT TEST HISTORY</h1>
          <p className="main-subtitle">Browse patients and their laboratory test records</p>
        </div>
      </div>

      {/* Search bar matching admin pathology design */}
      <div className="filter-bar-container">
        <div className="search-group" style={{ flex: 1, maxWidth: '600px' }}>
          <div className="search-wrapper" style={{ maxWidth: '100%' }}>
            <MdSearch className="search-icon-lg" />
            <input
              type="text"
              className="search-input-lg"
              placeholder="Search by patient name or code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table with admin pathology styling */}
      <div className="table-card">
        <div className="modern-table-wrapper">
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '60px',
              color: '#64748B',
              fontSize: '14px'
            }}>
              Loading patients...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '60px',
              color: '#64748B',
              fontSize: '14px'
            }}>
              No patients found.
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Patient</th>
                  <th style={{ width: '10%' }}>Age</th>
                  <th style={{ width: '12%' }}>Gender</th>
                  <th style={{ width: '15%' }}>Blood Group</th>
                  <th style={{ width: '18%' }}>Last Visit</th>
                  <th style={{ width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #207DC0, #165a8a)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <MdPerson size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>
                            {patient.name || `${patient.firstName} ${patient.lastName}`}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            {patient.patientCode || 'PAT-00'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#334155', fontWeight: '500' }}>{patient.age} Yrs</td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: patient.gender === 'Female' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: patient.gender === 'Female' ? '#DB2777' : '#2563EB'
                      }}>
                        {patient.gender}
                      </span>
                    </td>
                    <td style={{ color: '#334155', fontWeight: '500' }}>{patient.bloodGroup || 'N/A'}</td>
                    <td style={{ color: '#64748B', fontSize: '13px' }}>
                      {new Date(patient.updatedAt || patient.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewReports(patient)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'white',
                          border: '1.5px solid #E2E8F0',
                          borderRadius: '8px',
                          color: '#207DC0',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#EEF3FF';
                          e.currentTarget.style.borderColor = '#207DC0';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#E2E8F0';
                        }}
                      >
                        <MdVisibility size={16} />
                        View Tests
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination matching admin pathology design */}
        {!loading && filteredPatients.length > 0 && (
          <div className="pagination-footer">
            <button 
              className="page-arrow-circle" 
              onClick={() => setCurrentPage(prev => prev - 1)} 
              disabled={currentPage === 0}
            >
              <MdChevronLeft size={20} />
            </button>
            <div className="page-indicator-box">
              Page {currentPage + 1} of {totalPages || 1}
            </div>
            <button 
              className="page-arrow-circle" 
              onClick={() => setCurrentPage(prev => prev + 1)} 
              disabled={currentPage >= totalPages - 1 || totalPages === 0}
            >
              <MdChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;


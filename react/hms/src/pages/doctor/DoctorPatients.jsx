/**
 * DoctorPatients.jsx
 * Doctor's patient management page - EXACTLY matching admin design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import patientsService from '../../services/patientsService';
import './DoctorPatients.css';

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

  const itemsPerPage = 10;

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientsService.fetchPatients({ limit: 100 });
      
      const transformed = data.map(p => ({
        id: p._id || p.id,
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        age: p.age || 0,
        gender: p.gender || 'Other',
        lastVisit: p.lastVisit || p.lastVisitDate || p.updatedAt || '',
        doctor: p.doctor || p.doctorName || '',
        condition: p.condition || p.reason || 'N/A',
        patientId: p.patientId || p.patientCode || p._id,
      }));
      
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

  return (
    <div className="dashboard-container">
      {/* Header - EXACTLY like admin */}
      <div className="dashboard-header">
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
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ color: '#94A3AF', fontSize: '14px' }}>Loading patients...</div>
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px' }}>
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
                      {/* PATIENT COLUMN */}
                      <td className="cell-patient">
                        <img
                          src={avatarSrc}
                          alt={patient.name}
                          className="avatar-img"
                          onError={(e) => { e.target.src = '/boyicon.png'; }}
                        />
                        <div className="patient-details">
                          <span className="patient-name">{patient.name}</span>
                          <span className="patient-id">ID: {patient.patientId}</span>
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

                      {/* DOCTOR COLUMN */}
                      <td className="cell-doctor">{patient.doctor || 'N/A'}</td>

                      {/* CONDITION COLUMN */}
                      <td className="cell-condition">{patient.condition}</td>

                      {/* ACTIONS COLUMN */}
                      <td className="cell-actions">
                        <button className="action-btn action-view" title="View">
                          <Icons.Eye />
                        </button>
                        <button className="action-btn action-appt" title="Appointments">
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

        {/* Pagination - EXACTLY like admin */}
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{filteredPatients.length}</strong> patients
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
            >
              <MdChevronLeft size={18} />
            </button>
            <span className="pagination-page">
              Page <strong>{currentPage + 1}</strong> of <strong>{totalPages || 1}</strong>
            </span>
            <button
              className="pagination-btn"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              <MdChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;

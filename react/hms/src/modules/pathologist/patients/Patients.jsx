/**
 * Patients.jsx
 * Pathologist patients page - functional implementation with real data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdPeople,
  MdSearch,
  MdVisibility,
  MdChevronLeft,
  MdChevronRight,
  MdPerson
} from 'react-icons/md';
import patientsService from '../../../services/patientsService';
import './Patients.css';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
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

  const handleViewReports = (patientId) => {
    // Navigate to test reports with pre-filled search or filter
    // For now, let's just go to reports
    navigate('/pathologist/test-reports');
  };

  return (
    <div className="pathologist-patients-page">
      <div className="patients-header">
        <h1 className="main-title">Patient Test History</h1>
        <p className="main-subtitle">Browse patients and their laboratory test records</p>
      </div>

      <div className="filter-bar-container">
        <div className="search-wrapper">
          <MdSearch className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or patient code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>
      </div>

      <div className="table-card">
        <div className="modern-table-wrapper">
          {loading ? (
            <div className="empty-state">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="empty-state">No patients found.</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Last Visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="patient-info">
                        <div className="patient-avatar">
                          <MdPerson size={20} />
                        </div>
                        <div className="name-stack">
                          <span className="patient-name">{patient.name || `${patient.firstName} ${patient.lastName}`}</span>
                          <span className="patient-id">{patient.patientCode || 'PAT-00'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{patient.age} Yrs</td>
                    <td>
                      <span className={`gender-badge ${patient.gender === 'Female' ? 'gender-female' : 'gender-male'}`}>
                        {patient.gender}
                      </span>
                    </td>
                    <td>{patient.bloodGroup || 'N/A'}</td>
                    <td>{new Date(patient.updatedAt || patient.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => handleViewReports(patient.id)}
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

        {!loading && filteredPatients.length > 0 && (
          <div className="pagination-footer">
            <span className="page-indicator">
              Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
            </span>
            <div className="page-controls">
              <button
                className="page-btn"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <MdChevronLeft size={20} />
              </button>
              <button
                className="page-btn"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;


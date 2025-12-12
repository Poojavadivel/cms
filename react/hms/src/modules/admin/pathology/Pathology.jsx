/**
 * Pathology.jsx
 * Pathology page with REAL API integration
 * React equivalent of Flutter's PathologyScreen with live backend data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import pathologyService from '../../../services/pathologyService';
import './Pathology.css';

// Custom SVG Icons (matching Appointments)
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
  )
};

const Pathology = () => {
  // State management
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('All');
  const [testTypeFilter, setTestTypeFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  const itemsPerPage = 10;

  // Fetch reports from API
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await pathologyService.fetchReports({ limit: 100 });
      console.log('✅ Fetched pathology reports:', data);
      
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error('❌ Failed to fetch reports:', error);
      alert('Failed to load pathology reports: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load reports on mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports
  useEffect(() => {
    let filtered = [...reports];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        (report.reportId?.toLowerCase() || '').includes(query) ||
        (report.patientName?.toLowerCase() || '').includes(query) ||
        (report.testName?.toLowerCase() || '').includes(query) ||
        (report.patientId?.toLowerCase() || '').includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Apply test type filter
    if (testTypeFilter !== 'All') {
      filtered = filtered.filter(report => report.testType === testTypeFilter);
    }

    setFilteredReports(filtered);
    setCurrentPage(0);
  }, [reports, searchQuery, statusFilter, testTypeFilter]);

  // Get unique values for filters
  const uniqueStatuses = ['All', ...new Set(reports.map(r => r.status).filter(Boolean))];
  const uniqueTestTypes = ['All', ...new Set(reports.map(r => r.testType).filter(Boolean))];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
      const statusLower = (status || '').toLowerCase();
      if (statusLower === 'completed' || statusLower === 'ready') {
        return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
      } else if (statusLower === 'pending' || statusLower === 'in progress') {
        return { bg: 'rgba(251, 146, 60, 0.1)', color: '#FB923C' };
      } else if (statusLower === 'cancelled') {
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
      }
      return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    };

    const style = getStatusStyle(status);
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {status || 'Unknown'}
      </span>
    );
  };

  // Handle actions
  const handleView = (report) => {
    console.log('View report:', report);
    alert(`View Report: ${report.reportId}`);
  };

  const handleEdit = (report) => {
    console.log('Edit report:', report);
    alert(`Edit Report: ${report.reportId}`);
  };

  const handleDownload = async (report) => {
    try {
      setIsDownloading(true);
      await pathologyService.downloadReport(report.id, report.reportId);
      alert(`Report ${report.reportId} downloaded successfully!`);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(`Are you sure you want to delete report ${report.reportId}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      await pathologyService.deleteReport(report.id);
      await fetchReports();
      alert('Report deleted successfully!');
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report: ' + error.message);
      setIsLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">Pathology Reports</h1>
          <p className="main-subtitle">Manage all lab test reports</p>
        </div>
        <button className="btn-new-appointment" onClick={() => alert('Add Report functionality')}>
          + New Report
        </button>
      </div>

      {/* Filters Row */}
      <div className="filter-bar-container">
        <div className="search-wrapper">
          <MdSearch className="search-icon-lg" />
          <input
            type="text"
            placeholder="Search reports by ID, patient name, test name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-lg"
          />
        </div>

        <div className="filter-right-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tab-btn"
          >
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {showAdvancedFilters && (
            <select
              value={testTypeFilter}
              onChange={(e) => setTestTypeFilter(e.target.value)}
              className="tab-btn"
            >
              {uniqueTestTypes.map(type => (
                <option key={type} value={type}>{type || 'All'}</option>
              ))}
            </select>
          )}

          <button
            className="btn-filter-date"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Less Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-card">
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Patient</th>
                <th style={{ width: '25%' }}>Test</th>
                <th style={{ width: '15%' }}>Report Date</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '15%' }}>Technician</th>
                <th style={{ width: '8%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map((report, index) => (
                <tr key={report.id || index}>
                  <td>
                    <div className="info-group">
                      <span className="primary">{report.patientName || 'Unknown'}</span>
                      <span className="secondary">{report.reportId || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="info-group">
                      <span className="primary">{report.testName || 'N/A'}</span>
                      <span className="secondary">{report.testType || 'General'}</span>
                    </div>
                  </td>
                  <td>{formatDate(report.reportDate)}</td>
                  <td><StatusBadge status={report.status} /></td>
                  <td>
                    <span className="technician-badge">{report.technician || 'N/A'}</span>
                  </td>
                  <td>
                    <div className="action-buttons-group">
                      <button className="btn-action view" title="View" onClick={() => handleView(report)}>
                        <Icons.Eye />
                      </button>
                      <button className="btn-action edit" title="Edit" onClick={() => handleEdit(report)}>
                        <Icons.Edit />
                      </button>
                      <button className="btn-action delete" title="Delete" onClick={() => handleDelete(report)}>
                        <Icons.Delete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
                {isLoading && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                        <span>Loading reports...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && currentReports.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                      No reports found matching your criteria.
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
              onClick={handlePrevPage}
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

export default Pathology;

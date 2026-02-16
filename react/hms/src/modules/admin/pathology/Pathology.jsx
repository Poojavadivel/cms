/**
 * Pathology.jsx
 * Pathology page with REAL API integration
 * React equivalent of Flutter's PathologyScreen with live backend data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import pathologyService from '../../../services/pathologyService';
import AddPathologyDialog from './components/AddPathologyDialog';
import PathologyViewDialog from './components/PathologyViewDialog';
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
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

const Header = ({ onAdd }) => (
  <div className="dashboard-header">
    <div className="header-content">
      <h1 className="main-title">PATHOLOGY</h1>
      <p className="main-subtitle">Manage lab test reports and diagnostics</p>
    </div>
    <div className="header-actions">
      <button className="btn-new-appointment" onClick={onAdd}>
        <Icons.Plus /> New Report
      </button>
    </div>
  </div>
);

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
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

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

    // Sort alphabetically by patient name
    filtered.sort((a, b) => (a.patientName || '').localeCompare(b.patientName || ''));

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

  // Handle add new report
  const handleAddReport = () => {
    setEditingReport(null);
    setShowForm(true);
  };

  // Handle edit report
  const handleEditReport = (report) => {
    setEditingReport(report);
    setShowForm(true);
  };

  // Handle form submit
  const handleFormSubmit = async (formData) => {
    try {
      if (editingReport) {
        await pathologyService.updateReport(editingReport.id, formData);
        console.log('✅ Report updated successfully');
      } else {
        await pathologyService.createReport(formData);
        console.log('✅ Report created successfully');
      }

      setShowForm(false);
      setEditingReport(null);
      await fetchReports();
      alert(editingReport ? 'Report updated successfully!' : 'Report created successfully!');
    } catch (error) {
      console.error('❌ Form submission error:', error);
      throw error;
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingReport(null);
  };

  // Handle delete report
  const handleDeleteReport = async (report) => {
    if (window.confirm(`Are you sure you want to delete report ${report.reportId}?`)) {
      try {
        await pathologyService.deleteReport(report.id);
        console.log('✅ Report deleted successfully');
        await fetchReports();
        alert('Report deleted successfully!');
      } catch (error) {
        console.error('❌ Delete error:', error);
        alert('Failed to delete report: ' + error.message);
      }
    }
  };

  // Handle download report (Original file first, then generated fallback)
  const handleDownloadReport = async (report) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // 1. Try to download the original attached file/scan
      await pathologyService.downloadReport(report.id);
      console.log('✅ Original file downloaded');
    } catch (error) {
      console.warn('⚠️ No original file found, using professional generator fallback:', error.message);
      try {
        // 2. Fallback to Professional PDF generation if file doesn't exist
        const fileName = `Report_${(report.patientName || 'Patient').replace(/\s+/g, '_')}_${(report.testName || 'Test').replace(/\s+/g, '_')}.pdf`;
        await pathologyService.downloadProperReport(report.id, fileName);
      } catch (genError) {
        console.error('❌ Generator failed:', genError);
        alert('Failed to download report: ' + genError.message);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
      const statusLower = (status || '').toLowerCase();
      if (statusLower === 'completed' || statusLower === 'ready') {
        return { bg: 'rgba(32, 125, 192, 0.1)', color: '#207DC0' };
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
  const handleView = async (report) => {
    try {
      console.log('View report:', report);
      setSelectedReport(report);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to view report:', error);
      alert('Failed to view report: ' + error.message);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedReport(null);
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
    <div className="pathology-page dashboard-container">
      {showForm && (
        <AddPathologyDialog
          initial={editingReport}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      <Header onAdd={handleAddReport} />

      {/* Filters Row */}
      <div className="filter-bar-container">
        <div className="filter-right-group">
          <div className="tabs-wrapper">
            {uniqueStatuses.map(status => (
              <button
                key={status}
                className={`tab-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            className="btn-filter-date"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Less Filters' : 'More Filters'}
          </button>
        </div>

        <div className="search-group" style={{ flex: 1, maxWidth: '600px' }}>
          <div className="search-wrapper" style={{ maxWidth: '100%' }}>
            <MdSearch className="search-icon-lg" />
            <input
              type="text"
              placeholder="Search reports by ID, patient name, test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-lg"
            />
          </div>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="filter-bar-container" style={{ marginTop: '-12px', borderTop: '1px solid #f1f3f7' }}>
          <div className="tabs-wrapper">
            {uniqueTestTypes.map(type => (
              <button
                key={type}
                className={`tab-btn ${testTypeFilter === type ? 'active' : ''}`}
                onClick={() => setTestTypeFilter(type)}
              >
                {type || 'All Tests'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="table-card">
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Patient</th>
                <th style={{ width: '22%' }}>Test</th>
                <th style={{ width: '15%' }}>Report Date</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '15%' }}>Technician</th>
                <th style={{ width: '14%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map((report, index) => (
                <tr key={report.id || index}>
                  <td>
                    <div className="info-group">
                      <span className="primary">{report.patientName || 'Unknown'}</span>
                      <span className="secondary">{report.patientCode || report.reportId || 'N/A'}</span>
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
                      <button className="btn-action edit" title="Edit" onClick={() => handleEditReport(report)}>
                        <Icons.Edit />
                      </button>
                      <button className="btn-action delete" title="Delete" onClick={() => handleDeleteReport(report)}>
                        <Icons.Delete />
                      </button>
                      <button className="btn-action download" title="Download" onClick={() => handleDownloadReport(report)} disabled={isDownloading}>
                        <Icons.Download />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#207DC0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
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

        <div className="pagination-footer">
          <button className="page-arrow-circle" onClick={handlePrevPage} disabled={currentPage === 0}>
            <Icons.ChevronLeft />
          </button>
          <div className="page-indicator-box">
            Page {currentPage + 1} of {totalPages || 1}
          </div>
          <button className="page-arrow-circle" onClick={handleNextPage} disabled={currentPage === totalPages - 1 || totalPages === 0}>
            <Icons.ChevronRight />
          </button>
        </div>
      </div>

      {showDetail && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-blue-primary text-white">
              <h2 className="text-xl font-bold">Report Details</h2>
              <button onClick={handleCloseDetail} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Icons.X />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 dark-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Patient Name</label>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{selectedReport.patientName}</p>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Patient Code</label>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{selectedReport.patientCode || selectedReport.reportId}</p>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Test Name</label>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{selectedReport.testName}</p>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Test Type</label>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{selectedReport.testType || 'General'}</p>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Report Date</label>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{formatDate(selectedReport.reportDate)}</p>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Technician</label>
                  <p className="text-lg font-semibold text-slate-800 mt-1">{selectedReport.technician}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Status</label>
                  <div className="mt-2 text-lg">
                    <StatusBadge status={selectedReport.status} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Notes / Summary</label>
                  <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-600">
                    {selectedReport.notes || 'No notes provided for this report.'}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end">
              <button
                onClick={handleCloseDetail}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pathology;

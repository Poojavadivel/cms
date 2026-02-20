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
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
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

const Pathology = ({ initialSearchQuery = '' }) => {
  // State management
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('All');
  const [testTypeFilter, setTestTypeFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const itemsPerPage = 10;

  // Update search query when initialSearchQuery prop changes
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      console.log('🔍 Applied initial search filter:', initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Fetch reports from API (both pending tests and completed reports)
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch both pending test orders and completed reports
      const [completedReports, pendingTests] = await Promise.all([
        pathologyService.fetchReports({ limit: 100 }),
        pathologyService.fetchPendingTests({ limit: 50 })
      ]);
      
      console.log('✅ Fetched completed reports:', completedReports.length);
      console.log('✅ Fetched pending tests:', pendingTests.length);

      // Transform pending tests to match report structure
      const pendingWithStatus = pendingTests.map(test => ({
        ...test,
        id: test._id,
        status: 'Pending',
        testName: test.pathologyItems?.[0]?.testName || 'Multiple Tests',
        isPending: true, // Flag to identify pending tests
        // Flatten pathologyItems for display
        testCount: test.pathologyItems?.length || 0
      }));

      // Mark completed reports
      const completedWithStatus = completedReports.map(report => ({
        ...report,
        isPending: false
      }));

      // Combine: Show pending tests first, then completed reports
      const allData = [...pendingWithStatus, ...completedWithStatus];
      
      console.log('📊 Total items:', allData.length, '(Pending:', pendingWithStatus.length, ', Completed:', completedWithStatus.length, ')');

      setReports(allData);
      setFilteredReports(allData);
    } catch (error) {
      console.error('❌ Failed to fetch reports:', error);
      alert('Failed to load pathology data: ' + error.message);
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
        (report.patientName?.toLowerCase() || '').includes(query) ||
        (report.testName?.toLowerCase() || '').includes(query) ||
        (report.patientId?.toLowerCase() || '').includes(query) ||
        (report.patientCode?.toLowerCase() || '').includes(query)
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

  // Handle process pending test (create report from pending order)
  const handleProcessPendingTest = (pendingTest) => {
    // Pre-fill form with pending test data
    const prefilledData = {
      patientId: pendingTest.patientId,
      patientName: pendingTest.patientName,
      appointmentId: pendingTest.appointmentId,
      testName: pendingTest.testName,
      testType: pendingTest.pathologyItems?.[0]?.category || 'General',
      priority: pendingTest.pathologyItems?.[0]?.priority || 'Normal',
      notes: pendingTest.notes || '',
      intakeId: pendingTest._id, // Link back to intake
      pathologyItems: pendingTest.pathologyItems
    };
    
    setEditingReport(prefilledData);
    setShowForm(true);
    
    console.log('📝 Processing pending test:', prefilledData);
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

  // Handle download report (Prioritize professional generator with 2-page merged content)
  const handleDownloadReport = async (report) => {
    if (isDownloading) return;
    setIsDownloading(true);
    console.log('[Pathology] Initiating download for report:', { id: report.id, reportId: report.reportId, testName: report.testName });

    try {
      // 1. Try Professional PDF generation (Merged 2-page doc: details + scan)
      const patientCode = (report.patientCode || 'PAT').replace(/\s+/g, '_');
      const testName = (report.testName || 'Report').replace(/\s+/g, '_');
      const fileName = `Report_${patientCode}_${testName}.pdf`;

      console.log(`[Pathology] Downloading professional PDF: ${fileName} for ID: ${report.id}`);
      await pathologyService.downloadProperReport(report.id, fileName);
      console.log('✅ Professional merged report downloaded');
    } catch (genError) {
      console.warn('⚠️ Professional generator failed:', genError.message);

      // If it's a 404, tell the user what's missing
      if (genError.message.includes('not found')) {
        alert(`Download failed: ${genError.message}`);
        setIsDownloading(false);
        return;
      }

      try {
        // 2. Fallback to raw uploaded file
        console.log('[Pathology] Falling back to raw file download...');
        await pathologyService.downloadReport(report.id);
      } catch (error) {
        console.error('❌ Legacy download failed:', error);
        alert('Failed to download report: ' + error.message);
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
        return { bg: '#dcfce7', color: '#15803d' }; // Professional Green for Completed
      } else if (statusLower === 'pending' || statusLower === 'in progress') {
        return { bg: '#fff7ed', color: '#9a3412' };
      } else if (statusLower === 'cancelled' || statusLower === 'critical') {
        return { bg: '#fef2f2', color: '#991b1b' };
      }
      return { bg: '#f8fafc', color: '#64748b' };
    };

    const style = getStatusStyle(status);
    return (
      <span
        style={{
          padding: '6px 14px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backgroundColor: style.bg,
          color: style.color,
          display: 'inline-flex',
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
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
                <th style={{ width: '15%' }}>Ordered By / Tech</th>
                <th style={{ width: '14%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map((report, index) => (
                <tr key={report.id || index}>
                  <td>
                    <div className="info-group">
                      <span className="primary">{report.patientName || 'Unknown'}</span>
                      <span className="secondary">{report.patientCode || report.patientId || 'PAT-00'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="info-group">
                      <span className="primary">
                        {report.testName || 'N/A'}
                        {report.isPending && report.testCount > 1 && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#64748b' }}>
                            +{report.testCount - 1} more
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="secondary">{report.testType || report.testCategory || 'General'}</span>
                        {report.isPending && (
                          <span className="artifact-tag" style={{ background: '#dbeafe', color: '#1e40af' }} title="Pending Order from Doctor">
                            ORDER
                          </span>
                        )}
                        {report.pdfRef && <span className="artifact-tag pdf" title="Searchable PDF Attached">PDF</span>}
                        {report.imageRef && <span className="artifact-tag img" title="Visual Scan Attached">IMG</span>}
                      </div>
                    </div>
                  </td>
                  <td>{formatDate(report.reportDate || report.createdAt)}</td>
                  <td><StatusBadge status={report.status} /></td>
                  <td>
                    <span className="technician-badge">
                      {report.isPending ? (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                          {report.doctorName || 'Dr. ' + (report.doctorId?.firstName || 'N/A')}
                        </span>
                      ) : (
                        report.technician || 'N/A'
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-group">
                      <button className="btn-action view" title="View" onClick={() => handleView(report)}>
                        <Icons.Eye />
                      </button>
                      {!report.isPending && (
                        <>
                          <button className="btn-action edit" title="Edit" onClick={() => handleEditReport(report)}>
                            <Icons.Edit />
                          </button>
                          <button className="btn-action download" title="Download" onClick={() => handleDownloadReport(report)} disabled={isDownloading}>
                            <Icons.Download />
                          </button>
                        </>
                      )}
                      {report.isPending && (
                        <button 
                          className="btn-action" 
                          title="Process Test" 
                          onClick={() => handleProcessPendingTest(report)}
                          style={{ background: '#dbeafe', color: '#1e40af' }}
                        >
                          <Icons.Plus />
                        </button>
                      )}
                      <button className="btn-action delete" title="Delete" onClick={() => handleDeleteReport(report)}>
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

      <PathologyViewDialog
        isOpen={showDetail}
        onClose={handleCloseDetail}
        report={selectedReport}
      />
    </div>
  );
};

export default Pathology;

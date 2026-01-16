/**
 * TestReports.jsx
 * Complete test reports management page matching Flutter's PathologistTestReportsPage
 * Includes search, filter, pagination, add, view, upload, and delete functionality
 */

import React, { useState, useEffect } from 'react';
import {
  MdDescription,
  MdSearch,
  MdFilterList,
  MdAddCircle,
  MdVisibility,
  MdDelete,
  MdUploadFile,
  MdDownload,
  MdPerson,
  MdScience,
  MdNote,
  MdClose,
  MdCheckCircle,
  MdPendingActions,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';
import pathologyService from '../../../services/pathologyService';
import './TestReports.css';

// Import patient gender icons
import boyIcon from '../../../assets/boyicon.png';
import girlIcon from '../../../assets/girlicon.png';

// Custom SVG Icons (matching Admin Pathology)
const Icons = {
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
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

const TestReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate items per page based on viewport height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      const viewportHeight = window.innerHeight;
      const headerHeight = 120; // Approximate header + filter height
      const tableHeaderHeight = 50;
      const paginationHeight = 60;
      const rowHeight = 60; // Approximate row height
      const availableHeight = viewportHeight - headerHeight - tableHeaderHeight - paginationHeight;
      const rows = Math.floor(availableHeight / rowHeight);
      setItemsPerPage(Math.max(5, rows)); // Minimum 5 rows
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await pathologyService.fetchReports({ limit: 100 });
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async (reportData) => {
    try {
      await pathologyService.createReport(reportData);
      setShowAddDialog(false);
      loadReports();
    } catch (error) {
      console.error('Error adding report:', error);
      alert('Failed to add report: ' + error.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await pathologyService.deleteReport(reportId);
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report: ' + error.message);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowViewDialog(true);
  };

  const handleUploadFile = async (reportId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await pathologyService.updateReport(reportId, formData);
      loadReports();
      setShowViewDialog(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file: ' + error.message);
    }
  };

  const handleDownloadReport = async (reportId, reportName) => {
    try {
      await pathologyService.downloadReport(reportId, reportName);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report: ' + error.message);
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.patientCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.testName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Completed' && report.fileRef) ||
      (statusFilter === 'Pending' && !report.fileRef);

    return matchesSearch && matchesStatus;
  });

  // Paginate
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // Status badge component (matching Admin Pathology)
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

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">Test Reports</h1>
          <p className="main-subtitle">Manage pathology test reports and results</p>
        </div>
        <button className="btn-new-appointment" onClick={() => setShowAddDialog(true)}>
          + New Report
        </button>
      </div>

      {/* Filters Row */}
      <div className="filter-bar-container">
        <div className="search-wrapper">
          <MdSearch className="search-icon-lg" />
          <input
            type="text"
            placeholder="Search by patient name, code, or test type..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            className="search-input-lg"
          />
        </div>

        <div className="filter-right-group">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="tab-btn"
          >
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-card">
        <div className="modern-table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span>Loading reports...</span>
              </div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
              No reports found matching your criteria.
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Patient</th>
                  <th style={{ width: '25%' }}>Test</th>
                  <th style={{ width: '15%' }}>Report Date</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '15%' }}>Technician</th>
                  <th style={{ width: '13%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((report, index) => (
                  <tr key={report.id || index}>
                    <td>
                      <div className="patient-info-with-avatar">
                        <img
                          src={report.gender === 'Female' || report.patientGender === 'Female' ? girlIcon : boyIcon}
                          alt={report.patientName}
                          className="patient-avatar"
                        />
                        <div className="info-group">
                          <span className="primary">{report.patientName || 'Unknown'}</span>
                          <span className="secondary">{report.patientCode || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="info-group">
                        <span className="primary">{report.testName || 'N/A'}</span>
                        <span className="secondary">{report.testType || 'General'}</span>
                      </div>
                    </td>
                    <td>{formatDate(report.reportDate || report.collectionDate || report.createdAt)}</td>
                    <td><StatusBadge status={report.fileRef ? 'Completed' : 'Pending'} /></td>
                    <td>
                      <span className="technician-badge">{report.technician || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button className="btn-action view" title="View" onClick={() => handleViewReport(report)}>
                          <Icons.Eye />
                        </button>
                        <button className="btn-action delete" title="Delete" onClick={() => handleDeleteReport(report.id)}>
                          <Icons.Delete />
                        </button>
                        <button className="btn-action download" title="Download" onClick={() => handleDownloadReport(report.id, report.testName || 'report')}>
                          <Icons.Download />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && filteredReports.length > 0 && (
          <div className="pagination-footer">
            <div className="page-indicator-box">
              Page {currentPage + 1} of {totalPages || 1}
            </div>
            
            <div className="pagination-controls">
              <button
                className="page-arrow-circle leading"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <MdChevronLeft size={20} />
              </button>

              <button
                className="page-arrow-circle trailing"
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Report Dialog */}
      {showAddDialog && (
        <AddReportDialog
          onClose={() => setShowAddDialog(false)}
          onSubmit={handleAddReport}
        />
      )}

      {/* View Report Dialog */}
      {showViewDialog && selectedReport && (
        <ViewReportDialog
          report={selectedReport}
          onClose={() => setShowViewDialog(false)}
          onUploadFile={handleUploadFile}
          onDownload={handleDownloadReport}
        />
      )}
    </div>
  );
};

// Add Report Dialog Component
const AddReportDialog = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    testType: '',
    notes: '',
  });
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.testType) {
      alert('Please fill required fields');
      return;
    }

    const submitData = {
      ...formData,
      metadata: { notes: formData.notes },
    };

    if (file) {
      const formDataWithFile = new FormData();
      Object.keys(submitData).forEach(key => {
        if (key === 'metadata') {
          formDataWithFile.append(key, JSON.stringify(submitData[key]));
        } else {
          formDataWithFile.append(key, submitData[key]);
        }
      });
      formDataWithFile.append('file', file);
      onSubmit(formDataWithFile);
    } else {
      onSubmit(submitData);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Add Test Report</h2>
          <button className="close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label>Patient ID *</label>
            <input
              type="text"
              placeholder="Enter patient ID"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Test Name *</label>
            <input
              type="text"
              placeholder="e.g., Blood Test, X-Ray, etc."
              value={formData.testType}
              onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              placeholder="Enter any additional notes"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Upload File (Optional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && <p className="file-name">Selected: {file.name}</p>}
          </div>
          <div className="dialog-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Report Dialog Component
const ViewReportDialog = ({ report, onClose, onUploadFile, onDownload }) => {
  const [uploadingFile, setUploadingFile] = useState(null);

  const handleFileUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploadingFile(file);
        await onUploadFile(report.id, file);
        setUploadingFile(null);
      }
    };
    input.click();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content large" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-header-left">
            <div className="dialog-icon">
              <MdDescription size={28} />
            </div>
            <div>
              <h2>Test Report Details</h2>
              <p>View and manage lab report</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className="dialog-body">
          {/* Patient Info */}
          <div className="info-card">
            <div className="info-card-header">
              <MdPerson />
              <h3>Patient Information</h3>
            </div>
            <div className="info-row">
              <span className="info-label">Patient Name</span>
              <span className="info-value">{report.patientName || 'Unknown'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Patient Code</span>
              <span className="info-value">{report.reportId || report.patientCode || 'PAT-00'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Patient ID</span>
              <span className="info-value">{report.patientId || 'N/A'}</span>
            </div>
          </div>

          {/* Test Info */}
          <div className="info-card">
            <div className="info-card-header">
              <MdScience />
              <h3>Test Information</h3>
            </div>
            <div className="info-row">
              <span className="info-label">Test Type</span>
              <span className="info-value">{report.testName || report.testType || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Test Date</span>
              <span className="info-value">{formatDate(report.collectionDate || report.createdAt)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Uploaded By</span>
              <span className="info-value">{report.technician || 'Admin'}</span>
            </div>
          </div>

          {/* Notes */}
          {report.remarks && (
            <div className="info-card">
              <div className="info-card-header">
                <MdNote />
                <h3>Notes</h3>
              </div>
              <p className="notes-text">{report.remarks}</p>
            </div>
          )}

          {/* File Section */}
          <div className="info-card">
            <div className="info-card-header">
              <MdUploadFile />
              <h3>Test Report File</h3>
            </div>
            {report.fileRef ? (
              <div className="file-display">
                <div className="file-icon">
                  <MdDescription size={24} />
                </div>
                <div className="file-info">
                  <div className="file-name">{report.fileName || report.fileRef || 'Report File'}</div>
                  <div className="file-action">Click to download</div>
                </div>
                <button
                  className="download-btn"
                  onClick={() => onDownload(report.id, report.testName || 'report')}
                >
                  <MdDownload size={18} />
                  Download
                </button>
              </div>
            ) : (
              <div className="file-upload-section">
                <MdUploadFile size={48} />
                <p>No file uploaded yet</p>
                <button className="upload-btn" onClick={handleFileUpload} disabled={uploadingFile}>
                  <MdUploadFile size={18} />
                  {uploadingFile ? 'Uploading...' : 'Upload Report File'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="footer-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Table Skeleton
const TableSkeleton = () => (
  <div className="table-skeleton">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="skeleton-row"></div>
    ))}
  </div>
);

// Utility function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
};

export default TestReports;

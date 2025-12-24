/**
 * TestReportsManagement.jsx
 * Pathologist Test Reports Management
 * Upload, view, and manage lab test reports
 * Matching Flutter's test_reports_page.dart
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MdAdd, MdSearch, MdRefresh, MdUploadFile, MdDownload,
  MdEdit, MdDelete, MdVisibility, MdFilterList,
  MdCheckCircle, MdPendingActions
} from 'react-icons/md';
import authService from '../../../services/authService';
import './TestReportsManagement.css';

const TestReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchQuery, statusFilter]);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authService.get('/pathology/reports');
      
      let reportsData = [];
      if (response?.success && response?.reports) {
        reportsData = response.reports;
      } else if (Array.isArray(response)) {
        reportsData = response;
      } else if (response?.data?.reports) {
        reportsData = response.data.reports;
      }

      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load reports:', error);
      alert('Failed to load reports: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilters = () => {
    let filtered = [...reports];

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => {
        const hasFile = r.fileRef || r.reportFile;
        return statusFilter === 'Completed' ? hasFile : !hasFile;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const testName = (r.testName || r.testType || '').toLowerCase();
        const patientName = (r.patientId?.firstName || r.patientName || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        return testName.includes(query) || patientName.includes(query) || notes.includes(query);
      });
    }

    setFilteredReports(filtered);
    setCurrentPage(0);
  };

  const handleAddReport = () => {
    setSelectedReport(null);
    setShowAddDialog(true);
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setShowAddDialog(true);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await authService.delete(`/pathology/reports/${reportId}`);
      alert('Report deleted successfully');
      loadReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report: ' + error.message);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      const fileUrl = report.fileRef || report.reportFile;
      if (!fileUrl) {
        alert('No file available for this report');
        return;
      }

      // Download file
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (report) => {
    const hasFile = report.fileRef || report.reportFile;
    return {
      label: hasFile ? 'Completed' : 'Pending',
      color: hasFile ? '#10b981' : '#f59e0b'
    };
  };

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  return (
    <div className="test-reports-management">
      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <div className="header-icon">
            <MdUploadFile size={32} />
          </div>
          <div>
            <h1>Test Reports Management</h1>
            <p>Upload and manage laboratory test reports</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadReports} disabled={isLoading}>
            <MdRefresh size={20} />
            Refresh
          </button>
          <button className="btn-add" onClick={handleAddReport}>
            <MdAdd size={20} />
            Add Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Search by test name, patient, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <MdFilterList size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="reports-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <MdUploadFile size={64} />
            <h3>No Reports Found</h3>
            <p>Click "Add Report" to upload a new test report</p>
          </div>
        ) : (
          <>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((report) => {
                  const status = getStatusBadge(report);
                  return (
                    <tr key={report._id || report.id}>
                      <td className="test-name-cell">
                        {report.testName || report.testType || 'Lab Test'}
                      </td>
                      <td>{report.patientId?.firstName || report.patientName || 'Unknown'}</td>
                      <td>{formatDate(report.createdAt || report.testDate)}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="notes-cell">
                        {report.notes ? (
                          <span title={report.notes}>
                            {report.notes.length > 50
                              ? report.notes.substring(0, 50) + '...'
                              : report.notes}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {(report.fileRef || report.reportFile) && (
                            <button
                              className="btn-action download"
                              onClick={() => handleDownloadReport(report)}
                              title="Download"
                            >
                              <MdDownload size={18} />
                            </button>
                          )}
                          <button
                            className="btn-action edit"
                            onClick={() => handleEditReport(report)}
                            title="Edit"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDeleteReport(report._id || report.id)}
                            title="Delete"
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} of{' '}
                  {filteredReports.length} reports
                </span>
                <div className="pagination-controls">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </button>
                  <span className="page-number">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {showAddDialog && (
        <ReportDialog
          report={selectedReport}
          onClose={() => {
            setShowAddDialog(false);
            setSelectedReport(null);
          }}
          onSuccess={() => {
            setShowAddDialog(false);
            setSelectedReport(null);
            loadReports();
          }}
        />
      )}
    </div>
  );
};

// Report Add/Edit Dialog Component
const ReportDialog = ({ report, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patientId: report?.patientId?._id || report?.patientId || '',
    testName: report?.testName || report?.testType || '',
    notes: report?.notes || '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF or image file (JPG, PNG)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patientId || !formData.testName) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('patientId', formData.patientId);
      formDataToSend.append('testName', formData.testName);
      formDataToSend.append('notes', formData.notes);
      
      if (selectedFile) {
        formDataToSend.append('reportFile', selectedFile);
      }

      if (report) {
        // Update existing report
        await authService.put(`/pathology/reports/${report._id || report.id}`, formDataToSend);
        alert('Report updated successfully');
      } else {
        // Create new report
        await authService.post('/pathology/reports', formDataToSend);
        alert('Report added successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save report:', error);
      alert('Failed to save report: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{report ? 'Edit Report' : 'Add Test Report'}</h2>
          <button className="btn-close-dialog" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label>Patient ID *</label>
            <input
              type="text"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              placeholder="Enter patient ID"
              required
            />
          </div>

          <div className="form-group">
            <label>Test Name *</label>
            <input
              type="text"
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              placeholder="e.g., Blood Test, X-Ray, CT Scan"
              required
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Upload File (PDF, JPG, PNG)</label>
            <div className="file-upload-box">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" className="file-upload-label">
                <MdUploadFile size={24} />
                <span>{selectedFile ? selectedFile.name : 'Choose file to upload'}</span>
              </label>
            </div>
            {selectedFile && (
              <div className="file-info">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : report ? 'Update Report' : 'Add Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestReportsManagement;

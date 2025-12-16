/**
 * PathologyDetail.jsx
 * Pathology Report Detail View - Separate Page (not alert)
 * Shows complete pathology report details in a modal/page
 */

import React, { useState, useEffect } from 'react';
import pathologyService from '../../../services/pathologyService';
import './PathologyDetail.css';

const PathologyDetail = ({ reportId, report, onClose }) => {
  const [reportData, setReportData] = useState(report || null);
  const [isLoading, setIsLoading] = useState(!report);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!report && reportId) {
      loadReport();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, report]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    
    htmlEl.style.overflow = 'hidden';
    bodyEl.style.overflow = 'hidden';
    
    return () => {
      htmlEl.style.overflow = '';
      bodyEl.style.overflow = '';
    };
  }, []);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await pathologyService.fetchReportById(reportId);
      setReportData(data);
    } catch (err) {
      setError(`Failed to load report: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await pathologyService.downloadReport(reportData.id, reportData.reportId);
      alert('Report downloaded successfully!');
    } catch (error) {
      alert('Failed to download report: ' + error.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed' || statusLower === 'ready') return '#22C55E';
    if (statusLower === 'pending') return '#F59E0B';
    if (statusLower === 'in progress') return '#3B82F6';
    return '#6B7280';
  };

  if (isLoading) {
    return (
      <div className="pathology-detail-overlay">
        <div className="pathology-detail-modal">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pathology-detail-overlay">
        <div className="pathology-detail-modal">
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={onClose} className="btn-close">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="pathology-detail-overlay" onClick={onClose}>
      <div className="pathology-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-header">
          <div className="header-left">
            <h2>Pathology Report</h2>
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(reportData.status) }}
            >
              {reportData.status || 'Unknown'}
            </span>
          </div>
          <div className="header-actions">
            <button onClick={handleDownload} className="btn-action-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
            <button onClick={handlePrint} className="btn-action-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print
            </button>
            <button onClick={onClose} className="btn-close-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          <button 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Test Results
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="detail-content">
          {activeTab === 'details' && (
            <div className="details-grid">
              {/* Patient Information */}
              <div className="info-section">
                <h3>Patient Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Patient Name</label>
                    <p>{reportData.patientName || 'Unknown'}</p>
                  </div>
                  <div className="info-item">
                    <label>Patient ID</label>
                    <p>{reportData.patientId || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Age/Gender</label>
                    <p>{reportData.patientAge || 'N/A'} / {reportData.patientGender || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Report Information */}
              <div className="info-section">
                <h3>Report Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Report ID</label>
                    <p>{reportData.reportId || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Test Name</label>
                    <p>{reportData.testName || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Test Type</label>
                    <p>{reportData.testType || 'General'}</p>
                  </div>
                  <div className="info-item">
                    <label>Collection Date</label>
                    <p>{formatDate(reportData.collectionDate)}</p>
                  </div>
                  <div className="info-item">
                    <label>Report Date</label>
                    <p>{formatDate(reportData.reportDate)}</p>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <p><span 
                      className="status-pill"
                      style={{ backgroundColor: getStatusColor(reportData.status) }}
                    >{reportData.status}</span></p>
                  </div>
                </div>
              </div>

              {/* Medical Staff */}
              <div className="info-section">
                <h3>Medical Staff</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Doctor</label>
                    <p>{reportData.doctorName || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Technician</label>
                    <p>{reportData.technician || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {reportData.remarks && (
                <div className="info-section">
                  <h3>Remarks</h3>
                  <p className="remarks-text">{reportData.remarks}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="results-section">
              <h3>Test Results</h3>
              {reportData.testResults && reportData.testResults.length > 0 ? (
                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Reference Range</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.testResults.map((result, idx) => (
                        <tr key={idx}>
                          <td>{result.parameter}</td>
                          <td className="value-cell">{result.value}</td>
                          <td>{result.unit}</td>
                          <td>{result.referenceRange}</td>
                          <td>
                            <span className={`result-status ${result.status?.toLowerCase()}`}>
                              {result.status || 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No test results available</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-section">
              <h3>Report History</h3>
              <p className="no-data">History feature coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PathologyDetail;

/**
 * PathologistDashboard.jsx
 * Pathologist Dashboard - Lab Reports Overview
 * Matching Flutter's PathologistDashboardPage
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MdScience, MdRefresh, MdPendingActions, MdCheckCircle, 
  MdWarning, MdDescription, MdAccessTime, MdPerson 
} from 'react-icons/md';
import authService from '../../../services/authService';
import './PathologistDashboard.css';

const PathologistDashboard = () => {
  const [labReports, setLabReports] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pending: 0,
    completed: 0,
    urgent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authService.get('/pathology/reports?limit=50');
      
      let reports = [];
      if (response?.success && response?.reports) {
        reports = response.reports;
      } else if (Array.isArray(response)) {
        reports = response;
      } else if (response?.data?.reports) {
        reports = response.data.reports;
      }

      // Calculate stats
      const newStats = {
        totalReports: reports.length,
        pending: reports.filter(r => !r.fileRef && !r.reportFile).length,
        completed: reports.filter(r => r.fileRef || r.reportFile).length,
        urgent: reports.filter(r => 
          r.priority === 'urgent' || 
          r.metadata?.priority === 'urgent'
        ).length,
      };

      setLabReports(reports);
      setStats(newStats);
    } catch (error) {
      console.error('Error loading lab reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStatusColor = (report) => {
    if (report.fileRef || report.reportFile) return '#10b981'; // Completed - green
    if (report.priority === 'urgent' || report.metadata?.priority === 'urgent') return '#dc2626'; // Urgent - red
    return '#f59e0b'; // Pending - orange
  };

  const getStatusLabel = (report) => {
    if (report.fileRef || report.reportFile) return 'Completed';
    if (report.priority === 'urgent' || report.metadata?.priority === 'urgent') return 'Urgent';
    return 'Pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTestTypeDistribution = () => {
    const types = {};
    labReports.forEach(report => {
      const type = report.testName || report.testType || 'Other';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).slice(0, 5); // Top 5 test types
  };

  return (
    <div className="pathologist-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-icon">
            <MdScience size={32} />
          </div>
          <div>
            <h1>Laboratory Dashboard</h1>
            <p>Pathology Reports & Test Management</p>
          </div>
        </div>
        <button 
          className="btn-refresh" 
          onClick={loadDashboardData}
          disabled={isLoading}
        >
          <MdRefresh size={20} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card total">
          <div className="stat-icon">
            <MdDescription size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{isLoading ? '...' : stats.totalReports}</div>
            <div className="stat-label">Total Reports</div>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <MdPendingActions size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{isLoading ? '...' : stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">
            <MdCheckCircle size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{isLoading ? '...' : stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card urgent">
          <div className="stat-icon">
            <MdWarning size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{isLoading ? '...' : stats.urgent}</div>
            <div className="stat-label">Urgent</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Recent Reports */}
        <div className="recent-reports-section">
          <div className="section-header">
            <h2>Recent Lab Reports</h2>
            <span className="report-count">{labReports.length} reports</span>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading reports...</p>
            </div>
          ) : labReports.length === 0 ? (
            <div className="empty-state">
              <MdScience size={64} />
              <h3>No Reports Yet</h3>
              <p>Lab reports will appear here</p>
            </div>
          ) : (
            <div className="reports-list">
              {labReports.slice(0, 10).map((report, index) => {
                const status = getStatusLabel(report);
                const statusColor = getStatusColor(report);
                
                return (
                  <div key={report._id || report.id || index} className="report-card">
                    <div className="report-main">
                      <div className="report-info">
                        <div className="report-title">
                          {report.testName || report.testType || 'Lab Test'}
                        </div>
                        <div className="report-meta">
                          <span className="meta-item">
                            <MdPerson size={14} />
                            {report.patientId?.firstName || report.patientName || 'Unknown'}
                          </span>
                          <span className="meta-item">
                            <MdAccessTime size={14} />
                            {formatDate(report.createdAt || report.testDate)}
                          </span>
                        </div>
                      </div>
                      <div 
                        className="report-status"
                        style={{ backgroundColor: statusColor }}
                      >
                        {status}
                      </div>
                    </div>
                    
                    {report.notes && (
                      <div className="report-notes">{report.notes}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="side-panel">
          {/* Test Type Distribution */}
          <div className="panel-card">
            <h3>Test Type Distribution</h3>
            <div className="test-types-list">
              {getTestTypeDistribution().map(([type, count]) => (
                <div key={type} className="test-type-item">
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="panel-card">
            <h3>Quick Stats</h3>
            <div className="quick-stats-list">
              <div className="quick-stat-item">
                <span className="stat-label">Completion Rate</span>
                <span className="stat-value">
                  {stats.totalReports > 0 
                    ? Math.round((stats.completed / stats.totalReports) * 100)
                    : 0}%
                </span>
              </div>
              <div className="quick-stat-item">
                <span className="stat-label">Pending Rate</span>
                <span className="stat-value">
                  {stats.totalReports > 0 
                    ? Math.round((stats.pending / stats.totalReports) * 100)
                    : 0}%
                </span>
              </div>
              <div className="quick-stat-item">
                <span className="stat-label">Urgent Cases</span>
                <span className="stat-value critical">
                  {stats.urgent}
                </span>
              </div>
              <div className="quick-stat-item">
                <span className="stat-label">Today's Reports</span>
                <span className="stat-value">
                  {labReports.filter(r => {
                    const createdDate = new Date(r.createdAt || r.testDate);
                    const today = new Date();
                    return createdDate.toDateString() === today.toDateString();
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathologistDashboard;

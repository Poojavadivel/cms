/**
 * FollowUpManagement.jsx
 * Enterprise Follow-Up Management Screen
 * Matching Flutter's FollowUpManagementScreen.dart
 * Similar to Epic, Cerner, and Athenahealth follow-up trackers
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MdSearch, MdRefresh, MdFilterList, MdCalendarToday, 
  MdPerson, MdWarning, MdCheckCircle, MdSchedule,
  MdPriorityHigh, MdEvent
} from 'react-icons/md';
import authService from '../../../services/authService';
import FollowUpDialog from '../../../components/doctor/FollowUpDialog';
import './FollowUpManagement.css';

const FollowUpManagement = ({ initialPatientFilter }) => {
  const [followUps, setFollowUps] = useState([]);
  const [filteredFollowUps, setFilteredFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialPatientFilter || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  const statusFilters = ['All', 'Pending', 'Scheduled', 'Completed', 'Overdue'];
  const priorityFilters = ['All', 'Routine', 'Important', 'Urgent', 'Critical'];

  useEffect(() => {
    loadFollowUps();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [followUps, searchQuery, statusFilter, priorityFilter]);

  const loadFollowUps = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authService.get('/appointments?hasFollowUp=true&limit=200');
      const appointments = response?.data?.appointments || response?.appointments || [];
      setFollowUps(appointments);
    } catch (error) {
      console.error('Failed to load follow-ups:', error);
      alert('Failed to load follow-ups: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilters = () => {
    let filtered = [...followUps];

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(f => getFollowUpStatus(f) === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'All') {
      filtered = filtered.filter(f => {
        const priority = f.followUp?.priority || f.priority || 'Routine';
        return priority === priorityFilter;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => {
        const patientName = f.patientId?.firstName || f.patientName || '';
        const reason = f.followUp?.reason || f.followUpReason || '';
        const diagnosis = f.followUp?.diagnosis || f.diagnosis || '';
        
        return (
          patientName.toLowerCase().includes(query) ||
          reason.toLowerCase().includes(query) ||
          diagnosis.toLowerCase().includes(query)
        );
      });
    }

    // Sort by priority then date
    filtered.sort((a, b) => {
      const priorityOrder = { 'Critical': 0, 'Urgent': 1, 'Important': 2, 'Routine': 3 };
      const aPriority = a.followUp?.priority || a.priority || 'Routine';
      const bPriority = b.followUp?.priority || b.priority || 'Routine';
      
      const priorityCompare = (priorityOrder[aPriority] || 3) - (priorityOrder[bPriority] || 3);
      if (priorityCompare !== 0) return priorityCompare;
      
      const aDate = a.followUp?.recommendedDate || a.startAt;
      const bDate = b.followUp?.recommendedDate || b.startAt;
      if (aDate && bDate) {
        return new Date(aDate) - new Date(bDate);
      }
      return 0;
    });

    setFilteredFollowUps(filtered);
  };

  const getFollowUpStatus = (followUp) => {
    const completedDate = followUp.followUp?.completedDate || followUp.completedDate;
    const scheduledDate = followUp.followUp?.scheduledDate || followUp.startAt;
    const recommendedDate = followUp.followUp?.recommendedDate || followUp.followUpDate;
    
    if (completedDate) return 'Completed';
    if (scheduledDate) return 'Scheduled';
    if (recommendedDate) {
      const recDate = new Date(recommendedDate);
      if (recDate < new Date()) return 'Overdue';
    }
    return 'Pending';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#dc2626';
      case 'Urgent': return '#ea580c';
      case 'Important': return '#f59e0b';
      case 'Routine': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#10b981';
      case 'Scheduled': return '#3b82f6';
      case 'Pending': return '#f59e0b';
      case 'Overdue': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStats = () => {
    return {
      total: followUps.length,
      pending: followUps.filter(f => getFollowUpStatus(f) === 'Pending').length,
      scheduled: followUps.filter(f => getFollowUpStatus(f) === 'Scheduled').length,
      overdue: followUps.filter(f => getFollowUpStatus(f) === 'Overdue').length,
      completed: followUps.filter(f => getFollowUpStatus(f) === 'Completed').length,
    };
  };

  const handleMarkComplete = async (followUp) => {
    if (!window.confirm('Mark this follow-up as completed?')) return;
    
    try {
      await authService.put(`/appointments/${followUp._id || followUp.id}`, {
        'followUp.completedDate': new Date().toISOString(),
        status: 'Completed'
      });
      alert('Follow-up marked as completed');
      loadFollowUps();
    } catch (error) {
      console.error('Failed to update follow-up:', error);
      alert('Failed to update: ' + error.message);
    }
  };

  const handleReschedule = (followUp) => {
    setSelectedFollowUp(followUp);
    setShowRescheduleDialog(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stats = getStats();

  return (
    <div className="followup-management">
      {/* Header */}
      <div className="followup-header">
        <div className="header-content">
          <div className="header-icon">
            <MdEvent size={32} />
          </div>
          <div>
            <h1>Follow-Up Management</h1>
            <p>Enterprise Follow-Up Tracker</p>
          </div>
        </div>
        <button className="btn-refresh" onClick={loadFollowUps} disabled={isLoading}>
          <MdRefresh size={20} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="followup-filters">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Search by patient, reason, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <MdFilterList size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <MdPriorityHigh size={18} />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            {priorityFilters.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <MdCalendarToday size={24} />
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Follow-Ups</div>
        </div>
        <div className="stat-card pending">
          <MdSchedule size={24} />
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card scheduled">
          <MdCheckCircle size={24} />
          <div className="stat-value">{stats.scheduled}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card overdue">
          <MdWarning size={24} />
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {/* Follow-Up List */}
      <div className="followup-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading follow-ups...</p>
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="empty-state">
            <MdEvent size={64} />
            <h3>No Follow-Ups Found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="followup-cards">
            {filteredFollowUps.map((followUp) => {
              const status = getFollowUpStatus(followUp);
              const priority = followUp.followUp?.priority || followUp.priority || 'Routine';
              const patient = followUp.patientId || followUp.patient || {};
              const patientName = patient.firstName || followUp.patientName || 'Unknown Patient';
              
              return (
                <div key={followUp._id || followUp.id} className="followup-card">
                  <div className="card-header">
                    <div className="patient-info">
                      <MdPerson size={20} />
                      <span className="patient-name">{patientName}</span>
                    </div>
                    <div className="badges">
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(priority) }}
                      >
                        {priority}
                      </span>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(status) }}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <strong>Reason:</strong>
                      <span>{followUp.followUp?.reason || followUp.followUpReason || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <strong>Diagnosis:</strong>
                      <span>{followUp.followUp?.diagnosis || followUp.diagnosis || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <strong>Recommended Date:</strong>
                      <span>{formatDate(followUp.followUp?.recommendedDate || followUp.followUpDate)}</span>
                    </div>
                    {followUp.followUp?.notes && (
                      <div className="info-row">
                        <strong>Notes:</strong>
                        <span>{followUp.followUp.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    {status === 'Pending' || status === 'Overdue' ? (
                      <>
                        <button 
                          className="btn-action schedule"
                          onClick={() => handleReschedule(followUp)}
                        >
                          <MdCalendarToday size={16} />
                          Schedule
                        </button>
                        <button 
                          className="btn-action complete"
                          onClick={() => handleMarkComplete(followUp)}
                        >
                          <MdCheckCircle size={16} />
                          Mark Complete
                        </button>
                      </>
                    ) : status === 'Scheduled' ? (
                      <>
                        <button 
                          className="btn-action reschedule"
                          onClick={() => handleReschedule(followUp)}
                        >
                          <MdSchedule size={16} />
                          Reschedule
                        </button>
                        <button 
                          className="btn-action complete"
                          onClick={() => handleMarkComplete(followUp)}
                        >
                          <MdCheckCircle size={16} />
                          Complete
                        </button>
                      </>
                    ) : (
                      <span className="completed-text">✓ Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Dialog */}
      {showRescheduleDialog && selectedFollowUp && (
        <FollowUpDialog
          patient={selectedFollowUp.patientId || selectedFollowUp.patient || { name: selectedFollowUp.patientName }}
          isOpen={showRescheduleDialog}
          onClose={() => {
            setShowRescheduleDialog(false);
            setSelectedFollowUp(null);
          }}
          onSuccess={() => {
            setShowRescheduleDialog(false);
            setSelectedFollowUp(null);
            loadFollowUps();
          }}
        />
      )}
    </div>
  );
};

export default FollowUpManagement;

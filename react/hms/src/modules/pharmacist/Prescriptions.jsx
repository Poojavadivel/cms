import React, { useState, useEffect } from 'react';
import { authService } from '../../services';
import {
  MdSearch,
  MdRefresh,
  MdViewList,
  MdGridView,
  MdDescription,
  MdPerson,
  MdPhone,
  MdCalendarToday,
  MdCheckCircle,
  MdInventory,
  MdFilterAlt,
  MdClose,
} from 'react-icons/md';
import './Prescriptions.css';

const PrescriptionFilter = {
  ALL: 'all',
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
};

const PrescriptionSort = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  PATIENT_NAME: 'patientName',
};

const ViewMode = {
  LIST: 'list',
  GRID: 'grid',
};

const PharmacistPrescriptions = () => {
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState(PrescriptionFilter.ALL);
  const [currentSort, setCurrentSort] = useState(PrescriptionSort.NEWEST);
  const [viewMode, setViewMode] = useState(ViewMode.LIST);
  
  // Statistics
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    filterAndSortPrescriptions();
  }, [searchQuery, currentFilter, currentSort, allPrescriptions]);

  const loadPrescriptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.get('/pharmacy/pending-prescriptions');
      
      if (response && typeof response === 'object') {
        const prescriptions = response.prescriptions || [];
        console.log(`📦 Loaded ${prescriptions.length} prescriptions`);
        
        setAllPrescriptions(prescriptions);
        calculateStatistics(prescriptions);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Error loading prescriptions:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (prescriptions) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let todayC = 0;
    let weekC = 0;
    
    prescriptions.forEach(prescription => {
      const createdAt = prescription.createdAt ? new Date(prescription.createdAt) : null;
      if (createdAt) {
        if (createdAt > today) todayC++;
        if (createdAt > weekAgo) weekC++;
      }
    });
    
    setTodayCount(todayC);
    setWeekCount(weekC);
    setTotalCount(prescriptions.length);
  };

  const filterAndSortPrescriptions = () => {
    let filtered = [...allPrescriptions];
    
    // Apply date filter
    const now = new Date();
    switch (currentFilter) {
      case PrescriptionFilter.TODAY: {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(p => {
          const createdAt = p.createdAt ? new Date(p.createdAt) : null;
          return createdAt && createdAt > today;
        });
        break;
      }
      case PrescriptionFilter.WEEK: {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => {
          const createdAt = p.createdAt ? new Date(p.createdAt) : null;
          return createdAt && createdAt > weekAgo;
        });
        break;
      }
      case PrescriptionFilter.MONTH: {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => {
          const createdAt = p.createdAt ? new Date(p.createdAt) : null;
          return createdAt && createdAt > monthAgo;
        });
        break;
      }
      default:
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const patientName = (p.patientName || '').toLowerCase();
        const patientPhone = (p.patientPhone || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        return patientName.includes(query) || 
               patientPhone.includes(query) || 
               notes.includes(query);
      });
    }
    
    // Apply sorting
    switch (currentSort) {
      case PrescriptionSort.NEWEST:
        filtered.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return bDate - aDate;
        });
        break;
      case PrescriptionSort.OLDEST:
        filtered.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return aDate - bDate;
        });
        break;
      case PrescriptionSort.PATIENT_NAME:
        filtered.sort((a, b) => {
          const aName = (a.patientName || '').toLowerCase();
          const bName = (b.patientName || '').toLowerCase();
          return aName.localeCompare(bName);
        });
        break;
      default:
        break;
    }
    
    setFilteredPrescriptions(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  if (loading) {
    return (
      <div className="prescriptions-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prescriptions-error">
        <div className="error-content">
          <MdClose size={64} className="error-icon" />
          <h2>Error Loading Prescriptions</h2>
          <p>{error}</p>
          <button onClick={loadPrescriptions} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pharmacist-prescriptions">
      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <MdCalendarToday className="stat-icon stat-success" size={20} />
          <div className="stat-content">
            <div className="stat-value">{todayCount}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-card">
          <MdInventory className="stat-icon stat-info" size={20} />
          <div className="stat-content">
            <div className="stat-value">{weekCount}</div>
            <div className="stat-label">This Week</div>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-card">
          <MdDescription className="stat-icon stat-primary" size={20} />
          <div className="stat-content">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-card">
          <MdFilterAlt className="stat-icon stat-warning" size={20} />
          <div className="stat-content">
            <div className="stat-value">{filteredPrescriptions.length}</div>
            <div className="stat-label">Filtered</div>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <button onClick={loadPrescriptions} className="btn-refresh-stat" title="Refresh">
          <MdRefresh size={20} />
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="prescriptions-toolbar">
        <div className="search-box">
          <MdSearch size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="search-clear"
            >
              <MdClose size={18} />
            </button>
          )}
        </div>
        
        <button onClick={loadPrescriptions} className="btn-refresh" title="Refresh">
          <MdRefresh size={20} />
        </button>
        
        <div className="view-mode-toggle">
          <button
            onClick={() => setViewMode(ViewMode.LIST)}
            className={`view-btn ${viewMode === ViewMode.LIST ? 'active' : ''}`}
            title="List View"
          >
            <MdViewList size={20} />
          </button>
          <button
            onClick={() => setViewMode(ViewMode.GRID)}
            className={`view-btn ${viewMode === ViewMode.GRID ? 'active' : ''}`}
            title="Grid View"
          >
            <MdGridView size={20} />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-chips">
        {Object.values(PrescriptionFilter).map(filter => (
          <button
            key={filter}
            onClick={() => setCurrentFilter(filter)}
            className={`filter-chip ${currentFilter === filter ? 'active' : ''}`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <div className="sort-section">
        <label className="sort-label">Sort by:</label>
        <select
          value={currentSort}
          onChange={(e) => setCurrentSort(e.target.value)}
          className="sort-select"
        >
          <option value={PrescriptionSort.NEWEST}>Newest First</option>
          <option value={PrescriptionSort.OLDEST}>Oldest First</option>
          <option value={PrescriptionSort.PATIENT_NAME}>Patient Name</option>
        </select>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="prescriptions-empty">
          <MdDescription size={64} className="empty-icon" />
          <h3>No Prescriptions Found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className={`prescriptions-${viewMode}`}>
          {filteredPrescriptions.map((prescription, index) => (
            <div key={prescription._id || index} className="prescription-card">
              <div className="prescription-header">
                <div className="patient-info">
                  <div className="patient-avatar">
                    <MdPerson size={24} />
                  </div>
                  <div className="patient-details">
                    <h4 className="patient-name">{prescription.patientName || 'Unknown'}</h4>
                    <div className="patient-phone">
                      <MdPhone size={14} />
                      <span>{prescription.patientPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="prescription-date">
                  <div className="date-value">{formatDate(prescription.createdAt)}</div>
                  <div className="time-value">{formatTime(prescription.createdAt)}</div>
                </div>
              </div>
              
              {prescription.medicines && prescription.medicines.length > 0 && (
                <div className="prescription-medicines">
                  <h5>Medicines:</h5>
                  <ul>
                    {prescription.medicines.map((med, idx) => (
                      <li key={idx}>{med.name || 'Unknown'} - {med.quantity || 0} units</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {prescription.notes && (
                <div className="prescription-notes">
                  <strong>Notes:</strong> {prescription.notes}
                </div>
              )}
              
              <div className="prescription-actions">
                <button className="btn-dispense">
                  <MdCheckCircle size={18} />
                  Dispense
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacistPrescriptions;

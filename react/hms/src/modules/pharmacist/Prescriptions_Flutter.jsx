import React, { useState, useEffect } from 'react';
import { authService } from '../../services';
import {
  MdSearch,
  MdRefresh,
  MdFilterList,
  MdSort,
  MdViewList,
  MdViewModule,
  MdCalendarToday,
  MdCheckCircle,
  MdLocalPharmacy,
  MdPerson,
  MdWarning,
  MdDescription,
} from 'react-icons/md';
import './Prescriptions_Flutter.css';

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
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState(PrescriptionFilter.ALL);
  const [currentSort, setCurrentSort] = useState(PrescriptionSort.NEWEST);
  const [viewMode, setViewMode] = useState(ViewMode.LIST);
  
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    total: 0,
  });

  const [showDispenseDialog, setShowDispenseDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    filterAndSortPrescriptions();
  }, [searchQuery, currentFilter, currentSort, prescriptions]);

  const loadPrescriptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.get('/pharmacy/pending-prescriptions');
      
      let prescriptionsList = [];
      if (response && typeof response === 'object') {
        prescriptionsList = response.prescriptions || response.data || [];
      } else if (Array.isArray(response)) {
        prescriptionsList = response;
      }
      
      setPrescriptions(prescriptionsList);
      calculateStatistics(prescriptionsList);
    } catch (err) {
      console.error('Error loading prescriptions:', err);
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (list) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let todayCount = 0;
    let weekCount = 0;
    
    list.forEach(prescription => {
      const createdAt = prescription.createdAt ? new Date(prescription.createdAt) : null;
      if (createdAt) {
        if (createdAt >= today) todayCount++;
        if (createdAt >= weekAgo) weekCount++;
      }
    });
    
    setStats({
      today: todayCount,
      week: weekCount,
      total: list.length,
    });
  };

  const filterAndSortPrescriptions = () => {
    let filtered = [...prescriptions];
    
    // Apply date filter
    const now = new Date();
    switch (currentFilter) {
      case PrescriptionFilter.TODAY:
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(p => {
          const createdAt = p.createdAt ? new Date(p.createdAt) : null;
          return createdAt && createdAt >= today;
        });
        break;
      case PrescriptionFilter.WEEK:
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(p => {
          const createdAt = p.createdAt ? new Date(p.createdAt) : null;
          return createdAt && createdAt >= weekAgo;
        });
        break;
      case PrescriptionFilter.MONTH:
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        filtered = filtered.filter(p => {
          const createdAt = p.createdAt ? new Date(p.createdAt) : null;
          return createdAt && createdAt >= monthAgo;
        });
        break;
      default:
        break;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const patientName = (p.patientName || '').toLowerCase();
        const patientPhone = (p.patientPhone || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        return patientName.includes(query) || patientPhone.includes(query) || notes.includes(query);
      });
    }
    
    // Apply sorting
    switch (currentSort) {
      case PrescriptionSort.NEWEST:
        filtered.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt) : null;
          const bDate = b.createdAt ? new Date(b.createdAt) : null;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return bDate - aDate;
        });
        break;
      case PrescriptionSort.OLDEST:
        filtered.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt) : null;
          const bDate = b.createdAt ? new Date(b.createdAt) : null;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleDispenseClick = async (prescription) => {
    if (prescription.dispensed) {
      return; // Already dispensed
    }
    setSelectedPrescription(prescription);
    setShowDispenseDialog(true);
  };

  const confirmDispense = async () => {
    if (!selectedPrescription) return;

    setIsProcessing(true);
    try {
      const intakeId = selectedPrescription._id;
      if (!intakeId) {
        throw new Error('Invalid prescription ID');
      }

      await authService.post(`/pharmacy/prescriptions/${intakeId}/dispense`, {
        items: selectedPrescription.pharmacyItems || [],
        paid: false,
        notes: selectedPrescription.notes || '',
      });

      setShowDispenseDialog(false);
      setSelectedPrescription(null);
      await loadPrescriptions(); // Reload the list
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      alert(`Failed to dispense prescription: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="flutter-prescriptions-page">
        <div className="flutter-prescription-loading">
          <div className="flutter-spinner"></div>
          <p>Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flutter-prescriptions-page">
        <div className="flutter-prescription-error">
          <MdLocalPharmacy size={64} color="#ef4444" />
          <h2>Error Loading Prescriptions</h2>
          <p>{error}</p>
          <button onClick={loadPrescriptions} className="flutter-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flutter-prescriptions-page">
      {/* Statistics Dashboard */}
      <div className="flutter-prescription-stats">
        <div className="flutter-stat-item">
          <MdCalendarToday size={20} color="#10b981" />
          <span className="flutter-stat-value">{stats.today}</span>
          <span className="flutter-stat-label">Today</span>
        </div>
        <div className="flutter-stat-divider"></div>
        <div className="flutter-stat-item">
          <MdCalendarToday size={20} color="#3b82f6" />
          <span className="flutter-stat-value">{stats.week}</span>
          <span className="flutter-stat-label">This Week</span>
        </div>
        <div className="flutter-stat-divider"></div>
        <div className="flutter-stat-item">
          <MdLocalPharmacy size={20} color="#4f46e5" />
          <span className="flutter-stat-value">{stats.total}</span>
          <span className="flutter-stat-label">Total</span>
        </div>
        <div className="flutter-stat-divider"></div>
        <div className="flutter-stat-item">
          <MdFilterList size={20} color="#f97316" />
          <span className="flutter-stat-value">{filteredPrescriptions.length}</span>
          <span className="flutter-stat-label">Filtered</span>
        </div>
        <div className="flutter-stat-divider"></div>
        <button onClick={loadPrescriptions} className="flutter-refresh-icon-btn" title="Refresh">
          <MdRefresh size={20} />
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flutter-prescription-search-bar">
        <div className="flutter-search-box-wide">
          <MdSearch size={20} className="flutter-search-icon" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flutter-search-input-wide"
          />
        </div>
        
        <select
          value={currentFilter}
          onChange={(e) => setCurrentFilter(e.target.value)}
          className="flutter-filter-select"
        >
          <option value={PrescriptionFilter.ALL}>All Time</option>
          <option value={PrescriptionFilter.TODAY}>Today</option>
          <option value={PrescriptionFilter.WEEK}>This Week</option>
          <option value={PrescriptionFilter.MONTH}>This Month</option>
        </select>

        <select
          value={currentSort}
          onChange={(e) => setCurrentSort(e.target.value)}
          className="flutter-sort-select"
        >
          <option value={PrescriptionSort.NEWEST}>Newest First</option>
          <option value={PrescriptionSort.OLDEST}>Oldest First</option>
          <option value={PrescriptionSort.PATIENT_NAME}>Patient Name</option>
        </select>

        <div className="flutter-view-toggle">
          <button
            className={`flutter-view-btn ${viewMode === ViewMode.LIST ? 'active' : ''}`}
            onClick={() => setViewMode(ViewMode.LIST)}
            title="List View"
          >
            <MdViewList size={20} />
          </button>
          <button
            className={`flutter-view-btn ${viewMode === ViewMode.GRID ? 'active' : ''}`}
            onClick={() => setViewMode(ViewMode.GRID)}
            title="Grid View"
          >
            <MdViewModule size={20} />
          </button>
        </div>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="flutter-empty-state">
          <MdLocalPharmacy size={64} color="#9ca3af" />
          <h2>No Prescriptions Found</h2>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : viewMode === ViewMode.LIST ? (
        <div className="flutter-prescription-list">
          {filteredPrescriptions.map((prescription, index) => (
            <div key={prescription._id || index} className="flutter-prescription-card">
              <div className="flutter-prescription-header">
                <div className="flutter-prescription-patient">
                  <MdPerson size={20} />
                  <span className="flutter-patient-name">{prescription.patientName || 'Unknown Patient'}</span>
                </div>
                <div className="flutter-prescription-date">
                  <MdCalendarToday size={16} />
                  <span>{formatDate(prescription.createdAt)}</span>
                </div>
              </div>
              
              <div className="flutter-prescription-body">
                <div className="flutter-prescription-info">
                  <span className="flutter-info-label">Doctor:</span>
                  <span className="flutter-info-value">{prescription.doctorName || 'N/A'}</span>
                </div>
                <div className="flutter-prescription-info">
                  <span className="flutter-info-label">Phone:</span>
                  <span className="flutter-info-value">{prescription.patientPhone || 'N/A'}</span>
                </div>
                {prescription.notes && (
                  <div className="flutter-prescription-notes">
                    <span className="flutter-info-label">Notes:</span>
                    <span className="flutter-info-value">{prescription.notes}</span>
                  </div>
                )}
              </div>
              
              <div className="flutter-prescription-footer">
                <button 
                  className={`flutter-dispense-btn ${prescription.dispensed ? 'dispensed' : ''}`}
                  onClick={() => handleDispenseClick(prescription)}
                  disabled={prescription.dispensed}
                >
                  <MdCheckCircle size={18} />
                  <span>{prescription.dispensed ? 'Dispensed' : 'Dispense'}</span>
                </button>
                <button 
                  className="flutter-view-details-btn"
                  onClick={() => handleViewDetails(prescription)}
                >
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flutter-prescription-grid">
          {filteredPrescriptions.map((prescription, index) => (
            <div key={prescription._id || index} className="flutter-prescription-grid-card">
              <div className="flutter-grid-card-header">
                <MdPerson size={24} color="#4f46e5" />
                <span className="flutter-grid-patient-name">{prescription.patientName || 'Unknown'}</span>
              </div>
              <div className="flutter-grid-card-body">
                <div className="flutter-grid-info">
                  <span className="flutter-grid-label">Doctor</span>
                  <span className="flutter-grid-value">{prescription.doctorName || 'N/A'}</span>
                </div>
                <div className="flutter-grid-info">
                  <span className="flutter-grid-label">Date</span>
                  <span className="flutter-grid-value">{formatDate(prescription.createdAt)}</span>
                </div>
              </div>
              <button 
                className={`flutter-grid-dispense-btn ${prescription.dispensed ? 'dispensed' : ''}`}
                onClick={() => handleDispenseClick(prescription)}
                disabled={prescription.dispensed}
              >
                <MdCheckCircle size={18} />
                <span>{prescription.dispensed ? 'Dispensed' : 'Dispense'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dispense Confirmation Dialog */}
      {showDispenseDialog && selectedPrescription && (
        <div className="flutter-modal-overlay" onClick={() => !isProcessing && setShowDispenseDialog(false)}>
          <div className="flutter-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flutter-modal-header">
              <div className="flutter-modal-icon">
                <MdLocalPharmacy size={24} />
              </div>
              <h2>Dispense Prescription</h2>
              <button 
                className="flutter-modal-close"
                onClick={() => setShowDispenseDialog(false)}
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
            <div className="flutter-modal-body">
              <p>Confirm dispensing this prescription?</p>
              <div className="flutter-modal-warning">
                <MdWarning size={20} />
                <span>This action cannot be undone. Please verify all details before proceeding.</span>
              </div>
              <div className="flutter-modal-info">
                <div className="flutter-modal-info-row">
                  <span className="flutter-modal-label">Patient:</span>
                  <span className="flutter-modal-value">{selectedPrescription.patientName || 'Unknown'}</span>
                </div>
                <div className="flutter-modal-info-row">
                  <span className="flutter-modal-label">Items:</span>
                  <span className="flutter-modal-value">{(selectedPrescription.pharmacyItems || []).length} medicines</span>
                </div>
                <div className="flutter-modal-info-row">
                  <span className="flutter-modal-label">Total:</span>
                  <span className="flutter-modal-value">₹{selectedPrescription.total || 0}</span>
                </div>
              </div>
            </div>
            <div className="flutter-modal-footer">
              <button
                className="flutter-modal-btn flutter-modal-btn-cancel"
                onClick={() => setShowDispenseDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="flutter-modal-btn flutter-modal-btn-confirm"
                onClick={confirmDispense}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm Dispense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Details Dialog */}
      {showDetailsDialog && selectedPrescription && (
        <div className="flutter-modal-overlay" onClick={() => setShowDetailsDialog(false)}>
          <div className="flutter-modal-dialog flutter-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="flutter-modal-header flutter-modal-header-gradient">
              <div className="flutter-modal-icon">
                <MdDescription size={24} />
              </div>
              <div className="flutter-modal-header-text">
                <h2>Prescription Details</h2>
                <p>{formatDate(selectedPrescription.createdAt)}</p>
              </div>
              <button 
                className="flutter-modal-close flutter-modal-close-white"
                onClick={() => setShowDetailsDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="flutter-modal-body flutter-modal-body-scroll">
              {/* Patient Info */}
              <div className="flutter-details-section">
                <h3><MdPerson size={20} /> Patient Information</h3>
                <div className="flutter-details-grid">
                  <div className="flutter-detail-item">
                    <span className="flutter-detail-label">Name:</span>
                    <span className="flutter-detail-value">{selectedPrescription.patientName || 'Unknown'}</span>
                  </div>
                  <div className="flutter-detail-item">
                    <span className="flutter-detail-label">Phone:</span>
                    <span className="flutter-detail-value">{selectedPrescription.patientPhone || 'N/A'}</span>
                  </div>
                  <div className="flutter-detail-item">
                    <span className="flutter-detail-label">Doctor:</span>
                    <span className="flutter-detail-value">{selectedPrescription.doctorName || 'N/A'}</span>
                  </div>
                  <div className="flutter-detail-item">
                    <span className="flutter-detail-label">Status:</span>
                    <span className={`flutter-detail-badge ${selectedPrescription.dispensed ? 'dispensed' : 'pending'}`}>
                      {selectedPrescription.dispensed ? 'Dispensed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medicines List */}
              <div className="flutter-details-section">
                <h3><MdLocalPharmacy size={20} /> Prescribed Medicines</h3>
                {(selectedPrescription.pharmacyItems || []).length === 0 ? (
                  <p className="flutter-no-items">No medicines prescribed</p>
                ) : (
                  <div className="flutter-medicines-list">
                    {selectedPrescription.pharmacyItems.map((item, index) => (
                      <div key={index} className="flutter-medicine-item">
                        <div className="flutter-medicine-number">{index + 1}</div>
                        <div className="flutter-medicine-details">
                          <div className="flutter-medicine-name">{item.medicineName || item.Medicine || 'Unknown'}</div>
                          <div className="flutter-medicine-meta">
                            {item.dosage && <span>Dosage: {item.dosage}</span>}
                            {item.frequency && <span>Frequency: {item.frequency}</span>}
                            {item.quantity && <span>Qty: {item.quantity}</span>}
                          </div>
                          {item.notes && (
                            <div className="flutter-medicine-notes">
                              <MdWarning size={14} />
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="flutter-details-section">
                  <h3>Clinical Notes</h3>
                  <div className="flutter-notes-box">
                    {selectedPrescription.notes}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flutter-details-total">
                <span>Total Amount:</span>
                <span className="flutter-total-amount">₹{selectedPrescription.total || 0}</span>
              </div>
            </div>
            <div className="flutter-modal-footer">
              <button
                className="flutter-modal-btn flutter-modal-btn-cancel"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistPrescriptions;

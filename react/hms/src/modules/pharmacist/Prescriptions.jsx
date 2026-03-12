import React, { useState, useEffect } from 'react';
import { authService } from '../../services';
import {
  MdSearch,
  MdRefresh,
  MdDescription,
  MdCheckCircle,
  MdDelete,
  MdVisibility,
  MdClose,
  MdCalendarToday,
  MdInventory,
  MdFilterAlt,
} from 'react-icons/md';
import './Prescriptions.css';

const PrescriptionFilter = {
  ALL: 'all',
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
};

const PharmacistPrescriptions = () => {
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState(PrescriptionFilter.ALL);

  // Statistics
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchQuery, currentFilter, allPrescriptions]);

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

  const filterPrescriptions = () => {
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

    // Sort by newest first
    filtered.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bDate - aDate;
    });

    setFilteredPrescriptions(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  const getHeaderDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  };

  const handleView = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const handleApprove = async (prescription) => {
    if (!prescription || !prescription.pharmacyItems || prescription.pharmacyItems.length === 0) {
      alert('No medicines to dispense');
      return;
    }

    if (prescription.dispensed) {
      alert('This prescription has already been dispensed');
      return;
    }

    const confirmMsg = `Approve and dispense prescription for ${prescription.patientName}?\n\nMedicines: ${prescription.pharmacyItems.length}\nTotal: ₹${prescription.total.toFixed(2)}`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setLoading(true);

      // Prepare items for dispensing
      const items = prescription.pharmacyItems.map(item => ({
        medicineId: item.medicineId,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        metadata: {
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          notes: item.notes
        }
      }));

      // Call dispense API
      const response = await authService.post('/pharmacy/records/dispense', {
        patientId: prescription.patientId,
        appointmentId: prescription.appointmentId,
        items: items,
        paid: false,
        notes: prescription.notes || `Dispensed from intake ${prescription._id}`
      });

      if (response && response.success) {
        alert('✅ Prescription approved and dispensed successfully!');
        await loadPrescriptions();
      } else {
        throw new Error(response?.message || 'Failed to dispense');
      }
    } catch (err) {
      console.error('Error dispensing prescription:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to dispense prescription';
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (prescription) => {
    if (!window.confirm(`Delete prescription for ${prescription.patientName}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      // Call delete API (you may need to implement this endpoint)
      const response = await authService.delete(`/pharmacy/prescriptions/${prescription._id}`);

      if (response && response.success) {
        alert('✅ Prescription deleted successfully!');
        await loadPrescriptions();
      } else {
        throw new Error(response?.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting prescription:', err);
      alert(`❌ Error: ${err.message || 'Failed to delete prescription'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && allPrescriptions.length === 0) {
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
      {/* Dashboard Header */}
      <div className="dashboard-header-premium">
        <div className="header-title-section">
          <div className="header-icon-box">
            <MdDescription size={28} />
          </div>
          <div className="header-text">
            <h1>Clinical <span>Prescriptions</span></h1>
            <p>{getHeaderDate()} — MANAGE AND DISPENSE HUB ORDERS</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={loadPrescriptions} className="btn-refresh-premium" disabled={loading}>
            <MdRefresh size={20} className={loading ? 'spinning' : ''} />
            <span>Sync Hub</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="stats-dashboard-premium">
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper success">
            <MdCalendarToday size={22} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">TODAY'S ORDERS</span>
            <span className="stat-value">{todayCount}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper info">
            <MdInventory size={22} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">WEEKLY VOLUME</span>
            <span className="stat-value">{weekCount}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper primary">
            <MdDescription size={22} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">TOTAL RECORDS</span>
            <span className="stat-value">{totalCount}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper warning">
            <MdFilterAlt size={22} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">MATCHING SEARCH</span>
            <span className="stat-value">{filteredPrescriptions.length}</span>
          </div>
        </div>
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

        <button onClick={loadPrescriptions} className="btn-refresh" title="Refresh" disabled={loading}>
          <MdRefresh size={20} />
        </button>
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

      {/* Prescriptions Table */}
      {filteredPrescriptions.length === 0 ? (
        <div className="prescriptions-empty">
          <MdDescription size={64} className="empty-icon" />
          <h3>No Prescriptions Found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>PATIENT DETAILS</th>
                <th>MEDICINES</th>
                <th>BILLING AMOUNT</th>
                <th>ORDERED ON</th>
                <th>FULFILLMENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.map((p, idx) => (
                <tr key={p._id || idx}>
                  <td>
                    <div className="medicine-identity-cell">
                      <span className="medicine-primary-name">{p.patientName || 'Unknown Patient'}</span>
                      <span className="medicine-secondary-info">{p.patientPhone || 'NO CONTACT'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="stock-level-cell">
                      <span className={`stock-count-indicator info`}>{p.pharmacyItems?.length || 0}</span>
                      <span className="stock-unit">Products</span>
                    </div>
                  </td>
                  <td>
                    <div className="stock-level-cell">
                      <span className="stock-unit">₹</span>
                      <span className="stock-count-indicator" style={{ color: '#0F172A' }}>
                        {p.total ? p.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="medicine-secondary-info" style={{ fontWeight: '700' }}>
                      {formatDate(p.createdAt)}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge-premium ${p.dispensed ? 'success' : 'warning'}`}>
                      {p.dispensed ? <MdCheckCircle /> : <MdRefresh className="spinning" />}
                      {p.dispensed ? 'DISPENSED' : 'PENDING HUB'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <button className="pagination-btn" onClick={() => handleView(p)} title="View Hub Details">
                        <MdVisibility />
                      </button>
                      {!p.dispensed && (
                        <>
                          <button className="btn-refresh-premium" style={{ padding: '8px 12px', borderRadius: '8px' }} onClick={() => handleApprove(p)} title="Approve & Release">
                            <MdCheckCircle />
                          </button>
                          <button className="pagination-btn" style={{ color: '#EF4444' }} onClick={() => handleDelete(p)} title="Remove Record">
                            <MdDelete />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Prescription Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <MdClose size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Patient Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedPrescription.patientName || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedPrescription.patientPhone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(selectedPrescription.createdAt)}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Medicines ({selectedPrescription.pharmacyItems?.length || 0})</h3>
                {selectedPrescription.pharmacyItems && selectedPrescription.pharmacyItems.length > 0 ? (
                  <table className="medicines-detail-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Qty</th>
                        <th>Instructions</th>
                        <th>Total</th>

                      </tr>
                    </thead>
                    <tbody>
                      {selectedPrescription.pharmacyItems.map((med, idx) => (
                        <tr key={idx}>
                          <td><strong>{med.name || 'Unknown'}</strong></td>
                          <td>{med.dosage || '-'}</td>
                          <td>{med.frequency || '-'}</td>
                          <td>{med.duration ? `${med.duration} days` : '-'}</td>
                          <td>{med.quantity || 0}</td>
                          <td>{med.notes || med.instructions || '-'}</td>
                          <td>₹{((med.quantity || 0) * (med.unitPrice || 0)).toFixed(2)}</td>

                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'right' }}><strong>Total:</strong></td>
                        <td><strong>₹{selectedPrescription.total?.toFixed(2) || '0.00'}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p>No medicines prescribed</p>
                )}
              </div>

              {selectedPrescription.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <p className="notes-text">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!selectedPrescription.dispensed && (
                <button
                  className="btn-modal-approve"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleApprove(selectedPrescription);
                  }}
                >
                  <MdCheckCircle size={18} />
                  Approve & Dispense
                </button>
              )}
              <button className="btn-modal-close" onClick={() => setShowDetailsModal(false)}>
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

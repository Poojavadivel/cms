import React, { useState, useEffect } from 'react';
import { authService } from '../../services';
import {
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdDescription,
  MdPerson,
  MdLocalHospital,
  MdCalendarToday,
  MdCheckCircle,
  MdPending,
} from 'react-icons/md';
import './Prescriptions.css';

const PharmacistPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchQuery, filterStatus, prescriptions]);

  const loadPrescriptions = async () => {
    setIsLoading(true);
    try {
      const response = await authService.get('/api/pharmacy/prescriptions/pending');
      if (response?.prescriptions) {
        setPrescriptions(response.prescriptions);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rx =>
        rx.patientName?.toLowerCase().includes(query) ||
        rx.doctorName?.toLowerCase().includes(query) ||
        rx._id?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(rx => {
        if (filterStatus === 'pending') return !rx.dispensed;
        if (filterStatus === 'dispensed') return rx.dispensed;
        return true;
      });
    }

    setFilteredPrescriptions(filtered);
    setCurrentPage(1);
  };

  const handleDispense = async (prescriptionId) => {
    try {
      await authService.post(`/api/pharmacy/prescriptions/${prescriptionId}/dispense`);
      loadPrescriptions();
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      alert('Failed to dispense prescription');
    }
  };

  const paginatedPrescriptions = filteredPrescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="pharmacist-prescriptions">
      <div className="prescriptions-header">
        <h1>Prescriptions</h1>
        <button className="btn-primary" onClick={loadPrescriptions}>
          <MdRefresh size={20} />
          Refresh
        </button>
      </div>

      <div className="prescriptions-toolbar">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Search by patient, doctor, or prescription ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <MdFilterList size={20} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="dispensed">Dispensed</option>
          </select>
        </div>
      </div>

      <div className="prescriptions-stats">
        <div className="stat-pill">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{filteredPrescriptions.length}</span>
        </div>
        <div className="stat-pill warning">
          <span className="stat-label">Pending:</span>
          <span className="stat-value">
            {prescriptions.filter(p => !p.dispensed).length}
          </span>
        </div>
        <div className="stat-pill success">
          <span className="stat-label">Dispensed:</span>
          <span className="stat-value">
            {prescriptions.filter(p => p.dispensed).length}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading prescriptions...</div>
      ) : (
        <>
          <div className="prescriptions-grid">
            {paginatedPrescriptions.length === 0 ? (
              <div className="empty-state">No prescriptions found</div>
            ) : (
              paginatedPrescriptions.map((rx) => (
                <div key={rx._id} className="prescription-card">
                  <div className="card-header">
                    <div className="prescription-id">
                      <MdDescription size={18} />
                      #{rx._id?.slice(-8)}
                    </div>
                    <span className={`status-badge ${rx.dispensed ? 'success' : 'pending'}`}>
                      {rx.dispensed ? <MdCheckCircle size={16} /> : <MdPending size={16} />}
                      {rx.dispensed ? 'Dispensed' : 'Pending'}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <MdPerson size={18} />
                      <div className="info-content">
                        <span className="info-label">Patient</span>
                        <span className="info-value">{rx.patientName || 'Unknown'}</span>
                      </div>
                    </div>

                    <div className="info-row">
                      <MdLocalHospital size={18} />
                      <div className="info-content">
                        <span className="info-label">Doctor</span>
                        <span className="info-value">Dr. {rx.doctorName || 'Unknown'}</span>
                      </div>
                    </div>

                    <div className="info-row">
                      <MdCalendarToday size={18} />
                      <div className="info-content">
                        <span className="info-label">Date</span>
                        <span className="info-value">{formatDate(rx.createdAt)}</span>
                      </div>
                    </div>

                    {rx.medicines && rx.medicines.length > 0 && (
                      <div className="medicines-section">
                        <div className="medicines-label">Medicines ({rx.medicines.length})</div>
                        <div className="medicines-list">
                          {rx.medicines.map((med, index) => (
                            <div key={index} className="medicine-item">
                              <span className="medicine-name">{med.name}</span>
                              <span className="medicine-qty">Qty: {med.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {!rx.dispensed && (
                    <div className="card-footer">
                      <button
                        className="btn-dispense"
                        onClick={() => handleDispense(rx._id)}
                      >
                        <MdCheckCircle size={18} />
                        Mark as Dispensed
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PharmacistPrescriptions;

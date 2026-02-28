import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchBeds,
  searchPatients,
  assignBed,
  dischargeBed,
  markBedAvailable,
} from '../../../services/bedsService';
import {
  MdHotel,
  MdPerson,
  MdCleaningServices,
  MdRefresh,
  MdKingBed,
  MdLocalHospital,
  MdCheckCircle,
  MdWarning,
  MdClose,
  MdSearch,
  MdNotes,
} from 'react-icons/md';
import './WardMap.css';

/* ─── Summary Widget ─── */
const BedSummary = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    { label: 'Total Beds', value: summary.totalBeds, icon: <MdKingBed size={28} />, className: 'summary-card total' },
    { label: 'Available', value: summary.available, icon: <MdCheckCircle size={28} />, className: 'summary-card available' },
    { label: 'Occupied', value: summary.occupied, icon: <MdPerson size={28} />, className: 'summary-card occupied' },
    { label: 'Cleaning', value: summary.cleaning, icon: <MdCleaningServices size={28} />, className: 'summary-card cleaning' },
    { label: 'Occupancy Rate', value: `${summary.occupancyRate}%`, icon: <MdLocalHospital size={28} />, className: 'summary-card rate' },
  ];

  return (
    <div className="bed-summary">
      {cards.map((card) => (
        <div key={card.label} className={card.className}>
          <div className="summary-icon">{card.icon}</div>
          <div className="summary-info">
            <span className="summary-value">{card.value}</span>
            <span className="summary-label">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Single Bed Card ─── */
const BedCard = ({ bed, onClick, busy }) => {
  const statusConfig = {
    AVAILABLE: { className: 'bed-card available', icon: <MdHotel size={32} />, statusLabel: 'Available' },
    OCCUPIED:  { className: 'bed-card occupied',  icon: <MdPerson size={32} />, statusLabel: 'Occupied' },
    CLEANING:  { className: 'bed-card cleaning',  icon: <MdCleaningServices size={32} />, statusLabel: 'Cleaning' },
  };
  const config = statusConfig[bed.status] || statusConfig.AVAILABLE;

  const tooltips = {
    AVAILABLE: 'Click to assign a patient',
    OCCUPIED:  'Click to discharge patient',
    CLEANING:  'Click to mark as available',
  };

  return (
    <button
      className={`${config.className} ${busy ? 'toggling' : ''}`}
      onClick={() => onClick(bed)}
      disabled={busy}
      title={`${tooltips[bed.status]} — ${bed.label}`}
    >
      <div className="bed-icon">{config.icon}</div>
      <div className="bed-label">{bed.label}</div>
      <div className="bed-status-tag">{config.statusLabel}</div>
      {bed.status === 'OCCUPIED' && bed.patientName && (
        <div className="bed-patient">
          <MdPerson size={14} />
          <span>{bed.patientName}</span>
        </div>
      )}
    </button>
  );
};

/* ─── Ward Section ─── */
const WardSection = ({ ward, onBedClick, busyBedId }) => {
  const available = ward.beds.filter((b) => b.status === 'AVAILABLE').length;
  const total = ward.beds.length;

  return (
    <div className="ward-section">
      <div className="ward-header">
        <div className="ward-title">
          <MdLocalHospital size={22} />
          <h2>{ward.name}</h2>
        </div>
        <div className="ward-meta">
          {ward.description && <span className="ward-desc">{ward.description}</span>}
          {ward.floor && <span className="ward-floor">{ward.floor}</span>}
          <span className="ward-availability">{available}/{total} available</span>
        </div>
      </div>
      <div className="beds-grid">
        {ward.beds.map((bed) => (
          <BedCard key={bed._id} bed={bed} onClick={onBedClick} busy={busyBedId === bed._id} />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MODALS
   ═══════════════════════════════════════ */

/* ─── Assign Patient Modal (AVAILABLE bed) ─── */
const AssignModal = ({ bed, onClose, onConfirm }) => {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  // Debounced patient search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) {
      setPatients([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPatients(query.trim());
        if (res.success) setPatients(res.data);
      } catch {
        setPatients([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSubmit = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await assignBed(bed._id, selectedPatient._id, notes);
      if (res.success) {
        onConfirm();
      } else {
        setError(res.message || 'Assignment failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign patient.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header assign">
          <h3><MdHotel size={22} /> Assign Patient to {bed.label}</h3>
          <button className="modal-close" onClick={onClose}><MdClose size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Patient search */}
          <label className="modal-label">Search Patient</label>
          <div className="patient-search-box">
            <MdSearch size={18} className="search-icon" />
            <input
              type="text"
              className="modal-input"
              placeholder="Name, code or phone..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedPatient(null); }}
              autoFocus
            />
            {searching && <span className="search-spinner" />}
          </div>

          {/* Patient results */}
          {!selectedPatient && patients.length > 0 && (
            <ul className="patient-list">
              {patients.map((p) => {
                const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
                return (
                  <li key={p._id} className="patient-item" onClick={() => { setSelectedPatient({ ...p, fullName }); setPatients([]); setQuery(fullName); }}>
                    <MdPerson size={18} />
                    <div className="patient-item-info">
                      <span className="patient-item-name">{fullName}</span>
                      <span className="patient-item-meta">{p.patientCode} • {p.phone}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!selectedPatient && query.trim().length > 0 && patients.length === 0 && !searching && (
            <p className="no-results">No patients found for "{query}"</p>
          )}

          {/* Selected patient badge */}
          {selectedPatient && (
            <div className="selected-patient-badge">
              <MdPerson size={18} />
              <span>{selectedPatient.fullName}</span>
              <span className="patient-code">{selectedPatient.patientCode}</span>
              <button className="badge-remove" onClick={() => { setSelectedPatient(null); setQuery(''); }}>
                <MdClose size={16} />
              </button>
            </div>
          )}

          {/* Notes */}
          <label className="modal-label notes-label"><MdNotes size={16} /> Notes (optional)</label>
          <textarea
            className="modal-textarea"
            placeholder="Any notes about this admission..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="modal-btn confirm assign" onClick={handleSubmit} disabled={submitting || !selectedPatient}>
            {submitting ? 'Assigning...' : 'Assign Patient'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Discharge Modal (OCCUPIED bed) ─── */
const DischargeModal = ({ bed, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await dischargeBed(bed._id, reason);
      if (res.success) {
        onConfirm();
      } else {
        setError(res.message || 'Discharge failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to discharge patient.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container discharge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header discharge">
          <h3><MdPerson size={22} /> Discharge Patient — {bed.label}</h3>
          <button className="modal-close" onClick={onClose}><MdClose size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="discharge-patient-info">
            <MdPerson size={24} />
            <div>
              <p className="discharge-name">{bed.patientName || 'Unknown Patient'}</p>
              <p className="discharge-bed">Bed: {bed.label}</p>
            </div>
          </div>

          <label className="modal-label">Discharge Reason (optional)</label>
          <textarea
            className="modal-textarea"
            placeholder="Reason for discharge..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
          />

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="modal-btn confirm discharge" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Discharging...' : 'Confirm Discharge'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Mark Available Modal (CLEANING bed) ─── */
const MarkAvailableModal = ({ bed, onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await markBedAvailable(bed._id);
      if (res.success) {
        onConfirm();
      } else {
        setError(res.message || 'Failed to mark available.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark bed available.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container cleaning-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header cleaning">
          <h3><MdCleaningServices size={22} /> Mark Bed Available — {bed.label}</h3>
          <button className="modal-close" onClick={onClose}><MdClose size={20} /></button>
        </div>

        <div className="modal-body">
          <p className="cleaning-prompt">
            Cleaning is complete for <strong>{bed.label}</strong>. Mark this bed as available for new patients?
          </p>
          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="modal-btn confirm available" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Updating...' : 'Mark Available'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN WARD MAP COMPONENT
   ═══════════════════════════════════════ */
const WardMap = () => {
  const [wards, setWards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyBedId, setBusyBedId] = useState(null);

  // Modal state
  const [modalType, setModalType] = useState(null); // 'assign' | 'discharge' | 'cleaning' | null
  const [selectedBed, setSelectedBed] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchBeds();
      if (result.success) {
        setWards(result.data.wards);
        setSummary(result.data.summary);
      } else {
        setError('Failed to load bed data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  /* Open the correct modal based on bed status */
  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    if (bed.status === 'AVAILABLE') setModalType('assign');
    else if (bed.status === 'OCCUPIED') setModalType('discharge');
    else if (bed.status === 'CLEANING') setModalType('cleaning');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedBed(null);
  };

  /* After any successful modal action, refresh data & close */
  const handleModalSuccess = () => {
    closeModal();
    loadData();
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="ward-map-container">
        <div className="ward-map-loading">
          <div className="loading-spinner" />
          <p>Loading Ward Map...</p>
        </div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (error) {
    return (
      <div className="ward-map-container">
        <div className="ward-map-error">
          <MdWarning size={48} />
          <h3>Unable to load bed data</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadData}>
            <MdRefresh size={18} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ward-map-container">
      {/* Page Header */}
      <div className="ward-map-header">
        <div>
          <h1>Ward Map</h1>
          <p className="ward-map-subtitle">Real-time bed allocation & occupancy overview</p>
        </div>
        <button className="refresh-btn" onClick={loadData} title="Refresh data">
          <MdRefresh size={20} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Dashboard */}
      <BedSummary summary={summary} />

      {/* Legend */}
      <div className="bed-legend">
        <span className="legend-item">
          <span className="legend-dot available" />Available — click to assign patient
        </span>
        <span className="legend-item">
          <span className="legend-dot occupied" />Occupied — click to discharge
        </span>
        <span className="legend-item">
          <span className="legend-dot cleaning" />Cleaning — click to mark available
        </span>
      </div>

      {/* Ward Sections */}
      {wards.length === 0 ? (
        <div className="ward-map-empty">
          <MdKingBed size={64} />
          <h3>No wards found</h3>
          <p>Run the seed script to populate ward and bed data.</p>
        </div>
      ) : (
        wards.map((ward) => (
          <WardSection
            key={ward._id}
            ward={ward}
            onBedClick={handleBedClick}
            busyBedId={busyBedId}
          />
        ))
      )}

      {/* ─── Modals ─── */}
      {modalType === 'assign' && selectedBed && (
        <AssignModal bed={selectedBed} onClose={closeModal} onConfirm={handleModalSuccess} />
      )}
      {modalType === 'discharge' && selectedBed && (
        <DischargeModal bed={selectedBed} onClose={closeModal} onConfirm={handleModalSuccess} />
      )}
      {modalType === 'cleaning' && selectedBed && (
        <MarkAvailableModal bed={selectedBed} onClose={closeModal} onConfirm={handleModalSuccess} />
      )}
    </div>
  );
};

export default WardMap;

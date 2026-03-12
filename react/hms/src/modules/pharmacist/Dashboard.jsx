import React, { useState, useEffect } from 'react';
import { authService } from '../../services';
import {
  MdLocalPharmacy,
  MdWarning,
  MdBlock,
  MdEventBusy,
  MdRefresh,
  MdNotifications,
  MdCheckCircle,
  MdInventory,
  MdCalendarToday,
  MdAddCircle,
  MdSearch,
  MdDescription,
  MdArrowForward,
  MdAttachMoney,
} from 'react-icons/md';
import './Dashboard.css';

const PharmacistDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStock: 0,
    outOfStock: 0,
    expiringBatches: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const toInt = (value) => {
    if (value == null) return 0;
    if (typeof value === 'number') return Math.floor(value);
    if (typeof value === 'string') return parseInt(value) || 0;
    return 0;
  };

  const toDouble = (value) => {
    if (value == null) return 0.0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0.0;
    return 0.0;
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load medicines
      const medicinesResponse = await authService.get('/pharmacy/medicines?limit=100');

      // Normalize medicines response
      let medicinesData = [];
      if (Array.isArray(medicinesResponse)) {
        medicinesData = medicinesResponse;
      } else if (medicinesResponse && typeof medicinesResponse === 'object') {
        medicinesData = medicinesResponse.medicines || medicinesResponse.data || [];
      }

      // Load batches
      const batchResponse = await authService.get('/pharmacy/batches?limit=100');
      let batchList = [];
      if (Array.isArray(batchResponse)) {
        batchList = batchResponse;
      } else if (batchResponse && typeof batchResponse === 'object') {
        batchList = batchResponse.batches || batchResponse.data || [];
      }

      // Calculate stats
      let lowStock = 0;
      let outOfStock = 0;
      let totalValue = 0.0;

      for (const med of medicinesData) {
        const stock = toInt(med.availableQty || med.stock || 0);
        const reorderLevel = toInt(med.reorderLevel || 20);

        if (stock === 0) {
          outOfStock++;
        } else if (stock <= reorderLevel) {
          lowStock++;
        }
      }

      // Count expiring batches (within 90 days)
      let expiringBatches = 0;
      const now = new Date();
      for (const batch of batchList) {
        const expiryStr = batch.expiryDate?.toString();
        if (expiryStr) {
          try {
            const expiryDate = new Date(expiryStr);
            const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
              expiringBatches++;
            }

            // Calculate total value
            const quantity = toInt(batch.quantity || 0);
            const salePrice = toDouble(batch.salePrice || 0);
            totalValue += quantity * salePrice;
          } catch (e) {
            // Skip invalid dates
          }
        }
      }

      setMedicines(medicinesData);
      setBatches(batchList);
      setStats({
        totalMedicines: medicinesData.length,
        lowStock,
        outOfStock,
        expiringBatches,
        totalValue,
      });

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getLowStockMedicines = () => {
    return medicines
      .filter(med => {
        const stock = toInt(med.availableQty || med.stock || 0);
        const reorderLevel = toInt(med.reorderLevel || 20);
        return stock > 0 && stock <= reorderLevel;
      })
      .slice(0, 5);
  };

  const getExpiringBatches = () => {
    const now = new Date();
    return batches
      .filter(batch => {
        const expiryStr = batch.expiryDate?.toString();
        if (!expiryStr) return false;
        try {
          const expiryDate = new Date(expiryStr);
          const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
        } catch (e) {
          return false;
        }
      })
      .slice(0, 5);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const lowStockMedicines = getLowStockMedicines();
  const expiringBatches = getExpiringBatches();
  const alertCount = stats.expiringBatches + stats.outOfStock;

  return (
    <div className="pharmacist-dashboard">
      {/* Dashboard Header Premium */}
      <div className="dashboard-header-premium">
        <div className="header-title-section">
          <div className="header-icon-box">
            <MdLocalPharmacy size={32} />
          </div>
          <div className="header-text">
            <h1>Good {getTimeOfDay()}, <span>Pharmacist</span></h1>
            <p>{formatDate(new Date())} — HOSPITAL PHARMACY HUB</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={loadDashboardData} className="btn-refresh-premium" disabled={isLoading}>
            <MdRefresh size={20} className={isLoading ? 'spinning' : ''} />
            <span>Sync Data</span>
          </button>
          <div className="alerts-indicator">
            <MdNotifications size={22} />
            {alertCount > 0 && <span className="alert-badge">{alertCount}</span>}
          </div>
        </div>
      </div>

      {/* Stats Cards Premium */}
      <div className="stats-grid-premium">
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper blue">
            <MdInventory size={24} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">TOTAL MEDICINES</span>
            <span className="stat-value">{stats.totalMedicines}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper orange">
            <MdWarning size={24} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">LOW STOCK ITEMS</span>
            <span className="stat-value">{stats.lowStock}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper red">
            <MdBlock size={24} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">OUT OF STOCK</span>
            <span className="stat-value">{stats.outOfStock}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper yellow">
            <MdEventBusy size={24} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">EXPIRING SOON</span>
            <span className="stat-value">{stats.expiringBatches}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Column */}
        <div className="content-left">
          <div className="premium-alert-card">
            <div className="alert-card-header">
              <div className="header-icon warning"><MdWarning /></div>
              <h3>Low Stock Alert</h3>
              <span className="count-pill warning">{stats.lowStock} Items</span>
            </div>
            <div className="alert-table-wrapper">
              <table className="premium-small-table">
                <thead>
                  <tr>
                    <th>MEDICINE NAME</th>
                    <th>SKU</th>
                    <th>STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockMedicines.length === 0 ? (
                    <tr><td colSpan="3" className="empty-row">No low stock items</td></tr>
                  ) : (
                    lowStockMedicines.map((med, idx) => (
                      <tr key={idx}>
                        <td><strong>{med.name}</strong></td>
                        <td>{med.sku}</td>
                        <td><span className="stock-alert-badge">{toInt(med.availableQty || med.stock || 0)} Units</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="premium-alert-card">
            <div className="alert-card-header">
              <div className="header-icon danger"><MdEventBusy /></div>
              <h3>Expiring Batches</h3>
              <span className="count-pill danger">{stats.expiringBatches} Batches</span>
            </div>
            <div className="alert-table-wrapper">
              <table className="premium-small-table">
                <thead>
                  <tr>
                    <th>MEDICINE</th>
                    <th>BATCH #</th>
                    <th>REMAINING</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringBatches.length === 0 ? (
                    <tr><td colSpan="3" className="empty-row">No expiring batches</td></tr>
                  ) : (
                    expiringBatches.map((batch, idx) => (
                      <tr key={idx}>
                        <td><strong>{batch.medicineName}</strong></td>
                        <td>{batch.batchNumber}</td>
                        <td className="expiry-td">
                          <span className={`expiry-pill ${getDaysUntilExpiry(batch.expiryDate) < 30 ? 'critical' : ''}`}>
                            {getDaysUntilExpiry(batch.expiryDate)} Days
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="content-right">
          <div className="quick-actions-premium">
            <h3 className="section-title-premium">Quick Actions</h3>
            <div className="tile-grid">
              <button className="tile-btn primary">
                <div className="tile-icon"><MdAddCircle /></div>
                <span>Add Medicine</span>
              </button>
              <button className="tile-btn success">
                <div className="tile-icon"><MdInventory /></div>
                <span>Add Batch</span>
              </button>
              <button className="tile-btn warning">
                <div className="tile-icon"><MdDescription /></div>
                <span>Prescriptions</span>
              </button>
              <button className="tile-btn info">
                <div className="tile-icon"><MdSearch /></div>
                <span>Search Hub</span>
              </button>
            </div>
          </div>

          <div className="system-status-premium">
            <h3 className="section-title-premium">Operational Status</h3>
            <div className="status-grid-mini">
              <div className="mini-status-item">
                <div className="dot pulse green"></div>
                <div className="mini-label">Database <span>Operational</span></div>
              </div>
              <div className="mini-status-item">
                <div className="dot pulse green"></div>
                <div className="mini-label">API <span>Stable</span></div>
              </div>
              <div className="mini-status-item value-indicator">
                <MdAttachMoney />
                <div className="mini-label">Inv. Value: <span>₹{stats.totalValue.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;

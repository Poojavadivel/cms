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
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-info">
          <h1 className="header-title">Good {getTimeOfDay()}, Pharmacist</h1>
          <p className="header-date">{formatDate(new Date())}</p>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={loadDashboardData}>
            <MdRefresh size={18} />
            <span>Refresh</span>
          </button>
          <button className="header-btn notification-btn">
            <MdNotifications size={18} />
            <span>Alerts</span>
            {alertCount > 0 && <span className="badge">{alertCount > 99 ? '99+' : alertCount}</span>}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon-container stat-icon-blue">
            <MdLocalPharmacy size={24} />
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.totalMedicines}</h2>
            <p className="stat-label">Total Medicines</p>
            <p className="stat-subtitle">{medicines.length} items</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon-container stat-icon-orange">
            <MdWarning size={24} />
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.lowStock}</h2>
            <p className="stat-label">Low Stock</p>
            <p className="stat-subtitle">Need reorder</p>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon-container stat-icon-red">
            <MdBlock size={24} />
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.outOfStock}</h2>
            <p className="stat-label">Out of Stock</p>
            <p className="stat-subtitle">Urgent action</p>
          </div>
        </div>

        <div className="stat-card stat-alert">
          <div className="stat-icon-container stat-icon-yellow">
            <MdCalendarToday size={24} />
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.expiringBatches}</h2>
            <p className="stat-label">Expiring Soon</p>
            <p className="stat-subtitle">Within 90 days</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Column */}
        <div className="content-left">
          {/* Low Stock Alert */}
          <div className="info-card">
            <div className="card-header">
              <div className="card-header-left">
                <MdWarning className="card-icon warning-icon" size={24} />
                <h3 className="card-title">Low Stock Alert</h3>
              </div>
              <span className="badge badge-warning">{lowStockMedicines.length} items</span>
            </div>
            <div className="card-body">
              {lowStockMedicines.length === 0 ? (
                <div className="empty-state">
                  <p>No low stock items</p>
                </div>
              ) : (
                <div className="items-list">
                  {lowStockMedicines.map((med, index) => {
                    const stock = toInt(med.availableQty || med.stock || 0);
                    return (
                      <div key={index} className="alert-item alert-item-warning">
                        <div className="alert-item-icon">
                          <MdLocalPharmacy size={20} />
                        </div>
                        <div className="alert-item-content">
                          <p className="alert-item-name">{med.name || 'Unknown'}</p>
                          <p className="alert-item-sku">SKU: {med.sku || 'N/A'}</p>
                        </div>
                        <span className="alert-item-badge badge-warning">{stock} units</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Expiring Batches */}
          <div className="info-card">
            <div className="card-header">
              <div className="card-header-left">
                <MdCalendarToday className="card-icon danger-icon" size={24} />
                <h3 className="card-title">Expiring Batches</h3>
              </div>
              <span className="badge badge-danger">{expiringBatches.length} batches</span>
            </div>
            <div className="card-body">
              {expiringBatches.length === 0 ? (
                <div className="empty-state">
                  <p>No expiring batches</p>
                </div>
              ) : (
                <div className="items-list">
                  {expiringBatches.map((batch, index) => {
                    const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                    return (
                      <div key={index} className="alert-item alert-item-danger">
                        <div className="alert-item-icon">
                          <MdInventory size={20} />
                        </div>
                        <div className="alert-item-content">
                          <p className="alert-item-name">{batch.medicineName || 'Unknown'}</p>
                          <p className="alert-item-sku">Batch: {batch.batchNumber || 'N/A'}</p>
                        </div>
                        <span className="alert-item-badge badge-danger">{daysLeft} days</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="content-right">
          {/* Quick Actions */}
          <div className="info-card">
            <h3 className="card-title">Quick Actions</h3>
            <div className="card-body">
              <div className="quick-actions">
                <button className="quick-action-btn action-primary">
                  <MdAddCircle size={20} />
                  <span>Add Medicine</span>
                  <MdArrowForward size={16} className="action-arrow" />
                </button>
                <button className="quick-action-btn action-success">
                  <MdInventory size={20} />
                  <span>Add Batch</span>
                  <MdArrowForward size={16} className="action-arrow" />
                </button>
                <button className="quick-action-btn action-warning">
                  <MdDescription size={20} />
                  <span>New Prescription</span>
                  <MdArrowForward size={16} className="action-arrow" />
                </button>
                <button className="quick-action-btn action-info">
                  <MdSearch size={20} />
                  <span>Search Medicine</span>
                  <MdArrowForward size={16} className="action-arrow" />
                </button>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="info-card">
            <h3 className="card-title">System Status</h3>
            <div className="card-body">
              <div className="status-items">
                <div className="status-item status-success">
                  <MdCheckCircle size={20} />
                  <div className="status-content">
                    <span className="status-label">Database</span>
                    <span className="status-value">Connected</span>
                  </div>
                </div>
                <div className="status-item status-success">
                  <MdCheckCircle size={20} />
                  <div className="status-content">
                    <span className="status-label">API Status</span>
                    <span className="status-value">Operational</span>
                  </div>
                </div>
                <div className="status-item status-primary">
                  <MdAttachMoney size={20} />
                  <div className="status-content">
                    <span className="status-label">Inventory Value</span>
                    <span className="status-value">₹{stats.totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;

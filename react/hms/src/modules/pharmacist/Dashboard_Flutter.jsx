import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import {
  MdLocalPharmacy,
  MdWarning,
  MdBlock,
  MdCalendarToday,
  MdRefresh,
  MdNotifications,
  MdCheckCircle,
  MdInventory,
  MdAddCircle,
  MdSearch,
  MdDescription,
  MdArrowForward,
} from 'react-icons/md';
import './Dashboard_Flutter.css';

const PharmacistDashboard = () => {
  const navigate = useNavigate();
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
        } catch {
          return false;
        }
      })
      .slice(0, 5);
  };

  const getDaysUntilExpiry = (expiryDateStr) => {
    if (!expiryDateStr) return 0;
    try {
      const now = new Date();
      const expiryDate = new Date(expiryDateStr);
      return Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="flutter-pharmacist-dashboard">
        <div className="flutter-dashboard-scroll">
          {/* Header Skeleton */}
          <div className="flutter-header">
            <div className="flutter-header-info">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text" style={{ width: '200px' }}></div>
            </div>
            <div className="flutter-header-actions">
              <div className="skeleton skeleton-button"></div>
              <div className="skeleton skeleton-button"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="flutter-stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flutter-stat-card">
                <div className="skeleton skeleton-icon"></div>
                <div className="skeleton skeleton-stat-value"></div>
                <div className="skeleton skeleton-text" style={{ width: '120px' }}></div>
                <div className="skeleton skeleton-text-sm" style={{ width: '80px' }}></div>
              </div>
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="flutter-content-grid">
            <div className="flutter-content-left">
              {/* Low Stock Card Skeleton */}
              <div className="flutter-card">
                <div className="flutter-card-header">
                  <div className="skeleton skeleton-text" style={{ width: '150px' }}></div>
                  <div className="skeleton skeleton-badge"></div>
                </div>
                <div className="flutter-card-body">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-list-item">
                      <div className="skeleton skeleton-circle"></div>
                      <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: '8px' }}></div>
                        <div className="skeleton skeleton-text-sm" style={{ width: '40%' }}></div>
                      </div>
                      <div className="skeleton skeleton-badge"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiring Batches Skeleton */}
              <div className="flutter-card">
                <div className="flutter-card-header">
                  <div className="skeleton skeleton-text" style={{ width: '150px' }}></div>
                  <div className="skeleton skeleton-badge"></div>
                </div>
                <div className="flutter-card-body">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-list-item">
                      <div className="skeleton skeleton-circle"></div>
                      <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: '8px' }}></div>
                        <div className="skeleton skeleton-text-sm" style={{ width: '40%' }}></div>
                      </div>
                      <div className="skeleton skeleton-badge"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flutter-content-right">
              {/* Quick Actions Skeleton */}
              <div className="flutter-card">
                <div className="skeleton skeleton-text" style={{ width: '120px', marginBottom: '16px' }}></div>
                <div className="flutter-card-body">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton skeleton-action-btn" style={{ marginBottom: '12px' }}></div>
                  ))}
                </div>
              </div>

              {/* Status Skeleton */}
              <div className="flutter-card">
                <div className="skeleton skeleton-text" style={{ width: '120px', marginBottom: '16px' }}></div>
                <div className="flutter-card-body">
                  {[1, 2].map((i) => (
                    <div key={i} className="skeleton skeleton-status-item" style={{ marginBottom: '12px' }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lowStockMedicines = getLowStockMedicines();
  const expiringBatches = getExpiringBatches();
  const alertCount = stats.expiringBatches + stats.outOfStock;

  return (
    <div className="flutter-pharmacist-dashboard">
      <div className="flutter-dashboard-scroll">
        {/* Header */}
        <div className="flutter-header">
          <div className="flutter-header-info">
            <h1 className="flutter-header-title">Good {getTimeOfDay()}, Pharmacist</h1>
            <p className="flutter-header-date">{formatDate(new Date())}</p>
          </div>
          <div className="flutter-header-actions">
            <button className="flutter-header-btn" onClick={loadDashboardData}>
              <MdRefresh size={18} />
              <span>Refresh</span>
            </button>
            <button className="flutter-header-btn flutter-notification-btn">
              <MdNotifications size={18} />
              <span>Alerts</span>
              {alertCount > 0 && (
                <span className="flutter-badge">{alertCount > 99 ? '99+' : alertCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flutter-stats-grid">
          <div className="flutter-stat-card">
            <div className="flutter-stat-icon flutter-stat-icon-blue">
              <MdLocalPharmacy size={24} />
            </div>
            <h2 className="flutter-stat-value">{stats.totalMedicines}</h2>
            <p className="flutter-stat-label">Total Medicines</p>
            <p className="flutter-stat-subtitle">{medicines.length} items</p>
          </div>

          <div className="flutter-stat-card">
            <div className="flutter-stat-icon flutter-stat-icon-orange">
              <MdWarning size={24} />
            </div>
            <h2 className="flutter-stat-value">{stats.lowStock}</h2>
            <p className="flutter-stat-label">Low Stock</p>
            <p className="flutter-stat-subtitle">Need reorder</p>
          </div>

          <div className="flutter-stat-card">
            <div className="flutter-stat-icon flutter-stat-icon-red">
              <MdBlock size={24} />
            </div>
            <h2 className="flutter-stat-value">{stats.outOfStock}</h2>
            <p className="flutter-stat-label">Out of Stock</p>
            <p className="flutter-stat-subtitle">Urgent action</p>
          </div>

          <div className="flutter-stat-card">
            <div className="flutter-stat-icon flutter-stat-icon-yellow">
              <MdCalendarToday size={24} />
            </div>
            <h2 className="flutter-stat-value">{stats.expiringBatches}</h2>
            <p className="flutter-stat-label">Expiring Soon</p>
            <p className="flutter-stat-subtitle">Within 90 days</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flutter-content-grid">
          {/* Left Column */}
          <div className="flutter-content-left">
            {/* Low Stock Alert */}
            <div className="flutter-card">
              <div className="flutter-card-header">
                <div className="flutter-card-header-left">
                  <MdWarning className="flutter-card-icon flutter-warning-icon" size={24} />
                  <h3 className="flutter-card-title">Low Stock Alert</h3>
                </div>
                <span className="flutter-badge flutter-badge-warning">{lowStockMedicines.length} items</span>
              </div>
              <div className="flutter-card-body">
                {lowStockMedicines.length === 0 ? (
                  <div className="flutter-empty-state">
                    <MdCheckCircle size={48} color="#9ca3af" />
                    <p>No low stock items</p>
                  </div>
                ) : (
                  <div className="flutter-items-list">
                    {lowStockMedicines.map((med, index) => {
                      const stock = toInt(med.availableQty || med.stock || 0);
                      return (
                        <div key={index} className="flutter-alert-item flutter-alert-item-warning">
                          <div className="flutter-alert-icon">
                            <MdLocalPharmacy size={20} />
                          </div>
                          <div className="flutter-alert-content">
                            <p className="flutter-alert-name">{med.name || 'Unknown'}</p>
                            <p className="flutter-alert-sku">SKU: {med.sku || 'N/A'}</p>
                          </div>
                          <span className="flutter-alert-badge flutter-badge-warning">{stock} units</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Expiring Batches */}
            <div className="flutter-card">
              <div className="flutter-card-header">
                <div className="flutter-card-header-left">
                  <MdCalendarToday className="flutter-card-icon flutter-danger-icon" size={24} />
                  <h3 className="flutter-card-title">Expiring Batches</h3>
                </div>
                <span className="flutter-badge flutter-badge-danger">{expiringBatches.length} batches</span>
              </div>
              <div className="flutter-card-body">
                {expiringBatches.length === 0 ? (
                  <div className="flutter-empty-state">
                    <MdCheckCircle size={48} color="#9ca3af" />
                    <p>No expiring batches</p>
                  </div>
                ) : (
                  <div className="flutter-items-list">
                    {expiringBatches.map((batch, index) => {
                      const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                      return (
                        <div key={index} className="flutter-alert-item flutter-alert-item-danger">
                          <div className="flutter-alert-icon">
                            <MdInventory size={20} />
                          </div>
                          <div className="flutter-alert-content">
                            <p className="flutter-alert-name">{batch.medicineName || 'Unknown'}</p>
                            <p className="flutter-alert-sku">Batch: {batch.batchNumber || 'N/A'}</p>
                          </div>
                          <span className="flutter-alert-badge flutter-badge-danger">{daysLeft} days</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flutter-content-right">
            {/* Quick Actions */}
            <div className="flutter-card">
              <h3 className="flutter-card-title">Quick Actions</h3>
              <div className="flutter-card-body">
                <div className="flutter-quick-actions">
                  <button 
                    className="flutter-action-btn flutter-action-primary"
                    onClick={() => navigate('/pharmacist/medicines')}
                  >
                    <MdAddCircle size={20} />
                    <span>Add Medicine</span>
                    <MdArrowForward size={16} className="flutter-action-arrow" />
                  </button>
                  <button 
                    className="flutter-action-btn flutter-action-success"
                    onClick={() => alert('Add Batch feature coming soon!')}
                  >
                    <MdInventory size={20} />
                    <span>Add Batch</span>
                    <MdArrowForward size={16} className="flutter-action-arrow" />
                  </button>
                  <button 
                    className="flutter-action-btn flutter-action-warning"
                    onClick={() => navigate('/pharmacist/prescriptions')}
                  >
                    <MdDescription size={20} />
                    <span>New Prescription</span>
                    <MdArrowForward size={16} className="flutter-action-arrow" />
                  </button>
                  <button 
                    className="flutter-action-btn flutter-action-info"
                    onClick={() => navigate('/pharmacist/medicines')}
                  >
                    <MdSearch size={20} />
                    <span>Search Medicines</span>
                    <MdArrowForward size={16} className="flutter-action-arrow" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="flutter-card">
              <h3 className="flutter-card-title">System Status</h3>
              <div className="flutter-card-body">
                <div className="flutter-status-items">
                  <div className="flutter-status-item flutter-status-success">
                    <MdCheckCircle size={20} />
                    <div className="flutter-status-content">
                      <span className="flutter-status-label">System Status</span>
                      <span className="flutter-status-value">Operational</span>
                    </div>
                  </div>
                  <div className="flutter-status-item flutter-status-primary">
                    <MdInventory size={20} />
                    <div className="flutter-status-content">
                      <span className="flutter-status-label">Total Stock Value</span>
                      <span className="flutter-status-value">₹{stats.totalValue.toFixed(2)}</span>
                    </div>
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

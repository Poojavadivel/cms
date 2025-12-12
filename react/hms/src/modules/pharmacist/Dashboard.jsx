import React, { useState, useEffect } from 'react';
import { authService } from '../../services';
import {
  MdLocalPharmacy,
  MdWarning,
  MdBlock,
  MdEventBusy,
  MdAttachMoney,
  MdRefresh,
} from 'react-icons/md';
import './Dashboard.css';

const PharmacistDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStock: 0,
    outOfStock: 0,
    expiringBatches: 0,
    totalValue: 0,
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const medicines = await authService.get('/api/pharmacy/medicines?limit=100');
      const batches = await authService.get('/api/pharmacy/batches?limit=100');
      const prescriptions = await authService.get('/api/pharmacy/prescriptions/pending?limit=5');

      calculateStats(medicines, batches);
      
      if (prescriptions?.prescriptions) {
        setRecentPrescriptions(prescriptions.prescriptions);
      }

      const lowStock = medicines.filter(m => {
        const stock = m.availableQty || m.stock || 0;
        const reorderLevel = m.reorderLevel || 20;
        return stock > 0 && stock <= reorderLevel;
      });
      setLowStockMedicines(lowStock.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (medicines, batches) => {
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;
    let expiringBatches = 0;

    medicines.forEach(med => {
      const stock = med.availableQty || med.stock || 0;
      const reorderLevel = med.reorderLevel || 20;

      if (stock === 0) {
        outOfStock++;
      } else if (stock <= reorderLevel) {
        lowStock++;
      }
    });

    const now = new Date();
    batches.forEach(batch => {
      if (batch.expiryDate) {
        const expiryDate = new Date(batch.expiryDate);
        const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
          expiringBatches++;
        }

        const quantity = batch.quantity || 0;
        const salePrice = batch.salePrice || 0;
        totalValue += quantity * salePrice;
      }
    });

    setStats({
      totalMedicines: medicines.length,
      lowStock,
      outOfStock,
      expiringBatches,
      totalValue,
    });
  };

  const StatCard = ({ icon, title, value, color, subtext }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="pharmacist-dashboard loading">
        <div className="loader">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="pharmacist-dashboard">
      <div className="dashboard-header">
        <h1>Pharmacist Dashboard</h1>
        <button className="refresh-btn" onClick={loadDashboardData}>
          <MdRefresh size={20} />
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<MdLocalPharmacy size={32} />}
          title="Total Medicines"
          value={stats.totalMedicines}
          color="primary"
        />
        <StatCard
          icon={<MdWarning size={32} />}
          title="Low Stock"
          value={stats.lowStock}
          color="warning"
          subtext="Needs reorder"
        />
        <StatCard
          icon={<MdBlock size={32} />}
          title="Out of Stock"
          value={stats.outOfStock}
          color="danger"
          subtext="Urgent attention"
        />
        <StatCard
          icon={<MdEventBusy size={32} />}
          title="Expiring Soon"
          value={stats.expiringBatches}
          color="info"
          subtext="Within 90 days"
        />
        <StatCard
          icon={<MdAttachMoney size={32} />}
          title="Total Inventory Value"
          value={`₹${stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          color="success"
        />
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <h2>Low Stock Medicines</h2>
          <div className="medicines-list">
            {lowStockMedicines.length === 0 ? (
              <p className="empty-state">No low stock medicines</p>
            ) : (
              lowStockMedicines.map((med, index) => (
                <div key={index} className="medicine-item">
                  <div className="medicine-info">
                    <div className="medicine-name">{med.name}</div>
                    <div className="medicine-details">
                      {med.category} • {med.form}
                    </div>
                  </div>
                  <div className="medicine-stock warning">
                    Stock: {med.availableQty || med.stock || 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="content-section">
          <h2>Recent Prescriptions</h2>
          <div className="prescriptions-list">
            {recentPrescriptions.length === 0 ? (
              <p className="empty-state">No recent prescriptions</p>
            ) : (
              recentPrescriptions.map((rx, index) => (
                <div key={index} className="prescription-item">
                  <div className="prescription-info">
                    <div className="prescription-patient">{rx.patientName}</div>
                    <div className="prescription-doctor">Dr. {rx.doctorName}</div>
                  </div>
                  <div className="prescription-date">
                    {new Date(rx.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;

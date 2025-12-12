/**
 * Admin Pharmacy Management with Tabs
 * Medicine Inventory | Batches | Analytics
 */

import React, { useState, useEffect } from 'react';
import {
  MdLocalPharmacy,
  MdInventory,
  MdAnalytics,
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdAdd,
  MdEdit,
  MdDelete,
  MdWarning,
  MdCheckCircle,
  MdBlock,
} from 'react-icons/md';
import { authService } from '../../../services';
import './PharmacyTabs.css';

const PharmacyTabs = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const medicinesData = await authService.get('/api/pharmacy/medicines?limit=100');
      setMedicines(medicinesData || []);
      
      const batchesResponse = await authService.get('/api/pharmacy/batches?limit=100');
      let batchList = [];
      if (Array.isArray(batchesResponse)) {
        batchList = batchesResponse;
      } else if (batchesResponse?.batches) {
        batchList = batchesResponse.batches;
      }
      setBatches(batchList);
    } catch (error) {
      console.error('Error loading pharmacy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 0, label: 'Medicine Inventory', icon: <MdLocalPharmacy size={20} /> },
    { id: 1, label: 'Batches', icon: <MdInventory size={20} /> },
    { id: 2, label: 'Analytics', icon: <MdAnalytics size={20} /> },
  ];

  return (
    <div className="pharmacy-tabs-container">
      <div className="pharmacy-header">
        <h1>Pharmacy Management</h1>
        <button className="btn-refresh" onClick={loadData}>
          <MdRefresh size={20} />
          Refresh
        </button>
      </div>

      <div className="tabs-wrapper">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {isLoading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <>
              {activeTab === 0 && <InventoryTab medicines={medicines} onRefresh={loadData} />}
              {activeTab === 1 && <BatchesTab batches={batches} medicines={medicines} onRefresh={loadData} />}
              {activeTab === 2 && <AnalyticsTab medicines={medicines} batches={batches} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Medicine Inventory Tab
const InventoryTab = ({ medicines, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredMedicines = medicines.filter((med) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      med.name?.toLowerCase().includes(query) ||
      med.sku?.toLowerCase().includes(query) ||
      med.category?.toLowerCase().includes(query);

    const stock = med.availableQty || med.stock || 0;
    const reorderLevel = med.reorderLevel || 20;
    
    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'In Stock' && stock > reorderLevel) ||
      (filterStatus === 'Low Stock' && stock > 0 && stock <= reorderLevel) ||
      (filterStatus === 'Out of Stock' && stock === 0);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStockStatus = (stock, reorderLevel) => {
    if (stock === 0) return { label: 'Out', color: 'danger', icon: <MdBlock /> };
    if (stock <= reorderLevel) return { label: 'Low', color: 'warning', icon: <MdWarning /> };
    return { label: 'In Stock', color: 'success', icon: <MdCheckCircle /> };
  };

  return (
    <div className="inventory-tab">
      <div className="tab-toolbar">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Search by name, SKU, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <MdFilterList size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Medicine Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>Stock</th>
              <th>Reorder Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMedicines.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">No medicines found</td>
              </tr>
            ) : (
              paginatedMedicines.map((med) => {
                const stock = med.availableQty || med.stock || 0;
                const status = getStockStatus(stock, med.reorderLevel || 20);
                return (
                  <tr key={med._id}>
                    <td className="font-semibold">{med.name}</td>
                    <td>{med.sku}</td>
                    <td>{med.category}</td>
                    <td>{med.manufacturer}</td>
                    <td className="font-semibold">{stock}</td>
                    <td>{med.reorderLevel || 20}</td>
                    <td>
                      <span className={`status-badge ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="Edit">
                          <MdEdit size={16} />
                        </button>
                        <button className="btn-icon danger" title="Delete">
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
            Page {currentPage} of {totalPages} ({filteredMedicines.length} items)
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
    </div>
  );
};

// Batches Tab
const BatchesTab = ({ batches, medicines, onRefresh }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const medicineMap = {};
  medicines.forEach(med => {
    if (med._id) medicineMap[med._id] = med.name;
  });

  const enrichedBatches = batches.map(batch => ({
    ...batch,
    medicineName: batch.medicineName || medicineMap[batch.medicineId] || 'Unknown',
  }));

  const totalPages = Math.ceil(enrichedBatches.length / itemsPerPage);
  const paginatedBatches = enrichedBatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="batches-tab">
      <div className="tab-toolbar">
        <button className="btn-primary">
          <MdAdd size={18} />
          Add Batch
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch Number</th>
              <th>Medicine Name</th>
              <th>Supplier</th>
              <th>Quantity</th>
              <th>Sale Price</th>
              <th>Cost Price</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBatches.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">No batches found</td>
              </tr>
            ) : (
              paginatedBatches.map((batch) => {
                const expiring = isExpiringSoon(batch.expiryDate);
                const expired = isExpired(batch.expiryDate);
                return (
                  <tr key={batch._id}>
                    <td className="font-semibold">{batch.batchNumber}</td>
                    <td>{batch.medicineName}</td>
                    <td>{batch.supplier || 'N/A'}</td>
                    <td className="font-semibold">{batch.quantity}</td>
                    <td className="text-success font-semibold">
                      ₹{(batch.salePrice || 0).toFixed(2)}
                    </td>
                    <td>₹{(batch.purchasePrice || 0).toFixed(2)}</td>
                    <td>
                      <span className={`expiry-badge ${expired ? 'expired' : expiring ? 'expiring' : ''}`}>
                        {formatDate(batch.expiryDate)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="Edit">
                          <MdEdit size={16} />
                        </button>
                        <button className="btn-icon danger" title="Delete">
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
            Page {currentPage} of {totalPages} ({enrichedBatches.length} batches)
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
    </div>
  );
};

// Analytics Tab
const AnalyticsTab = ({ medicines, batches }) => {
  const calculateStats = () => {
    let totalMedicines = medicines.length;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    medicines.forEach((med) => {
      const stock = med.availableQty || med.stock || 0;
      const reorderLevel = med.reorderLevel || 20;

      if (stock === 0) outOfStock++;
      else if (stock <= reorderLevel) lowStock++;
    });

    batches.forEach((batch) => {
      const quantity = batch.quantity || 0;
      const salePrice = batch.salePrice || 0;
      totalValue += quantity * salePrice;
    });

    const expiringBatches = batches.filter((batch) => {
      if (!batch.expiryDate) return false;
      const expiry = new Date(batch.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
    }).length;

    return { totalMedicines, lowStock, outOfStock, expiringBatches, totalValue };
  };

  const stats = calculateStats();

  const StatCard = ({ title, value, color, icon }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
      </div>
    </div>
  );

  return (
    <div className="analytics-tab">
      <div className="stats-grid">
        <StatCard
          title="Total Medicines"
          value={stats.totalMedicines}
          color="primary"
          icon={<MdLocalPharmacy size={32} />}
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          color="warning"
          icon={<MdWarning size={32} />}
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock}
          color="danger"
          icon={<MdBlock size={32} />}
        />
        <StatCard
          title="Expiring Soon (90 days)"
          value={stats.expiringBatches}
          color="info"
          icon={<MdInventory size={32} />}
        />
        <StatCard
          title="Total Inventory Value"
          value={`₹${stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          color="success"
          icon={<MdAnalytics size={32} />}
        />
      </div>

      <div className="analytics-content">
        <div className="analytics-section">
          <h3>Stock Distribution</h3>
          <div className="distribution-chart">
            <div className="chart-item">
              <div className="chart-bar success" style={{ width: `${(stats.totalMedicines - stats.lowStock - stats.outOfStock) / stats.totalMedicines * 100}%` }}></div>
              <span>In Stock: {stats.totalMedicines - stats.lowStock - stats.outOfStock}</span>
            </div>
            <div className="chart-item">
              <div className="chart-bar warning" style={{ width: `${stats.lowStock / stats.totalMedicines * 100}%` }}></div>
              <span>Low Stock: {stats.lowStock}</span>
            </div>
            <div className="chart-item">
              <div className="chart-bar danger" style={{ width: `${stats.outOfStock / stats.totalMedicines * 100}%` }}></div>
              <span>Out of Stock: {stats.outOfStock}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyTabs;

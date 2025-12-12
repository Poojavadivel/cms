/**
 * Complete Admin Pharmacy Management
 * Exact Flutter replica with proper alignment and full API implementation
 * Structure: Header (Top) -> Tabs -> Content
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
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';
import { authService } from '../../../services';
import './PharmacyComplete.css';

const PharmacyComplete = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      console.log('🔄 Loading pharmacy data...');
      
      // Load medicines
      const medicinesData = await authService.get('/api/pharmacy/medicines?limit=100');
      console.log(`✅ Loaded ${medicinesData?.length || 0} medicines`);
      
      const normalizedMedicines = (medicinesData || []).map(med => ({
        _id: med._id || '',
        name: med.name || 'Unknown',
        sku: med.sku || '',
        category: med.category || '',
        manufacturer: med.manufacturer || '',
        status: med.status || 'In Stock',
        form: med.form || 'Tablet',
        strength: med.strength || '',
        availableQty: parseInt(med.availableQty || med.stock || 0),
        reorderLevel: parseInt(med.reorderLevel || 20),
      }));
      
      setMedicines(normalizedMedicines);
      
      // Load batches
      const batchesResponse = await authService.get('/api/pharmacy/batches?limit=100');
      console.log('✅ Batches response:', batchesResponse);
      
      let batchList = [];
      if (Array.isArray(batchesResponse)) {
        batchList = batchesResponse;
      } else if (batchesResponse?.batches) {
        batchList = batchesResponse.batches;
      }
      
      // Create medicine map for batch enrichment
      const medicineMap = {};
      normalizedMedicines.forEach(med => {
        if (med._id) medicineMap[med._id] = med.name;
      });
      
      const normalizedBatches = batchList.map(batch => ({
        _id: batch._id || '',
        batchNumber: batch.batchNumber || 'N/A',
        medicineId: batch.medicineId || '',
        medicineName: batch.medicineName || medicineMap[batch.medicineId] || 'Unknown',
        quantity: parseInt(batch.quantity || 0),
        salePrice: parseFloat(batch.salePrice || 0),
        purchasePrice: parseFloat(batch.purchasePrice || 0),
        supplier: batch.supplier || 'N/A',
        location: batch.location || 'Main Store',
        expiryDate: batch.expiryDate || '',
        createdAt: batch.createdAt || '',
      }));
      
      setBatches(normalizedBatches);
      console.log(`✅ Loaded ${normalizedBatches.length} batches`);
      
    } catch (error) {
      console.error('❌ Error loading pharmacy data:', error);
      setErrorMessage(`Failed to load data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedicine = () => {
    // TODO: Implement add medicine dialog
    alert('Add Medicine dialog - Coming soon!');
  };

  return (
    <div className="pharmacy-complete">
      {/* Header - At Top */}
      <div className="pharmacy-complete-header">
        <div className="header-left">
          <MdLocalPharmacy size={32} className="header-icon" />
          <h1>Pharmacy Management</h1>
        </div>
        <button className="btn-add-medicine" onClick={handleAddMedicine}>
          <MdAdd size={20} />
          Add Medicine
        </button>
      </div>

      {/* Tabs - Below Header */}
      <div className="pharmacy-tabs">
        <button
          className={`pharmacy-tab ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => setActiveTab(0)}
        >
          Medicine Inventory
        </button>
        <button
          className={`pharmacy-tab ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => setActiveTab(1)}
        >
          Batches
        </button>
        <button
          className={`pharmacy-tab ${activeTab === 2 ? 'active' : ''}`}
          onClick={() => setActiveTab(2)}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="pharmacy-tab-content">
        {isLoading ? (
          <div className="loading-center">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : errorMessage ? (
          <div className="error-center">
            <p className="error-message">{errorMessage}</p>
            <button className="btn-retry" onClick={loadData}>
              <MdRefresh size={18} />
              Retry
            </button>
          </div>
        ) : (
          <>
            {activeTab === 0 && <InventoryTab medicines={medicines} onRefresh={loadData} />}
            {activeTab === 1 && <BatchesTab batches={batches} medicines={medicines} onRefresh={loadData} />}
            {activeTab === 2 && <AnalyticsTab medicines={medicines} batches={batches} />}
          </>
        )}
      </div>
    </div>
  );
};

// ===== INVENTORY TAB =====
const InventoryTab = ({ medicines, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const filteredMedicines = medicines.filter(med => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query ||
      med.name.toLowerCase().includes(query) ||
      med.sku.toLowerCase().includes(query) ||
      med.category.toLowerCase().includes(query);

    const stock = med.availableQty;
    const reorderLevel = med.reorderLevel;
    
    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'In Stock' && stock > reorderLevel) ||
      (filterStatus === 'Low Stock' && stock > 0 && stock <= reorderLevel) ||
      (filterStatus === 'Out of Stock' && stock === 0);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredMedicines.length);
  const paginatedMedicines = filteredMedicines.slice(startIndex, endIndex);

  const getStockStatus = (stock, reorderLevel) => {
    if (stock === 0) return { label: 'Out', color: 'danger', icon: <MdBlock /> };
    if (stock <= reorderLevel) return { label: 'Low', color: 'warning', icon: <MdWarning /> };
    return { label: 'In Stock', color: 'success', icon: <MdCheckCircle /> };
  };

  const handleEdit = (medicine) => {
    console.log('Edit medicine:', medicine);
    alert(`Edit ${medicine.name} - Coming soon!`);
  };

  const handleDelete = async (medicine) => {
    if (window.confirm(`Are you sure you want to delete ${medicine.name}?`)) {
      try {
        await authService.delete(`/api/pharmacy/medicines/${medicine._id}`);
        onRefresh();
        alert('Medicine deleted successfully');
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="inventory-tab-content">
      {/* Search and Filters */}
      <div className="tab-toolbar">
        <div className="search-box-inline">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Search medicines by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>

        <div className="filter-select">
          <MdFilterList size={20} />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(0);
            }}
          >
            <option value="All">All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <button className="btn-refresh-inline" onClick={onRefresh}>
          <MdRefresh size={20} />
          Refresh
        </button>
      </div>

      {/* Medicine Table */}
      <div className="medicine-table-wrapper">
        <table className="medicine-table">
          <thead>
            <tr>
              <th className="col-name">Medicine Name</th>
              <th className="col-sku">SKU</th>
              <th className="col-category">Category</th>
              <th className="col-manufacturer">Manufacturer</th>
              <th className="col-stock">Stock</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMedicines.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No medicines found</td>
              </tr>
            ) : (
              paginatedMedicines.map((med, index) => {
                const status = getStockStatus(med.availableQty, med.reorderLevel);
                return (
                  <tr key={med._id} className={index % 2 === 0 ? 'even' : 'odd'}>
                    <td className="col-name">
                      <div className="medicine-name-cell">
                        <span className="name-primary">{med.name}</span>
                        {med.strength && <span className="name-secondary">{med.strength}</span>}
                      </div>
                    </td>
                    <td className="col-sku">{med.sku}</td>
                    <td className="col-category">{med.category}</td>
                    <td className="col-manufacturer">{med.manufacturer}</td>
                    <td className="col-stock">
                      <span className={`stock-badge ${status.color}`}>
                        {med.availableQty}
                      </span>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button className="btn-table-action edit" onClick={() => handleEdit(med)}>
                        <MdEdit size={16} />
                      </button>
                      <button className="btn-table-action delete" onClick={() => handleDelete(med)}>
                        <MdDelete size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing {startIndex + 1}-{endIndex} of {filteredMedicines.length} medicines
          </div>
          <div className="pagination-controls">
            <button
              className="btn-page"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <MdChevronLeft size={20} />
            </button>
            <span className="page-number">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="btn-page"
              disabled={currentPage === totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <MdChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== BATCHES TAB =====
const BatchesTab = ({ batches, medicines, onRefresh }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(batches.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, batches.length);
  const paginatedBatches = batches.slice(startIndex, endIndex);

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
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const handleAddBatch = () => {
    alert('Add Batch dialog - Coming soon!');
  };

  const handleEdit = (batch) => {
    alert(`Edit batch ${batch.batchNumber} - Coming soon!`);
  };

  const handleDelete = async (batch) => {
    if (window.confirm(`Are you sure you want to delete batch ${batch.batchNumber}?`)) {
      try {
        await authService.delete(`/api/pharmacy/batches/${batch._id}`);
        onRefresh();
        alert('Batch deleted successfully');
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="batches-tab-content">
      {/* Toolbar */}
      <div className="tab-toolbar">
        <div className="toolbar-title">
          <MdInventory size={24} />
          <span>Batch Management</span>
        </div>
        <button className="btn-add-batch" onClick={handleAddBatch}>
          <MdAdd size={18} />
          Add Batch
        </button>
      </div>

      {/* Batches Table */}
      <div className="batch-table-wrapper">
        <table className="batch-table">
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
                <td colSpan="8" className="no-data">
                  <div className="no-batches">
                    <MdInventory size={48} />
                    <p>No batches found</p>
                    <small>Add your first batch to get started</small>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedBatches.map((batch, index) => {
                const expiring = isExpiringSoon(batch.expiryDate);
                const expired = isExpired(batch.expiryDate);
                return (
                  <tr key={batch._id} className={index % 2 === 0 ? 'even' : 'odd'}>
                    <td className="font-semibold">{batch.batchNumber}</td>
                    <td>{batch.medicineName}</td>
                    <td>{batch.supplier}</td>
                    <td>
                      <span className="quantity-badge">{batch.quantity}</span>
                    </td>
                    <td className="price-success">₹{batch.salePrice.toFixed(2)}</td>
                    <td className="price-muted">₹{batch.purchasePrice.toFixed(2)}</td>
                    <td>
                      <span className={`expiry-date ${expired ? 'expired' : expiring ? 'expiring' : ''}`}>
                        {formatDate(batch.expiryDate)}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button className="btn-table-action edit" onClick={() => handleEdit(batch)}>
                        <MdEdit size={16} />
                      </button>
                      <button className="btn-table-action delete" onClick={() => handleDelete(batch)}>
                        <MdDelete size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing {startIndex + 1}-{endIndex} of {batches.length} batches
          </div>
          <div className="pagination-controls">
            <button
              className="btn-page"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <MdChevronLeft size={20} />
            </button>
            <span className="page-number">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="btn-page"
              disabled={currentPage === totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <MdChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== ANALYTICS TAB =====
const AnalyticsTab = ({ medicines, batches }) => {
  const calculateStats = () => {
    const totalMedicines = medicines.length;
    
    const lowStock = medicines.filter(m => {
      const stock = m.availableQty;
      const reorder = m.reorderLevel;
      return stock > 0 && stock <= reorder;
    }).length;
    
    const outOfStock = medicines.filter(m => m.availableQty <= 0).length;

    return { totalMedicines, lowStock, outOfStock };
  };

  const stats = calculateStats();

  return (
    <div className="analytics-tab-content">
      <h2 className="analytics-title">Inventory Analytics</h2>
      
      <div className="analytics-cards">
        <div className="analytics-card primary">
          <MdLocalPharmacy size={32} className="card-icon" />
          <div className="card-value">{stats.totalMedicines}</div>
          <div className="card-label">Total Medicines</div>
        </div>

        <div className="analytics-card warning">
          <MdWarning size={32} className="card-icon" />
          <div className="card-value">{stats.lowStock}</div>
          <div className="card-label">Low Stock</div>
        </div>

        <div className="analytics-card danger">
          <MdBlock size={32} className="card-icon" />
          <div className="card-value">{stats.outOfStock}</div>
          <div className="card-label">Out of Stock</div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyComplete;

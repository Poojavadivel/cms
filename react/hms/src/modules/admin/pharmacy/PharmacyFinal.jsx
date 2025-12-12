/**
 * Pharmacy Management - FINAL VERSION
 * Using authService like other pages
 * Using React table structure from Patients.jsx
 * Matching Flutter header and layout exactly
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch, MdLocalPharmacy, MdAdd, MdRefresh } from 'react-icons/md';
import authService from '../../../services/authService';
import './PharmacyFinal.css';

// Custom SVG Icons (matching other pages)
const Icons = {
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Box: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    </svg>
  )
};

const PharmacyFinal = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [batchPage, setBatchPage] = useState(0);
  
  const itemsPerPage = 20;
  const batchesPerPage = 10;

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter medicines when search or filter changes
  useEffect(() => {
    filterMedicines();
  }, [searchQuery, statusFilter, medicines]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [PHARMACY] Loading data...');
      
      // Load medicines using authService
      const medicinesData = await authService.get('/pharmacy/medicines?limit=100');
      console.log('✅ [PHARMACY] Medicines response:', medicinesData);
      
      let medicinesList = [];
      if (Array.isArray(medicinesData)) {
        medicinesList = medicinesData;
      } else if (medicinesData?.medicines) {
        medicinesList = medicinesData.medicines;
      } else if (medicinesData?.data) {
        medicinesList = medicinesData.data;
      }

      // Normalize medicine data
      const normalizedMedicines = medicinesList.map(med => ({
        _id: med._id || med.id,
        name: med.name || 'Unknown',
        sku: med.sku || 'N/A',
        category: med.category || 'General',
        manufacturer: med.manufacturer || 'Unknown',
        form: med.form || 'Tablet',
        strength: med.strength || '',
        availableQty: parseInt(med.availableQty || med.stock || med.quantity || 0),
        reorderLevel: parseInt(med.reorderLevel || 20),
      }));

      setMedicines(normalizedMedicines);
      console.log(`✅ [PHARMACY] Loaded ${normalizedMedicines.length} medicines`);

      // Load batches
      const batchesData = await authService.get('/pharmacy/batches?limit=100');
      console.log('✅ [PHARMACY] Batches response:', batchesData);
      
      let batchesList = [];
      if (Array.isArray(batchesData)) {
        batchesList = batchesData;
      } else if (batchesData?.batches) {
        batchesList = batchesData.batches;
      } else if (batchesData?.data) {
        batchesList = batchesData.data;
      }

      // Create medicine map
      const medicineMap = {};
      normalizedMedicines.forEach(m => {
        if (m._id) medicineMap[m._id] = m.name;
      });

      // Normalize batch data
      const normalizedBatches = batchesList.map(batch => ({
        _id: batch._id || batch.id,
        batchNumber: batch.batchNumber || 'N/A',
        medicineId: batch.medicineId || '',
        medicineName: batch.medicineName || medicineMap[batch.medicineId] || 'Unknown',
        quantity: parseInt(batch.quantity || 0),
        salePrice: parseFloat(batch.salePrice || 0),
        purchasePrice: parseFloat(batch.purchasePrice || batch.costPrice || 0),
        supplier: batch.supplier || 'N/A',
        location: batch.location || 'Main Store',
        expiryDate: batch.expiryDate || '',
        createdAt: batch.createdAt || '',
      }));

      setBatches(normalizedBatches);
      console.log(`✅ [PHARMACY] Loaded ${normalizedBatches.length} batches`);

    } catch (error) {
      console.error('❌ [PHARMACY] Error loading data:', error);
      alert(`Failed to load pharmacy data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterMedicines = () => {
    let filtered = [...medicines];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(query) ||
        med.sku.toLowerCase().includes(query) ||
        med.category.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(med => {
        const stock = med.availableQty;
        const reorder = med.reorderLevel;
        
        if (statusFilter === 'In Stock') return stock > reorder;
        if (statusFilter === 'Low Stock') return stock > 0 && stock <= reorder;
        if (statusFilter === 'Out of Stock') return stock === 0;
        return true;
      });
    }

    setFilteredMedicines(filtered);
    setCurrentPage(0);
  };

  const getStockStatus = (stock, reorderLevel) => {
    if (stock === 0) return { label: 'Out', color: 'danger' };
    if (stock <= reorderLevel) return { label: 'Low', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const handleEdit = (item) => {
    console.log('Edit:', item);
    alert(`Edit ${item.name} - Coming soon!`);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      try {
        await authService.delete(`/pharmacy/medicines/${item._id}`);
        alert('Deleted successfully');
        fetchData();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleAddMedicine = () => {
    alert('Add Medicine - Coming soon!');
  };

  const handleAddBatch = () => {
    alert('Add Batch - Coming soon!');
  };

  // Pagination for Medicines
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredMedicines.length);
  const paginatedMedicines = filteredMedicines.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  // Pagination for Batches
  const totalBatchPages = Math.ceil(batches.length / batchesPerPage);
  const batchStartIndex = batchPage * batchesPerPage;
  const batchEndIndex = Math.min(batchStartIndex + batchesPerPage, batches.length);
  const paginatedBatches = batches.slice(batchStartIndex, batchEndIndex);

  const handlePreviousBatchPage = () => {
    if (batchPage > 0) setBatchPage(batchPage - 1);
  };

  const handleNextBatchPage = () => {
    if (batchPage < totalBatchPages - 1) setBatchPage(batchPage + 1);
  };

  // Calculate analytics
  const stats = {
    total: medicines.length,
    lowStock: medicines.filter(m => m.availableQty > 0 && m.availableQty <= m.reorderLevel).length,
    outOfStock: medicines.filter(m => m.availableQty === 0).length,
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">Pharmacy Management</h1>
          <p className="main-subtitle">Manage medicine inventory, batches, and analytics.</p>
        </div>
        <button className="btn-new-appointment" onClick={handleAddMedicine}>
          <MdAdd size={20} />
          Add Medicine
        </button>
      </div>

      {/* TABS */}
      <div className="filter-bar-container">
        <div className="tabs-wrapper">
          <button
            className={`tab-btn ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            Medicine Inventory
          </button>
          <button
            className={`tab-btn ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            Batches
          </button>
          <button
            className={`tab-btn ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
          >
            Analytics
          </button>
        </div>
        <button className="btn-filter-date" onClick={fetchData}>
          <MdRefresh size={16} />
          Refresh
        </button>
      </div>

      {/* TAB 1: MEDICINE INVENTORY */}
      {activeTab === 0 && (
        <>
          {/* Search and Filter */}
          <div className="filter-bar-container">
            <div className="search-wrapper">
              <span className="search-icon-lg"><MdSearch size={18} /></span>
              <input
                type="text"
                placeholder="Search medicines by name, SKU, or category..."
                className="search-input-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-right-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}
              >
                <option value="All">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="table-card">
              <div className="modern-table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Manufacturer</th>
                      <th style={{ textAlign: 'center' }}>Stock</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '48px' }}>
                          <div className="loading-spinner"></div>
                          <p>Loading medicines...</p>
                        </td>
                      </tr>
                    ) : paginatedMedicines.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                          No medicines found
                        </td>
                      </tr>
                    ) : (
                      paginatedMedicines.map((med, index) => {
                        const status = getStockStatus(med.availableQty, med.reorderLevel);
                        return (
                          <tr key={med._id || index}>
                            <td>
                              <div className="info-group">
                                <span className="primary">{med.name}</span>
                                {med.strength && <span className="secondary">{med.strength}</span>}
                              </div>
                            </td>
                            <td>{med.sku}</td>
                            <td>{med.category}</td>
                            <td>{med.manufacturer}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`stock-badge ${status.color}`}>
                                {med.availableQty}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`status-badge ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons-group">
                                <button className="btn-action edit" title="Edit" onClick={() => handleEdit(med)}>
                                  <Icons.Edit />
                                </button>
                                <button className="btn-action delete" title="Delete" onClick={() => handleDelete(med)}>
                                  <Icons.Delete />
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

            {/* Pagination */}
            <div className="pagination-footer">
              <button className="page-arrow-circle leading" disabled={currentPage === 0} onClick={handlePreviousPage}>
                <MdChevronLeft size={20} />
              </button>
              <div className="page-indicator-box">
                Page {currentPage + 1} of {totalPages || 1}
              </div>
              <button className="page-arrow-circle trailing" disabled={currentPage >= totalPages - 1} onClick={handleNextPage}>
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: BATCHES */}
      {activeTab === 1 && (
        <>
          <div className="filter-bar-container">
            <div className="header-content">
              <h2 className="main-title" style={{ fontSize: '18px' }}>Batch Management</h2>
            </div>
            <button className="btn-new-appointment" onClick={handleAddBatch}>
              <MdAdd size={16} />
              Add Batch
            </button>
          </div>

          <div className="table-card">
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Batch Number</th>
                    <th>Medicine</th>
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
                      <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                        No batches found
                      </td>
                    </tr>
                  ) : (
                    paginatedBatches.map((batch, index) => {
                      const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
                      const daysUntilExpiry = expiryDate ? Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                      const isExpiring = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 90;
                      const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

                      return (
                        <tr key={batch._id || index}>
                          <td className="font-semibold">{batch.batchNumber}</td>
                          <td>{batch.medicineName}</td>
                          <td>{batch.supplier}</td>
                          <td>
                            <span className="quantity-badge">{batch.quantity}</span>
                          </td>
                          <td className="price-success">₹{batch.salePrice.toFixed(2)}</td>
                          <td className="price-muted">₹{batch.purchasePrice.toFixed(2)}</td>
                          <td>
                            <span className={`expiry-badge ${isExpired ? 'expired' : isExpiring ? 'expiring' : ''}`}>
                              {expiryDate ? expiryDate.toLocaleDateString('en-IN') : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-group">
                              <button className="btn-action edit" title="Edit">
                                <Icons.Edit />
                              </button>
                              <button className="btn-action delete" title="Delete">
                                <Icons.Delete />
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

            {/* Pagination */}
            <div className="pagination-footer">
              <button className="page-arrow-circle leading" disabled={batchPage === 0} onClick={handlePreviousBatchPage}>
                <MdChevronLeft size={20} />
              </button>
              <div className="page-indicator-box">
                Page {batchPage + 1} of {totalBatchPages || 1}
              </div>
              <button className="page-arrow-circle trailing" disabled={batchPage >= totalBatchPages - 1} onClick={handleNextBatchPage}>
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeTab === 2 && (
        <>
          <h2 className="main-title" style={{ marginBottom: '24px', marginLeft: '24px' }}>Inventory Analytics</h2>
          <div className="analytics-cards" style={{ padding: '0 24px' }}>
              <div className="analytics-card primary">
                <MdLocalPharmacy size={32} />
                <div className="card-value">{stats.total}</div>
                <div className="card-label">Total Medicines</div>
              </div>
              <div className="analytics-card warning">
                <Icons.Box />
                <div className="card-value">{stats.lowStock}</div>
                <div className="card-label">Low Stock</div>
              </div>
              <div className="analytics-card danger">
                <Icons.Delete />
                <div className="card-value">{stats.outOfStock}</div>
                <div className="card-label">Out of Stock</div>
              </div>
            </div>
        </>
      )}
    </div>
  );
};

export default PharmacyFinal;

/**
 * Pharmacy Management - FINAL VERSION
 * Using authService like other pages
 * Using React table structure from Patients.jsx
 * Matching Flutter header and layout exactly
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch, MdLocalPharmacy, MdAdd, MdRefresh, MdClose } from 'react-icons/md';
import authService from '../../../services/authService';
import pharmacyService from '../../../services/pharmacyService';
import AddMedicineDialog from './AddMedicineDialog';
import AddBatchDialog from './AddBatchDialog';
import './PharmacyFinal.css';

// Custom SVG Icons (matching Appointments)
const Icons = {
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Pill: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
      <path d="m8.5 8.5 7 7"></path>
    </svg>
  ),
  Box: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

const Header = () => (
  <div className="dashboard-header">
    <div className="header-content">
      <h1 className="main-title">PHARMACY</h1>
      <p className="main-subtitle">Secure medicine inventory and batch management system</p>
    </div>
  </div>
);

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

  // Dialog states
  const [showMedicineDialog, setShowMedicineDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Analytics Popup State
  const [analyticsPopup, setAnalyticsPopup] = useState({
    isOpen: false,
    type: '', // 'Total', 'Low Stock', 'Out of Stock'
    items: [],
  });

  const itemsPerPage = 20;
  const batchesPerPage = 10;

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter medicines when search or filter changes
  useEffect(() => {
    filterMedicines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSelectedMedicine(item);
    setShowMedicineDialog(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      try {
        await pharmacyService.deleteMedicine(item._id);
        alert('Medicine deleted successfully');
        fetchData();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleAddMedicine = () => {
    setSelectedMedicine(null);
    setShowMedicineDialog(true);
  };

  const handleAddBatch = () => {
    setSelectedBatch(null);
    setShowBatchDialog(true);
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    setShowBatchDialog(true);
  };

  const handleDeleteBatch = async (batch) => {
    if (window.confirm(`Are you sure you want to delete batch ${batch.batchNumber}?`)) {
      try {
        await pharmacyService.deleteBatch(batch._id);
        alert('Batch deleted successfully');
        fetchData();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleMedicineDialogSuccess = () => {
    fetchData();
    setShowMedicineDialog(false);
    setSelectedMedicine(null);
  };

  const handleBatchDialogSuccess = () => {
    fetchData();
    setShowBatchDialog(false);
    setSelectedBatch(null);
  };

  const handleAnalyticsClick = (type) => {
    let items = [];
    if (type === 'Total') {
      items = medicines;
    } else if (type === 'Low Stock') {
      items = medicines.filter(m => m.availableQty > 0 && m.availableQty <= m.reorderLevel);
    } else if (type === 'Out of Stock') {
      items = medicines.filter(m => m.availableQty === 0);
    }

    setAnalyticsPopup({
      isOpen: true,
      type: type,
      items: items
    });
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
    <div className="pharmacy-page dashboard-container">
      <Header />

      <div className="filter-bar-container">
        <div className="filter-right-group">
          <div className="tabs-wrapper">
            <button
              className={`tab-btn ${activeTab === 0 ? 'active' : ''}`}
              onClick={() => setActiveTab(0)}
            >
              Inventory
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
        </div>

        <div className="search-left-part">
          <div className="search-wrapper">
            <span className="search-icon-lg"><Icons.Search /></span>
            <input
              type="text"
              placeholder={activeTab === 1 ? "Search batches..." : "Search medicines by name, SKU, or category..."}
              className="search-input-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TAB 1: MEDICINE INVENTORY */}
      {activeTab === 0 && (
        <>
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
                            <span className="primary font-semibold">{med.name}</span>
                            {med.strength && <span className="secondary ml-2 opacity-60 text-xs">({med.strength})</span>}
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
              <button
                className="page-arrow-circle"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <Icons.ChevronLeft />
              </button>
              <div className="page-indicator-box">
                Page {currentPage + 1} of {Math.ceil(filteredMedicines.length / itemsPerPage) || 1}
              </div>
              <button
                className="page-arrow-circle"
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredMedicines.length / itemsPerPage) - 1, currentPage + 1))}
                disabled={currentPage >= Math.ceil(filteredMedicines.length / itemsPerPage) - 1}
              >
                <Icons.ChevronRight />
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: BATCHES */}
      {activeTab === 1 && (
        <>
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
                    paginatedBatches.map((batch) => {
                      const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
                      const daysUntilExpiry = expiryDate ? Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                      const isExpiring = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 90;
                      const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

                      return (
                        <tr key={batch.id}>
                          <td className="cell-patient">
                            <div className="patient-avatar-circle" style={{ backgroundColor: 'rgba(244, 180, 0, 0.1)', color: '#F4B400' }}>
                              <Icons.Box />
                            </div>
                            <span className="primary font-semibold">{batch.batchNumber}</span>
                          </td>
                          <td>
                            <span className="primary font-semibold">{batch.medicineName}</span>
                          </td>
                          <td>{batch.supplier}</td>
                          <td>
                            <span className="quantity-badge">{batch.quantity}</span>
                          </td>
                          <td><span className="price-success">₹{batch.salePrice.toFixed(2)}</span></td>
                          <td className="price-muted">₹{batch.purchasePrice.toFixed(2)}</td>
                          <td>
                            <span className={`expiry-badge ${isExpired ? 'expired' : isExpiring ? 'expiring' : ''}`}>
                              {expiryDate ? expiryDate.toLocaleDateString('en-IN') : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-group">
                              <button className="btn-action edit" title="Edit" onClick={() => handleEditBatch(batch)}>
                                <Icons.Edit />
                              </button>
                              <button className="btn-action delete" title="Delete" onClick={() => handleDeleteBatch(batch)}>
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
              <button
                className="page-arrow-circle"
                onClick={() => setBatchPage(Math.max(0, batchPage - 1))}
                disabled={batchPage === 0}
              >
                <Icons.ChevronLeft />
              </button>
              <div className="page-indicator-box">
                Page {batchPage + 1} of {Math.ceil(batches.length / batchesPerPage) || 1}
              </div>
              <button
                className="page-arrow-circle"
                onClick={() => setBatchPage(Math.min(Math.ceil(batches.length / batchesPerPage) - 1, batchPage + 1))}
                disabled={batchPage >= Math.ceil(batches.length / batchesPerPage) - 1}
              >
                <Icons.ChevronRight />
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
            <div className="analytics-card primary" onClick={() => handleAnalyticsClick('Total')}>
              <MdLocalPharmacy size={32} />
              <div className="card-value">{stats.total}</div>
              <div className="card-label">Total Medicines</div>
            </div>
            <div className="analytics-card warning" onClick={() => handleAnalyticsClick('Low Stock')}>
              <Icons.Box />
              <div className="card-value">{stats.lowStock}</div>
              <div className="card-label">Low Stock</div>
            </div>
            <div className="analytics-card danger" onClick={() => handleAnalyticsClick('Out of Stock')}>
              <Icons.Delete />
              <div className="card-value">{stats.outOfStock}</div>
              <div className="card-label">Out of Stock</div>
            </div>
          </div>
        </>
      )}

      {/* Analytics Details Popup */}
      {analyticsPopup.isOpen && (
        <div className="analytics-overlay" onClick={() => setAnalyticsPopup({ ...analyticsPopup, isOpen: false })}>
          <div className="analytics-modal premium-modal" onClick={e => e.stopPropagation()}>
            {/* Sidebar for Analytics */}
            <div className="modal-sidebar">
              <div className="sidebar-header">
                <div className="sidebar-icon-circle">
                  {analyticsPopup.type === 'Total' ? <MdLocalPharmacy /> :
                    analyticsPopup.type === 'Low Stock' ? <Icons.Box /> : <Icons.Delete />}
                </div>
                <h3>{analyticsPopup.type} Analysis</h3>
              </div>

              <div className="sidebar-content">
                <div className="sidebar-card">
                  <h4>Category View</h4>
                  <p>A detailed view of all items categorized as {analyticsPopup.type.toLowerCase()}.</p>
                </div>

                <div className="sidebar-card">
                  <h4>Quick Action</h4>
                  <p>Review the stock levels and take necessary procurement actions.</p>
                </div>
              </div>

              <div className="sidebar-footer">
                <p>Pharmacy Insights</p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="analytics-content-area">
              <div className="modal-header-accent bg-blue-primary text-white p-6 flex justify-between items-center">
                <div className="header-info">
                  <h2 className="text-xl font-bold uppercase tracking-tight">{analyticsPopup.type} Products</h2>
                  <p className="text-sm opacity-80">Inventory single-line analysis</p>
                </div>
                <button
                  className="close-btn-circle hover:bg-white/10 p-2 rounded-full transition-all"
                  onClick={() => setAnalyticsPopup({ ...analyticsPopup, isOpen: false })}
                >
                  <Icons.X />
                </button>
              </div>

              {/* Scrollable Table Body */}
              <div className="modal-scroll-content">
                <div className="modern-table-wrapper">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'center' }}>Stock</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsPopup.items.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>No items found</td>
                        </tr>
                      ) : (
                        analyticsPopup.items.map((med, idx) => {
                          const status = getStockStatus(med.availableQty, med.reorderLevel);
                          return (
                            <tr key={med.id}>
                              <td className="cell-patient">
                                <div className="patient-avatar-circle" style={{ backgroundColor: 'rgba(32, 125, 192, 0.1)', color: '#207DC0' }}>
                                  <Icons.Pill />
                                </div>
                                <span className="primary font-semibold">{med.name}</span>
                                {med.strength && <span className="secondary ml-2 opacity-60 text-xs text-blue-primary">({med.strength})</span>}
                              </td>
                              <td>
                                <span className="primary font-semibold">{med.sku || 'N/A'}</span>
                                <span className="secondary ml-2 opacity-60 text-xs">[{med.category || 'General'}]</span>
                              </td>
                              <td>{med.category}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`stock-badge ${status.color}`}>{med.availableQty}</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`status-badge ${status.color}`}>{status.label}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Static Footer */}
              <div className="modal-footer-premium">
                <button className="btn-secondary-premium" onClick={() => setAnalyticsPopup({ ...analyticsPopup, isOpen: false })}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddMedicineDialog
        isOpen={showMedicineDialog}
        onClose={() => {
          setShowMedicineDialog(false);
          setSelectedMedicine(null);
        }}
        medicine={selectedMedicine}
        onSuccess={handleMedicineDialogSuccess}
      />

      <AddBatchDialog
        isOpen={showBatchDialog}
        onClose={() => {
          setShowBatchDialog(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
        medicines={medicines}
        onSuccess={handleBatchDialogSuccess}
      />
    </div>
  );
};

export default PharmacyFinal;

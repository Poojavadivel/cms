/**
 * PharmacistMedicines.jsx
 * Medicine Inventory Management - EXACTLY matching admin/doctor table design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdChevronLeft, MdChevronRight, MdAddCircle, MdRefresh } from 'react-icons/md';
import { authService } from '../../services';
import './Medicines.css';

// Custom SVG Icons (matching admin/doctor modules)
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
};

const PharmacistMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState('All');

  const itemsPerPage = 10;

  const loadMedicines = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [Medicines] Loading medicines...');
      const response = await authService.get('/pharmacy/medicines?limit=100');
      
      let medicinesList = [];
      if (response && typeof response === 'object') {
        medicinesList = response.medicines || response.data || [];
      } else if (Array.isArray(response)) {
        medicinesList = response;
      }

      console.log('✅ [Medicines] Loaded:', medicinesList.length);
      
      // Normalize data
      const normalized = medicinesList.map(med => ({
        _id: med._id || med.id,
        name: med.name || 'Unknown',
        category: med.category || 'N/A',
        sku: med.sku || 'N/A',
        availableQty: med.availableQty || med.stock || med.quantity || 0,
        reorderLevel: med.reorderLevel || 20,
        strength: med.strength || '',
        manufacturer: med.manufacturer || '',
        price: med.price || 0,
      }));

      setMedicines(normalized);
      setFilteredMedicines(normalized);
    } catch (error) {
      console.error('❌ [Medicines] Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  useEffect(() => {
    let filtered = [...medicines];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med =>
        (med.name || '').toLowerCase().includes(query) ||
        (med.category || '').toLowerCase().includes(query) ||
        (med.sku || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(med => {
        const stock = med.availableQty || 0;
        const reorderLevel = med.reorderLevel || 20;
        
        if (filterStatus === 'In Stock') return stock > reorderLevel;
        if (filterStatus === 'Low Stock') return stock > 0 && stock <= reorderLevel;
        if (filterStatus === 'Out of Stock') return stock <= 0;
        return true;
      });
    }

    setFilteredMedicines(filtered);
    setCurrentPage(0);
  }, [searchQuery, filterStatus, medicines]);

  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredMedicines.length);
  const paginatedMedicines = filteredMedicines.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
  };

  const handleAddMedicine = () => {
    alert('Add Medicine dialog - Coming soon!');
  };

  const handleViewMedicine = (medicine) => {
    alert(`View Medicine: ${medicine.name}\n\nStock: ${medicine.availableQty}\nCategory: ${medicine.category}\nSKU: ${medicine.sku}`);
  };

  const handleEditMedicine = (medicine) => {
    alert('Edit Medicine dialog - Coming soon!');
  };

  const handleDeleteMedicine = async (medicine) => {
    if (!window.confirm(`Are you sure you want to delete ${medicine.name}?`)) {
      return;
    }

    try {
      await authService.delete(`/pharmacy/medicines/${medicine._id}`);
      loadMedicines();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert('Failed to delete medicine');
    }
  };

  const getStockStatus = (stock, reorderLevel) => {
    if (stock <= 0) return 'out';
    if (stock <= reorderLevel) return 'low';
    return 'in';
  };

  const getStockLabel = (stock, reorderLevel) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <div className="dashboard-container">
      {/* Header - EXACTLY like admin/doctor */}
      <div className="patients-header">
        <div className="header-content">
          <h1 className="main-title">Medicine Inventory</h1>
          <p className="main-subtitle">Manage pharmacy inventory and stock levels.</p>
        </div>
        <button className="add-btn" onClick={handleAddMedicine}>
          <MdAddCircle size={18} />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Search & Filter Bar - EXACTLY like admin/doctor */}
      <div className="filter-bar-container">
        <div className="search-wrapper">
          <span className="search-icon-lg"><MdSearch size={18} /></span>
          <input
            type="text"
            placeholder="Search by medicine name, SKU, or category..."
            className="search-input-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-right-group">
          <div className="tabs-wrapper">
            <button
              className={`tab-btn ${filterStatus === 'All' ? 'active' : ''}`}
              onClick={() => setFilterStatus('All')}
            >
              All
            </button>
            <button
              className={`tab-btn ${filterStatus === 'In Stock' ? 'active' : ''}`}
              onClick={() => setFilterStatus('In Stock')}
            >
              In Stock
            </button>
            <button
              className={`tab-btn ${filterStatus === 'Low Stock' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Low Stock')}
            >
              Low Stock
            </button>
            <button
              className={`tab-btn ${filterStatus === 'Out of Stock' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Out of Stock')}
            >
              Out of Stock
            </button>
          </div>
          
          <button className="refresh-btn" onClick={loadMedicines} disabled={isLoading}>
            <MdRefresh size={18} />
          </button>
        </div>
      </div>

      {/* Table Card - EXACTLY like admin/doctor */}
      <div className="table-card">
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Medicine Name</th>
                <th style={{ width: '15%' }}>Category</th>
                <th style={{ width: '12%' }}>SKU</th>
                <th style={{ width: '10%' }}>Stock</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '18%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ color: '#94A3AF', fontSize: '14px' }}>Loading medicines...</div>
                  </td>
                </tr>
              ) : paginatedMedicines.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ color: '#94A3AF', fontSize: '14px' }}>No medicines found</div>
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map((medicine, index) => {
                  const stock = medicine.availableQty || 0;
                  const reorderLevel = medicine.reorderLevel || 20;
                  const stockStatus = getStockStatus(stock, reorderLevel);
                  const stockLabel = getStockLabel(stock, reorderLevel);

                  return (
                    <tr key={medicine._id || index}>
                      {/* Medicine Name Column */}
                      <td className="cell-patient">
                        <div className="patient-details">
                          <span className="patient-name">{medicine.name}</span>
                          {medicine.strength && (
                            <span className="patient-id">{medicine.strength}</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="cell-text">{medicine.category}</span>
                      </td>

                      {/* SKU */}
                      <td>
                        <span className="cell-text">{medicine.sku}</span>
                      </td>

                      {/* Stock */}
                      <td>
                        <span className={`stock-badge stock-${stockStatus}`}>
                          {stock}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-badge status-${stockStatus}`}>
                          {stockLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="actions-group">
                          <button
                            className="action-btn view"
                            onClick={() => handleViewMedicine(medicine)}
                            title="View Details"
                          >
                            <Icons.Eye />
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditMedicine(medicine)}
                            title="Edit Medicine"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteMedicine(medicine)}
                            title="Delete Medicine"
                          >
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

        {/* Pagination - EXACTLY like admin/doctor */}
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {filteredMedicines.length > 0 ? startIndex + 1 : 0} to {endIndex} of {filteredMedicines.length} medicines
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
            >
              <MdChevronLeft size={20} />
            </button>
            <span className="pagination-text">
              Page {totalPages > 0 ? currentPage + 1 : 0} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              <MdChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistMedicines;

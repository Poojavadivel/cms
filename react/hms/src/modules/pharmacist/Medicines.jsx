import React, { useState, useEffect } from 'react';
import { authService } from '../../services';
import {
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdLocalPharmacy,
  MdWarning,
  MdCheckCircle,
  MdBlock,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';
import './Medicines.css';

const PharmacistMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    filterMedicinesData();
  }, [searchQuery, filterStatus, medicines]);

  const toInt = (value) => {
    if (value == null) return 0;
    if (typeof value === 'number') return Math.floor(value);
    if (typeof value === 'string') return parseInt(value) || 0;
    return 0;
  };

  const loadMedicines = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log('🔄 [Pharmacist] Loading medicines from API...');
      const response = await authService.get('/pharmacy/medicines?limit=100');
      console.log('✅ [Pharmacist] Received response:', response);

      // Normalize response: support plain list OR { medicines: [...] } OR { data: [...] }
      let medicinesData = [];
      if (Array.isArray(response)) {
        medicinesData = response;
      } else if (response && typeof response === 'object') {
        medicinesData = response.medicines || response.data || [];
      }

      console.log('✅ [Pharmacist] Extracted medicines:', medicinesData.length);

      // Log first medicine to see structure
      if (medicinesData.length > 0) {
        console.log('📋 [Pharmacist] Sample medicine data:', medicinesData[0]);
      }

      // Normalize the data
      const normalizedMedicines = medicinesData.map(med => {
        // Try multiple fields for stock
        const stock = toInt(med.availableQty || med.stock || med.quantity || 0);

        console.log(`📦 [Medicine] ${med.name}: availableQty=${med.availableQty}, stock=${med.stock}, quantity=${med.quantity}, normalized=${stock}`);

        return {
          _id: med._id || '',
          name: med.name || 'Unknown',
          sku: med.sku || '',
          category: med.category || '',
          manufacturer: med.manufacturer || '',
          status: med.status || 'In Stock',
          form: med.form || 'Tablet',
          strength: med.strength || '',
          unit: med.unit || 'pcs',
          reorderLevel: toInt(med.reorderLevel || 20),
          stock,
          availableQty: stock,
        };
      });

      console.log('✅ [Pharmacist] Normalized medicines with stock:', normalizedMedicines.map(m => `${m.name}: ${m.stock}`));

      setMedicines(normalizedMedicines);
      setFilteredMedicines(normalizedMedicines);
    } catch (error) {
      console.error('❌ [Pharmacist] Error loading medicines:', error);
      setErrorMessage(`Failed to load medicines: ${error.message || 'Request failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMedicinesData = () => {
    let filtered = [...medicines];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med => {
        const name = (med.name || '').toLowerCase();
        const sku = (med.sku || '').toLowerCase();
        const category = (med.category || '').toLowerCase();
        const manufacturer = (med.manufacturer || '').toLowerCase();

        return name.includes(query) ||
          sku.includes(query) ||
          category.includes(query) ||
          manufacturer.includes(query);
      });
    }

    // Stock status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(med => {
        const stock = med.stock || 0;
        const reorderLevel = med.reorderLevel || 20;

        switch (filterStatus) {
          case 'In Stock':
            return stock > reorderLevel;
          case 'Low Stock':
            return stock > 0 && stock <= reorderLevel;
          case 'Out of Stock':
            return stock <= 0;
          default:
            return true;
        }
      });
    }

    setFilteredMedicines(filtered);
    setCurrentPage(0);
  };

  const getStockStatus = (stock, reorderLevel) => {
    if (stock === 0) {
      return {
        label: 'Out of Stock',
        color: 'danger',
        icon: <MdBlock size={16} />,
      };
    }
    if (stock <= reorderLevel) {
      return {
        label: 'Low Stock',
        color: 'warning',
        icon: <MdWarning size={16} />,
      };
    }
    return {
      label: 'In Stock',
      color: 'success',
      icon: <MdCheckCircle size={16} />,
    };
  };

  const getStats = () => {
    const total = medicines.length;
    const lowStock = medicines.filter(m => {
      const stock = m.stock || 0;
      const reorder = m.reorderLevel || 20;
      return stock > 0 && stock <= reorder;
    }).length;
    const outOfStock = medicines.filter(m => (m.stock || 0) <= 0).length;

    return { total, lowStock, outOfStock };
  };

  const paginatedMedicines = filteredMedicines.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="medicines-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="medicines-error">
        <div className="error-content">
          <MdWarning size={64} className="error-icon" />
          <h2>Error Loading Medicines</h2>
          <p>{errorMessage}</p>
          <button onClick={loadMedicines} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pharmacist-medicines">
      {/* Header */}
      <div className="medicines-header">
        <div className="header-left">
          <MdLocalPharmacy className="header-icon" size={28} />
          <h1 className="header-title">Medicine Inventory</h1>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value stat-primary">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value stat-warning">{stats.lowStock}</span>
            <span className="stat-label">Low</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value stat-danger">{stats.outOfStock}</span>
            <span className="stat-label">Out</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="medicines-toolbar">
        <div className="search-box">
          <MdSearch size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="All">All</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        <button onClick={loadMedicines} className="btn-refresh" title="Refresh">
          <MdRefresh size={20} />
        </button>
      </div>

      {/* Medicines Table */}
      {filteredMedicines.length === 0 ? (
        <div className="medicines-empty">
          <MdLocalPharmacy size={64} className="empty-icon" />
          <h3>No Medicines Found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="medicines-table-container">
          <table className="medicines-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>SKU</th>
                <th className="text-center">Stock</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMedicines.map((medicine, index) => {
                const status = getStockStatus(medicine.stock, medicine.reorderLevel);
                const isEven = index % 2 === 0;

                return (
                  <tr key={medicine._id || index} className={isEven ? 'row-even' : 'row-odd'}>
                    <td>
                      <div className="medicine-name-cell">
                        <div className="medicine-name">{medicine.name}</div>
                        {medicine.strength && (
                          <div className="medicine-strength">{medicine.strength}</div>
                        )}
                      </div>
                    </td>
                    <td className="medicine-category">{medicine.category || 'N/A'}</td>
                    <td className="medicine-sku">{medicine.sku || 'N/A'}</td>
                    <td className="text-center">
                      <span className={`stock-badge stock-badge-${status.color}`}>
                        {medicine.stock}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`status-badge status-badge-${status.color}`}>
                        {status.icon}
                        <span>{status.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 0}
                className="pagination-btn"
              >
                <MdChevronLeft size={20} />
                Previous
              </button>

              <span className="pagination-info">
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className="pagination-btn"
              >
                Next
                <MdChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PharmacistMedicines;

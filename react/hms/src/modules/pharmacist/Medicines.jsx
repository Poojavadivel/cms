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
      const response = await authService.get('/pharmacy/medicines?limit=100');

      let medicinesData = [];
      if (Array.isArray(response)) {
        medicinesData = response;
      } else if (response && typeof response === 'object') {
        medicinesData = response.medicines || response.data || [];
      }

      const normalizedMedicines = medicinesData.map(med => {
        const stock = toInt(med.availableQty || med.stock || med.quantity || 0);
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

  const getHeaderDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
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
      {/* Premium Dashboard Header */}
      <div className="dashboard-header-premium">
        <div className="header-title-section">
          <div className="header-icon-box">
            <MdLocalPharmacy size={28} />
          </div>
          <div className="header-text">
            <h1>Medicine <span>Inventory</span></h1>
            <p>{getHeaderDate()} — BROWSE AND ANALYZE GLOBAL PHARMACY STOCK</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={loadMedicines} className="btn-refresh-premium" disabled={isLoading}>
            <MdRefresh size={20} className={isLoading ? 'spinning' : ''} />
            <span>Sync Hub</span>
          </button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="stats-dashboard-premium">
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper blue">
            <MdLocalPharmacy size={24} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">TOTAL STOCK ITEMS</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper orange">
            <MdWarning size={24} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">LOW STOCK ALERTS</span>
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
          <div className="stat-icon-wrapper blue">
            <MdCheckCircle size={24} />
          </div>
          <div className="stat-info-premium">
            <span className="stat-label">FILTERED RESULTS</span>
            <span className="stat-value">{filteredMedicines.length}</span>
          </div>
        </div>
      </div>

      {/* Modern Toolbar */}
      <div className="inventory-toolbar-premium">
        <div className="search-group-premium">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group-premium">
          <MdFilterList className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Stocks</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      {filteredMedicines.length === 0 ? (
        <div className="medicines-empty">
          <MdLocalPharmacy size={64} className="empty-icon" />
          <h3>No Medicines Found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>MEDICINE DETAILS</th>
                <th>CATEGORY</th>
                <th>SKU ID</th>
                <th>STOCK LEVEL</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMedicines.map((medicine, index) => {
                const status = getStockStatus(medicine.stock, medicine.reorderLevel);
                return (
                  <tr key={medicine._id || index}>
                    <td>
                      <div className="medicine-identity-cell">
                        <span className="medicine-primary-name">{medicine.name}</span>
                        <span className="medicine-secondary-info">{medicine.strength || 'No Strength Info'} • {medicine.form}</span>
                      </div>
                    </td>
                    <td><span className="text-category">{medicine.category || 'GENERAL'}</span></td>
                    <td><span className="text-sku">{medicine.sku || 'N/A'}</span></td>
                    <td>
                      <div className="stock-level-cell">
                        <span className={`stock-count-indicator ${status.color}`}>{medicine.stock}</span>
                        <span className="stock-unit">{medicine.unit || 'pcs'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge-premium ${status.color}`}>
                        {status.icon}
                        {status.label}
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

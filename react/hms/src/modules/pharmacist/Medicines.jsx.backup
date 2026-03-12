import React, { useState, useEffect } from 'react';
import { authService } from '../../services';
import {
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
import './Medicines.css';

const PharmacistMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [searchQuery, filterStatus, medicines]);

  const loadMedicines = async () => {
    setIsLoading(true);
    try {
      const data = await authService.get('/api/pharmacy/medicines?limit=100');
      const normalizedMedicines = data.map(med => ({
        _id: med._id || '',
        name: med.name || 'Unknown',
        sku: med.sku || '',
        category: med.category || '',
        manufacturer: med.manufacturer || '',
        form: med.form || 'Tablet',
        strength: med.strength || '',
        unit: med.unit || 'pcs',
        stock: med.availableQty || med.stock || med.quantity || 0,
        reorderLevel: med.reorderLevel || 20,
        status: med.status || 'In Stock',
      }));
      setMedicines(normalizedMedicines);
    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMedicines = () => {
    let filtered = [...medicines];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(query) ||
        med.sku.toLowerCase().includes(query) ||
        med.category.toLowerCase().includes(query) ||
        med.manufacturer.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(med => {
        const stock = med.stock;
        const reorderLevel = med.reorderLevel;

        switch (filterStatus) {
          case 'In Stock':
            return stock > reorderLevel;
          case 'Low Stock':
            return stock > 0 && stock <= reorderLevel;
          case 'Out of Stock':
            return stock === 0;
          default:
            return true;
        }
      });
    }

    setFilteredMedicines(filtered);
    setCurrentPage(1);
  };

  const getStockStatus = (stock, reorderLevel) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'danger', icon: <MdBlock /> };
    if (stock <= reorderLevel) return { label: 'Low Stock', color: 'warning', icon: <MdWarning /> };
    return { label: 'In Stock', color: 'success', icon: <MdCheckCircle /> };
  };

  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);

  return (
    <div className="pharmacist-medicines">
      <div className="medicines-header">
        <h1>Medicine Inventory</h1>
        <button className="btn-primary" onClick={loadMedicines}>
          <MdRefresh size={20} />
          Refresh
        </button>
      </div>

      <div className="medicines-toolbar">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Search by name, SKU, category, manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <MdFilterList size={20} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="medicines-stats">
        <div className="stat-pill">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{filteredMedicines.length}</span>
        </div>
        <div className="stat-pill warning">
          <span className="stat-label">Low Stock:</span>
          <span className="stat-value">
            {medicines.filter(m => m.stock > 0 && m.stock <= m.reorderLevel).length}
          </span>
        </div>
        <div className="stat-pill danger">
          <span className="stat-label">Out of Stock:</span>
          <span className="stat-value">
            {medicines.filter(m => m.stock === 0).length}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading medicines...</div>
      ) : (
        <>
          <div className="medicines-table-container">
            <table className="medicines-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Form</th>
                  <th>Strength</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Manufacturer</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMedicines.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state">
                      No medicines found
                    </td>
                  </tr>
                ) : (
                  paginatedMedicines.map((med) => {
                    const status = getStockStatus(med.stock, med.reorderLevel);
                    return (
                      <tr key={med._id}>
                        <td className="medicine-name">{med.name}</td>
                        <td>{med.sku}</td>
                        <td>{med.category}</td>
                        <td>{med.form}</td>
                        <td>{med.strength}</td>
                        <td className="stock-cell">{med.stock} {med.unit}</td>
                        <td>{med.reorderLevel}</td>
                        <td>
                          <span className={`status-badge ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td>{med.manufacturer}</td>
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
                Page {currentPage} of {totalPages}
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
        </>
      )}
    </div>
  );
};

export default PharmacistMedicines;

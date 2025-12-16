/**
 * PharmacyTable.jsx
 * Enhanced pharmacy table matching Flutter's enhanced_pharmacy_table.dart
 * 
 * Features:
 * - Medicine search/autocomplete
 * - Stock checking with warnings
 * - Auto-calculation (quantity × price = total)
 * - Add/remove rows
 * - Grand total calculation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdDelete, MdSearch, MdLocalPharmacy } from 'react-icons/md';
import './PharmacyTable.css';
import medicinesService from '../../services/medicinesService';

const PharmacyTable = ({ rows, onRowsChanged, onStockWarnings }) => {
  const [medicines, setMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [searchQuery, setSearchQuery] = useState({});
  const [showDropdown, setShowDropdown] = useState({});
  const [filteredMedicines, setFilteredMedicines] = useState({});

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setLoadingMedicines(true);
    try {
      const results = await medicinesService.fetchMedicines({ limit: 100 });
      setMedicines(results);
      console.log('✅ Loaded medicines:', results.length);
    } catch (error) {
      console.error('❌ Error loading medicines:', error);
    } finally {
      setLoadingMedicines(false);
    }
  };

  const handleSearch = (rowIndex, query) => {
    setSearchQuery({ ...searchQuery, [rowIndex]: query });
    
    if (query.length >= 1) {
      // Local filtering (instant, no API calls)
      const filtered = medicines.filter(medicine => {
        const name = (medicine.name || '').toLowerCase();
        const sku = (medicine.sku || '').toLowerCase();
        const search = query.toLowerCase();
        return name.includes(search) || sku.includes(search);
      });
      
      setFilteredMedicines({ ...filteredMedicines, [rowIndex]: filtered });
      setShowDropdown({ ...showDropdown, [rowIndex]: true });
    } else {
      setShowDropdown({ ...showDropdown, [rowIndex]: false });
    }
  };

  const getMedicineStock = (medicine) => {
    const availableQty = medicine.availableQty ?? medicine.stock ?? 0;
    if (typeof availableQty === 'number') return availableQty;
    if (typeof availableQty === 'string') return parseInt(availableQty) || 0;
    return 0;
  };

  const selectMedicine = (rowIndex, medicine) => {
    const stock = getMedicineStock(medicine);
    const salePrice = parseFloat(medicine.salePrice || 0);
    
    const updatedRows = [...rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      medicineId: medicine._id,
      Medicine: medicine.name,
      price: salePrice.toFixed(2),
      availableStock: stock,
    };
    
    // Auto-calculate total
    const quantity = parseInt(updatedRows[rowIndex].quantity || '1');
    const price = parseFloat(updatedRows[rowIndex].price || '0');
    updatedRows[rowIndex].total = (quantity * price).toFixed(2);
    
    onRowsChanged(updatedRows);
    setShowDropdown({ ...showDropdown, [rowIndex]: false });
    setSearchQuery({ ...searchQuery, [rowIndex]: '' });
  };

  const addRow = () => {
    const newRow = {
      medicineId: null,
      Medicine: '',
      Dosage: '',
      Frequency: '',
      quantity: '1',
      price: '0',
      total: '0',
      Notes: '',
      availableStock: 0,
    };
    onRowsChanged([...rows, newRow]);
  };

  const deleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    onRowsChanged(updatedRows);
  };

  const updateRow = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    
    // Auto-calculate total when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      const quantity = parseInt(updatedRows[index].quantity || '1');
      const price = parseFloat(updatedRows[index].price || '0');
      updatedRows[index].total = (quantity * price).toFixed(2);
    }
    
    onRowsChanged(updatedRows);
  };

  const calculateGrandTotal = () => {
    return rows.reduce((sum, row) => {
      const total = parseFloat(row.total || '0');
      return sum + total;
    }, 0).toFixed(2);
  };

  const getStockColor = (stock) => {
    if (stock === 0) return '#DC2626'; // danger
    if (stock <= 10) return '#F59E0B'; // warning
    return '#10B981'; // success
  };

  const getStockLabel = (stock) => {
    if (stock === 0) return 'OUT OF STOCK';
    if (stock <= 10) return 'LOW STOCK';
    return 'IN STOCK';
  };

  const getStockWarnings = useCallback(() => {
    const warnings = [];
    rows.forEach(row => {
      const medicineName = row.Medicine || 'Unknown';
      const availableStock = row.availableStock || 0;
      const quantity = parseInt(row.quantity || '1');
      
      if (availableStock === 0 && medicineName !== '') {
        warnings.push({
          medicine: medicineName,
          type: 'OUT_OF_STOCK',
          message: `${medicineName} is out of stock`,
        });
      } else if (quantity > availableStock && medicineName !== '') {
        warnings.push({
          medicine: medicineName,
          type: 'INSUFFICIENT',
          message: `${medicineName}: Only ${availableStock} units available, but ${quantity} requested`,
        });
      }
    });
    return warnings;
  }, [rows]);

  // Expose stock warnings to parent
  useEffect(() => {
    if (onStockWarnings) {
      onStockWarnings(getStockWarnings());
    }
  }, [rows, onStockWarnings, getStockWarnings]);

  if (loadingMedicines) {
    return (
      <div className="pharmacy-loading">
        <div className="spinner-small"></div>
        <p>Loading medicines...</p>
      </div>
    );
  }

  return (
    <div className="pharmacy-table-container">
      {/* Table */}
      <div className="pharmacy-table-wrapper">
        <table className="pharmacy-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Medicine</th>
              <th style={{ width: '12%' }}>Dosage</th>
              <th style={{ width: '12%' }}>Frequency</th>
              <th style={{ width: '8%', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Price (₹)</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Total (₹)</th>
              <th style={{ width: '15%' }}>Notes</th>
              <th style={{ width: '8%', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                  No medicines added yet. Click "Add Medicine" to start.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  {/* Medicine Name with Search */}
                  <td>
                    <div className="medicine-search-cell">
                      <input
                        type="text"
                        value={row.Medicine || searchQuery[index] || ''}
                        onChange={(e) => handleSearch(index, e.target.value)}
                        placeholder="Search medicine..."
                        className="pharmacy-input"
                      />
                      <MdSearch className="search-icon" />
                      
                      {/* Stock Badge */}
                      {row.availableStock !== undefined && row.Medicine && (
                        <div 
                          className="stock-badge"
                          style={{ 
                            background: getStockColor(row.availableStock),
                            color: 'white'
                          }}
                        >
                          {getStockLabel(row.availableStock)}
                        </div>
                      )}
                      
                      {/* Dropdown */}
                      {showDropdown[index] && filteredMedicines[index]?.length > 0 && (
                        <div className="medicine-dropdown">
                          {/* Dropdown Header */}
                          <div className="medicine-dropdown-header">
                            <MdLocalPharmacy size={20} />
                            <span>Select Medicine ({filteredMedicines[index].length} found)</span>
                          </div>
                          
                          {/* Medicine List */}
                          <div className="medicine-dropdown-list">
                            {filteredMedicines[index].map(medicine => {
                              const stock = getMedicineStock(medicine);
                              const stockColor = getStockColor(stock);
                              const stockLabel = getStockLabel(stock);
                              const isOutOfStock = stock === 0;
                              
                              return (
                                <div
                                  key={medicine._id}
                                  className={`medicine-dropdown-item ${isOutOfStock ? 'out-of-stock' : ''}`}
                                  onClick={() => !isOutOfStock && selectMedicine(index, medicine)}
                                  style={{ cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                                >
                                  {/* Medicine Icon */}
                                  <div 
                                    className="medicine-icon"
                                    style={{ backgroundColor: `${stockColor}20`, color: stockColor }}
                                  >
                                    <MdLocalPharmacy size={20} />
                                  </div>
                                  
                                  {/* Medicine Details */}
                                  <div className="medicine-details">
                                    <div className="medicine-name">{medicine.name}</div>
                                    <div className="medicine-meta">
                                      <span className="medicine-sku">SKU: {medicine.sku || 'N/A'}</span>
                                      <span className="medicine-separator">•</span>
                                      <span className="medicine-price">₹{parseFloat(medicine.salePrice || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Stock Badge */}
                                  <div className="medicine-stock-info">
                                    <div 
                                      className="medicine-stock-badge"
                                      style={{ 
                                        backgroundColor: `${stockColor}20`,
                                        color: stockColor,
                                        border: `1px solid ${stockColor}40`
                                      }}
                                    >
                                      {stockLabel}
                                    </div>
                                    <div 
                                      className="medicine-stock-units"
                                      style={{ color: stockColor }}
                                    >
                                      {stock} units
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Dosage */}
                  <td>
                    <input
                      type="text"
                      value={row.Dosage || ''}
                      onChange={(e) => updateRow(index, 'Dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="pharmacy-input"
                    />
                  </td>
                  
                  {/* Frequency */}
                  <td>
                    <select
                      value={row.Frequency || ''}
                      onChange={(e) => updateRow(index, 'Frequency', e.target.value)}
                      className="pharmacy-select"
                    >
                      <option value="">Select...</option>
                      <option value="Once Daily">Once Daily</option>
                      <option value="Twice Daily">Twice Daily</option>
                      <option value="Thrice Daily">Thrice Daily</option>
                      <option value="Every 6 Hours">Every 6 Hours</option>
                      <option value="Every 8 Hours">Every 8 Hours</option>
                      <option value="As Needed">As Needed</option>
                    </select>
                  </td>
                  
                  {/* Quantity */}
                  <td>
                    <input
                      type="number"
                      value={row.quantity || '1'}
                      onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                      min="1"
                      className="pharmacy-input-number"
                    />
                  </td>
                  
                  {/* Price */}
                  <td>
                    <input
                      type="number"
                      value={row.price || '0'}
                      onChange={(e) => updateRow(index, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                      className="pharmacy-input-number"
                      readOnly
                    />
                  </td>
                  
                  {/* Total */}
                  <td>
                    <div className="pharmacy-total">
                      ₹{row.total || '0.00'}
                    </div>
                  </td>
                  
                  {/* Notes */}
                  <td>
                    <input
                      type="text"
                      value={row.Notes || ''}
                      onChange={(e) => updateRow(index, 'Notes', e.target.value)}
                      placeholder="Instructions..."
                      className="pharmacy-input"
                    />
                  </td>
                  
                  {/* Actions */}
                  <td>
                    <button
                      className="pharmacy-delete-btn"
                      onClick={() => deleteRow(index)}
                      title="Delete medicine"
                    >
                      <MdDelete size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="pharmacy-footer">
        <button className="pharmacy-add-btn" onClick={addRow}>
          <MdAdd size={20} />
          Add Medicine
        </button>
        
        <div className="pharmacy-grand-total">
          <span className="grand-total-label">Grand Total:</span>
          <span className="grand-total-amount">₹{calculateGrandTotal()}</span>
        </div>
      </div>
    </div>
  );
};

export default PharmacyTable;

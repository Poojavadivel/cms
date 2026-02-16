// PharmacyTable.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';
import './PharmacyTable.css';
import medicinesService from '../../services/medicinesService';

const PharmacyTable = ({ rows, onRowsChanged, onStockWarnings }) => {
  const [medicines, setMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setLoadingMedicines(true);
    setLoadError(null);
    try {
      console.log('🔄 [PharmacyTable] Fetching medicines from API...');
      const results = await medicinesService.fetchMedicines({ limit: 1000 }); // Fetch more for dropdown

      console.log('✅ [PharmacyTable] API Response:', results);
      console.log('✅ [PharmacyTable] Loaded medicines for dropdown:', results.length);

      if (results.length > 0) {
        console.log('📋 [PharmacyTable] Sample medicine:', {
          name: results[0].name,
          _id: results[0]._id,
          stock: results[0].availableQty ?? results[0].stock,
          price: results[0].salePrice,
          strength: results[0].strength
        });
      } else {
        console.warn('⚠️ [PharmacyTable] No medicines returned from API!');
        setLoadError('No medicines found in database. Please add medicines first.');
      }

      setMedicines(results);
    } catch (error) {
      console.error('❌ [PharmacyTable] Error loading medicines:', error);
      console.error('❌ [PharmacyTable] Error details:', error.response?.data || error.message);
      setLoadError(error.message || 'Failed to load medicines');
    } finally {
      setLoadingMedicines(false);
    }
  };



  const getMedicineStock = (medicine) => {
    const availableQty = medicine.availableQty ?? medicine.stock ?? 0;
    if (typeof availableQty === 'number') return availableQty;
    if (typeof availableQty === 'string') return parseInt(availableQty) || 0;
    return 0;
  };

  const updateRow = (index, field, value) => {
    const updatedRows = [...rows];

    if (field === 'medicineId') {
      const selectedMed = medicines.find(m => m._id === value);
      if (selectedMed) {
        updatedRows[index].medicineId = selectedMed._id;
        updatedRows[index].Medicine = selectedMed.name;
        updatedRows[index].Dosage = selectedMed.strength || ''; // Auto-fill dosage
        updatedRows[index].price = parseFloat(selectedMed.salePrice || 0).toFixed(2);
        updatedRows[index].availableStock = getMedicineStock(selectedMed);

        // Recalculate total
        const quantity = parseInt(updatedRows[index].quantity || '1');
        const price = parseFloat(updatedRows[index].price || '0');
        updatedRows[index].total = (quantity * price).toFixed(2);
      }
    } else {
      updatedRows[index][field] = value;

      // Auto-calculate total when quantity or price changes
      if (field === 'quantity' || field === 'price') {
        const quantity = parseInt(updatedRows[index].quantity || '1');
        const price = parseFloat(updatedRows[index].price || '0');
        updatedRows[index].total = (quantity * price).toFixed(2);
      }
    }

    onRowsChanged(updatedRows);
  };

  const addRow = () => {
    const newRow = {
      medicineId: '',
      Medicine: '',
      Dosage: '',
      Frequency: '',
      duration: '5', // Default 5 days
      quantity: '1',
      price: '0.00',
      total: '0.00',
      Notes: '',
      availableStock: 0,
    };

    onRowsChanged([...rows, newRow]);
  };

  const deleteRow = (index) => {
    onRowsChanged(rows.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return rows.reduce((sum, row) => {
      const total = parseFloat(row.total || '0');
      return sum + total;
    }, 0).toFixed(2);
  };

  // Stock warnings logic
  const getStockWarnings = useCallback(() => {
    const warnings = [];
    rows.forEach(row => {
      const medicineName = row.Medicine || 'Unknown';
      const availableStock = row.availableStock || 0;
      const quantity = parseInt(row.quantity || '1');

      if (row.medicineId) {
        if (availableStock === 0) {
          warnings.push({
            medicine: medicineName,
            type: 'OUT_OF_STOCK',
            message: `⚠️ ${medicineName} is currently out of stock (Pharmacist will be notified)`,
            severity: 'warning' // Not blocking, just informational
          });
        } else if (quantity > availableStock) {
          warnings.push({
            medicine: medicineName,
            type: 'INSUFFICIENT',
            message: `⚠️ ${medicineName}: Only ${availableStock} units available, but ${quantity} requested (Pharmacist will be notified)`,
            severity: 'warning' // Not blocking, just informational
          });
        }
      }
    });
    return warnings;
  }, [rows]);

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

  if (loadError) {
    return (
      <div className="pharmacy-error" style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
        <p>❌ {loadError}</p>
        <button onClick={loadMedicines} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="pharmacy-table-container">
      <div className="pharmacy-table-wrapper">
        <table className="pharmacy-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Medicine</th>
              <th style={{ width: '10%' }}>Dosage</th>
              <th style={{ width: '12%' }}>Frequency</th>
              <th style={{ width: '10%' }}>Duration</th>
              <th style={{ width: '8%', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '15%' }}>Instructions</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Total (₹)</th>
              <th style={{ width: '10%' }}>Actions</th>
            </tr>

          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                  No medicines added yet. Click "Add Medicine" to start.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <select
                      value={row.medicineId || ''}
                      onChange={(e) => updateRow(index, 'medicineId', e.target.value)}
                      className="pharmacy-select"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                    >
                      <option value="">Select Medicine...</option>
                      {medicines.length === 0 ? (
                        <option disabled>No medicines found</option>
                      ) : (
                        medicines.map(m => {
                          const stock = m.availableQty ?? m.stock ?? 0;
                          const stockStatus = stock === 0 ? '⚠️ OUT OF STOCK' : `Stock: ${stock}`;
                          return (
                            <option key={m._id} value={m._id}>
                              {m.name} {m.strength ? `(${m.strength})` : ''} - ₹{m.salePrice || 0} ({stockStatus})
                            </option>
                          );
                        })
                      )}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.Dosage || ''}
                      onChange={(e) => updateRow(index, 'Dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="pharmacy-input"
                    />
                  </td>
                  <td>
                    <select
                      value={row.Frequency || ''}
                      onChange={(e) => updateRow(index, 'Frequency', e.target.value)}
                      className="pharmacy-select"
                    >
                      <option value="">Select...</option>
                      <option value="1-0-1">1-0-1 (BD)</option>
                      <option value="1-0-0">1-0-0 (OD)</option>
                      <option value="0-0-1">0-0-1 (HS)</option>
                      <option value="1-1-1">1-1-1 (TDS)</option>
                      <option value="1-1-1-1">1-1-1-1 (QID)</option>
                      <option value="SOS">SOS</option>
                    </select>
                  </td>
                  <td>
                    <div className="duration-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        value={row.duration || ''}
                        onChange={(e) => updateRow(index, 'duration', e.target.value)}
                        placeholder="Days"
                        className="pharmacy-input-number"
                        style={{ width: '50px' }}
                      />
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>days</span>
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.quantity || '1'}
                      onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                      min="1"
                      className="pharmacy-input-number"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.Notes || ''}
                      onChange={(e) => updateRow(index, 'Notes', e.target.value)}
                      placeholder="Special instructions..."
                      className="pharmacy-input"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <strong>₹{row.total}</strong>
                  </td>

                  <td style={{ textAlign: 'center' }}>
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

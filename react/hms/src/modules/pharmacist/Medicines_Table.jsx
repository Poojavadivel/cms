/**
 * PharmacistMedicines.jsx
 * Medicine Inventory Management - EXACTLY matching admin/doctor table design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdChevronLeft, MdChevronRight, MdAddCircle, MdRefresh, MdInventory, MdDelete, MdEdit, MdSave, MdClose, MdPostAdd, MdAutoAwesome } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import './Medicines.css';

import LoadingFallback from '../../components/common/LoadingFallback';

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

// Add Medicine Modal Component
const AddMedicineModal = ({ isOpen, onClose, onSave, medicine = null, isSaving = false }) => {
  const [formData, setFormData] = useState({
    strength: '',
    manufacturer: '',
    unit: 'pcs',
    form: 'Tablet'
  });

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || '',
        category: medicine.category || '',
        sku: medicine.sku || '',
        reorderLevel: medicine.reorderLevel || 20,
        strength: medicine.strength || '',
        manufacturer: medicine.manufacturer || '',
        unit: medicine.unit || 'pcs',
        form: medicine.form || 'Tablet'
      });
    } else {
      setFormData({
        name: '',
        category: '',
        sku: '',
        reorderLevel: 20,
        strength: '',
        manufacturer: '',
        unit: 'pcs',
        form: 'Tablet'
      });
    }
  }, [medicine, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'reorderLevel') ? Number(value) : value
    }));
  };

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>{medicine ? 'Edit Medicine' : 'Add New Medicine'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{ background: '#F8FAFC' }}>
          {/* Section 1: BASIC DETAILS */}
          <div className="form-card">
            <h4 className="form-section-title">BASIC DETAILS</h4>
            <div className="form-grid">
              <div className="detail-row form-grid-full">
                <label className="detail-label">Medicine Name *</label>
                <input
                  name="name"
                  className="search-input-lg"
                  style={{ height: '44px', padding: '0 12px' }}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. ZINCOFER"
                />
              </div>
              <div className="detail-row">
                <label className="detail-label">SKU / Code</label>
                <input
                  name="sku"
                  className="search-input-lg"
                  style={{ height: '44px', padding: '0 12px' }}
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g. MED-002"
                />
              </div>
              <div className="detail-row">
                <label className="detail-label">Manufacturer</label>
                <input
                  name="manufacturer"
                  className="search-input-lg"
                  style={{ height: '44px', padding: '0 12px' }}
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="e.g. Unknown"
                />
              </div>
            </div>
          </div>

          {/* Section 2: COMPOSITION */}
          <div className="form-card">
            <h4 className="form-section-title">COMPOSITION</h4>
            <div className="form-grid">
              <div className="detail-row">
                <label className="detail-label">Category *</label>
                <select
                  name="category"
                  className="search-input-lg"
                  style={{ height: '44px', padding: '0 12px' }}
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Capsule">Capsule</option>
                </select>
              </div>
              <div className="detail-row">
                <label className="detail-label">Form Type</label>
                <select
                  name="form"
                  className="search-input-lg"
                  style={{ height: '44px', padding: '0 12px' }}
                  value={formData.form}
                  onChange={handleChange}
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Ointment">Ointment</option>
                </select>
              </div>
              <div className="detail-row form-grid-full">
                <label className="detail-label">Strength</label>
                <input
                  name="strength"
                  className="search-input-lg"
                  style={{ height: '44px', padding: '0 12px' }}
                  value={formData.strength}
                  onChange={handleChange}
                  placeholder="e.g. 500mg"
                />
              </div>
            </div>
          </div>

          <div className="detail-row" style={{ padding: '0 8px' }}>
            <label className="detail-label">Reorder Level</label>
            <input
              name="reorderLevel"
              type="number"
              className="search-input-lg"
              style={{ height: '40px', padding: '0 12px' }}
              value={formData.reorderLevel}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button
            className="primary-btn"
            onClick={() => onSave(formData)}
            disabled={isSaving || !formData.name}
          >
            {isSaving ? 'Saving...' : medicine ? 'Update Medicine' : 'Add Medicine'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Manage Medicine Batches Modal
const ManageBatchesModal = ({ isOpen, onClose, medicine, onBatchUpdate }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0,
    supplier: '',
    location: ''
  });

  useEffect(() => {
    if (isOpen && medicine) {
      loadBatches();
    }
  }, [isOpen, medicine]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const response = await authService.get(`/pharmacy/batches?medicineId=${medicine._id}`);
      setBatches(response.batches || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = () => {
    const prefix = medicine?.sku?.split('-')[1] || 'BAT';
    const date = new Date();
    const timestamp = date.getFullYear().toString().substr(-2) + (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const autoBatch = `${prefix}-${timestamp}-${random}`;
    setNewBatch(prev => ({ ...prev, batchNumber: autoBatch }));
  };

  const handleSaveBatch = async () => {
    if (!newBatch.batchNumber || newBatch.quantity <= 0) {
      alert('Please enter batch number and quantity');
      return;
    }
    try {
      if (editingBatchId) {
        // Update existing batch
        await authService.put(`/pharmacy/batches/${editingBatchId}`, {
          ...newBatch,
          medicineId: medicine._id
        });
      } else {
        // Create new batch
        await authService.post('/pharmacy/batches', {
          ...newBatch,
          medicineId: medicine._id
        });
      }

      resetForm();
      loadBatches();
      if (onBatchUpdate) onBatchUpdate();
    } catch (error) {
      alert('Error saving batch: ' + error.message);
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatchId(batch._id);
    setNewBatch({
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
      quantity: batch.quantity,
      purchasePrice: batch.purchasePrice,
      salePrice: batch.salePrice,
      supplier: batch.supplier || '',
      location: batch.location || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingBatchId(null);
    setNewBatch({
      batchNumber: '',
      expiryDate: '',
      quantity: 0,
      purchasePrice: medicine.purchasePrice || 0,
      salePrice: medicine.price || 0,
      supplier: '',
      location: ''
    });
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await authService.delete(`/pharmacy/batches/${batchId}`);
      loadBatches();
      if (onBatchUpdate) onBatchUpdate();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Error deleting batch. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal-content" style={{ maxWidth: '900px', width: '95%' }}>
        <div className="modal-header" style={{ background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="batch-section-icon"><MdInventory size={20} /></div>
            <div>
              <h3 style={{ margin: 0 }}>Stock Management</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>{medicine.name} ({medicine.sku})</span>
                <span className={`stock-badge stock-${medicine.availableQty <= 10 ? 'low' : 'in'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                  Total Avail: {medicine.availableQty} {medicine.unit || 'units'}
                </span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><MdClose /></button>
        </div>

        <div className="modal-body" style={{ padding: '0px' }}>
          {showAddForm ? (
            <div className="batch-form-container" style={{ background: '#FFFBFB', borderBottom: '1px solid #FFE4E4', animation: 'fadeIn 0.3s ease' }}>
              <div className="batch-section-title">
                <div className="batch-section-icon"><MdAddCircle /></div>
                <span>{editingBatchId ? 'EDIT BATCH' : 'NEW BATCH ENTRY'}</span>
                {!editingBatchId && (
                  <button type="button" className="auto-gen-btn" onClick={handleGenerateBatch}>
                    <MdAutoAwesome /> Auto-Generate
                  </button>
                )}
              </div>

              <div className="batch-input-group">
                <div className="detail-row">
                  <label className="detail-label">Batch Number *</label>
                  <input
                    className="search-input-lg" style={{ height: '40px' }}
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                  />
                </div>
                <div className="detail-row">
                  <label className="detail-label">Expiry Date *</label>
                  <input
                    type="date" className="search-input-lg" style={{ height: '40px' }}
                    value={newBatch.expiryDate}
                    onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                  />
                </div>
                <div className="detail-row">
                  <label className="detail-label">Quantity *</label>
                  <input
                    type="number" className="search-input-lg" style={{ height: '40px' }}
                    value={newBatch.quantity}
                    onChange={(e) => setNewBatch({ ...newBatch, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="detail-row">
                  <label className="detail-label">Cost Price (₹) *</label>
                  <input
                    type="number" className="search-input-lg" style={{ height: '40px' }}
                    value={newBatch.purchasePrice}
                    onChange={(e) => setNewBatch({ ...newBatch, purchasePrice: Number(e.target.value) })}
                  />
                </div>
                <div className="detail-row">
                  <label className="detail-label">Sale Price (₹) *</label>
                  <input
                    type="number" className="search-input-lg" style={{ height: '40px' }}
                    value={newBatch.salePrice}
                    onChange={(e) => setNewBatch({ ...newBatch, salePrice: Number(e.target.value) })}
                  />
                </div>
                <div className="detail-row">
                  <label className="detail-label">Supplier</label>
                  <input
                    className="search-input-lg" style={{ height: '40px' }}
                    value={newBatch.supplier}
                    onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="secondary-btn" onClick={resetForm}>Cancel</button>
                <button className="primary-btn" onClick={handleSaveBatch} style={{ background: 'var(--primary)' }}>
                  <MdSave /> {editingBatchId ? 'Update Batch' : 'Confirm Release Stock'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Existing Batches</span>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Listing all physical stock units for this drug.</p>
              </div>
              <button className="add-btn" onClick={() => setShowAddForm(true)}>
                <MdAddCircle size={20} /> Add New Batch
              </button>
            </div>
          )}

          <div className="modern-table-wrapper" style={{ maxHeight: '400px', borderTop: '1px solid #F1F5F9' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Batch #</th>
                  <th style={{ width: '12%' }}>Expiry</th>
                  <th style={{ width: '10%' }}>Qty</th>
                  <th style={{ width: '12%' }}>Supplier</th>
                  <th style={{ width: '12%' }}>Location</th>
                  <th style={{ width: '10%' }}>CP (₹)</th>
                  <th style={{ width: '10%' }}>SP (₹)</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading...</td></tr>
                ) : batches.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>No active batches found</td></tr>
                ) : (
                  batches.map(batch => (
                    <tr key={batch._id}>
                      <td style={{ fontWeight: '600' }}>{batch.batchNumber}</td>
                      <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`stock-badge stock-${batch.quantity <= 10 ? 'low' : 'in'}`}>
                          {batch.quantity}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748B' }}>{batch.supplier || '-'}</td>
                      <td style={{ fontSize: '12px', color: '#64748B' }}>{batch.location || '-'}</td>
                      <td>₹{batch.purchasePrice}</td>
                      <td>₹{batch.salePrice}</td>
                      <td>
                        <button className="action-btn action-edit" onClick={() => handleEditBatch(batch)} title="Edit Batch" style={{ marginRight: '8px' }}>
                          <MdEdit size={16} />
                        </button>
                        <button className="action-btn action-delete" onClick={() => handleDeleteBatch(batch._id)} title="Delete Batch">
                          <MdDelete size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid #F1F5F9' }}>
          <button className="secondary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// View Medicine Details Modal
const ViewMedicineModal = ({ isOpen, onClose, medicine }) => {
  if (!isOpen || !medicine) return null;

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>Medicine Details</h3>
          <button className="close-btn" onClick={onClose}><MdClose /></button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">Name</span>
            <span className="detail-value" style={{ fontSize: '1.2rem', color: '#2663FF' }}>{medicine.name}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
            <div className="detail-row">
              <span className="detail-label">Category</span>
              <span className="detail-value">{medicine.category || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">SKU (Correct Code)</span>
              <span className="detail-value">{medicine.sku || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Strength</span>
              <span className="detail-value">{medicine.strength || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Form</span>
              <span className="detail-value">{medicine.form || 'Tablet'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Current Stock</span>
              <span className={`detail-value stock-badge stock-${medicine.availableQty <= 0 ? 'out' : medicine.availableQty <= medicine.reorderLevel ? 'low' : 'in'}`} style={{ display: 'inline-block' }}>
                {medicine.availableQty} {medicine.unit || 'pcs'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Price</span>
              <span className="detail-value">₹{medicine.price?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          {medicine.manufacturer && (
            <div className="detail-row" style={{ marginTop: '12px' }}>
              <span className="detail-label">Manufacturer</span>
              <span className="detail-value">{medicine.manufacturer}</span>
            </div>
          )}
          <div style={{ marginTop: '20px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdInventory size={16} />
              <span>Stock levels are managed via the <strong>Add Stock</strong> page (Batch Management).</span>
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="primary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const PharmacistMedicines = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const itemsPerPage = 10;

  const loadMedicines = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [Medicines] Loading medicines...');
      const response = await authService.get('/pharmacy/medicines?limit=200');

      let medicinesList = [];
      if (Array.isArray(response)) {
        medicinesList = response;
      } else if (response && typeof response === 'object') {
        medicinesList = response.medicines || response.data || [];
      }

      console.log('✅ [Medicines] Loaded:', medicinesList.length);
      if (medicinesList.length > 0) {
        console.log('Sample Data (Raw):', medicinesList.slice(0, 3));
      }

      // Normalize data with strict type parsing
      const normalized = medicinesList.map(med => {
        const qty = parseInt(med.availableQty ?? med.stock ?? med.quantity ?? 0, 10);
        return {
          _id: med._id || med.id,
          name: med.name || 'Unknown',
          category: med.category || 'N/A',
          sku: med.sku || 'N/A',
          availableQty: isNaN(qty) ? 0 : qty,
          reorderLevel: parseInt(med.reorderLevel || 20, 10),
          strength: med.strength || '',
          manufacturer: med.manufacturer || med.brand || '',
          price: parseFloat(med.salePrice || med.price || 0),
          unit: med.unit || 'pcs',
          form: med.form || 'Tablet'
        };
      });

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
    setEditingMedicine(null);
    setIsModalOpen(true);
  };

  const handleSaveMedicine = async (formData) => {
    setIsSaving(true);
    setMessage(null);
    try {
      if (editingMedicine) {
        // Update existing
        await authService.put(`/pharmacy/medicines/${editingMedicine._id}`, formData);
        setMessage({ type: 'success', text: 'Medicine updated successfully!' });
      } else {
        // Create new
        await authService.post('/pharmacy/medicines', formData);
        setMessage({ type: 'success', text: 'Medicine added successfully!' });
      }
      setIsModalOpen(false);
      loadMedicines();
    } catch (error) {
      console.error('Error saving medicine:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save medicine' });
    } finally {
      setIsSaving(false);
      // Auto-clear success message
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleViewMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setIsViewModalOpen(true);
  };

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleManageBatches = (medicine) => {
    setEditingMedicine(medicine);
    setIsBatchModalOpen(true);
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
    // Force numbers for comparison to avoid string logic errors
    const s = Number(stock);
    const r = Number(reorderLevel);
    if (s <= 0) return 'out';
    if (s <= r) return 'low';
    return 'in';
  };

  const getStockLabel = (stock, reorderLevel) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  // Derive fresh medicine data from state to avoid stale props in modals
  const activeMedicine = editingMedicine
    ? medicines.find(m => m._id === editingMedicine._id) || editingMedicine
    : null;

  return (
    <div className="dashboard-container">
      {/* Header - EXACTLY like admin/doctor */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">Medicine Inventory</h1>
          <p className="main-subtitle">Manage pharmacy inventory and stock levels.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Stock Stats Widget */}
          <div style={{ display: 'flex', gap: '12px', marginRight: '8px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>TOTAL ITEMS</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{medicines.length}</div>
            </div>
            <div style={{ width: '1px', background: '#CBD5E1' }}></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: '600' }}>LOW STOCK</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#F59E0B' }}>
                {medicines.filter(m => (m.availableQty || 0) <= (m.reorderLevel || 20) && (m.availableQty || 0) > 0).length}
              </div>
            </div>
            <div style={{ width: '1px', background: '#CBD5E1' }}></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600' }}>OUT OF STOCK</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#EF4444' }}>
                {medicines.filter(m => (m.availableQty || 0) <= 0).length}
              </div>
            </div>
          </div>

          <button className="add-btn" onClick={handleAddMedicine}>
            <MdAddCircle size={18} />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`status-pill ${message.type}`} style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 2000,
          padding: '10px 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideUp 0.3s ease'
        }}>
          {message.text}
        </div>
      )}

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
                          {(() => {
                            const val = medicine.availableQty;
                            const displayVal = (val === undefined || val === null || val === '' || isNaN(val)) ? '0' : val;
                            return displayVal;
                          })()}
                          <span style={{ fontSize: '0.85em', opacity: 0.8, marginLeft: '2px' }}>{medicine.unit || 'pcs'}</span>
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
                        <div className="cell-actions">
                          <button
                            className="action-btn action-view"
                            onClick={() => handleViewMedicine(medicine)}
                            title="View Details"
                          >
                            <Icons.Eye />
                          </button>
                          <button
                            className="action-btn action-edit"
                            style={{ background: '#F0F9FF', color: '#0369A1' }}
                            onClick={() => handleManageBatches(medicine)}
                            title="Manage Stock (Batches)"
                          >
                            <MdInventory size={16} />
                          </button>
                          <button
                            className="action-btn action-edit"
                            onClick={() => handleEditMedicine(medicine)}
                            title="Edit Medicine"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            className="action-btn action-delete"
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
        <div className="pagination-footer">
          <button
            className="page-arrow-circle"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <MdChevronLeft size={22} />
          </button>
          <div className="page-indicator-box">
            {totalPages > 0 ? currentPage + 1 : 0} / {totalPages}
          </div>
          <button
            className="page-arrow-circle"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
          >
            <MdChevronRight size={22} />
          </button>
          <div className="pagination-info">
            Showing {filteredMedicines.length > 0 ? startIndex + 1 : 0} - {endIndex} of {filteredMedicines.length} items
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMedicineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        medicine={editingMedicine ? activeMedicine : null}
        onSave={handleSaveMedicine}
        isSaving={isSaving}
      />

      <ViewMedicineModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        medicine={activeMedicine}
      />

      <ManageBatchesModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        medicine={activeMedicine}
        onBatchUpdate={loadMedicines}
      />
    </div>
  );
};

export default PharmacistMedicines;

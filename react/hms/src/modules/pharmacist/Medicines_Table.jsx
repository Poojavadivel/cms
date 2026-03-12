/**
 * PharmacistMedicines.jsx
 * Medicine Inventory Management - EXACTLY matching admin/doctor table design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdChevronLeft, MdChevronRight, MdAddCircle, MdRefresh, MdInventory, MdDelete, MdEdit, MdSave, MdClose, MdPostAdd, MdAutoAwesome, MdCategory, MdQrCode, MdFitnessCenter, MdFormatSize, MdPayments, MdBusiness, MdInfoOutline, MdLocalHospital, MdPerson, MdPhone, MdFavorite, MdDescription, MdNotificationsActive } from 'react-icons/md';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    reorderLevel: 20,
    strength: '',
    manufacturer: '',
    unit: 'pcs',
    form: 'Tablet',
    stock: 0,
    salePrice: 0
  });

  const [errors, setErrors] = useState({});

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
        form: medicine.form || 'Tablet',
        stock: medicine.availableQty || 0,
        salePrice: medicine.price || 0
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
        form: 'Tablet',
        stock: 0,
        salePrice: 0
      });
    }
    setCurrentStep(1);
  }, [medicine, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (['reorderLevel', 'stock', 'salePrice'].includes(name)) ? Number(value) : value
    }));
  };

  const steps = [
    { id: 1, label: 'STEP 01', title: 'Details', icon: <MdPerson /> },
    { id: 2, label: 'STEP 02', title: 'Composition', icon: <MdPhone /> },
    { id: 3, label: 'STEP 03', title: 'Inventory', icon: <MdFavorite /> },
    { id: 4, label: 'STEP 04', title: 'Finish', icon: <MdDescription /> },
  ];

  const handleNext = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = true;
      if (!formData.sku.trim()) newErrors.sku = true;
    } else if (currentStep === 2) {
      if (!formData.category) newErrors.category = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (currentStep < 4) setCurrentStep(currentStep + 1);
    else onSave(formData);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="dashboard-modal-overlay">
      <div className="stepper-modal-container" style={{ width: '950px' }}>
        {/* Left Sidebar */}
        <div className="stepper-sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <MdPerson size={24} />
            </div>
            <div className="brand-name">MOVI HOSPITAL</div>
          </div>

          <div className="step-nav">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
              >
                <div className="step-circle">
                  {step.icon}
                </div>
                <div className="step-info">
                  <span className="step-label">{step.label}</span>
                  <span className="step-title">{step.title}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <button className="discard-btn" onClick={onClose}>
              <div className="discard-icon-box">
                <MdClose size={20} />
              </div>
              DISCARD ENTRY
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="stepper-content-wrapper">
          <div className="stepper-header-main">
            <div className="header-title-box">
              <h2>{steps[currentStep - 1].title} <span>Module</span></h2>
              <div className="header-subtitle">PHARMACY AND INVENTORY IDENTIFICATION PHASE— PHASE {currentStep} OF 4</div>
            </div>
            <button className="stepper-close-btn" onClick={onClose}><MdClose size={24} /></button>
          </div>

          <div className="stepper-form-body">
            {currentStep === 1 && (
              <div className="tab-content-fade">
                <div className="form-row">
                  <div className={`form-field full-width ${errors.name ? 'field-error' : ''}`}>
                    <label>MEDICINE NAME *</label>
                    <div className="field-icon-wrapper">
                      <MdLocalHospital size={18} />
                      <input
                        name="name"
                        value={formData.name}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.name) setErrors(prev => ({ ...prev, name: false }));
                        }}
                        placeholder="e.g. ZINCOFER"
                        required
                        autoFocus
                      />
                    </div>
                    {errors.name && <span className="error-text">Medicine name is required</span>}
                  </div>
                </div>
                <div className="form-row" style={{ marginTop: '20px' }}>
                  <div className={`form-field ${errors.sku ? 'field-error' : ''}`}>
                    <label>SKU / CODE *</label>
                    <div className="field-icon-wrapper">
                      <MdQrCode size={18} />
                      <input
                        name="sku"
                        value={formData.sku}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.sku) setErrors(prev => ({ ...prev, sku: false }));
                        }}
                        placeholder="e.g. MED-002"
                      />
                    </div>
                    {errors.sku && <span className="error-text">SKU is required</span>}
                  </div>
                  <div className="form-field">
                    <label>MANUFACTURER</label>
                    <div className="field-icon-wrapper">
                      <MdBusiness size={18} />
                      <input
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        placeholder="e.g. GSK, Pfizer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="tab-content-fade">
                <div className={`form-field ${errors.category ? 'field-error' : ''}`}>
                  <label>PRIMARY CATEGORY *</label>
                  <div className="toggle-group">
                    {['Tablet', 'Syrup', 'Injection'].map(cat => (
                      <div
                        key={cat}
                        className={`toggle-option ${formData.category === cat ? 'active' : ''}`}
                        onClick={() => {
                          setFormData({ ...formData, category: cat });
                          if (errors.category) setErrors(prev => ({ ...prev, category: false }));
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                  {errors.category && <span className="error-text">Please select a category</span>}
                </div>
                <div className="form-row" style={{ marginTop: '30px' }}>
                  <div className="form-field">
                    <label>FORM TYPE</label>
                    <select name="form" value={formData.form} onChange={handleChange}>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>STRENGTH</label>
                    <div className="field-icon-wrapper">
                      <MdFitnessCenter size={18} />
                      <input
                        name="strength"
                        value={formData.strength}
                        onChange={handleChange}
                        placeholder="e.g. 500mg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="tab-content-fade">
                <div className="form-field">
                  <label>REORDER LEVEL *</label>
                  <div className="field-icon-wrapper">
                    <MdNotificationsActive size={18} />
                    <input
                      name="reorderLevel"
                      type="number"
                      style={{ height: '50px', fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      placeholder="e.g. 20"
                    />
                  </div>
                  <p style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
                    System will notify you when total stock across all active batches falls below this number.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="tab-content-fade" style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <MdSave size={40} />
                </div>
                <h3>Ready to Save?</h3>
                <p style={{ color: '#64748B', maxWidth: '300px', margin: '10px auto' }}>Please review all details before finalizing the entry into the system.</p>

                <div style={{ marginTop: '30px', padding: '20px', background: '#F8FAFC', borderRadius: '15px', textAlign: 'left' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><small style={{ color: '#94A3B8' }}>NAME</small><div style={{ fontWeight: '700' }}>{formData.name || 'N/A'}</div></div>
                    <div><small style={{ color: '#94A3B8' }}>CATEGORY</small><div style={{ fontWeight: '700' }}>{formData.category || 'N/A'}</div></div>
                    <div style={{ gridColumn: 'span 2' }}><small style={{ color: '#94A3B8' }}>ALERT SETTING</small><div style={{ fontWeight: '700' }}>Reorder at {formData.reorderLevel} Units</div></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="stepper-footer">
            <button className="btn-dismiss" onClick={currentStep === 1 ? onClose : handleBack}>
              {currentStep === 1 ? 'DISMISS' : 'PREVIOUS PHASE'}
            </button>
            <button className="btn-next-phase" onClick={handleNext}>
              {currentStep === 4 ? 'FINISH ENTRY' : 'NEXT PHASE'} <MdChevronRight size={20} />
            </button>
          </div>
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
      <div className="dashboard-modal-content" style={{ maxWidth: '900px' }}>
        <div className="modal-header chatbot-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MdInventory size={28} />
            <h3>Manage Stock (Batches)</h3>
          </div>
          <button className="close-btn" onClick={onClose}><MdClose /></button>
        </div>

        <div className="modal-body" style={{ padding: '32px' }}>
          {/* Medicine Info Section */}
          <div className="medicine-hero" style={{ padding: '20px', marginBottom: '32px' }}>
            <div className="hero-icon-box" style={{ width: '48px', height: '48px' }}>
              <MdInventory size={24} />
            </div>
            <div className="hero-text">
              <h2 style={{ fontSize: '18px' }}>{medicine.name}</h2>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>SKU: <strong>{medicine.sku}</strong></span>
                <span className={`stock-tag-float status-${medicine.availableQty <= medicine.reorderLevel ? 'low' : 'in'}`} style={{ marginTop: 0 }}>
                  Total Available: {medicine.availableQty} {medicine.unit || 'units'}
                </span>
              </div>
            </div>
          </div>

          {showAddForm ? (
            <div className="form-section" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, border: 'none', padding: 0 }}>
                  <MdAddCircle /> {editingBatchId ? 'Edit Batch Details' : 'New Batch Entry'}
                </h3>
                {!editingBatchId && (
                  <button type="button" className="btn-secondary" style={{ height: '36px', fontSize: '12px' }} onClick={handleGenerateBatch}>
                    <MdAutoAwesome /> Auto-Generate Batch #
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Batch Number *</label>
                  <input
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                    placeholder="e.g. BAT-24A-XYZ"
                  />
                </div>
                <div className="form-field">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    value={newBatch.expiryDate}
                    onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={newBatch.quantity}
                    onChange={(e) => setNewBatch({ ...newBatch, quantity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Cost Price (₹)</label>
                  <input
                    type="number"
                    value={newBatch.purchasePrice}
                    onChange={(e) => setNewBatch({ ...newBatch, purchasePrice: Number(e.target.value) })}
                  />
                </div>
                <div className="form-field">
                  <label>Sale Price (₹)</label>
                  <input
                    type="number"
                    value={newBatch.salePrice}
                    onChange={(e) => setNewBatch({ ...newBatch, salePrice: Number(e.target.value) })}
                  />
                </div>
                <div className="form-field">
                  <label>Supplier</label>
                  <input
                    value={newBatch.supplier}
                    onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })}
                    placeholder="Manufacturer/Distributor"
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={resetForm}>Cancel</button>
                <button className="btn-primary" onClick={handleSaveBatch}>
                  <MdSave /> {editingBatchId ? 'Update Batch' : 'Save Batch Info'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Active Stock Batches</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Manage individual physical stock units.</p>
              </div>
              <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                <MdAddCircle size={20} /> Add New Batch
              </button>
            </div>
          )}


          <div className="modern-table-wrapper" style={{ maxHeight: '400px', border: '1px solid #F1F5F9', borderRadius: '12px' }}>
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

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// View Medicine Details Modal
const ViewMedicineModal = ({ isOpen, onClose, medicine }) => {
  if (!isOpen || !medicine) return null;

  const stockStatus = medicine.availableQty <= 0 ? 'out' : medicine.availableQty <= medicine.reorderLevel ? 'low' : 'in';
  const stockLabel = stockStatus === 'out' ? 'Out of Stock' : stockStatus === 'low' ? 'Low Stock' : 'In Stock';

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal-content" style={{ maxWidth: '800px', height: 'auto', maxHeight: '90vh' }}>
        <div className="modal-header chatbot-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MdInfoOutline size={28} />
            <h3>Medicine Information</h3>
          </div>
          <button className="close-btn" onClick={onClose}><MdClose /></button>
        </div>

        <div className="modal-body" style={{ padding: '32px' }}>
          {/* Hero Section */}
          <div className="medicine-hero">
            <div className="hero-icon-box">
              <MdInventory size={32} />
            </div>
            <div className="hero-text">
              <h2>{medicine.name}</h2>
              <p>{medicine.genericName || 'Full clinical details and inventory status'}</p>
              <span className={`stock-tag-float status-${stockStatus}`}>
                {stockLabel}: {medicine.availableQty} {medicine.unit || 'pcs'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="view-medicine-grid">
            <div className="info-card">
              <div className="info-icon"><MdCategory size={20} /></div>
              <div className="info-content">
                <span className="info-label">Category</span>
                <span className="info-value">{medicine.category || 'N/A'}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon"><MdQrCode size={20} /></div>
              <div className="info-content">
                <span className="info-label">SKU / Code</span>
                <span className="info-value">{medicine.sku || 'N/A'}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon"><MdFitnessCenter size={20} /></div>
              <div className="info-content">
                <span className="info-label">Strength</span>
                <span className="info-value">{medicine.strength || 'N/A'}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon"><MdFormatSize size={20} /></div>
              <div className="info-content">
                <span className="info-label">Form Type</span>
                <span className="info-value">{medicine.form || 'Tablet'}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon"><MdPayments size={20} /></div>
              <div className="info-content">
                <span className="info-label">Unit Price</span>
                <span className="info-value" style={{ color: '#10B981' }}>₹{medicine.price?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon"><MdBusiness size={20} /></div>
              <div className="info-content">
                <span className="info-label">Manufacturer</span>
                <span className="info-value">{medicine.manufacturer || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '32px',
            padding: '20px',
            background: 'var(--primary-bg)',
            borderRadius: '12px',
            border: '1px dashed var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <MdAutoAwesome style={{ color: 'var(--primary)' }} size={20} />
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
              Stock levels are synchronized with the central pharmacy database. Reorder level is set to <strong>{medicine.reorderLevel} units</strong>.
            </p>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '24px 32px' }}>
          <button
            className="primary-btn"
            onClick={onClose}
            style={{
              background: 'var(--primary)',
              padding: '12px 32px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              color: 'white'
            }}
          >
            Done
          </button>
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
          form: med.form || 'Tablet',
          createdAt: med.createdAt || null
        };
      });

      // Sort by createdAt descending (Newest first) - Addressing "if new medicine add means stock value nmbers place on top"
      const sorted = normalized.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setMedicines(sorted);
      setFilteredMedicines(sorted);

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
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Stock Stats Widget */}
          <div style={{
            display: 'flex',
            gap: '0',
            background: 'white',
            padding: '8px 16px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ padding: '0 16px', borderRight: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>{medicines.length}</div>
            </div>
            <div style={{ padding: '0 16px', borderRight: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--warning)' }}>
                {medicines.filter(m => (m.availableQty || 0) <= (m.reorderLevel || 20) && (m.availableQty || 0) > 0).length}
              </div>
            </div>
            <div style={{ padding: '0 16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Out</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>
                {medicines.filter(m => (m.availableQty || 0) <= 0).length}
              </div>
            </div>
          </div>

          <button className="add-btn" onClick={handleAddMedicine} style={{ height: '48px' }}>
            <MdAddCircle size={20} />
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
                            className="action-btn action-inventory"
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

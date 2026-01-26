/**
 * Add/Edit Batch Dialog
 * Neo-Pro Design System - Scrollable Layout
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdCheck, MdInventory, MdDateRange, MdAttachMoney, MdStore } from 'react-icons/md';
import pharmacyService from '../../../services/pharmacyService';
import './AddBatchDialog.css';

const AddBatchDialog = ({ isOpen, onClose, batch, medicines, onSuccess }) => {
  const [formData, setFormData] = useState({
    medicineId: '',
    batchNumber: '',
    quantity: 0,
    salePrice: 0,
    purchasePrice: 0,
    supplier: '',
    location: 'Main Store',
    expiryDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (batch) {
      setFormData({
        medicineId: batch.medicineId || '',
        batchNumber: batch.batchNumber || '',
        quantity: batch.quantity || 0,
        salePrice: batch.salePrice || 0,
        purchasePrice: batch.purchasePrice || 0,
        supplier: batch.supplier || '',
        location: batch.location || 'Main Store',
        expiryDate: batch.expiryDate ? batch.expiryDate.split('T')[0] : '',
      });
    } else {
      // Default expiry date: 2 years from now
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const defaultExpiry = futureDate.toISOString().split('T')[0];

      setFormData({
        medicineId: '',
        batchNumber: '',
        quantity: 0,
        salePrice: 0,
        purchasePrice: 0,
        supplier: '',
        location: 'Main Store',
        expiryDate: defaultExpiry,
      });
    }
    setError('');
  }, [batch, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 :
        name === 'salePrice' || name === 'purchasePrice' ? parseFloat(value) || 0 :
          value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!formData.medicineId) throw new Error('Please select a medicine');
      if (!formData.batchNumber.trim()) throw new Error('Batch number is required');
      if (formData.quantity <= 0) throw new Error('Quantity must be greater than 0');
      if (formData.salePrice <= 0) throw new Error('Sale price must be greater than 0');

      if (batch) {
        await pharmacyService.updateBatch(batch._id, formData);
      } else {
        await pharmacyService.createBatch(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-container">

        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-title-group">
            <div className="title-icon-box">
              <MdInventory />
            </div>
            <div className="title-text">
              <h2>{batch ? 'Edit Batch Stock' : 'Add New Batch'}</h2>
              <p>Manage inventory stock and pricing</p>
            </div>
          </div>
          <button className="dialog-close-btn" onClick={onClose} disabled={isSubmitting}>
            <MdClose size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="dialog-scroll-body">
          {error && <div className="error-banner">⚠️ {error}</div>}

          <form id="batchForm" onSubmit={handleSubmit}>

            {/* Section 1: Batch Details */}
            <div className="form-section">
              <div className="form-section-header">Batch Details</div>

              <div className="form-group full-width">
                <label className="form-label">Select Medicine *</label>
                <select
                  name="medicineId"
                  className="form-select"
                  value={formData.medicineId}
                  onChange={handleChange}
                  required
                  autoFocus
                >
                  <option value="">-- Choose from Inventory --</option>
                  {medicines.map(med => (
                    <option key={med._id} value={med._id}>
                      {med.name} {med.strength && `(${med.strength})`} - {med.sku}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Batch Number *</label>
                <input
                  type="text"
                  name="batchNumber"
                  className="form-input"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., BTH-2024-001"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  className="form-input"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Expiry Date *</label>
                <div style={{ position: 'relative' }}>
                  <MdDateRange style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="date"
                    name="expiryDate"
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing */}
            <div className="form-section" style={{ borderColor: '#fbcfe8', background: '#fff1f2' }}>
              <div className="form-section-header" style={{ color: '#be123c' }}>
                <MdAttachMoney /> Pricing
              </div>

              <div className="form-group">
                <label className="form-label">Cost Price (₹) *</label>
                <input
                  type="number"
                  name="purchasePrice"
                  className="form-input"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sale Price (₹) *</label>
                <input
                  type="number"
                  name="salePrice"
                  className="form-input"
                  value={formData.salePrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  style={{ fontWeight: 'bold', color: '#be123c' }}
                />
              </div>
            </div>

            {/* Section 3: Supply Chain */}
            <div className="form-section" style={{ marginBottom: 0 }}>
              <div className="form-section-header">
                <MdStore /> Supply Chain
              </div>

              <div className="form-group">
                <label className="form-label">Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  className="form-input"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="e.g., ABC Distributors"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Main Store - Shelf A"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="dialog-footer">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" form="batchForm" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : <><MdCheck size={20} /> Save Batch</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddBatchDialog;

/**
 * Add/Edit Batch Dialog
 * Modal for creating and updating batches
 */

import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import pharmacyService from '../../../services/pharmacyService';
import './Dialog.css';

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
      // Validate
      if (!formData.medicineId) {
        throw new Error('Please select a medicine');
      }
      if (!formData.batchNumber.trim()) {
        throw new Error('Batch number is required');
      }
      if (formData.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (formData.salePrice <= 0) {
        throw new Error('Sale price must be greater than 0');
      }

      if (batch) {
        // Update existing
        await pharmacyService.updateBatch(batch._id, formData);
      } else {
        // Create new
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
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{batch ? 'Edit Batch' : 'Add New Batch'}</h2>
          <button className="dialog-close" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="form-section-title">Batch Information</div>
            
            <div className="form-row">
              <div className="form-group full-width">
                <label>Select Medicine *</label>
                <select 
                  name="medicineId" 
                  value={formData.medicineId} 
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Medicine --</option>
                  {medicines.map(med => (
                    <option key={med._id} value={med._id}>
                      {med.name} {med.strength && `(${med.strength})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Batch Number *</label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., BTH-2024-001"
                />
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="e.g., ABC Distributors"
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Main Store"
                />
              </div>
            </div>

            <div className="form-section-title">Pricing</div>

            <div className="form-row">
              <div className="form-group">
                <label>Cost Price (₹) *</label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Sale Price (₹) *</label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Expiry Date *</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="dialog-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : batch ? 'Update Batch' : 'Add Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatchDialog;

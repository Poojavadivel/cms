/**
 * Add/Edit Medicine Dialog
 * Modal for creating and updating medicine inventory
 */

import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import pharmacyService from '../../../services/pharmacyService';
import './Dialog.css';

const AddMedicineDialog = ({ isOpen, onClose, medicine, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Tablet',
    manufacturer: '',
    form: 'Tablet',
    strength: '',
    availableQty: 0,
    reorderLevel: 20,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || '',
        sku: medicine.sku || '',
        category: medicine.category || 'Tablet',
        manufacturer: medicine.manufacturer || '',
        form: medicine.form || 'Tablet',
        strength: medicine.strength || '',
        availableQty: medicine.availableQty || 0,
        reorderLevel: medicine.reorderLevel || 20,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'Tablet',
        manufacturer: '',
        form: 'Tablet',
        strength: '',
        availableQty: 0,
        reorderLevel: 20,
      });
    }
    setError('');
  }, [medicine, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'availableQty' || name === 'reorderLevel' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate
      if (!formData.name.trim()) {
        throw new Error('Medicine name is required');
      }
      if (!formData.category.trim()) {
        throw new Error('Category is required');
      }

      if (medicine) {
        // Update existing
        await pharmacyService.updateMedicine(medicine._id, formData);
      } else {
        // Create new
        await pharmacyService.createMedicine(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{medicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
          <button className="dialog-close" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Medicine Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Paracetamol"
                />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g., MED001"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Drops">Drops</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Powder">Powder</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Form</label>
                <select name="form" value={formData.form} onChange={handleChange}>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Drops">Drops</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Powder">Powder</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="e.g., GSK Pharmaceuticals"
                />
              </div>
              <div className="form-group">
                <label>Strength</label>
                <input
                  type="text"
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  placeholder="e.g., 500mg"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Available Quantity *</label>
                <input
                  type="number"
                  name="availableQty"
                  value={formData.availableQty}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Reorder Level</label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="dialog-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : medicine ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineDialog;

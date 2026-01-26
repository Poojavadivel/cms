/**
 * Add/Edit Medicine Dialog
 * Neo-Pro Design System - Scrollable with Custom Header
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdCheck, MdLocalPharmacy, MdInventory } from 'react-icons/md';
import pharmacyService from '../../../services/pharmacyService';
import './AddMedicineDialog.css';

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
      if (!formData.name.trim()) throw new Error('Medicine name is required');

      if (medicine) {
        await pharmacyService.updateMedicine(medicine._id, formData);
      } else {
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
    <div className="dialog-overlay">
      <div className="dialog-container">

        {/* New White Custom Header */}
        <div className="dialog-header">
          <div className="dialog-title-group">
            <div className="title-icon-box">
              <MdLocalPharmacy />
            </div>
            <div className="title-text">
              <h2>{medicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <p>Enter details to update inventory</p>
            </div>
          </div>
          <button className="dialog-close-btn" onClick={onClose}>
            <MdClose size={20} />
          </button>
        </div>

        {/* Scrollable Body with Sections */}
        <div className="dialog-scroll-body">
          {error && <div className="error-banner">⚠️ {error}</div>}

          <form id="medicineForm" onSubmit={handleSubmit}>

            {/* Section 1: Basic Details */}
            <div className="form-section">
              <div className="form-section-header">Basic Details</div>

              <div className="form-group full-width">
                <label className="form-label">Medicine Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Paracetamol 500mg"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Code</label>
                <input
                  type="text"
                  name="sku"
                  className="form-input"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g., MED-001"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  className="form-input"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="e.g., GSK Pharmaceuticals"
                />
              </div>
            </div>

            {/* Section 2: Composition */}
            <div className="form-section">
              <div className="form-section-header">Composition</div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="category" className="form-select" value={formData.category} onChange={handleChange} required>
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
                <label className="form-label">Form Type</label>
                <select name="form" className="form-select" value={formData.form} onChange={handleChange}>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Drops">Drops</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Powder">Powder</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Strength</label>
                <input
                  type="text"
                  name="strength"
                  className="form-input"
                  value={formData.strength}
                  onChange={handleChange}
                  placeholder="e.g., 500mg"
                />
              </div>
            </div>

            {/* Section 3: Inventory */}
            <div className="form-section" style={{ marginBottom: 0, borderColor: '#bfdbfe', background: '#eff6ff' }}>
              <div className="form-section-header" style={{ color: '#1e40af' }}>
                <MdInventory /> Inventory
              </div>

              <div className="form-group">
                <label className="form-label">Initial Stock *</label>
                <input
                  type="number"
                  name="availableQty"
                  className="form-input"
                  value={formData.availableQty}
                  onChange={handleChange}
                  required
                  min="0"
                  style={{ fontWeight: 'bold' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input
                  type="number"
                  name="reorderLevel"
                  className="form-input"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  min="0"
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
          <button type="submit" form="medicineForm" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : <><MdCheck size={20} /> Save Medicine</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMedicineDialog;

/**
 * IntakeFormDialog.jsx  
 * Exact replica of Flutter's IntakeFormBody
 * Collapsible sections for Medical Notes, Pharmacy, Pathology, Follow-Up
 */

import React, { useState, useEffect } from 'react';
import {
  MdClose,
  MdNoteAlt,
  MdLocalPharmacy,
  MdBiotech,
  MdEventNote,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdAdd,
  MdDelete,
} from 'react-icons/md';
import PatientProfileHeaderCard from './PatientProfileHeaderCard';
import './IntakeFormDialog.css';

const IntakeFormDialog = ({ appointment, patient, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    currentNotes: '',
    height: '',
    weight: '',
    bmi: '',
    spo2: '',
  });

  const [pharmacyRows, setPharmacyRows] = useState([]);
  const [pathologyRows, setPathologyRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-calculate BMI
  useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
      const hMeters = h / 100;
      const bmi = w / (hMeters * hMeters);
      setFormData(prev => ({ ...prev, bmi: bmi.toFixed(1) }));
    }
  }, [formData.height, formData.weight]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({
          ...formData,
          pharmacyRows,
          pathologyRows,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving intake:', error);
      alert('Failed to save intake form');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="intake-form-overlay" onClick={onClose}>
      <div className="intake-form-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="intake-close-btn" onClick={onClose}>
          <MdClose />
        </button>

        {/* Content */}
        <div className="intake-form-wrapper">
          {/* Patient Header */}
          <div className="intake-patient-header">
            <PatientProfileHeaderCard patient={patient} />
          </div>

          {/* Scrollable Form Sections */}
          <form onSubmit={handleSubmit} className="intake-form-content">
            {/* Medical Notes Section */}
            <SectionCard
              icon={<MdNoteAlt />}
              title="Medical Notes"
              description="Overview, vitals, and notes history."
              initiallyExpanded={false}
            >
              <div className="vitals-editor">
                <h4 className="editor-title">Edit Vitals</h4>
                <div className="vitals-row">
                  <div className="vitals-input">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => handleChange('height', e.target.value)}
                      placeholder="170"
                    />
                  </div>
                  <div className="vitals-input">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      placeholder="70"
                    />
                  </div>
                </div>
                <div className="vitals-row">
                  <div className="vitals-input">
                    <label>BMI</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.bmi}
                      onChange={(e) => handleChange('bmi', e.target.value)}
                      placeholder="Auto-calculated"
                      readOnly
                    />
                  </div>
                  <div className="vitals-input">
                    <label>SpO₂ (%)</label>
                    <input
                      type="number"
                      value={formData.spo2}
                      onChange={(e) => handleChange('spo2', e.target.value)}
                      placeholder="98"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Pharmacy Section */}
            <SectionCard
              icon={<MdLocalPharmacy />}
              title="Pharmacy"
              description="Prescribe and manage medications with auto-calculation."
              initiallyExpanded={false}
            >
              <PharmacyTable
                rows={pharmacyRows}
                onChange={setPharmacyRows}
              />
            </SectionCard>

            {/* Pathology Section */}
            <SectionCard
              icon={<MdBiotech />}
              title="Pathology"
              description="Order and track lab investigations."
              initiallyExpanded={false}
            >
              <PathologyTable
                rows={pathologyRows}
                onChange={setPathologyRows}
              />
            </SectionCard>

            {/* Follow-Up Planning Section */}
            <SectionCard
              icon={<MdEventNote />}
              title="Follow-Up Planning"
              description="Schedule follow-up appointments and reminders."
              initiallyExpanded={false}
            >
              <div className="follow-up-content">
                <p>Follow-up planning options will be added here</p>
              </div>
            </SectionCard>

            <div className="intake-spacer"></div>
          </form>

          {/* Save Bar */}
          <div className="intake-save-bar">
            <button
              type="submit"
              disabled={isSaving}
              className="intake-save-btn"
              onClick={handleSubmit}
            >
              {isSaving ? (
                <div className="btn-spinner"></div>
              ) : (
                'Save Intake Form'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Collapsible Section Card
const SectionCard = ({ icon, title, description, initiallyExpanded = true, children }) => {
  const [isOpen, setIsOpen] = useState(initiallyExpanded);

  return (
    <div className="section-card">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="section-header-left">
          <div className="section-icon">{icon}</div>
          <div className="section-titles">
            <div className="section-title">{title}</div>
            <div className="section-description">{description}</div>
          </div>
        </div>
        <div className="section-toggle">
          {isOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
        </div>
      </div>
      {isOpen && (
        <div className="section-body">
          {children}
        </div>
      )}
    </div>
  );
};

// Pharmacy Table
const PharmacyTable = ({ rows, onChange }) => {
  const addRow = () => {
    onChange([...rows, {
      medicine: '',
      dosage: '',
      frequency: '',
      notes: '',
      quantity: '',
      price: '',
    }]);
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    onChange(newRows);
  };

  const deleteRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="editable-table">
      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Notes</th>
              <th>Qty</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td><input value={row.medicine} onChange={(e) => updateRow(index, 'medicine', e.target.value)} /></td>
                <td><input value={row.dosage} onChange={(e) => updateRow(index, 'dosage', e.target.value)} /></td>
                <td><input value={row.frequency} onChange={(e) => updateRow(index, 'frequency', e.target.value)} /></td>
                <td><input value={row.notes} onChange={(e) => updateRow(index, 'notes', e.target.value)} /></td>
                <td><input type="number" value={row.quantity} onChange={(e) => updateRow(index, 'quantity', e.target.value)} /></td>
                <td><input type="number" value={row.price} onChange={(e) => updateRow(index, 'price', e.target.value)} /></td>
                <td><button type="button" className="delete-row-btn" onClick={() => deleteRow(index)}><MdDelete /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button type="button" className="add-row-btn" onClick={addRow}>
        <MdAdd /> Add Medicine
      </button>
    </div>
  );
};

// Pathology Table
const PathologyTable = ({ rows, onChange }) => {
  const addRow = () => {
    onChange([...rows, {
      testName: '',
      category: '',
      priority: '',
      notes: '',
    }]);
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    onChange(newRows);
  };

  const deleteRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="editable-table">
      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td><input value={row.testName} onChange={(e) => updateRow(index, 'testName', e.target.value)} /></td>
                <td><input value={row.category} onChange={(e) => updateRow(index, 'category', e.target.value)} /></td>
                <td><input value={row.priority} onChange={(e) => updateRow(index, 'priority', e.target.value)} /></td>
                <td><input value={row.notes} onChange={(e) => updateRow(index, 'notes', e.target.value)} /></td>
                <td><button type="button" className="delete-row-btn" onClick={() => deleteRow(index)}><MdDelete /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button type="button" className="add-row-btn" onClick={addRow}>
        <MdAdd /> Add Test
      </button>
    </div>
  );
};

export default IntakeFormDialog;

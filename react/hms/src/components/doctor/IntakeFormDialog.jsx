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
import { authService } from '../../services';
import { PharmacyEndpoints, PathologyEndpoints } from '../../services/apiConstants';
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
  // Standard list of medicines and tests
  const [allMedicines, setAllMedicines] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch medicines and tests on mount
  useEffect(() => {
    if (isOpen) {
      loadLookupData();
    }
  }, [isOpen]);

  const loadLookupData = async () => {
    try {
      const [medsRes, testsRes] = await Promise.all([
        authService.makeAuthRequest(PharmacyEndpoints.getMedicines, { method: 'GET' }),
        authService.makeAuthRequest(PathologyEndpoints.getTests, { method: 'GET' })
      ]);

      const medicines = medsRes.medicines || medsRes.data || medsRes || [];
      const tests = testsRes.tests || testsRes.data || testsRes || [];

      setAllMedicines(Array.isArray(medicines) ? medicines : []);
      setAllTests(Array.isArray(tests) ? tests : []);
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

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
              initiallyExpanded={true}
            >
              <div className="vitals-editor">
                <h4 className="editor-title">Clinical Notes & Vitals</h4>

                <textarea
                  className="notes-textarea"
                  placeholder="Enter clinical notes, complaints, diagnosis..."
                  value={formData.currentNotes}
                  onChange={(e) => handleChange('currentNotes', e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    marginBottom: '16px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />

                <div className="vitals-row">
                  <div className="vitals-input">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => handleChange('height', e.target.value)}
                      placeholder="e.g. 170"
                    />
                  </div>
                  <div className="vitals-input">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      placeholder="e.g. 70"
                    />
                  </div>
                </div>
                <div className="vitals-row">
                  <div className="vitals-input">
                    <label>BMI</label>
                    <input
                      type="number"
                      value={formData.bmi}
                      readOnly
                      placeholder="Auto-calc"
                      style={{ backgroundColor: '#F3F4F6' }}
                    />
                  </div>
                  <div className="vitals-input">
                    <label>SpO₂ (%)</label>
                    <input
                      type="number"
                      value={formData.spo2}
                      onChange={(e) => handleChange('spo2', e.target.value)}
                      placeholder="e.g. 98"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Pharmacy Section */}
            <SectionCard
              icon={<MdLocalPharmacy />}
              title="Pharmacy"
              description="Prescribe and manage medications."
              initiallyExpanded={true}
            >
              <PharmacyTable
                rows={pharmacyRows}
                onChange={setPharmacyRows}
                medicines={allMedicines}
              />
            </SectionCard>

            {/* Pathology Section */}
            <SectionCard
              icon={<MdBiotech />}
              title="Pathology"
              description="Order and track lab investigations."
              initiallyExpanded={true}
            >
              <PathologyTable
                rows={pathologyRows}
                onChange={setPathologyRows}
                tests={allTests}
              />
            </SectionCard>

            {/* Follow-Up Section */}
            <SectionCard
              icon={<MdEventNote />}
              title="Follow-Up & Plan"
              description="Schedule next visit and treatment plan."
              initiallyExpanded={false}
            >
              <div className="follow-up-content">
                <textarea
                  placeholder="Treatment plan instructions..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                  }}
                />
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
const PharmacyTable = ({ rows, onChange, medicines = [] }) => {
  const commonFrequencies = [
    { label: '1-0-1 (BD)', value: '1-0-1', factor: 2 },
    { label: '1-0-0 (OD)', value: '1-0-0', factor: 1 },
    { label: '0-0-1 (HS)', value: '0-0-1', factor: 1 },
    { label: '1-1-1 (TDS)', value: '1-1-1', factor: 3 },
    { label: '1-1-1-1 (QID)', value: '1-1-1-1', factor: 4 },
  ];

  const addRow = () => {
    onChange([...rows, {
      medicine: '',
      medicineId: '',
      sku: '',
      dosage: '',
      frequency: '1-0-1',
      duration: '5',
      notes: '',
      quantity: 10,
      price: 0,
    }]);
  };

  const calculateQty = (freq, days) => {
    const f = commonFrequencies.find(cf => cf.value === freq);
    const d = parseInt(days) || 0;
    if (f && f.factor > 0) return f.factor * d;
    return 0; // fallback if custom freq
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];

    if (field === 'medicineId') {
      const selectedMed = medicines.find(m => m._id === value);
      if (selectedMed) {
        newRows[index].medicine = selectedMed.name;
        newRows[index].medicineId = selectedMed._id;
        newRows[index].sku = selectedMed.sku || 'N/A';
        newRows[index].price = selectedMed.salePrice || selectedMed.price || 0;
        newRows[index].dosage = selectedMed.strength || ''; // Auto-fill dosage
      }
    } else {
      newRows[index][field] = value;
    }

    // Auto-calc quantity
    if (field === 'frequency' || field === 'duration' || field === 'medicineId') {
      const freq = newRows[index].frequency;
      const days = newRows[index].duration;
      const autoQty = calculateQty(freq, days);
      if (autoQty > 0) newRows[index].quantity = autoQty;
    }

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
              <th style={{ width: '30%' }}>Medicine</th>
              <th style={{ width: '15%' }}>Dosage</th>
              <th style={{ width: '10%' }}>Days</th>
              <th style={{ width: '20%' }}>Frequency</th>
              <th style={{ width: '10%' }}>Qty</th>
              <th style={{ width: '15%' }}>Notes</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={row.medicineId || ''}
                    onChange={(e) => updateRow(index, 'medicineId', e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">Select Medicine...</option>
                    {medicines.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name} {m.strength ? `(${m.strength})` : ''} - ₹{m.salePrice || m.price || 0}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.dosage}
                    onChange={(e) => updateRow(index, 'dosage', e.target.value)}
                    placeholder="e.g. 500mg"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={row.duration}
                    onChange={(e) => updateRow(index, 'duration', e.target.value)}
                    placeholder="Days"
                  />
                </td>
                <td>
                  <select
                    value={row.frequency}
                    onChange={(e) => updateRow(index, 'frequency', e.target.value)}
                  >
                    {commonFrequencies.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                    <option value="SOS">SOS</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => updateRow(index, 'notes', e.target.value)}
                    placeholder="Instructions..."
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button type="button" className="delete-row-btn" onClick={() => deleteRow(index)}>
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button type="button" className="add-row-btn" onClick={addRow}>
        <MdAdd /> Add Medication
      </button>
    </div>
  );
};

// Pathology Table
const PathologyTable = ({ rows, onChange, tests }) => {
  const addRow = () => {
    onChange([...rows, {
      testName: '',
      testId: '',
      category: '',
      priority: 'Normal',
      notes: '',
    }]);
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    if (field === 'testId') {
      const selectedTest = tests.find(t => t._id === value);
      if (selectedTest) {
        newRows[index].testName = selectedTest.name;
        newRows[index].testId = selectedTest._id;
        newRows[index].category = selectedTest.category || 'General';
      }
    } else {
      newRows[index][field] = value;
    }
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
              <th style={{ width: '40%' }}>Test Name</th>
              <th style={{ width: '20%' }}>Priority</th>
              <th style={{ width: '30%' }}>Notes</th>
              <th style={{ width: '10%' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={row.testId}
                    onChange={(e) => updateRow(index, 'testId', e.target.value)}
                  >
                    <option value="">Select Test...</option>
                    {tests.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={row.priority} onChange={(e) => updateRow(index, 'priority', e.target.value)}>
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </td>
                <td><input value={row.notes} onChange={(e) => updateRow(index, 'notes', e.target.value)} placeholder="Instructions..." /></td>
                <td><button type="button" className="delete-row-btn" onClick={() => deleteRow(index)}><MdDelete /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button type="button" className="add-row-btn" onClick={addRow}>
        <MdAdd /> Add Lab Test
      </button>
    </div>
  );
};

export default IntakeFormDialog;

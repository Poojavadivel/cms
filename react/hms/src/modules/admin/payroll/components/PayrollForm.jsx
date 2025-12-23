/**
 * PayrollForm.jsx
 * Add/Edit payroll form in a modal
 * Simplified version matching Flutter's core functionality
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdSave } from 'react-icons/md';
import { authService } from '../../../../services/authService';
import './PayrollForm.css';

const PayrollForm = ({ payroll, isOpen, onClose }) => {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [formData, setFormData] = useState({
    basicSalary: '',
    allowances: '',
    deductions: '',
    payPeriod: '',
    paymentDate: '',
    status: 'Pending',
    notes: ''
  });
  const [netSalary, setNetSalary] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      if (payroll) {
        populateForm();
      } else {
        resetForm();
      }
    }
  }, [isOpen, payroll]);

  useEffect(() => {
    calculateNetSalary();
  }, [formData.basicSalary, formData.allowances, formData.deductions]);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const response = await authService.get('/staff');
      const staffData = response.data || response;
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      console.error('Failed to load staff:', err);
      setError('Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  const populateForm = () => {
    if (!payroll) return;
    setSelectedStaff(payroll.staffId || payroll._id || '');
    setFormData({
      basicSalary: payroll.basicSalary?.toString() || '',
      allowances: payroll.allowances?.toString() || '',
      deductions: payroll.deductions?.toString() || '',
      payPeriod: payroll.payPeriod || getCurrentPayPeriod(),
      paymentDate: payroll.paymentDate || '',
      status: payroll.status || 'Pending',
      notes: payroll.notes || ''
    });
  };

  const resetForm = () => {
    setSelectedStaff('');
    setFormData({
      basicSalary: '',
      allowances: '',
      deductions: '',
      payPeriod: getCurrentPayPeriod(),
      paymentDate: '',
      status: 'Pending',
      notes: ''
    });
    setNetSalary(0);
  };

  const getCurrentPayPeriod = () => {
    const now = new Date();
    return `${now.getMonth() + 1}/${now.getFullYear()}`;
  };

  const calculateNetSalary = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    setNetSalary(basic + allowances - deductions);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStaffSelect = (staffId) => {
    setSelectedStaff(staffId);
    const selected = staff.find(s => (s._id || s.id) === staffId);
    if (selected && !formData.basicSalary) {
      // Auto-fill basic salary if available
      setFormData(prev => ({
        ...prev,
        basicSalary: selected.salary?.toString() || prev.basicSalary
      }));
    }
  };

  const validateForm = () => {
    if (!selectedStaff) {
      setError('Please select a staff member');
      return false;
    }
    if (!formData.basicSalary || parseFloat(formData.basicSalary) <= 0) {
      setError('Please enter a valid basic salary');
      return false;
    }
    if (!formData.payPeriod) {
      setError('Please enter pay period');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const selected = staff.find(s => (s._id || s.id) === selectedStaff);
      const payload = {
        staffId: selectedStaff,
        staffName: selected?.name || '',
        staffCode: selected?.staffCode || selected?.id || '',
        department: selected?.department || '',
        designation: selected?.designation || '',
        basicSalary: parseFloat(formData.basicSalary),
        allowances: parseFloat(formData.allowances) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        netSalary: netSalary,
        payPeriod: formData.payPeriod,
        paymentDate: formData.paymentDate || null,
        status: formData.status,
        notes: formData.notes
      };

      if (payroll && payroll.id) {
        // Update existing
        await authService.put(`/payrolls/${payroll.id}`, payload);
        alert('Payroll updated successfully');
      } else {
        // Create new
        await authService.post('/payrolls', payload);
        alert('Payroll created successfully');
      }

      if (onClose) onClose(true); // Refresh parent
    } catch (err) {
      console.error('Failed to save payroll:', err);
      setError(err.response?.data?.message || 'Failed to save payroll');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="payroll-form-overlay" onClick={() => onClose && onClose()}>
      <div className="payroll-form-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payroll-form-header">
          <h2>{payroll ? 'Edit Payroll' : 'Add New Payroll'}</h2>
          <button 
            className="btn-close-icon" 
            onClick={() => onClose && onClose()}
            disabled={isSaving}
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <form className="payroll-form-content" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Staff Selection */}
          <div className="form-section">
            <h3>Staff Information</h3>
            <div className="form-group">
              <label>Select Staff *</label>
              <select
                value={selectedStaff}
                onChange={(e) => handleStaffSelect(e.target.value)}
                disabled={isLoading || (payroll && payroll.id)}
                required
              >
                <option value="">-- Select Staff --</option>
                {staff.map(s => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name} ({s.staffCode || s.id}) - {s.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Pay Period *</label>
                <input
                  type="text"
                  value={formData.payPeriod}
                  onChange={(e) => handleInputChange('payPeriod', e.target.value)}
                  placeholder="MM/YYYY"
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Date</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div className="form-section">
            <h3>Salary Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Basic Salary *</label>
                <input
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Allowances</label>
                <input
                  type="number"
                  value={formData.allowances}
                  onChange={(e) => handleInputChange('allowances', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Deductions</label>
                <input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) => handleInputChange('deductions', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Processed">Processed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Net Salary Display */}
            <div className="net-salary-display">
              <span>Net Salary:</span>
              <span className="amount">{formatCurrency(netSalary)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="form-section">
            <h3>Additional Notes</h3>
            <div className="form-group">
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes..."
                rows={4}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="payroll-form-footer">
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => onClose && onClose()}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={isSaving || isLoading}
          >
            <MdSave size={18} />
            {isSaving ? 'Saving...' : payroll ? 'Update Payroll' : 'Create Payroll'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollForm;

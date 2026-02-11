/**
 * NextMonthPayrollModal.jsx
 * Streamlined modal for copying payroll to next month
 * Shows only staff info (read-only) and editable salary details
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import './PayrollModal.css';

const NextMonthPayrollModal = ({ isOpen, onClose, onSubmit, previousPayroll }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    department: '',
    designation: '',
    payPeriodMonth: new Date().getMonth() + 1,
    payPeriodYear: new Date().getFullYear(),
    paymentDate: new Date().toISOString().split('T')[0],
    basicSalary: '',
    bonus: '0',
    incentives: '0',
    overtimePay: '0',
    arrears: '0',
    employeePF: '0',
    employeeESI: '0',
    professionalTax: '0',
    tdsDeducted: '0',
    paymentMode: 'bank_transfer',
    bankName: '',
    accountNumber: '',
    status: 'approved',
    notes: ''
  });

  const [calculations, setCalculations] = useState({
    totalEarnings: 0,
    totalDeductions: 0,
    netSalary: 0
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load last month's salary data
  const loadLastMonthSalary = async () => {
    if (!formData.staffId) {
      alert('No staff selected');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/payroll/staff/${formData.staffId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch payroll history');
      
      const payrolls = await response.json();
      
      if (!payrolls || payrolls.length === 0) {
        alert('No previous payroll records found');
        return;
      }

      // Get the most recent payroll
      const lastPayroll = payrolls.sort((a, b) => {
        if (b.payPeriodYear !== a.payPeriodYear) {
          return b.payPeriodYear - a.payPeriodYear;
        }
        return b.payPeriodMonth - a.payPeriodMonth;
      })[0];

      // Fill form with last month's data
      setFormData(prev => ({
        ...prev,
        basicSalary: lastPayroll.basicSalary?.toString() || prev.basicSalary,
        bonus: lastPayroll.bonus?.toString() || '0',
        incentives: lastPayroll.incentives?.toString() || '0',
        overtimePay: lastPayroll.overtimePay?.toString() || '0',
        arrears: '0',
        employeePF: lastPayroll.statutory?.employeePF?.toString() || '0',
        employeeESI: lastPayroll.statutory?.employeeESI?.toString() || '0',
        professionalTax: lastPayroll.statutory?.professionalTax?.toString() || '0',
        tdsDeducted: lastPayroll.statutory?.tdsDeducted?.toString() || '0',
        paymentMode: lastPayroll.paymentMode || prev.paymentMode,
        bankName: lastPayroll.bankName || prev.bankName,
        accountNumber: lastPayroll.accountNumber || prev.accountNumber
      }));

      alert(`Loaded salary from ${months[(lastPayroll.payPeriodMonth || 1) - 1]} ${lastPayroll.payPeriodYear}`);
    } catch (error) {
      console.error('Error loading salary:', error);
      alert('Failed to load previous salary: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize with previous payroll data
  useEffect(() => {
    if (previousPayroll && isOpen) {
      const nextMonth = previousPayroll.payPeriodMonth === 12 ? 1 : previousPayroll.payPeriodMonth + 1;
      const nextYear = previousPayroll.payPeriodMonth === 12 ? previousPayroll.payPeriodYear + 1 : previousPayroll.payPeriodYear;
      
      setFormData({
        staffId: previousPayroll.staffId || '',
        staffName: previousPayroll.staffName || '',
        department: previousPayroll.department || '',
        designation: previousPayroll.designation || '',
        payPeriodMonth: nextMonth,
        payPeriodYear: nextYear,
        paymentDate: new Date().toISOString().split('T')[0],
        basicSalary: previousPayroll.basicSalary?.toString() || '',
        bonus: previousPayroll.bonus?.toString() || '0',
        incentives: previousPayroll.incentives?.toString() || '0',
        overtimePay: previousPayroll.overtimePay?.toString() || '0',
        arrears: '0', // Reset arrears
        employeePF: previousPayroll.statutory?.employeePF?.toString() || '0',
        employeeESI: previousPayroll.statutory?.employeeESI?.toString() || '0',
        professionalTax: previousPayroll.statutory?.professionalTax?.toString() || '0',
        tdsDeducted: previousPayroll.statutory?.tdsDeducted?.toString() || '0',
        paymentMode: previousPayroll.paymentMode || 'bank_transfer',
        bankName: previousPayroll.bankName || '',
        accountNumber: previousPayroll.accountNumber || '',
        status: 'approved',
        notes: `Copied from ${months[(previousPayroll.payPeriodMonth || 1) - 1]} ${previousPayroll.payPeriodYear}`
      });
    }
  }, [previousPayroll, isOpen]);

  // Calculate totals
  useEffect(() => {
    const parse = (val) => parseFloat(val) || 0;
    
    const earnings = parse(formData.basicSalary) + parse(formData.bonus) + 
                    parse(formData.incentives) + parse(formData.overtimePay) + 
                    parse(formData.arrears);
    
    const deductions = parse(formData.employeePF) + parse(formData.employeeESI) + 
                      parse(formData.professionalTax) + parse(formData.tdsDeducted);
    
    const net = earnings - deductions;
    
    setCalculations({
      totalEarnings: earnings,
      totalDeductions: deductions,
      netSalary: net
    });
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.basicSalary || parseFloat(formData.basicSalary) <= 0) {
      newErrors.basicSalary = 'Basic salary is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        staffId: formData.staffId,
        payPeriodMonth: parseInt(formData.payPeriodMonth),
        payPeriodYear: parseInt(formData.payPeriodYear),
        paymentDate: formData.paymentDate,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        bonus: parseFloat(formData.bonus) || 0,
        incentives: parseFloat(formData.incentives) || 0,
        overtimePay: parseFloat(formData.overtimePay) || 0,
        arrears: parseFloat(formData.arrears) || 0,
        statutory: {
          employeePF: parseFloat(formData.employeePF) || 0,
          employeeESI: parseFloat(formData.employeeESI) || 0,
          professionalTax: parseFloat(formData.professionalTax) || 0,
          tdsDeducted: parseFloat(formData.tdsDeducted) || 0
        },
        paymentMode: formData.paymentMode,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        status: formData.status,
        notes: formData.notes,
        totalEarnings: calculations.totalEarnings,
        totalDeductions: calculations.totalDeductions,
        netSalary: calculations.netSalary
      };
      
      await onSubmit(payload);
      handleClose();
    } catch (error) {
      console.error('Next month payroll error:', error);
      alert('Failed to create next month payroll: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      staffId: '',
      staffName: '',
      department: '',
      designation: '',
      payPeriodMonth: new Date().getMonth() + 1,
      payPeriodYear: new Date().getFullYear(),
      paymentDate: new Date().toISOString().split('T')[0],
      basicSalary: '',
      bonus: '0',
      incentives: '0',
      overtimePay: '0',
      arrears: '0',
      employeePF: '0',
      employeeESI: '0',
      professionalTax: '0',
      tdsDeducted: '0',
      paymentMode: 'bank_transfer',
      bankName: '',
      accountNumber: '',
      status: 'pending',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Sidebar */}
        <div className="modal-sidebar">
          <div className="modal-sidebar-header">
            <h2>Next Month Payroll</h2>
            <p>Quick Copy</p>
          </div>
          
          <div className="modal-steps">
            <div className="modal-step active">
              <div className="step-icon">
                <FiCheck size={20} />
              </div>
              <div className="step-content">
                <span className="step-number">Staff</span>
                <span className="step-title">{formData.staffName}</span>
              </div>
            </div>

            <div className="modal-step active">
              <div className="step-icon">
                <FiCheck size={20} />
              </div>
              <div className="step-content">
                <span className="step-number">Previous</span>
                <span className="step-title">
                  {previousPayroll ? `${months[(previousPayroll.payPeriodMonth || 1) - 1]} ${previousPayroll.payPeriodYear}` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="modal-step active">
              <div className="step-icon">
                <FiCheck size={20} />
              </div>
              <div className="step-content">
                <span className="step-number">New Period</span>
                <span className="step-title">
                  {months[formData.payPeriodMonth - 1]} {formData.payPeriodYear}
                </span>
              </div>
            </div>
          </div>
          
          <button className="modal-cancel-btn" onClick={handleClose}>
            <FiX size={16} />
            Cancel
          </button>
        </div>

        {/* Main Content */}
        <div className="modal-main">
          <button className="modal-close-btn" onClick={handleClose}>
            <FiX size={24} />
          </button>

          <div className="modal-body">
            <div className="step-content-wrapper">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Copy to Next Month</h2>
                  <p className="step-description" style={{ margin: '4px 0 0 0' }}>Review and adjust salary details for {formData.staffName}</p>
                </div>
                <button
                  type="button"
                  onClick={loadLastMonthSalary}
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: '#207DC0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  <span>📋</span>
                  {isSubmitting ? 'Loading...' : 'Reload Last Month'}
                </button>
              </div>
              
              {/* Staff Information - READ ONLY */}
              <div className="selected-staff-info">
                <h3>Staff Information (Read-Only)</h3>
                <div className="info-grid">
                  <div><strong>Name:</strong> {formData.staffName}</div>
                  <div><strong>Department:</strong> {formData.department}</div>
                  <div><strong>Designation:</strong> {formData.designation}</div>
                  <div><strong>New Period:</strong> {months[formData.payPeriodMonth - 1]} {formData.payPeriodYear}</div>
                </div>
              </div>

              {/* Salary Details */}
              <div className="salary-section">
                <h3>Earnings</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Basic Salary *</label>
                    <input 
                      type="number" 
                      name="basicSalary" 
                      value={formData.basicSalary} 
                      onChange={handleChange}
                      placeholder="0.00"
                      className={errors.basicSalary ? 'error' : ''}
                    />
                    {errors.basicSalary && <span className="error-text">{errors.basicSalary}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Bonus</label>
                    <input type="number" name="bonus" value={formData.bonus} onChange={handleChange} placeholder="0.00" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Incentives</label>
                    <input type="number" name="incentives" value={formData.incentives} onChange={handleChange} placeholder="0.00" />
                  </div>
                  
                  <div className="form-group">
                    <label>Overtime Pay</label>
                    <input type="number" name="overtimePay" value={formData.overtimePay} onChange={handleChange} placeholder="0.00" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Arrears</label>
                    <input type="number" name="arrears" value={formData.arrears} onChange={handleChange} placeholder="0.00" />
                  </div>
                  <div className="form-group"></div>
                </div>
              </div>

              <div className="salary-section">
                <h3>Deductions</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>PF (Employee)</label>
                    <input type="number" name="employeePF" value={formData.employeePF} onChange={handleChange} placeholder="0.00" />
                  </div>
                  
                  <div className="form-group">
                    <label>ESI</label>
                    <input type="number" name="employeeESI" value={formData.employeeESI} onChange={handleChange} placeholder="0.00" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Professional Tax</label>
                    <input type="number" name="professionalTax" value={formData.professionalTax} onChange={handleChange} placeholder="0.00" />
                  </div>
                  
                  <div className="form-group">
                    <label>TDS</label>
                    <input type="number" name="tdsDeducted" value={formData.tdsDeducted} onChange={handleChange} placeholder="0.00" />
                  </div>
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="calculation-summary">
                <div className="summary-row">
                  <span>Total Earnings:</span>
                  <strong>₹{calculations.totalEarnings.toFixed(2)}</strong>
                </div>
                <div className="summary-row deduction">
                  <span>Total Deductions:</span>
                  <strong>₹{calculations.totalDeductions.toFixed(2)}</strong>
                </div>
                <div className="summary-row net">
                  <span>Net Salary:</span>
                  <strong>₹{calculations.netSalary.toFixed(2)}</strong>
                </div>
              </div>

              {/* Status and Notes */}
              <div className="form-row" style={{ marginTop: '24px' }}>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="processed">Processed</option>
                    <option value="paid">Paid</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Date</label>
                  <input 
                    type="date" 
                    name="paymentDate" 
                    value={formData.paymentDate} 
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange}
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button 
              type="button" 
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button 
              type="button" 
              onClick={handleSubmit}
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Next Month Payroll'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextMonthPayrollModal;

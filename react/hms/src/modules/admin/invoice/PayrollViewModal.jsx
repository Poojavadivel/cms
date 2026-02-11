/**
 * PayrollViewModal.jsx
 * View payroll details in same modal size
 */

import React from 'react';
import { FiX, FiCalendar, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import './PayrollModal.css';

const PayrollViewModal = ({ isOpen, onClose, payroll }) => {
  if (!isOpen || !payroll) return null;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusColor = (status) => {
    const colors = {
      paid: '#207DC0',
      approved: '#207DC0',
      processed: '#f59e0b',
      pending: '#ef4444',
      draft: '#6b7280'
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Sidebar */}
        <div className="modal-sidebar">
          <div className="modal-sidebar-header">
            <h2>Payroll Details</h2>
            <p>View Only</p>
          </div>
          
          <div className="modal-steps">
            <div className="modal-step active">
              <div className="step-icon">
                <FiCalendar size={20} />
              </div>
              <div className="step-content">
                <span className="step-number">Period</span>
                <span className="step-title">
                  {months[(payroll.payPeriodMonth || 1) - 1]} {payroll.payPeriodYear}
                </span>
              </div>
            </div>

            <div className="modal-step active">
              <div className="step-icon">
                <FiDollarSign size={20} />
              </div>
              <div className="step-content">
                <span className="step-number">Net Salary</span>
                <span className="step-title">
                  ₹{(payroll.netSalary || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="modal-step active">
              <div className="step-icon">
                <FiCheckCircle size={20} />
              </div>
              <div className="step-content">
                <span className="step-number">Status</span>
                <span 
                  className="step-title" 
                  style={{ color: getStatusColor(payroll.status) }}
                >
                  {payroll.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
          
          <button className="modal-cancel-btn" onClick={onClose}>
            <FiX size={16} />
            Close
          </button>
        </div>

        {/* Main Content */}
        <div className="modal-main">
          <button className="modal-close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>

          <div className="modal-body">
            <div className="step-content-wrapper">
              <h2>Payroll Summary</h2>
              <p className="step-description">Complete payroll information for {payroll.staffName}</p>
              
              {/* Staff Information */}
              <div className="review-section">
                <h3>Staff Information</h3>
                <div className="review-grid">
                  <div><strong>Name:</strong> {payroll.staffName}</div>
                  <div><strong>Department:</strong> {payroll.department}</div>
                  <div><strong>Designation:</strong> {payroll.designation}</div>
                  <div><strong>Staff Code:</strong> {payroll.staffCode}</div>
                  <div><strong>Period:</strong> {months[(payroll.payPeriodMonth || 1) - 1]} {payroll.payPeriodYear}</div>
                  <div><strong>Payment Date:</strong> {payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="review-section">
                <h3>Salary Breakdown</h3>
                <div className="review-breakdown">
                  <div className="breakdown-section">
                    <h4>Earnings</h4>
                    <div className="breakdown-item">
                      <span>Basic Salary:</span>
                      <span>₹{(payroll.basicSalary || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Bonus:</span>
                      <span>₹{(payroll.bonus || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Incentives:</span>
                      <span>₹{(payroll.incentives || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Overtime Pay:</span>
                      <span>₹{(payroll.overtimePay || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Arrears:</span>
                      <span>₹{(payroll.arrears || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item total">
                      <span>Total Earnings:</span>
                      <strong>₹{(payroll.totalEarnings || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                  
                  <div className="breakdown-section">
                    <h4>Deductions</h4>
                    <div className="breakdown-item">
                      <span>PF (Employee):</span>
                      <span>₹{(payroll.statutory?.employeePF || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>ESI:</span>
                      <span>₹{(payroll.statutory?.employeeESI || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Professional Tax:</span>
                      <span>₹{(payroll.statutory?.professionalTax || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>TDS:</span>
                      <span>₹{(payroll.statutory?.tdsDeducted || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item total">
                      <span>Total Deductions:</span>
                      <strong>₹{(payroll.totalDeductions || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="net-salary-display">
                  <span>Net Salary</span>
                  <strong>₹{(payroll.netSalary || 0).toFixed(2)}</strong>
                </div>
              </div>

              {/* Payment Information */}
              <div className="review-section">
                <h3>Payment Information</h3>
                <div className="review-grid">
                  <div><strong>Payment Mode:</strong> {payroll.paymentMode || 'Bank Transfer'}</div>
                  <div><strong>Bank Name:</strong> {payroll.bankName || 'N/A'}</div>
                  <div><strong>Account Number:</strong> {payroll.accountNumber || 'N/A'}</div>
                  <div>
                    <strong>Status:</strong> 
                    <span 
                      style={{ 
                        marginLeft: '8px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(payroll.status) + '20',
                        color: getStatusColor(payroll.status)
                      }}
                    >
                      {payroll.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {payroll.notes && (
                <div className="review-section">
                  <h3>Notes</h3>
                  <p style={{ color: '#6b7280', lineHeight: '1.6' }}>{payroll.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-primary"
              style={{ maxWidth: '200px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollViewModal;

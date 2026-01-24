/**
 * PayrollView.jsx
 * View payroll details in a modal (not invoice page navigation)
 * Matches Flutter's PayrollDetailEnhanced.dart
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdCheckCircle, MdCancel, MdPrint } from 'react-icons/md';
import authService from '../../../../services/authService';
import payrollService from '../../../../services/payrollService';
import './PayrollView.css';

const PayrollView = ({ payroll, isOpen, onClose }) => {
  const [payrollData, setPayrollData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && payroll) {
      loadPayrollDetails();
    }
  }, [isOpen, payroll]);

  const loadPayrollDetails = async () => {
    if (!payroll?.id) {
      setPayrollData(payroll);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await authService.get(`/payroll/${payroll.id || payroll._id}`);
      setPayrollData(response.payroll || response.data || response);
    } catch (err) {
      console.error('Failed to load payroll details:', err);
      setError('Failed to load payroll details');
      setPayrollData(payroll);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this payroll?')) return;

    setIsSaving(true);
    try {
      await authService.patch(`/payroll/${payrollData._id || payrollData.id}/approve`, {
        approvalRemarks: 'Approved via Dashboard'
      });
      alert('Payroll approved successfully');
      const updated = { ...payrollData, status: 'Approved' };
      setPayrollData(updated);
      if (onClose) onClose(true); // Refresh parent
    } catch (err) {
      console.error('Failed to approve payroll:', err);
      alert('Failed to approve payroll');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    setIsSaving(true);
    try {
      await authService.patch(`/payroll/${payrollData._id || payrollData.id}/reject`, {
        reason: reason
      });
      alert('Payroll rejected');
      const updated = { ...payrollData, status: 'Rejected', rejectionReason: reason };
      setPayrollData(updated);
      if (onClose) onClose(true);
    } catch (err) {
      console.error('Failed to reject payroll:', err);
      alert('Failed to reject payroll');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };



  if (!isOpen) return null;

  const data = payrollData || payroll;
  if (!data) return null;

  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10b981';
      case 'processed': return '#3b82f6';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="payroll-view-overlay printable-payslip" onClick={() => onClose && onClose()}>
      <div className="payroll-view-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payroll-view-header">
          <div>
            <h2>Payroll Details</h2>
            <p className="payroll-code">{data.payrollCode || data.id}</p>
          </div>
          <div className="header-actions">
            <button
              className="btn-icon"
              onClick={handlePrint}
              title="Print"
            >
              <MdPrint size={20} />
            </button>
            <button
              className="btn-close-icon"
              onClick={() => onClose && onClose()}
              disabled={isSaving}
            >
              <MdClose size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="payroll-view-content">
          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              {/* Status Badge */}
              <div className="status-section">
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(data.status) }}
                >
                  {data.status || 'Pending'}
                </span>
              </div>

              {/* Staff Information */}
              <div className="info-section">
                <h3>Staff Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Staff Name</label>
                    <p>{data.staffName || '—'}</p>
                  </div>
                  <div className="info-item">
                    <label>Staff Code</label>
                    <p>{data.staffCode || '—'}</p>
                  </div>
                  <div className="info-item">
                    <label>Department</label>
                    <p>{data.department || '—'}</p>
                  </div>
                  <div className="info-item">
                    <label>Designation</label>
                    <p>{data.designation || 'Staff'}</p>
                  </div>
                  <div className="info-item">
                    <label>Pay Period</label>
                    <p>{data.payPeriodDisplay || (data.payPeriodMonth ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][data.payPeriodMonth - 1]} ${data.payPeriodYear}` : '—')}</p>
                  </div>
                  <div className="info-item">
                    <label>Payment Date</label>
                    <p>{formatDate(data.paymentDate || data.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="info-section">
                <h3>Salary Breakdown</h3>
                <div className="salary-table">
                  <div className="salary-row">
                    <span>Basic Salary</span>
                    <span className="amount">{formatCurrency(data.basicSalary)}</span>
                  </div>
                  <div className="salary-row">
                    <span>Allowances & Others</span>
                    <span className="amount positive">{formatCurrency((data.totalEarnings || data.grossSalary || 0) - (data.basicSalary || 0))}</span>
                  </div>
                  <div className="salary-row">
                    <span>Total Deductions</span>
                    <span className="amount negative">-{formatCurrency(data.totalDeductions || data.deductions)}</span>
                  </div>
                  <div className="salary-row total">
                    <span>Net Salary</span>
                    <span className="amount">{formatCurrency(data.netSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              {(Array.isArray(data.earnings) ||
                Array.isArray(data.deductions) ||
                (data.statutory && Object.keys(data.statutory).length > 0) ||
                data.bonus > 0 || data.incentives > 0 || data.overtimePay > 0 || data.arrears > 0 ||
                data.totalLoanDeduction > 0 || data.lossOfPayAmount > 0
              ) && (
                  <div className="info-section">
                    <h3>Detailed Breakdown</h3>

                    {/* Earnings Breakdown */}
                    <div className="breakdown-section">
                      <h4>Earnings</h4>
                      <ul>
                        <li><span>Basic Salary</span> <span>{formatCurrency(data.basicSalary)}</span></li>
                        {Array.isArray(data.earnings) && data.earnings.map((item, idx) => (
                          <li key={`earning-${idx}`}><span>{item.name}</span> <span>{formatCurrency(item.amount)}</span></li>
                        ))}
                        {data.bonus > 0 && <li><span>Bonus</span> <span>{formatCurrency(data.bonus)}</span></li>}
                        {data.incentives > 0 && <li><span>Incentives</span> <span>{formatCurrency(data.incentives)}</span></li>}
                        {data.overtimePay > 0 && <li><span>Overtime Pay</span> <span>{formatCurrency(data.overtimePay)}</span></li>}
                        {data.arrears > 0 && <li><span>Arrears</span> <span>{formatCurrency(data.arrears)}</span></li>}
                      </ul>
                    </div>

                    {/* Deductions Breakdown */}
                    <div className="breakdown-section">
                      <h4>Deductions</h4>
                      <ul>
                        {data.statutory?.employeePF > 0 && (
                          <li><span>Provident Fund (PF)</span> <span>{formatCurrency(data.statutory.employeePF)}</span></li>
                        )}
                        {data.statutory?.employeeESI > 0 && (
                          <li><span>Employee ESI</span> <span>{formatCurrency(data.statutory.employeeESI)}</span></li>
                        )}
                        {data.statutory?.professionalTax > 0 && (
                          <li><span>Professional Tax</span> <span>{formatCurrency(data.statutory.professionalTax)}</span></li>
                        )}
                        {data.statutory?.tdsDeducted > 0 && (
                          <li><span>Income Tax (TDS)</span> <span>{formatCurrency(data.statutory.tdsDeducted)}</span></li>
                        )}
                        {Array.isArray(data.deductions) && data.deductions.map((item, idx) => (
                          <li key={`deduction-${idx}`}><span>{item.name}</span> <span>{formatCurrency(item.amount)}</span></li>
                        ))}
                        {data.totalLoanDeduction > 0 && <li><span>Loan Recovery</span> <span>{formatCurrency(data.totalLoanDeduction)}</span></li>}
                        {data.lossOfPayAmount > 0 && <li><span>Loss of Pay</span> <span>{formatCurrency(data.lossOfPayAmount)}</span></li>}
                      </ul>
                    </div>
                  </div>
                )}

              {/* Notes */}
              {data.notes && (
                <div className="info-section">
                  <h3>Notes</h3>
                  <p className="notes-text">{data.notes}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {data.status === 'Rejected' && data.rejectionReason && (
                <div className="info-section rejection-section">
                  <h3>Rejection Reason</h3>
                  <p className="rejection-text">{data.rejectionReason}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="payroll-view-footer">
          {data.status === 'Pending' && (
            <>
              <button
                className="btn-reject"
                onClick={handleReject}
                disabled={isSaving || isLoading}
              >
                <MdCancel size={18} />
                Reject
              </button>
              <button
                className="btn-approve"
                onClick={handleApprove}
                disabled={isSaving || isLoading}
              >
                <MdCheckCircle size={18} />
                Approve
              </button>
            </>
          )}
          <button
            className="btn-secondary"
            onClick={() => onClose && onClose()}
            disabled={isSaving}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollView;

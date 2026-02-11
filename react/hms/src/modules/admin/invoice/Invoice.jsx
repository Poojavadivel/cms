/**
 * Invoice.jsx
 * Invoice page with REAL API integration
 * React equivalent of Flutter's InvoiceScreen with live backend data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch, MdMoreVert, MdArrowForward } from 'react-icons/md';
import invoiceService from '../../../services/invoiceService';
import staffService from '../../../services/staffService';
import InvoiceDetail from './InvoiceDetail';
import InvoiceForm from './InvoiceForm';
import PayrollModal from './PayrollModal';
import PayrollViewModal from './PayrollViewModal';
import NextMonthPayrollModal from './NextMonthPayrollModal';
import './Invoice.css';

// Custom SVG Icons (matching Appointments)
const Icons = {
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  )
};

const Invoice = () => {
  // State management
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All'); // 'Current', 'Last', 'All'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showPayrollView, setShowPayrollView] = useState(false);
  const [showNextMonthModal, setShowNextMonthModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [payrollMode, setPayrollMode] = useState('create'); // 'create', 'edit', 'copy'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [staffList, setStaffList] = useState([]);

  const itemsPerPage = 10;

  // Fetch invoices from API
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invoiceService.fetchInvoices({ limit: 100 });
      console.log('✅ Fetched invoices:', data);

      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error('❌ Failed to fetch invoices:', error);
      alert('Failed to load invoices: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load invoices on mount
  useEffect(() => {
    fetchInvoices();
    fetchStaffList();
  }, [fetchInvoices]);

  // Fetch staff list for payroll modal
  const fetchStaffList = async () => {
    try {
      const data = await staffService.fetchStaffs();
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff list:', error);
    }
  };

  // Filter invoices
  useEffect(() => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice =>
        (invoice.invoiceNumber?.toLowerCase() || '').includes(query) ||
        (invoice.staffName?.toLowerCase() || '').includes(query) ||
        (invoice.staffCode?.toLowerCase() || '').includes(query) ||
        (invoice.department?.toLowerCase() || '').includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Apply payment method filter
    if (paymentMethodFilter !== 'All') {
      filtered = filtered.filter(invoice => invoice.paymentMethod === paymentMethodFilter);
    }

    // Apply period filter
    if (periodFilter === 'Current') {
      const now = new Date();
      filtered = filtered.filter(invoice =>
        invoice.month === (now.getMonth() + 1) && invoice.year === now.getFullYear()
      );
    } else if (periodFilter === 'Last') {
      const now = new Date();
      let lastMonth = now.getMonth(); // Prev month index
      let lastYear = now.getFullYear();
      if (lastMonth === 0) { // Jan -> Dec
        lastMonth = 12;
        lastYear -= 1;
      }
      filtered = filtered.filter(invoice =>
        invoice.month === lastMonth && invoice.year === lastYear
      );
    }

    setFilteredInvoices(filtered);
    setCurrentPage(0);
  }, [invoices, searchQuery, statusFilter, paymentMethodFilter, periodFilter]);

  // Get unique values for filters
  const uniqueStatuses = ['All', ...new Set(invoices.map(inv => inv.status).filter(Boolean))];
  const uniquePaymentMethods = ['All', ...new Set(invoices.map(inv => inv.paymentMethod).filter(Boolean))];

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  // Format payment method
  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    const methodMap = {
      'cash': 'Cash',
      'card': 'Card',
      'credit card': 'Card',
      'debit card': 'Card',
      'upi': 'UPI',
      'online': 'Online',
      'bank transfer': 'Bank',
      'cheque': 'Cheque'
    };
    return methodMap[method.toLowerCase()] || method;
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
      const statusLower = (status || '').toLowerCase();
      if (statusLower === 'paid' || statusLower === 'completed') {
        return { bg: 'rgba(32, 125, 192, 0.1)', color: '#207DC0' };
      } else if (statusLower === 'pending') {
        return { bg: 'rgba(251, 146, 60, 0.1)', color: '#FB923C' };
      } else if (statusLower === 'cancelled') {
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
      } else if (statusLower === 'partial') {
        return { bg: 'rgba(32, 125, 192, 0.1)', color: '#207DC0' };
      }
      return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    };

    const style = getStatusStyle(status);
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {status || 'Unknown'}
      </span>
    );
  };

  // Handle actions
  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPayrollView(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedInvoice(null);
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setPayrollMode('edit');
    setShowPayrollModal(true);
  };

  const handleCopyToNextMonth = (invoice) => {
    setSelectedInvoice(invoice);
    setShowNextMonthModal(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      await invoiceService.updateInvoice(editingInvoice.id, formData);
      setShowForm(false);
      setEditingInvoice(null);
      await fetchInvoices();
      alert('Payroll record updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update payroll: ' + error.message);
    }
  };

  const handleDelete = async (invoice) => {
    if (window.confirm(`Are you sure you want to delete the payroll for ${invoice.staffName}?`)) {
      try {
        await invoiceService.deleteInvoice(invoice.id);
        await fetchInvoices();
        alert('Payroll record deleted successfully.');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete payroll: ' + error.message);
      }
    }
  };

  const handlePayrollSubmit = async (payrollData) => {
    try {
      if (payrollMode === 'edit') {
        await invoiceService.updateInvoice(editingInvoice.id, payrollData);
        alert('Payroll updated successfully!');
      } else {
        await invoiceService.createInvoice(payrollData);
        alert('Payroll processed successfully!');
      }
      setShowPayrollModal(false);
      setEditingInvoice(null);
      setPayrollMode('create');
      await fetchInvoices();
    } catch (error) {
      console.error('Payroll submission error:', error);
      throw error;
    }
  };

  const handleNextMonthSubmit = async (payrollData) => {
    try {
      await invoiceService.createInvoice(payrollData);
      setShowNextMonthModal(false);
      setSelectedInvoice(null);
      await fetchInvoices();
      alert('Next month payroll created successfully!');
    } catch (error) {
      console.error('Next month payroll error:', error);
      throw error;
    }
  };

  const handleConfirmAllPending = async () => {
    if (!window.confirm('Confirm all pending payrolls for this month? This will mark them as approved.')) {
      return;
    }

    try {
      const pendingPayrolls = filteredInvoices.filter(inv => inv.status === 'pending');

      for (const payroll of pendingPayrolls) {
        await invoiceService.updateInvoice(payroll.id, { ...payroll, status: 'approved' });
      }

      await fetchInvoices();
      alert(`Successfully approved ${pendingPayrolls.length} payroll(s)!`);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk approve error:', error);
      alert('Failed to approve payrolls: ' + error.message);
    }
  };

  const handleStopAllPayroll = async () => {
    if (!window.confirm('Stop all payroll processing for this month? This will mark them as draft.')) {
      return;
    }

    try {
      const activePayrolls = filteredInvoices.filter(inv =>
        inv.status === 'pending' || inv.status === 'approved' || inv.status === 'processed'
      );

      for (const payroll of activePayrolls) {
        await invoiceService.updateInvoice(payroll.id, { ...payroll, status: 'draft' });
      }

      await fetchInvoices();
      alert(`Successfully stopped ${activePayrolls.length} payroll(s)!`);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk stop error:', error);
      alert('Failed to stop payrolls: ' + error.message);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="invoice-page dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">PAYROLL</h1>
          <p className="main-subtitle">Manage employee payroll and salary records</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button
              className="btn-filter-date"
              onClick={() => setShowBulkActions(!showBulkActions)}
              style={{ padding: '10px 16px' }}
            >
              <MdMoreVert size={20} />
            </button>

            {showBulkActions && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '220px',
                  zIndex: 100
                }}
              >
                <button
                  onClick={handleConfirmAllPending}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#207DC0',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  ✓ Confirm All Pending
                </button>
                <button
                  onClick={handleStopAllPayroll}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#ef4444',
                    fontWeight: '500',
                    borderTop: '1px solid #e5e7eb'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  ✕ Stop All Payroll
                </button>
              </div>
            )}
          </div>

          <button
            className="btn-new-appointment"
            onClick={() => {
              setPayrollMode('create');
              setEditingInvoice(null);
              setShowPayrollModal(true);
            }}
          >
            + Process Payroll
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="filter-bar-container">
        <div className="search-wrapper">
          <MdSearch className="search-icon-lg" />
          <input
            type="text"
            placeholder="Search by Employee, Code, Dept or Payroll ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-lg"
          />
        </div>

        <div className="filter-right-group">
          <button
            className={`tab-btn ${periodFilter === 'All' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('All')}
          >
            All Periods
          </button>
          <button
            className={`tab-btn ${periodFilter === 'Current' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('Current')}
          >
            Current Month
          </button>
          <button
            className={`tab-btn ${periodFilter === 'Last' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('Last')}
          >
            Last Month
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="btn-filter-date"
            style={{ marginLeft: '12px' }}
          >
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <button
            className="btn-filter-date"
            onClick={() => fetchInvoices()}
            title="Refresh Data"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-card">
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Employee</th>
                <th style={{ width: '13%' }}>Pay Month</th>
                <th style={{ width: '13%' }}>Date</th>
                <th style={{ width: '14%' }}>Gross Pay</th>
                <th style={{ width: '14%' }}>Net Pay</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '12%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoices.map((invoice, index) => (
                <tr key={invoice.id || index}>
                  <td>
                    <div className="info-group">
                      <div className="primary">
                        {invoice.staffName || 'Unknown'}
                        <span style={{ marginLeft: '8px', opacity: 0.5, fontWeight: 500 }}>
                          #{invoice.staffCode || 'N/A'}
                        </span>
                      </div>
                      <div className="secondary">
                        {invoice.department || 'General'}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#207DC0' }}>{invoice.periodDisplay || 'N/A'}</td>
                  <td>{formatDate(invoice.date)}</td>
                  <td style={{ fontWeight: 600, color: '#334155' }}>{formatCurrency(invoice.amount)}</td>
                  <td style={{ fontWeight: 600, color: '#207DC0' }}>{formatCurrency(invoice.paidAmount)}</td>
                  <td><StatusBadge status={invoice.status} /></td>
                  <td>
                    <div className="action-buttons-group" style={{ gap: '6px' }}>
                      <button className="btn-action view" title="View" onClick={() => handleView(invoice)}>
                        <Icons.Eye />
                      </button>
                      <button className="btn-action edit" title="Edit" onClick={() => handleEdit(invoice)}>
                        <Icons.Edit />
                      </button>
                      <button
                        className="btn-action copy"
                        title="Copy to Next Month"
                        onClick={() => handleCopyToNextMonth(invoice)}
                      >
                        <MdArrowForward size={16} />
                      </button>
                      <button className="btn-action delete" title="Delete" onClick={() => handleDelete(invoice)}>
                        <Icons.Delete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#207DC0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      <span>Loading payroll...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && currentInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    No payroll records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination-footer">
          <button
            className="page-arrow-circle leading"
            disabled={currentPage === 0}
            onClick={handlePrevPage}
          >
            <MdChevronLeft size={20} />
          </button>

          <div className="page-indicator-box">
            Page {currentPage + 1} of {totalPages || 1}
          </div>

          <button
            className="page-arrow-circle trailing"
            disabled={currentPage >= totalPages - 1 || totalPages === 0}
            onClick={handleNextPage}
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      </div>

      {showDetail && selectedInvoice && (
        <InvoiceDetail
          invoiceId={selectedInvoice.id}
          invoice={selectedInvoice}
          onClose={handleCloseDetail}
        />
      )}

      {/* Invoice Form Modal */}
      {showForm && editingInvoice && (
        <InvoiceForm
          initial={editingInvoice}
          onCancel={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Payroll Processing Modal */}
      <PayrollModal
        isOpen={showPayrollModal}
        onClose={() => {
          setShowPayrollModal(false);
          setEditingInvoice(null);
          setPayrollMode('create');
        }}
        onSubmit={handlePayrollSubmit}
        staffList={staffList}
        mode={payrollMode}
        initialData={editingInvoice}
      />

      {/* Payroll View Modal */}
      <PayrollViewModal
        isOpen={showPayrollView}
        onClose={() => {
          setShowPayrollView(false);
          setSelectedInvoice(null);
        }}
        payroll={selectedInvoice}
      />

      {/* Next Month Payroll Modal */}
      <NextMonthPayrollModal
        isOpen={showNextMonthModal}
        onClose={() => {
          setShowNextMonthModal(false);
          setSelectedInvoice(null);
        }}
        onSubmit={handleNextMonthSubmit}
        previousPayroll={selectedInvoice}
      />
    </div>
  );
};

export default Invoice;

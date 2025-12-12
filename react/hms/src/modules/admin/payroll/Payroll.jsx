import React, { useState, useEffect } from 'react';
import { authService } from '../../../services/authService';
import GenericDataTable from '../../../components/GenericDataTable';
import PayrollForm from './components/PayrollForm';
import PayrollView from './components/PayrollView';
import './Payroll.css';

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const itemsPerPage = 25;

  useEffect(() => {
    fetchPayrolls();
  }, [monthFilter, yearFilter, departmentFilter, statusFilter]);

  useEffect(() => {
    filterPayrolls();
  }, [payrolls, searchQuery]);

  const fetchPayrolls = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(monthFilter && { month: monthFilter }),
        ...(yearFilter && { year: yearFilter }),
        ...(departmentFilter !== 'All' && { department: departmentFilter }),
        ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase() }),
      });

      const response = await authService.get(`/payrolls?${params.toString()}`);
      const payrollsData = response.data || response;
      const payrollsList = Array.isArray(payrollsData) ? payrollsData : [];
      
      const mappedPayrolls = payrollsList.map(p => ({
        id: p._id || p.id,
        staffName: p.staffName || '',
        staffCode: p.staffCode || '',
        department: p.department || '',
        designation: p.designation || '',
        payrollCode: p.payrollCode || p.id || '',
        basicSalary: parseFloat(p.basicSalary || 0),
        allowances: parseFloat(p.allowances || 0),
        deductions: parseFloat(p.deductions || 0),
        netSalary: parseFloat(p.netSalary || 0),
        status: p.status || 'Pending',
        payPeriod: p.payPeriod || `${monthFilter}/${yearFilter}`,
        rawData: p
      }));

      setPayrolls(mappedPayrolls);
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPayrolls = () => {
    const q = searchQuery.toLowerCase().trim();
    let filtered = payrolls;

    if (q) {
      filtered = filtered.filter(p =>
        p.staffName.toLowerCase().includes(q) ||
        p.staffCode.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.designation.toLowerCase().includes(q) ||
        p.payrollCode.toLowerCase().includes(q)
      );
    }

    setFilteredPayrolls(filtered);
    setCurrentPage(0);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  const handleAddPayroll = () => {
    setSelectedPayroll(null);
    setShowForm(true);
  };

  const handleEditPayroll = (payroll) => {
    setSelectedPayroll(payroll.rawData);
    setShowForm(true);
  };

  const handleViewPayroll = (payroll) => {
    setSelectedPayroll(payroll.rawData);
    setShowView(true);
  };

  const handleDeletePayroll = async (payroll) => {
    if (!window.confirm(`Are you sure you want to delete this payroll record?`)) return;
    
    try {
      await authService.delete(`/payrolls/${payroll.id}`);
      await fetchPayrolls();
      alert('Payroll record deleted successfully');
    } catch (error) {
      console.error('Failed to delete payroll:', error);
      alert('Failed to delete payroll record');
    }
  };

  const handleFormClose = (shouldRefresh) => {
    setShowForm(false);
    setSelectedPayroll(null);
    if (shouldRefresh) {
      fetchPayrolls();
    }
  };

  const handleViewClose = () => {
    setShowView(false);
    setSelectedPayroll(null);
  };

  const handleProcessPayroll = async (payroll) => {
    if (!window.confirm(`Process payroll for ${payroll.staffName}?`)) return;

    try {
      await authService.put(`/payrolls/${payroll.id}`, { status: 'Processed' });
      await fetchPayrolls();
      alert('Payroll processed successfully');
    } catch (error) {
      console.error('Failed to process payroll:', error);
      alert('Failed to process payroll');
    }
  };

  const columns = [
    { key: 'payrollCode', label: 'Payroll Code', sortable: true },
    { key: 'staffName', label: 'Staff Name', sortable: true },
    { key: 'staffCode', label: 'Staff Code', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'basicSalary', label: 'Basic Salary', sortable: true, format: (val) => `₹${val.toFixed(2)}` },
    { key: 'allowances', label: 'Allowances', sortable: true, format: (val) => `₹${val.toFixed(2)}` },
    { key: 'deductions', label: 'Deductions', sortable: true, format: (val) => `₹${val.toFixed(2)}` },
    { key: 'netSalary', label: 'Net Salary', sortable: true, format: (val) => `₹${val.toFixed(2)}` },
    { key: 'status', label: 'Status', sortable: true },
  ];

  const uniqueDepartments = ['All', ...new Set(payrolls.map(p => p.department).filter(Boolean))];
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const calculateSummary = () => {
    const totalBasic = filteredPayrolls.reduce((sum, p) => sum + p.basicSalary, 0);
    const totalAllowances = filteredPayrolls.reduce((sum, p) => sum + p.allowances, 0);
    const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + p.deductions, 0);
    const totalNet = filteredPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

    return { totalBasic, totalAllowances, totalDeductions, totalNet };
  };

  const summary = calculateSummary();

  return (
    <div className="payroll-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">
              <span className="icon">💰</span>
              Payroll Management
            </h1>
            <p className="page-subtitle">Manage employee salaries and payments</p>
          </div>
          <button className="btn-primary" onClick={handleAddPayroll}>
            <span className="icon">➕</span>
            Add Payroll
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            Current Period
          </button>
          <button 
            className={`tab ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            History
          </button>
          <button 
            className={`tab ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
          >
            Summary
          </button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">Total Basic</div>
          <div className="summary-value">₹{summary.totalBasic.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Allowances</div>
          <div className="summary-value">₹{summary.totalAllowances.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Deductions</div>
          <div className="summary-value">₹{summary.totalDeductions.toFixed(2)}</div>
        </div>
        <div className="summary-card primary">
          <div className="summary-label">Total Net Salary</div>
          <div className="summary-value">₹{summary.totalNet.toFixed(2)}</div>
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search payrolls..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Month:</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(parseInt(e.target.value))}
            className="filter-select"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Year:</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="filter-select"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Department:</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="filter-select"
          >
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Processed">Processed</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <GenericDataTable
        columns={columns}
        data={filteredPayrolls}
        isLoading={isLoading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onView={handleViewPayroll}
        onEdit={handleEditPayroll}
        onDelete={handleDeletePayroll}
        customActions={(payroll) => (
          payroll.status === 'Pending' && (
            <button
              className="action-btn process-btn"
              onClick={() => handleProcessPayroll(payroll)}
              title="Process Payroll"
            >
              ✓
            </button>
          )
        )}
      />

      {showForm && (
        <PayrollForm
          payroll={selectedPayroll}
          onClose={handleFormClose}
        />
      )}

      {showView && selectedPayroll && (
        <PayrollView
          payroll={selectedPayroll}
          onClose={handleViewClose}
        />
      )}
    </div>
  );
};

export default Payroll;

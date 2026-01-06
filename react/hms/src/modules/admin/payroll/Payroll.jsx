import React, { useState, useEffect } from 'react';
import payrollService from '../../../services/payrollService';
import GenericDataTable from '../../../components/GenericDataTable';
import CreatePayrollModal from './components/CreatePayrollModal';
import PayrollView from './components/PayrollView';
import { MdDescription, MdAttachMoney, MdMoneyOff, MdCheckCircleOutline, MdCalendarToday, MdGridView, MdFilterList, MdSearch, MdAdd } from 'react-icons/md';
import './Payroll.css';

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showView, setShowView] = useState(false);

  // Pagination config
  const itemsPerPage = 25;

  useEffect(() => {
    fetchPayrolls();
  }, []);

  useEffect(() => {
    filterPayrolls();
  }, [payrolls, searchQuery]);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const response = await payrollService.getPayrolls();
      console.log('💰 [PAYROLL] API Response:', response);

      let payrollsList = [];
      if (Array.isArray(response)) {
        payrollsList = response;
      } else if (response && Array.isArray(response.payrolls)) {
        payrollsList = response.payrolls;
      } else if (response && Array.isArray(response.data)) {
        payrollsList = response.data;
      } else {
        payrollsList = [];
      }

      // Map strict columns: Code, Staff Name, Department, Period, Gross, Deductions, Net, Status
      const mappedPayrolls = payrollsList.map(p => ({
        id: p._id || p.id,
        payrollCode: p.payrollCode || p.id || `PAY-${p._id?.substring(0, 6) || '000'}`,
        staffName: p.staffName || '',
        department: p.department || '',
        period: p.payPeriod || '',
        grossSalary: parseFloat(p.grossSalary || 0),
        deductions: parseFloat(p.totalDeductions || p.deductions || 0),
        netSalary: parseFloat(p.netSalary || 0),
        status: p.status || 'DRAFT',
        rawData: p
      }));

      // Sort by newest first
      mappedPayrolls.sort((a, b) => new Date(b.rawData.createdAt) - new Date(a.rawData.createdAt));

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
        p.department.toLowerCase().includes(q) ||
        p.payrollCode.toLowerCase().includes(q)
      );
    }

    setFilteredPayrolls(filtered);
    setCurrentPage(0);
  };

  const handleCreateSuccess = () => {
    fetchPayrolls();
  };

  const handleEditPayroll = (payroll) => {
    // For now, edit just opens view or we could support edit later
    // The requirement focuses on Add Flow.
    // If edit is needed, we would need to pass data to CreatePayrollModal to populate
    setSelectedPayroll(payroll.rawData);
    // TODO: Implement Edit via CreatePayrollModal if required, for now just log
    console.log('Edit requested for:', payroll);
    alert('Edit functionality to be implemented or repurposed CreatePayrollModal for editing.');
  };

  const handleViewPayroll = (payroll) => {
    setSelectedPayroll(payroll.rawData);
    setShowView(true);
  };

  const handleDeletePayroll = async (payroll) => {
    if (!window.confirm(`Are you sure you want to delete payroll for ${payroll.staffName}?`)) return;
    try {
      await payrollService.deletePayroll(payroll.id);
      await fetchPayrolls(); // Refresh list
    } catch (error) {
      console.error('Failed to delete payroll:', error);
      alert('Failed to delete payroll record');
    }
  };

  const columns = [
    { key: 'payrollCode', label: 'CODE', sortable: true },
    { key: 'staffName', label: 'STAFF NAME', sortable: true },
    { key: 'department', label: 'DEPARTMENT', sortable: true },
    { key: 'period', label: 'PERIOD (Month + Year)', sortable: true },
    { key: 'grossSalary', label: 'GROSS', sortable: true, format: (val) => `₹${val.toLocaleString()}` },
    { key: 'deductions', label: 'DEDUCTIONS', sortable: true, format: (val) => `₹${val.toLocaleString()}` },
    { key: 'netSalary', label: 'NET SALARY', sortable: true, format: (val) => `₹${val.toLocaleString()}` },
    {
      key: 'status', label: 'STATUS', sortable: true,
      render: (val) => (
        <span className={`status-badge ${val.toLowerCase()}`}>{val}</span>
      )
    },
  ];

  const calculateSummary = () => {
    const totalRecords = filteredPayrolls.length;
    const totalGross = filteredPayrolls.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalNet = filteredPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + p.deductions, 0);
    const paidCount = filteredPayrolls.filter(p => p.status.toLowerCase() === 'paid').length;

    return { totalRecords, totalGross, totalNet, totalDeductions, paidCount };
  };

  const summary = calculateSummary();

  return (
    <div className="payroll-page">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card card-blue-light">
          <div className="card-icon-wrapper">
            <MdDescription className="card-icon" />
          </div>
          <div className="card-content">
            <span className="card-label">Total Records</span>
            <span className="card-value value-blue">{summary.totalRecords}</span>
          </div>
        </div>
        <div className="summary-card card-blue-light">
          <div className="card-icon-wrapper">
            <MdAttachMoney className="card-icon" />
          </div>
          <div className="card-content">
            <span className="card-label">Gross Salary</span>
            <span className="card-value value-blue">₹{summary.totalGross.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card card-green-light">
          <div className="card-icon-wrapper">
            <MdAttachMoney className="card-icon" />
          </div>
          <div className="card-content">
            <span className="card-label">Net Salary</span>
            <span className="card-value value-green">₹{summary.totalNet.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card card-red-light">
          <div className="card-icon-wrapper">
            <MdMoneyOff className="card-icon" />
          </div>
          <div className="card-content">
            <span className="card-label">Deductions</span>
            <span className="card-value value-red">₹{summary.totalDeductions.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card card-green-light">
          <div className="card-icon-wrapper">
            <MdCheckCircleOutline className="card-icon" />
          </div>
          <div className="card-content">
            <span className="card-label">Paid Count</span>
            <span className="card-value value-green">{summary.paidCount}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="payroll-content-area">
        <div className="payroll-header">
          <div className="header-left">
            <div className="header-icon-box">
              <MdDescription />
            </div>
            <h2 className="header-title">PAYROLL</h2>
          </div>

          <div className="header-right">
            <button className="icon-btn" title="Calendar"><MdCalendarToday /></button>
            <button className="icon-btn" title="Grid View"><MdGridView /></button>
            <button className="icon-btn" title="Filter"><MdFilterList /></button>

            <div className="search-control">
              <MdSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Payroll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="add-new-btn" onClick={() => setShowCreateModal(true)}>
              <MdAdd /> Add New
            </button>
          </div>
        </div>

        <div className="payroll-table-container">
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
          />
        </div>
      </div>

      {/* Create Modal */}
      <CreatePayrollModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* View Modal */}
      {showView && selectedPayroll && (
        <PayrollView
          payroll={selectedPayroll}
          isOpen={showView}
          onClose={() => setShowView(false)}
        />
      )}
    </div>
  );
};

export default Payroll;

import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import payrollService from '../../../services/payrollService';
import GenericDataTable from '../../../components/GenericDataTable';
import CreatePayrollModal from './components/CreatePayrollModal';
import PayrollView from './components/PayrollView';
import { MdDescription, MdAttachMoney, MdMoneyOff, MdCheckCircleOutline, MdCalendarToday, MdGridView, MdFilterList, MdSearch, MdAdd, MdClose } from 'react-icons/md';
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
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  // Pagination config
  const itemsPerPage = 15;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  useEffect(() => {
    filterPayrolls();
  }, [payrolls, searchQuery, activeTab, selectedDate]);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const response = await payrollService.getPayrolls();
      console.log('💰 [PAYROLL] API Response:', response);

      let payrollsList = [];
      if (Array.isArray(response)) {
        payrollsList = response;
      } else if (response && Array.isArray(response.payroll)) {
        payrollsList = response.payroll;
      } else if (response && Array.isArray(response.data)) {
        payrollsList = response.data;
      } else {
        payrollsList = [];
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Map strict columns: Code, Staff Name, Department, Period, Gross, Deductions, Net, Status
      const mappedPayrolls = payrollsList.map(p => {
        let paymentDateRaw = null;
        if (p.paymentDate) {
          paymentDateRaw = new Date(p.paymentDate).toISOString().split('T')[0];
        } else if (p.createdAt) {
          paymentDateRaw = new Date(p.createdAt).toISOString().split('T')[0];
        }

        return {
          id: p._id || p.id,
          payrollCode: p.metadata?.payrollCode || p.staffCode || p.id || `PAY-${p._id?.substring(0, 6) || '000'}`,
          staffName: p.staffName || '',
          department: p.department || '',
          period: p.payPeriodMonth ? `${months[p.payPeriodMonth - 1]} ${p.payPeriodYear}` : 'N/A',
          paymentDateRaw,
          grossSalary: parseFloat(p.grossSalary || 0),
          deductions: parseFloat(p.totalDeductions || 0),
          netSalary: parseFloat(p.netSalary || 0),
          status: (p.status || 'DRAFT').toUpperCase(),
          rawData: p
        };
      });

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
    let result = [...payrolls];

    // Status Filter (Tabs)
    if (activeTab !== 'all') {
      result = result.filter(p => p.status.toLowerCase() === activeTab.toLowerCase());
    }

    // Date/Month Filter
    if (selectedDate) {
      const [year, month] = selectedDate.split('-');
      result = result.filter(p => {
        const pDate = new Date(p.rawData.paymentDate || p.rawData.createdAt);
        return pDate.getFullYear() === parseInt(year) && (pDate.getMonth() + 1) === parseInt(month);
      });
    }

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.staffName.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.payrollCode.toLowerCase().includes(q)
      );
    }

    setFilteredPayrolls(result);
    setCurrentPage(0);
  };

  const handleDateSelect = (date) => {
    // Picking a month
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthYear = `${year}-${month}`;
    setSelectedDate(monthYear === selectedDate ? null : monthYear);
    setShowCalendar(false);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
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

  const handleDownload = async (item) => {
    try {
      const blob = await payrollService.downloadPayslip(item.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip-${item.staffName}-${item.period}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Failed to download payslip:', error);
      alert('Failed to download payslip');
    }
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
    { key: 'staffName', label: 'STAFF NAME', sortable: true },
    { key: 'department', label: 'DEPT', sortable: true },
    { key: 'period', label: 'PERIOD', sortable: true },
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
            <div className="tabs-wrapper" style={{ display: 'flex', gap: '4px', marginRight: '12px' }}>
              {['all', 'paid', 'approved', 'pending', 'rejected'].map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="calendar-filter-wrapper" ref={calendarRef} style={{ position: 'relative', marginRight: '12px' }}>
              <button
                className={`btn-filter-date ${selectedDate ? 'active' : ''}`}
                onClick={() => setShowCalendar(!showCalendar)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <MdCalendarToday />
                {selectedDate ? formatDateDisplay(selectedDate) : 'Filter Period'}
                <span style={{ fontSize: '10px' }}>▼</span>
              </button>

              {selectedDate && (
                <button
                  className="btn-clear-date-mini"
                  onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }}
                  style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                >
                  <MdClose size={14} />
                </button>
              )}

              {showCalendar && (
                <div className="calendar-dropdown" style={{ position: 'absolute', right: 0, top: '45px', zIndex: 100, background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', padding: '8px' }}>
                  <Calendar
                    onChange={handleDateSelect}
                    view="year"
                    maxDetail="year"
                  />
                </div>
              )}
            </div>

            <div className="search-control">
              <MdSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search name, code, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>


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
            customActions={(item) => (
              <button
                className="btn-icon download"
                onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                title="Download Payslip"
              >
                <MdDescription />
              </button>
            )}
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

/**
 * PayrollModal.jsx
 * Professional payroll processing modal matching other popup designs
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiDollarSign, FiCalendar, FiCheck, FiFilter } from 'react-icons/fi';
import './PayrollModal.css';

const PayrollModal = ({ isOpen, onClose, onSubmit, staffList = [], mode = 'create', initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(false);
  const searchInputRef = React.useRef(null);
  const dropdownRef = React.useRef(null);
  const departmentFilterRef = React.useRef(null);

  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    department: '',
    designation: '',

    // Pay Period
    payPeriodMonth: new Date().getMonth() + 1,
    payPeriodYear: new Date().getFullYear(),
    paymentDate: new Date().toISOString().split('T')[0],

    // Earnings
    basicSalary: '',
    bonus: '0',
    incentives: '0',
    overtimePay: '0',
    arrears: '0',

    // Deductions
    employeePF: '0',
    employeeESI: '0',
    professionalTax: '0',
    tdsDeducted: '0',

    // Payment Info
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

  const steps = [
    { id: 1, title: 'Staff Selection', icon: FiUser },
    { id: 2, title: 'Salary Details', icon: FiDollarSign },
    { id: 3, title: 'Review & Submit', icon: FiCheck }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load last month's salary data
  const loadLastMonthSalary = async () => {
    if (!formData.staffId) {
      alert('Please select a staff member first');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');

      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api';
      const response = await fetch(`${apiUrl}/payroll/staff/${formData.staffId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) throw new Error('Failed to fetch payroll history');

      const payrolls = await response.json();

      if (!payrolls || payrolls.length === 0) {
        alert('No previous payroll records found for this staff member');
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
        arrears: '0', // Reset arrears
        employeePF: lastPayroll.statutory?.employeePF?.toString() || '0',
        employeeESI: lastPayroll.statutory?.employeeESI?.toString() || '0',
        professionalTax: lastPayroll.statutory?.professionalTax?.toString() || '0',
        tdsDeducted: lastPayroll.statutory?.tdsDeducted?.toString() || '0',
        paymentMode: lastPayroll.paymentMode || prev.paymentMode,
        bankName: lastPayroll.bankName || prev.bankName,
        accountNumber: lastPayroll.accountNumber || prev.accountNumber
      }));

      alert(`Loaded salary details from ${months[(lastPayroll.payPeriodMonth || 1) - 1]} ${lastPayroll.payPeriodYear}`);
    } catch (error) {
      console.error('Error loading last month salary:', error);
      alert('Failed to load previous salary data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize with existing data if in edit mode
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        staffId: initialData.staffId || '',
        staffName: initialData.staffName || '',
        department: initialData.department || '',
        designation: initialData.designation || '',
        payPeriodMonth: initialData.payPeriodMonth || new Date().getMonth() + 1,
        payPeriodYear: initialData.payPeriodYear || new Date().getFullYear(),
        paymentDate: initialData.paymentDate || new Date().toISOString().split('T')[0],
        basicSalary: initialData.basicSalary?.toString() || '',
        bonus: initialData.bonus?.toString() || '0',
        incentives: initialData.incentives?.toString() || '0',
        overtimePay: initialData.overtimePay?.toString() || '0',
        arrears: initialData.arrears?.toString() || '0',
        employeePF: initialData.statutory?.employeePF?.toString() || '0',
        employeeESI: initialData.statutory?.employeeESI?.toString() || '0',
        professionalTax: initialData.statutory?.professionalTax?.toString() || '0',
        tdsDeducted: initialData.statutory?.tdsDeducted?.toString() || '0',
        paymentMode: initialData.paymentMode || 'bank_transfer',
        bankName: initialData.bankName || '',
        accountNumber: initialData.accountNumber || '',
        status: initialData.status || 'pending',
        notes: initialData.notes || ''
      });
      if (mode === 'edit') {
        setCurrentStep(2); // Skip staff selection in edit mode
      }
    }
  }, [initialData, mode]);

  // Filter staff list based on search and department
  const filteredStaffList = staffList.filter(staff => {
    // Department filter
    if (selectedDepartment && staff.department !== selectedDepartment) {
      return false;
    }

    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      staff.name?.toLowerCase().includes(query) ||
      staff.patientFacingId?.toLowerCase().includes(query) ||
      staff.designation?.toLowerCase().includes(query) ||
      staff.department?.toLowerCase().includes(query)
    );
  });

  // Get unique departments
  const departments = [...new Set(staffList.map(staff => staff.department).filter(Boolean))].sort();

  // Handle keyboard navigation
  const handleSearchKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowDropdown(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredStaffList.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredStaffList.length) {
          const selectedStaff = filteredStaffList[highlightedIndex];
          handleStaffSelect(selectedStaff._id || selectedStaff.id);
          setShowDropdown(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
        }
        break;

      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;

      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }

      if (
        departmentFilterRef.current &&
        !departmentFilterRef.current.contains(event.target)
      ) {
        setShowDepartmentFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleStaffSelect = (staffId) => {
    const staff = staffList.find(s => (s._id || s.id) === staffId);
    if (staff) {
      setFormData(prev => ({
        ...prev,
        staffId: staff._id || staff.id,
        staffName: staff.name,
        department: staff.department || '',
        designation: staff.designation || '',
        bankName: staff.bankName || '',
        accountNumber: staff.accountNumber || ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.staffId) newErrors.staffId = 'Please select a staff member';
    }

    if (step === 2) {
      if (!formData.basicSalary || parseFloat(formData.basicSalary) <= 0) {
        newErrors.basicSalary = 'Basic salary is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

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
      console.error('Payroll submission error:', error);
      alert('Failed to process payroll: ' + error.message);
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
    setCurrentStep(1);
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
            <h2>{mode === 'edit' ? 'Edit Payroll' : mode === 'copy' ? 'Copy to New Month' : 'Process Payroll'}</h2>
            <p>Step {currentStep} of {mode === 'edit' ? '2' : '3'}</p>
          </div>

          <div className="modal-steps">
            {steps.filter((step, index) => mode === 'edit' ? index > 0 : true).map((step, index) => (
              <div
                key={step.id}
                className={`modal-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              >
                <div className="step-icon">
                  <step.icon size={20} />
                </div>
                <div className="step-content">
                  <span className="step-number">Step {mode === 'edit' ? index + 1 : step.id}</span>
                  <span className="step-title">{step.title}</span>
                </div>
              </div>
            ))}
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

            {/* Step 1: Staff Selection */}
            {currentStep === 1 && (
              <div className="step-content-wrapper">
                <h2>Select Staff Member</h2>
                <p className="step-description">Choose the employee for payroll processing</p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <div className="form-group" style={{ position: 'relative', flex: 1, marginBottom: 0 }}>
                    <label>Search Staff</label>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                        setHighlightedIndex(-1);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Type to search by name, ID, designation, or department..."
                      className="search-input"
                      autoComplete="off"
                    />
                  </div>

                  <div style={{ position: 'relative' }} ref={departmentFilterRef}>
                    <button
                      type="button"
                      onClick={() => setShowDepartmentFilter(!showDepartmentFilter)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        background: selectedDepartment ? '#207DC0' : 'white',
                        color: selectedDepartment ? 'white' : '#374151',
                        border: selectedDepartment ? '2px solid #207DC0' : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        height: '46px'
                      }}
                    >
                      <FiFilter size={16} />
                      {selectedDepartment || 'All Departments'}
                      {selectedDepartment && (
                        <FiX
                          size={14}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDepartment('');
                          }}
                          style={{ marginLeft: '4px' }}
                        />
                      )}
                    </button>

                    {showDepartmentFilter && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '4px',
                          minWidth: '220px',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 1001
                        }}
                      >
                        <div
                          onClick={() => {
                            setSelectedDepartment('');
                            setShowDepartmentFilter(false);
                          }}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            background: !selectedDepartment ? '#f0f9ff' : 'white',
                            fontWeight: !selectedDepartment ? '600' : '400',
                            color: !selectedDepartment ? '#207DC0' : '#374151',
                            fontSize: '14px'
                          }}
                        >
                          ✓ All Departments ({staffList.length})
                        </div>
                        {departments.map((dept) => {
                          const count = staffList.filter(s => s.department === dept).length;
                          return (
                            <div
                              key={dept}
                              onClick={() => {
                                setSelectedDepartment(dept);
                                setShowDepartmentFilter(false);
                              }}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                background: selectedDepartment === dept ? '#f0f9ff' : 'white',
                                fontWeight: selectedDepartment === dept ? '600' : '400',
                                color: selectedDepartment === dept ? '#207DC0' : '#374151',
                                fontSize: '14px',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.background = selectedDepartment === dept ? '#f0f9ff' : 'white'}
                            >
                              {selectedDepartment === dept && '✓ '}
                              {dept} ({count})
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {selectedDepartment && (
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>Showing {filteredStaffList.length} staff in <strong>{selectedDepartment}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSelectedDepartment('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#207DC0',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      Clear filter
                    </button>
                  </div>
                )}

                <div style={{ position: 'relative' }}>

                  {showDropdown && filteredStaffList.length > 0 && (
                    <div
                      ref={dropdownRef}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                        marginTop: '4px'
                      }}
                    >
                      {filteredStaffList.map((staff, index) => (
                        <div
                          key={staff._id || staff.id}
                          onClick={() => {
                            handleStaffSelect(staff._id || staff.id);
                            setShowDropdown(false);
                            setSearchQuery('');
                            setHighlightedIndex(-1);
                          }}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: index < filteredStaffList.length - 1 ? '1px solid #f3f4f6' : 'none',
                            background: highlightedIndex === index ? '#f0f9ff' : 'white',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                            {staff.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {staff.patientFacingId || staff.id} • {staff.designation} • {staff.department}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showDropdown && filteredStaffList.length === 0 && searchQuery && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '16px',
                        marginTop: '4px',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '14px'
                      }}
                    >
                      No staff found matching "{searchQuery}"
                    </div>
                  )}
                </div>

                {formData.staffId && (
                  <div className="selected-staff-info">
                    <h3>Selected Staff</h3>
                    <div className="info-grid">
                      <div><strong>Name:</strong> {formData.staffName}</div>
                      <div><strong>Department:</strong> {formData.department}</div>
                      <div><strong>Designation:</strong> {formData.designation}</div>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Pay Period Month *</label>
                    <select name="payPeriodMonth" value={formData.payPeriodMonth} onChange={handleChange}>
                      {months.map((month, index) => (
                        <option key={index} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Pay Period Year *</label>
                    <input
                      type="number"
                      name="payPeriodYear"
                      value={formData.payPeriodYear}
                      onChange={handleChange}
                      min="2020"
                      max="2100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Salary Details */}
            {currentStep === 2 && (
              <div className="step-content-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Salary Details</h2>
                    <p className="step-description" style={{ margin: '4px 0 0 0' }}>Enter earnings and deductions for {formData.staffName}</p>
                  </div>
                  {mode !== 'edit' && formData.staffId && (
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
                      {isSubmitting ? 'Loading...' : 'Use Last Month Salary'}
                    </button>
                  )}
                </div>

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
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="step-content-wrapper">
                <h2>Review & Confirm</h2>
                <p className="step-description">Review the payroll details before submission</p>

                <div className="review-section">
                  <h3>Staff Information</h3>
                  <div className="review-grid">
                    <div><strong>Name:</strong> {formData.staffName}</div>
                    <div><strong>Department:</strong> {formData.department}</div>
                    <div><strong>Designation:</strong> {formData.designation}</div>
                    <div><strong>Period:</strong> {months[formData.payPeriodMonth - 1]} {formData.payPeriodYear}</div>
                  </div>
                </div>

                <div className="review-section">
                  <h3>Salary Breakdown</h3>
                  <div className="review-breakdown">
                    <div className="breakdown-section">
                      <h4>Earnings</h4>
                      <div className="breakdown-item">
                        <span>Basic Salary:</span>
                        <span>₹{parseFloat(formData.basicSalary || 0).toFixed(2)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Bonus:</span>
                        <span>₹{parseFloat(formData.bonus || 0).toFixed(2)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Incentives:</span>
                        <span>₹{parseFloat(formData.incentives || 0).toFixed(2)}</span>
                      </div>
                      <div className="breakdown-item total">
                        <span>Total Earnings:</span>
                        <strong>₹{calculations.totalEarnings.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="breakdown-section">
                      <h4>Deductions</h4>
                      <div className="breakdown-item">
                        <span>PF:</span>
                        <span>₹{parseFloat(formData.employeePF || 0).toFixed(2)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>ESI:</span>
                        <span>₹{parseFloat(formData.employeeESI || 0).toFixed(2)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Professional Tax:</span>
                        <span>₹{parseFloat(formData.professionalTax || 0).toFixed(2)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>TDS:</span>
                        <span>₹{parseFloat(formData.tdsDeducted || 0).toFixed(2)}</span>
                      </div>
                      <div className="breakdown-item total">
                        <span>Total Deductions:</span>
                        <strong>₹{calculations.totalDeductions.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="net-salary-display">
                    <span>Net Salary</span>
                    <strong>₹{calculations.netSalary.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
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
                  <label>Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={currentStep === 1 ? handleClose : handlePrevious}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            <button
              type="button"
              onClick={currentStep === 3 ? handleSubmit : handleNext}
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : currentStep === 3 ? 'Process Payroll' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollModal;

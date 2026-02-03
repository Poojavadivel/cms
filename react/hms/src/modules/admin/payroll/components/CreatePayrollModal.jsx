import React, { useState, useEffect } from 'react';
import { MdClose, MdPerson, MdAttachMoney, MdMoneyOff, MdPayment, MdCheckCircle, MdAccountBalanceWallet, MdRefresh, MdCalculate } from 'react-icons/md';
import payrollService from '../../../../services/payrollService';
import './CreatePayrollModal.css';

const CreatePayrollModal = ({ isOpen, onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        staffId: '',
        staffName: '',
        staffCode: '',
        department: '', // Added department
        designation: '',

        // Earnings
        basicSalary: '',
        bonus: '',
        incentives: '',
        overtime: '',
        arrears: '',

        // Deductions
        pf: '',
        esi: '',
        pt: '',
        tds: '',

        // Payment
        payPeriod: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Bank Transfer',
        bankName: '',
        accountNumber: '',
        notes: '',
        status: 'Draft'
    });

    // Calculated State
    const [calculations, setCalculations] = useState({
        grossSalary: 0,
        totalDeductions: 0,
        netSalary: 0
    });

    useEffect(() => {
        if (isOpen) {
            loadStaff();
            // Set default pay period to current month-year
            const date = new Date();
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            setFormData(prev => ({ ...prev, payPeriod: `${month} ${year}` }));
        } else {
            resetForm();
        }
    }, [isOpen]);

    // Real-time calculations
    useEffect(() => {
        calculateTotals();
    }, [
        formData.basicSalary, formData.bonus, formData.incentives, formData.overtime, formData.arrears,
        formData.pf, formData.esi, formData.pt, formData.tds
    ]);

    const loadStaff = async () => {
        try {
            const response = await payrollService.getStaffList();
            const list = Array.isArray(response) ? response : (response.data || []);
            setStaffList(list);
        } catch (error) {
            console.error('Failed to load staff:', error);
        }
    };

    const calculateTotals = () => {
        const parse = (val) => parseFloat(val) || 0;

        const gross = parse(formData.basicSalary) +
            parse(formData.bonus) +
            parse(formData.incentives) +
            parse(formData.overtime) +
            parse(formData.arrears);

        const deductions = parse(formData.pf) +
            parse(formData.esi) +
            parse(formData.pt) +
            parse(formData.tds);

        const net = gross - deductions;

        setCalculations({
            grossSalary: gross,
            totalDeductions: deductions,
            netSalary: net
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStaffSelect = (staffId) => {
        const selected = staffList.find(s => (s._id || s.id) === staffId);
        if (selected) {
            setFormData(prev => ({
                ...prev,
                staffId: selected._id || selected.id,
                // ✅ Store for display only - not sent to backend
                staffName: selected.name,
                staffCode: selected.staffCode || selected.empId || selected.id,
                department: selected.department || '',
                designation: selected.designation || '',
                basicSalary: selected.salary || selected.basicSalary || prev.basicSalary,
                bankName: selected.bankName || '',
                accountNumber: selected.accountNumber || ''
            }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.staffId) {
            alert('Please select a staff member');
            return;
        }

        setIsSaving(true);
        try {
            // Parse "Month Year" string for backend
            const periodParts = formData.payPeriod.split(' ');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const monthIdx = monthNames.findIndex(m => m.toLowerCase().startsWith(periodParts[0].toLowerCase() || '')) % 12;
            const month = monthIdx !== -1 ? monthIdx + 1 : new Date().getMonth() + 1;
            const year = parseInt(periodParts[1]) || new Date().getFullYear();

            const payload = {
                // ✅ Only send staffId reference
                staffId: formData.staffId,
                payPeriodMonth: month,
                payPeriodYear: year,
                basicSalary: parseFloat(formData.basicSalary) || 0,
                bonus: parseFloat(formData.bonus) || 0,
                incentives: parseFloat(formData.incentives) || 0,
                overtimePay: parseFloat(formData.overtime) || 0,
                arrears: parseFloat(formData.arrears) || 0,
                totalEarnings: calculations.grossSalary,
                totalDeductions: calculations.totalDeductions,
                statutory: {
                    employeePF: parseFloat(formData.pf) || 0,
                    employeeESI: parseFloat(formData.esi) || 0,
                    professionalTax: parseFloat(formData.pt) || 0,
                    tdsDeducted: parseFloat(formData.tds) || 0
                },
                grossSalary: calculations.grossSalary,
                netSalary: calculations.netSalary,
                status: formData.status.toLowerCase(),
                paymentMode: formData.paymentMode.toLowerCase().replace(' ', '_'),
                paymentDate: formData.paymentDate,
                bankName: formData.bankName,
                accountNumber: formData.accountNumber,
                notes: formData.notes
            };

            await payrollService.createPayroll(payload);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create payroll:', error);
            alert('Failed to create payroll. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setActiveTab('basic');
        setFormData({
            staffId: '', staffName: '', staffCode: '', department: '', designation: '',
            basicSalary: '', bonus: '', incentives: '', overtime: '', arrears: '',
            pf: '', esi: '', pt: '', tds: '',
            payPeriod: '', paymentDate: new Date().toISOString().split('T')[0],
            paymentMode: 'Bank Transfer', bankName: '', accountNumber: '', notes: '', status: 'Draft'
        });
        setCalculations({ grossSalary: 0, totalDeductions: 0, netSalary: 0 });
    };

    const formatCurrency = (val) => {
        return `₹${(parseFloat(val) || 0).toLocaleString('en-IN')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="create-payroll-overlay">
            <div className="create-payroll-modal">
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title">
                        <h2><div style={{ background: '#3b82f6', padding: '6px', borderRadius: '6px', color: 'white', display: 'flex' }}><MdAccountBalanceWallet /></div> Create New Payroll</h2>
                        <p>Fill in the details below to generate payroll</p>
                    </div>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>

                {/* Summary Cards */}
                <div className="modal-summary-cards">
                    <div className="modal-summary-card">
                        <div className="ms-icon-box ms-icon-blue"><MdRefresh /></div>
                        <div className="ms-content">
                            <label>Gross Salary</label>
                            <span className="amount blue">{formatCurrency(calculations.grossSalary)}</span>
                        </div>
                    </div>
                    <div className="modal-summary-card">
                        <div className="ms-icon-box ms-icon-red"><MdMoneyOff /></div>
                        <div className="ms-content">
                            <label>Deductions</label>
                            <span className="amount red">{formatCurrency(calculations.totalDeductions)}</span>
                        </div>
                    </div>
                    <div className="modal-summary-card">
                        <div className="ms-icon-box ms-icon-green"><MdAccountBalanceWallet /></div>
                        <div className="ms-content">
                            <label>Net Salary</label>
                            <span className="amount green">{formatCurrency(calculations.netSalary)}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
                        <MdPerson /> Basic Info
                    </button>
                    <button className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`} onClick={() => setActiveTab('salary')}>
                        <MdAttachMoney /> Salary & Earnings
                    </button>
                    <button className={`tab-btn ${activeTab === 'deductions' ? 'active' : ''}`} onClick={() => setActiveTab('deductions')}>
                        <MdMoneyOff /> Deductions
                    </button>
                    <button className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
                        <MdPayment /> Payment
                    </button>
                </div>

                {/* Tab Content */}
                <div className="modal-body">
                    {activeTab === 'basic' && (
                        <div className="tab-content">
                            <h3>Staff Selection</h3>
                            <div className="form-group">
                                {/* <label>Select Staff Member</label> */}
                                <div className="staff-select-wrapper">
                                    <select
                                        className="full-width-select"
                                        value={formData.staffId}
                                        onChange={(e) => handleStaffSelect(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                    >
                                        <option value="">Select Staff Member</option>
                                        {staffList.map(staff => (
                                            <option key={staff._id || staff.id} value={staff._id || staff.id}>
                                                {staff.name} ({staff.staffCode || staff.id}) - {staff.role || staff.designation || 'Staff'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ marginTop: '24px' }}>Pay Period</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Period (Month Year)</label>
                                    <input
                                        type="text"
                                        value={formData.payPeriod}
                                        onChange={(e) => handleInputChange('payPeriod', e.target.value)}
                                        placeholder="e.g. June 2026"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'salary' && (
                        <div className="tab-content">
                            <h3>Basic Salary</h3>
                            <div className="form-group">
                                <div className="input-with-icon">
                                    <span className="input-icon"><MdAttachMoney /></span>
                                    <input
                                        type="number"
                                        value={formData.basicSalary}
                                        onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                                        placeholder="Basic Salary"
                                    />
                                </div>
                            </div>

                            <h3>Additional Earnings</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Bonus</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon"><MdCalculate /></span>
                                        <input
                                            type="number"
                                            value={formData.bonus}
                                            onChange={(e) => handleInputChange('bonus', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Incentives</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon"><MdCalculate /></span>
                                        <input
                                            type="number"
                                            value={formData.incentives}
                                            onChange={(e) => handleInputChange('incentives', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Overtime</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon"><MdCalculate /></span>
                                        <input
                                            type="number"
                                            value={formData.overtime}
                                            onChange={(e) => handleInputChange('overtime', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Arrears</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon"><MdCalculate /></span>
                                        <input
                                            type="number"
                                            value={formData.arrears}
                                            onChange={(e) => handleInputChange('arrears', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="breakdown-box">
                                <h4><MdCalculate /> Salary Breakdown</h4>
                                <div className="breakdown-row">
                                    <span>Basic Salary</span>
                                    <span>{formatCurrency(formData.basicSalary)}</span>
                                </div>
                                <div className="breakdown-row">
                                    <span>Overtime Pay</span>
                                    <span>{formatCurrency(formData.overtime)}</span>
                                </div>
                                <div className="breakdown-row">
                                    <span>Total Earnings</span>
                                    <span>{formatCurrency(calculations.grossSalary)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'deductions' && (
                        <div className="tab-content">
                            <h3>Statutory Deductions</h3>
                            <div className="form-group">
                                <label>Provident Fund (PF)</label>
                                <input type="number" value={formData.pf} onChange={(e) => handleInputChange('pf', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>ESI</label>
                                <input type="number" value={formData.esi} onChange={(e) => handleInputChange('esi', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Professional Tax (PT)</label>
                                <input type="number" value={formData.pt} onChange={(e) => handleInputChange('pt', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>TDS (Tax Deducted at Source)</label>
                                <input type="number" value={formData.tds} onChange={(e) => handleInputChange('tds', e.target.value)} />
                            </div>

                            <div className="deduction-box" style={{ marginTop: '20px' }}>
                                <h4><MdMoneyOff /> Deduction Summary</h4>
                                <div className="breakdown-row">
                                    <span>Provident Fund</span>
                                    <span>{formatCurrency(formData.pf)}</span>
                                </div>
                                <div className="breakdown-row">
                                    <span>ESI</span>
                                    <span>{formatCurrency(formData.esi)}</span>
                                </div>
                                <div className="breakdown-row">
                                    <span>Professional Tax</span>
                                    <span>{formatCurrency(formData.pt)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="tab-content">
                            <h3>Payment Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Payment Mode</label>
                                    <select value={formData.paymentMode} onChange={(e) => handleInputChange('paymentMode', e.target.value)}>
                                        <option>Bank Transfer</option>
                                        <option>Cash</option>
                                        <option>Cheque</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Payment Date</label>
                                    <input type="date" value={formData.paymentDate} onChange={(e) => handleInputChange('paymentDate', e.target.value)} />
                                </div>
                            </div>

                            {formData.paymentMode === 'Bank Transfer' && (
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Bank Name</label>
                                        <input type="text" value={formData.bankName} onChange={(e) => handleInputChange('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
                                    </div>
                                    <div className="form-group">
                                        <label>Account Number</label>
                                        <input type="text" value={formData.accountNumber} onChange={(e) => handleInputChange('accountNumber', e.target.value)} placeholder="XXXXXXXXXXXX" />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea rows="3" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Add any additional notes here..." />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <div className="final-net-salary">
                        <label>Final Net Salary</label>
                        <span>{formatCurrency(calculations.netSalary)}</span>
                    </div>
                    <div className="footer-actions">
                        <button className="btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
                        <button className="btn-create" onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? 'Creating...' : (
                                <>
                                    <MdCheckCircle /> Create Payroll
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePayrollModal;

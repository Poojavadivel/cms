/**
 * InvoiceDetail.jsx
 * Payroll/Invoice Detail View Modal
 */

import React, { useState, useEffect, useRef } from 'react';
import invoiceService from '../../../services/invoiceService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './InvoiceDetail.css';

const InvoiceDetail = ({ invoiceId, invoice, onClose }) => {
    const [payrollData, setPayrollData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const reportRef = useRef(null);
    const fullReportRef = useRef(null);

    useEffect(() => {
        loadPayroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId]);

    const loadPayroll = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await invoiceService.fetchInvoiceById(invoiceId);
            // Backend returns { success: true, payroll: {...} }
            setPayrollData(data.payroll || data);
        } catch (err) {
            setError(`Failed to load payroll details: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatFullDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'paid' || s === 'completed') return '#207DC0';
        if (s === 'pending' || s === 'approved') return '#F59E0B';
        if (s === 'rejected' || s === 'cancelled') return '#EF4444';
        return '#64748b';
    };

    const handleDownload = async () => {
        if (!fullReportRef.current) return;

        try {
            const element = fullReportRef.current;
            element.style.display = 'block';
            element.style.position = 'absolute';
            element.style.left = '-9999px';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            element.style.display = 'none';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Payslip_${payrollData.staffCode || 'Payroll'}_${payrollData.payPeriodMonth}_${payrollData.payPeriodYear}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="invoice-detail-overlay">
                <div className="invoice-detail-modal">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Fetching payroll details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !payrollData) {
        return (
            <div className="invoice-detail-overlay">
                <div className="invoice-detail-modal">
                    <div className="loading-container">
                        <h3 style={{ color: '#EF4444' }}>Error</h3>
                        <p>{error || 'Payroll data not found'}</p>
                        <button onClick={onClose} className="btn-action-header" style={{ margin: '20px auto' }}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="invoice-detail-overlay" onClick={onClose}>
            <div className="invoice-detail-modal" onClick={(e) => e.stopPropagation()} ref={reportRef}>
                <div className="detail-header">
                    <div className="header-left">
                        <h2>Payroll: {payrollData.staffName}</h2>
                        <div className="status-badge" style={{ backgroundColor: getStatusColor(payrollData.status) }}>
                            {payrollData.status?.toUpperCase() || 'UNKNOWN'}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-action-header" onClick={handleDownload}>
                            Download PDF
                        </button>
                        <button className="btn-close-header" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="detail-tabs">
                    <button className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
                    <button className={`tab ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>Salary Breakdown</button>
                    <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
                </div>

                <div className="detail-content">
                    {activeTab === 'details' && (
                        <div className="details-grid">
                            <div className="info-section">
                                <h3>Employee Information</h3>
                                <div className="info-grid">
                                    <div className="info-item"><label>Name</label><p>{payrollData.staffName}</p></div>
                                    <div className="info-item"><label>Staff Code</label><p>{payrollData.staffCode}</p></div>
                                    <div className="info-item"><label>Department</label><p>{payrollData.department || 'N/A'}</p></div>
                                    <div className="info-item"><label>Designation</label><p>{payrollData.designation || 'N/A'}</p></div>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>Payment Details</h3>
                                <div className="info-grid">
                                    <div className="info-item"><label>Pay Period</label><p>{payrollData.payPeriodMonth}/{payrollData.payPeriodYear}</p></div>
                                    <div className="info-item"><label>Payment Date</label><p>{formatDate(payrollData.paymentDate)}</p></div>
                                    <div className="info-item"><label>Payment Mode</label><p>{payrollData.paymentMode || 'N/A'}</p></div>
                                    <div className="info-item"><label>Transaction ID</label><p>{payrollData.transactionId || 'N/A'}</p></div>
                                </div>
                            </div>

                            {payrollData.notes && (
                                <div className="info-section">
                                    <h3>Notes</h3>
                                    <p>{payrollData.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'earnings' && (
                        <div className="salary-breakdown">
                            <div className="info-section">
                                <h3>Earnings</h3>
                                <table className="salary-table">
                                    <thead>
                                        <tr><th>Component</th><th className="amount-cell">Amount</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Basic Salary</td><td className="amount-cell earning">₹{payrollData.basicSalary?.toLocaleString()}</td></tr>
                                        {payrollData.earnings?.map((e, i) => (
                                            <tr key={i}><td>{e.name}</td><td className="amount-cell earning">₹{e.amount?.toLocaleString()}</td></tr>
                                        ))}
                                        {payrollData.overtimePay > 0 && <tr><td>Overtime</td><td className="amount-cell earning">₹{payrollData.overtimePay?.toLocaleString()}</td></tr>}
                                        {payrollData.bonus > 0 && <tr><td>Bonus</td><td className="amount-cell earning">₹{payrollData.bonus?.toLocaleString()}</td></tr>}
                                    </tbody>
                                </table>
                            </div>

                            <div className="info-section" style={{ marginTop: '20px' }}>
                                <h3>Deductions</h3>
                                <table className="salary-table">
                                    <thead>
                                        <tr><th>Component</th><th className="amount-cell">Amount</th></tr>
                                    </thead>
                                    <tbody>
                                        {payrollData.deductions?.map((d, i) => (
                                            <tr key={i}><td>{d.name}</td><td className="amount-cell deduction">₹{d.amount?.toLocaleString()}</td></tr>
                                        ))}
                                        {payrollData.lossOfPayAmount > 0 && <tr><td>Loss of Pay</td><td className="amount-cell deduction">₹{payrollData.lossOfPayAmount?.toLocaleString()}</td></tr>}
                                        {payrollData.totalLoanDeduction > 0 && <tr><td>Loan Deduction</td><td className="amount-cell deduction">₹{payrollData.totalLoanDeduction?.toLocaleString()}</td></tr>}
                                    </tbody>
                                </table>
                            </div>

                            <div className="summary-section">
                                <div className="summary-box">
                                    <div className="summary-row"><span>Total Earnings</span><span>₹{payrollData.totalEarnings?.toLocaleString()}</span></div>
                                    <div className="summary-row"><span>Total Deductions</span><span>- ₹{payrollData.totalDeductions?.toLocaleString()}</span></div>
                                    <div className="summary-row total"><span>Net Salary</span><span className="amount">₹{payrollData.netSalary?.toLocaleString()}</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="history-timeline">
                            {payrollData.historyLog?.length > 0 ? (
                                payrollData.historyLog.map((log, i) => (
                                    <div className="timeline-item" key={i}>
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-action">{log.action?.replace('_', ' ')}</span>
                                                <span className="timeline-date">{formatFullDate(log.performedAt)}</span>
                                            </div>
                                            <p className="timeline-remarks">{log.remarks}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No history records found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden container for PDF download */}
            <div ref={fullReportRef} style={{ display: 'none', padding: '40px', background: 'white', width: '800px', color: '#1e293b' }}>
                <div style={{ borderBottom: '2px solid #207DC0', paddingBottom: '20px', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, color: '#207DC0' }}>Payslip</h1>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Unified Hospital Management System</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                    <div>
                        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Employee Details</h3>
                        <p><strong>Name:</strong> {payrollData.staffName}</p>
                        <p><strong>Staff Code:</strong> {payrollData.staffCode}</p>
                        <p><strong>Dept:</strong> {payrollData.department}</p>
                        <p><strong>Designation:</strong> {payrollData.designation}</p>
                    </div>
                    <div>
                        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Payroll Period</h3>
                        <p><strong>Month/Year:</strong> {payrollData.payPeriodMonth}/{payrollData.payPeriodYear}</p>
                        <p><strong>Date of Issue:</strong> {formatDate(new Date())}</p>
                        <p><strong>Status:</strong> {payrollData.status}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Earnings & Deductions</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Description</th>
                                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #e2e8f0' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Basic Salary</td><td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{payrollData.basicSalary?.toLocaleString()}</td></tr>
                            {payrollData.earnings?.map((e, i) => (
                                <tr key={i}><td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{e.name}</td><td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{e.amount?.toLocaleString()}</td></tr>
                            ))}
                            <tr><td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Total Earnings</td><td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>₹{payrollData.totalEarnings?.toLocaleString()}</td></tr>
                            {payrollData.deductions?.map((d, i) => (
                                <tr key={i}><td style={{ padding: '10px', border: '1px solid #e2e8f0', color: '#EF4444' }}>{d.name}</td><td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#EF4444' }}>- ₹{d.amount?.toLocaleString()}</td></tr>
                            ))}
                            <tr><td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Total Deductions</td><td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold', color: '#EF4444' }}>- ₹{payrollData.totalDeductions?.toLocaleString()}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ width: '300px', marginLeft: 'auto', border: '2px solid #207DC0', padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold' }}>
                        <span>NET SALARY:</span>
                        <span style={{ color: '#207DC0' }}>₹{payrollData.netSalary?.toLocaleString()}</span>
                    </div>
                </div>

                <div style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                    This is an electronically generated document and does not require a physical signature.
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetail;

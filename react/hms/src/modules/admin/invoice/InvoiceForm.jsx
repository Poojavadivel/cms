/**
 * InvoiceForm.jsx
 * Form for editing payroll/invoice data
 */

import React, { useState, useEffect } from 'react';
import { FiUser, FiDollarSign, FiCalendar, FiClock, FiSave, FiX, FiArrowRight } from 'react-icons/fi';
import invoiceService from '../../../services/invoiceService';

const InvoiceForm = ({ initial, onCancel, onSubmit }) => {
    const [formData, setFormData] = useState({
        staffId: '',
        staffName: '',
        staffCode: '',
        department: '',
        designation: '',
        basicSalary: 0,
        payPeriodMonth: new Date().getMonth() + 1,
        payPeriodYear: new Date().getFullYear(),
        status: 'draft',
        paymentMode: 'Bank Transfer',
        notes: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        if (initial) {
            setFormData({
                ...formData,
                ...initial,
                // Map fields if necessary
                paymentMode: initial.paymentMethod || initial.paymentMode || 'Bank Transfer'
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Form error:', error);
            alert('Failed to save payroll: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { id: 1, name: 'Employee Info', icon: FiUser },
        { id: 2, name: 'Salary Details', icon: FiDollarSign },
        { id: 3, name: 'Period & Status', icon: FiCalendar },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-2xl w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Edit Payroll Record</h2>
                        <p className="text-blue-100 text-sm">Update salary and employee details</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-8 py-4 bg-gray-50 border-b flex justify-between items-center">
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <div className={`flex items-center gap-2 ${currentStep === step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === step.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                                    <step.icon size={16} />
                                </div>
                                <span className="text-sm font-bold hidden sm:inline">{step.name}</span>
                            </div>
                            {idx < steps.length - 1 && <div className="h-px bg-gray-300 flex-1 mx-4" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <form id="payroll-form" onSubmit={handleSubmit}>
                        {currentStep === 1 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Employee Name</label>
                                        <input type="text" name="staffName" value={formData.staffName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" disabled />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Staff Code</label>
                                        <input type="text" name="staffCode" value={formData.staffCode} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" disabled />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                                        <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Designation</label>
                                        <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Basic Salary (₹)</label>
                                    <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gross Salary (₹)</label>
                                    <input type="number" name="grossSalary" value={formData.grossSalary} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Net Salary (₹)</label>
                                    <input type="number" name="netSalary" value={formData.netSalary} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg bg-green-50" />
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Month</label>
                                        <input type="number" name="payPeriodMonth" value={formData.payPeriodMonth} onChange={handleChange} min="1" max="12" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year</label>
                                        <input type="number" name="payPeriodYear" value={formData.payPeriodYear} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="draft">Draft</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Mode</label>
                                        <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Cheque">Cheque</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Notes</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Add any remarks..."></textarea>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-50 border-t flex justify-between items-center">
                    <button onClick={onCancel} className="text-gray-500 font-bold hover:text-gray-700">Cancel</button>
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button onClick={() => setCurrentStep(prev => prev - 1)} className="px-6 py-2 border border-gray-300 rounded-lg font-bold hover:bg-gray-100">Back</button>
                        )}
                        {currentStep < 3 ? (
                            <button onClick={() => setCurrentStep(prev => prev + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                                Next <FiArrowRight />
                            </button>
                        ) : (
                            <button type="submit" form="payroll-form" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200">
                                {isSubmitting ? 'Saving...' : <><FiSave /> Save Changes</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;

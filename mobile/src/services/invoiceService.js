/**
 * invoiceService.js
 * Invoice/Payroll API Service - Port from web invoiceService.js
 * 
 * Handles all API calls related to payroll and billing
 */

import authService from './authService';
import { PayrollEndpoints } from './apiConstants';

/**
 * Fetch all invoices/payroll records
 */
export const fetchInvoices = async (params = {}) => {
    try {
        const { page = 0, limit = 100, q = '', status = '' } = params;
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (q) queryParams.append('q', q);
        if (status) queryParams.append('status', status);

        const url = `${PayrollEndpoints.getAll}?${queryParams.toString()}`;
        const response = await authService.get(url);

        let invoicesData = response.payrolls || response.payroll || response.data || (Array.isArray(response) ? response : []);

        return invoicesData.map(payroll => {
            const staff = payroll.staff || payroll.staffId || {};
            const staffName = typeof staff === 'object' && staff !== null ? (staff.fullName || staff.name || '') : '';
            const department = typeof staff === 'object' ? staff.department : '';
            const staffCode = typeof staff === 'object' ? (staff.staffCode || staff.employeeId) : '';

            return {
                id: payroll._id || payroll.id,
                staffName: staffName || 'Unknown',
                staffCode: staffCode || 'N/A',
                department: department || 'General',
                month: payroll.payPeriodMonth,
                year: payroll.payPeriodYear,
                payMonth: `${payroll.payPeriodMonth}/${payroll.payPeriodYear}`,
                date: payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A',
                grossPay: parseFloat(payroll.grossSalary || payroll.totalEarnings || 0),
                netPay: parseFloat(payroll.netSalary || payroll.totalEarnings || 0),
                status: (payroll.status || 'Pending').toLowerCase(),
                role: typeof staff === 'object' ? staff.role : 'Staff',
            };
        });
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch payroll records');
    }
};

/**
 * Fetch invoice by ID
 */
export const fetchInvoiceById = async (id) => {
    try {
        const response = await authService.get(PayrollEndpoints.getById(id));
        return response.payroll || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch payroll record');
    }
};

const invoiceService = {
    fetchInvoices,
    fetchInvoiceById,
};

export default invoiceService;

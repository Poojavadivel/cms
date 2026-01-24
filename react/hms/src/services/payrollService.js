import authService from './authService';

const payrollService = {
    getPayrolls: async () => {
        return await authService.get('/payroll');
    },

    getPayrollById: async (id) => {
        return await authService.get(`/payroll/${id}`);
    },

    createPayroll: async (payrollData) => {
        return await authService.post('/payroll', payrollData);
    },

    updatePayroll: async (id, payrollData) => {
        return await authService.put(`/payroll/${id}`, payrollData);
    },

    deletePayroll: async (id) => {
        return await authService.delete(`/payroll/${id}`);
    },

    // Helper to fetch staff for dropdown (reusing authService's existing endpoint logic if applicable, 
    // or dedicated staff service if it existed, but based on PayrolForm.jsx it uses authService.get('/staff'))
    getStaffList: async () => {
        return await authService.get('/staff');
    },

    downloadPayslip: async (id) => {
        return await authService.downloadFileAsBlob(`/reports-proper/payroll/${id}`);
    }
};

export default payrollService;

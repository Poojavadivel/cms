import authService from './authService';

const payrollService = {
    getPayrolls: async () => {
        return await authService.get('/payrolls');
    },

    getPayrollById: async (id) => {
        return await authService.get(`/payrolls/${id}`);
    },

    createPayroll: async (payrollData) => {
        return await authService.post('/payrolls', payrollData);
    },

    updatePayroll: async (id, payrollData) => {
        return await authService.put(`/payrolls/${id}`, payrollData);
    },

    deletePayroll: async (id) => {
        return await authService.delete(`/payrolls/${id}`);
    },

    // Helper to fetch staff for dropdown (reusing authService's existing endpoint logic if applicable, 
    // or dedicated staff service if it existed, but based on PayrolForm.jsx it uses authService.get('/staff'))
    getStaffList: async () => {
        // Trying to be robust: some backends might have dedicated /staff endpoint, 
        // others might need filtering from users. 
        // PayrollForm.jsx used authService.get('/staff')
        return await authService.get('/staff');
    }
};

export default payrollService;

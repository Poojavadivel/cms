/**
 * pathologyService.js
 * Pathology API Service - Port from web pathologyService.js
 * 
 * Provides lab report management and test order processing
 */

import authService from './authService';
import { PathologyEndpoints, API_BASE_URL } from './apiConstants';

/**
 * Fetch pathology reports
 */
export const fetchReports = async (params = {}) => {
    try {
        const { page = 0, limit = 100, q = '', status = '' } = params;
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (q) queryParams.append('q', q);
        if (status) queryParams.append('status', status);

        const url = `${PathologyEndpoints.getReports}?${queryParams.toString()}`;
        const response = await authService.get(url);

        let reportsData = response.reports || response.data || (Array.isArray(response) ? response : []);

        return reportsData.map(report => ({
            id: report._id || report.id,
            reportId: report.reportId || report.reportNumber || report._id,
            patientName: report.patientName || report.patient?.name || 'Unknown',
            patientId: report.patientId || report.patient?._id || '',
            testName: report.testName || report.testType || 'N/A',
            testType: report.testType || report.category || 'General',
            status: report.status || (report.fileRef ? 'Completed' : 'Pending'),
            doctorName: report.doctorName || report.doctor?.name || '',
            technician: report.technician || report.uploaderName || '',
            patientCode: report.patientCode || 'PAT-00',
        }));
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch reports');
    }
};

/**
 * Fetch report by ID
 */
export const fetchReportById = async (id) => {
    try {
        const response = await authService.get(PathologyEndpoints.getReportById(id));
        const report = response.report || response.data || response;
        return {
            id: report._id || report.id,
            reportId: report.reportId || report.reportNumber || report._id,
            patientName: report.patientName || report.patient?.name || 'Unknown',
            patientId: report.patientId || report.patient?._id || '',
            testName: report.testName || report.testType || 'N/A',
            testType: report.testType || report.category || 'General',
            status: report.status || 'Pending',
            doctorName: report.doctorName || report.doctor?.name || 'N/A',
            technician: report.technician || report.uploaderName || 'N/A',
            remarks: report.remarks || report.notes || '',
            testResults: report.testResults || report.results || []
        };
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch report');
    }
};

/**
 * Create new report
 */
export const createReport = async (reportData) => {
    try {
        const response = await authService.post(PathologyEndpoints.createReport, reportData);
        return response.report || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to create report');
    }
};

/**
 * Update report
 */
export const updateReport = async (id, reportData) => {
    try {
        const response = await authService.put(PathologyEndpoints.updateReport(id), reportData);
        return response.report || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to update report');
    }
};

/**
 * Fetch pending tests
 */
export const fetchPendingTests = async (params = {}) => {
    try {
        const url = `${PathologyEndpoints.getTests}?status=Pending`;
        const response = await authService.get(url);
        return response.tests || response.data || response || [];
    } catch (error) {
        console.error('Failed to fetch pending tests:', error);
        return [];
    }
};

/**
 * Fetch pathology dashboard data
 */
export const fetchDashboardData = async () => {
    try {
        const response = await authService.get(PathologyEndpoints.getDashboard);
        return response.data || response.stats || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch pathology dashboard');
    }
};

/**
 * Fetch all patients for pathology
 */
export const fetchPathologyPatients = async () => {
    try {
        const response = await authService.get(`${API_BASE_URL}/patients?limit=100`);
        const patients = response.patients || response.data || (Array.isArray(response) ? response : []);
        return patients;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch pathology patients');
    }
};

const pathologyService = {
    fetchReports,
    fetchReportById,
    createReport,
    updateReport,
    fetchPendingTests,
    fetchDashboardData,
    fetchPathologyPatients,
};

export default pathologyService;

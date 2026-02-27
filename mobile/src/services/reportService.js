/**
 * reportService.js
 * Reports API Service - Port from web reportService.js
 * 
 * Provides access to various system reports and PDF downloads
 */

import authService from './authService';
import { ReportEndpoints } from './apiConstants';

/**
 * Fetch all reports
 */
export const fetchReports = async () => {
    try {
        const response = await authService.get(ReportEndpoints.getAll);
        return response.reports || response.data || response || [];
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch reports');
    }
};

/**
 * Fetch report by ID
 */
export const fetchReportById = async (id) => {
    try {
        const response = await authService.get(ReportEndpoints.getById(id));
        return response.report || response.data || response;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch report');
    }
};

/**
 * Fetch reports for a specific patient
 */
export const fetchPatientReports = async (patientId) => {
    try {
        const response = await authService.get(ReportEndpoints.getPatientReports(patientId));
        return response.reports || response.data || response || [];
    } catch (error) {
        console.error('Failed to fetch patient reports:', error);
        return [];
    }
};

const reportService = {
    fetchReports,
    fetchReportById,
    fetchPatientReports,
};

export default reportService;

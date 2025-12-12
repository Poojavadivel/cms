/**
 * Pathology Service
 * Handles all API calls related to pathology/lab reports management
 */

import axios from 'axios';
import logger from './loggerService';

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const API_BASE = '/pathology';

const PathologyEndpoints = {
  getAll: `${API_BASE}/reports`,
  getById: (id) => `${API_BASE}/reports/${id}`,
  create: `${API_BASE}/reports`,
  update: (id) => `${API_BASE}/reports/${id}`,
  delete: (id) => `${API_BASE}/reports/${id}`,
  downloadReport: (id) => `${API_BASE}/reports/${id}/download`,
  uploadReport: `${API_BASE}/reports/upload`,
};

const fetchReports = async (params = {}) => {
  try {
    const { page = 0, limit = 100, q = '', status = '' } = params;
    
    let url = PathologyEndpoints.getAll;
    const queryParams = [];
    if (page) queryParams.push(`page=${page}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (q) queryParams.push(`q=${encodeURIComponent(q)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);
    
    let reportsData;
    if (Array.isArray(response.data)) {
      reportsData = response.data;
    } else if (response.data?.reports) {
      reportsData = response.data.reports;
    } else if (response.data?.data) {
      reportsData = response.data.data;
    } else {
      reportsData = [];
    }
    
    return reportsData.map(report => ({
      id: report._id || report.id,
      reportId: report.reportId || report.reportNumber || report._id,
      patientName: report.patientName || report.patient?.name || 'Unknown',
      patientId: report.patientId || report.patient?._id || '',
      testName: report.testName || report.testType || 'N/A',
      testType: report.testType || report.category || 'General',
      collectionDate: report.collectionDate || report.createdAt || '',
      reportDate: report.reportDate || report.updatedAt || '',
      status: report.status || (report.fileRef ? 'Completed' : 'Pending'),
      doctorName: report.doctorName || report.doctor?.name || '',
      technician: report.technician || report.uploaderName || '',
      fileRef: report.fileRef || report.file || null,
      remarks: report.remarks || report.notes || ''
    }));
  } catch (error) {
    logger.apiError('GET', PathologyEndpoints.getAll, error);
    console.error('Failed to fetch pathology reports from API:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch reports');
  }
};

const fetchReportById = async (id) => {
  try {
    logger.apiRequest('GET', PathologyEndpoints.getById(id));
    const response = await api.get(PathologyEndpoints.getById(id));
    logger.apiResponse('GET', PathologyEndpoints.getById(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('GET', PathologyEndpoints.getById(id), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch report');
  }
};

const createReport = async (reportData) => {
  try {
    logger.apiRequest('POST', PathologyEndpoints.create, reportData);
    const response = await api.post(PathologyEndpoints.create, reportData);
    logger.apiResponse('POST', PathologyEndpoints.create, response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('POST', PathologyEndpoints.create, error);
    throw new Error(error.response?.data?.message || 'Failed to create report');
  }
};

const updateReport = async (id, reportData) => {
  try {
    logger.apiRequest('PUT', PathologyEndpoints.update(id), reportData);
    const response = await api.put(PathologyEndpoints.update(id), reportData);
    logger.apiResponse('PUT', PathologyEndpoints.update(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('PUT', PathologyEndpoints.update(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update report');
  }
};

const deleteReport = async (id) => {
  try {
    logger.apiRequest('DELETE', PathologyEndpoints.delete(id));
    const response = await api.delete(PathologyEndpoints.delete(id));
    logger.apiResponse('DELETE', PathologyEndpoints.delete(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('DELETE', PathologyEndpoints.delete(id), error);
    throw new Error(error.response?.data?.message || 'Failed to delete report');
  }
};

const downloadReport = async (id, reportName = 'report') => {
  try {
    logger.apiRequest('GET', PathologyEndpoints.downloadReport(id));
    const response = await api.get(PathologyEndpoints.downloadReport(id), {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportName}_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    logger.apiResponse('GET', PathologyEndpoints.downloadReport(id), response.status, 'File downloaded');
    return response.data;
  } catch (error) {
    logger.apiError('GET', PathologyEndpoints.downloadReport(id), error);
    throw new Error(error.response?.data?.message || 'Failed to download report');
  }
};

const pathologyServiceExport = {
  fetchReports,
  fetchReportById,
  createReport,
  updateReport,
  deleteReport,
  downloadReport
};

export default pathologyServiceExport;

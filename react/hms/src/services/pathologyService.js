/**
 * Pathology Service
 * Handles all API calls related to pathology/lab reports management
 */

import axios from 'axios';
import logger from './loggerService';

const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
};

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api').replace(/\/$/, '') + '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

const API_BASE = 'pathology';

const PathologyEndpoints = {
  getAll: `${API_BASE}/reports`,
  getById: (id) => `${API_BASE}/reports/${id}`,
  create: `${API_BASE}/reports`,
  update: (id) => `${API_BASE}/reports/${id}`,
  delete: (id) => `${API_BASE}/reports/${id}`,
  downloadReport: (id) => `${API_BASE}/reports/${id}/download`,
  uploadReport: `${API_BASE}/reports/upload`,
  properReport: (id) => `reports-proper/pathology/${id}`,
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
      patientCode: report.patientCode || 'PAT-00',
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

    // Map the response to match UI expectations
    const report = response.data.report || response.data;
    return {
      id: report._id || report.id,
      reportId: report.reportId || report.reportNumber || report._id,
      patientName: report.patientName || report.patient?.name || 'Unknown',
      patientId: report.patientId || report.patient?._id || '',
      patientCode: report.patientCode || 'PAT-00',
      patientAge: report.patientAge || report.patient?.age || 'N/A',
      patientGender: report.patientGender || report.patient?.gender || 'N/A',
      testName: report.testName || report.testType || 'N/A',
      testType: report.testType || report.category || 'General',
      collectionDate: report.collectionDate || report.createdAt || '',
      reportDate: report.reportDate || report.updatedAt || '',
      status: report.status || (report.fileRef ? 'Completed' : 'Pending'),
      doctorName: report.doctorName || report.doctor?.name || 'N/A',
      technician: report.technician || report.uploaderName || 'N/A',
      fileRef: report.fileRef || report.file || null,
      remarks: report.remarks || report.notes || '',
      testResults: report.testResults || report.results || []
    };
  } catch (error) {
    logger.apiError('GET', PathologyEndpoints.getById(id), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch report');
  }
};

const createReport = async (reportData) => {
  try {
    const isFormData = reportData instanceof FormData;
    // Let browser set the boundary for FormData
    const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};

    logger.apiRequest('POST', PathologyEndpoints.create, reportData);
    const response = await api.post(PathologyEndpoints.create, reportData, config);
    logger.apiResponse('POST', PathologyEndpoints.create, response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('POST', PathologyEndpoints.create, error);
    throw new Error(error.response?.data?.message || 'Failed to create report');
  }
};

const updateReport = async (id, reportData) => {
  try {
    const isFormData = reportData instanceof FormData;
    // Let browser set the boundary for FormData
    const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};

    logger.apiRequest('PUT', PathologyEndpoints.update(id), reportData);
    const response = await api.put(PathologyEndpoints.update(id), reportData, config);
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

const downloadReport = async (id, fileName) => {
  try {
    logger.apiRequest('GET', PathologyEndpoints.downloadReport(id));
    const response = await api.get(PathologyEndpoints.downloadReport(id), {
      responseType: 'blob'
    });

    // Check if the response type is JSON (server error)
    if (response.data.type === 'application/json') {
      const text = await response.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || 'Report file not found on server');
    }

    // Extract filename from header if possible
    let finalFileName = fileName || `report_${id}.pdf`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch?.[1]) finalFileName = fileNameMatch[1];
    }

    // Ensure .pdf extension
    if (!finalFileName.toLowerCase().endsWith('.pdf')) {
      finalFileName += '.pdf';
    }

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', finalFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    logger.apiResponse('GET', PathologyEndpoints.downloadReport(id), response.status, 'File downloaded');
    return true;
  } catch (error) {
    logger.apiError('GET', PathologyEndpoints.downloadReport(id), error);

    // Attempt to extract descriptive error message
    let message = 'Failed to download report';
    if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
      const text = await error.response.data.text();
      const errorData = JSON.parse(text);
      message = errorData.message || message;
    } else if (error.message) {
      message = error.message;
    }

    throw new Error(message);
  }
};

// New helper to fetch the PDF blob and print it directly
const printReport = async (id) => {
  try {
    logger.apiRequest('GET', PathologyEndpoints.downloadReport(id));
    const response = await api.get(PathologyEndpoints.downloadReport(id), {
      responseType: 'blob'
    });

    // Check if the response type is JSON (server error)
    if (response.data.type === 'application/json') {
      const text = await response.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || 'Report file not available for printing');
    }

    const url = window.URL.createObjectURL(response.data);

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Clean up after small delay to ensure print dialog opened
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      }, 2000);
    };

    logger.apiResponse('GET', PathologyEndpoints.downloadReport(id), response.status, 'Print triggered');
    return true;
  } catch (error) {
    logger.apiError('GET', PathologyEndpoints.downloadReport(id), error);

    let message = 'Failed to print report';
    if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
      const text = await error.response.data.text();
      const errorData = JSON.parse(text);
      message = errorData.message || message;
    } else if (error.message) {
      message = error.message;
    }

    throw new Error(message);
  }
};

const downloadProperReport = async (id, fileName) => {
  try {
    const url = PathologyEndpoints.properReport(id);
    const response = await api.get(url, { responseType: 'blob' });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = urlBlob;
    link.setAttribute('download', fileName || `Report_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);
    return true;
  } catch (error) {
    if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
      const text = await error.response.data.text();
      const errorData = JSON.parse(text);
      console.error('❌ Server error during PDF download:', errorData);
      throw new Error(errorData.message || errorData.error || 'Failed to download report');
    }
    console.error('Failed to download proper report:', error);
    throw error;
  }
};

const printProperReport = async (id) => {
  try {
    const url = PathologyEndpoints.properReport(id);
    const response = await api.get(url, { responseType: 'blob' });
    const pdfUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(pdfUrl);
      }, 2000);
    };
    return true;
  } catch (error) {
    if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
      const text = await error.response.data.text();
      const errorData = JSON.parse(text);
      console.error('❌ Server error during PDF print:', errorData);
      throw new Error(errorData.message || errorData.error || 'Failed to print report');
    }
    console.error('Failed to print proper report:', error);
    throw error;
  }
};

/**
 * Create pathology reports from intake
 * Creates lab report orders when doctor prescribes tests during intake
 */
const createReportsFromIntake = async (intakeData) => {
  try {
    const { patientId, patientName, appointmentId, intakeId, pathologyRows } = intakeData;
    
    if (!pathologyRows || pathologyRows.length === 0) {
      return { success: true, message: 'No pathology tests to create', reports: [] };
    }

    console.log(`🧪 Creating ${pathologyRows.length} lab report(s) from intake...`);
    
    const createdReports = [];
    const errors = [];

    // Create each pathology test as a separate lab report
    for (const row of pathologyRows) {
      try {
        const reportPayload = {
          patientId: patientId,
          patientName: patientName,
          testName: row.testName || row.Test || 'Lab Test',
          testType: row.testType || row.Type || 'General',
          status: 'Pending',
          appointmentId: appointmentId,
          intakeId: intakeId,
          collectionDate: new Date().toISOString(),
          remarks: row.notes || row.Notes || '',
        };

        logger.apiRequest('POST', PathologyEndpoints.create, reportPayload);
        const response = await api.post(PathologyEndpoints.create, reportPayload);
        logger.apiResponse('POST', PathologyEndpoints.create, response.status, response.data);
        
        createdReports.push(response.data);
        console.log(`✅ Lab report created: ${reportPayload.testName}`);
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error(`❌ Failed to create lab report for ${row.testName}:`, errorMsg);
        errors.push({ test: row.testName, error: errorMsg });
      }
    }

    return {
      success: createdReports.length > 0,
      message: `Created ${createdReports.length} of ${pathologyRows.length} lab report(s)`,
      reports: createdReports,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    logger.apiError('POST', 'createReportsFromIntake', error);
    throw new Error(error.response?.data?.message || 'Failed to create pathology reports');
  }
};

const pathologyServiceExport = {
  fetchReports,
  fetchReportById,
  createReport,
  updateReport,
  deleteReport,
  downloadReport,
  printReport,
  downloadProperReport,
  printProperReport,
  createReportsFromIntake
};

export default pathologyServiceExport;

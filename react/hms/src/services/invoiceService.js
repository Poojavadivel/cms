/**
 * Invoice Service
 * Handles all API calls related to invoice and billing management
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

const API_BASE = '/payroll';

const InvoiceEndpoints = {
  getAll: API_BASE,
  getById: (id) => `${API_BASE}/${id}`,
  create: API_BASE,
  update: (id) => `${API_BASE}/${id}`,
  delete: (id) => `${API_BASE}/${id}`,
  downloadInvoice: (id) => `${API_BASE}/${id}/download`,
  updatePayment: (id) => `${API_BASE}/${id}/payment`,
};

const fetchInvoices = async (params = {}) => {
  try {
    const { page = 0, limit = 100, q = '', status = '' } = params;
    
    let url = InvoiceEndpoints.getAll;
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
    
    let invoicesData;
    if (Array.isArray(response.data)) {
      invoicesData = response.data;
    } else if (response.data?.payroll) {
      invoicesData = response.data.payroll;
    } else if (response.data?.data) {
      invoicesData = response.data.data;
    } else {
      invoicesData = [];
    }
    
    return invoicesData.map(payroll => ({
      id: payroll._id || payroll.id,
      invoiceNumber: payroll.staffCode || payroll._id,
      patientName: payroll.staffName || 'Unknown',
      patientId: payroll.staffId || '',
      date: payroll.paymentDate || payroll.createdAt || '',
      amount: parseFloat(payroll.grossSalary || payroll.totalEarnings || 0),
      paidAmount: parseFloat(payroll.netSalary || 0),
      balanceAmount: parseFloat((payroll.grossSalary || 0) - (payroll.netSalary || 0)),
      status: payroll.status || 'Pending',
      paymentMethod: payroll.paymentMode || '',
      items: [],
      discount: parseFloat(payroll.totalDeductions || 0),
      tax: 0
    }));
  } catch (error) {
    logger.apiError('GET', InvoiceEndpoints.getAll, error);
    console.error('Failed to fetch invoices from API:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch invoices');
  }
};

const fetchInvoiceById = async (id) => {
  try {
    logger.apiRequest('GET', InvoiceEndpoints.getById(id));
    const response = await api.get(InvoiceEndpoints.getById(id));
    logger.apiResponse('GET', InvoiceEndpoints.getById(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('GET', InvoiceEndpoints.getById(id), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch invoice');
  }
};

const createInvoice = async (invoiceData) => {
  try {
    logger.apiRequest('POST', InvoiceEndpoints.create, invoiceData);
    const response = await api.post(InvoiceEndpoints.create, invoiceData);
    logger.apiResponse('POST', InvoiceEndpoints.create, response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('POST', InvoiceEndpoints.create, error);
    throw new Error(error.response?.data?.message || 'Failed to create invoice');
  }
};

const updateInvoice = async (id, invoiceData) => {
  try {
    logger.apiRequest('PUT', InvoiceEndpoints.update(id), invoiceData);
    const response = await api.put(InvoiceEndpoints.update(id), invoiceData);
    logger.apiResponse('PUT', InvoiceEndpoints.update(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('PUT', InvoiceEndpoints.update(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update invoice');
  }
};

const deleteInvoice = async (id) => {
  try {
    logger.apiRequest('DELETE', InvoiceEndpoints.delete(id));
    const response = await api.delete(InvoiceEndpoints.delete(id));
    logger.apiResponse('DELETE', InvoiceEndpoints.delete(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('DELETE', InvoiceEndpoints.delete(id), error);
    throw new Error(error.response?.data?.message || 'Failed to delete invoice');
  }
};

const downloadInvoice = async (id, invoiceNumber = 'invoice') => {
  try {
    logger.apiRequest('GET', InvoiceEndpoints.downloadInvoice(id));
    const response = await api.get(InvoiceEndpoints.downloadInvoice(id), {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    logger.apiResponse('GET', InvoiceEndpoints.downloadInvoice(id), response.status, 'File downloaded');
    return response.data;
  } catch (error) {
    logger.apiError('GET', InvoiceEndpoints.downloadInvoice(id), error);
    throw new Error(error.response?.data?.message || 'Failed to download invoice');
  }
};

const updatePayment = async (id, paymentData) => {
  try {
    logger.apiRequest('PUT', InvoiceEndpoints.updatePayment(id), paymentData);
    const response = await api.put(InvoiceEndpoints.updatePayment(id), paymentData);
    logger.apiResponse('PUT', InvoiceEndpoints.updatePayment(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('PUT', InvoiceEndpoints.updatePayment(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update payment');
  }
};

const invoiceServiceExport = {
  fetchInvoices,
  fetchInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoice,
  updatePayment
};

export default invoiceServiceExport;

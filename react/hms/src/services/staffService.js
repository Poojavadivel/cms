/**
 * Staff Service
 * Handles all API calls related to staff management
 */

import axios from 'axios';
import logger from './loggerService';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Create axios instance with default config
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const API_BASE = '/staff';

const StaffEndpoints = {
  getAll: API_BASE,
  getById: (id) => `${API_BASE}/${id}`,
  create: API_BASE,
  update: (id) => `${API_BASE}/${id}`,
  delete: (id) => `${API_BASE}/${id}`,
  downloadReport: (id) => `${API_BASE}/${id}/report`,
  getByDepartment: (dept) => `${API_BASE}/department/${dept}`,
  getByRole: (role) => `${API_BASE}/role/${role}`,
};

/**
 * Fetch all staff members
 */
const fetchStaff = async () => {
  try {
    logger.apiRequest('GET', StaffEndpoints.getAll);
    const response = await api.get(StaffEndpoints.getAll);
    logger.apiResponse('GET', StaffEndpoints.getAll, response.status, response.data);
    
    // Handle different response formats from backend
    let staffData;
    if (Array.isArray(response.data)) {
      staffData = response.data;
    } else if (response.data?.staff) {
      staffData = response.data.staff;
    } else if (response.data?.data) {
      staffData = response.data.data;
    } else {
      staffData = [];
    }
    
    // Transform backend data to match frontend expectations
    return staffData.map(staff => ({
      id: staff._id || staff.id,
      name: staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
      employeeId: staff.staffId || staff.employeeId || staff.id || 'N/A',
      role: staff.role || staff.position || 'Staff',
      department: staff.department || 'General',
      email: staff.email || '',
      phone: staff.phone || staff.phoneNumber || staff.mobile || '',
      joinDate: staff.joinDate || staff.joiningDate || staff.createdAt || new Date().toISOString(),
      status: staff.status || (staff.isActive ? 'Active' : 'Inactive') || 'Active',
      gender: staff.gender || 'Unknown'
    }));
  } catch (error) {
    logger.apiError('GET', StaffEndpoints.getAll, error);
    console.error('Failed to fetch staff from API:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch staff members');
  }
};

/**
 * Fetch staff member by ID
 */
const fetchStaffById = async (id) => {
  try {
    logger.apiRequest('GET', StaffEndpoints.getById(id));
    const response = await api.get(StaffEndpoints.getById(id));
    logger.apiResponse('GET', StaffEndpoints.getById(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('GET', StaffEndpoints.getById(id), error);
    throw new Error(error.response?.data?.message || 'Failed to fetch staff member');
  }
};

/**
 * Create new staff member
 */
const createStaff = async (staffData) => {
  try {
    logger.apiRequest('POST', StaffEndpoints.create, staffData);
    const response = await api.post(StaffEndpoints.create, staffData);
    logger.apiResponse('POST', StaffEndpoints.create, response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('POST', StaffEndpoints.create, error);
    throw new Error(error.response?.data?.message || 'Failed to create staff member');
  }
};

/**
 * Update staff member
 */
const updateStaff = async (id, staffData) => {
  try {
    logger.apiRequest('PUT', StaffEndpoints.update(id), staffData);
    const response = await api.put(StaffEndpoints.update(id), staffData);
    logger.apiResponse('PUT', StaffEndpoints.update(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('PUT', StaffEndpoints.update(id), error);
    throw new Error(error.response?.data?.message || 'Failed to update staff member');
  }
};

/**
 * Delete staff member
 */
const deleteStaff = async (id) => {
  try {
    logger.apiRequest('DELETE', StaffEndpoints.delete(id));
    const response = await api.delete(StaffEndpoints.delete(id));
    logger.apiResponse('DELETE', StaffEndpoints.delete(id), response.status, response.data);
    return response.data;
  } catch (error) {
    logger.apiError('DELETE', StaffEndpoints.delete(id), error);
    throw new Error(error.response?.data?.message || 'Failed to delete staff member');
  }
};

/**
 * Download staff report
 */
const downloadStaffReport = async (id) => {
  try {
    logger.apiRequest('GET', StaffEndpoints.downloadReport(id));
    const response = await api.get(StaffEndpoints.downloadReport(id), {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `staff_${id}_report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    logger.apiResponse('GET', StaffEndpoints.downloadReport(id), response.status, 'File downloaded');
    return response.data;
  } catch (error) {
    logger.apiError('GET', StaffEndpoints.downloadReport(id), error);
    throw new Error(error.response?.data?.message || 'Failed to download report');
  }
};

/**
 * Mock data for development/testing
 */
const getMockStaffData = () => {
  return [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      employeeId: 'EMP001',
      role: 'Doctor',
      department: 'Cardiology',
      phone: '+1 234 567 8901',
      email: 'sarah.johnson@hospital.com',
      joinDate: '2020-01-15',
      status: 'Active',
      gender: 'Female'
    },
    {
      id: 2,
      name: 'Michael Chen',
      employeeId: 'EMP002',
      role: 'Nurse',
      department: 'Emergency',
      phone: '+1 234 567 8902',
      email: 'michael.chen@hospital.com',
      joinDate: '2019-06-20',
      status: 'Active',
      gender: 'Male'
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      employeeId: 'EMP003',
      role: 'Doctor',
      department: 'Pediatrics',
      phone: '+1 234 567 8903',
      email: 'emily.rodriguez@hospital.com',
      joinDate: '2021-03-10',
      status: 'Active',
      gender: 'Female'
    },
    {
      id: 4,
      name: 'James Wilson',
      employeeId: 'EMP004',
      role: 'Lab Technician',
      department: 'Pathology',
      phone: '+1 234 567 8904',
      email: 'james.wilson@hospital.com',
      joinDate: '2018-09-05',
      status: 'Active',
      gender: 'Male'
    },
    {
      id: 5,
      name: 'Dr. Priya Sharma',
      employeeId: 'EMP005',
      role: 'Doctor',
      department: 'Neurology',
      phone: '+1 234 567 8905',
      email: 'priya.sharma@hospital.com',
      joinDate: '2022-02-18',
      status: 'Active',
      gender: 'Female'
    },
    {
      id: 6,
      name: 'David Brown',
      employeeId: 'EMP006',
      role: 'Pharmacist',
      department: 'Pharmacy',
      phone: '+1 234 567 8906',
      email: 'david.brown@hospital.com',
      joinDate: '2020-07-22',
      status: 'On Leave',
      gender: 'Male'
    },
    {
      id: 7,
      name: 'Lisa Anderson',
      employeeId: 'EMP007',
      role: 'Receptionist',
      department: 'Administration',
      phone: '+1 234 567 8907',
      email: 'lisa.anderson@hospital.com',
      joinDate: '2019-11-30',
      status: 'Active',
      gender: 'Female'
    },
    {
      id: 8,
      name: 'Dr. Robert Taylor',
      employeeId: 'EMP008',
      role: 'Doctor',
      department: 'Orthopedics',
      phone: '+1 234 567 8908',
      email: 'robert.taylor@hospital.com',
      joinDate: '2017-04-12',
      status: 'Active',
      gender: 'Male'
    },
    {
      id: 9,
      name: 'Maria Garcia',
      employeeId: 'EMP009',
      role: 'Nurse',
      department: 'Surgery',
      phone: '+1 234 567 8909',
      email: 'maria.garcia@hospital.com',
      joinDate: '2021-08-25',
      status: 'Active',
      gender: 'Female'
    },
    {
      id: 10,
      name: 'Dr. Ahmed Hassan',
      employeeId: 'EMP010',
      role: 'Doctor',
      department: 'Radiology',
      phone: '+1 234 567 8910',
      email: 'ahmed.hassan@hospital.com',
      joinDate: '2020-10-14',
      status: 'Inactive',
      gender: 'Male'
    },
    {
      id: 11,
      name: 'Jennifer Lee',
      employeeId: 'EMP011',
      role: 'Physiotherapist',
      department: 'Physiotherapy',
      phone: '+1 234 567 8911',
      email: 'jennifer.lee@hospital.com',
      joinDate: '2019-12-08',
      status: 'Active',
      gender: 'Female'
    },
    {
      id: 12,
      name: 'Dr. Carlos Martinez',
      employeeId: 'EMP012',
      role: 'Doctor',
      department: 'General Medicine',
      phone: '+1 234 567 8912',
      email: 'carlos.martinez@hospital.com',
      joinDate: '2021-05-19',
      status: 'Active',
      gender: 'Male'
    }
  ];
};

const staffService = {
  fetchStaff,
  fetchStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  downloadStaffReport,
  getMockStaffData
};

export default staffService;

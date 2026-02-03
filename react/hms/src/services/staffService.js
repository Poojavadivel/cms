/**
 * Staff Service - Complete Implementation
 * Matches Flutter functionality exactly
 */

import axios from 'axios';
import logger from './loggerService';
import { Staff } from '../models/Staff';

const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers['x-auth-token'] = token;
  return config;
});

// Cache for staff data (mimics Flutter's _staffList)
let staffCache = [];
let currentStaff = null;

/**
 * Fetch all staff members with caching
 */
const fetchStaffs = async (forceRefresh = false) => {
  try {
    if (staffCache.length > 0 && !forceRefresh) {
      return staffCache;
    }

    logger.apiRequest('GET', '/staff');
    const response = await api.get('/staff');
    logger.apiResponse('GET', '/staff', response.status, response.data);
    
    // Handle multiple response formats (Flutter compatibility)
    let data;
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data?.staff) {
      data = response.data.staff;
    } else if (response.data?.data) {
      data = response.data.data;
    } else {
      throw new Error('Unexpected response format');
    }
    
    staffCache = data.map(item => Staff.fromJSON(item));
    return staffCache;
  } catch (error) {
    logger.apiError('GET', '/staff', error);
    throw error;
  }
};

/**
 * Fetch single staff by ID
 */
const fetchStaffById = async (id) => {
  try {
    logger.apiRequest('GET', `/staff/${id}`);
    const response = await api.get(`/staff/${id}`);
    logger.apiResponse('GET', `/staff/${id}`, response.status, response.data);
    
    // Handle wrapped response
    const data = response.data?.staff || response.data?.data || response.data;
    const staff = Staff.fromJSON(data);
    
    currentStaff = staff;
    
    // Update cache
    const idx = staffCache.findIndex(s => s.id === staff.id);
    if (idx === -1) {
      staffCache.push(staff);
    } else {
      staffCache[idx] = staff;
    }
    
    return staff;
  } catch (error) {
    logger.apiError('GET', `/staff/${id}`, error);
    throw error;
  }
};

/**
 * Create new staff member
 */
const createStaff = async (staffDraft) => {
  try {
    const payload = staffDraft instanceof Staff ? staffDraft.toJSON() : staffDraft;
    
    logger.apiRequest('POST', '/staff', payload);
    const response = await api.post('/staff', payload);
    logger.apiResponse('POST', '/staff', response.status, response.data);
    
    const data = response.data?.staff || response.data?.data || response.data;
    const created = Staff.fromJSON(data);
    
    // Add to cache
    staffCache.unshift(created);
    
    return created;
  } catch (error) {
    logger.apiError('POST', '/staff', error);
    throw error;
  }
};

/**
 * Update staff member
 */
const updateStaff = async (staffDraft) => {
  try {
    const payload = staffDraft instanceof Staff ? staffDraft.toJSON() : staffDraft;
    const id = payload._id || payload.id;
    
    logger.apiRequest('PUT', `/staff/${id}`, payload);
    const response = await api.put(`/staff/${id}`, payload);
    logger.apiResponse('PUT', `/staff/${id}`, response.status, response.data);
    
    // Handle different success response formats
    if (response.data?.success === true || response.data?.status === 200) {
      // Success without returning data - update cache with our draft
      const idx = staffCache.findIndex(s => s.id === id);
      if (idx !== -1) {
        staffCache[idx] = staffDraft instanceof Staff ? staffDraft : Staff.fromJSON(staffDraft);
      }
      if (currentStaff?.id === id) {
        currentStaff = staffDraft instanceof Staff ? staffDraft : Staff.fromJSON(staffDraft);
      }
      return true;
    }
    
    const data = response.data?.staff || response.data?.data || response.data;
    if (data && typeof data === 'object') {
      const updated = Staff.fromJSON(data);
      const idx = staffCache.findIndex(s => s.id === updated.id);
      if (idx !== -1) {
        staffCache[idx] = updated;
      } else {
        staffCache.push(updated);
      }
      if (currentStaff?.id === updated.id) {
        currentStaff = updated;
      }
      return true;
    }
    
    return false;
  } catch (error) {
    logger.apiError('PUT', `/staff/${staffDraft.id}`, error);
    throw error;
  }
};

/**
 * Delete staff member
 */
const deleteStaff = async (id) => {
  try {
    logger.apiRequest('DELETE', `/staff/${id}`);
    const response = await api.delete(`/staff/${id}`);
    logger.apiResponse('DELETE', `/staff/${id}`, response.status, response.data);
    
    if (response.data?.success === true || response.data?.status === 200 || response.status === 200) {
      staffCache = staffCache.filter(s => s.id !== id);
      if (currentStaff?.id === id) currentStaff = null;
      return true;
    }
    
    return false;
  } catch (error) {
    logger.apiError('DELETE', `/staff/${id}`, error);
    throw error;
  }
};

/**
 * Download staff report PDF
 */
const downloadStaffReport = async (staffId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found. Please login again.'
      };
    }

    const url = `${api.defaults.baseURL}/reports-proper/staff/${staffId}`;
    
    const response = await fetch(url, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const blob = await response.blob();
      
      // Get filename from header or create default
      let filename = `Staff_Report_${Date.now()}.pdf`;
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(blobUrl);

      return {
        success: true,
        message: 'Staff report downloaded successfully',
        filename
      };
    } else if (response.status === 404) {
      return {
        success: false,
        message: 'Staff member not found'
      };
    } else {
      return {
        success: false,
        message: `Failed to generate staff report: ${response.status}`
      };
    }
  } catch (error) {
    console.error('Error downloading staff report:', error);
    return {
      success: false,
      message: `Error downloading staff report: ${error.message}`
    };
  }
};

/**
 * Download doctor report PDF (for staff with doctor role)
 */
const downloadDoctorReport = async (doctorId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found. Please login again.'
      };
    }

    const url = `${api.defaults.baseURL}/reports-proper/doctor/${doctorId}`;
    
    const response = await fetch(url, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const blob = await response.blob();
      
      let filename = `Doctor_Report_${Date.now()}.pdf`;
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(blobUrl);

      return {
        success: true,
        message: 'Doctor report downloaded successfully',
        filename
      };
    } else if (response.status === 404) {
      return {
        success: false,
        message: 'Doctor not found'
      };
    } else {
      return {
        success: false,
        message: `Failed to generate doctor report: ${response.status}`
      };
    }
  } catch (error) {
    console.error('Error downloading doctor report:', error);
    return {
      success: false,
      message: `Error downloading doctor report: ${error.message}`
    };
  }
};

/**
 * Generate Staff ID based on department and designation
 */
const generateStaffId = async (department, designation) => {
  try {
    logger.apiRequest('POST', '/staff/generate-id', { department, designation });
    const response = await api.post('/staff/generate-id', { department, designation });
    logger.apiResponse('POST', '/staff/generate-id', response.status, response.data);
    
    return {
      success: true,
      patientFacingId: response.data?.patientFacingId || null,
      message: response.data?.message || ''
    };
  } catch (error) {
    logger.apiError('POST', '/staff/generate-id', error);
    return {
      success: false,
      patientFacingId: null,
      message: error.response?.data?.message || 'Failed to generate Staff ID'
    };
  }
};

/**
 * Check if Staff ID is unique
 */
const checkStaffIdUnique = async (patientFacingId, excludeId = null) => {
  try {
    if (!patientFacingId || !patientFacingId.trim()) {
      return { isUnique: false, message: 'Staff ID is required' };
    }

    const normalizedId = patientFacingId.trim().toUpperCase();
    const url = `/staff/check-unique/${encodeURIComponent(normalizedId)}${excludeId ? `?excludeId=${excludeId}` : ''}`;
    
    logger.apiRequest('GET', url);
    const response = await api.get(url);
    logger.apiResponse('GET', url, response.status, response.data);
    
    return {
      isUnique: response.data?.isUnique ?? false,
      message: response.data?.message || ''
    };
  } catch (error) {
    logger.apiError('GET', `/staff/check-unique/${patientFacingId}`, error);
    return {
      isUnique: false,
      message: error.response?.data?.message || 'Failed to check Staff ID uniqueness'
    };
  }
};

/**
 * Find staff locally (no network)
 */
const findLocalStaffById = (id) => {
  return staffCache.find(s => s.id === id) || null;
};

/**
 * Clear staff cache (on logout)
 */
const clearStaffCache = () => {
  staffCache = [];
  currentStaff = null;
};

/**
 * Get current staff
 */
const getCurrentStaff = () => currentStaff;

/**
 * Get staff list
 */
const getStaffList = () => [...staffCache];

const staffService = {
  fetchStaffs,
  fetchStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  downloadStaffReport,
  downloadDoctorReport,
  generateStaffId,
  checkStaffIdUnique,
  findLocalStaffById,
  clearStaffCache,
  getCurrentStaff,
  getStaffList
};

export default staffService;

/**
 * Mock data for development/testing
 */
export const getMockStaffData = () => {
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

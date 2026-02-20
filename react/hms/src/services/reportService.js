/**
 * reportService.js
 * React equivalent of Flutter's ReportService.dart
 * Handles PDF report generation and download for various entities
 */

import axios from 'axios';
import { ReportsEndpoints } from './apiConstants';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
};

/**
 * Create axios instance with auth headers
 */
const createAxiosInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
    headers: {
      'Content-Type': 'application/json',
      ...(token && {
        'x-auth-token': token,
        'Authorization': `Bearer ${token}`
      })
    }
  });
};

class ReportService {
  /**
   * Download Patient Report PDF
   * @param {string} patientId - The patient ID
   * @returns {Promise<Object>} Response with success status and message
   */
  async downloadPatientReport(patientId) {
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get(
        ReportsEndpoints.patientReport(patientId),
        {
          responseType: 'blob', // Important for PDF download
        }
      );

      // Extract filename from content-disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Patient_Report_${Date.now()}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Patient report downloaded successfully',
        filename,
      };
    } catch (error) {
      console.error('Error downloading patient report:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to download patient report',
      };
    }
  }

  /**
   * Download Doctor Report PDF
   * @param {string} doctorId - The doctor ID
   * @returns {Promise<Object>} Response with success status and message
   */
  async downloadDoctorReport(doctorId) {
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get(
        ReportsEndpoints.doctorReport(doctorId),
        {
          responseType: 'blob',
        }
      );

      const contentDisposition = response.headers['content-disposition'];
      let filename = `Doctor_Report_${Date.now()}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Doctor report downloaded successfully',
        filename,
      };
    } catch (error) {
      console.error('Error downloading doctor report:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to download doctor report',
      };
    }
  }

  /**
   * Download Staff Report PDF
   * @param {string} staffId - The staff ID
   * @returns {Promise<Object>} Response with success status and message
   */
  async downloadStaffReport(staffId) {
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get(
        ReportsEndpoints.staffReport(staffId),
        {
          responseType: 'blob',
        }
      );

      const contentDisposition = response.headers['content-disposition'];
      let filename = `Staff_Report_${Date.now()}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Staff report downloaded successfully',
        filename,
      };
    } catch (error) {
      console.error('Error downloading staff report:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to download staff report',
      };
    }
  }

  /**
   * Download Prescription PDF
   * @param {string} prescriptionId - The prescription ID
   * @param {string} patientName - The patient name (for filename)
   * @returns {Promise<Object>} Response with success status and message
   */
  async downloadPrescription(prescriptionId, patientName) {
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get(
        ReportsEndpoints.prescriptionPdf(prescriptionId),
        {
          responseType: 'blob',
        }
      );

      const contentDisposition = response.headers['content-disposition'];
      let filename = `Prescription_${patientName}_${Date.now()}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Prescription downloaded successfully',
        filename,
      };
    } catch (error) {
      console.error('Error downloading prescription:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to download prescription',
      };
    }
  }

  /**
   * Get pathology reports list
   * @returns {Promise<Object>} Response with reports data
   */
  async getPathologyReports() {
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get(ReportsEndpoints.pathologyReports);
      return {
        success: true,
        reports: response.data?.reports || response.data || [],
      };
    } catch (error) {
      console.error('Error fetching pathology reports:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch reports',
        reports: [],
      };
    }
  }

  /**
   * View PDF or Image in a new tab
   * Uses the public PDF endpoint for easy browser viewing
   * @param {string} fileId - The file ID from database (pdfRef or imageRef)
   */
  viewPdf(fileId) {
    if (!fileId) {
      console.error('No file ID provided');
      alert('No file available to view');
      return;
    }
    const baseUrl = process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api';
    const url = `${baseUrl}/scanner-enterprise/pdf-public/${fileId}`;
    console.log('📄 Opening file in new tab:', url);
    window.open(url, '_blank');
  }

  /**
   * View image in a modal or new tab
   * @param {string} imageId - The image ID from database
   */
  viewImage(imageId) {
    if (!imageId) {
      console.error('No image ID provided');
      alert('No image available to view');
      return;
    }
    const baseUrl = process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api';
    const url = `${baseUrl}/scanner-enterprise/pdf-public/${imageId}`;
    console.log('🖼️ Opening image in new tab:', url);
    window.open(url, '_blank');
  }

  /**
   * Download test report file
   * @param {FormData} formData - Form data with file and metadata
   * @returns {Promise<Object>} Response with success status
   */
  async uploadTestReport(formData) {
    try {
      const token = getAuthToken();
      const axiosInstance = axios.create({
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const response = await axiosInstance.post(
        ReportsEndpoints.uploadTestReport,
        formData
      );

      return {
        success: true,
        message: 'Test report uploaded successfully',
        data: response.data,
      };
    } catch (error) {
      console.error('Error uploading test report:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to upload test report',
      };
    }
  }
}

// Export singleton instance
const reportService = new ReportService();
export default reportService;

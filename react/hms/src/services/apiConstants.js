/**
 * apiConstants.js
 * API endpoint constants
 * 
 * This is the React equivalent of Flutter's api_constants.dart
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api';

/**
 * Authentication endpoints
 */
export const AuthEndpoints = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  validateToken: `${API_BASE_URL}/auth/validate-token`,
  logout: `${API_BASE_URL}/auth/logout`,
  refreshToken: `${API_BASE_URL}/auth/refresh-token`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
  changePassword: `${API_BASE_URL}/auth/change-password`,
};

/**
 * User endpoints
 */
export const UserEndpoints = {
  getProfile: `${API_BASE_URL}/users/profile`,
  updateProfile: `${API_BASE_URL}/users/profile`,
  uploadAvatar: `${API_BASE_URL}/users/avatar`,
};

/**
 * Patient endpoints
 */
export const PatientEndpoints = {
  getAll: `${API_BASE_URL}/patients`,
  getById: (id) => `${API_BASE_URL}/patients/${id}`,
  create: `${API_BASE_URL}/patients`,
  update: (id) => `${API_BASE_URL}/patients/${id}`,
  delete: (id) => `${API_BASE_URL}/patients/${id}`,
  search: `${API_BASE_URL}/patients/search`,
  getDoctorPatients: `${API_BASE_URL}/patients/doctor`,
  getVitals: (id) => `${API_BASE_URL}/patients/${id}/vitals`,
  addVitals: (id) => `${API_BASE_URL}/patients/${id}/vitals`,
};

/**
 * Appointment endpoints
 */
export const AppointmentEndpoints = {
  getAll: `${API_BASE_URL}/appointments`,
  getById: (id) => `${API_BASE_URL}/appointments/${id}`,
  create: `${API_BASE_URL}/appointments`,
  update: (id) => `${API_BASE_URL}/appointments/${id}`,
  delete: (id) => `${API_BASE_URL}/appointments/${id}`,
  getDoctorAppointments: `${API_BASE_URL}/appointments/doctor`,
  getPatientAppointments: (patientId) => `${API_BASE_URL}/appointments/patient/${patientId}`,
  updateStatus: (id) => `${API_BASE_URL}/appointments/${id}/status`,
  getToday: `${API_BASE_URL}/appointments/today`,
  getUpcoming: `${API_BASE_URL}/appointments/upcoming`,
};

/**
 * Intake endpoints
 */
export const IntakeEndpoints = {
  create: (patientId) => `${API_BASE_URL}/intake/${patientId}/intake`,
  get: (patientId) => `${API_BASE_URL}/intake/${patientId}/intake`,
};

/**
 * Doctor endpoints
 */
export const DoctorEndpoints = {
  getAll: `${API_BASE_URL}/doctors`,
  getById: (id) => `${API_BASE_URL}/doctors/${id}`,
  create: `${API_BASE_URL}/doctors`,
  update: (id) => `${API_BASE_URL}/doctors/${id}`,
  delete: (id) => `${API_BASE_URL}/doctors/${id}`,
  getSchedule: (id) => `${API_BASE_URL}/doctors/${id}/schedule`,
  getDashboard: `${API_BASE_URL}/doctors/dashboard`,
  getMyPatients: `${API_BASE_URL}/doctors/patients/my`,
};

/**
 * Staff endpoints
 */
export const StaffEndpoints = {
  getAll: `${API_BASE_URL}/staff`,
  getById: (id) => `${API_BASE_URL}/staff/${id}`,
  create: `${API_BASE_URL}/staff`,
  update: (id) => `${API_BASE_URL}/staff/${id}`,
  delete: (id) => `${API_BASE_URL}/staff/${id}`,
  search: `${API_BASE_URL}/staff/search`,
};

/**
 * Pharmacy endpoints
 */
export const PharmacyEndpoints = {
  getMedicines: `${API_BASE_URL}/pharmacy/medicines`,
  getMedicineById: (id) => `${API_BASE_URL}/pharmacy/medicines/${id}`,
  createMedicine: `${API_BASE_URL}/pharmacy/medicines`,
  updateMedicine: (id) => `${API_BASE_URL}/pharmacy/medicines/${id}`,
  deleteMedicine: (id) => `${API_BASE_URL}/pharmacy/medicines/${id}`,
  getBatches: `${API_BASE_URL}/pharmacy/batches`,
  createBatch: `${API_BASE_URL}/pharmacy/batches`,
  getPrescriptions: `${API_BASE_URL}/pharmacy/prescriptions`,
  getPendingPrescriptions: `${API_BASE_URL}/pharmacy/pending-prescriptions`,
  getPrescriptionById: (id) => `${API_BASE_URL}/pharmacy/prescriptions/${id}`,
  createPrescriptionFromIntake: `${API_BASE_URL}/pharmacy/prescriptions/create-from-intake`,
  dispensePrescription: (intakeId) => `${API_BASE_URL}/pharmacy/prescriptions/${intakeId}/dispense`,
};

/**
 * Pathology endpoints
 */
export const PathologyEndpoints = {
  getTests: `${API_BASE_URL}/pathology/tests`,
  getTestById: (id) => `${API_BASE_URL}/pathology/tests/${id}`,
  createTest: `${API_BASE_URL}/pathology/tests`,
  updateTest: (id) => `${API_BASE_URL}/pathology/tests/${id}`,
  deleteTest: (id) => `${API_BASE_URL}/pathology/tests/${id}`,
  getReports: `${API_BASE_URL}/pathology/reports`,
  getReportById: (id) => `${API_BASE_URL}/pathology/reports/${id}`,
  createReport: `${API_BASE_URL}/pathology/reports`,
  updateReport: (id) => `${API_BASE_URL}/pathology/reports/${id}`,
};

/**
 * Dashboard endpoints
 */
export const DashboardEndpoints = {
  getStats: `${API_BASE_URL}/dashboard/stats`,
  getRecentActivity: `${API_BASE_URL}/dashboard/activity`,
  getChartData: `${API_BASE_URL}/dashboard/charts`,
};

/**
 * Admin endpoints
 */
export const AdminEndpoints = {
  getUsers: `${API_BASE_URL}/admin/users`,
  getUserById: (id) => `${API_BASE_URL}/admin/users/${id}`,
  createUser: `${API_BASE_URL}/admin/users`,
  updateUser: (id) => `${API_BASE_URL}/admin/users/${id}`,
  deleteUser: (id) => `${API_BASE_URL}/admin/users/${id}`,
  getSystemSettings: `${API_BASE_URL}/admin/settings`,
  updateSystemSettings: `${API_BASE_URL}/admin/settings`,
  getLogs: `${API_BASE_URL}/admin/logs`,
};

/**
 * Chatbot endpoints
 */
export const ChatbotEndpoints = {
  chat: `${API_BASE_URL}/chatbot/chat`,
  feedback: `${API_BASE_URL}/chatbot/feedback`,
  history: `${API_BASE_URL}/chatbot/history`,
  clearHistory: `${API_BASE_URL}/chatbot/history/clear`,
};

/**
 * Reports endpoints (matching Flutter's ReportService)
 */
export const ReportsEndpoints = {
  patientReport: (patientId) => `${API_BASE_URL}/reports-proper/patient/${patientId}`,
  doctorReport: (doctorId) => `${API_BASE_URL}/reports-proper/doctor/${doctorId}`,
  staffReport: (staffId) => `${API_BASE_URL}/reports-proper/staff/${staffId}`,
  prescriptionPdf: (prescriptionId) => `${API_BASE_URL}/pharmacy/prescriptions/${prescriptionId}/pdf`,
  pathologyReports: `${API_BASE_URL}/pathology/reports`,
  uploadTestReport: `${API_BASE_URL}/pathology/reports/upload`,
};

/**
 * Legacy Report endpoints (keeping for compatibility)
 */
export const ReportEndpoints = {
  generate: `${API_BASE_URL}/reports/generate`,
  getAll: `${API_BASE_URL}/reports`,
  getById: (id) => `${API_BASE_URL}/reports/${id}`,
  download: (id) => `${API_BASE_URL}/reports/${id}/download`,
  export: `${API_BASE_URL}/reports/export`,
};

/**
 * Notification endpoints
 */
export const NotificationEndpoints = {
  getAll: `${API_BASE_URL}/notifications`,
  markAsRead: (id) => `${API_BASE_URL}/notifications/${id}/read`,
  markAllAsRead: `${API_BASE_URL}/notifications/read-all`,
  delete: (id) => `${API_BASE_URL}/notifications/${id}`,
  getUnreadCount: `${API_BASE_URL}/notifications/unread-count`,
};

/**
 * File upload endpoints
 */
export const FileEndpoints = {
  upload: `${API_BASE_URL}/files/upload`,
  download: (id) => `${API_BASE_URL}/files/${id}/download`,
  delete: (id) => `${API_BASE_URL}/files/${id}`,
};

/**
 * Scanner/OCR endpoints - Medical document scanning
 * Matches Flutter ScannerEndpoints
 */
export const ScannerEndpoints = {
  scan: `${API_BASE_URL}/scanner-enterprise/scan`,
  upload: `${API_BASE_URL}/scanner-enterprise/upload`,
  getReports: (patientId) => `${API_BASE_URL}/scanner-enterprise/reports/${patientId}`,
  getReportDetails: (reportId) => `${API_BASE_URL}/scanner-enterprise/report/${reportId}`,
  getPdf: (pdfId) => `${API_BASE_URL}/scanner-enterprise/pdf/${pdfId}`,
  deletePdf: (pdfId) => `${API_BASE_URL}/scanner-enterprise/pdf/${pdfId}`,
  // New separate endpoints
  getPrescriptions: (patientId) => `${API_BASE_URL}/scanner-enterprise/prescriptions/${patientId}`,
  getLabReports: (patientId) => `${API_BASE_URL}/scanner-enterprise/lab-reports/${patientId}`,
  getMedicalHistory: (patientId) => `${API_BASE_URL}/scanner-enterprise/medical-history/${patientId}`,
};

// Export as named constant to avoid ESLint warning
const apiConstants = {
  AuthEndpoints,
  UserEndpoints,
  ReportsEndpoints,
  PatientEndpoints,
  AppointmentEndpoints,
  DoctorEndpoints,
  StaffEndpoints,
  PharmacyEndpoints,
  PathologyEndpoints,
  DashboardEndpoints,
  AdminEndpoints,
  ChatbotEndpoints,
  ReportEndpoints,
  NotificationEndpoints,
  FileEndpoints,
  ScannerEndpoints,
  API_BASE_URL,
};

// Default export
export default apiConstants;

import { apiDelete, apiGet, apiPost, apiPut } from './mockBackend';

// A small API layer that mirrors future REST usage (Node/Express-ready).
export const settingsApi = {
  getGeneralSettings: () => apiGet('/api/settings/general'),
  updateGeneralSettings: (payload) => apiPut('/api/settings/general', payload),

  getFacultyProfile: () => apiGet('/api/faculty/profile'),
  updateFacultyProfile: (payload) => apiPut('/api/faculty/profile', payload),
  getFacultyCourseNotifications: () => apiGet('/api/faculty/course-notifications'),
  updateFacultyCourseNotifications: (payload) => apiPut('/api/faculty/course-notifications', payload),
  getFacultyReminderSettings: () => apiGet('/api/faculty/reminder-settings'),
  updateFacultyReminderSettings: (payload) => apiPut('/api/faculty/reminder-settings', payload),

  getFinanceProfile: () => apiGet('/api/finance/profile'),
  updateFinanceProfile: (payload) => apiPut('/api/finance/profile', payload),
  getFinancePaymentNotifications: () => apiGet('/api/finance/payment-notifications'),
  updateFinancePaymentNotifications: (payload) => apiPut('/api/finance/payment-notifications', payload),
  getFinanceRefundAlerts: () => apiGet('/api/finance/refund-alerts'),
  updateFinanceRefundAlerts: (payload) => apiPut('/api/finance/refund-alerts', payload),
  changePassword: (payload) => apiPut('/api/security/change-password', payload),

  getUsers: () => apiGet('/api/users'),
  createUser: (payload) => apiPost('/api/users', payload),
  updateUser: (id, payload) => apiPut(`/api/users/${id}`, payload),
  deleteUser: (id) => apiDelete(`/api/users/${id}`),
  replaceUsers: (payload) => apiPut('/api/users', payload),

  getDepartments: () => apiGet('/api/departments'),
  createDepartment: (payload) => apiPost('/api/departments', payload),
  updateDepartment: (id, payload) => apiPut(`/api/departments/${id}`, payload),
  replaceDepartments: (payload) => apiPut('/api/departments', payload),

  getAcademicSettings: () => apiGet('/api/settings/academic'),
  updateAcademicSettings: (payload) => apiPut('/api/settings/academic', payload),

  getFinanceSettings: () => apiGet('/api/settings/finance'),
  updateFinanceSettings: (payload) => apiPut('/api/settings/finance', payload),

  getNotificationSettings: () => apiGet('/api/settings/notifications'),
  updateNotificationSettings: (payload) => apiPut('/api/settings/notifications', payload),

  getSecuritySettings: () => apiGet('/api/settings/security'),
  updateSecuritySettings: (payload) => apiPut('/api/settings/security', payload),

  getIntegrationSettings: () => apiGet('/api/settings/integrations'),
  updateIntegrationSettings: (payload) => apiPut('/api/settings/integrations', payload),

  getDataManagementSettings: () => apiGet('/api/settings/data-management'),
  updateDataManagementSettings: (payload) => apiPut('/api/settings/data-management', payload),

  triggerBackup: () => apiPost('/api/system/backup'),
  triggerRestore: (backupId) => apiPost('/api/system/restore', { backupId }),
  exportData: () => apiGet('/api/system/export'),

  getMonitoringSnapshot: () => apiGet('/api/system/monitoring'),
};

import { apiDelete, apiGet, apiPost, apiPut } from './mockBackend';

// A small API layer that mirrors future REST usage (Node/Express-ready).
export const settingsApi = {
  getGeneralSettings: () => apiGet('/api/settings/general'),
  updateGeneralSettings: (payload) => apiPut('/api/settings/general', payload),

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

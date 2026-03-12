/**
 * DashboardService.js
 * API service for Admin Dashboard
 */

import { apiCall } from '../../../services/apiHelpers';
import { DashboardEndpoints, AdminEndpoints } from '../../../services/apiConstants';

export const DashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    return await apiCall('GET', DashboardEndpoints.getStats, null, {
      module: 'Admin Dashboard',
      action: 'Get Statistics',
    });
  },

  /**
   * Get recent activity
   */
  getRecentActivity: async () => {
    return await apiCall('GET', DashboardEndpoints.getRecentActivity, null, {
      module: 'Admin Dashboard',
      action: 'Get Recent Activity',
    });
  },

  /**
   * Get chart data
   */
  getChartData: async (type) => {
    return await apiCall('GET', `${DashboardEndpoints.getChartData}?type=${type}`, null, {
      module: 'Admin Dashboard',
      action: `Get Chart Data - ${type}`,
    });
  },

  /**
   * Get system overview
   */
  getSystemOverview: async () => {
    return await apiCall('GET', `${AdminEndpoints.getSystemSettings}/overview`, null, {
      module: 'Admin Dashboard',
      action: 'Get System Overview',
    });
  },

  /**
   * Get quick stats for cards
   */
  getQuickStats: async () => {
    return await apiCall('GET', `${DashboardEndpoints.getStats}/quick`, null, {
      module: 'Admin Dashboard',
      action: 'Get Quick Stats',
    });
  },
};

export default DashboardService;

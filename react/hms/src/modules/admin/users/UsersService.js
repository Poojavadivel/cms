/**
 * UsersService.js
 * API service for User Management
 */

import { apiCall } from '../../../services/apiHelpers';
import { StaffEndpoints } from '../../../services/apiConstants';

export const UsersService = {
  /**
   * Get all users
   */
  getAllUsers: async () => {
    return await apiCall('GET', StaffEndpoints.getAll(), null, {
      module: 'Admin Users',
      action: 'Get All Users',
    });
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId) => {
    return await apiCall('GET', StaffEndpoints.getById(userId), null, {
      module: 'Admin Users',
      action: `Get User ${userId}`,
    });
  },

  /**
   * Create new user
   */
  createUser: async (userData) => {
    return await apiCall('POST', StaffEndpoints.create(), userData, {
      module: 'Admin Users',
      action: 'Create User',
    });
  },

  /**
   * Update user
   */
  updateUser: async (userId, userData) => {
    return await apiCall('PUT', StaffEndpoints.update(userId), userData, {
      module: 'Admin Users',
      action: `Update User ${userId}`,
    });
  },

  /**
   * Delete user
   */
  deleteUser: async (userId) => {
    return await apiCall('DELETE', StaffEndpoints.delete(userId), null, {
      module: 'Admin Users',
      action: `Delete User ${userId}`,
    });
  },

  /**
   * Search users
   */
  searchUsers: async (query) => {
    return await apiCall('GET', `${StaffEndpoints.getAll()}?search=${query}`, null, {
      module: 'Admin Users',
      action: 'Search Users',
    });
  },

  /**
   * Get users by role
   */
  getUsersByRole: async (role) => {
    return await apiCall('GET', `${StaffEndpoints.getAll()}?role=${role}`, null, {
      module: 'Admin Users',
      action: `Get Users by Role ${role}`,
    });
  },
};

export default UsersService;

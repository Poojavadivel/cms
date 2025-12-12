/**
 * authService.js
 * Authentication service for managing user sessions and API interactions
 * 
 * This is the React equivalent of Flutter's AuthService
 */

import { Admin } from '../models/Admin';
import { Doctor } from '../models/Doctor';
import { Pharmacist } from '../models/Pharmacist';
import { Pathologist } from '../models/Pathologist';
import apiLogger from '../utils/apiLogger';
import logger from './loggerService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * AuthResult class - equivalent to Flutter's AuthResult
 */
export class AuthResult {
  constructor(user, token) {
    this.user = user;
    this.token = token;
  }
}

/**
 * Custom error class for API exceptions
 */
export class ApiException extends Error {
  constructor(message, statusCode = null) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
  }
}

/**
 * AuthService - Singleton service for authentication
 */
class AuthService {
  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }
    
    this.TOKEN_KEY = 'x-auth-token';
    this.USER_DATA_KEY = 'user_data';
    
    AuthService.instance = this;
  }

  /**
   * Get stored token from localStorage
   */
  getToken() {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      console.log('🔑 [AUTH] Retrieved token:', token ? `EXISTS (${token.substring(0, 20)}...)` : 'NULL');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Save token to localStorage
   */
  saveToken(token) {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      console.log('💾 [AUTH] Token saved:', `${token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }

  /**
   * Clear token and user data from localStorage
   */
  clearToken() {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      localStorage.removeItem('authUser'); // Also clear from AppContext storage
      console.log('🗑️ [AUTH] Token and user data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing token:', error);
      return false;
    }
  }

  /**
   * Parse user data and return appropriate model instance based on role
   */
  parseUserRole(userData) {
    const role = userData.role?.toLowerCase();

    switch (role) {
      case 'admin':
      case 'superadmin':
        return Admin.fromJSON(userData);
      case 'doctor':
        return Doctor.fromJSON(userData);
      case 'pharmacist':
        return Pharmacist.fromJSON(userData);
      case 'pathologist':
        return Pathologist.fromJSON(userData);
      default:
        throw new ApiException(`Unknown user role: ${role}`);
    }
  }

  /**
   * Make authenticated API request
   */
  async makeAuthRequest(url, options = {}) {
    const method = options.method || 'GET';
    const startTime = Date.now();
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'x-auth-token': token }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    // Log request
    apiLogger.logRequest(method, url, options.body ? JSON.parse(options.body) : null, headers);

    try {
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Log error response
        apiLogger.logResponse(method, url, response.status, data, duration);
        throw new ApiException(
          data.message || data.error || 'Request failed',
          response.status
        );
      }

      // Log successful response
      apiLogger.logResponse(method, url, response.status, data, duration);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      apiLogger.logError(method, url, error, duration);
      
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(error.message || 'Network error occurred');
    }
  }

  /**
   * Sign in user with email and password
   * Equivalent to Flutter's signIn method
   */
  async signIn(email, password) {
    try {
      logger.info('AUTH', `Login attempt for: ${email}`);
      apiLogger.logAuth('SIGN_IN_ATTEMPT', { email });
      
      const response = await this.makeAuthRequest(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const accessToken = response.accessToken;
      const userData = response.user;

      if (!accessToken || !userData) {
        throw new ApiException('Invalid response from server');
      }

      // Save token
      this.saveToken(accessToken);

      // Parse user based on role
      const user = this.parseUserRole(userData);

      console.log('✅ [AUTH] Sign in successful:', user.fullName);
      logger.authLogin(email, user.role);
      apiLogger.logAuth('SIGN_IN_SUCCESS', { user: user.fullName, role: user.role });
      
      return new AuthResult(user, accessToken);
    } catch (error) {
      console.error('❌ [AUTH] Sign in failed:', error.message);
      logger.authError(`Login failed for ${email}: ${error.message}`);
      apiLogger.logAuth('SIGN_IN_FAILED', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Validate existing token and get user data
   * Equivalent to Flutter's getUserData method
   * 
   * This is called on app startup to check if user is still logged in
   */
  async getUserData() {
    try {
      const token = this.getToken();

      if (!token) {
        console.log('⚠️ [AUTH] No token found');
        logger.warn('AUTH', 'No token found in storage');
        return null;
      }

      console.log('🔍 [AUTH] Validating token...');
      logger.info('AUTH', 'Validating stored token');
      
      const response = await this.makeAuthRequest(
        `${API_BASE_URL}/auth/validate-token`,
        {
          method: 'POST',
        }
      );

      if (!response || !response.role) {
        console.log('⚠️ [AUTH] Invalid token response');
        logger.warn('AUTH', 'Invalid token response from server');
        return null;
      }

      // Parse user based on role
      const user = this.parseUserRole(response);

      console.log('✅ [AUTH] Token validated for user:', user.fullName);
      logger.authTokenValidated(user.email || user.mobile, user.role);
      return new AuthResult(user, token);
    } catch (error) {
      console.error('❌ [AUTH] Token validation failed:', error.message);
      logger.authTokenExpired();
      // Clear invalid token
      this.clearToken();
      return null;
    }
  }

  /**
   * Sign out user
   * Equivalent to Flutter's signOut method
   */
  async signOut() {
    try {
      // Optionally call backend to invalidate token
      const token = this.getToken();
      
      if (token) {
        try {
          await this.makeAuthRequest(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
          });
        } catch (error) {
          // Continue with local logout even if backend call fails
          console.warn('Backend logout failed, continuing with local logout');
        }
      }

      logger.authLogout('User');
      this.clearToken();
      console.log('✅ [AUTH] Sign out successful');
      return true;
    } catch (error) {
      console.error('❌ [AUTH] Sign out error:', error.message);
      logger.error('AUTH', `Sign out error: ${error.message}`);
      // Clear token anyway
      this.clearToken();
      return true;
    }
  }

  /**
   * Generic GET request
   */
  async get(path) {
    return await this.makeAuthRequest(`${API_BASE_URL}${path}`, {
      method: 'GET',
    });
  }

  /**
   * Generic POST request
   */
  async post(path, body) {
    return await this.makeAuthRequest(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic PUT request
   */
  async put(path, body) {
    return await this.makeAuthRequest(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic DELETE request
   */
  async delete(path) {
    return await this.makeAuthRequest(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
    });
  }

  /**
   * Upload file with authentication
   */
  async uploadFile(path, file, additionalData = {}) {
    const token = this.getToken();
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional fields
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          ...(token && { 'x-auth-token': token }),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new ApiException(error.message || 'Upload failed', response.status);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ [AUTH] File upload failed:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;

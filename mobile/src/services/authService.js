/**
 * authService.js
 * Authentication service - Port from web authService.js
 * Uses AsyncStorage instead of localStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Admin } from '../models/Admin';
import { Doctor } from '../models/Doctor';
import { Pharmacist } from '../models/Pharmacist';
import { Pathologist } from '../models/Pathologist';
import { AuthEndpoints, API_BASE_URL } from './apiConstants';

/**
 * AuthResult class
 */
class AuthResult {
    constructor(user, token) {
        this.user = user;
        this.token = token;
    }
}

/**
 * Custom error class for API exceptions
 */
class ApiException extends Error {
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
        this.TOKEN_KEY = 'auth_token';
        this.USER_KEY = 'authUser';
        AuthService.instance = this;
    }

    /**
     * Get stored user data from AsyncStorage
     */
    async getUser() {
        try {
            const userStr = await AsyncStorage.getItem(this.USER_KEY);
            if (userStr && userStr !== 'undefined' && userStr !== 'null') {
                return JSON.parse(userStr);
            }
            return null;
        } catch (error) {
            console.error('Error getting stored user:', error);
            return null;
        }
    }

    /**
     * Get stored token from AsyncStorage
     */
    async getToken() {
        try {
            const token = await AsyncStorage.getItem(this.TOKEN_KEY);
            return token;
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    /**
     * Save token to AsyncStorage
     */
    async saveToken(token) {
        try {
            await AsyncStorage.setItem(this.TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }

    /**
     * Clear token and user data
     */
    async clearToken() {
        try {
            await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_KEY, 'selectedModule']);
        } catch (error) {
            console.error('Error clearing token:', error);
        }
    }

    /**
     * Parse user data and return appropriate model instance based on role
     */
    parseUserRole(userData) {
        if (!userData || !userData.role) return null;

        const role = userData.role.toLowerCase();
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
                console.warn('Unknown role:', role);
                return null;
        }
    }

    /**
     * Make authenticated API request
     */
    async makeAuthRequest(url, options = {}) {
        const token = await this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['x-auth-token'] = token;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                await this.clearToken();
                throw new ApiException('Session expired. Please login again.', 401);
            }

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const errorMessage = typeof data === 'object' ? (data.message || data.error || 'Request failed') : 'Request failed';
                throw new ApiException(errorMessage, response.status);
            }

            return data;
        } catch (error) {
            if (error instanceof ApiException) throw error;
            if (error.message === 'Network request failed') {
                throw new ApiException('No internet connection. Please check your network.');
            }
            throw new ApiException(error.message || 'An unexpected error occurred');
        }
    }

    /**
     * Sign in user with email and password
     */
    async signIn(email, password) {
        try {
            const response = await fetch(AuthEndpoints.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new ApiException(data.message || 'Login failed', response.status);
            }

            const token = data.accessToken || data.token;
            const userData = data.user;

            if (!token || !userData) {
                throw new ApiException('Invalid response from server');
            }

            // Save token
            await this.saveToken(token);

            // Parse user based on role
            const user = this.parseUserRole(userData);
            if (!user) {
                throw new ApiException('Unknown user role');
            }

            // Save user data
            await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user.toJSON()));

            return new AuthResult(user, token);
        } catch (error) {
            if (error instanceof ApiException) throw error;
            throw new ApiException(error.message || 'Login failed');
        }
    }

    /**
     * Change user password
     */
    async changePassword(currentPassword, newPassword) {
        return this.makeAuthRequest(AuthEndpoints.changePassword, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    /**
     * Validate existing token and get user data
     */
    async getUserData() {
        try {
            const token = await this.getToken();
            if (!token) return null;

            const data = await this.makeAuthRequest(AuthEndpoints.validateToken);

            const userData = (data && data.user) ? data.user : data;

            if (userData && userData.role) {
                const user = this.parseUserRole(userData);
                if (user) {
                    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user.toJSON()));
                }
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error validating token:', error);
            await this.clearToken();
            return null;
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            const token = await this.getToken();
            if (token) {
                await fetch(AuthEndpoints.logout, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }).catch(() => { });
            }
        } finally {
            await this.clearToken();
        }
    }

    // Generic HTTP methods
    async get(path) {
        const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
        return this.makeAuthRequest(url, { method: 'GET' });
    }

    async post(path, body) {
        const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
        return this.makeAuthRequest(url, { method: 'POST', body: JSON.stringify(body) });
    }

    async put(path, body) {
        const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
        return this.makeAuthRequest(url, { method: 'PUT', body: JSON.stringify(body) });
    }

    async patch(path, body) {
        const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
        return this.makeAuthRequest(url, { method: 'PATCH', body: JSON.stringify(body) });
    }

    async delete(path) {
        const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
        return this.makeAuthRequest(url, { method: 'DELETE' });
    }
}

// Export singleton instance
const authService = new AuthService();
export default authService;

/**
 * apiService.js — Centralized API layer for HMS
 * - Single Axios instance
 * - Request interceptor: auto-attach auth token
 * - Response interceptor: handle 401/404/500 gracefully
 * - Exports: apiGet, apiPost, apiPut, apiDelete
 */

import axios from 'axios';

// ─── Token Helper ────────────────────────────────────────────────────────────
const getAuthToken = () =>
    localStorage.getItem('auth_token') ||
    localStorage.getItem('x-auth-token') ||
    localStorage.getItem('authToken');

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            config.headers['x-auth-token'] = token; // legacy support
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        if (status === 401) {
            // Session expired — clear storage and redirect
            localStorage.clear();
            window.location.href = '/login';
        }

        if (status === 403) {
            // Forbidden — clear credentials and redirect with message
            console.warn('🚫 [API] 403 Forbidden — access denied. Clearing session.');
            localStorage.clear();
            window.location.href = '/login?reason=access_denied';
        }

        // Normalize the error so callers always get a clean object
        const normalizedError = {
            status: status || 0,
            message:
                status === 403
                    ? 'Access Denied. Please log in again.'
                    : status === 404
                        ? 'Resource not found (404)'
                        : status === 500
                            ? 'Server error. Please try again later.'
                            : message || 'An unexpected error occurred.',
            raw: error,
        };

        return Promise.reject(normalizedError);
    }
);

// ─── Exported Helpers ─────────────────────────────────────────────────────────

/** GET /endpoint — returns response.data */
export const apiGet = async (endpoint, params = {}) => {
    const response = await api.get(endpoint, { params });
    return response.data;
};

/** POST /endpoint with body — returns response.data */
export const apiPost = async (endpoint, body = {}) => {
    const response = await api.post(endpoint, body);
    return response.data;
};

/** PUT /endpoint with body — returns response.data */
export const apiPut = async (endpoint, body = {}) => {
    const response = await api.put(endpoint, body);
    return response.data;
};

/** DELETE /endpoint — returns response.data */
export const apiDelete = async (endpoint) => {
    const response = await api.delete(endpoint);
    return response.data;
};

/** Multipart form-data POST (for file uploads) */
export const apiUpload = async (endpoint, formData) => {
    const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export default api;

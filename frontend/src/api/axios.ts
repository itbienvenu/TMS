import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
    // baseURL: import.meta.env.VITE_API_URL || 'http://3.12.248.83:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

import { encryptPayload } from '../utils/security';

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        let token = null;
        try {
            token = localStorage.getItem('access_token');
        } catch (error) {
            console.warn("Could not read token from storage", error);
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Encrypt body
        if (config.data && !(config.data instanceof FormData) && config.method !== 'get') {
            try {
                // If already encrypted or empty, skip
                // We wrap the original body
                const encrypted = encryptPayload(config.data);
                config.data = { encrypted_data: encrypted };
                config.headers['X-Encrypted-Body'] = 'true';
            } catch (e) {
                console.error("Encryption error", e);
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            try {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
            } catch (e) { /* ignore */ }
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

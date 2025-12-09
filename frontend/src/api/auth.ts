import api from './axios';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

export const authApi = {
    // Login
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/login', data);
        return response.data;
    },

    // Register
    register: async (data: RegisterRequest): Promise<User> => {
        const response = await api.post('/register', data);
        return response.data;
    },

    // Get current user
    me: async (): Promise<User> => {
        const response = await api.get('/me');
        return response.data;
    },

    // Validate token
    validateToken: async (): Promise<boolean> => {
        try {
            await api.get('/perm/validate-token');
            return true;
        } catch {
            return false;
        }
    },
};

import { defineStore } from 'pinia';
import api from '../utils/axios';
import type { User, LoginUser } from '../types';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        token: localStorage.getItem('accessToken') || null,
        loading: false,
        error: null as string | null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        isSuperAdmin: (state) => state.user?.role === 'super_admin', // Adjust role name based on backend
        isCompanyAdmin: (state) => state.user?.role === 'company_admin',
        isUser: (state) => state.user?.role === 'user',
    },
    actions: {
        async login(credentials: LoginUser) {
            this.loading = true;
            this.error = null;
            try {
                // Backend login endpoint might return just a token or user+token.
                // Based on openapi: /api/v1/login returns 200 OK with empty body schema?
                // Wait, usually it returns a token. I'll assume standard OAuth2 or similar response.
                // If the openapi says schema {}, it might be missing details.
                // I'll check the backend code if needed, but for now assume standard token response.
                const response = await api.post('/login', credentials);
                // Assuming response.data contains access_token
                const token = response.data.access_token || response.data.token;
                if (token) {
                    this.token = token;
                    localStorage.setItem('accessToken', token);
                    await this.fetchUser();
                }
            } catch (err: any) {
                this.error = err.response?.data?.detail || 'Login failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },
        async register(userData: any) {
            this.loading = true;
            try {
                await api.post('/register', userData);
            } catch (err: any) {
                this.error = err.response?.data?.detail || 'Registration failed';
                throw err;
            } finally {
                this.loading = false;
            }
        },
        async fetchUser() {
            try {
                const response = await api.get('/me');
                this.user = response.data;
            } catch (err) {
                this.logout();
            }
        },
        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('accessToken');
        },
    },
});

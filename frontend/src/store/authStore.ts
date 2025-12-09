import { create } from 'zustand';
import api from '../lib/api';

interface User {
    id: string;
    email: string;
    full_name: string;
    phone_number: string;
    user_type: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null, // Initialize null, check in strict safe way if needed or verify in checkAuth only
    isAuthenticated: false,
    isLoading: false,

    login: (token, user) => {
        try {
            localStorage.setItem('access_token', token);
        } catch (e) {
            console.error("Storage access denied", e);
        }
        set({ token, user, isAuthenticated: true });
    },

    logout: () => {
        try {
            localStorage.removeItem('access_token');
        } catch (e) {
            console.error("Storage access denied", e);
        }
        set({ token: null, user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        let token = null;
        try {
            token = localStorage.getItem('access_token');
        } catch (e) {
            console.error("Storage access denied", e);
            // If we can't read storage, we assume not logged in or handle gracefully
        }

        if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
        }

        set({ isLoading: true });
        try {
            const response = await api.get('/me');
            set({ user: response.data, isAuthenticated: true });
        } catch (error) {
            console.error("Auth check failed", error);
            try {
                localStorage.removeItem('access_token');
            } catch (e) { /* ignore */ }
            set({ token: null, user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },
}));

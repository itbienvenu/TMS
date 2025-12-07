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
    token: localStorage.getItem('access_token'),
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,

    login: (token, user) => {
        localStorage.setItem('access_token', token);
        set({ token, user, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('access_token');
        set({ token: null, user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('access_token');
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
            localStorage.removeItem('access_token');
            set({ token: null, user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },
}));

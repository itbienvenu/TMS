
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

interface AuthContextType {
    isAuthenticated: boolean;
    user: any | null;
    login: (email: string) => Promise<any>;
    verifyOtp: (email: string, code: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('super_admin_token');
            if (token) {
                try {
                    const response = await api.get('/companies/me');
                    setUser(response.data);

                    // Check if user has super_admin role
                    const roles = response.data.roles || [];
                    const isSuperAdmin = roles.some((r: any) => r.name === 'super_admin');

                    if (isSuperAdmin) {
                        setIsAuthenticated(true);
                    } else {
                        // Not super admin, force logout
                        logout();
                    }
                } catch (error) {
                    console.error("Auth check failed", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (_email: string) => {
        // Current flow:
        // 1. Enter email/password (username/password) -> Get 200 OK (OTP Sent)
        // 2. We skip password here? No, backend needs password.
        // Let's adjust this to take password too.
        throw new Error("Method not implemented correctly. See Login Component");
    };

    const verifyOtp = async (_email: string, _code: string) => {
        // Handled in component or we can verify here
    };

    const logout = () => {
        localStorage.removeItem('super_admin_token');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, verifyOtp, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

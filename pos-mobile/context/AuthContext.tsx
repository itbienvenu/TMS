import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

type AuthType = {
    token: string | null;
    driverInfo: any | null;
    isLoading: boolean;
    login: (token: string, info: any) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthType>({
    token: null,
    driverInfo: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [driverInfo, setDriverInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('driver_token');
                const storedInfo = await SecureStore.getItemAsync('driver_info');
                if (storedToken) {
                    setToken(storedToken);
                    if (storedInfo) setDriverInfo(JSON.parse(storedInfo));
                }
            } catch (e) {
                console.error("Failed to load token", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadToken();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(tabs)';

        if (!token && inAuthGroup) {
            router.replace('/login');
        } else if (token && !inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [token, segments, isLoading]);

    const login = async (newToken: string, info: any) => {
        await SecureStore.setItemAsync('driver_token', newToken);
        await SecureStore.setItemAsync('driver_info', JSON.stringify(info));
        setToken(newToken);
        setDriverInfo(info);
        router.replace('/(tabs)');
    };

    const logout = async () => {
        // try {
        //     // Stop background tracking if active
        //     const { stopLocationTracking } = require('../services/LocationService');
        //     await stopLocationTracking();
        // } catch (e) { console.error(e); }

        await SecureStore.deleteItemAsync('driver_token');
        await SecureStore.deleteItemAsync('driver_info');
        await SecureStore.deleteItemAsync('current_bus_id'); // Clear bus context
        setToken(null);
        setDriverInfo(null);
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ token, driverInfo, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

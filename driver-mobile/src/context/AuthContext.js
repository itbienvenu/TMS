import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginDriver } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [splashLoading, setSplashLoading] = useState(false);

    useEffect(() => {
        isLoggedIn();
    }, []);

    const isLoggedIn = async () => {
        try {
            setSplashLoading(true);
            const userInfo = await SecureStore.getItemAsync('user_info');
            const token = await SecureStore.getItemAsync('access_token');

            if (userInfo && token) {
                setUser(JSON.parse(userInfo));
            }
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
        } finally {
            setSplashLoading(false);
        }
    };

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const data = await loginDriver(email, password);
            const userData = {
                name: data.driver_name,
                bus_id: data.bus_id,
                user_type: data.user_type
            };

            setUser(userData);
            await SecureStore.setItemAsync('access_token', data.access_token);
            await SecureStore.setItemAsync('user_info', JSON.stringify(userData));
        } catch (e) {
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUser(null);
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('user_info');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{
            isLoading,
            user,
            splashLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

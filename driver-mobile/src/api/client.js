import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// REPLACE WITH YOUR COMPUTER'S LOCAL IP ADDRESS IF RUNNING ON REAL DEVICE
// For Android Emulator, use 'http://10.0.2.2:8000/api/v1'
// For iOS Simulator, use 'http://localhost:8000/api/v1'
const API_URL = 'http://172.31.252.59:8000/api/v1';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;

export const SERVER_IP = '172.31.82.11'; // Your machine's local IP
export const API_BASE_URL = `http://${SERVER_IP}`;

export const ENDPOINTS = {
    AUTH: `${API_BASE_URL}:8001`,
    COMPANY: `${API_BASE_URL}:8003`,
    QR: `${API_BASE_URL}:8005`
};

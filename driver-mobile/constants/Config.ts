export const SERVER_IP = '3.12.248.83';
export const GATEWAY_PORT = '8000';
export const API_BASE_URL = `http://${SERVER_IP}:${GATEWAY_PORT}/api/v1`;

export const ENDPOINTS = {
    AUTH: `${API_BASE_URL}/auth`,
    COMPANY: `${API_BASE_URL}`, // Company routes are directly under /api/v1/ e.g. /api/v1/drivers
    QR: `${API_BASE_URL}/qr`
};

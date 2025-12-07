import client from './client';

export const loginDriver = async (email, password) => {
    try {
        const response = await client.post('/drivers/login', { email, password });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { detail: 'Network Error' };
    }
};

export const verifyTicketQr = async (qrToken) => {
    try {
        const response = await client.post('/tickets/verify-qr', { qr_token: qrToken });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { detail: 'Verification Failed' };
    }
};

import api from './axios';
import type { Payment, PaymentCreate } from '../types';

export const paymentsApi = {
    // Process mock payment
    processMock: async (data: PaymentCreate): Promise<Payment> => {
        const response = await api.post('/payments/mock', data);
        return response.data;
    },

    // Alias for compatibility
    create: async (data: PaymentCreate): Promise<Payment> => {
        const response = await api.post('/payments/mock', data);
        return response.data;
    },

    // Mock getMyPayments for compatibility (returns empty list or generic)
    // To truly implement this, backend needs GET /api/v1/payments/my-payments endpoint.
    // For now, return empty array to satisfy TS if we don't change PaymentPage logic immediately.
    // BUT better to change PaymentPage logic.
    getMyPayments: async (): Promise<Payment[]> => {
        // This is a placeholder. 
        return [];
    }
};

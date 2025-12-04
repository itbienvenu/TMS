import api from './axios';

export interface Payment {
    id: string;
    ticket_id: string;
    user_id: string;
    phone_number: string;
    amount: number;
    provider: string;
    status: 'pending' | 'success' | 'failed';
}

export interface PaymentCreate {
    ticket_id: string;
    phone_number: string;
    provider: 'momo' | 'tigocash';
}

export const paymentsApi = {
    // Initiate payment
    create: async (data: PaymentCreate): Promise<Payment> => {
        const response = await api.post('/payments/', data);
        return response.data;
    },

    // Get payment by ID
    getById: async (id: string): Promise<Payment> => {
        const response = await api.get(`/payments/${id}`);
        return response.data;
    },

    // Get my payments
    getMyPayments: async (): Promise<Payment[]> => {
        const response = await api.get('/payments/');
        return response.data;
    },
};


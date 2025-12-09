import api from './axios';
import type { Ticket, TicketCreate } from '../types';

export const ticketsApi = {
    // Get all tickets (admin)
    getAll: async (): Promise<Ticket[]> => {
        const response = await api.get('/tickets/');
        return response.data;
    },

    // Get my tickets
    getMyTickets: async (): Promise<Ticket[]> => {
        const response = await api.get('/tickets/my-tickets/');
        return response.data;
    },

    // Get single ticket
    getById: async (id: string): Promise<Ticket> => {
        const response = await api.get(`/tickets/${id}`);
        return response.data;
    },

    // Create ticket
    create: async (data: TicketCreate): Promise<Ticket> => {
        const response = await api.post('/tickets/', data);
        return response.data;
    },

    // Update ticket status
    updateStatus: async (id: string, status: string): Promise<Ticket> => {
        const response = await api.patch(`/tickets/${id}/status?new_status=${status}`);
        return response.data;
    },

    // Soft delete ticket
    delete: async (id: string): Promise<void> => {
        await api.put(`/tickets/${id}`);
    },

    // Admin delete ticket (permanent)
    adminDelete: async (id: string): Promise<void> => {
        await api.delete(`/tickets/admin_delete/${id}`);
    },
};

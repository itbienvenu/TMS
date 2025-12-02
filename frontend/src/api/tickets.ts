import api from '../utils/axios';
import type { TicketCreate } from '../types';

export default {
    getAll() {
        return api.get('/tickets/');
    },
    getMyTickets() {
        return api.get('/tickets/my-tickets/');
    },
    get(id: string) {
        return api.get(`/tickets/${id}`);
    },
    create(data: TicketCreate) {
        return api.post('/tickets/', data);
    },
    cancel(id: string) {
        return api.put(`/tickets/${id}`);
    },
    updateStatus(id: string, status: string) {
        return api.patch(`/tickets/${id}/status`, null, { params: { new_status: status } });
    },
    adminDelete(id: string) {
        return api.delete(`/tickets/admin_delete/${id}`);
    }
};

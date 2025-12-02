import api from '../utils/axios';
import type { RouteCreate, Route } from '../types';

export default {
    getAll() {
        return api.get('/routes/');
    },
    get(id: string) {
        return api.get(`/routes/${id}`);
    },
    create(data: RouteCreate) {
        return api.post('/routes/register', data);
    },
    update(id: string, data: Partial<Route>) {
        return api.put(`/routes/${id}`, data);
    },
    delete(id: string) {
        return api.delete(`/routes/${id}`);
    },
    assignBus(data: { route_id: string; bus_id: string }) {
        return api.post('/routes/assign-bus', data);
    }
};

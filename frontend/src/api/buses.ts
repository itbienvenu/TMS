import api from '../utils/axios';
import type { BusCreate, Bus } from '../types';

export default {
    getAll() {
        return api.get('/buses/');
    },
    getByRoute(routeId: string) {
        return api.get(`/buses/by-route/${routeId}`);
    },
    create(data: BusCreate) {
        return api.post('/buses/', data);
    },
    update(id: string, data: Partial<Bus>) {
        return api.patch(`/buses/${id}`, data);
    },
    delete(id: string) {
        return api.delete(`/buses/${id}`);
    },
    getUserBuses() {
        return api.get('/buses/user_get_buses');
    }
};

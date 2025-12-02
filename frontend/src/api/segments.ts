import api from '../utils/axios';
import type { RouteSegment } from '../types';

export default {
    getAll(routeId?: string) {
        return api.get('/route_segments/', { params: { route_id: routeId } });
    },
    get(id: string) {
        return api.get(`/route_segments/${id}`);
    },
    create(data: any) {
        return api.post('/route_segments/', data);
    },
    update(id: string, data: any) {
        return api.put(`/route_segments/${id}`, data);
    },
    delete(id: string) {
        return api.delete(`/route_segments/${id}`);
    }
};

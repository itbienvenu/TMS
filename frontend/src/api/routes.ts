import api from './axios';
import type { Route } from '../types';

export const routesApi = {
    // Get all routes
    getAll: async (): Promise<Route[]> => {
        const response = await api.get('/routes/');
        return response.data;
    },

    // Get single route
    getById: async (id: string): Promise<Route> => {
        const response = await api.get(`/routes/${id}`);
        return response.data;
    },

    // Create route
    create: async (data: {
        origin_id: string;
        destination_id: string;
        price: number;
        company_id?: string;
    }): Promise<Route> => {
        const response = await api.post('/routes/register', data);
        return response.data;
    },

    // Update route
    update: async (id: string, data: Partial<Route>): Promise<Route> => {
        const response = await api.put(`/routes/${id}`, data);
        return response.data;
    },

    // Delete route
    delete: async (id: string): Promise<void> => {
        await api.delete(`/routes/${id}`);
    },

    // Assign bus to route
    assignBus: async (routeId: string, busId: string): Promise<void> => {
        await api.post('/routes/assign-bus', { route_id: routeId, bus_id: busId });
    },
};

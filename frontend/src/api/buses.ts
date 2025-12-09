import api from './axios';
import type { Bus, BusWithCompany } from '../types';

export const busesApi = {
    // Get all buses for company
    getAll: async (): Promise<Bus[]> => {
        const response = await api.get('/buses/');
        return response.data;
    },

    // Get all buses (public view with company info)
    getAllPublic: async (): Promise<BusWithCompany[]> => {
        const response = await api.get('/buses/user_get_buses');
        return response.data;
    },

    // Get buses by route
    getByRoute: async (routeId: string): Promise<Bus[]> => {
        const response = await api.get(`/buses/by-route/${routeId}`);
        return response.data;
    },

    // Create bus
    create: async (data: { plate_number: string; capacity: number; route_ids?: string[] }): Promise<Bus> => {
        const response = await api.post('/buses/', data);
        return response.data;
    },

    // Update bus
    update: async (id: string, data: Partial<Bus>): Promise<Bus> => {
        const response = await api.patch(`/buses/${id}`, data);
        return response.data;
    },

    // Delete bus
    delete: async (id: string): Promise<void> => {
        await api.delete(`/buses/${id}`);
    },
};
